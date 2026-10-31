"""Verify every declared new native glyph by bounded normal HTTP; no image conversion."""
import argparse,concurrent.futures,hashlib,io,json
from pathlib import Path
from PIL import Image
from collect import Sources

def collect(document,sources,workers=6):
 urls={}
 for c in document['characters']:
  for trait in c.get('traits',[]):
   if trait.get('icon'):urls.setdefault(trait['icon'],set()).add(c['id'])
  for tables in c.get('regionalSkillTables',{}).values():
   for s in tables:
    if s.get('icon'):urls.setdefault(s['icon'],set()).add(c['id'])
 rows=[];errors=[]
 def job(url):
  b=sources.get(url,2_000_000)
  with Image.open(io.BytesIO(b))as im:
   im.load()
   if im.format not in ('PNG','WEBP')or max(im.size)>2048 or min(im.size)<8 or not im.convert('RGBA').getchannel('A').getbbox():raise ValueError('Unexpected native game glyph')
   return dict(url=url,sha256=hashlib.sha256(b).hexdigest(),bytes=len(b),width=im.width,height=im.height,characterIds=sorted(urls[url]),checkedAt=sources.receipts[url]['checkedAt'])
 with concurrent.futures.ThreadPoolExecutor(max_workers=workers)as pool:
  tasks={pool.submit(job,url):url for url in urls}
  for task in concurrent.futures.as_completed(tasks):
   try:rows.append(task.result())
   except Exception as e:errors.append(dict(url=tasks[task],error=type(e).__name__+': '+str(e)))
 return dict(gameId='trickcal',status='ok'if not errors else'partial',icons=sorted(rows,key=lambda r:r['url']),errors=errors)
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--input',required=True,type=Path);ap.add_argument('--cache',required=True,type=Path);ap.add_argument('--output',required=True,type=Path);ap.add_argument('--offline',action='store_true');args=ap.parse_args();report=collect(json.loads(args.input.read_text()),Sources(args.cache,args.offline));args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':report['status'],'icons':len(report['icons']),'errors':report['errors']}))
