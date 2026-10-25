#!/usr/bin/env python3
"""Read official, exact-role complete GFL2 character illustrations without editing pixels."""
from __future__ import annotations
import argparse,concurrent.futures,copy,datetime as dt,hashlib,html,io,json,re,urllib.parse,urllib.request
from pathlib import Path
from PIL import Image

OFFICIAL_KO='https://gf2.haoplay.com/kr/roleinfo/allroles.html'
OFFICIAL_EN='https://gf2.haoplay.com/en/roleinfo/allroles.html'
DETAIL_KO='https://gf2.haoplay.com/kr/roleinfo/'
# Existing source spelling differs from the official EN list; both lists share
# the same reviewed role ID and Korean name. Never fuzzy-match other identities.
EXACT_ALIASES={'Balthilde':'Bathilde'}

def now():return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z')
def sha(b):return hashlib.sha256(b).hexdigest()
def packed(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def clean(s):return html.unescape(re.sub('<[^>]+>',' ',s)).strip()
def fetch(url,limit=30_000_000):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-public-art-reference/1.0'}),timeout=60)as r:
  b=r.read(limit+1);status=r.status
 if status!=200 or len(b)>limit:raise ValueError('Unexpected source HTTP status or byte bound')
 return b,dict(url=url,httpStatus=status,checkedAt=now(),bytes=len(b),sha256=sha(b))
def source(cache,key,url,offline=False):
 cache=Path(cache);cache.mkdir(parents=True,exist_ok=True);body=cache/(key+'.body');meta=cache/(key+'.receipt.json')
 if not offline:
  b,r=fetch(url,3_000_000);body.write_bytes(b);meta.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
 b=body.read_bytes();r=json.loads(meta.read_text())
 if r['url']!=url or r['sha256']!=sha(b):raise ValueError('Source replay receipt mismatch')
 return b.decode(),dict(r,mode='cached-replay'if offline else'live-read')
def parse_role_list(s,minimum=59):
 rows={}
 for m in re.finditer(r'<a\s[^>]*href="([^\"]+)"[^>]*>([\s\S]*?)</a>',s):
  if 'allroles-roles-name-name-div'not in m[2]:continue
  key=re.search(r'[?&]role=(\d+)',m[1]);value=clean(m[2])
  if not key or not value:raise ValueError('Missing official role identity')
  if key[1]in rows:raise ValueError('Duplicate official role ID')
  rows[key[1]]=value
 if len(rows)<minimum or len(set(rows.values()))!=len(rows):raise ValueError('Partial or ambiguous official role list')
 return rows

def asset_url(url):
 p=urllib.parse.urlsplit(url)
 if p.scheme!='https'or p.netloc!='res.17996cdn.net'or not p.path.startswith('/gf2/')or not re.search(r'/ilus-[^/]+\.(?:png|webp)$',p.path,re.I):raise ValueError('Unexpected official full illustration URL')
 return url

def parse_complete_originals(s,minimum=59):
 rows={}
 for block in re.findall(r'<div class="role-name-des role-name-des-\d+">([\s\S]*?)(?=<div class="des-right">)',s):
  n=re.search(r'<div class="role-name">(.*?)</div>',block);u=re.findall(r'class="header-div full-img"\s+data-src="([^\"]+)"',block)
  if not n or len(u)!=1:raise ValueError('Missing exact-role full illustration declaration')
  name=clean(n[1]);url=asset_url(html.unescape(u[0]))
  if name in rows:raise ValueError('Duplicate full illustration character name')
  rows[name]=url
 if len(rows)<minimum or len(set(rows.values()))!=len(rows):raise ValueError('Partial or reused official full illustration list')
 return rows

def resolve(doc,ko_list,en_list,full):
 if doc.get('gameId')!='gfl2':raise ValueError('Wrong game')
 by_en={}
 for role_id,n in en_list.items():
  if role_id not in ko_list:continue
  k=n.casefold()
  if k in by_en:raise ValueError('Ambiguous official English identity')
  by_en[k]=(role_id,ko_list[role_id])
 out=[];failures=[]
 for c in doc['characters']:
  try:
   u=urllib.parse.urlsplit(c['sourceUrl'])
   if u.scheme!='https'or u.netloc!='gfl2.help'or urllib.parse.unquote(u.path)!='/en/characters/'+c['id']:raise ValueError('Unexpected canonical source path identity')
   name=c['name']['en'];key=EXACT_ALIASES.get(name,name).casefold()
   if key not in by_en:raise ValueError('No exact same-role official EN/KR identity')
   role_id,ko=by_en[key]
   if c.get('name',{}).get('ko')and c['name']['ko']!=ko:raise ValueError('Canonical Korean identity differs from official role')
   if ko not in full:raise ValueError('No declared complete illustration for exact official role')
   out.append(dict(characterId=c['id'],sourceId=c.get('sourceId'),canonicalSourceUrl=c['sourceUrl'],officialRoleId=role_id,officialKoreanName=ko,url=full[ko],sourceUrl=DETAIL_KO+'?role='+role_id))
  except Exception as e:failures.append(dict(characterId=c['id'],error=type(e).__name__+': '+str(e)))
 return out,failures

def inspect(b):
 with Image.open(io.BytesIO(b))as im:
  im.load()
  if im.format not in ('PNG','WEBP')or min(im.size)<700 or max(im.size)>10000:raise ValueError('Not a native complete original')
  bounds=im.convert('RGBA').getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
  if not bounds:raise ValueError('Empty original')
  return dict(width=im.width,height=im.height,mode=im.mode,ext=im.format.lower(),alphaBounds=dict(left=bounds[0],top=bounds[1],right=bounds[2],bottom=bounds[3],threshold=16))

def collect(resolved,directory):
 directory=Path(directory);directory.mkdir(parents=True,exist_ok=True)
 def one(item):
  cache=directory/(sha(item['url'].encode())+'.json')
  if cache.exists():
   old=json.loads(cache.read_text());b=(directory/old['file']).read_bytes()
   if old['url']!=item['url']or old['sha256']!=sha(b):raise ValueError('Original byte cache mismatch')
   dimensions=inspect(b)
   record=dict(old);record.update(item);record.update(dimensions);return record
  b,r=fetch(item['url']);dimensions=inspect(b);file=r['sha256']+'.'+dimensions['ext'];(directory/file).write_bytes(b)
  record=dict(item);record.update(r);record.update(dimensions);record.update(gameId='gfl2',file=file,status='ok',sourceKind='official',kind='full-body',locale='neutral')
  cache.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n');return record
 records=[];failures=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=5)as pool:
  futures={pool.submit(one,x):x for x in resolved}
  for future in concurrent.futures.as_completed(futures):
   item=futures[future]
   try:records.append(future.result())
   except Exception as e:failures.append(dict(characterId=item['characterId'],url=item['url'],error=type(e).__name__+': '+str(e)))
 return sorted(records,key=lambda x:x['characterId']),sorted(failures,key=lambda x:x['characterId'])

def caption():return dict(ko='공식 캐릭터 전체 일러스트',en='Official complete character illustration',ja='公式キャラクター全体イラスト',zh='官方角色完整立绘')
def apply_records(doc,records):
 out=copy.deepcopy(doc);byid={r['characterId']:r for r in records if r.get('status')=='ok'}
 if len(byid)!=sum(r.get('status')=='ok'for r in records):raise ValueError('Duplicate exact-character image record')
 for c in out['characters']:
  r=byid.get(c['id'])
  if not r:continue
  if r['canonicalSourceUrl']!=c['sourceUrl']or r.get('sourceId')!=c.get('sourceId'):raise ValueError('Artwork bound to another source character')
  asset_url(r['url']);original=c.get('image')
  c['image']=dict(url=r['url'],sourceUrl=r['sourceUrl'],sourceKind='official',kind='full-body',width=r['width'],height=r['height'],locale='neutral',caption=caption())
  choices=c.get('images',[])
  if original and original['url']!=r['url']and not any(a['url']==original['url']for a in choices):c['images']=[*choices,original]
 return out

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--input',required=True,type=Path);p.add_argument('--output-dir',required=True,type=Path);p.add_argument('--source-dir',required=True,type=Path);p.add_argument('--use-source-cache','--offline',dest='offline',action='store_true');a=p.parse_args();a.output_dir.mkdir(parents=True,exist_ok=True)
 sources={};receipts=[]
 # Korean official source always precedes English identity join.
 for key,url in [('official-ko',OFFICIAL_KO),('official-en',OFFICIAL_EN),('official-detail-ko',DETAIL_KO)]:
  sources[key],receipt=source(a.source_dir,key,url,a.offline);receipts.append(receipt)
 doc=json.loads(a.input.read_text());resolved,failures=resolve(doc,parse_role_list(sources['official-ko']),parse_role_list(sources['official-en']),parse_complete_originals(sources['official-detail-ko']));records,failed_assets=collect(resolved,a.output_dir/'assets');failures+=failed_assets;out=apply_records(doc,records);b=packed(out)+b'\n';(a.output_dir/'gfl2-art.json').write_bytes(b)
 inventory=dict(status='partial'if failures else'ok',checkedAt=now(),originalCount=len(doc['characters']),fullOriginalCount=len(records),bytes=sum(r['bytes']for r in records),sources=receipts,assets=records,failures=failures,outputSha256=sha(b),note='Exact official KR/EN numeric role ID join; official Korean full-img popup declarations. Complete character originals, not claimed gacha splashes. Native bytes, source dimensions and owner frames remain untouched; cropped old portraits retained as alternatives. Alpha bounds are metadata only. Failures preserve last good originals.')
 (a.output_dir/'inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in inventory.items()if k not in ('assets','sources')},ensure_ascii=False))
if __name__=='__main__':main()
