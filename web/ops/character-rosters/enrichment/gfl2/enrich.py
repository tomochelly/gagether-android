#!/usr/bin/env python3
"""Exact-ID GFL2 HELP skill/key enrichment, without changing artwork or release flags.

Generated complete rosters/cache bodies are canonical/private workflow outputs,
never public-repository fixtures. Public original-language facts are preserved.
"""
from __future__ import annotations
import argparse, concurrent.futures, copy, datetime as dt, hashlib, html, io, json, os
from pathlib import Path
import re, sys, urllib.parse, urllib.request
sys.path.insert(0,str(Path(__file__).resolve().parent.parent))
from enrich_b import unpack_character
LOCALES=('ko','en','ja','zh')
ORIGIN='https://gfl2.help'
OFFICIAL='https://gf2.haoplay.com/kr/roleinfo/allroles.html'

def C(ko='',en='',ja='',zh=''):return dict(zip(LOCALES,(ko,en,ja,zh)))
def native(s):return C(en=clean(s))
def now():return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z')
def packed(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
def sha(v):return hashlib.sha256(v).hexdigest()
def atomic(path,obj):
 path=Path(path);path.parent.mkdir(parents=True,exist_ok=True);p=path.with_suffix(path.suffix+'.tmp');p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n');p.replace(path)
def clean(s):
 s=re.sub(r'<#[0-9A-Fa-f]{3,8}:([^<>]*)>',r'\1',str(s or ''))
 s=re.sub(r'\{!([^{}]+)\}',lambda m:'[effect name unavailable]' if m[1].isdigit() else m[1],s)
 s=html.unescape(re.sub(r'<[^>]+>','',s)).replace('**','').strip()
 if re.search(r'<#|\{!',s):raise ValueError('Unrecognized source markup')
 return s

def source_url(c):
 u=urllib.parse.urlsplit(c['sourceUrl'])
 if u.scheme!='https' or u.netloc!='gfl2.help' or not u.path.startswith('/en/characters/') or u.query:raise ValueError('Unexpected exact source identity')
 if urllib.parse.unquote(u.path.removeprefix('/en/characters/'))!=c['id']:raise ValueError('Source path/id mismatch')
 return urllib.parse.urlunsplit((u.scheme,u.netloc,urllib.parse.quote(urllib.parse.unquote(u.path),safe='/:'),'',''))

def read_source(c,cache,refresh=False):
 u=source_url(c);cache=Path(cache);cache.mkdir(parents=True,exist_ok=True)
 key=sha(c['id'].encode())[:24];p=cache/(key+'.html');meta=cache/(key+'.meta.json')
 if refresh or not p.exists():
  req=urllib.request.Request(u,headers={'User-Agent':'GAGETHER-PublicRosterDetails/1.0'})
  with urllib.request.urlopen(req,timeout=40)as r:body=r.read(3_000_001);status=r.status
  if status!=200 or len(body)>3_000_000:raise ValueError('Unexpected source body')
  data=unpack_character(body.decode())
  if data.get('name','').casefold()!=c['name']['en'].casefold():raise ValueError('Exact character source name mismatch')
  p.write_bytes(body);atomic(meta,dict(url=u,status=status,checkedAt=now(),bytes=len(body),sha256=sha(body)))
 body=p.read_bytes();receipt=json.loads(meta.read_text())
 if receipt['url']!=u or sha(body)!=receipt['sha256']:raise ValueError('Source cache hash mismatch')
 data=unpack_character(body.decode())
 if data.get('name','').casefold()!=c['name']['en'].casefold():raise ValueError('Cached character identity mismatch')
 return data,body.decode(),receipt

def declared_icons(raw):
 return {urllib.parse.urljoin(ORIGIN,html.unescape(s)) for s in re.findall(r'<img[^>]+src=["\']([^"\']+)["\']',raw) if s.startswith('/static/images/') and re.search(r'\.(?:png|webp|svg)$',s)}

def pick_icon(declared, suffix):
 matches=[u for u in declared if urllib.parse.unquote(urllib.parse.urlsplit(u).path).endswith(suffix)]
 if len(matches)>1:raise ValueError('Ambiguous original icon')
 return matches[0] if matches else None

BASIS=C('GFL2 HELP 영어 원문 · 기본 스킬은 돌파 강화 전. 최신 데이터베이스 판본이며 서버별 적용 시점은 별도 확인.',
 'GFL2 HELP English original. Base skills are before Fortification upgrades. Latest database revision; regional implementation dates are not asserted.',
 'GFL2 HELP英語原文。基本スキルは凸強化前。現行DB版であり、各サーバーの適用時期は未確定。',
 'GFL2 HELP英语原文。基础技能不含椎体强化。现行数据库版本，不据此断言各区服实装时间。')
PANEL=C('GFL2 HELP 원문 표시값 · 레벨·돌파·장비·뉴럴 헬릭스 기준 미표기. 다른 서버의 동일 패널임을 단정하지 않음.',
 'GFL2 HELP displayed panel; level, Fortification, equipment and Neural Helix basis unspecified. Not asserted as identical across services.',
 'GFL2 HELP掲載値。レベル・凸・装備・ニューラルヘリックス条件の記載なし。各サーバー同一値とは断定しない。',
 'GFL2 HELP页面值，未注明等级、椎体、装备或神经螺旋条件；不据此断言各区服相同。')
SKILL_TYPES={'basic':C('일반 공격','Basic attack','通常攻撃','普通攻击'),'active':C('액티브 스킬','Active skill','アクティブスキル','主动技能'),'ultimate':C('결전기','Ultimate','必殺技','制胜技'),'passive':C('패시브','Passive','パッシブ','被动')}
META={'stability_damage':C('안정 피해','Stability damage','体勢ダメージ','稳态伤害'),'cooldown':C('쿨타임','Cooldown','クールダウン','冷却'),'range':C('사거리','Range','射程','射程'),'effect_range':C('효과 범위','Effect area','効果範囲','效果范围'),'cost':C('리몰딩 지수 소모','Confectance cost','調律指数消費','导染指数消耗')}
STAT={'health':C('HP','HP','HP','生命值'),'attack':C('공격력','ATK','攻撃力','攻击力'),'defense':C('방어력','DEF','防御力','防御力'),'stability':C('안정 지수','Stability','体勢値','稳态指数'),'mobility':C('이동력','Mobility','移動力','移动力')}
STAT_SUFFIX={'health':'/hp_icon.png','attack':'/atk_icon.png','defense':'/def_icon.png','stability':'/stability_icon.png','mobility':'/mobility_icon.png'}

def make_table(id,name,type,description,source,icon=None,values=(),basis=BASIS):
 if not description or len(description)>3000:raise ValueError('Missing or excessive source prose '+id)
 t=dict(id=id,name=native(name),type=type,nameLocale='en',description=native(description),sourceUrl=source,sourceKind='community',basis=basis,values=list(values))
 if icon:t['icon']=icon
 return t

def enrich_character(c,data,raw,common_icons=()):
 c=copy.deepcopy(c);c.setdefault('sourceId',c['id']);u=source_url(c);declared=declared_icons(raw)|set(common_icons);tables=[];used=set();gaps=[]
 def img(s):
  v=pick_icon(declared,s)
  if v:used.add(v)
  else:gaps.append('Source did not declare icon '+s)
  return v
 stats=[]
 for key,label in STAT.items():
  value=data.get('stats',{}).get(key)
  if value is None or not re.fullmatch(r'\d+(?:\.\d+)?',str(value)):raise ValueError('Missing numerical panel '+key)
  r=dict(id=key,label=label,value=str(value),basis=PANEL,group='primary' if key in ('health','attack','defense')else'detail');i=img(STAT_SUFFIX[key])
  if i:r['icon']=i
  stats.append(r)
 c['stats']=stats
 skill_by_key={}
 for s in data.get('skills',[]):
  key=s['key']
  if key in skill_by_key:raise ValueError('Duplicate skill key')
  values=[dict(id=k,label=label,levels=[clean(s[k])]) for k,label in META.items() if k in s and s[k] is not None and str(s[k])!='']
  tables.append(make_table('skill:'+key,s['title'],SKILL_TYPES.get(s.get('type'),C('스킬','Skill','スキル','技能')),clean(s.get('description','')),u,img('/chara-info/'+c['id']+'/skills/'+key+'.png'),values))
  skill_by_key[key]=s
  if '[effect name unavailable]'in clean(s.get('description','')):gaps.append('Source missing glossary term(s) '+','.join(re.findall(r'\{!(\d+)\}',s.get('description','')))+' in base skill '+key)
  match=re.search(r'^Selects?\s+(?:1|one)\s+(?:enemy\s+)?(?:unit|target)\s+within\s+(?:<#(?:[A-Fa-f0-9]+):)?(\d+)\s*tiles',s.get('description',''))
  if match and str(s.get('range','')).isdigit() and match[1]!=str(s['range']):gaps.append('Source range discrepancy '+key+': prose '+match[1]+' / field '+str(s['range']))
 if len(skill_by_key)<5:raise ValueError('Incomplete base skill kit')
 fortifications=data.get('fortification',[])
 if len(fortifications)!=6:gaps.append('Source Fortification incomplete: '+str(len(fortifications))+'/6 stages'+(' (source section: SOON)'if not fortifications and re.search(r'<h2>Fortification[\s\S]{0,250}SOON',raw)else''))
 for i,f in enumerate(fortifications,1):
  key=f.get('affect');s=skill_by_key.get(key)
  if not s:raise ValueError('Unbound Fortification skill')
  desc=clean(f.get('effect',''));level=clean(f.get('lvl',''))
  tables.append(make_table(f'fortification:{i}',f'V{i} · {s["title"]} Lv.{level}',C('돌파 강화','Fortification','凸強化','椎体强化'),desc,u,img('/chara-info/'+c['id']+'/skills/'+key+'.png')))
 keys=[];stat_nodes=[]
 names=data.get('key_names',{})
 for node in data.get('neural',[]):
  n=str(node['number']);typ=node['type'];desc=clean(node.get('effect',''))
  if not desc:continue
  if typ=='key':
   key_id='neural:key:'+n
   if key_id in keys:raise ValueError('Duplicate neural key')
   keys.append(key_id);name=names.get(n) or 'Key '+n
   suffix='/chara-info/'+c['id']+('/helix/common.png' if n=='7' else '/helix/key'+n+'.png')
   tables.append(make_table(key_id,name,C('뉴럴 헬릭스 키','Neural Helix key','ニューラルヘリックス・キー','神经螺旋固键'),desc,u,img(suffix)))
  else:stat_nodes.append(f'{n} · {typ}\n{desc}')
 if stat_nodes:
  tables.append(make_table('neural:stats','Neural Helix stat nodes',C('뉴럴 헬릭스 능력치 노드','Neural Helix stat nodes','ニューラルヘリックス能力値ノード','神经螺旋属性节点'),'\n\n'.join(stat_nodes),u,img('/chara-info/attack.png')))
 expansion=clean(data.get('expansion_key',''))
 if expansion:tables.append(make_table('neural:expansion',names.get('8') or 'Expansion key',C('확장키','Expansion key','拡張キー','扩展键'),expansion,u,img('/chara-info/'+c['id']+'/helix/expansion.png')))
 remould=data.get('remoulding_pattern',{}).get('effects',{})
 for stage,effect in remould.items():
  desc=clean(effect.get('effect',''))
  if not desc:continue
  price=effect.get('price',{});values=[]
  for cls,value in price.items():
   if value in ('',None):
    gaps.append('Source missing Remolding material cost '+stage+'/'+cls);continue
   if not isinstance(value,(int,float)) or value<0:raise ValueError('Invalid remoulding cost')
   if value:
    r=dict(id='cost:'+cls,label=C('재료 · '+cls,'Growth Data · '+cls,'素材 · '+cls,'材料 · '+cls),levels=[str(value)]);i=img('/'+cls+'.png')
    if i:r['icon']=i
    values.append(r)
  tables.append(make_table('remoulding:'+stage,stage.capitalize(),C('리몰딩 패턴','Remolding Pattern','リモールディングパターン','烙印拓展'),desc,u,img('/remoulding/FX_Flower.png'),values))
 # Source-declared summons have separate stats and actual skill kits.
 for index,summon in enumerate(data.get('summons',[]),1):
  if not isinstance(summon,dict):raise ValueError('Unknown summon structure')
  name=summon.get('name')or summon.get('title')or f'Summon {index}'
  stats=summon.get('stats',{});values=[]
  for key,value in stats.items():
   if value not in ('',None):values.append(dict(id='stat:'+key,label=C('소환물 · '+key,'Summon · '+key,'召喚物 · '+key,'召唤物 · '+key),levels=[clean(value)]))
  if values:tables.append(make_table(f'summon:{index}:stats',name,C('소환물 능력치','Summon stats','召喚物能力値','召唤物属性'),'Published summon values; percentages remain source inheritance ratios. Missing source values are omitted.',u,values=values))
  for si,skill in enumerate(summon.get('skills',[]),1):
   key=skill['key'];desc=clean(skill.get('description',''))
   if not desc:raise ValueError('Missing summon skill prose')
   if '[effect name unavailable]'in desc:gaps.append('Source missing glossary term(s) '+','.join(re.findall(r'\{!(\d+)\}',skill.get('description','')))+' in summon '+key)
   values=[dict(id=k,label=label,levels=[clean(skill[k])])for k,label in META.items()if skill.get(k) not in ('',None)]
   # Only select exact page-declared summon skill paths, never guessed names.
   candidate=pick_icon(declared,'/'+key+'.png')
   if candidate:used.add(candidate)
   tables.append(make_table(f'summon:{index}:skill:{key}',name+' · '+skill['title'],C('소환물 스킬','Summon skill','召喚物スキル','召唤物技能'),desc,u,candidate,values))
 if len(tables)>40:raise ValueError('Too many source tables '+str(len(tables)))
 if len({t['id']for t in tables})!=len(tables):raise ValueError('Duplicate table identity')
 notes=[]
 if len(fortifications)!=6:notes.append(C(f'이 캐릭터의 돌파 1~6단계 중 원문에서 제공된 효과는 {len(fortifications)}개입니다. 제공되지 않은 돌파 효과는 표시하지 않았습니다. 기본 스킬에 누락 효과를 추정해 합산하지 않았습니다.',f'The source supplies {len(fortifications)} of 6 Fortification stage effects for this character. Unavailable effects are omitted and are not guessed or added to the base skills.',f'このキャラクターの凸1～6段階のうち、原文が提供する効果は{len(fortifications)}件です。未提供の効果は表示せず、基本スキルにも推測で加算しません。',f'该角色的6个椎体强化阶段中，来源提供了{len(fortifications)}项效果。未提供的效果未显示，也未猜测后加入基础技能。'))
 if any('glossary term'in g for g in gaps):notes.append(C('일부 원문 효과명이 제공되지 않아 해당 위치에 ‘효과명 미제공’으로 표시했습니다. 나머지 설명과 수치는 원문 그대로입니다.','Some effect names are absent from the source and marked “effect name unavailable”; all remaining prose and values are retained.','原文で一部の効果名が欠落しており、その箇所を「効果名未提供」と表示。その他の説明と数値は原文どおり。','来源缺少部分效果名，相关位置标注“效果名未提供”；其余说明和数值保持原文。'))
 for gap in gaps:
  if gap.startswith('Source range discrepancy '):
   identity,values=gap.removeprefix('Source range discrepancy ').split(': prose ');prose,field=values.split(' / field ')
   notes.append(C(f'{identity}의 사거리가 원문 설명에서는 {prose}칸, 별도 표에서는 {field}칸으로 다릅니다. 두 원문값을 보존했으며 어느 쪽으로도 임의 수정하지 않았습니다.',f'{identity}: source prose gives range {prose}, while its separate field gives {field}. Both source values are retained without choosing an unsupported correction.',f'{identity}の射程は原文説明では{prose}マス、別表では{field}マスと不一致。推測で修正せず両方を保持。',f'{identity}的射程在来源说明中为{prose}格，独立字段为{field}格；保留两项来源值，不擅自修正。'))
 if any('Source missing Remolding material cost'in g for g in gaps):notes.append(C('리몰딩 패턴의 원문에 비어 있는 재료 수량은 표시하지 않았습니다. 빈칸을 0개로 간주하지 않았습니다.','An empty Remolding material count is omitted; it is not interpreted as zero.','リモールディングの空欄の素材数は非表示。0とは解釈しない。','烙印拓展的空白材料数量未显示，不视为0。'))
 if notes:
  section=dict(id='gfl2-source-notes',title=C('원문 자료 주석','Source notes','原文資料の注記','原始资料注释'),body={l:'\n\n'.join(n[l]for n in notes)for l in LOCALES})
  c['sections']=[s for s in c.get('sections',[])if s['id']!='gfl2-source-notes']+[section]
 c['skillTables']=tables
 c['detailSources']=list({x['url']:x for x in c.get('detailSources',[])+[dict(url=u,kind='community',label=C('GFL2 HELP · 스킬·뉴럴 헬릭스·돌파 원문','GFL2 HELP · skills, Neural Helix and Fortification originals','GFL2 HELP・スキル/キー/凸原文','GFL2 HELP · 技能、神经螺旋、椎体原文'))]}.values())
 return c,used,gaps

def enrich(doc,cache,refresh=False,workers=6):
 out=copy.deepcopy(doc)
 if out.get('gameId')!='gfl2':raise ValueError('Wrong game')
 def task(c):return read_source(c,cache,refresh)
 icons=set();receipts=[];gaps=[];failures=[];sources={};by_id={};common=set()
 with concurrent.futures.ThreadPoolExecutor(max_workers=workers)as pool:
  pending={pool.submit(task,c):c for c in out['characters']}
  for future in concurrent.futures.as_completed(pending):
   c=pending[future]
   try:
    data,raw,receipt=future.result();sources[c['id']]=(data,raw,receipt)
    # These exact source-declared game class glyphs are shared among characters.
    common.update(v for v in declared_icons(raw) if urllib.parse.urlsplit(v).path in ('/static/images/bulwark.png','/static/images/sentinel.png','/static/images/support.png','/static/images/vanguard.png'))
   except Exception as error:failures.append(dict(id=c['id'],error=str(error)));by_id[c['id']]=c
 for c in out['characters']:
  if c['id']not in sources:continue
  data,raw,receipt=sources[c['id']]
  try:
   result,used,notes=enrich_character(c,data,raw,common);by_id[c['id']]=result;icons.update(used);receipts.append(dict(id=c['id'],**receipt));gaps.extend(dict(id=c['id'],reason=v)for v in notes)
  except Exception as error:failures.append(dict(id=c['id'],error=str(error)));by_id[c['id']]=c
 out['characters']=[by_id[c['id']]for c in out['characters']]
 fortification_counts=[dict(id=c['id'],providedStages=sum(t['id'].startswith('fortification:')for t in c.get('skillTables',[])))for c in out['characters']]
 report=dict(fortificationCoverage=dict(completeForms=sum(v['providedStages']==6 for v in fortification_counts),expectedForms=len(out['characters']),incompleteForms=[v for v in fortification_counts if v['providedStages']!=6]),gameId='gfl2',status='partial'if failures or gaps else'ok',count=len(out['characters']),enriched=len(receipts),tables=sum(len(c.get('skillTables',[]))for c in out['characters']),icons=len(icons),failures=failures,gaps=gaps,receipts=sorted(receipts,key=lambda r:r['id']),basis='English original latest database facts; server revision/level basis not asserted. Input names, artwork and release flags preserved.')
 return out,report,sorted(icons)

def download_icons(urls,output,workers=8):
 from PIL import Image
 output=Path(output);output.mkdir(parents=True,exist_ok=True);receipt_dir=output/'receipts';receipt_dir.mkdir(exist_ok=True)
 def one(url):
  receipt_path=receipt_dir/(sha(url.encode())+'.json')
  if receipt_path.exists():
   receipt=json.loads(receipt_path.read_text());cached=Path(receipt['localPath'])
   if receipt.get('url')!=url or not cached.is_file()or sha(cached.read_bytes())!=receipt.get('sha256')or cached.stat().st_size!=receipt.get('bytes'):raise ValueError('Icon cache identity/hash mismatch')
   return receipt
  u=urllib.parse.urlsplit(url)
  if u.scheme!='https'or u.netloc!='gfl2.help'or not u.path.startswith('/static/images/')or u.query or u.fragment:raise ValueError('Unexpected declared icon source')
  encoded=urllib.parse.urlunsplit((u.scheme,u.netloc,urllib.parse.quote(urllib.parse.unquote(u.path),safe='/:'),'',''))
  req=urllib.request.Request(encoded,headers={'User-Agent':'GAGETHER-PublicRosterIconAudit/1.0'})
  with urllib.request.urlopen(req,timeout=40)as r:body=r.read(2_000_001);status=r.status;mime=r.headers.get('Content-Type','')
  if status!=200 or not body or len(body)>2_000_000:raise ValueError('Bad original icon response')
  if body.lstrip().startswith(b'<svg')or(b'<svg'in body[:300]):
   # Keep actual SVG original if source uses one; PNGs are typical for character icons.
   raise ValueError('Unreviewed SVG icon')
  with Image.open(io.BytesIO(body))as im:width,height=im.size;fmt=im.format;im.verify()
  if fmt not in ('PNG','WEBP','JPEG')or min(width,height)<8 or max(width,height)>2048:raise ValueError('Unexpected native icon dimensions')
  digest=sha(body);ext={'PNG':'png','WEBP':'webp','JPEG':'jpg'}[fmt];p=output/(digest+'.'+ext);p.write_bytes(body)
  receipt=dict(gameId='gfl2',url=url,publicUrl='https://gagether.wiki/roster-detail-icons/'+p.name,path='public/roster-detail-icons/'+p.name,ext=ext,sha256=digest,bytes=len(body),width=width,height=height,mimeType={'PNG':'image/png','WEBP':'image/webp','JPEG':'image/jpeg'}[fmt],httpStatus=200,checkedAt=now(),sourceKind='community',sourceUrl=url,localPath=str(p));atomic(receipt_path,receipt);return receipt
 with concurrent.futures.ThreadPoolExecutor(max_workers=workers)as pool:return sorted(pool.map(one,urls),key=lambda r:r['url'])

def main():
 p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--output',required=True);p.add_argument('--cache-dir',required=True);p.add_argument('--report',required=True);p.add_argument('--icons-dir');p.add_argument('--refresh',action='store_true');args=p.parse_args()
 doc=json.loads(Path(args.input).read_text());out,report,icons=enrich(doc,args.cache_dir,args.refresh);atomic(args.output,out);atomic(args.report,report)
 atomic(Path(args.report).with_name('icon-urls.json'),icons)
 if args.icons_dir:
  inventory=download_icons(icons,args.icons_dir);atomic(Path(args.report).with_name('icon-inventory.json'),inventory)
 print(json.dumps({k:v for k,v in report.items()if k not in ('receipts','gaps')},ensure_ascii=False))
if __name__=='__main__':main()
