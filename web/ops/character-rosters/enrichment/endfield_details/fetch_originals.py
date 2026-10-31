#!/usr/bin/env python3
"""Recover only the declared pinned native PNG originals. No generic downloader."""
import datetime,hashlib,json,re,struct,urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parent
REPOSITORY='555me/EndfieldAssets'
PIN='966ed92d2556386a37e4ec076a812ff46ca2fae9'
PREFIX='assets/beyond/dynamicassets/gameplay/ui/'

def main():
 manifest=json.loads((ROOT/'source-manifest.json').read_text());selected_bytes=(ROOT/'selected-assets.json').read_bytes()
 if manifest['assetRepository']!=REPOSITORY or manifest['assetPin']!=PIN or manifest['assetPrefix']!=PREFIX or hashlib.sha256(selected_bytes).hexdigest()!=manifest['selectedAssetsSHA256']:raise ValueError('Reviewed source identity changed')
 selected=json.loads(selected_bytes);target=ROOT/'originals';target.mkdir(exist_ok=True)
 prior_path=ROOT/'originals-manifest.json';prior={r['nativeIconId']:r for r in json.loads(prior_path.read_text())}if prior_path.exists()else{}
 def fetch(pair):
  name,declared=pair;path=PurePosixPath(declared['path'])
  if not re.fullmatch(r'[a-zA-Z0-9_]+',name)or path.is_absolute()or'..'in path.parts or path.suffix!='.png':raise ValueError('Unexpected native glyph identity')
  url='https://raw.githubusercontent.com/'+REPOSITORY+'/'+PIN+'/'+PREFIX+str(path);local=target/(name+'.png')
  cached=local.exists()
  if cached:original=local.read_bytes()
  else:
   with urllib.request.urlopen(url,timeout=25)as response:
    if response.status!=200:raise ValueError('Native original HTTP failure')
    original=response.read(1_000_001)
  if len(original)>1_000_000:raise ValueError('Native glyph exceeds1MB')
  git=hashlib.sha1(b'blob '+str(len(original)).encode()+b'\0'+original).hexdigest()
  if git!=declared['sha']or len(original)!=declared['size']:raise ValueError('Native original differs from pinned source tree')
  if original[:8]!=b'\x89PNG\r\n\x1a\n':raise ValueError('Native original is not PNG')
  width,height=struct.unpack('>II',original[16:24])
  if any(not 1<=v<=2048 for v in [width,height]):raise ValueError('Native glyph dimensions invalid')
  sha=hashlib.sha256(original).hexdigest()
  if cached and name in prior and prior[name].get('sha256')==sha and prior[name].get('url')==url:return prior[name]
  if not cached:local.write_bytes(original)
  return {'nativeIconId':name,'url':url,'sourceUrl':'https://github.com/'+REPOSITORY+'/blob/'+PIN+'/'+PREFIX+str(path),'assetPath':PREFIX+str(path),'gitBlobSha':git,'sha256':sha,'bytes':len(original),'width':width,'height':height,'localFile':str(local.relative_to(ROOT)),'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 # Finish all exact-byte checks before replacing the receipt. Failed source
 # reads never turn into a successful manifest or replace a changed local file.
 rows=list(ThreadPoolExecutor(max_workers=6).map(fetch,selected.items()))
 prior_path.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(rows),'bytes':sum(r['bytes']for r in rows),'unchangedNativePixels':True}))
if __name__=='__main__':main()
