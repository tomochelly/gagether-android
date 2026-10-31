"""Verify exact original bytes and create inspection-only contact sheets."""
import argparse,hashlib,json,math
from pathlib import Path
from PIL import Image,ImageDraw

def audit(rows,output):
 output=Path(output);output.mkdir(parents=True,exist_ok=True);unique={}
 for r in rows:
  if r['sha256']in unique:continue
  p=Path(r['localPath']);raw=p.read_bytes()
  if len(raw)!=r['bytes']or hashlib.sha256(raw).hexdigest()!=r['sha256']:raise ValueError('Original bytes changed '+str(p))
  with Image.open(p)as im:
   if im.size!=(r['width'],r['height']):raise ValueError('Original dimensions changed')
   im.verify()
  unique[r['sha256']]=r
 entries=sorted(unique.values(),key=lambda r:r['url']);sheets=[]
 for batch in range(math.ceil(len(entries)/100)):
  subset=entries[batch*100:(batch+1)*100];cols=10;cw=120;ch=144
  im=Image.new('RGB',(cols*cw,math.ceil(len(subset)/cols)*ch),'#182332');draw=ImageDraw.Draw(im)
  for i,row in enumerate(subset):
   x=(i%cols)*cw;y=(i//cols)*ch
   draw.rectangle((x+4,y+4,x+115,y+115),fill='#596675')
   with Image.open(row['localPath'])as source:
    preview=source.convert('RGBA');preview.thumbnail((104,104));im.paste(preview,(x+60-preview.width//2,y+60-preview.height//2),preview)
   label=row['url'].split('/static/images/')[-1]
   draw.text((x+4,y+118),label[-20:],fill='white');draw.text((x+4,y+131),row['sha256'][:8],fill='#A5C9E6')
  path=output/f'icons-{batch+1:02}.jpg';im.save(path,quality=90);sheets.append(str(path))
 report=dict(sourceIdentities=len(rows),uniqueOriginals=len(unique),uniqueBytes=sum(r['bytes']for r in unique.values()),maxWidth=max(r['width']for r in unique.values()),maxHeight=max(r['height']for r in unique.values()),sheets=sheets)
 (output/'audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');return report
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--inventory',required=True);p.add_argument('--output',required=True);a=p.parse_args();print(json.dumps(audit(json.loads(Path(a.inventory).read_text()),a.output)))
