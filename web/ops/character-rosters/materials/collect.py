"""Read-only native material catalog collector. Writes receipts and inert JSON only."""
import concurrent.futures,datetime,hashlib,json,pathlib,re,subprocess,sys,urllib.request,urllib.parse
ROOT=pathlib.Path(__file__).resolve().parents[3]
OUT=pathlib.Path(sys.argv[1]);OUT.mkdir(parents=True,exist_ok=True)
def fetch(key,url,limit=50000000):
 p=OUT/(key+'.json');meta=OUT/(key+'.receipt.json')
 if p.exists() and meta.exists():
  b=p.read_bytes();m=json.loads(meta.read_text())
  if m['url']==url and hashlib.sha256(b).hexdigest()==m['sha256']:return b
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-material-reference/1.0'}),timeout=45) as r:
  b=r.read(limit+1)
  if len(b)>limit:raise ValueError('Source size exceeds bound')
  receipt={'url':url,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':r.status,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
 p.write_bytes(b);meta.write_text(json.dumps(receipt));return b
def zzz():
 base='https://zzz.gg';page=fetch('zzz-page',base+'/ko/characters').decode()
 for i,path in enumerate(dict.fromkeys(re.findall(r'(?:href|src)="(/_nuxt/[^\"]+\.js)"',page))):
  body=fetch('zzz-module-'+str(i),base+path).decode()
  if '../data/ko/characters.json' in body:break
 else:raise ValueError('No declared data router')
 for l,n in [('ko','ko'),('en','en'),('ja','jp'),('zh','zh-hans')]:
  pattern=re.escape('../data/'+n+'/characters.json')+r'"\s*:\s*\(\)=>[A-Za-z_$][\w$]*\(\(\)=>import\("(\./[A-Za-z0-9_-]+\.js)"'
  m=re.search(pattern,body)
  if not m:raise ValueError('Missing declared locale '+l)
  fetch('zzz-catalog-'+l,urllib.parse.urljoin(base+path,m[1]))
  parsed=subprocess.run(['node',str(ROOT/'ops/character-rosters/enrichment/zzz/parse-catalog.mjs'),str(OUT/('zzz-catalog-'+l+'.json'))],capture_output=True,check=True)
  (OUT/('zzz-'+l+'.json')).write_bytes(parsed.stdout)
 return 'zzz catalogs saved'
def known_sources():
 jobs=[]
 for l,n in [('ko','kr'),('en','en'),('ja','jp'),('zh','cn')]:
  for f in ['items','characters','character_promotions','character_skill_trees']:
   jobs.append(('hsr-'+l+'-'+f,'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/'+n+'/'+f+'.json'))
 for l in ['kr','en','jp','cn']:
  for f in ['character_table','item_table','gamedata_const']:
   jobs.append(('ark-'+l+'-'+f,'https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/'+l+'/gamedata/excel/'+f+'.json'))
 for l in ['kr','en','jp','cn']:
  for f in ['students','items']:
   jobs.append(('ba-'+l+'-'+f,'https://schaledb.com/data/'+l+'/'+f+'.json'))
 def work(pair):
  k,u=pair
  try:return {'key':k,'bytes':len(fetch(k,u))}
  except Exception as e:return {'key':k,'error':str(e)}
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
  for r in ex.map(work,jobs):print(json.dumps(r),flush=True)
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
  for f in [ex.submit(zzz),ex.submit(known_sources)]:
   try:print(f.result(),flush=True)
   except Exception as e:print(type(e).__name__,str(e),flush=True)
