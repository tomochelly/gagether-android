#!/usr/bin/env python3
"""Official HoYoWiki headers, joined only by exact existing Korean character names."""
from __future__ import annotations
import argparse,concurrent.futures,copy,hashlib,io,json,re,urllib.parse,urllib.request
from pathlib import Path
from PIL import Image
from enrich import ROOT,now,packed,sha
BASE='https://sg-wiki-api.hoyolab.com/hoyowiki/wapi/'
HEADERS={'User-Agent':'GAGETHER-reference-enrichment/1.0','x-rpc-language':'ko-kr','x-rpc-wiki_app':'genshin','x-rpc-client_type':'4','Content-Type':'application/json','Origin':'https://wiki.hoyolab.com','Referer':'https://wiki.hoyolab.com/'}

def source(key,url,directory,body=None,refresh=False):
 directory=Path(directory);directory.mkdir(parents=True,exist_ok=True);p=directory/(key+'.json');m=p.with_suffix('.meta.json')
 if refresh or not p.exists():
  req=urllib.request.Request(url,data=packed(body)if body is not None else None,headers=HEADERS,method='POST'if body is not None else'GET')
  with urllib.request.urlopen(req,timeout=35)as r:b=r.read(8_000_001);status=r.status
  if status!=200 or len(b)>8_000_000:raise ValueError('Unexpected official source response')
  d=json.loads(b)
  if d.get('retcode')!=0:raise ValueError('Official source returned error '+str(d.get('retcode')))
  p.write_bytes(b);m.write_bytes(packed(dict(url=url,body=body,httpStatus=status,bytes=len(b),sha256=sha(b),checkedAt=now())))
 b=p.read_bytes();meta=json.loads(m.read_bytes())
 if meta['url']!=url or meta['body']!=body or meta['sha256']!=sha(b):raise ValueError('Official source cache mismatch')
 return json.loads(b)['data'],meta

def list_rows(directory,refresh=False):
 rows=[];receipts=[];total=1;page=1
 while len(rows)<total:
  body=dict(filters=[],menu_id='2',page_num=page,page_size=50,use_es=True)
  data,receipt=source('list-'+str(page),BASE+'get_entry_page_list',directory,body,refresh);part=data.get('list',[]);total=int(data['total'])
  if total>300 or not part:raise ValueError('Partial or unbounded official character index')
  rows+=part;receipts.append(receipt);page+=1
  if page>6:raise ValueError('Official pagination bound exceeded')
 if len({r['entry_page_id']for r in rows})!=len(rows):raise ValueError('Duplicate official entry ID')
 return rows,receipts

def asset_url(url):
 u=urllib.parse.urlsplit(url)
 if u.scheme!='https'or u.hostname not in ('act-webstatic.hoyoverse.com','upload-static.hoyoverse.com','webstatic.hoyoverse.com','act-upload.hoyoverse.com')or u.username or u.password or u.port or not re.search(r'\.(png|webp|jpg|jpeg)$',u.path,re.I):raise ValueError('Unexpected official original URL')
 return url

def header_caption(ident):
 if ident in ('10000117','10000118'):
  return {'ko':'남녀 별인형이 함께 등장하는 HoYoWiki 공용 소개 원본','en':'Shared HoYoWiki header showing male and female Manekin together.','ja':'男女のドールを一緒に描くHoYoWiki共用紹介原本','zh':'同时展示男女奇偶的HoYoWiki共用介绍原图。'}
 return {'ko':'HoYoWiki 캐릭터 소개 원본 · 가장자리 페이드 포함','en':'Original HoYoWiki character header; native edge fade retained.','ja':'HoYoWikiキャラクター紹介の原本・元の縁ぼかしを保持','zh':'HoYoWiki角色介绍原图，保留原始边缘淡化。'}

def collect(document,directory,assets,refresh=False,only_missing=True):
 if document['gameId']!='genshin':raise ValueError('Wrong game')
 rows,index_receipts=list_rows(directory,refresh);by_name={}
 for r in rows:by_name.setdefault(r['name'],[]).append(r)
 assets=Path(assets);assets.mkdir(parents=True,exist_ok=True)
 targets=[c for c in document['characters']if not only_missing or not c.get('image')]
 def one(c):
  ident=c['id'];name=c['name']['ko'];matches=by_name.get(name,[])
  if len(matches)!=1:raise ValueError('No unique exact Korean official character identity')
  entry=str(matches[0]['entry_page_id']);data,receipt=source('entry-'+entry,BASE+'entry_page?entry_page_id='+entry,directory,refresh=refresh);page=data['page']
  if str(page['id'])!=entry or page['name']!=name or str(page['menu_id'])!='2' or page.get('beta')or page.get('status')!='Online':raise ValueError('Official character detail identity/status mismatch')
  url=asset_url(page['header_img_url']);cache=assets/(sha(url.encode())+'.receipt.json')
  if cache.exists():
   old=json.loads(cache.read_bytes());b=Path(old['file']).read_bytes()
   if old['url']!=url or old['sha256']!=sha(b):raise ValueError('Original byte cache mismatch')
   return {**old,'characterId':ident,'sourceId':c.get('sourceId',int(ident)),'nativeName':name,'officialEntryId':entry,'sourceUrl':'https://wiki.hoyolab.com/pc/genshin/entry/'+entry+'?lang=ko-kr','pageReceipt':receipt,'kind':'card','caption':header_caption(ident)}
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-reference-enrichment/1.0'}),timeout=40)as response:b=response.read(25_000_001);status=response.status
  if status!=200 or len(b)>25_000_000:raise ValueError('Unexpected original image response')
  im=Image.open(io.BytesIO(b));im.load()
  if im.format not in ('PNG','WEBP','JPEG')or min(im.size)<700 or max(im.size)>15000:raise ValueError('Not a complete high-resolution character header')
  ext={'PNG':'png','WEBP':'webp','JPEG':'jpg'}[im.format];digest=sha(b);path=assets/(digest+'.'+ext);path.write_bytes(b)
  alpha=im.convert('RGBA').getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
  if not alpha:raise ValueError('Empty original')
  record=dict(gameId='genshin',characterId=ident,sourceId=c.get('sourceId',int(ident)),nativeName=name,officialEntryId=entry,url=url,sourceUrl='https://wiki.hoyolab.com/pc/genshin/entry/'+entry+'?lang=ko-kr',sourceKind='official',declaredField='page.header_img_url',sha256=digest,bytes=len(b),width=im.width,height=im.height,ext=ext,file=str(path),alphaBounds=dict(left=alpha[0],top=alpha[1],right=alpha[2],bottom=alpha[3],threshold=16),httpStatus=status,checkedAt=now(),pageReceipt=receipt,kind='card',locale='neutral',caption=header_caption(ident))
  cache.write_bytes(packed(record));return record
 results=[];failures=[]
 def run(c):
  try:return one(c),None
  except Exception as e:return None,dict(characterId=c['id'],name=c['name'],error=type(e).__name__+': '+str(e))
 with concurrent.futures.ThreadPoolExecutor(max_workers=6)as pool:
  for record,error in pool.map(run,targets):
   if error:failures.append(error)
   else:results.append(record)
 return dict(status='partial'if failures else'ok',targetCount=len(targets),references=len(results),originals=len({r['sha256']for r in results}),bytes=sum(r['bytes']for r in {r['sha256']:r for r in results}.values()),records=results,failures=failures,indexReceipts=index_receipts)

def apply(document,report):
 result=copy.deepcopy(document);by_id={r['characterId']:r for r in report['records']}
 for c in result['characters']:
  r=by_id.get(c['id'])
  if not r:continue
  if c['name']['ko']!=r['nativeName']:raise ValueError('Source name changed before art application')
  prior=c.get('image');c['image']=dict(url=r['url'],sourceUrl=r['sourceUrl'],kind=r['kind'],width=r['width'],height=r['height'],locale='neutral',sourceKind='official',caption=r.get('caption',{'ko':'HoYoWiki 캐릭터 소개 원본 · 가장자리 페이드 포함','en':'Original HoYoWiki character header; native edge fade retained.','ja':'HoYoWikiキャラクター紹介の原本・元の縁ぼかしを保持','zh':'HoYoWiki角色介绍原图，保留原始边缘淡化。'}))
  if prior and prior['url']!=r['url']:c['images']=[prior,*[a for a in c.get('images',[])if a['url']not in (prior['url'],r['url'])]][:10]
  c.setdefault('detailSources',[]).append(dict(url=r['sourceUrl'],kind='official'))
 return result

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);ap.add_argument('--source-dir',type=Path,required=True);ap.add_argument('--assets',type=Path,default=ROOT/'art-originals');ap.add_argument('--report',type=Path,default=ROOT/'art-manifest.json');ap.add_argument('--refresh',action='store_true');args=ap.parse_args();d=json.loads(args.input.read_bytes());d=next(r for r in d if r['gameId']=='genshin')if isinstance(d,list)else d
 report=collect(d,args.source_dir,args.assets,args.refresh);args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');args.output.write_bytes(packed(apply(d,report)));print(json.dumps({k:v for k,v in report.items()if k not in ('records','indexReceipts')},ensure_ascii=False))
if __name__=='__main__':main()
