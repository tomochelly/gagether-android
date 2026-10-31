#!/usr/bin/env python3
"""Pin only full_image URLs actually declared in validated character source pages.
Normal public fetches; no generated paths or changes to original files.
"""
import argparse,concurrent.futures,hashlib,io,json,pathlib,urllib.request
from PIL import Image
from enrich_a import flight,json_field,now
def main():
 p=argparse.ArgumentParser();p.add_argument('--roster',required=True);p.add_argument('--source-cache',required=True);p.add_argument('--output-dir',required=True);a=p.parse_args()
 rows=json.loads(pathlib.Path(a.roster).read_text())['characters'];root=pathlib.Path(a.output_dir);root.mkdir(parents=True,exist_ok=True);cache=pathlib.Path(a.source_cache);declared=[];unavailable=[]
 for c in rows:
  key=hashlib.sha256(c['sourceUrl'].encode()).hexdigest();body=cache/(key+'.body');meta=cache/(key+'.json')
  try:
   b=body.read_bytes();m=json.loads(meta.read_text())
   if m['url']!=c['sourceUrl']or m['sha256']!=hashlib.sha256(b).hexdigest():raise ValueError('Source hash mismatch')
   d=json_field(flight(b.decode()),'character')
   if d['slug']!=c['sourceUrl'].rstrip('/').split('/')[-1]:raise ValueError('Identity mismatch')
   url=d.get('data',{}).get('full_image')
   if url and url.startswith('https://cdn.prydwen.gg/images/limbus-company/characters/'):declared.append({'characterId':c['id'],'name':c['name']['en'],'url':url,'sourceUrl':c['sourceUrl'],'sourceSha256':m['sha256']})
   else:unavailable.append({'characterId':c['id'],'status':'no-declared-full-art'})
  except Exception as e:unavailable.append({'characterId':c['id'],'status':'source-unavailable','error':str(e)})
 previous={x['url']:x for x in json.loads((root/'manifest.json').read_text()).get('assets',[])}if(root/'manifest.json').exists()else{}
 def fetch(row):
  try:
   old=previous.get(row['url'])
   if old and(root/old['file']).exists():
    b=(root/old['file']).read_bytes()
    if hashlib.sha256(b).hexdigest()!=old['sha256']:raise ValueError('Pinned original hash mismatch')
   else:
    with urllib.request.urlopen(urllib.request.Request(row['url'],headers={'User-Agent':'GAGETHER-roster-art/1.0'}),timeout=35)as r:
     if r.status!=200:raise ValueError('Expected HTTP200')
     b=r.read(16*1024*1024+1)
     if len(b)>16*1024*1024:raise ValueError('Original exceeds bound')
   im=Image.open(io.BytesIO(b));im.verify();im=Image.open(io.BytesIO(b));ext={'WEBP':'webp','PNG':'png','JPEG':'jpg'}.get(im.format)
   if not ext:raise ValueError('Unsupported original type')
   digest=hashlib.sha256(b).hexdigest();file=digest+'.'+ext;(root/file).write_bytes(b)
   return {**row,'sha256':digest,'bytes':len(b),'width':im.width,'height':im.height,'ext':ext,'file':file,'checkedAt':now()},None
  except Exception as e:return None,{**row,'status':'download-failed','error':type(e).__name__+': '+str(e)}
 assets=[];errors=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=8)as pool:
  for asset,error in pool.map(fetch,declared):
   if asset:assets.append(asset)
   if error:errors.append(error)
 result={'checkedAt':now(),'gameId':'limbus','sourceCount':len(rows),'declaredCount':len(declared),'assets':assets,'failures':errors,'unavailable':unavailable,'visualReview':'Original bytes and declared identity links checked; representative visual inspection only. This is not an individual visual review of every artwork.'}
 (root/'manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items()if k not in('assets','unavailable','failures')},ensure_ascii=False));print('Pinned',len(assets),'Failed',len(errors),'Unavailable',len(unavailable))
if __name__=='__main__':main()
