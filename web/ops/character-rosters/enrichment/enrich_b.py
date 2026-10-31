#!/usr/bin/env python3
"""Read-only KO roster enrichment: fixed ordinary public sources, inert parsing.

python enrich_b.py --input-dir <normalized-dir> --output-dir <dir> [--cache-dir <dir>]
No source/deployment/authentication edits. Preserve input on per-game failure.
Cached sources are research replay, never represented as a new live fetch.
"""
import argparse,copy,datetime,html,json,pathlib,re,urllib.parse,urllib.request,urllib.error,hashlib,concurrent.futures,os
ROOT=pathlib.Path(__file__).resolve().parent
MANUAL=json.loads((ROOT/'manual_names.json').read_text())
GAMES=('umamusume','gfl2','holodreams','nte')
FIXED={
 'uma-inven':'https://uma.inven.co.kr/db/chara/',
 'uma-data':'https://umamusume.kakaogames.com/assets/js/data.v5.js?v=20260909',
 'gf-all':'https://gf2.haoplay.com/kr/roleinfo/allroles.html',
 'gf-en-all':'https://gf2.haoplay.com/en/roleinfo/allroles.html',
 'nte-main':'https://nte.perfectworld.com/kr/main.html',
 'kaiden-nte':'https://www.kaiden.gg/nte/characters/',
 'holo-ja':'https://hololive-dreams.com/',
}
SUFFIX={'uma-data':'.txt','nte-main':'.txt'}
def loc(ko,en,ja,zh):return dict(zip(('ko','en','ja','zh'),(ko,en,ja,zh)))
def clean(s):return html.unescape(re.sub('<[^>]+>',' ',s)).strip()
def source_name(name,url,kind):return {'ko':name,'nameSources':{'ko':{'url':url,'kind':kind}}}
def atomic(path,value):
 path.parent.mkdir(parents=True,exist_ok=True);tmp=path.with_suffix(path.suffix+'.tmp');tmp.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n');os.replace(tmp,path)
class Sources:
 def __init__(self,cache,offline=False):self.cache=pathlib.Path(cache);self.cache.mkdir(parents=True,exist_ok=True);self.receipts=[];self.errors=[];self.offline=offline
 def get(self,key,url):
  if not url.startswith('https://'):raise ValueError('HTTPS source required')
  path=self.cache/(key+SUFFIX.get(key,'.html'));meta=path.with_suffix(path.suffix+'.meta.json')
  if self.offline:
   if not path.exists():raise ValueError('Unfetched optional source; retained prior facts')
   raw=path.read_bytes();self.receipts.append({'key':key,'url':url,'mode':'cached-replay','sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)});return raw.decode()
  headers={'User-Agent':'GAGETHER-PublicRosterEnrichment/1.0'};old={}
  if path.exists()and meta.exists():
   try:
    old=json.loads(meta.read_text())
    if old.get('url')!=url or hashlib.sha256(path.read_bytes()).hexdigest()!=old.get('sha256'):old={}
   except Exception:old={}
   if old.get('etag'):headers['If-None-Match']=old['etag']
   if old.get('lastModified'):headers['If-Modified-Since']=old['lastModified']
  at=datetime.datetime.now(datetime.timezone.utc).isoformat()
  try:
   try:
    with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=35)as r:
     raw=r.read(3000001)
     if r.status!=200 or len(raw)>3000000:raise ValueError('Invalid HTTP response or source size')
     entry={'url':url,'etag':r.headers.get('ETag'),'lastModified':r.headers.get('Last-Modified'),'sha256':hashlib.sha256(raw).hexdigest(),'fetchedAt':at};path.write_bytes(raw);atomic(meta,entry)
     self.receipts.append({'key':key,'url':url,'mode':'fetched','httpStatus':200,'sha256':entry['sha256'],'bytes':len(raw),'checkedAt':at});return raw.decode()
   except urllib.error.HTTPError as e:
    if e.code==304 and old and path.exists():
     raw=path.read_bytes();self.receipts.append({'key':key,'url':url,'mode':'conditional-validated','httpStatus':304,'sha256':old['sha256'],'bytes':len(raw),'checkedAt':at});return raw.decode()
    raise
  except Exception as e:
   self.errors.append({'key':key,'url':url,'error':str(e),'checkedAt':at});raise

def official_roles(s):
 rows={}
 for m in re.finditer(r'<a\s[^>]*href="([^\"]+)"[^>]*>([\s\S]*?)</a>',s):
  if 'allroles-roles-name-name-div'not in m[2]:continue
  key=re.search(r'[?&]role=(\d+)',m[1]);value=clean(m[2])
  if key and value:rows[key[1]]=value
 if len(rows)<59:raise ValueError('Partial official role list')
 return rows

def unpack_character(s):
 m=re.search(r'<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)</script>',s,re.S)
 if not m:raise ValueError('Missing public source data')
 flat=json.loads(m[1]);active=set();cache={}
 def unpack(i):
  if not isinstance(i,int)or i<0:return None
  if i in cache:return cache[i]
  if i in active or i>=len(flat):raise ValueError('Invalid source reference')
  active.add(i);x=flat[i]
  if isinstance(x,dict):v={k:unpack(j)for k,j in x.items()}
  elif isinstance(x,list):v=unpack(x[1])if x and x[0]in ['ShallowReactive','Reactive','Ref','ShallowRef']else[unpack(j)for j in x]
  else:v=x
  active.remove(i);cache[i]=v;return v
 root=flat[1];d=flat[root['data']]
 if isinstance(d,list):d=flat[d[1]]
 branch=next((v for k,v in d.items()if k.startswith('character-')),None)
 if branch is None:raise ValueError('Missing character branch')
 return unpack(branch)['character']

def enrich(game,document,cache_dir,offline=False):
 out=copy.deepcopy(document);sources=Sources(cache_dir,offline);notes=[];applied=0;stats_count=0;kept=0;optional_source_blocked=False
 def name(c,v,url,kind):
  nonlocal applied
  # A nonempty native input remains authoritative; this helper fills the gap.
  if c['name'].get('ko'):
   old=c.get('nameSources',{}).get('ko')
   if not old or kind=='translation' or (old.get('kind')!='translation'and(old.get('url')!=url or old.get('kind')!=kind)):return
  c['name']['ko']=v;c.setdefault('nameSources',{})['ko']={'url':url,'kind':kind};applied+=1
 def expected(c):
  e=MANUAL['expected'][game].get(c['id'])
  return e and all(c['name'].get(l,'')==e[l]for l in ['en','ja'])
 if game=='gfl2':
  kr=official_roles(sources.get('gf-all',FIXED['gf-all']));en=official_roles(sources.get('gf-en-all',FIXED['gf-en-all']));by_name={v.casefold():kr[k]for k,v in en.items()if k in kr};by_name['balthilde']=by_name['bathilde']
  for c in out['characters']:
   v=by_name.get(c['name']['en'].casefold())
   if not v:notes.append('Korean name unresolved: '+c['id']);continue
   name(c,v,FIXED['gf-all'],'official')
   if optional_source_blocked:notes.append('Source rate/access limited; retained optional stats: '+c['id']);continue
   try:
    u=c['sourceUrl'];parts=urllib.parse.urlsplit(u)
    if parts.netloc!='gfl2.help'or not parts.path.startswith('/en/characters/'):raise ValueError('Unexpected source identity')
    # Quote declared paths containing spaces; no guessed file or alternate host.
    u=urllib.parse.urlunsplit((parts.scheme,parts.netloc,urllib.parse.quote(urllib.parse.unquote(parts.path),safe='/:'),parts.query,''))
    raw=sources.get('gfl-'+c['id'].replace(':','-'),u);data=unpack_character(raw)
    if data.get('name','').casefold()!=c['name']['en'].casefold():raise ValueError('Character detail identity mismatch')
    stats=data.get('stats',{});labels={'health':loc('HP','HP','HP','生命值'),'attack':loc('공격력','ATK','攻撃力','攻击力'),'defense':loc('방어력','DEF','防御力','防御力'),'stability':loc('안정 지수','Stability','安定指数','稳态指数'),'mobility':loc('이동력','Mobility','移動力','移动力')};basis=loc('GFL2 HELP 캐릭터 페이지 표시값 · 레벨·돌파 기준 미표기','GFL2 HELP character panel · level/ascension not specified','GFL2 HELPのキャラ画面値・レベル/突破条件の記載なし','GFL2 HELP角色面板值・未注明等级/突破条件')
    rows=[{'id':k,'label':v,'value':str(stats[k]),'basis':basis}for k,v in labels.items()if k in stats and re.fullmatch(r'\d+(?:\.\d+)?',str(stats[k]))]
    if len(rows)<3:raise ValueError('Incomplete published stat panel')
    c['stats']=rows;stats_count+=1
   except Exception as e:
    notes.append('Optional stats retained/missing for '+c['id']+': '+str(e))
    if getattr(e,'code',None)in(403,429):optional_source_blocked=True
 elif game=='umamusume':
  native=sources.get('uma-data',FIXED['uma-data']);bases=dict(re.findall(r'"idx":\s*"(\d+)"[\s\S]*?"name":\s*"([^\"]+)"',native))
  inv=sources.get('uma-inven',FIXED['uma-inven']);items=re.findall(r'<a href="/db/chara/(\d+)">\s*<span class="charactertitle">([^<]*)</span><br><span class="charactername">([^<]*)</span>',inv)
  if len(items)<200 or len(bases)<100:raise ValueError('Partial Korean source inventory')
  pairs={k:(html.unescape(title).strip('[]'),html.unescape(n))for k,title,n in items}
  for c in out['characters']:
   if c['id']in pairs:
    title,base=pairs[c['id']];name(c,f'{base} [{title}]',FIXED['uma-inven'],'community')
   elif expected(c):
    base=bases.get(c['id'][:4])or MANUAL['umamusumeBase'].get(c['id'][:4]);title=MANUAL['umamusumeOutfits'].get(c['id'])
    if not base or not title:notes.append('Korean outfit unresolved: '+c['id']);continue
    name(c,f'{base} [{title}]',c['sourceUrl'],'translation')
   else:notes.append('New or changed exact outfit identity: '+c['id'])
  notes.append('Native Korean base names from Kakao; 215 exact Korean outfit names from Inven; future/unavailable Korean outfits use explicitly labeled editorial Korean translations tied to existing exact IDs. No KR release/progression claims.')
 elif game=='holodreams':
  # Game does not have a published KO roster; these are editorial Hangul renderings.
  # Validate the source IDs and native names against the reviewed manifest.
  for c in out['characters']:
   if expected(c)and c['id']in MANUAL[game]:name(c,MANUAL[game][c['id']],c['sourceUrl'],'translation')
   else:notes.append('New or changed official member identity: '+c['id'])
  notes.append('54 Korean names are editorial Hangul renderings of the official game member identities; not official Korean localization. No numerical combat stats are published by this roster source.')
 elif game=='nte':
  native=sources.get('nte-main',FIXED['nte-main']);index=sources.get('kaiden-nte',FIXED['kaiden-nte']);links=sorted(set(re.findall(r'href="(/nte/characters/[a-z0-9-]+/)',index)));paths={u.split('/')[-2]:u for u in links if 'tier-list'not in u}
  for c in out['characters']:
   n=c['name']['en'];ko=MANUAL['nte'].get(n)
   if expected(c)and ko:
    official=ko in clean(native);name(c,ko,FIXED['nte-main']if official else c['sourceUrl'],'official'if official else'translation')
   else:notes.append('New or changed NTE character identity: '+c['id'])
   slug={'Akane Rin':'akane'}.get(n,n.lower())
   if slug not in paths:notes.append('No declared Kaiden detail path: '+c['id']);continue
   u='https://www.kaiden.gg'+paths[slug]
   if optional_source_blocked:notes.append('Source rate/access limited; retained optional stats: '+c['id']);continue
   try:
    s=sources.get('kaiden-'+slug,u);heading=clean(re.search(r'<h1[^>]*>([\s\S]*?)</h1>',s)[1]);expected_heading='Akane'if n=='Akane Rin'else n
    if not heading.lower().startswith(expected_heading.lower()):raise ValueError('Kaiden identity mismatch')
    tag=re.search(r'<[^>]+\bid=["\']nte-stats-container["\'][^>]*>',s)
    if not tag:raise ValueError('No level table')
    a=re.search(r'\bdata-stats=["\']([^"\']*)',tag[0]);values=json.loads(html.unescape(a[1]));v=next(x for x in values if x['level']==80)
    if len({x['level']for x in values})!=80 or not all(isinstance(v[k],(int,float))and 0<v[k]<10000000 for k in ['hp','atk','def']):raise ValueError('Invalid Lv.80 table')
    labels={'hp':loc('HP','HP','HP','生命值'),'atk':loc('공격력','ATK','攻撃力','攻击力'),'def':loc('방어력','DEF','防御力','防御力')};basis=loc('Lv.80 · 장비·각성·콘솔·전투 버프 제외 · Kaiden 기초 수치','Lv.80 · no equipment, awakening, console or combat buffs · Kaiden base stats','Lv.80・装備/覚醒/コンソール/戦闘バフなし・Kaiden基礎値','Lv.80・不含装备/觉醒/控制台/战斗增益・Kaiden基础数值')
    c['stats']=[{'id':k,'label':label,'value':str(v[k]),'basis':basis}for k,label in labels.items()];stats_count+=1;c['sourceUrl']=u
    if u not in out['sourceUrls']:out['sourceUrls'].append(u)
   except Exception as e:
    notes.append('Optional stats retained/missing for '+c['id']+': '+str(e))
    if getattr(e,'code',None)in(403,429):optional_source_blocked=True
  notes.append('Korean names retained as native where actually present in official KR source; remaining exact-identity Hangul labels marked translation. Aurelia is 우미츠키, Blackbird is 레이븐, Jiuyuan is 구원; do not transliterate English aliases.')
 else:return document,{'gameId':game,'status':'skipped'}
 if game=='umamusume':out['sourceUrls']=list(dict.fromkeys(out['sourceUrls']+[FIXED['uma-inven'],FIXED['uma-data']]))[:40]
 if game=='gfl2':out['sourceUrls']=list(dict.fromkeys(out['sourceUrls']+[FIXED['gf-all'],FIXED['gf-en-all']]))[:40]
 # Preserve source clocks. Distinguish sourced native names from editorial renderings.
 out['coverage']['nativeNameCounts']={l:sum(bool(c['name'].get(l)) and c.get('nameSources',{}).get(l,{}).get('kind')!='translation' for c in out['characters']) for l in ['ko','en','ja','zh']}
 coverage_notes={
  'umamusume':'KO base names: Korean Kakao official roster; 215 exact outfit ID/name pairs: Inven. Other Korean outfit labels are explicitly marked editorial translations in nameSources. Korean availability remains unknown; no JP/global progression copied. Existing exact outfit art and source-rarity base stats are preserved.',
  'gfl2':'59 Korean names joined via identical role IDs across official KR and EN rosters, retaining exact source path identities. No regional release flags are asserted. Added numerical panels are exact GFL2 HELP displayed values; source does not specify level/ascension.',
  'holodreams':'54 official game member identities, not 162 card/outfit variants. Korean labels are editorial Hangul renderings and not official Korean localization. Existing game art is preserved. No numerical combat stats or rarity are published in this official roster source.',
  'nte':'24 exact community roster identities. Korean official-native names are retained where present in the actual KR page; other localized aliases are explicitly marked editorial Korean labels. Added Kaiden base tables are Lv.80, excluding gear, awakening, console and combat buffs. No current pickup or release-date claims.'
 }
 out['coverage']['note']=coverage_notes[game]
 report={'gameId':game,'status':'ok'if all(c['name'].get('ko')for c in out['characters'])else'partial','count':len(out['characters']),'koreanNames':sum(bool(c['name'].get('ko'))for c in out['characters']),'namesFilled':applied,'statsFilled':stats_count,'statsCount':sum(bool(c.get('stats')or c.get('regionalStats'))for c in out['characters']),'notes':notes,'sources':sources.receipts,'sourceErrors':sources.errors}
 return out,report

def main():
 a=argparse.ArgumentParser();a.add_argument('--input-dir',required=True);a.add_argument('--output-dir',required=True);a.add_argument('--cache-dir',default=str(ROOT));a.add_argument('--offline',action='store_true');args=a.parse_args();out=pathlib.Path(args.output_dir);out.mkdir(parents=True,exist_ok=True);reports=[]
 for game in GAMES:
  p=pathlib.Path(args.input_dir)/(game+'.json')
  if not p.exists():reports.append({'gameId':game,'status':'missing-input'});continue
  original=json.loads(p.read_text())
  try:
   if original.get('gameId')!=game:raise ValueError('Input game mismatch')
   result,report=enrich(game,original,args.cache_dir,offline=args.offline);atomic(out/(game+'.json'),result)
  except Exception as e:atomic(out/(game+'.json'),original);report={'gameId':game,'status':'failed','error':str(e),'preservedInput':True}
  reports.append(report)
 atomic(out/'enrichment-report-b.json',{'results':reports})
 print(json.dumps([{'gameId':r['gameId'],'status':r['status'],'koreanNames':r.get('koreanNames'),'statsCount':r.get('statsCount')}for r in reports],ensure_ascii=False))
if __name__=='__main__':main()
