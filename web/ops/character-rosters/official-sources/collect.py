#!/usr/bin/env python3
"""Read-only official HI3/Endfield roster collector (Python stdlib + Node/TypeScript).

No credentials, owner APIs, Worker runtime, source JS evaluation, or deployment.
Outputs normalized/{hi3,endfield}.json and source-outcomes.json under --workdir.
Individual game failure preserves that game's prior successful normalized file.
"""
from __future__ import annotations
import argparse, collections, concurrent.futures, datetime, hashlib, html.parser
import json, os, pathlib, re, subprocess, sys, tempfile, threading, unicodedata
import urllib.error, urllib.parse, urllib.request

ROOT=pathlib.Path(__file__).resolve().parent
HI3_CN='https://bh3.mihoyo.com/gl/character/list?fullscreen=1&game_biz=bh3_cn&mode=fullscreen'
HI3_CONFIG={'en':('5fcd2aa439ca4aea',521,767,'en-us'), 'ko':('f4395662cb524b05',464,755,'ko-kr'), 'zh-tw':('84de1c2c34e14b58',493,756,'zh-tw'), 'ja':('9f099cd555854c14',565,771,'ja-jp')}
END_HOME='https://endfield.gryphline.com/en-us'
MAX_BYTES=16*1024*1024

def utcnow():return datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')
def atomic_write(path,content):
 path.parent.mkdir(parents=True,exist_ok=True)
 fd,tmp=tempfile.mkstemp(prefix=path.name+'.',suffix='.tmp',dir=path.parent)
 try:
  with os.fdopen(fd,'wb') as f:f.write(content)
  os.replace(tmp,path)
 finally:
  if os.path.exists(tmp):os.unlink(tmp)
def json_bytes(data):return (json.dumps(data,ensure_ascii=False,indent=2)+'\n').encode()
def read_json(path):return json.loads(path.read_text(encoding='utf-8'))
def api(locale,modern):
 app,old,new,lang=HI3_CONFIG[locale]
 return f'https://sg-public-api-static.hoyoverse.com/content_v2_user/app/{app}/getContentList?iChanId={new if modern else old}&iPageSize=200&iPage=1&sLangKey={lang}'

class Collector:
 def __init__(self,workdir,typescript):
  self.workdir=workdir;self.raw=workdir/'raw';self.raw.mkdir(parents=True,exist_ok=True)
  self.normal=workdir/'normalized';self.normal.mkdir(exist_ok=True)
  self.typescript=typescript;self.outcomes=[];self.games={};self.lock=threading.Lock()
 def record(self,row):
  with self.lock:self.outcomes.append(row)
 def fetch(self,key,url):
  row={'id':key,'url':url,'checkedAt':utcnow()}
  try:
   request=urllib.request.Request(url,headers={'User-Agent':'GAGETHER-public-roster-collector/1.0','Accept':'application/json,text/html,application/javascript;q=0.9,*/*;q=0.5'})
   with urllib.request.urlopen(request,timeout=45) as response:
    row['httpStatus']=response.status
    if response.status!=200:raise ValueError('Expected HTTP200')
    raw=response.read(MAX_BYTES+1)
    if len(raw)>MAX_BYTES:raise ValueError('Source exceeds size limit')
    row.update(status='fetched',bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest(),contentType=response.headers.get('Content-Type',''))
   path=self.raw/(key+'.data');atomic_write(path,raw);row['file']=str(path)
   self.record(row);return path
  except urllib.error.HTTPError as error:
   row.update(status='blocked' if error.code in (401,403,402) else 'rate-limited' if error.code==429 else 'http-error',httpStatus=error.code,error=str(error));self.record(row);raise
  except urllib.error.URLError as error:
   row.update(status='runtime-network-blocked' if 'Tunnel connection failed: 403' in str(error) else 'network-error',error=str(error));self.record(row);raise
  except Exception as error:
   row.update(status='error',error=f'{type(error).__name__}: {error}');self.record(row);raise
 def parse(self,mode,source,dest):
  subprocess.run(['node',str(ROOT/'parse-official.mjs'),mode,str(source),str(dest),str(self.typescript)],check=True,capture_output=True,text=True,timeout=120)
  return read_json(dest)
 def write_game(self,game,data):
  path=self.normal/(game+'.json');old=read_json(path) if path.exists() else None
  required={'id','name','sourceUrl','sourceKind'}
  rows=data['characters'];ids=[r['id'] for r in rows]
  if not rows or len(ids)!=len(set(ids)):raise ValueError('Empty/duplicate normalized IDs')
  if any(not required.issubset(r) or set(r['name'])!={'ko','en','ja','zh'} for r in rows):raise ValueError('Invalid normalized character schema')
  # A source disappearance never deletes a previously accepted character.
  retained=[]
  if old:
   for row in old['characters']:
    if row['id'] not in ids:rows.append(row);retained.append(row['id'])
  data['coverage']['includedCount']=len(rows)
  if retained:data['coverage']['retainedPreviousIds']=retained
  # Do not refresh verified-style timestamps or replace a file for unchanged roster values.
  comparable=lambda d:{k:v for k,v in d.items() if k!='checkedAt'}
  changed=not old or comparable(old)!=comparable(data)
  if changed:atomic_write(path,json_bytes(data))
  self.games[game]={'status':'success','changed':changed,'count':len(rows),'retainedPreviousIds':retained,'path':str(path),'checkedAt':utcnow()}
 def run_game(self,game,fn):
  try:self.write_game(game,fn(self))
  except Exception as error:
   detail=error.stderr.strip()[-2500:] if isinstance(error,subprocess.CalledProcessError) and error.stderr else str(error)
   self.games[game]={'status':'failed','error':f'{type(error).__name__}: {detail}','preservedPrevious':(self.normal/(game+'.json')).exists(),'checkedAt':utcnow()}
   print(game+': '+self.games[game]['error'],file=sys.stderr)

class Scripts(html.parser.HTMLParser):
 def __init__(self):super().__init__();self.sources=[]
 def handle_starttag(self,tag,attrs):
  if tag=='script':
   src=dict(attrs).get('src')
   if src:self.sources.append(src)

def collect_endfield(c):
 home=c.fetch('endfield-home',END_HOME);parser=Scripts();parser.feed(home.read_text(encoding='utf-8'))
 # Only original public scripts declared by the official page; no endpoint guessing.
 urls=list(dict.fromkeys(urllib.parse.urljoin(END_HOME,u) for u in parser.sources))
 urls=[u for u in urls if urllib.parse.urlparse(u).scheme=='https' and urllib.parse.urlparse(u).hostname=='web-static.hg-cdn.com' and '/endfield/' in u and '.js' in urllib.parse.urlparse(u).path]
 if not urls:raise ValueError('Official homepage declared no expected Endfield JS')
 if len(urls)>80:raise ValueError('Unexpected script inventory size')
 manifest=[]
 def fetch_script(pair):
  i,url=pair;return {'url':url,'file':str(c.fetch(f'endfield-script-{i}',url))}
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  for item in pool.map(fetch_script,enumerate(urls)):manifest.append(item)
 manifest_path=c.raw/'endfield-manifest.json';atomic_write(manifest_path,json_bytes(manifest))
 parsed=c.parse('endfield',manifest_path,c.raw/'endfield-parsed.json')
 core=parsed['core']['value'];native={l:v['value'] for l,v in parsed['locales'].items()};art=parsed['art']
 labels={'element':{'ko':'속성','en':'Element','ja':'属性','zh':'属性'},'class':{'ko':'클래스','en':'Class','ja':'職分','zh':'职业'},'faction':{'ko':'소속','en':'Faction','ja':'陣営','zh':'阵营'},'race':{'ko':'종족','en':'Race','ja':'種族','zh':'种族'}}
 chars=[]
 for row in core:
  key=row['key'];name={l:d['operator.content.'+key+'.name'] for l,d in native.items()};traits=[]
  for field,translation in [('element','operator.elem.'+row['elem']),('class','operator.prof.'+row['prof']),('faction','operator.camps.'+str(row['camp'])),('race','operator.races.'+str(row['race']))]:
   value={l:d.get(translation,'') for l,d in native.items()}
   if not all(value.values()):raise ValueError('Incomplete native attribute '+key+' '+field)
   traits.append({'id':field,'label':labels[field],'value':value})
  image={'url':art[key],'kind':'splash','sourceUrl':parsed['artMapSource']}
  metadata=next((m for m in parsed['metadata'] if m['src']==image['url']),None)
  if metadata:image.update(width=metadata['width'],height=metadata['height'])
  # Actual inspected full original includes the English proper-name label.
  # Other uninspected art is not silently declared text-free/neutral.
  if key=='perlica' and image['url']=='https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/perlica.6710bc97.png':image['locale']='en'
  chars.append({'id':key,'name':name,'rarity':row['rarity'],'traits':traits,'image':image,'regions':['global'],'sourceUrl':END_HOME+'#operator','sourceKind':'official'})
 return {'gameId':'endfield','sourceName':'Arknights: Endfield official operator showcase','sourceUrls':list(dict.fromkeys([END_HOME,parsed['core']['url'],parsed['artMapSource']]+[v['url'] for v in parsed['locales'].values()])),'checkedAt':utcnow(),'characters':chars,'coverage':{'sourceCount':len(core),'includedCount':len(chars),'note':'Published official showcase, including both Endministrator forms and officially announced operators; not a per-service acquisition list. Numeric combat stats are not in this source. Uninspected images are not asserted language-neutral; Perlica original has an English name label.'}}

class NameNormalizer:
 def __init__(self):
  self.chars={};self.phrases={}
  for file,target in [('TSCharacters.txt',self.chars),('TSPhrases.txt',self.phrases)]:
   for line in (ROOT/file).read_text(encoding='utf-8').splitlines():
    if line and not line.startswith('#'):
     a,b=line.split('\t');target[a]=b.split()[0]
  self.pattern=re.compile('|'.join(map(re.escape,sorted(self.phrases,key=len,reverse=True))))
 def __call__(self,text):
  text=self.pattern.sub(lambda m:self.phrases[m[0]],text)
  text=''.join(self.chars.get(ch,ch) for ch in text)
  text=unicodedata.normalize('NFKC',text).replace('△','Δ').lower()
  text=re.sub(r'(?i)(en[0-9]?|english|角色详情页|角色页|女武神内页|女武神页|女武神角色列表|角色列表|女武神详情页|详情页|角色资讯|详情页面)','',text)
  return re.sub(r'[\s\u200b·・「」『』《》×x\-：:！!]','',text)

def collect_hi3(c):
 cnpath=c.fetch('hi3-cn-roster',HI3_CN);data=c.parse('cn',cnpath,c.raw/'hi3-cn-parsed.json')['data'][0]
 cn=data['allRoleList']
 if len(cn)<100:raise ValueError('CN roster incomplete: '+str(len(cn)))
 normal=NameNormalizer();byname={normal(r['name']):r['contentId'] for r in cn};canonical={r['contentId']:r for r in cn}
 if len(byname)!=len(cn) or len(canonical)!=len(cn):raise ValueError('Duplicate CN canonical name/identity')
 native_rows=[]
 def fetch_native(pair):
  locale,modern=pair;file=c.fetch('hi3-'+locale+('-modern' if modern else '-legacy'),api(locale,modern));j=read_json(file)
  if j.get('retcode')!=0:raise ValueError('Official CMS retcode '+str(j.get('retcode')))
  rows=j['data']['list'];total=int(j['data']['iTotal'])
  minimum=15 if modern else 75
  if len(rows)!=total or total<minimum:raise ValueError('Incomplete native CMS '+locale)
  return locale,modern,rows
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  results=list(pool.map(fetch_native,[(l,m) for l in HI3_CONFIG for m in [False,True]]))
 for locale,modern,source_rows in results:
  channel=HI3_CONFIG[locale][2 if modern else 1]
  for row in source_rows:
   ext=json.loads(row['sExt']);name=ext.get('armorName') if modern else ext.get(f'{channel}_{0 if locale=="ja" else 1}')
   if not isinstance(name,str) or not name.strip():raise ValueError('Missing native suit name '+str(row['iInfoId']))
   art=(ext.get('bigImg') if modern else ext.get(f'{channel}_3')) or []
   if not art or not isinstance(art[0],dict) or not art[0].get('url','').startswith('https://'):raise ValueError('Missing native original '+str(row['iInfoId']))
   urls=[]
   for key in ['avatar','bigImg',f'{channel}_{4 if locale=="ja" else 0}',f'{channel}_{49 if locale=="ja" else 44}',f'{channel}_3']:
    if isinstance(ext.get(key),list):urls.extend(a.get('url','') for a in ext[key] if isinstance(a,dict))
   tokens={m[1] for u in urls if (m:=re.search(r'/([0-9a-f]{32})_\d+\.',u))}
   ids={byname[normal(v)] for v in [row['sTitle'],name] if normal(v) in byname}
   if len(ids)>1:raise ValueError('Ambiguous exact native identity '+str(row['iInfoId']))
   native_rows.append({'locale':locale,'modern':modern,'row':row,'ext':ext,'name':name.strip(),'art':art[0],'tokens':tokens,'cnId':next(iter(ids),None),'method':'exact-native-name' if ids else None})
 # Reviewed official CMS metadata defects; exact native CMS IDs AND strings guard drift.
 exceptions={('zh-tw',112415):('希兒·芙樂艾','129973','死生之律者'),('zh-tw',111429):('終未協理0017','129970','终末协理0017')}
 for row in native_rows:
  key=(row['locale'],row['row']['iInfoId'])
  if key in exceptions:
   native_name,cid,cn_name=exceptions[key]
   if row['name']!=native_name or canonical.get(cid,{}).get('name')!=cn_name:raise ValueError('Reviewed CMS exception changed; re-review '+str(key))
   row['cnId']=cid;row['method']='reviewed-official-CMS-exception'
 for _ in range(4):
  index=collections.defaultdict(set)
  for row in native_rows:
   if row['cnId']:
    for token in row['tokens']:index[token].add(row['cnId'])
  for row in native_rows:
   if row['cnId']:continue
   ids={next(iter(index[t])) for t in row['tokens'] if len(index[t])==1}
   if len(ids)>1:raise ValueError('Ambiguous official artwork identity '+str(row['row']['iInfoId']))
   if ids:row['cnId']=next(iter(ids));row['method']='unique-official-asset-identity'
 unmatched=[{'locale':r['locale'],'cmsId':r['row']['iInfoId'],'name':r['name']} for r in native_rows if not r['cnId']]
 if unmatched:raise ValueError('Unmapped native records require identity review: '+json.dumps(unmatched,ensure_ascii=False))
 byid=collections.defaultdict(dict)
 for row in native_rows:
  if row['locale'] in byid[row['cnId']]:raise ValueError('Duplicate native identity')
  byid[row['cnId']][row['locale']]=row
 types={'1':{'ko':'생물','en':'Biologic','ja':'生物','zh':'生物'},'2':{'ko':'이능','en':'Psychic','ja':'異能','zh':'异能'},'3':{'ko':'기계','en':'Mecha','ja':'機械','zh':'机械'},'4':{'ko':'양자','en':'Quantum','ja':'量子','zh':'量子'},'5':{'ko':'허수','en':'Imaginary','ja':'虚数','zh':'虚数'},'6':{'ko':'성진','en':'Stardust','ja':'星屑','zh':'星尘'}}
 elements={'1':{'ko':'물리','en':'Physical','ja':'物理','zh':'物理'},'2':{'ko':'화염','en':'Fire','ja':'炎','zh':'火焰'},'3':{'ko':'뇌전','en':'Lightning','ja':'雷','zh':'雷电'},'4':{'ko':'빙결','en':'Ice','ja':'氷','zh':'冰冻'}}
 labels={'type':{'ko':'타입','en':'Type','ja':'タイプ','zh':'类型'},'element':{'ko':'속성','en':'Damage type','ja':'ダメージ属性','zh':'伤害属性'},'weapon':{'ko':'무기','en':'Weapon','ja':'武器','zh':'武器'}}
 chars=[];audit=[]
 for row in cn:
  native=byid[row['contentId']];names={l:native[l]['name'] if l in native else '' for l in ['ko','en','ja']};names['zh']=row['name']
  images=[]
  for locale in ['en','ko','ja']:
   if locale in native:
    n=native[locale];images.append({'url':n['art']['url'],'kind':'splash','locale':locale,'sourceUrl':api(locale,n['modern'])})
  if row.get('long'):images.append({'url':row['long'],'kind':'splash','locale':'zh','sourceUrl':HI3_CN})
  if not images:raise ValueError('Canonical suit has no exact full illustration')
  traits=[]
  for key,field,enum in [('type','propertyId',types),('element','harmId',elements)]:
   if row[field] not in enum:raise ValueError('New official enum requires review '+key+' '+row[field])
   traits.append({'id':key,'label':labels[key],'value':enum[row[field]]})
  weapon={l:'' for l in ['ko','en','ja','zh']}
  for locale,n in native.items():
   value=n['ext'].get('weaponName') or (n['ext'].get('565_1') if locale=='ja' else None)
   if value:weapon['zh' if locale=='zh-tw' else locale]=value.strip()
  if any(weapon.values()):traits.append({'id':'weapon','label':labels['weapon'],'value':weapon})
  cid='hi3-'+row['contentId'];chars.append({'id':cid,'name':names,'traits':traits,'image':images[0],'images':images,'sourceUrl':HI3_CN,'sourceKind':'official'})
  audit.append({'id':cid,'cnName':row['name'],'nativeSources':{l:{'cmsId':str(n['row']['iInfoId']),'url':api(l,n['modern']),'name':n['name'],'method':n['method']} for l,n in native.items()}})
 atomic_write(c.workdir/'hi3-identity-audit.json',json_bytes(audit))
 coverage={l:sum(bool(r['name'][l]) for r in chars) for l in ['ko','en','ja','zh']}
 return {'gameId':'hi3','sourceName':'Honkai Impact 3rd official CN roster and native EN/KR/JP/TW public showcase APIs','sourceUrls':[HI3_CN]+[api(l,m) for l in HI3_CONFIG for m in [False,True]],'checkedAt':utcnow(),'characters':chars,'coverage':{'sourceCount':len(cn),'includedCount':len(chars),'nativeNameCounts':coverage,'baseIdentityCount':len(data['valkyrieList']),'note':'Official showcased battlesuits, not base identities. Native showcase gaps remain empty and do not imply service non-release. Published showcase does not establish current banner/acquisition availability. Numeric combat statistics and initial rank are not supplied. Illustration variants are linked only to the same exact suit identity; native locale is preserved.'}}

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--workdir',type=pathlib.Path,required=True);parser.add_argument('--typescript',type=pathlib.Path);parser.add_argument('--game',choices=['hi3','endfield','all'],default='all');args=parser.parse_args()
 workdir=args.workdir.resolve();typescript=(args.typescript or workdir/'node_modules/typescript/lib/typescript.js').resolve()
 if not typescript.is_file():parser.error('Install typescript@5.9.3 under --workdir, or pass --typescript /absolute/path/to/typescript/lib/typescript.js')
 c=Collector(workdir,typescript);started=utcnow()
 for game,fn in [('hi3',collect_hi3),('endfield',collect_endfield)]:
  if args.game in ('all',game):c.run_game(game,fn)
 report={'startedAt':started,'finishedAt':utcnow(),'status':'success' if all(g['status']=='success' for g in c.games.values()) else 'partial-failure' if any(g['status']=='success' for g in c.games.values()) else 'failed','games':c.games,'sources':c.outcomes}
 atomic_write(workdir/'source-outcomes.json',json_bytes(report))
 print(json.dumps({'status':report['status'],'games':c.games,'report':str(workdir/'source-outcomes.json')},ensure_ascii=False))
 return 0 if report['status']=='success' else 1
if __name__=='__main__':raise SystemExit(main())
