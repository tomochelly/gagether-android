#!/usr/bin/env python3
"""Create contact sheets from downloaded originals without altering their bytes."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps

def main():
    p=argparse.ArgumentParser();p.add_argument('--inventory',required=True,type=Path);p.add_argument('--output-dir',required=True,type=Path);a=p.parse_args()
    inv=json.loads(a.inventory.read_text());root=a.inventory.parent;a.output_dir.mkdir(parents=True,exist_ok=True)
    assets=inv['assets'];index=[]
    for start in range(0,len(assets),196):
        chunk=assets[start:start+196];cols=14;rows=(len(chunk)+cols-1)//cols
        sheet=Image.new('RGB',(cols*84,rows*88+24),'#151c2c');draw=ImageDraw.Draw(sheet)
        draw.text((8,6),f'HSR declared native icons {start+1}-{start+len(chunk)} / {len(assets)}',fill='#f4f6fa')
        for n,r in enumerate(chunk):
            raw=(root/r['file']).read_bytes()
            if hashlib.sha256(raw).hexdigest()!=r['sha256']:raise ValueError('Original hash mismatch '+r['url'])
            with Image.open(root/r['file']) as im:
                if list(im.size)!=[r['width'],r['height']]:raise ValueError('Native dimensions changed')
                thumb=ImageOps.contain(im.convert('RGBA'),(62,62))
            x=(n%cols)*84;y=(n//cols)*88+24
            sheet.paste(thumb,(x+(84-thumb.width)//2,y),thumb)
            draw.text((x+3,y+64),f'{start+n+1:04d} {r["width"]}',fill='#dce4f1')
            index.append(dict(index=start+n+1,sheet=f'icons-{start//196+1:02d}.jpg',url=r['url'],sha256=r['sha256'],file=r['file']))
        sheet.save(a.output_dir/f'icons-{start//196+1:02d}.jpg',quality=92)
    (a.output_dir/'index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(dict(assets=len(assets),sheets=(len(assets)+195)//196)))

if __name__=='__main__':main()
