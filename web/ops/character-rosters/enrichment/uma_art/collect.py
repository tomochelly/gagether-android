#!/usr/bin/env python3
"""Exact-outfit GameTora static render collector; never substitutes another outfit."""
from __future__ import annotations
import argparse,concurrent.futures,copy,datetime as dt,hashlib,io,json,re,urllib.request
from pathlib import Path
from PIL import Image

REFERENCE='https://gametora.com/umamusume/characters/100102-special-week'
DECLARATION='https://gametora.com/_next/static/chunks/7517-3e20d795f06f6ec7.js'
PREFIX='https://media.gametora.com/umamusume/characters/render/trainee/idle/'
OFFICIAL_KO='https://umamusume.kakaogames.com/'
OFFICIAL_JP='https://umamusume.jp/character/'

def now():return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z')
def sha(b):return hashlib.sha256(b).hexdigest()
def packed(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def fetch(url):
 req=urllib.request.Request(url,headers={'User-Agent':'GAGETHER-public-art-reference/1.0'})
 with urllib.request.urlopen(req,timeout=40) as r:
  b=r.read();status=r.status
 if status!=200:raise ValueError('Unexpected source status '+str(status))
 return b,dict(url=url,status=status,checkedAt=now(),bytes=len(b),sha256=sha(b))
def declared_render_url(card_id,source_script):
 # This expression is copied from the successfully read public gallery function.
 # No suffix, guessed quality variant, alternate costume ID or mirror is tried.
 if not re.fullmatch(r'\d{6}',str(card_id)):raise ValueError('Invalid source card ID')
 if '"/characters/render/trainee/idle/"' not in source_script or 'width:768,height:1024' not in source_script:
  raise ValueError('Source no longer declares the audited full static render')
 return PREFIX+str(card_id)+'.png'
def inspect_original(b,strict_render=True):
 with Image.open(io.BytesIO(b)) as im:
  im.load()
  if strict_render and (im.format!='PNG' or im.size!=(768,1024) or im.mode!='RGBA'):raise ValueError('Native full render format/dimensions changed')
  if im.format not in ('PNG','JPEG','WEBP')or im.width<1 or im.height<1:raise ValueError('Unsupported original format/dimensions')
  # Alpha bounds are metadata only. Original pixels, dimensions and bytes remain unchanged.
  bbox=im.convert('RGBA').getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
  if not bbox:raise ValueError('Empty source render')
  return dict(width=im.width,height=im.height,mode=im.mode,ext='jpg'if im.format=='JPEG'else im.format.lower(),alphaBounds=dict(left=bbox[0],top=bbox[1],right=bbox[2],bottom=bbox[3],threshold=16))
def inspect(b):return inspect_original(b)
def caption():return dict(ko='게임 3D 모델 정지 이미지 · GameTora 제공',en='Static in-game 3D model · provided by GameTora',ja='ゲーム内3Dモデルの静止画・GameTora提供',zh='游戏3D模型静态图 · GameTora提供')
def apply_records(doc,records):
 out=copy.deepcopy(doc);byid={r['characterId']:r for r in records if r.get('status')=='ok'}
 if len(byid)!=len([r for r in records if r.get('status')=='ok']):raise ValueError('Duplicate exact outfit asset')
 for c in out['characters']:
  r=byid.get(c['id'])
  if not r:continue
  # Higher-resolution official complete originals remain primary.
  if c.get('image',{}).get('kind')!='portrait':continue
  if r['url']!=PREFIX+c['id']+'.png':raise ValueError('Asset bound to another exact outfit')
  original=c.get('image');c['image']=dict(url=r['url'],sourceUrl=r['sourceUrl'],kind='full-body',width=r['width'],height=r['height'],locale='neutral',sourceKind='community',caption=caption())
  choices=c.get('images',[])
  if original and not any(a['url']==original['url']for a in choices):c['images']=[*choices,original]
 return out

def collect(doc,source_script,directory,card_data=None,include_official=False):
 directory=Path(directory);directory.mkdir(parents=True,exist_ok=True)
 card_urls={}
 for c in card_data or []:
  if not re.fullmatch(str(c['card_id'])+r'-[a-z0-9-]+',c['url_name']):raise ValueError('Invalid declared character page')
  if str(c['card_id'])in card_urls:raise ValueError('Duplicate declared card identity')
  card_urls[str(c['card_id'])]='https://gametora.com/umamusume/characters/'+c['url_name']
 targets=[c for c in doc['characters']if c.get('image',{}).get('kind')=='portrait'or include_official and c.get('image',{}).get('kind')=='full-body'and c.get('image',{}).get('sourceKind')=='official']
 def one(c):
  official=c.get('image',{}).get('kind')=='full-body';original=c.get('image',{})
  url=original['url']if official else declared_render_url(c['id'],source_script);key=sha(url.encode());meta=directory/(key+'.json')
  page=original['sourceUrl']if official else card_urls.get(c['id'],DECLARATION)
  if meta.exists():
   old=json.loads(meta.read_text());p=directory/old['file'];b=p.read_bytes()
   if old['url']!=url or sha(b)!=old['sha256']:raise ValueError('Original cache hash mismatch')
   dimensions=inspect_original(b,not official);return dict(old,characterId=c['id'],sourceId=c.get('sourceId'),sourceUrl=page,assetRole='preserved-official'if official else'replacement-game-render',**dimensions)
  b,receipt=fetch(url);dimensions=inspect_original(b,not official)
  if official and any(original.get(k)and original[k]!=dimensions[k]for k in ('width','height')):raise ValueError('Declared original dimensions changed')
  file=receipt['sha256']+'.'+dimensions['ext'];(directory/file).write_bytes(b)
  record=dict(gameId='umamusume',characterId=c['id'],sourceId=c.get('sourceId'),sourceUrl=page,expressionSourceUrl=OFFICIAL_JP if official else DECLARATION,url=url,sourceKind='official'if official else'community',kind='full-body',locale=original.get('locale','neutral')if official else'neutral',status='ok',assetRole='preserved-official'if official else'replacement-game-render',httpStatus=receipt.pop('status'),file=file,**{k:v for k,v in receipt.items()if k!='url'},**dimensions)
  if official:record['image']=copy.deepcopy(original)
  meta.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n');return record
 records=[];failures=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=6)as pool:
  futures={pool.submit(one,c):c for c in targets}
  for future in concurrent.futures.as_completed(futures):
   c=futures[future]
   try:records.append(future.result())
   except Exception as e:failures.append(dict(characterId=c['id'],sourceId=c.get('sourceId'),url=c['image']['url']if c['image'].get('sourceKind')=='official'else PREFIX+c['id']+'.png',error=type(e).__name__+': '+str(e)))
 return sorted(records,key=lambda r:r['characterId']),sorted(failures,key=lambda r:r['characterId'])

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--input',required=True,type=Path);p.add_argument('--output-dir',required=True,type=Path);p.add_argument('--source-dir',required=True,type=Path);p.add_argument('--card-data',type=Path,help='Already validated GameTora character-cards public source, used only for declared page URLs');p.add_argument('--include-official',action='store_true',help='Also audit and pin unchanged current official complete originals');p.add_argument('--use-source-cache','--offline',dest='offline',action='store_true',help='Reuse validated HTML/JS receipts; missing image originals are still fetched');a=p.parse_args();a.source_dir.mkdir(parents=True,exist_ok=True);a.output_dir.mkdir(parents=True,exist_ok=True)
 receipts=[]
 for name,url in [('official-ko',OFFICIAL_KO),('official-jp',OFFICIAL_JP),('reference',REFERENCE),('declaration',DECLARATION)]:
  body=a.source_dir/(name+'.body');meta=a.source_dir/(name+'.json')
  if not a.offline:
   b,r=fetch(url);body.write_bytes(b);meta.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
  b=body.read_bytes();r=json.loads(meta.read_text())
  if r['url']!=url or r['sha256']!=sha(b):raise ValueError('Source receipt mismatch')
  receipts.append(r)
 reference=(a.source_dir/'reference.body').read_text();decl=(a.source_dir/'declaration.body').read_text()
 if DECLARATION.removeprefix('https://gametora.com')not in reference:raise ValueError('Reference page no longer declares pinned gallery chunk; manual source update needed')
 doc=json.loads(a.input.read_text());cards=None
 if a.card_data:
  b=a.card_data.read_bytes();meta=a.card_data.with_name(a.card_data.stem+'.receipt.json');r=json.loads(meta.read_text())
  if not r['url'].startswith('https://gametora.com/data/umamusume/character-cards.')or r['sha256']!=sha(b):raise ValueError('Declared card page registry receipt mismatch')
  receipts.append(r);cards=json.loads(b)
 records,failures=collect(doc,decl,a.output_dir/'assets',cards,a.include_official);out=apply_records(doc,records)
 if {c['id']for c in out['characters']}!={c['id']for c in doc['characters']}:raise ValueError('Source identities changed')
 output=packed(out)+b'\n';(a.output_dir/'umamusume-art.json').write_bytes(output)
 manifest=dict(status='partial'if failures else'ok',checkedAt=now(),sources=receipts,originalCount=len(doc['characters']),preservedOfficialFullBody=sum(c.get('image',{}).get('kind')=='full-body'for c in doc['characters']),replacedPortraits=sum(r['assetRole']=='replacement-game-render'for r in records),downloadedFullBodyCount=len(records),remainingPortraits=sum(c.get('image',{}).get('kind')=='portrait'for c in out['characters']),assets=records,failures=failures,bytes=sum(r['bytes']for r in records),outputSha256=sha(output),note='GameTora-declared exact card_id 768x1024 static in-game 3D renders. Not gacha splash artwork, not upscaled. Existing official full-body originals and all names/regions/stats/owner frames preserved; exact old portraits retained as alternate choices.')
 (a.output_dir/'inventory.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in manifest.items()if k not in ['assets','sources']},ensure_ascii=False))
if __name__=='__main__':main()
