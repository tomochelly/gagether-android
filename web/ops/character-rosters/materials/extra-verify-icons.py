import pathlib,json,urllib.request,concurrent.futures,hashlib,datetime,io
from PIL import Image
root=pathlib.Path(__file__).resolve().parents[3];directory=root/'work/materials-extra-sources/icons';directory.mkdir(parents=True,exist_ok=True)
data=json.loads((root/'ops/character-rosters/materials/extra-stella-endfield.json').read_text('utf-8'))
data['icons'].update(json.loads((root/'ops/character-rosters/materials/extra-reverse.json').read_text('utf-8'))['icons'])
jobs=[(g,r)for g,v in data['icons'].items()for r in v['items']]
def get(job):
 g,r=job;p=directory/(g+'-'+r['id']+'.png');m=p.with_suffix('.receipt.json')
 try:
  if not p.exists():
   with urllib.request.urlopen(r['icon'],timeout=40)as response:b=response.read(2000000);status=response.status
   p.write_bytes(b);m.write_text(json.dumps({'url':r['icon'],'status':status,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}))
  b=p.read_bytes();image=Image.open(io.BytesIO(b));image.verify()
  return {'game':g,'id':r['id'],**json.loads(m.read_text()),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'width':image.width,'height':image.height,'format':image.format}
 except Exception as e:return {'game':g,'id':r['id'],'url':r['icon'],'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=6)as ex:results=list(ex.map(get,jobs))
(root/'ops/character-rosters/materials/extra-icon-checks.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'checked':len(results),'failed':[r for r in results if 'error'in r],'bytes':sum(r.get('bytes',0)for r in results)}))
