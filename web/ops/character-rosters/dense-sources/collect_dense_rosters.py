#!/usr/bin/env python3
"""Read-only public source adapters for BA/Uma. No GAGETHER mutations.
Run: python collect_dense_rosters.py --refresh --workdir DIRECTORY
Missing sources abort; existing artifacts are replaced atomically only after validation.
A failed refresh must not be interpreted as an empty roster or remove owner edits.
"""
import argparse, datetime as dt, hashlib, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

LANGS=('ko','en','ja','zh')
def L(ko='',en='',ja='',zh=''): return dict(zip(LANGS,(ko,en,ja,zh)))
def raw(base,path): return base+'/'+path
BA_API='https://ba.joexyz.online/api/students'
BA_REPO='https://raw.githubusercontent.com/nico0748/SchaleDB/main'
BA_TREE='https://api.github.com/repos/nico0748/SchaleDB/git/trees/main?recursive=1'
UMA_REPO='https://raw.githubusercontent.com/daftuyda/UmaTools/main'
UMA_DATA=UMA_REPO+'/public/assets/uma_data.json'
UMA_TREE='https://api.github.com/repos/daftuyda/UmaTools/git/trees/main?recursive=1'
UMA_OFFICIAL='https://umamusume.jp/character/'

class SourceError(RuntimeError):
 def __init__(self,url,status,reason):
  self.url,self.status,self.reason=url,status,reason
  super().__init__(f'{reason}: {status} {url}')

def fetch(url):
 headers={'User-Agent':'GAGETHER-public-roster-reader/1.0','Accept':'application/json,text/html;q=0.9,*/*;q=0.5'}
 # GitHub Actions token is optional and is sent only to GitHub's API host.
 if urllib.parse.urlparse(url).hostname=='api.github.com' and os.environ.get('GITHUB_TOKEN'):
  headers['Authorization']='Bearer '+os.environ['GITHUB_TOKEN']
 for attempt in range(3):
  try:
   req=urllib.request.Request(url,headers=headers)
   with urllib.request.urlopen(req,timeout=45) as r:
    if r.status!=200:raise SourceError(url,r.status,'http-error')
    if r.headers.get('Content-Type','').startswith('text/html') and not url.endswith('/character/'):
     raise SourceError(url,r.status,'unexpected-html')
    return r.read()
  except urllib.error.HTTPError as e:
   if e.code in (401,403):raise SourceError(url,e.code,'blocked') from e
   if e.code!=429 and e.code<500:raise SourceError(url,e.code,'http-error') from e
   if attempt==2:raise SourceError(url,e.code,'rate-limited' if e.code==429 else 'transient-http-error') from e
   retry=e.headers.get('Retry-After','')
   delay=int(retry) if retry.isdigit() else 2**attempt
   if delay>30:raise SourceError(url,e.code,'retry-later') from e
   time.sleep(max(1,delay))
  except (urllib.error.URLError,TimeoutError,OSError) as e:
   if attempt==2:raise SourceError(url,None,'network-error') from e
   time.sleep(2**attempt)
 raise AssertionError('unreachable')

def read_json(p):return json.loads(p.read_text())
def write_json(p,x):
 p.parent.mkdir(parents=True,exist_ok=True);tmp=p.with_suffix('.tmp');tmp.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n');tmp.replace(p)
def decode_nuxt(a):
 memo={}
 def decode(i):
  if i<0:return None
  if i in memo:return memo[i]
  v=a[i]
  if isinstance(v,dict):
   out={};memo[i]=out;out.update({k:decode(n) for k,n in v.items()});return out
  if isinstance(v,list):
   if v and isinstance(v[0],str) and v[0] in ('Reactive','ShallowReactive','Ref'):return decode(v[1])
   if v and isinstance(v[0],str) and v[0]=='Set':return [decode(n) for n in v[1:]]
   return [decode(n) for n in v]
  return v
 return decode(0)

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--refresh',action='store_true',help='Fetch current sources even when a cache exists');ap.add_argument('--workdir','--root',dest='workdir',default=str(Path(__file__).parent/'work'));ap.add_argument('--min-bluearchive',type=int,default=278);ap.add_argument('--min-umamusume',type=int,default=271);args=ap.parse_args();root=Path(args.workdir).resolve();root.mkdir(parents=True,exist_ok=True)
 sources={'ba-current-api.json':BA_API,'nico0748-SchaleDB-tree.json':BA_TREE,'uma-uma_data.json':UMA_DATA,'daftuyda-UmaTools-tree.json':UMA_TREE,'uma-official-list.html':UMA_OFFICIAL}
 for lang in ('en','jp','kr','zh'): sources[f'ba-localization-{lang}.json']=f'{BA_REPO}/data/{lang}/localization.json'
 def fetch_source(item):
  filename,url=item
  p=root/filename
  if args.refresh or not p.exists():
   data=fetch(url)
   if filename.endswith('.json'):json.loads(data)
   else:
    if '__NUXT_DATA__' not in data.decode():raise ValueError('Official portal returned no source data')
   temp=p.with_suffix('.download');temp.write_bytes(data);temp.replace(p)
 with ThreadPoolExecutor(max_workers=4) as pool:
  list(pool.map(fetch_source,sources.items()))
 checked=dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z')
 ba=read_json(root/'ba-current-api.json');bt=read_json(root/'nico0748-SchaleDB-tree.json');bp={x['path'] for x in bt['tree']}
 if bt.get('truncated'):raise ValueError('BA asset tree truncated')
 if not isinstance(ba,list) or len(ba)<args.min_bluearchive:raise ValueError('BA source unexpectedly shrank; manual review required')
 loc={lang:read_json(root/f'ba-localization-{src}.json') for lang,src in [('ko','kr'),('en','en'),('ja','jp'),('zh','zh')]}
 def localized(section,key):return {lang:loc[lang].get(section,{}).get(key,'') for lang in LANGS}
 char=[]
 for c in ba:
  sid=str(c['schaleDbId']);jp=c.get('nameJP','');zh=c.get('nameTW','')
  # Actual source uses Japanese/English placeholders for some unsupported TW names.
  if re.search(r'[ぁ-ゖァ-ヺ]',zh) or (zh==c.get('name','') and re.search(r'[A-Za-z]',zh)):zh=''
  traits=[]
  for key,section,label in [('combatClass','SquadType',L('편성','Squad','編成','编队')),('combatRole','TacticRole',L('역할','Role','役割','职责')),('attackType','BulletType',L('공격 속성','Attack type','攻撃タイプ','攻击类型')),('defenseType','ArmorTypeLong',L('방어 속성','Armor type','防御タイプ','防御类型')),('school','SchoolLong',L('학원','School','学園','学园'))]:
   value=c[key]
   if section=='SquadType' and value=='Special':value='Support'
   t={'id':key,'label':label,'value':localized(section,value)}
   icon=None
   if key=='combatRole':icon=f'images/ui/Role_{value}.png'
   if key=='school':icon=f'images/schoolicon/School_Icon_{value.upper()}_W.png'
   if icon in bp:t['icon']=raw(BA_REPO,icon)
   traits.append(t)
  traits.append({'id':'weaponType','label':L('무기','Weapon','武器','武器'),'value':{k:c['weaponType'] for k in LANGS}})
  stats=[]
  for key,field in [('MaxHP','maxHPLevel100'),('AttackPower','atkLevel100'),('DefensePower','defLevel100'),('HealPower','healLevel100')]:
   if c.get(field) is not None:stats.append({'id':key,'label':localized('Stat',key),'value':str(c[field]),'basis':L('Lv.100 · 원본 기본 수치','Lv.100 · source base stat','Lv.100・原本の基礎値','Lv.100 · 来源基础数值')})
  regions=[]
  if c.get('isReleasedJP'):regions.append('jp')
  if c.get('isReleasedGlobal'):regions.extend(['global','kr'])
  # BA CN does not become a new independently scheduled GAGETHER service.
  x={'id':sid,'name':L(c.get('nameKR',''),c.get('name',''),jp,zh),'rarity':c['rarity'],'traits':traits,'regions':regions,'stats':stats,'sourceUrl':BA_API,'sourceKind':'community','sourceId':c['id']}
  art=f'images/student/portrait/{sid}.webp'
  if art in bp:x['image']={'url':raw(BA_REPO,art),'kind':'full-body','sourceUrl':f'https://github.com/nico0748/SchaleDB/blob/main/{art}','locale':'neutral'}
  char.append(x)
 if len({x['id'] for x in char})!=len(char):raise ValueError('Duplicate BA IDs')
 out={'gameId':'bluearchive','sourceName':"Joe's Blue Archive Tools + SchaleDB public community data",'sourceUrls':[BA_API,'https://github.com/jozsefsallai/ba-tools','https://github.com/nico0748/SchaleDB'],'checkedAt':checked,'sourceVersion':'inventory-sha256:'+hashlib.sha256((root/'ba-current-api.json').read_bytes()).hexdigest()+';art-tree:'+bt['sha'],'characters':char,'coverage':{'sourceCount':len(ba),'includedCount':len(char),'fullBodyCount':sum('image' in c for c in char),'sourceReleaseFlags':{'jp':sum(bool(c.get('isReleasedJP')) for c in ba),'global':sum(bool(c.get('isReleasedGlobal')) for c in ba),'cn':sum(bool(c.get('isReleasedCN')) for c in ba)},'note':'Includes every source outfit; JP/Global release flags retained and KR follows Global. BA CN flags are source metadata only, not a newly enabled independent service. Forms absent from the exact art tree have no image; never substitute another outfit. Source identity mapping is complete; per-image visual audit is not complete.'}}
 ba_output=out
 uma=read_json(root/'uma-uma_data.json');ut=read_json(root/'daftuyda-UmaTools-tree.json');up={x['path'] for x in ut['tree']}
 if ut.get('truncated') or len(uma)<args.min_umamusume:raise ValueError('Uma source shrank or asset tree truncated')
 html=(root/'uma-official-list.html').read_text()
 m=re.search(r'<script[^>]+id="__NUXT_DATA__"[^>]*>(.*?)</script>',html,re.S)
 if not m:raise ValueError('Official list data missing')
 official=decode_nuxt(json.loads(m.group(1)))['state']['$scharaAllList-state'];byname={c['name']:c for c in official}
 char=[]
 statlabels={'Speed':L('스피드','Speed','スピード','速度'),'Stamina':L('스태미나','Stamina','スタミナ','耐力'),'Power':L('파워','Power','パワー','力量'),'Guts':L('근성','Guts','根性','毅力'),'Wit':L('지능','Wit','賢さ','智力')}
 aptlabels={'Turf':L('잔디','Turf','芝','草地'),'Dirt':L('더트','Dirt','ダート','泥地'),'Short':L('단거리','Sprint','短距離','短距离'),'Mile':L('마일','Mile','マイル','英里'),'Medium':L('중거리','Medium','中距離','中距离'),'Long':L('장거리','Long','長距離','长距离'),'Front':L('도주','Front runner','逃げ','逃'),'Pace':L('선행','Pace chaser','先行','先行'),'Late':L('선입','Late surger','差し','居中'),'End':L('추입','End closer','追込','后追')}
 for c in uma:
  sid=str(c['UmaId']);stars=c['UmaBaseStars'];imgpath='public'+c['UmaImage']
  if imgpath not in up:raise ValueError(f'Undeclared exact portrait {sid}')
  x={'id':sid,'name':L('',f"{c['UmaName']} [{c['UmaNickname']}]",f"{c['UmaNameJP']} [{c['UmaNicknameJP']}]",''),'rarity':stars,'regions':['jp']+(['global'] if c['UmaServer']=='global' else []),'traits':[],'stats':[],'image':{'url':raw(UMA_REPO,imgpath),'kind':'portrait','sourceUrl':'https://github.com/daftuyda/UmaTools/blob/main/'+imgpath,'locale':'neutral'},'sourceUrl':UMA_DATA,'sourceKind':'community','sourceId':c['UmaSlug']}
  # Standard racewear belongs only to the original *01 form, never seasonal variants.
  o=byname.get(c['UmaNameJP'])
  vv=[] if not o else [v for v in o.get('visual',[]) if v.get('name',{}).get('title')=='勝負服']
  if sid.endswith('01') and len(vv)==1:
   im=vv[0]['image'];x['image']={'url':im['url'],'kind':'full-body','sourceUrl':UMA_OFFICIAL+o['id'],'width':im['width'],'height':im['height'],'locale':'neutral','sourceKind':'official'}
  b=c['UmaBaseStats'].get(f'{stars}★')
  if not b:raise ValueError(f'Missing base-star stats {sid}')
  basis=L(f'육성 초기 · {stars}★',f'Initial training · {stars}★',f'育成開始時・{stars}★',f'育成初始 · {stars}★')
  for key,value in b.items():x['stats'].append({'id':key.lower(),'label':statlabels[key],'value':str(value),'basis':basis})
  for section,values in c.get('UmaAptitudes',{}).items():
   for key,value in values.items():x['traits'].append({'id':f'{section}-{key}','label':aptlabels.get(key,L('',key,'','')),'value':{lang:value for lang in LANGS}})
  char.append(x)
 if len({x['id'] for x in char})!=len(char):raise ValueError('Duplicate Uma form IDs')
 out={'gameId':'umamusume','sourceName':'UmaTools public community dataset + official Japanese character artwork','sourceUrls':[UMA_DATA,'https://github.com/daftuyda/UmaTools',UMA_OFFICIAL],'checkedAt':checked,'sourceVersion':'inventory-sha256:'+hashlib.sha256((root/'uma-uma_data.json').read_bytes()).hexdigest()+';art-tree:'+ut['sha']+';official-html-sha256:'+hashlib.sha256((root/'uma-official-list.html').read_bytes()).hexdigest(),'characters':char,'coverage':{'sourceCount':len(uma),'includedCount':len(char),'fullBodyCount':sum(c['image']['kind']=='full-body' for c in char),'portraitCount':sum(c['image']['kind']=='portrait' for c in char),'officialCharacterRecords':len(official),'note':'One row per source outfit. Global rows also released in JP. Korean availability is unknown in this dataset and is not copied from JP or Global. Exact EN/JP names only; unsupported KO/ZH names remain empty. Original *01 outfits use exact Japanese-name-matched official standard racewear; alternate outfits retain exact compact portraits (sample measured at 128px), never another outfit full-body. Initial source rarity stats only; no level90 values. One official full-body sample inspected; remaining images have exact source mapping but no complete visual audit.'}}
 uma_output=out
 outputs=[('bluearchive.json',ba_output),('umamusume.json',uma_output)]
 for filename,document in outputs:
  validate_document(document)
  previous=root/'normalized'/filename
  if previous.exists() and len(document['characters'])<len(read_json(previous)['characters']):
   raise ValueError(f'{filename}: roster shrank from the previous successful output; manual review required')
 for filename,document in outputs:
  write_json(root/'normalized'/filename,document)
 write_json(root/'normalized/run.json',{'status':'success','checkedAt':checked,'files':{filename:hashlib.sha256((root/'normalized'/filename).read_bytes()).hexdigest() for filename,_ in outputs}})
 print(json.dumps({p.stem:{'count':len(read_json(p)['characters']),'coverage':read_json(p)['coverage']} for p in [root/'normalized/bluearchive.json',root/'normalized/umamusume.json']},ensure_ascii=False,indent=2))
def validate_document(document):
 def require(condition,message):
  if not condition:raise ValueError(message)
 require(isinstance(document['sourceVersion'],str),'sourceVersion must be a string')
 characters=document['characters']
 require(len(characters)==document['coverage']['sourceCount']==document['coverage']['includedCount'],'coverage counts do not match')
 require(len(characters)==len({c['id'] for c in characters}),'duplicate character ID')
 for c in characters:
  require(isinstance(c['id'],str) and bool(c['id']),'invalid character ID')
  require(set(c['name'])==set(LANGS) and any(c['name'].values()),'invalid localized character name')
  require(c['sourceKind'] in ('official','community'),'invalid source kind')
  require(set(c['regions'])<=set(('global','kr','jp','cn')),'invalid service region')
  for t in c.get('traits',[]):require(set(t['label'])==set(t['value'])==set(LANGS),'invalid localized trait')
  for stat in c.get('stats',[]):require(isinstance(stat['value'],str) and set(stat['basis'])==set(LANGS),'invalid stat basis')
  if 'image' in c:
   require(c['image']['kind'] in ('splash','full-body','card','portrait'),'invalid image kind')
   require(urllib.parse.urlparse(c['image']['url']).scheme=='https','invalid image URL')

if __name__=='__main__':
 try:main()
 except Exception as e:
  detail={'status':'failed','error':type(e).__name__,'message':str(e)}
  if isinstance(e,SourceError):detail.update(sourceUrl=e.url,httpStatus=e.status,sourceAccess=e.reason)
  print(json.dumps(detail,ensure_ascii=False),file=sys.stderr)
  sys.exit(1)

