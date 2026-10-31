"""Verify exact source filenames on independent public material hosts."""
import concurrent.futures,datetime,hashlib,io,json,pathlib,urllib.request
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[3]
audit=json.loads((ROOT/'ops/character-rosters/materials/catalog-audit.json').read_bytes())
checks=json.loads((ROOT/'ops/character-rosters/materials/icon-checks.json').read_bytes())
jobs=[(x['game'],x['id'],'https://gi.yatta.moe/assets/UI/'+x['url'].split('/')[-1])for x in checks['results']if not x['ok']and x['game']=='genshin']
jobs += [(x['game'],x['id'],'https://schaledb.com/'+x['filename'])for x in audit.get('missingIcons',[])if x['game']=='bluearchive']
out={};receipts=[]
def fetch(pair):
 game,id,url=pair;result=dict(game=game,id=id,url=url,checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-material-reference/1.0'}),timeout=20)as r:b=r.read(4_000_001);result['status']=r.status
  if len(b)>4_000_000:raise ValueError('Image exceeds bound')
  im=Image.open(io.BytesIO(b));im.load();result.update(ok=True,width=im.width,height=im.height,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),format=im.format)
 except Exception as e:result.update(ok=False,error=type(e).__name__+': '+str(e))
 return result
with concurrent.futures.ThreadPoolExecutor(max_workers=8)as ex:
 for r in ex.map(fetch,jobs):
  receipts.append(r)
  if r['ok']:out.setdefault(r['game'],{})[r['id']]=r['url']
(ROOT/'ops/character-rosters/materials/icon-overrides.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'ops/character-rosters/materials/icon-override-checks.json').write_text(json.dumps(receipts,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'checked':len(receipts),'ok':sum(r['ok']for r in receipts),'failures':[r for r in receipts if not r['ok']]}))
