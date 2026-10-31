"""Read-only bounded source refresh, with hash receipts; no site writes."""
import concurrent.futures,datetime,hashlib,json,pathlib,urllib.request
OUT=pathlib.Path(__file__).resolve().parents[3]/'work/materials-recovery'
OUT.mkdir(parents=True,exist_ok=True)
def fetch(key,url):
 p=OUT/(key+'.json');m=OUT/(key+'.receipt.json')
 if p.exists() and m.exists():
  meta=json.loads(m.read_bytes());b=p.read_bytes()
  if meta['url']==url and meta['sha256']==hashlib.sha256(b).hexdigest():return json.loads(b)
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-source-reference/1.0'}),timeout=35)as r:
  b=r.read(30_000_001)
  if len(b)>30_000_000:raise ValueError('Source size bound exceeded')
  obj=json.loads(b);status=r.status
 p.write_bytes(b);m.write_text(json.dumps(dict(url=url,checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),status=status,bytes=len(b),sha256=hashlib.sha256(b).hexdigest())))
 return obj
jobs=[('genshin-materials-'+l,'https://genshin-db-api.vercel.app/api/v5/materials?query=names&matchCategories=true&verboseCategories=true&resultLanguage='+lang)for l,lang in [('ko','Korean'),('ja','Japanese'),('zh','ChineseSimplified')]]
jobs+=[('ark-assets-root','https://api.github.com/repos/fexli/ArknightsResource/git/trees/main'),('ba-config','https://schaledb.com/data/config.json')]
def one(pair):
 try:
  d=fetch(*pair)
  if pair[0]=='ark-assets-root':
   print(json.dumps({'root':d['tree']}),flush=True)
   for x in d['tree']:
    if x['path'] in ['items','item','itempack']:
     fetch('ark-assets-'+x['path'],'https://api.github.com/repos/fexli/ArknightsResource/git/trees/'+x['sha'])
  print(pair[0],'OK',len(d),flush=True)
 except Exception as e:print(pair[0],type(e).__name__,str(e),flush=True)
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=5)as pool:list(pool.map(one,jobs))
