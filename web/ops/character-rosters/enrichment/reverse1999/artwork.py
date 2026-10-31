#!/usr/bin/env python3
"""Pin declared native drawing/card paths to exact character/skin IDs.

Downloads preserve bytes. QA contact sheets, if desired, are separate scratch
artifacts; no resized source is published by this collector.
"""
from __future__ import annotations
import argparse,io,json
from pathlib import Path
from PIL import Image
from enrich import C,packed,sha,unique_character

REPO='https://github.com/myssal/Reverse-1999-CN-Asset'

def plans(doc,sources):
 sources=Path(sources);commit=json.loads((sources/'asset-commit.json').read_text())['sha']
 if len(commit)!=40:raise ValueError('Invalid immutable asset commit')
 trees={key:{r['path']:r for r in json.loads((sources/('asset-'+key+'-tree.json')).read_text())['tree']if r['type']=='blob'}for key in ['headicon_img','fight','characterget']}
 mappings={r['id']:r for r in json.loads((sources/'ArcanistMap.json').read_text())}
 native=json.loads((sources/'cn/character.json').read_text());rows=[];missing=[];identities=[];icons={};traits={}
 for c in doc['characters']:
  hero=unique_character(c,native,{})
  if not hero:missing.append({'id':c['id'],'reason':'No exact native CN identity'});continue
  mapping=mappings.get(hero['id'])
  if not mapping:missing.append({'id':c['id'],'reason':'No exact asset-map hero ID'});continue
  identities.append({'id':c['id'],'heroId':hero['id'],'skinId':hero['skinId']})
  base={'characterId':c['id'],'heroId':hero['id'],'skinId':hero['skinId'],'variant':'base','caption':C('기본 원본 일러스트','Original base illustration','初期オリジナルイラスト','初始原始立绘')}
  variants=[base]
  for skin in mapping.get('live2d',[]):
   if skin.get('des')=='进阶皮肤'and skin['id']!=hero['skinId']:
    variants.append({'characterId':c['id'],'heroId':hero['id'],'skinId':skin['id'],'variant':'insight','caption':C('통찰 해금 원본 일러스트','Original Insight-unlocked illustration','洞察解放オリジナルイラスト','洞悉解锁原始立绘')})
  for variant in variants:
   path=str(variant['skinId'])+'.png';item=trees['headicon_img'].get(path)
   if not item:missing.append({'id':c['id'],'variant':variant['variant'],'reason':'No declared exact skin PNG'});continue
   asset='singlebg/headicon_img/'+path
   rows.append({**variant,'path':asset,'gitBlobSha':item['sha'],'url':'https://raw.githubusercontent.com/myssal/Reverse-1999-CN-Asset/'+commit+'/'+asset,'sourceUrl':REPO+'/blob/'+commit+'/'+asset,'kind':'full-body','sourceKind':'community','locale':'neutral'})
  # Career IDs come directly from character.career and the actual exported
  # character-get glyph inventory; no inferred URL is accepted.
  import re
  careers=[p for p in trees['characterget']if (m:=re.fullmatch(r'charactercareer_big_(\d+)\.png',p))and int(m[1])==hero['career']]
  career=careers[0]if len(careers)==1 else None
  if career:
   path='singlebg/characterget/'+career;traits[c['id']]={'afflatus':'https://raw.githubusercontent.com/myssal/Reverse-1999-CN-Asset/'+commit+'/'+path}
 for path,item in trees['fight'].items():
  if path.startswith('skill/')and path.endswith('.png'):
   name=Path(path).stem
   if name.isdigit():icons[name]='https://raw.githubusercontent.com/myssal/Reverse-1999-CN-Asset/'+commit+'/singlebg/fight/'+path
 return rows,{'assetCommit':commit,'identities':identities,'missing':missing,'skillIcons':icons,'traitIcons':traits}

def inspect(b):
 with Image.open(io.BytesIO(b))as im:
  im.load()
  if im.format!='PNG'or min(im.size)<50 or max(im.size)>10000:raise ValueError('Invalid native PNG')
  alpha=im.convert('RGBA').getchannel('A');bounds=alpha.point(lambda v:255 if v>16 else 0).getbbox()
  if not bounds:raise ValueError('Empty source image')
  return {'width':im.width,'height':im.height,'alphaBounds':{'left':bounds[0],'top':bounds[1],'right':bounds[2],'bottom':bounds[3],'threshold':16},'hasTransparency':alpha.getextrema()[0]<255}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--input',required=True,type=Path);ap.add_argument('--sources',required=True,type=Path);ap.add_argument('--output',required=True,type=Path);args=ap.parse_args()
 data=json.loads(args.input.read_text());doc=next(d for d in data if d['gameId']=='reverse1999')if isinstance(data,list)else data
 rows,index=plans(doc,args.sources)
 # Source-declared exact URLs are deliverable without a bulk download. Metadata
 # is not mislabeled as per-image byte/pixel verification. Browser image decode
 # will use each original's natural dimensions when no inspected size is known.
 index.update(records=[{**r,'verification':'exact-native-skin-and-declared-asset-path'}for r in rows],failures=[],status='partial'if index['missing']else'ok',networkImageReads=0)
 args.output.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':index['status'],'records':len(rows),'base':sum(r['variant']=='base'for r in rows),'insight':sum(r['variant']=='insight'for r in rows),'networkImageReads':0,'missing':len(index['missing'])}))
if __name__=='__main__':main()
