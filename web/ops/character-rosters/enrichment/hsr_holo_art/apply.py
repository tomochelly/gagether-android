"""Apply reviewed exact-source artwork only; never rewrite stats or owner placements."""
import copy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
def apply(rows,registries):
 out=copy.deepcopy(rows)
 for game in out:
  if game['gameId'] not in registries:continue
  entries=registries[game['gameId']]['entries'];index={str(e['id']):e for e in entries}
  if len(index)!=len(entries):raise ValueError('Duplicate artwork identity')
  if set(index)!={str(c['id']) for c in game['characters']}:raise ValueError('Artwork roster mismatch')
  for c in game['characters']:
   r=index[str(c['id'])];old=c.get('image',{});art=copy.deepcopy(old)
   art.update(url=r['url'],width=r['width'],height=r['height'])
   if game['gameId']=='holodreams':
    if old.get('url') and old['url']!=r['url']:art['preview']={k:old[k] for k in ['url','sourceUrl','width','height'] if k in old}
    art.update(kind='card',sourceKind='official',caption={'ko':'공식 게임 캐릭터 소개 일러스트 · 원본 구도','en':'Official game character introduction illustration · original composition','ja':'公式ゲームキャラクター紹介イラスト・原画の構図','zh':'官方游戏角色介绍插画 · 原始构图'})
   c['image']=art
 return out
if __name__=='__main__':
 p=ROOT/'content/character-rosters/bootstrap.json';rows=json.loads(p.read_text());registries={g:json.loads((ROOT/f'content/{g}-gallery-focus.json').read_text()) for g in ['hsr','holodreams']};out=apply(rows,registries);p.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n')
 print(json.dumps({'updated':{g:len(r['entries']) for g,r in registries.items()}}))
