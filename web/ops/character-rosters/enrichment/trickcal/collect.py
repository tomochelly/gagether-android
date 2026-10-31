#!/usr/bin/env python3
"""Read exact native Trickcal icons/skills; preserve all canonical IDs and regional facts.
No scripts are executed: Next Flight arrays and their JSON property values are decoded.
"""
from __future__ import annotations
import argparse,concurrent.futures,copy,datetime as dt,hashlib,html,io,json,re,urllib.parse,urllib.request
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parent
KR='https://wiki.cheeky.tsuncloud.com/korea/apostles'
GLOBAL='https://wiki.cheeky.tsuncloud.com/global/apostles'
OFFICIAL='https://trickcal.com/revive/intro/coffe'
RENEWA_FEED='https://comm-api.game.naver.com/nng_main/v1/community/lounge/Trickcal/feed/4258435'
RENEWA_POST='https://game.naver.com/lounge/Trickcal/board/detail/4258435'
RENEWA_ORIGINAL='https://cafeptthumb-phinf.pstatic.net/MjAyNDA2MTZfMjk0/MDAxNzE4NTI0MDMyNDky.bbiZ-mCIKGDOHMRF_AjiqyvM_bWNc3JtAOQSXI6bzoIg.p2a1edvwBOwwk16phr1GxE4-tQ2fh4nlwY_h6PODfTAg.PNG/1.png?type=w1600'
RENEWA_HASH='ebbbd27ee9d270be82a3b22be82a2a525b187f5e54dcd9dd4d93df9e56ae5647'
LOCALES=('ko','en','ja','zh')
C=lambda ko='',en='',ja='',zh='':dict(zip(LOCALES,(ko,en,ja,zh)))
TYPES={'low':C('저학년 스킬','Freshman skill','低学年スキル','低年级技能'),'high':C('고학년 스킬','Senior skill','高学年スキル','高年级技能'),'normal':C('일반 공격','Normal attack','通常攻撃','普通攻击'),'Basic':C('일반 공격','Normal attack','通常攻撃','普通攻击'),'Skill':C('저학년 스킬','Freshman skill','低学年スキル','低年级技能'),'Ultimate':C('고학년 스킬','Senior skill','高学年スキル','高年级技能'),'Passive':C('패시브','Passive','パッシブ','被动')}
BASIS_KR=C('한국 서비스 · 한국어 스킬 원문에 명시된 단계별 값 · 중간 레벨 추정 없음','Korean service; exact published Korean skill checkpoints, no interpolated levels.','韓国サービスの韓国語原文に明記された段階値。未掲載レベルは補間しません。','韩国服务器韩文原文明确记载的阶段数值；不推算未列出的等级。')
BASIS_NATIVE=C('선택한 실제 서비스의 게임 테이블 원문 · 배율이 없는 설명은 수치 추정 없음','Native game-table text for this actual service; missing coefficients are not inferred.','選択した実サービスのゲーム表原文。未解決の倍率は推測しません。','所选实际服务器的游戏表原文；不推测未解析的倍率。')
def now():return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z')
def sha(b):return hashlib.sha256(b).hexdigest()
def packed(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
def canonical_hash(v):return sha(json.dumps(v,ensure_ascii=False,separators=(',',':'),sort_keys=True).encode())
def allowed(url):
 p=urllib.parse.urlsplit(url)
 if p.scheme!='https'or p.username or p.password:raise ValueError('Unsafe source')
 if url in (RENEWA_FEED,RENEWA_ORIGINAL):return
 if p.netloc=='wiki.cheeky.tsuncloud.com' and re.fullmatch(r'/(korea|global)/apostles(?:/[a-z0-9-]+)?/?',p.path):return
 if p.netloc=='trickcal.com'and(p.path.startswith('/assets/revive/intro/coffe/')or p.path=='/revive/intro/coffe'):return
 if p.netloc=='cheeky.tsuncloud.com'and p.path.startswith(('/deploy/com.epidgames.trickcalrevive/','/deploy/com.bilibili.trickcal/'))and re.search(r'/(?:heroicons|skillicons|commonicons|stateicons|_low_commonicons|_low_stateicons|_low_ingameui|ingameui)/',p.path):return
 raise ValueError('Source outside fixed public allowlist: '+url)
class Sources:
 def __init__(self,cache,offline=False):self.cache=Path(cache);self.cache.mkdir(parents=True,exist_ok=True);self.offline=offline;self.receipts={}
 def get(self,url,limit=5_000_000):
  allowed(url);key=sha(url.encode());body=self.cache/(key+'.body');meta=self.cache/(key+'.json')
  refresh=True
  if body.exists()and meta.exists():
   b=body.read_bytes();r=json.loads(meta.read_text())
   if r['url']!=url or r['sha256']!=sha(b):raise ValueError('Source receipt mismatch')
   r=dict(r,mode='cached-replay');refresh=not self.offline and(dt.datetime.now(dt.timezone.utc)-dt.datetime.fromisoformat(r['checkedAt'].replace('Z','+00:00'))).total_seconds()>=21600
  elif self.offline:raise ValueError('Offline source absent: '+url)
  if refresh:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-public-reference/1.0','Accept':'application/json,text/html,image/png,image/webp;q=0.9'}),timeout=35)as response:
    if response.status!=200:raise ValueError('Expected HTTP200')
    b=response.read(limit+1)
   if len(b)>limit:raise ValueError('Source exceeds byte bound')
   r=dict(url=url,httpStatus=200,bytes=len(b),sha256=sha(b),checkedAt=now(),mode='live-read');body.write_bytes(b);meta.write_text(json.dumps(r,ensure_ascii=False))
  self.receipts[url]=r;return b
 def text(self,url):return self.get(url).decode('utf-8-sig')
def flight(text):
 chunks=[];decoder=json.JSONDecoder()
 for m in re.finditer(r'self\.__next_f\.push\(',text):
  try:
   a,_=decoder.raw_decode(text,m.end())
   if isinstance(a,list)and len(a)>1 and isinstance(a[1],str):chunks.append(a[1])
  except (ValueError,TypeError):pass
 if not chunks:raise ValueError('Missing inert Next Flight arrays')
 return ''.join(chunks)
def field(text,key):
 m=re.search('"'+re.escape(key)+'"\\s*:',text)
 if not m:raise ValueError('Missing JSON field '+key)
 pos=m.end()
 while pos<len(text)and text[pos].isspace():pos+=1
 return json.JSONDecoder().raw_decode(text,pos)[0]
def clean(s):
 s=str(s or '').replace('\\n','\n');s=re.sub(r'<(?:br\s*/?|/p|/div|/li)>','\n',s,flags=re.I);s=html.unescape(re.sub(r'<[^>]*>','',s));return re.sub(r'\n{3,}','\n\n',s).strip()
def exact_key(s):return re.sub(r'\s+','',str(s))
def list_items(text):
 rows=field(flight(text),'items')
 if not isinstance(rows,list)or len(rows)<80:raise ValueError('Partial native apostle list')
 result={}
 for row in rows:
  if row.get('released')is not True or row.get('kind')in ('trial','story','placeholder'):continue
  title=row.get('title');href=row.get('href')
  if not title or not isinstance(row.get('id'),int)or not isinstance(href,str)or not re.fullmatch(r'/(?:korea|global)/apostles/[a-z0-9-]+',href):raise ValueError('Missing exact native identity')
  key=exact_key(title)
  if key in result:raise ValueError('Duplicate native title')
  result[key]=row
 return result
def native_detail(text,item):
 value=flight(text);skills=field(value,'skills')
 if not isinstance(skills,list)or not skills:raise ValueError('Missing native skills')
 # The document's rendered identity must agree with the joined listing.
 if not re.search(r'<h1[^>]*>\s*'+re.escape(html.escape(item['title']))+r'\s*</h1>',text):raise ValueError('Article identity differs from list')
 images=[html.unescape(u)for u in re.findall(r'<img[^>]*src="([^"]+)"',text)]
 original=next((u for u in images if '/sprites/rawsprites/heroicons/'in u),None)
 if not original and item['id']==10075:original=next((u for u in images if u.endswith('/_low_ingameui/RenewaAwaken.png')or u.endswith('/ingameui/RenewaAwaken.png')),None)
 return skills,original

def inspect(b):
 with Image.open(io.BytesIO(b))as im:
  im.load()
  if im.format not in ('PNG','WEBP')or max(im.size)>10000 or min(im.size)<64:raise ValueError('Unexpected native icon/SD illustration')
  bounds=im.convert('RGBA').getchannel('A').getbbox()
  if not bounds:raise ValueError('Empty image')
  return dict(width=im.width,height=im.height,alphaBounds=dict(left=bounds[0],top=bounds[1],right=bounds[2],bottom=bounds[3]))
def source_ref(c,url):
 return next((r for r in c.get('detailSources',[])if r.get('url')==url),None)
def bind_traits(c,item,facet_icons=None):
 # Exact facet meanings and their declared same-game image, never filename guesses.
 native={'role':item['facets'].get('Role'),'position':item['facets'].get('Position'),'personality':(item['facets'].get('Synergy')or[None])[0],'faction':item['facets'].get('Race'),'damage':item['facets'].get('AttackType')}
 aliases={'Mid':'Middle','All':'Omni'}
 for t in c.get('traits',[]):
  current=t.get('value',{}).get('en');v=native.get(t['id']);current=aliases.get(current,current)
  if not v or current!=v:continue
  icon=next((r.get('iconUrl')for r in item.get('traits',[])if r.get('label')==v),None)
  icon=icon or(facet_icons or{}).get(({'position':'Position','personality':'Synergy','role':'Role','faction':'Race','damage':'AttackType'}[t['id']],v))
  if icon:t['icon']=icon

def kr_existing_tables(c,raw,source):
 out=[];converted=set();raw_by={s.get('kind'):s for s in raw}
 for section in c.get('sections',[]):
  match=re.fullmatch(r'native-skill-(low|high|normal)',section['id'])
  if not match or section.get('regions')!=['kr']:continue
  key=match[1];body=section.get('body',{}).get('ko','').strip()
  if not body:continue
  name,*rest=body.split('\n');kind={'low':'Skill','high':'Ultimate','normal':'Basic'}[key];native=raw_by.get(kind,{})
  description='\n'.join(rest)if key!='normal'else body
  if len(description)>3000:raise ValueError('Existing Korean skill text exceeds supported limit')
  table=dict(id='trickcal-kr-'+key,name=C(name if key!='normal'else'일반 공격'),nameLocale='ko',type=copy.deepcopy(TYPES[key]),sourceUrl=source,sourceKind='community',basis=BASIS_KR,description=C(description),values=[],regions=['kr'])
  if native.get('iconUrl'):table['icon']=native['iconUrl']
  out.append(table);converted.add(section['id'])
 return out,converted

def native_tables(skills,source,region,locale):
 out=[];unresolved=0
 def one(s,variant=''):
  nonlocal unresolved
  if not(s.get('desc')or s.get('detail')or s.get('detailByLevel')):return
  description=clean(s['desc']);detail=clean(s.get('detail',''))
  by=s.get('detailByLevel')or{}
  if s.get('detailLevels')==[0]and isinstance(by.get('0'),str)and not re.search(r'\{\d+\}',by['0']):description+='\n'+clean(by['0'])
  if detail and not by and not re.search(r'\{\d+\}',detail):description+='\n'+detail
  elif detail and re.search(r'\{\d+\}',detail):unresolved+=1
  if s.get('cooldown')is not None:description+='\n'+('재사용 대기시간: 'if locale=='ko'else'Cooldown: ')+str(s['cooldown'])+('초'if locale=='ko'else's')
  if len(description)>3000:raise ValueError('Native skill text exceeds supported limit')
  names=C();names[locale]=clean(s.get('name')or s['kind']);desc=C();desc[locale]=description
  table=dict(id='trickcal-'+region+'-'+str(len(out))+'-'+s['kind'].lower(),name=names,nameLocale=locale,type=copy.deepcopy(TYPES.get(s['kind'],C('고유 스킬','Unique skill','固有スキル','专属技能'))),sourceUrl=source,sourceKind='community',basis=BASIS_NATIVE,description=desc,values=[],regions=[region])
  if variant:
   for l in LOCALES:table['type'][l]+={'ko':' · 강화','en':' · Enhanced','ja':'・強化','zh':' · 强化'}[l]
  if s.get('iconUrl'):table['icon']=s['iconUrl']
  # Only resolved native per-level strings qualify. Never put unresolved {n}
  # templates into user-facing descriptions or infer intermediate coefficients.
  levels=s.get('detailLevels')or[]
  if levels and levels==list(range(1,len(levels)+1))and len(levels)<=30 and all(isinstance(by.get(str(n)),str)and not re.search(r'\{\d+\}',by[str(n)])for n in levels):
   lines=[[line.strip()for line in clean(by[str(n)]).split('\n')if line.strip()]for n in levels]
   if len(set(len(v)for v in lines))!=1:raise ValueError('Native level rows changed shape')
   table['maxLevel']=len(levels);table['values']=[]
   for ix,line in enumerate(lines[0]):
    label=clean(line.split(':',1)[0])if':'in line else'Table '+str(ix+1);labels=C();labels[locale]=label
    values=[row[ix].split(':',1)[1].strip()if':'in row[ix]and row[ix].split(':',1)[0].strip()==label else row[ix]for row in lines]
    if any(len(v)>300 for v in values):raise ValueError('Native coefficient row exceeds bound')
    table['values'].append(dict(id='native-'+str(ix),label=labels,levels=values))
  if description or table['values']:out.append(table)
 for s in skills:
  one(s)
  for extra in s.get('enhanced')or[]:one(extra,'enhanced')
 return out,unresolved

def collect(document,sources,workers=5):
 if document.get('gameId')!='trickcal':raise ValueError('Wrong roster')
 result=copy.deepcopy(document);before=[c['id']for c in result['characters']];official=sources.text(OFFICIAL);listing=sources.text(KR);items=list_items(listing);facet_icons={(d['key'],v['value']):v['iconUrl']for d in field(flight(listing),'facetDefs')for v in d.get('options',[])if v.get('iconUrl')};report=dict(gameId='trickcal',checkedAt=now(),characters=len(before),matched=0,artwork=[],missing=[],failures=[],unresolvedNativeTemplates=0,officialFirst=OFFICIAL)
 # Read the official current introduction before community sources. It is the
 # only source used for the latest Coffe row, absent from the native dump.
 report['inputPreservation']={c['id']:dict(factsSha256=canonical_hash([c.get(k)for k in ['regions','name','stats','regionalStats','rarity','rarityLabel']]),koreanSkillBodies={s['id'].replace('native-skill-',''):sha(s['body']['ko'].split('\n',1)[1].encode()if s['id']!='native-skill-normal'else s['body']['ko'].encode())for s in c.get('sections',[])if s['id'].startswith('native-skill-')and s.get('body',{}).get('ko')})for c in document['characters']}
 jobs=[]
 for i,c in enumerate(result['characters']):
  if c['id']=='coffe':continue
  item=items.get(exact_key(c['name']['ko']))
  if not item:report['missing'].append(dict(id=c['id'],reason='No exact Korean apostle name'));continue
  if not item.get('released'):report['missing'].append(dict(id=c['id'],reason='Native record is not released'));continue
  jobs.append((i,item))
 def job(pair):
  i,item=pair;c=copy.deepcopy(result['characters'][i]);url='https://wiki.cheeky.tsuncloud.com'+item['href'];raw,art=native_detail(sources.text(url),item)
  if not art:raise ValueError('No declared native SD illustration')
  b=sources.get(art);dimensions=inspect(b)
  old=c.get('image');c['image']=dict(url=art,sourceUrl=url,kind='portrait'if item['id']==10075 else'card',locale='neutral',sourceKind='community',width=dimensions['width'],height=dimensions['height'],caption=C('게임 사도 도감의 SD 카드 원본','Original SD card from the game apostle codex','ゲーム使徒図鑑のSDカード原本','游戏使徒图鉴的SD卡面原图')if item['id']!=10075 else C('게임 원본 초상 · 완전한 정적 SD 원본 미제공','Native game portrait; no complete static SD original supplied','ゲームの元ポートレート。完全な静止SD原画は未提供','游戏原始头像；未提供完整静态SD原图'))
  c['images']=list({a['url']:a for a in [*c.get('images',[]),*([old]if old else[])]if a['url']!=art}.values())[:10]
  c['sourceId']=item['id'];bind_traits(c,item,facet_icons)
  native_source=next((s['url']for s in c.get('detailSources',[])if s.get('kind')=='community'and'namu.wiki/w/'in s.get('url','')),url)
  tables,converted=kr_existing_tables(c,raw,native_source)
  if not tables:
   tables,unresolved=native_tables(raw,url,'kr','ko')
  else:unresolved=sum(bool(re.search(r'\{\d+\}',s.get('detail','')))for s in raw)
  c.setdefault('regionalSkillTables',{})['kr']=tables
  c['sections']=[s for s in c.get('sections',[])if s['id']not in converted]
  c['detailSources']=list({s['url']:s for s in [*c.get('detailSources',[]),dict(url=url,kind='community',label=C('한국 서비스 게임 테이블·원본 아이콘','Korean game tables and native icons','韓国ゲーム表・元アイコン','韩国游戏表与原图标'))]}.values())[:40]
  return i,c,dict(characterId=c['id'],sourceId=item['id'],url=art,sourceUrl=url,sha256=sha(b),bytes=len(b),**dimensions),unresolved
 with concurrent.futures.ThreadPoolExecutor(max_workers=workers)as pool:
  futures={pool.submit(job,pair):pair for pair in jobs}
  for future in concurrent.futures.as_completed(futures):
   pair=futures[future]
   try:
    i,c,art,unresolved=future.result();result['characters'][i]=c;report['artwork'].append(art);report['matched']+=1;report['unresolvedNativeTemplates']+=unresolved
   except Exception as e:report['failures'].append(dict(id=result['characters'][pair[0]]['id'],error=type(e).__name__+': '+str(e)))
 # Global skills come only from the released global list, joined by the same
 # native numerical identity. KR text/values never populate another server.
 global_items=list_items(sources.text(GLOBAL));global_by={v['id']:v for v in global_items.values()};global_jobs=[(i,global_by[c.get('sourceId')])for i,c in enumerate(result['characters'])if 'global'in c.get('regions',[])and c.get('sourceId')in global_by]
 def global_job(pair):
  i,item=pair;url='https://wiki.cheeky.tsuncloud.com'+item['href'];raw,_=native_detail(sources.text(url),item);tables,unresolved=native_tables(raw,url,'global','en');return i,tables,url,unresolved
 with concurrent.futures.ThreadPoolExecutor(max_workers=workers)as pool:
  futures={pool.submit(global_job,pair):pair for pair in global_jobs}
  for future in concurrent.futures.as_completed(futures):
   pair=futures[future]
   try:
    i,tables,url,unresolved=future.result();c=result['characters'][i];c.setdefault('regionalSkillTables',{})['global']=tables;c['detailSources']=[*c.get('detailSources',[]),dict(url=url,kind='community',label=C('글로벌 서비스 게임 스킬 표','Global game skill tables','グローバル版ゲームスキル表','国际服游戏技能表'))][:40];report['unresolvedNativeTemplates']+=unresolved
   except Exception as e:report['failures'].append(dict(id=result['characters'][pair[0]]['id'],region='global',error=type(e).__name__+': '+str(e)))
 # Renewa has only a cropped202px native portrait in the public dump. The
 # verified Korean official launch poster contains her complete matching body.
 renewa=next((v for v in result['characters']if v['id']=='renewa'and v.get('sourceId')==10075),None)
 if renewa:
  feed=json.loads(sources.text(RENEWA_FEED));content=feed.get('content',{});entry=content.get('feed',{})
  if feed.get('code')!=200 or entry.get('feedId')!=4258435 or entry.get('loungeId')!='Trickcal'or content.get('user',{}).get('userRoleCode')!='game_manager':raise ValueError('Official Renewa article identity/role changed')
  declarations=[json.loads(html.unescape(v))for v in re.findall(r"data-linkdata='([^']+)'",entry.get('contents',''))]
  if not any(v.get('src')==RENEWA_ORIGINAL and str(v.get('originalWidth'))=='1024'and str(v.get('originalHeight'))=='720'for v in declarations):raise ValueError('Reviewed original no longer declared by official Renewa article')
  b=sources.get(RENEWA_ORIGINAL);dimensions=inspect(b)
  if sha(b)!=RENEWA_HASH or (dimensions['width'],dimensions['height'])!=(1024,720):raise ValueError('Reviewed original Renewa poster bytes changed')
  old=renewa.get('image');renewa['image']=dict(url=RENEWA_ORIGINAL,sourceUrl=RENEWA_POST,sourceKind='official',kind='card',locale='ko',width=1024,height=720,caption=C('한국 공식 출시 소개 원본 · 전신 포함','Original Korean official release introduction, including the complete body','全身を含む韓国公式実装紹介の原図','包含全身的韩国官方上线介绍原图'));renewa['images']=[old,*renewa.get('images',[])][:10]if old else renewa.get('images',[]);renewa['detailSources']=[*renewa.get('detailSources',[]),dict(url=RENEWA_POST,kind='official')][:40]
  report['artwork']=[v for v in report['artwork']if v['characterId']!='renewa'];report['artwork'].append(dict(characterId='renewa',sourceId=10075,url=RENEWA_ORIGINAL,sourceUrl=RENEWA_POST,sha256=sha(b),bytes=len(b),kind='card',locale='ko',gallerySubjectBounds=dict(left=0,top=0,right=525,bottom=720),**dimensions));report['officialCard']=1
 report['globalSkillCharacters']=sum(bool(c.get('regionalSkillTables',{}).get('global'))for c in result['characters']);report['globalSkills']=sum(len(c.get('regionalSkillTables',{}).get('global',[]))for c in result['characters'])
 # Official, explicitly named current apostle: keep unknown combat stats unknown.
 coffe=next((c for c in result['characters']if c['id']=='coffe'and c['name']['ko']=='코페'),None)
 if coffe:
  matches=re.findall(r'<img[^>]*alt="코페"[^>]*src="([^"]+)"',official)
  if not matches:raise ValueError('Missing official Coffe identity/image declaration')
  asset=urllib.parse.urljoin(OFFICIAL,html.unescape(matches[-1]));b=sources.get(asset);dimensions=inspect(b)
  old=coffe.get('image');coffe['image']=dict(url=asset,sourceUrl=OFFICIAL,kind='full-body',locale='neutral',sourceKind='official',width=dimensions['width'],height=dimensions['height'],caption=C('한국 공식 사도 소개 원본','Original Korean official apostle introduction','韓国公式使徒紹介の原画','韩国官方使徒介绍原图'))
  coffe['images']=list({a['url']:a for a in [*coffe.get('images',[]),*([old]if old else[])]if a['url']!=asset}.values())[:10]
  # Existing Korean complete values remain authoritative. Bind only exact
  # declared official skill categories/icons; never invent unavailable Lv values.
  icon_urls=[urllib.parse.urljoin(OFFICIAL,html.unescape(u))for u in re.findall(r'<img[^>]*src="([^"]*?/skill_img0[123]-[^"]+)"',official)]
  raw=[dict(kind=k,iconUrl=u)for k,u in zip(['Basic','Skill','Ultimate'],icon_urls)]
  native_source=next((s['url']for s in coffe.get('detailSources',[])if s.get('kind')=='community'and'namu.wiki/w/'in s.get('url','')),OFFICIAL)
  tables,converted=kr_existing_tables(coffe,raw,native_source);coffe.setdefault('regionalSkillTables',{})['kr']=tables;coffe['sections']=[s for s in coffe.get('sections',[])if s['id']not in converted]
  coffe['detailSources']=[*coffe.get('detailSources',[]),dict(url=OFFICIAL,kind='official')][:40]
  report['artwork'].append(dict(characterId='coffe',url=asset,sourceUrl=OFFICIAL,sha256=sha(b),bytes=len(b),**dimensions));report['officialArt']=1
 if before!=[c['id']for c in result['characters']]:raise ValueError('Stable IDs/order changed')
 report['fullBodyCount']=sum(c.get('image',{}).get('kind')=='full-body'for c in result['characters']);report['krSkillCharacters']=sum(bool(c.get('regionalSkillTables',{}).get('kr'))for c in result['characters']);report['krSkills']=sum(len(c.get('regionalSkillTables',{}).get('kr',[]))for c in result['characters']);report['traitIcons']=sum(bool(t.get('icon'))for c in result['characters']for t in c.get('traits',[]));report['sources']=list(sources.receipts.values());report['checkedAt']=max(r['checkedAt']for r in report['sources']);report['nativeSDCards']=sum(c.get('image',{}).get('kind')=='card'and'/heroicons/'in c['image']['url']for c in result['characters']);report['imageImprovedCount']=report['fullBodyCount']+report['nativeSDCards']+report.get('officialCard',0);report['status']='ok'if report['imageImprovedCount']==len(before)and not report['failures']and not report['missing']else'partial';result['checkedAt']=report['checkedAt'];result['sourceVersion']='native-SD+regional-skills-v1';result['sourceUrls']=list(dict.fromkeys([*result['sourceUrls'],OFFICIAL,RENEWA_POST,KR,GLOBAL]))[:40]
 result['coverage']['fullBodyCount']=report['fullBodyCount'];result['coverage']['portraitCount']=sum(c.get('image',{}).get('kind')=='portrait'for c in result['characters']);return result,report

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--input',required=True,type=Path);ap.add_argument('--output',required=True,type=Path);ap.add_argument('--cache',required=True,type=Path);ap.add_argument('--report',required=True,type=Path);ap.add_argument('--offline',action='store_true');ap.add_argument('--workers',type=int,default=5);args=ap.parse_args();value=json.loads(args.input.read_text());doc=next(r for r in value if r['gameId']=='trickcal')if isinstance(value,list)else value
 out,report=collect(doc,Sources(args.cache,args.offline),min(6,max(1,args.workers)));args.output.parent.mkdir(parents=True,exist_ok=True);args.report.parent.mkdir(parents=True,exist_ok=True);args.output.write_bytes(packed(out));args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items()if k not in ['artwork','sources','failures','inputPreservation']},ensure_ascii=False));print('failures',len(report['failures']))
if __name__=='__main__':main()
