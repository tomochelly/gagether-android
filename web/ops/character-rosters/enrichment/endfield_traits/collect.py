"""Collect only exact official Endfield operator class/element declarations."""
import argparse,concurrent.futures,copy,datetime,hashlib,io,json,re,urllib.request
from pathlib import Path
from urllib.parse import urlsplit
from PIL import Image
OFFICIAL='https://endfield.gryphline.com/ko-kr/operator'
HOST='web-static.hg-cdn.com'
CLASSES={'guard','caster','support','shielder','vanguard','assault'}
ELEMENTS={'fire','ice','electric','nature','physic'}
def digest(b):return hashlib.sha256(b).hexdigest()
def source_url(u):
 p=urlsplit(u)
 if p.scheme!='https'or p.netloc!=HOST or not p.path.startswith('/endfield/official-v4/_next/static/')or p.query or p.fragment:raise ValueError('Unexpected official source')
 return u
class Redirects(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):
  source_url(newurl)
  return super().redirect_request(req,fp,code,msg,headers,newurl)
def read(u,limit=1500000):
 with urllib.request.build_opener(Redirects()).open(u,timeout=25)as r:
  b=r.read(limit+1)
  if len(b)>limit:raise ValueError('Official source exceeds bound')
  return b

def declarations(html,css):
 characters={}
 for block in re.split(r'<div class="OperatorItem_operatorItem__[^\"]+">',html)[1:]:
  key=re.search(r'class="OperatorItem_image[^\"]+" data-key="([^\"]+)"',block)
  if not key:continue
  name=re.search(r'OperatorItem_nameText[^>]*>([^<]+)',block)
  icons=re.findall(r'class="OperatorItem_icon__[^\"]+" data-key="([^\"]+)"',block)
  if not name or len(icons)<2 or icons[0]not in CLASSES or icons[1]not in ELEMENTS or key[1]in characters:raise ValueError('Ambiguous official operator binding')
  characters[key[1]]={'nameKo':name[1],'class':icons[0],'element':icons[1]}
 if len(characters)!=35:raise ValueError('Official inventory changed; review identities')
 urls={}
 for selector,body in re.findall(r'([^{}]+)\{([^{}]*)\}',css):
  key=re.search(r'OperatorItem_icon[^{}]*\[data-key=([^\]]+)\]',selector)
  image=re.search(r'background-image:url\(([^)]+)\)',body)
  if key and image:
   key=key[1].strip('"\'')
   if key in CLASSES|ELEMENTS:
    url=source_url(image[1].strip('"\''))
    if key in urls and urls[key]!=url:raise ValueError('Conflicting official glyph')
    urls[key]=url
 if set(urls)!=CLASSES|ELEMENTS:raise ValueError('Incomplete official glyph declarations')
 return characters,urls

def enrich(roster,characters,icons):
 out=copy.deepcopy(roster)
 if out['gameId']!='endfield'or set(characters)!={c['id']for c in out['characters']}:raise ValueError('Roster identity mismatch')
 for c in out['characters']:
  declaration=characters[c['id']]
  if c['name']['ko']!=declaration['nameKo']:raise ValueError('Official name mismatch: '+c['id'])
  found=set()
  for trait in c.get('traits',[]):
   if trait['id']in('element','class'):
    trait['icon']=icons[declaration[trait['id']]]['publicUrl'];found.add(trait['id'])
  if found!={'element','class'}:raise ValueError('Missing original trait')
 return out

def main():
 p=argparse.ArgumentParser();p.add_argument('--input',type=Path,required=True);p.add_argument('--html',type=Path,required=True);p.add_argument('--css-receipts',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--assets',type=Path,required=True);p.add_argument('--evidence',type=Path,required=True);a=p.parse_args()
 original=json.loads(a.input.read_text());roster=next(r for r in original if r['gameId']=='endfield')if isinstance(original,list)else original
 html=a.html.read_text();css_receipts=json.loads(a.css_receipts.read_text());css=[]
 for row in css_receipts:
  b=Path(row['file']).read_bytes()
  if digest(b)!=row['sha256']:raise ValueError('CSS evidence changed')
  source_url(row['url']);css.append(b.decode())
 characters,urls=declarations(html,'\n'.join(css));a.assets.mkdir(parents=True,exist_ok=True)
 now=datetime.datetime.now(datetime.timezone.utc).isoformat();rows={}
 def fetch(pair):
  key,url=pair;b=read(url,1000000)
  with Image.open(io.BytesIO(b))as im:
   im.verify()
  with Image.open(io.BytesIO(b))as im:
   width,height=im.size
   if im.format!='JPEG'or not 1<=width<=1024 or not 1<=height<=1024:raise ValueError('Invalid original glyph')
  sha=digest(b);path=a.assets/(sha+'.jpg');path.write_bytes(b)
  return key,dict(gameId='endfield',url=url,publicUrl='https://gagether.wiki/roster-detail-icons/'+sha+'.jpg',path='public/roster-detail-icons/'+sha+'.jpg',sha256=sha,ext='jpg',bytes=len(b),width=width,height=height,checkedAt=now,sourceKind='official',sourceUrl=OFFICIAL,sourceField='OperatorItem_icon[data-key='+key+'] background-image')
 with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
  rows=dict(pool.map(fetch,sorted(urls.items())))
 output=enrich(roster,characters,rows);a.output.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n')
 report={'checkedAt':now,'officialUrl':OFFICIAL,'htmlSha256':digest(a.html.read_bytes()),'htmlBytes':a.html.stat().st_size,'css':[dict(url=r['url'],sha256=r['sha256'],bytes=r['bytes'])for r in css_receipts],'operatorBindings':characters,'icons':rows,'operatorCount':len(characters),'traitBindings':len(characters)*2,'uniqueGlyphs':len(rows),'originalBytes':sum(r['bytes']for r in rows.values())}
 a.evidence.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:report[k]for k in ['operatorCount','traitBindings','uniqueGlyphs','originalBytes']}))
if __name__=='__main__':main()
