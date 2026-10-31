import pathlib,json,urllib.request,concurrent.futures,hashlib,io,datetime
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[3];FILE=pathlib.Path(__file__).with_name('remaining-native.json')
data=json.loads(FILE.read_bytes());urls=sorted({i['icon']for g in data['icons'].values()for i in g['items']if i.get('icon')})
def one(url):
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-material-reference/1.0'}),timeout=30)as r:b=r.read(12_000_001);status=r.status
  if len(b)>12_000_000:raise ValueError('Image byte bound')
  with Image.open(io.BytesIO(b))as im:im.load();width,height=im.size;fmt=im.format
  return dict(url=url,status=status,width=width,height=height,format=fmt,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
 except Exception as e:return dict(url=url,error=str(e))
with concurrent.futures.ThreadPoolExecutor(max_workers=6)as pool:results=list(pool.map(one,urls))
by={r['url']:r for r in results};bad=[]
for game,cat in data['icons'].items():
 for item in cat['items']:
  if not item.get('icon'):continue
  r=by[item['icon']]
  if 'error'in r:bad.append({'game':game,'id':item['id'],**r});item.pop('icon');item.pop('sprite',None);continue
  item.update(width=r['width'],height=r['height'])
  if'sprite'in item:
   s=item['sprite']
   if s['x']<0 or s['y']<0 or s['x']+s['width']>r['width']or s['y']+s['height']>r['height']:raise ValueError('Atlas region outside original')
data['imageReceipts']=results
if bad:data['gaps'].append({'game':'multiple','detail':'Native images failed loading or decoding; exact names/costs kept with no replacement image.','failures':bad})
FILE.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(json.dumps({'images':len(results),'failed':len(bad),'atlas':by[next(i['icon']for i in data['icons']['dna']['items']if i.get('sprite'))],'failures':bad},ensure_ascii=False))
