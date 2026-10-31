#!/usr/bin/env python3
"""Source-bound NTE default artwork; standard-library HTTP/JSON/PNG parsing only.
Exact native character IDs, localization keys and CharacterIllustration fields.
No guessed asset names, source JS execution, account APIs, image conversion or Site writes.
"""
from __future__ import annotations
import argparse,concurrent.futures,copy,datetime,hashlib,json,pathlib,re,struct,urllib.parse,urllib.request
ROOT='https://raw.githubusercontent.com/Waifus-Grace/NTE_Assets/'
REPO='https://github.com/Waifus-Grace/NTE_Assets'
API='https://api.github.com/repos/Waifus-Grace/NTE_Assets/'
KO_OFFICIAL='https://nte.perfectworld.com/kr/main.html'
LOCALES=('ko','en','ja','zh')
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')
def copy4(ko,en,ja,zh):return dict(zip(LOCALES,(ko,en,ja,zh)))
def normalize(s):return re.sub(r'[\s「」“”"\'·.-]','',str(s)).casefold()
def fetch(url,max_bytes=24000000,header_only=False):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-NTE-art-reference/1.0','Accept':'application/json,image/png,text/html,*/*;q=0.5'}),timeout=40)as r:
  if r.status!=200:raise ValueError('Expected HTTP200')
  b=r.read(24 if header_only else max_bytes+1)
  if len(b)>max_bytes:raise ValueError('Source exceeds bound')
 return b
class Sources:
 def __init__(self,cache):self.cache=pathlib.Path(cache);self.cache.mkdir(parents=True,exist_ok=True);self.receipts=[]
 def get(self,key,url,max_bytes=24000000):
  b=fetch(url,max_bytes);(self.cache/key).write_bytes(b);self.receipts.append({'url':url,'httpStatus':200,'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'checkedAt':now()});return b
 def json(self,key,url):return json.loads(self.get(key,url))
def path_for(row):
 value=row.get('ElementData',{}).get('CharacterIllustration',{}).get('AssetPathName','')
 if not re.fullmatch(r'/Game/UI/UI/Appearance/Fashion/2160/[A-Za-z0-9_]+\.[A-Za-z0-9_]+',value):raise ValueError('Missing/changed primary CharacterIllustration path')
 path=value.split('.')[0].replace('/Game/UI/UI/','UI/')+'.png'
 if path.split('/')[-1][:-4]!=value.split('.')[-1]:raise ValueError('Asset object/name mismatch')
 return path

def enrich(document,cache_dir,asset_dir=None,reference=None):
 if document.get('gameId')!='nte':raise ValueError('NTE input required')
 out=copy.deepcopy(document);source=Sources(cache_dir);report={'checkedAt':now(),'gameId':'nte','sources':source.receipts,'assets':[],'failures':[],'bindings':[]}
 # Follow Korean official-first research policy before community client references.
 official=source.get('official-ko.html',KO_OFFICIAL)
 if b'roleSwiper'not in official:raise ValueError('Official Korean source structure changed')
 if reference is None:
  history=source.json('readme-history.json',API+'commits?path=README.md&per_page=20');ref=None
  for candidate in history:
   sha=candidate['sha']
   if not re.fullmatch('[a-f0-9]{40}',sha):raise ValueError('Invalid source commit')
   text=source.get('README-'+sha+'.md',ROOT+sha+'/README.md').decode()
   if re.search(r'> Version:\s*[^\r\n]*\(Global\)',text):ref=sha;break
  if ref is None:raise ValueError('No explicitly declared Global source snapshot found')
 else:ref=reference
 if not re.fullmatch('[a-f0-9]{40}',ref):raise ValueError('Immutable repository reference required')
 readme=source.get('README.md',ROOT+ref+'/README.md').decode();version=re.search(r'> Version:\s*([^\r\n]+)',readme)
 report.update(sourceRef=ref,sourceVersion=version[1]if version else'Unspecified source version')
 tree=source.json('tree.json',API+'git/trees/'+ref+'?recursive=1')
 if tree.get('truncated'):raise ValueError('Incomplete original asset tree')
 files={x['path']:x for x in tree.get('tree',[])if x.get('type')=='blob'}
 data=source.json('DT_Character.json',ROOT+ref+'/DataTable/Character/DT_Character.json')
 if len(data)!=1 or data[0].get('Name')!='DT_Character':raise ValueError('Unexpected primary character table')
 native={l:source.json(l+'-game.json',ROOT+ref+'/Localization/'+l+'/game.json')for l in ['en','ko']}
 names={l:native[l]['ST_Player']for l in native};rows=data[0]['Rows'];candidates={}
 for cid,row in rows.items():
  key=row.get('ItemName',{}).get('Key');en=names['en'].get(key)
  if not en:continue
  # Dummy bat/radio Lacrimosa rows carry copied names and unrelated art. Only
  # ordinary playable manual records plus explicit protagonist gender IDs bind.
  if not row.get('bIsManual')and not(cid in ['1046','1051']and en=='Zero'):continue
  candidates.setdefault(normalize(en),[]).append((cid,row,key))
 if len(candidates)<24:raise ValueError('Incomplete native character inventory')
 assets=[]
 for char in out['characters']:
  found=candidates.get(normalize(char['name']['en']),[])
  if not found:report['failures'].append({'id':char['id'],'error':'Exact native English identity absent'});continue
  if char['name']['en']!='Zero'and len(found)!=1:raise ValueError('Ambiguous exact native identity: '+char['id'])
  for cid,row,key in found:
   ko=names['ko'].get(key)
   if not ko or(char['name'].get('ko')and normalize(ko)!=normalize(char['name']['ko'])):raise ValueError('Korean native identity mismatch: '+char['id'])
   path=path_for(row)
   if path not in files:raise ValueError('Declared original missing from complete tree: '+path)
   gender=row.get('ElementData',{}).get('CharGenderType','')
   variant='male'if gender=='ECharGenderType::male'and char['name']['en']=='Zero'else'female'if gender=='ECharGenderType::female'and char['name']['en']=='Zero'else None
   if char['name']['en']=='Zero'and not variant:raise ValueError('Protagonist gender evidence missing')
   url=ROOT+ref+'/'+urllib.parse.quote(path,safe='/')
   assets.append({'gameId':'nte','characterId':char['id'],'nativeCharacterId':cid,'name':dict(char['name']),'nativeNameKey':key,'nativeKo':ko,'sourceRef':ref,'sourceVersion':report['sourceVersion'],'sourcePath':path,'sourceUrl':REPO+'/blob/'+ref+'/DataTable/Character/DT_Character.json','sourceKind':'community','url':url,'kind':'card','locale':'neutral','genderEvidence':gender,'variantId':variant,'treeBlobSha':files[path].get('sha'),'expectedBytes':files[path].get('size')})
   report['bindings'].append({'id':char['id'],'nativeId':cid,'key':key,'en':names['en'][key],'ko':ko,'assetPath':path,'gender':gender})
 def getart(a):
  try:
   b=fetch(a['url'],max_bytes=16000000,header_only=not bool(asset_dir))
   if b[:8]!=b'\x89PNG\r\n\x1a\n'or len(b)<24:raise ValueError('Not a native PNG original')
   w,h=struct.unpack('>II',b[16:24])
   if not(500<=w<=16000 and 500<=h<=16000):raise ValueError('Invalid original dimensions')
   a={**a,'width':w,'height':h,'ext':'png','checkedAt':now()}
   if asset_dir:
    if len(b)!=a['expectedBytes']:raise ValueError('Original byte size/tree mismatch')
    gitsha=hashlib.sha1(('blob '+str(len(b))+'\x00').encode()+b).hexdigest()
    if gitsha!=a['treeBlobSha']:raise ValueError('Original Git blob hash mismatch')
    sha=hashlib.sha256(b).hexdigest();dest=pathlib.Path(asset_dir)/(sha+'.png');dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b);a.update(sha256=sha,bytes=len(b),path=str(dest))
   return a,None
  except Exception as e:return None,{'id':a['characterId'],'nativeId':a['nativeCharacterId'],'url':a['url'],'error':type(e).__name__+': '+str(e)}
 with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
  for a,error in pool.map(getart,assets):
   if a:report['assets'].append(a)
   else:report['failures'].append(error)
 grouped={}
 for a in report['assets']:
  caption=copy4('기본 외형 원본 일러스트 · 클라이언트 추출','Original default-outfit illustration · client extraction','通常衣装の原本イラスト・クライアント抽出','默认服装原始立绘・客户端提取')
  art={'url':a['url'],'sourceUrl':a['sourceUrl'],'sourceKind':'community','kind':a['kind'],'width':a['width'],'height':a['height'],'locale':a['locale'],'caption':caption}
  if a.get('variantId'):
   v=a['variantId'];art['variantId']=v;art['variantLabel']=copy4('남성'if v=='male'else'여성','Male'if v=='male'else'Female','男性'if v=='male'else'女性','男性'if v=='male'else'女性')
  grouped.setdefault(a['characterId'],[]).append(art)
 for char in out['characters']:
  valid=grouped.get(char['id'])
  if valid:
   if char['name']['en']=='Zero':
    preferred=(char.get('image')or{}).get('variantId')or'female'
    valid.sort(key=lambda image:image.get('variantId')!=preferred)
   char['image']=valid[0];char['images']=(valid[1:]+[x for x in char.get('images',[])if x['url']not in {a['url']for a in valid}])[:10]
 out['sourceUrls']=list(dict.fromkeys(out['sourceUrls']+[KO_OFFICIAL,REPO+'/blob/'+ref+'/DataTable/Character/DT_Character.json',REPO+'/blob/'+ref+'/Localization/en/game.json',REPO+'/blob/'+ref+'/Localization/ko/game.json']))[:40]
 report.update(count=len(out['characters']),upgradedCharacters=len(grouped),artCount=len(report['assets']),status='partial'if report['failures']else'ok',classification='Native default CharacterIllustration declared by exact Global source IDs; no pickup/release/schedule claim. Source canvas may stop at knees/thighs, so use card rather than full-body. Preserve source-edge cropping; do not synthesize missing anatomy.')
 return out,report

def main():
 p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--output-dir',required=True);p.add_argument('--reference');p.add_argument('--download',action='store_true');a=p.parse_args();out=pathlib.Path(a.output_dir);out.mkdir(parents=True,exist_ok=True);original=json.loads(pathlib.Path(a.input).read_text())
 try:doc,report=enrich(original,out/'sources',out/'assets'if a.download else None,a.reference)
 except Exception as e:doc=original;report={'status':'failed','error':type(e).__name__+': '+str(e),'preservedInput':True}
 (out/'nte.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n');(out/'manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items()if k not in ['sources','assets','bindings']},ensure_ascii=False))
if __name__=='__main__':main()
