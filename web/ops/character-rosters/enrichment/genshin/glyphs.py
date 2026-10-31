#!/usr/bin/env python3
"""Join exact native ability names to public same-character genshin.dev glyph assets."""
from __future__ import annotations
import argparse,concurrent.futures,hashlib,io,json,shutil,urllib.request
from pathlib import Path
from PIL import Image
from enrich import LOCALES,ROOT,clean,now,packed,sha
BASE='https://raw.githubusercontent.com/genshindev/api/mistress/'
def candidates(source,dev,tree):
 files={r['path']for r in tree['tree']if r.get('type')=='blob'};by_name={v['name']:v for v in source};wanted=[];gaps=[]
 for path in sorted(Path(dev).glob('*.json')):
  raw=json.loads(path.read_bytes());native=by_name.get(raw.get('name'))
  if not native:continue
  slug=path.stem;types={'NORMAL_ATTACK':'combat1','ELEMENTAL_SKILL':'combat2','ELEMENTAL_BURST':'combat3'}
  records=[]
  for k,s in native.items():
   if isinstance(s,dict)and'name'in s:records.append((k,s['name']))
  def add(key,name,asset):
   match=[k for k,n in records if clean(n)==clean(name)]
   filename=native.get('images',{}).get('filename_'+key)
   p='assets/images/characters/'+slug+'/'+asset
   if key not in match or not filename or p not in files:return
   wanted.append(dict(filename=filename,nativeSkillKey=key,nativeTalentId=native['id'],nativeCharacterName=native['name'],nativeSkillName=name,sourceDocument=BASE+'assets/data/characters/'+slug+'/en.json',url=BASE+p))
  for skill in raw.get('skillTalents',[]):
   key=types.get(skill.get('type'))or('combatsp'if skill.get('unlock')=='Right Click'else None)
   if key:add(key,skill['name'],{'combat1':'talent-na','combat2':'talent-skill','combat3':'talent-burst','combatsp':'talent-passive-misc'}[key])
  for skill in raw.get('passiveTalents',[]):
   target=next((k for k,n in records if k.startswith('passive')and clean(n)==clean(skill['name'])),None)
   if target:add(target,skill['name'],'talent-passive-'+{1:'1',4:'2'}.get(skill.get('level'),'0'))
 return wanted

def constellation_candidates(native,dev,tree):
 files={r['path']for r in tree['tree']if r.get('type')=='blob'};by_name={r['name']:r for r in native};out=[]
 for path in sorted(Path(dev).glob('*.json')):
  r=json.loads(path.read_bytes());n=by_name.get(r.get('name'))
  if not n:continue
  for entry in r.get('constellations',[]):
   level=entry.get('level');key='c'+str(level);native_row=n.get(key);filename=n.get('images',{}).get('filename_'+key);p='assets/images/characters/'+path.stem+'/constellation-'+str(level)
   if level not in range(1,7)or not native_row or clean(native_row['name'])!=clean(entry['name'])or not filename or p not in files:continue
   out.append(dict(filename=filename,nativeSkillKey=key,nativeTalentId=n['id'],nativeCharacterName=n['name'],nativeSkillName=entry['name'],sourceDocument=BASE+'assets/data/characters/'+path.stem+'/en.json',url=BASE+p))
 return out

def collect(items,directory,public):
 directory=Path(directory);directory.mkdir(parents=True,exist_ok=True);records=[];errors=[]
 unique={r['url']:r for r in items}
 def one(item):
  cache=directory/(sha(item['url'].encode())+'.receipt.json')
  if cache.exists():
   old=json.loads(cache.read_bytes());b=Path(old['file']).read_bytes()
   if old['url']!=item['url']or old['sha256']!=sha(b):raise ValueError('Glyph cache mismatch')
   return old
  with urllib.request.urlopen(urllib.request.Request(item['url'],headers={'User-Agent':'GAGETHER-reference-enrichment/1.0'}),timeout=30)as r:b=r.read(2_000_001);status=r.status
  if status!=200 or len(b)>2_000_000:raise ValueError('Unexpected glyph response')
  im=Image.open(io.BytesIO(b));im.load()
  if im.format not in ('PNG','WEBP','JPEG')or min(im.size)<16 or max(im.size)>1024:raise ValueError('Not a native fact glyph')
  ext={'PNG':'png','JPEG':'jpg','WEBP':'webp'}[im.format];key=sha(b);file=directory/(key+'.'+ext);file.write_bytes(b)
  out=dict(item,sha256=key,bytes=len(b),width=im.width,height=im.height,ext=ext,file=str(file),httpStatus=status,checkedAt=now(),sourceKind='community',publicUrl='https://gagether.wiki/roster-detail-icons/'+key+'.'+ext)
  cache.write_bytes(packed(out));return out
 def job(item):
  try:return one(item),None
  except Exception as e:return None,dict(item,error=type(e).__name__+': '+str(e))
 with concurrent.futures.ThreadPoolExecutor(max_workers=10)as pool:
  for row,error in pool.map(job,unique.values()):
   if error:errors.append(error)
   else:records.append(row)
 by_url={r['url']:r for r in records};mapping={};collision=set();manifest=[]
 for item in items:
  row=by_url.get(item['url'])
  if not row:continue
  name=item['filename'];prior=mapping.get(name)
  if prior and prior!=row['publicUrl']:collision.add(name)
  mapping[name]=row['publicUrl']
 for name in collision:mapping.pop(name,None)
 public=Path(public)if public else None
 if public:public.mkdir(parents=True,exist_ok=True)
 for row in records:
  target=Path('public/roster-detail-icons')/(row['sha256']+'.'+row['ext'])
  if public:shutil.copyfile(row['file'],public/target.name)
  manifest.append({**{k:row[k]for k in ('url','sha256','bytes','width','height','ext','checkedAt','sourceKind','publicUrl')},'gameId':'genshin','path':str(target),'sourceUrl':row['sourceDocument'],'nativeTalentId':row['nativeTalentId'],'nativeSkillKey':row['nativeSkillKey'],'nativeCharacterName':row['nativeCharacterName'],'nativeSkillName':row['nativeSkillName'],'declaredFilename':row['filename']})
 remote={}
 for item in items:
  row=by_url.get(item['url'])
  if row and mapping.get(item['filename'])==row['publicUrl']:remote.setdefault(item['filename'],item['url'])
 return remote,dict(status='partial'if errors or collision else'ok',mappedFilenames=len(mapping),sourceBindings=len(items),originals=len({r['sha256']for r in records}),bytes=sum(r['bytes']for r in {r['sha256']:r for r in records}.values()),errors=errors,collisions=sorted(collision),manifest=manifest)

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--source-dir',type=Path,required=True);ap.add_argument('--dev-data',type=Path,required=True);ap.add_argument('--tree',type=Path,required=True);ap.add_argument('--directory',type=Path,default=ROOT/'glyph-originals');ap.add_argument('--public',type=Path,default=None);args=ap.parse_args()
 tree=json.loads(args.tree.read_bytes());items=candidates(json.loads((args.source_dir/'talents-en.json').read_bytes()),args.dev_data,tree)+constellation_candidates(json.loads((args.source_dir/'constellations-en.json').read_bytes()),args.dev_data,tree)
 mapping,report=collect(items,args.directory,args.public);(ROOT/'glyph-map.json').write_bytes(packed(mapping));(ROOT/'glyph-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items()if k not in ('manifest','errors')},ensure_ascii=False))
if __name__=='__main__':main()
