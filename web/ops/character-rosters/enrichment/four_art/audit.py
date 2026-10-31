#!/usr/bin/env python3
"""Bounded read-only exact-original geometry audit; never changes source pixels."""
import concurrent.futures,datetime,hashlib,io,json,pathlib,urllib.parse,urllib.request,sys,threading,time
from PIL import Image,ImageDraw
ROOT=pathlib.Path(__file__).resolve().parents[4]
TMP=pathlib.Path('/tmp/gagether-four-art-cache');TMP.mkdir(exist_ok=True)
OFFLINE='--offline' in sys.argv
MAX_CACHE_BYTES=400_000_000
quota_lock=threading.Lock()
reserved=sum(p.stat().st_size for p in TMP.glob('*.image'))
rs=json.loads((ROOT/'content/character-rosters/bootstrap.json').read_text());prior=json.loads((ROOT/'content/gallery-subject-bounds.json').read_text());manifest=json.loads((ROOT/'content/character-rosters/artwork-manifest.json').read_text())
assets={a['publicUrl']:a for a in manifest}; wanted=[]
for d in rs:
 if d['gameId'] not in ['genshin','reverse1999','limbus']:continue
 for c in d['characters']:
  a=c.get('image')
  if not a:continue
  wanted.append(dict(gameId=d['gameId'],id=c['id'],name=c['name'].get('en'),url=a['url'],kind=a['kind'],sourceUrl=a['sourceUrl']))

def inspect(item):
 global reserved
 row=dict(item);url=row['url'];local=ROOT/'public'/urllib.parse.urlsplit(url).path.lstrip('/')
 priorrow=prior['entries'].get(url)
 try:
  if local.is_file():b=local.read_bytes();mode='local-source-original'
  else:
   key=hashlib.sha256(url.encode()).hexdigest();path=TMP/(key+'.image')
   if path.is_file() and (OFFLINE or time.time()-path.stat().st_mtime<3600):b=path.read_bytes();mode='cached-replay' if OFFLINE else 'same-task-cache'
   else:
    if OFFLINE:raise ValueError('Not reached within bounded audit')
    with quota_lock:
     if reserved+4_000_000>MAX_CACHE_BYTES:raise ValueError('Bounded cache budget reached')
     reserved+=4_000_000
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-art-geometry/1.0'}),timeout=18) as r:
     if r.status!=200:raise ValueError('HTTP'+str(r.status))
     b=r.read(4_000_001)
    if len(b)>4_000_000:raise ValueError('Asset exceeds bounded read')
    path.write_bytes(b);mode='live-source-read'
  with Image.open(io.BytesIO(b)) as im:
   im.load();rgba=im.convert('RGBA');a=rgba.getchannel('A');box=a.point(lambda n:255 if n>8 else 0).getbbox();lo,hi=a.getextrema()
   if not box:raise ValueError('Empty artwork')
   transparent=lo<255;coverage=sum(a.histogram()[9:])/(im.width*im.height);background=not transparent or coverage>=.98 and box==(0,0,im.width,im.height);row.update(status='ok',width=im.width,height=im.height,sha256=hashlib.sha256(b).hexdigest(),bytes=len(b),mode=mode,background=background,alphaCoverage=coverage,alphaThreshold=8)
   if transparent:row['bounds']=dict(left=box[0]/im.width*100,top=box[1]/im.height*100,right=box[2]/im.width*100,bottom=box[3]/im.height*100,width=im.width,height=im.height)
   row['localFile']=str(local if local.is_file() else path)
 except Exception as e:
  if priorrow:row.update(status='prior-audited',mode='prior-checked-geometry',**{k:v for k,v in priorrow.items() if k in ['width','height','sha256']},bounds={k:v for k,v in priorrow.items() if k in ['left','top','right','bottom','width','height']},background=False,error=type(e).__name__+': '+str(e))
  else:row.update(status='failed',error=type(e).__name__+': '+str(e))
 return row

if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:rows=list(pool.map(inspect,wanted))
 heads=[]
 head_path=pathlib.Path(__file__).with_name('reviewed-heads.json')
 if head_path.is_file():
  reviewed=json.loads(head_path.read_text()).get('entries',[])
  for row in rows:
   found=next((h for h in reviewed if all(h.get(k)==row.get(k) for k in ['gameId','id','url','sha256','width','height'])),None)
   if not found:continue
   heads.append(found)
   if found['applyRecommendation']=='reviewed-face-first-gallery':row['head']=found['head']
   else:row['reviewedBackgroundHead']=found['head']
 result=dict(version=1,checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),alphaThreshold=8,note='Only exact original alpha rectangles. No inferred heads. Prior-audited rows retain their original evidence status. Opaque composed scenes remain background originals.',entries=rows,heads=heads)
 pathlib.Path('/tmp/gagether-four-art-framing.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({g:{'total':sum(r['gameId']==g for r in rows),'ok':sum(r['gameId']==g and r['status']=='ok' for r in rows),'prior':sum(r['gameId']==g and r['status']=='prior-audited' for r in rows),'background':sum(r['gameId']==g and r.get('background',False) for r in rows)} for g in ['genshin','reverse1999','limbus']}))
