"""Read/decode source-declared originals. Records failures honestly; never substitutes images."""
import concurrent.futures,datetime,hashlib,io,json,pathlib,urllib.request
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[3]
OUT=ROOT/'work/materials-recovery/icon-checks';OUT.mkdir(parents=True,exist_ok=True)
d=json.loads((ROOT/'content/roster-material-icons.json').read_bytes())
jobs=[(g,i)for g,c in d['games'].items()for i in c['items']if i.get('icon')and g in ['zzz','genshin','hsr','arknights','bluearchive']]
def one(pair):
 game,item=pair;url=item['icon'];key=hashlib.sha256(url.encode()).hexdigest();meta=OUT/(key+'.json')
 if meta.exists():return json.loads(meta.read_bytes())
 result=dict(game=game,id=item['id'],url=url,checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-material-reference/1.0'}),timeout=15)as r:
   b=r.read(4_000_001);result['status']=r.status
  if len(b)>4_000_000:raise ValueError('Original exceeds icon byte bound')
  im=Image.open(io.BytesIO(b));im.load();result.update(bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),width=im.width,height=im.height,format=im.format,ok=True)
 except Exception as e:result.update(ok=False,error=type(e).__name__+': '+str(e))
 meta.write_text(json.dumps(result));return result
with concurrent.futures.ThreadPoolExecutor(max_workers=10)as pool:results=list(pool.map(one,jobs))
summary={g:dict(total=sum(x['game']==g for x in results),success=sum(x['game']==g and x['ok']for x in results),failed=sum(x['game']==g and not x['ok']for x in results))for g in d['games']if any(x['game']==g for x in results)}
(ROOT/'ops/character-rosters/materials/icon-checks.json').write_text(json.dumps(dict(summary=summary,results=results),ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(summary))
