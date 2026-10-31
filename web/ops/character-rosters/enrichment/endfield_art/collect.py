"""Inspect only Endfield's exact existing official showcase originals; never re-encode them."""
import argparse,concurrent.futures,hashlib,html,io,json,re,time,urllib.request
from datetime import datetime,timezone
from pathlib import Path
from PIL import Image
KO='https://endfield.gryphline.com/ko-kr/operator'
HOST='https://web-static.hg-cdn.com/endfield/official-v4/'
LIMIT=16_000_000

def digest(b):return hashlib.sha256(b).hexdigest()
def fetch(url,cache):
 if url!=KO and not url.startswith(HOST):raise ValueError('Unregistered official source host')
 p=cache/(digest(url.encode())+'.original');rp=p.with_suffix('.receipt.json')
 if p.exists()and rp.exists():
  r=json.loads(rp.read_text());b=p.read_bytes()
  if r['url']!=url or digest(b)!=r['sha256']:raise ValueError('Changed local source cache')
  return b,r
 req=urllib.request.Request(url,headers={'User-Agent':'GAGETHER source artwork audit'})
 with urllib.request.urlopen(req,timeout=30)as response:
  if response.status!=200 or response.url!=url:raise ValueError('Unexpected source response')
  b=response.read(LIMIT+1)
  if len(b)>LIMIT:raise ValueError('Original exceeds16MB bounded download')
  r={'url':url,'status':response.status,'mime':response.headers.get('Content-Type',''),'bytes':len(b),'sha256':digest(b),'checkedAt':datetime.now(timezone.utc).isoformat()}
 p.write_bytes(b);rp.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');return b,r

def declared_map(script,name):
 m=re.search(r'\b'+re.escape(name)+r'=\{(.*?)\}',script)
 if not m:raise ValueError('Official declared map missing')
 refs=dict(re.findall(r'([A-Za-z_$][\w$]*)=a\((\d+)\)',script[:m.start()]))
 modules=dict(re.findall(r'(\d+):\(e,t,a\)=>\{a\.d\(t,\{A:\(\)=>A\}\);let A=\{src:"([^"]+)"',script))
 values={}
 for item in re.finditer(r'([a-z0-9]+):(?:"([^"]+)"|([A-Za-z_$][\w$]*)\.A\.src)',m.group(1)):
  key,url,ref=item.groups();values[key]=url or modules[refs[ref]]
 if len(values)!=35:raise ValueError('Expected35 current declared originals')
 return values

def inspect(b):
 image=Image.open(io.BytesIO(b));image.load()
 if image.format!='PNG':raise ValueError('Expected exact declared PNG')
 alpha=image.convert('RGBA').getchannel('A');bbox=alpha.point(lambda a:255 if a>8 else 0).getbbox()
 if not bbox:raise ValueError('Empty artwork')
 w,h=image.size
 return {'width':w,'height':h,'mode':image.mode,'alphaThreshold':8,'alphaBounds':{'left':bbox[0]/w*100,'top':bbox[1]/h*100,'right':bbox[2]/w*100,'bottom':bbox[3]/h*100},'hasTransparency':alpha.getextrema()[0]<255}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--bootstrap',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);ap.add_argument('--cache',type=Path,required=True);a=ap.parse_args();a.output.mkdir(parents=True,exist_ok=True);a.cache.mkdir(parents=True,exist_ok=True)
 roster=next(r for r in json.loads(a.bootstrap.read_text())if r['gameId']=='endfield')
 body,page=fetch(KO,a.cache);source=body.decode();scripts=re.findall(r'<script[^>]+src="([^"]+)"',source)
 url=next(u for u in scripts if re.search(r'/6753-[a-f0-9]+\.js$',u));raw,chunk=fetch(url,a.cache);script=raw.decode();declared=declared_map(script,'W');previews=declared_map(script,'F')
 existing={c['id']:c for c in roster['characters']}
 if set(existing)!=set(declared):raise ValueError('Stable roster vs official source identity mismatch')
 if any(c['image']['url']!=declared[c['id']]for c in roster['characters']):raise ValueError('Existing original is no longer same official declaration; inspect before replacing')
 def one(c):
  art=c['image'];b,r=fetch(art['url'],a.cache);facts=inspect(b);name=r['sha256']+'.png';p=a.output/name;p.write_bytes(b)
  return {'gameId':'endfield','characterId':c['id'],'name':c['name'],'url':art['url'],'sourceUrl':KO,'declaredSourceUrl':url,'kind':art['kind'],'sourceKind':'official','locale':art.get('locale'),'path':str(p),'sha256':r['sha256'],'bytes':len(b),'mime':'image/png',**facts,'delivery':'source-original','status':'ok','unchanged':True,'receipt':r}
 with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:rows=list(pool.map(one,roster['characters']))
 b,r=fetch(previews['perlica'],a.cache);perlica={'url':previews['perlica'],'sourceUrl':KO,'declaredSourceUrl':url,**r,**inspect(b),'path':str(a.output/'perlica-list-original.png')};(a.output/'perlica-list-original.png').write_bytes(b)
 report={'version':1,'gameId':'endfield','checkedAt':datetime.now(timezone.utc).isoformat(),'sourcePages':[page,chunk],'stableIdsPreserved':True,'originalUrlsUnchanged':True,'count':len(rows),'bytes':sum(r['bytes']for r in rows),'originals':rows,'perlicaListAlternative':perlica,'visualReview':'pending'}
 (a.output/'audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'count':len(rows),'bytes':report['bytes'],'output':str(a.output/'audit.json')}))
if __name__=='__main__':main()
