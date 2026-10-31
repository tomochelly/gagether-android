#!/usr/bin/env python3
"""Public roster collector for Python 3.11+. No dependencies or ingest writes.
An optional job read token is confined to the exact HTTPS GitHub API host.
A game is ingest-eligible only after every required public source was freshly checked.
Run: python collect_rosters.py --workdir .roster-cache --games holodreams
"""
from __future__ import annotations
import argparse, concurrent.futures, datetime, hashlib, html, json, os, re, sys, time
import urllib.error, urllib.request
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from asset_policy import classify_image

HERE=Path(__file__).resolve().parent
ANNOUNCEMENTS=HERE.parents[2]/'content/character-rosters/announcements.json'
LOCALES=('ko','en','ja','zh')
RAW='https://raw.githubusercontent.com/'
GAMES=('genshin','hsr','zzz','arknights','nikke','nte','trickcal','reverse1999','limbus','stellasora','gfl2','holodreams','dna')
PY_URLS={'nikke':'nikke/characters/','nte':'neverness-to-everness/characters/','trickcal':'trickcal/characters/','reverse1999':'re1999/characters/','limbus':'limbus-company/identities/','zzz':'zenless/characters/','hsr':'star-rail/characters/'}
NOW=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')

class SourceError(Exception):pass
@dataclass(frozen=True)
class Source:
    key:str
    url:str
    kind:str='json'
    minimum:int=1
    optional:bool=False

def source_specs(game):
    if game=='genshin':
        u='https://genshin-db-api.vercel.app/api/v5/characters?query=names&matchCategories=true&verboseCategories=true'
        return [Source('en',u,minimum=90)]+[Source(l,u+'&resultLanguage='+v,minimum=90)for l,v in [('ko','Korean'),('ja','Japanese'),('zh','ChineseSimplified')]]+[Source('art', 'https://api.github.com/repos/ScobbleQ/HoYo-Assets/git/trees/main?recursive=1','tree',90,optional=True)]
    if game=='hsr':return [Source(l,RAW+'Mar-7th/StarRailRes/master/index_new/'+v+'/characters.json',minimum=70)for l,v in [('en','en'),('ko','kr'),('ja','jp'),('zh','cn')]]+[Source('info',RAW+'Mar-7th/StarRailRes/master/info.json'),Source('release','https://www.prydwen.gg/'+PY_URLS[game],'py:characters',70)]
    if game=='zzz':return [Source('avatars',RAW+'EnkaNetwork/API-docs/master/store/zzz/avatars.json',minimum=40),Source('locs',RAW+'EnkaNetwork/API-docs/master/store/zzz/locs.json',minimum=4),Source('release','https://www.prydwen.gg/'+PY_URLS[game],'py:characters',40)]
    if game=='arknights':return [Source(l,RAW+'ArknightsAssets/ArknightsGamedata/master/'+v+'/gamedata/excel/character_table.json',minimum=600)for l,v in [('en','en'),('ko','kr'),('ja','jp'),('zh','cn')]]+[Source('patch_'+l,RAW+'ArknightsAssets/ArknightsGamedata/master/'+v+'/gamedata/excel/char_patch_table.json',minimum=3)for l,v in [('en','en'),('ko','kr'),('ja','jp'),('zh','cn')]]+[Source('art','https://api.github.com/repos/Aceship/Arknight-Images/git/trees/main?recursive=1','tree',1000,optional=True)]
    if game in PY_URLS:return [Source('characters','https://www.prydwen.gg/'+PY_URLS[game],'py:'+('allIdentities'if game=='limbus'else'characters'),{'nikke':150,'nte':15,'trickcal':80,'reverse1999':80,'limbus':120}[game])]
    if game=='stellasora':
        b=RAW+'JforPlay/sstoy/main/public/data/'
        return [Source('characters',b+'Character.json',minimum=30)]+[Source(l,b+v+'/Character.json',minimum=30)for l,v in [('en','EN'),('ko','KR'),('ja','JP'),('zh','CN')]]+[Source('art','https://api.github.com/repos/JforPlay/sstoy/git/trees/main?recursive=1','tree',1000,optional=True)]
    if game=='gfl2':return [Source('characters','https://gfl2.help/en/characters','gfl2',40)]
    if game=='holodreams':return [Source('en','https://hololive-dreams.com/en/','holo',40),Source('ja','https://hololive-dreams.com/','holo',40)]
    if game=='dna':return [Source(l,'https://duetnightabyss.th.gl/'+v+'db/characters','dna',20)for l,v in [('en',''),('ko','ko/'),('ja','ja/'),('zh','zh-CN/')]]
    raise ValueError('Unknown game '+game)

def next_flight(s):
    chunks=[]
    for m in re.finditer(r'self\.__next_f\.push\((\[.*?\])\)</script>',s):
        try:
            part=json.loads(m[1])
            if len(part)>1 and isinstance(part[1],str):chunks.append(part[1])
        except (ValueError,TypeError):continue
    if not chunks:raise SourceError('HTTP200 but missing public Next Flight payload (possible JS-only/error page)')
    return ''.join(chunks)
def json_field(s,key):
    m=re.search(r'"'+re.escape(key)+r'":([\[{])',s)
    if not m:raise SourceError('Missing expected public field '+key)
    try:return json.JSONDecoder().raw_decode(s[m.end()-1:])[0]
    except ValueError as e:raise SourceError('Invalid/truncated public field '+key)from e

class HoloParser(HTMLParser):
    def __init__(self):super().__init__();self.rows={};self.current=None;self.locale=''
    def handle_starttag(self,t,attrs):
        d=dict(attrs)
        if t=='html':self.locale=d.get('lang','')
        if t=='button'and'Holomem__item'in d.get('class',''):
            self.current=d['data-holomem-id'];self.rows[self.current]={'id':self.current,'group':d.get('data-holomem-group','')}
        if t=='img'and self.current:self.rows[self.current].update(name=d.get('alt',''),thumbnailUrl=d.get('src',''))
        if t=='img'and d.get('id','').startswith('HolomemDialog__img-'):
            key=d['id'][len('HolomemDialog__img-'):]
            self.rows.setdefault(key,{'id':key}).update(name=d.get('alt',''),fullArtUrl=d.get('data-src',''),width=d.get('width'),height=d.get('height'))
    def handle_endtag(self,t):
        if t=='button':self.current=None

def parse_gfl(s):
    m=re.search(r'<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)</script>',s,re.S)
    if not m:raise SourceError('HTTP200 but missing public Nuxt data')
    flat=json.loads(m[1]);cache={};active=set()
    def unpack(i):
        if not isinstance(i,int)or i<0:return None
        if i in cache:return cache[i]
        if i in active:raise SourceError('Unsupported circular Nuxt data')
        if i>=len(flat):raise SourceError('Invalid Nuxt reference')
        active.add(i);x=flat[i]
        if isinstance(x,dict):value={k:unpack(v)for k,v in x.items()}
        elif isinstance(x,list):
            value=unpack(x[1])if x and isinstance(x[0],str)and x[0]in['ShallowReactive','Reactive','Ref','ShallowRef']else[unpack(v)for v in x]
        else:value=x
        active.remove(i);cache[i]=value;return value
    # Only unpack the requested source-data branch, not auth/state or unrelated graphs.
    root=flat[1];data=flat[root['data']]
    if isinstance(data,list):data=flat[data[1]]
    current=unpack(data['characters-en'])
    rows=current['characters'];images={}
    for m in re.finditer(r'<a[^>]*href="([^\"]*/characters/[^\"]+)"[^>]*>(.*?)</a>',s,re.S):
        im=re.search(r'<img[^>]*src="([^\"]*?/chara/full/[^\"]+)"',m[2])
        if im:images[html.unescape(m[1]).rsplit('/',1)[-1]]=html.unescape(im[1])
    return {'rows':rows,'images':images}

def decode_source(spec,body):
    try:
        if spec.kind in ('json','tree'):value=json.loads(body)
        else:
            s=body.decode('utf-8')
            if spec.kind.startswith('py:'):value=json_field(next_flight(s),spec.kind.split(':')[1])
            elif spec.kind=='dna':value=json_field(next_flight(s),'packed')
            elif spec.kind=='gfl2':value=parse_gfl(s)
            elif spec.kind=='holo':
                parser=HoloParser();parser.feed(s);value={'locale':parser.locale,'rows':list(parser.rows.values())}
            else:raise SourceError('Unsupported source kind')
        if spec.kind=='tree':
            if not isinstance(value,dict)or value.get('truncated')is not False:raise SourceError('GitHub tree missing explicit truncated:false; refusing partial tree')
            rows=value.get('tree',[])
            if not isinstance(rows,list)or any(not isinstance(x,dict)or not isinstance(x.get('path'),str)for x in rows):raise SourceError('Invalid tree entries')
        elif spec.kind in ('holo','gfl2'):rows=value['rows']
        elif spec.kind=='dna':rows=value['items']
        else:rows=value
        if not isinstance(rows,(dict,list))or len(rows)<spec.minimum:raise SourceError(f'Unexpected/empty source shape: expected >= {spec.minimum} records')
        return value
    except (ValueError,KeyError,TypeError,IndexError,UnicodeError,RecursionError)as e:raise SourceError('Invalid source shape: '+str(e))from e

class NoCredentialRedirect(urllib.request.HTTPRedirectHandler):
    # A job read token may never follow a redirect, even to another GitHub URL.
    def redirect_request(self,*args,**kwargs):return None
github_opener=urllib.request.build_opener(NoCredentialRedirect)

def github_read_headers(url):
    parsed=urlsplit(url);token=os.environ.get('GAGETHER_GITHUB_READ_TOKEN')
    return {'Authorization':'Bearer '+token}if token and parsed.scheme=='https'and parsed.netloc=='api.github.com'else{}

class Fetcher:
    def __init__(self,root,timeout=25,retries=2):self.root=root;self.timeout=timeout;self.retries=retries
    def fetch(self,game,spec):
        directory=self.root/'sources'/game;directory.mkdir(parents=True,exist_ok=True)
        target=directory/(spec.key+'.body');meta_file=directory/(spec.key+'.meta.json')
        old=read_json(meta_file,{})
        headers={'Accept':'application/json,text/html;q=0.9,*/*;q=0.8','User-Agent':'GagetherPublicRosterCollector/1.0'}
        headers.update(github_read_headers(spec.url))
        if target.exists()and old.get('url')==spec.url:
            if old.get('etag'):headers['If-None-Match']=old['etag']
            if old.get('lastModified'):headers['If-Modified-Since']=old['lastModified']
        attempts=[]
        for attempt in range(self.retries+1):
            try:
                # Only credential-bearing exact-host API requests use this opener.
                # Neither cache metadata nor receipts contain request headers.
                open_url=github_opener.open if 'Authorization'in headers else urllib.request.urlopen
                response=open_url(urllib.request.Request(spec.url,headers=headers),timeout=self.timeout)
                limit=24_000_000;body=response.read(limit+1)
                if len(body)>limit:raise SourceError('Source exceeded24MB cap; possible oversized/truncated payload')
                value=decode_source(spec,body) # Validate before last-good cache replacement.
                digest=hashlib.sha256(body).hexdigest();state='changed'if old.get('sha256')!=digest else'unchanged'
                metadata={'url':spec.url,'checkedAt':NOW(),'httpStatus':response.status,'status':state,'sha256':digest,'etag':response.headers.get('ETag'),'lastModified':response.headers.get('Last-Modified'),'bytes':len(body)}
                if state=='changed'or not target.exists():atomic_bytes(target,body)
                atomic_json(meta_file,metadata)
                return value,{'key':spec.key,**metadata}
            except urllib.error.HTTPError as e:
                if e.code==304 and target.exists():
                    value=decode_source(spec,target.read_bytes());metadata={**old,'checkedAt':NOW(),'status':'not-modified','httpStatus':304};atomic_json(meta_file,metadata);return value,{'key':spec.key,**metadata}
                attempts.append('HTTP'+str(e.code))
                if e.code not in (408,429,500,502,503,504)or attempt==self.retries:raise SourceError(f'{spec.key} {spec.url}: HTTP{e.code} ({"blocked"if e.code==403 else"rate-limited"if e.code==429 else"fetch-failed"})')from e
                retry=e.headers.get('Retry-After','');delay=min(15,int(retry))if retry.isdigit()else min(8,2**attempt);time.sleep(delay)
            except SourceError as e:
                raise SourceError(spec.key+' '+spec.url+': '+str(e))from e
            except (urllib.error.URLError,TimeoutError,ConnectionError)as e:
                attempts.append(str(e))
                if attempt==self.retries:raise SourceError(spec.key+' fetch failed: '+str(e))from e
                time.sleep(min(8,2**attempt))
        raise SourceError('; '.join(attempts))

def read_json(path,default=None):
    try:return json.loads(path.read_text())
    except (FileNotFoundError,ValueError):return default

def atomic_bytes(path,data):
    path.parent.mkdir(parents=True,exist_ok=True);tmp=path.with_name(path.name+'.tmp');tmp.write_bytes(data);tmp.replace(path)
def atomic_json(path,value):atomic_bytes(path,(json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode())
def names(**kw):return {l:str(kw.get(l)or'')for l in LOCALES}
def trait(key,value,label=None):return {'id':key,'label':names(en=label or key.title()),'value':names(**value)if isinstance(value,dict)else names(en=value)}
def image(url,kind,source,**kwargs):
    if not isinstance(url,str)or not url.startswith(('https://','http://')):return None
    return classify_image({'url':url,'kind':kind,'sourceUrl':source,**kwargs})
def row(key,names_,source,regions=None,official=False):
    r={'id':str(key),'name':names_,'sourceUrl':source,'sourceKind':'official'if official else'community'}
    if regions:r['regions']=regions
    return r
def require_fields(obj,fields,context):
    if not isinstance(obj,dict)or any(k not in obj for k in fields):raise SourceError(context+' missing required fields '+','.join(fields))
def assetpaths(d):return {x['path']for x in d['tree']}
def native_names(d,key):return names(**{l:d[l].get(key,{}).get('name','')for l in LOCALES})
def reviewed_announcements():
    # The code mirror intentionally excludes private roster snapshots and may
    # omit this optional preview allowlist. Its absence authorizes no previews;
    # it must not stop the independently verified released roster.
    if not ANNOUNCEMENTS.exists():return []
    registry=read_json(ANNOUNCEMENTS)
    if not isinstance(registry,dict)or registry.get('version')!=1 or not isinstance(registry.get('characters'),list)or len(registry['characters'])>100:raise SourceError('Checked character announcement registry invalid')
    return registry['characters']
def reviewed_zzz_announcement(rules,key,native,localized,provider):
    if not provider or not all(localized.values()):return None
    # Provider unit IDs are not native client IDs. Require every reviewed exact
    # identity and confirmed attribute; a similarly named outfit is not a match.
    return next((r for r in rules if r.get('gameId')=='zzz'and r.get('nativeId')==str(key)
        and r.get('nativeNameKey')==native.get('Name')and r.get('name')==localized['en']==provider.get('name')
        and r.get('providerId')==provider.get('id')and r.get('providerUnitId')==str(provider.get('unitId'))
        and r.get('providerSlug')==provider.get('slug')and r.get('rarity')==native.get('Rarity')
        and r.get('rarityLabel')==provider.get('rarity')and r.get('specialty')==native.get('ProfessionType')
        and r.get('elements')==native.get('ElementTypes')and provider.get('element')in r.get('elements',[])),None)
def normalize(game,d):
    urls={s.key:s.url for s in source_specs(game)};rows=[];source_count=0;version=None;announcement_urls=[];note='Source catalog membership does not establish current pickup or an exact release date.'
    if game=='genshin':
        by={l:{c['id']:c for c in d[l]}for l in LOCALES}
        if any(set(by[l])!=set(by['en'])for l in LOCALES):raise SourceError('Native character ID sets differ; refusing partial language overwrite')
        paths=assetpaths(d['art']);source_count=len(d['en']);version=max((c.get('version','0')for c in d['en']),key=lambda v:tuple(int(x)for x in v.split('.')))
        for c in d['en']:
            require_fields(c,['id','name','rarity','elementText','weaponText'],'Genshin character');key=c['id'];u='https://github.com/theBowja/genshin-db';r=row(key,native_names(by,key),u);r['rarity']=int(c['rarity']);r['traits']=[trait(k,{l:by[l][key][f]for l in LOCALES})for k,f in [('element','elementText'),('weapon','weaponText')]];path=f'genshin/splash/{key}.png'
            if path in paths:r['image']=image(RAW+'ScobbleQ/HoYo-Assets/main/'+path,'splash','https://github.com/ScobbleQ/HoYo-Assets')
            elif c.get('images',{}).get('portrait'):r['image']=image(c['images']['portrait'],'portrait',u)
            rows.append(r)
    elif game=='hsr':
        source_count=len(d['en']);version=d['info'].get('version');future={c['name']for c in d['release']if c.get('isReleased')is False or c.get('upcoming')is True}
        if any(set(d[l])!=set(d['en'])for l in LOCALES):raise SourceError('Native HSR ID sets differ')
        for key,c in d['en'].items():
            require_fields(c,['name','rarity','path','element'],'HSR character')
            if c['name']in future:continue
            r=row(key,native_names(d,key),urls['en']);r['rarity']=int(c['rarity']);r['traits']=[trait('path',c['path']),trait('element',c['element'])]
            if c.get('portrait'):r['image']=image(RAW+'Mar-7th/StarRailRes/master/'+c['portrait'],'splash',urls['en'])
            rows.append(r)
    elif game=='zzz':
        source_count=len(d['avatars']);locs=d['locs'];py=d['release'];future={c['name']for c in py if c.get('upcoming')is True};aliases={'Jane':'Jane Doe','Soldier 0 - Anby':'Anby: Soldier 0','Starlight - Billy':'Billy - Starlight'};announcements=reviewed_announcements()
        for locale in ['ko','en','ja','zh-cn']:require_fields(locs,[locale],'ZZZ localizations')
        for key,c in d['avatars'].items():
            require_fields(c,['Name','ProfessionType','ElementTypes'],'ZZZ avatar');n=names(**{l:locs[v].get(c['Name'],'')for l,v in [('ko','ko'),('en','en'),('ja','ja'),('zh','zh-cn')]})
            if not n['en']:raise SourceError('ZZZ missing English name for '+key)
            provider=next((x for x in py if x['name']==aliases.get(n['en'],n['en'])),None)
            announcement=reviewed_zzz_announcement(announcements,key,c,n,provider)
            if n['en']in future and not announcement:continue
            r=row(key,n,urls['avatars']);r['traits']=[trait('specialty',c['ProfessionType']),trait('element',', '.join(c['ElementTypes']))];match=provider if provider and(not provider.get('upcoming')or announcement)else None
            if match:r['image']=image(match.get('cardImage'),'card',urls['release']+match['slug']+'/',**({'sourceKind':'community'}if announcement else{}))
            if announcement:
                # Only identity, declared card and officially confirmed rank/type
                # enter the preview. Stats/skills/progression are not copied.
                r['rarity']=announcement['rarity'];r['rarityLabel']=announcement['rarityLabel']
                r['availability']={'status':'announced'if provider.get('upcoming')is True else'released','sourceUrl':announcement['sourceUrl']}
                r['nameSources']={l:{'url':urls['locs'],'kind':'community'}for l in LOCALES}
                r['detailSources']=[{'url':announcement[k],'kind':'official'}for k in ['sourceUrl','confirmationUrl']]
                announcement_urls.extend(announcement[k]for k in ['sourceUrl','confirmationUrl'])
            rows.append(r)
        note+=' Unreviewed upcoming agents excluded. Exact reviewed official announcements may supply identity-only previews; provider release flags explicitly retire that preview. Enka image host403 is not used; only exact declared matching community card images. Rank enum is not converted into stars.'
    elif game=='arknights':
        play={l:{key:c for key,c in d[l].items()if not c.get('isNotObtainable')and c.get('profession')not in ['TOKEN','TRAP']}for l in LOCALES}
        for l in LOCALES:
            patch=d.get('patch_'+l,{})
            for base,info in patch.get('infos',{}).items():
                if base not in play[l]:continue
                for key in info.get('tmplIds',[]):
                    c=patch.get('patchChars',{}).get(key)
                    if c and not c.get('isNotObtainable')and c.get('profession')not in ['TOKEN','TRAP']:play[l][key]=c
        keys=list(dict.fromkeys(key for l in LOCALES for key in play[l]));source_count=len(set(key for l in LOCALES for key in d[l])|{key for l in LOCALES for key in play[l]});paths=assetpaths(d['art'])
        for l in LOCALES:
            if len(play[l])<300:raise SourceError('Unexpectedly small native playable Arknights table '+l)
        for key in keys:
            c=next(x[key]for x in play.values()if key in x);require_fields(c,['name','rarity','profession','position'],'Arknights operator');r=row(key,native_names(play,key),urls[('patch_en'if key not in d['en']else'en')if key in play['en']else('patch_zh'if key not in d['zh']else'zh')],[v for l,v in [('en','global'),('ko','kr'),('ja','jp'),('zh','cn')]if key in play[l]]);r['rarity']=int(c['rarity'].split('_')[-1]);r['traits']=[trait('profession',c['profession']),trait('position',c['position'])];path='characters/'+key+'_1.png'
            if path in paths:r['image']=image(RAW+'Aceship/Arknight-Images/main/'+path,'full-body','https://github.com/Aceship/Arknight-Images')
            rows.append(r)
        note+=' Native membership per service; CN operators are never copied into KR/JP/global. TOKEN/TRAP/nonobtainable excluded.'
    elif game in ('nikke','nte','trickcal','reverse1999','limbus'):
        data=d['characters'];source_count=len(data)
        for c in data:
            require_fields(c,['name','slug','rarity'],'Community character')
            if c.get('is_upcoming')is True or c.get('upcoming')is True or c.get('hasTreasure')is True:continue
            extra=c.get('data')or{};key=extra.get('unitId')or c.get('unitId')or c['slug'];u=urls['characters']+c['slug']+'/';r=row(key,names(en=c['name']),u);r['traits']=[]
            for k in ['element','role','position','personality','faction','damage','afflatus','damageType','weapon','class','manufacturer','burstType','arcCompatibility']:
                if c.get(k)and not str(c[k]).startswith('$'):r['traits'].append(trait(k,c[k]))
            for k in ['affinity','attackType','baseCharacter']:
                if extra.get(k):r['traits'].append(trait(k,', '.join(extra[k])if isinstance(extra[k],list)else extra[k]))
            if game in ('trickcal','reverse1999'):r['rarity']=int(c['rarity'])
            elif game=='limbus':r['rarity']=len(c['rarity'])
            else:
                r['traits'].append(trait('rank',c['rarity']))
                # Exact sourced native letters only; unknown/numeric provider
                # values retain their rank trait without an invented conversion.
                grade={'nikke':{'R':1,'SR':2,'SSR':3},'nte':{'A':4,'S':5}}[game].get(c['rarity'])if isinstance(c['rarity'],str)else None
                if grade is not None:r['rarity']=grade;r['rarityLabel']=c['rarity']
            if game=='reverse1999':r['regions']=['global','kr','jp','cn']if c.get('availableInGlobal')is True else['cn']
            if game=='trickcal':r['regions']=['kr']if c.get('is_kr')is True else['kr','global']
            field_,kind={'nikke':('cardImage','card'),'nte':('thumbnailUrl','portrait'),'trickcal':('thumbnailUrl','portrait'),'reverse1999':('imageFull','full-body'),'limbus':('mid_image','card')}[game];art=c.get(field_)or extra.get(field_)
            if not art and game=='limbus':art=extra.get('small_image')or c.get('thumbnailUrl');kind='portrait'
            r['image']=image(art,kind,urls['characters']);rows.append(r)
        note+=' Original English community names only; unobserved native names stay empty. Treasury build variants and explicit future flags excluded. No review/ranking prose copied.'
    elif game=='stellasora':
        source_count=len(d['characters']);paths=assetpaths(d['art'])
        for key,c in d['characters'].items():
            if not c.get('Visible')or not c.get('Available'):continue
            require_fields(c,['Id','Name','DefaultSkinId'],'Stella character');r=row(c['Id'],names(**{l:d[l].get(c['Name'],'')for l in LOCALES}),urls['characters']);r['traits']=[trait('source-grade',c.get('Grade','')),trait('source-class',c.get('Class','')),trait('source-element',c.get('EET',''))];path='public/assets/char/'+str(c['DefaultSkinId'])+'_CG.png'
            if path in paths:r['image']=image(RAW+'JforPlay/sstoy/main/'+path,'full-body','https://github.com/JforPlay/sstoy')
            rows.append(r)
        note+=' Only Visible && Available. Native string keys joined; Grade enum not guessed as a star rating.'
    elif game=='gfl2':
        data=d['characters'];source_count=len(data['rows'])
        for c in data['rows']:
            require_fields(c,['name','class','attributes','elite'],'GFL2 doll');key=c['name'];u='https://gfl2.help/en/characters/'+key;r=row(key,names(en=key),u);r['traits']=[trait('class',c['class']),trait('attributes',', '.join(c['attributes'])),trait('rank','Elite'if c['elite']else'Standard')]
            if key in data['images']:r['image']=image(urljoin('https://gfl2.help',data['images'][key]),'full-body',u)
            rows.append(r)
        note+=' Declared source-name path IDs retained. Image src must occur inside the matching doll anchor. No service release flags provided.'
    elif game=='holodreams':
        if not d['en']['locale'].startswith('en')or not d['ja']['locale'].startswith('ja'):raise SourceError('Official page returned wrong locale')
        en=d['en']['rows'];jp={x['id']:x for x in d['ja']['rows']};source_count=len(en)
        if {x['id']for x in en}!=set(jp):raise SourceError('Official member lists differ by language')
        for c in en:
            require_fields(c,['id','name','group'],'Holo member');r=row(c['id'],names(en=c['name'],ja=jp[c['id']]['name']),urls['en'],official=True);r['traits']=[trait('group',c['group'])]
            if c.get('fullArtUrl'):
                size={k:int(c[k])for k in ['width','height']if str(c.get(k,'')).isdigit()};r['image']=image(c['fullArtUrl'],'full-body',urls['en'],**size)
            rows.append(r)
        note+=' Official member roster, not collectible outfit/card variants. No star rating or release date inferred.'
    elif game=='dna':
        en=d['en']['items'];native={l:{x['id']:x for x in d[l]['items']}for l in LOCALES};source_count=len(en)
        if any(set(native[l])!=set(native['en'])for l in LOCALES):raise SourceError('DNA native ID sets differ')
        for c in en:
            key=c['id'];r=row(key,native_names(native,key),urls['en']+'/'+key);group=d['en'].get('groups',{}).get(c.get('groupId'),{}).get('label','');r['traits']=[trait('element',group)]if group else[];rows.append(r)
        note+=' Atlas sprite coordinates are not standalone illustrations; image omitted. No invented gacha/rank/star fields.'
    else:raise SourceError('Unknown normalizer '+game)
    rows=sorted(({k:v for k,v in r.items()if v is not None}for r in rows),key=lambda r:r['id'])
    result={'gameId':game,'sourceName':{'holodreams':'hololive Dreams official members','genshin':'genshin-db + HoYo-Assets','hsr':'StarRailRes + Prydwen future exclusions','zzz':'EnkaNetwork + Prydwen cards','arknights':'Arknights regional client tables + declared native artwork','stellasora':'sstoy native data','gfl2':'GFL2 HELP','dna':'TH.GL Duet Night Abyss database'}.get(game,'Prydwen Institute'),'sourceUrls':list(dict.fromkeys([*urls.values(),*announcement_urls])),'checkedAt':NOW(),'characters':rows,'coverage':{'sourceCount':source_count,'includedCount':len(rows),'note':note}}
    if version:result['sourceVersion']=version
    validate_normalized(result)
    return result

def validate_normalized(d):
    rows=d['characters']
    if not rows:raise SourceError('Empty normalized roster')
    ids=[]
    for r in rows:
        require_fields(r,['id','name','sourceUrl','sourceKind'],'Normalized character');ids.append(r['id'])
        if not isinstance(r['id'],str)or not r['id']:raise SourceError('Invalid source ID')
        if set(r['name'])!=set(LOCALES)or not any(r['name'].values())or any(not isinstance(x,str)for x in r['name'].values()):raise SourceError('Invalid/missing localized names')
        if r['sourceKind']not in ('official','community'):raise SourceError('Invalid sourceKind')
        if r.get('image'):
            im=r['image']
            if im.get('kind')not in ('splash','full-body','card','portrait')or not im.get('url','').startswith(('https://','http://')):raise SourceError('Invalid declared image')
            if im.get('locale')not in (None,'neutral','ko','en','ja','zh'):raise SourceError('Invalid image locale')
    if len(ids)!=len(set(ids)):raise SourceError('Duplicate normalized IDs; refusing overwrite')
    if d['coverage']['includedCount']!=len(rows):raise SourceError('Normalized count mismatch')

def stable_content(d):return {k:v for k,v in d.items()if k!='checkedAt'}
def preserve_images(new,old):
    prior={r['id']:r for r in (old or{}).get('characters',[])};kept=0
    for r in new['characters']:
        p=prior.get(r['id'])
        # Keep exact source-form art when collection omits it, only with a matching observed name.
        if not r.get('image')and p and p.get('image')and any(r['name'][l]and r['name'][l]==p.get('name',{}).get(l)for l in LOCALES):r['image']=classify_image(p['image']);kept+=1
    return kept

def failed_source_receipt(spec,error):
    receipt={'key':spec.key,'url':spec.url,'checkedAt':NOW(),'status':'failed','error':str(error),'optional':spec.optional}
    cause=error;seen=set()
    while cause and id(cause)not in seen:
        seen.add(id(cause))
        if isinstance(cause,urllib.error.HTTPError):receipt['httpStatus']=cause.code;break
        cause=cause.__cause__ or cause.__context__
    return receipt

def collect_one(game,args):
    output=args.workdir/'normalized'/(game+'.json');prior=read_json(output);bootstrap=read_json(args.bootstrap/(game+'.json'));last_good=prior or bootstrap
    checks=[];warnings=[]
    try:
        data={};fetcher=Fetcher(args.workdir,args.timeout,args.retries)
        # Dependencies within a game stay sequential. Games use independent concurrent source caches.
        for spec in source_specs(game):
            try:value,status=fetcher.fetch(game,spec)
            except Exception as error:
                failed=failed_source_receipt(spec,error);checks.append(failed)
                # Only declared artwork inventories are optional. Required native
                # tables/localizations still abort; a stale tree is never reused.
                if not(spec.optional and spec.key=='art'and spec.kind=='tree'):raise
                data[spec.key]={'truncated':False,'tree':[]}
                warnings.append({**failed,'type':'artwork-source-failed','fallback':'empty-tree'})
                continue
            data[spec.key]=value;checks.append(status)
        result=normalize(game,data)
        if last_good and len(result['characters'])<len(last_good.get('characters',[]))*0.75:raise SourceError('Roster shrank more than25%; rejecting possible partial source')
        kept=preserve_images(result,last_good);validate_normalized(result)
        changed=not prior or stable_content(result)!=stable_content(prior)
        if not changed:result=prior # Preserve checkedAt when factual output has not changed.
        atomic_json(output,result)
        return {'gameId':game,'status':'limited'if warnings else'updated'if changed else'unchanged','eligibleForIngest':True,'changed':changed,'path':str(output),'includedCount':len(result['characters']),'images':sum(bool(r.get('image'))for r in result['characters']),'preservedImages':kept,'sources':checks,'warnings':warnings,'checkedAt':NOW()}
    except Exception as e:
        # Last-good/bootstrap is a display recovery snapshot, never marked freshly ingest-eligible.
        if last_good and not output.exists():atomic_json(output,last_good)
        return {'gameId':game,'status':'failed','eligibleForIngest':False,'changed':False,'lastGoodAvailable':bool(last_good),'path':str(output)if last_good else None,'error':str(e),'sources':checks,'warnings':warnings,'checkedAt':NOW()}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--workdir',type=Path,default=Path('.roster-cache'));parser.add_argument('--bootstrap',type=Path,default=HERE/'bootstrap');parser.add_argument('--games',nargs='+',choices=GAMES,default=list(GAMES));parser.add_argument('--timeout',type=int,default=25);parser.add_argument('--retries',type=int,default=2);parser.add_argument('--workers',type=int,default=3);parser.add_argument('--strict',action='store_true',help='Nonzero exit on any failed game, after writing partial successes');args=parser.parse_args()
    args.workdir=args.workdir.resolve();args.bootstrap=args.bootstrap.resolve();started=NOW();games=list(dict.fromkeys(args.games));args.workdir.mkdir(parents=True,exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1,min(4,args.workers)))as pool:results=list(pool.map(lambda game:collect_one(game,args),games))
    report={'schemaVersion':1,'startedAt':started,'finishedAt':NOW(),'results':results,'summary':{'games':len(results),'succeeded':sum(r['eligibleForIngest']for r in results),'limited':sum(bool(r['warnings'])and r['eligibleForIngest']for r in results),'failed':sum(not r['eligibleForIngest']for r in results),'changed':sum(r['changed']for r in results)},'ingestFiles':[r['path']for r in results if r['eligibleForIngest']],'changedFiles':[r['path']for r in results if r['eligibleForIngest']and r['changed']]}
    atomic_json(args.workdir/'run.json',report)
    for result in results:print(json.dumps({k:v for k,v in result.items()if k!='sources'},ensure_ascii=False),flush=True)
    print(json.dumps({'manifest':str(args.workdir/'run.json'),'summary':report['summary']},ensure_ascii=False),flush=True)
    return 1 if not report['summary']['succeeded']or(args.strict and report['summary']['failed']) else 0
if __name__=='__main__':sys.exit(main())
