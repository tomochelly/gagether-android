#!/usr/bin/env python3
"""Source-bound Genshin details; no new IDs, live writes, account APIs or artwork guesses."""
from __future__ import annotations
import argparse,base64,concurrent.futures,copy,datetime as dt,hashlib,io,json,re,urllib.request
from decimal import Decimal,ROUND_HALF_UP
from pathlib import Path

LOCALES=('ko','en','ja','zh')
LANG=dict(ko='Korean',en='English',ja='Japanese',zh='ChineseSimplified')
API='https://genshin-db-api.vercel.app/api/v5/'
RAW='https://raw.githubusercontent.com/theBowja/genshin-db/main/src/data/'
SOURCES={f'{folder}-{l}':API+folder+'?query=names&matchCategories=true&verboseCategories=true&resultLanguage='+LANG[l] for folder in ('characters','talents','constellations')for l in LOCALES}
SOURCES.update(stats=RAW+'stats/characters.json',curve=RAW+'curve/characters.json',index=RAW+'index/English/characters.json',**{'elements-en':API+'elements?query=names&matchCategories=true&verboseCategories=true&resultLanguage=English'})
PARAM=re.compile(r'\{(param\d+):(F1P|F2P|F1|F2|P|I)\}')
ROOT=Path(__file__).resolve().parent

def C(ko,en,ja,zh):return dict(zip(LOCALES,(ko,en,ja,zh)))
def now():return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z')
def packed(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def sha(x):return hashlib.sha256(x).hexdigest()
def plain(n):
 s=format(Decimal(str(n)),'f');return s.rstrip('0').rstrip('.')if'.'in s else s
def clean(x):
 x=str(x or '').replace('\\n','\n').replace('**','')
 x=re.sub(r'<[^>]+>','',x);x=re.sub(r'\{/?LINK(?:#[^}]+)?\}','',x)
 return x.strip()
def load_sources(directory,refresh=False):
 directory=Path(directory);directory.mkdir(parents=True,exist_ok=True)
 def one(item):
  key,url=item;p=directory/(key+'.json');m=p.with_suffix('.meta.json')
  if refresh or not p.exists():
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-reference-enrichment/1.0','Accept':'application/json'}),timeout=50)as r:b=r.read(20_000_001);status=r.status
   if status!=200 or len(b)>20_000_000:raise ValueError('Unexpected source response')
   json.loads(b);p.write_bytes(b);m.write_bytes(packed(dict(url=url,checkedAt=now(),sha256=sha(b),bytes=len(b),httpStatus=status)))
  b=p.read_bytes();meta=json.loads(m.read_bytes())if m.exists()else dict(url=url,sha256=sha(b),bytes=len(b),mode='supplied-source')
  if meta['url']!=url or meta['sha256']!=sha(b):raise ValueError('Source replay identity mismatch')
  return key,json.loads(b),meta
 values={};receipts=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
  for key,value,receipt in pool.map(one,SOURCES.items()):values[key]=value;receipts.append(dict(key=key,**receipt))
 return values,receipts

def numeric(value,fmt):
 n=Decimal(str(value));percent=fmt.endswith('P')
 if percent:n*=100
 places=int(fmt[1])if fmt.startswith('F')else 0
 result=format(n.quantize(Decimal(1).scaleb(-places),rounding=ROUND_HALF_UP),'f')
 return result+('%'if percent else'')

def format_label(template,parameters,level):
 def replace(m):
  key,fmt=m.groups()
  if key not in parameters or len(parameters[key])<=level:raise ValueError('Unbound source talent parameter '+key)
  return numeric(parameters[key][level],fmt)
 out=PARAM.sub(replace,template)
 if '{param'in out:raise ValueError('Unrecognized source talent format')
 return clean(out)

TYPES={
 'combat1':C('일반 공격','Normal Attack','通常攻撃','普通攻击'),
 'combat2':C('원소전투 스킬','Elemental Skill','元素スキル','元素战技'),
 'combat3':C('원소폭발','Elemental Burst','元素爆発','元素爆发'),
 'combatsp':C('특수 이동','Alternate Sprint','特殊移動','特殊移动'),
 'combatju':C('특수 전투','Special combat','特殊戦闘','特殊战斗'),
 'passive':C('고유 특성','Passive Talent','固有天賦','固有天赋'),
 'constellation':C('운명의 자리','Constellation','命ノ星座','命之座')}
SKILL_BASIS=C('원문 데이터의 Lv.1~15 계수 · 직접 강화 상한 Lv.10 · 추가 레벨 적용은 각 특성·별자리 효과 참조',
 'Native Lv.1–15 coefficients; direct upgrade cap Lv.10. Extra levels depend on the actual talent or constellation effect.',
 '原文Lv.1～15係数。直接強化はLv.10まで。追加レベルは各天賦・命ノ星座の効果を参照。',
 '原始1～15级系数；直接升级上限10级。额外等级请参照对应天赋或命座效果。')
FIXED_BASIS=C('원문 설명 · 기초 패널에 합산하지 않음','Native description; excluded from base panel.','原文説明・基礎値に加算しない','原始说明；不计入基础面板')


def tables(records,cons,icons=None):
 """Every actual source skill/constellation appears exactly once, with native locale prose."""
 icons=icons or {};out=[]
 keys=[k for k,v in records['en'].items()if isinstance(v,dict)and'description'in v]
 for key in keys:
  skill={l:records[l].get(key)for l in LOCALES}
  if not all(isinstance(s,dict)and'name'in s for s in skill.values()):raise ValueError('Incomplete native skill '+key)
  name={l:clean(s['name'])for l,s in skill.items()};description={l:clean(s['description'])for l,s in skill.items()}
  kind=TYPES.get(key,TYPES['passive']);ident=f"talent-{records['en']['id']}-{key}"
  table=dict(id=ident,name=name,type=kind,description=description,sourceUrl=SOURCES['talents-en'],sourceKind='community',basis=FIXED_BASIS,values=[])
  filename=records['en'].get('images',{}).get('filename_'+key)
  if filename in icons:table['icon']=icons[filename]
  attributes=skill['en'].get('attributes');labels=attributes.get('labels',[])if attributes else[]
  if labels:
   count=len(labels);max_level=max(len(v)for v in attributes['parameters'].values())
   if max_level>30:raise ValueError('Unexpected talent level range')
   templates={};matrices={}
   for l,s in skill.items():
    a=s.get('attributes')
    if not a or len(a.get('labels',[]))!=count:raise ValueError('Localized attribute row mismatch '+ident+'/'+l)
    lines=[];matrix=[]
    for i,label in enumerate(a['labels']):
     if '|'not in label:raise ValueError('Attribute lacks label separator')
     title,value=label.split('|',1);lines.append(clean(title)+': {'+str(i+1)+'}')
     row=[format_label(value,a['parameters'],level)for level in range(max_level)]
     matrix.append([row[0]]if len(set(row))==1 else row)
    templates[l]=description[l]+'\n\n'+'\n'.join(lines);matrices[l]=matrix
   extra=dict(descriptionTemplate=templates,parameters=matrices,maxLevel=max_level,baseMaxLevel=min(10,max_level),levelLabels=[{l:'Lv.'+str(i)+(C(' · 추가 레벨',' · additional level','・追加レベル',' · 额外等级')[l]if i>10 else'')for l in LOCALES}for i in range(1,max_level+1)],basis=SKILL_BASIS)
   if max(map(len,templates.values()))>3000:
    # Keep long source prose and coefficients in separate blocks, with no truncation.
    out.append(table)
    table={**table,'id':ident+'-coefficients','name':{l:name[l]+' · '+C('수치','Values','数値','数值')[l]for l in LOCALES}}
    table.pop('description',None)
    extra['descriptionTemplate']={l:templates[l][len(description[l])+2:]for l in LOCALES}
   table.update(extra)
  out.append(table)
 for key in ['c'+str(i)for i in range(1,7)]:
  values={l:cons[l].get(key)for l in LOCALES}
  if not all(isinstance(v,dict)and'name'in v for v in values.values()):raise ValueError('Incomplete native constellation '+key)
  filename=cons['en'].get('images',{}).get('filename_'+key)
  row=dict(id=f"constellation-{cons['en']['id']}-{key}",name={l:clean(v['name'])for l,v in values.items()},type={l:TYPES['constellation'][l]+' '+key.upper()for l in LOCALES},description={l:clean(v['description'])for l,v in values.items()},sourceUrl=SOURCES['constellations-en'],sourceKind='community',basis=FIXED_BASIS,values=[])
  if filename in icons:row['icon']=icons[filename]
  out.append(row)
 if len(out)>40 or any(len(v)>3000 for s in out for k in ['name','description','descriptionTemplate']for v in s.get(k,{}).values()):raise ValueError('Skill content exceeds schema bound')
 return out


def material_sections(records):
 result=[]
 for key,title in [('costs',C('돌파 재료','Ascension materials','突破素材','突破材料'))]:
  body={}
  for l,raw in records.items():
   lines=[]
   for stage,materials in raw.get(key,{}).items():
    n=int(stage.removeprefix('ascend'));label=C('돌파','Ascension','突破','突破')[l]+' '+str(n)
    lines.append(label+': '+', '.join(clean(m['name'])+' × '+(str(m['count'])if 'count'in m else C('[수량 미제공]','[quantity absent]','[数量未提供]','[数量未提供]')[l])for m in materials))
   body[l]='\n'.join(lines)
  if any(body.values()):result.append(dict(id='ascension-materials',title=title,body=body))
 return result


def progression(raw,curve,localized):
 from math import floor
 labels=dict(hp=C('HP','HP','HP','生命值'),atk=C('공격력','ATK','攻撃力','攻击力'),**{'def':C('방어력','DEF','防御力','防御力')},crit_rate=C('치명타 확률','CRIT Rate','会心率','暴击率'),crit_dmg=C('치명타 피해','CRIT DMG','会心ダメージ','暴击伤害'))
 bounds=[(1,20),(20,40),(40,50),(50,60),(60,70),(70,80),(80,90)]
 stats=[dict(id=k,label=v)for k,v in labels.items()];rows=[]
 for stage,(lo,hi)in enumerate(bounds):
  p=raw['promotion'][stage]
  for level in range(lo,hi+1):
   vs={k:str(floor(raw['base'][src]*curve[str(level)][raw['curve'][src]]+p[src]+.5))for k,src in [('hp','hp'),('atk','attack'),('def','defense')]}
   for k,src,prop in [('crit_rate','critrate','FIGHT_PROP_CRITICAL'),('crit_dmg','critdmg','FIGHT_PROP_CRITICAL_HURT')]:vs[k]=plain((Decimal(str(raw['base'][src]))+(Decimal(str(p['specialized']))if raw['specialized']==prop else Decimal(0)))*100)+'%'
   rows.append(dict(level=level,stage=stage,values=vs))
 basis=C('무기·성유물·별자리·특성 제외 · 원본 성장식 · HP/공격력/방어력 반올림','No weapon, artifacts, constellations or talent bonuses; native growth formula, HP/ATK/DEF rounded.','武器・聖遺物・命ノ星座・天賦を除いた元の成長式。基礎HP・攻撃力・防御力は四捨五入。','不含武器、圣遗物、命座或天赋；使用原始成长公式，生命/攻击/防御四舍五入。')
 return dict(sourceUrl=SOURCES['stats'],sourceKind='community',basis=basis,stageLabel=C('돌파','Ascension','突破','突破'),defaultLevel=90,stats=stats,stages=[dict(id=i,label={l:C('돌파','Ascension','突破','突破')[l]+' '+str(i)for l in LOCALES})for i in range(7)],rows=rows)


def element_icons(data,assets):
 assets=Path(assets);assets.mkdir(parents=True,exist_ok=True);mapping={};records=[]
 for element in data:
  raw=element.get('images',{}).get('base64','')
  if not raw.startswith('data:image/png;base64,'):continue
  b=base64.b64decode(raw.split(',',1)[1],validate=True)
  if not b.startswith(b'\x89PNG\r\n\x1a\n')or len(b)>100_000:raise ValueError('Invalid declared element glyph')
  key=sha(b);file=assets/(key+'.png');file.write_bytes(b)
  url='https://gagether.wiki/roster-detail-icons/'+key+'.png';mapping[element['name']]=url
  records.append(dict(gameId='genshin',kind='element',name=element['name'],sourceUrl=SOURCES['elements-en'],declaredField='images.base64',file=str(file),publicUrl=url,sha256=key,bytes=len(b),width=int.from_bytes(b[16:20],'big'),height=int.from_bytes(b[20:24],'big')))
 return mapping,records


def enrich(document,data,assets=ROOT/'icons',icon_map=None):
 if document['gameId']!='genshin':raise ValueError('Wrong game')
 result=copy.deepcopy(document);source_ids=[r['id']for r in result['characters']]
 source_chars={l:{str(r['id']):r for r in data['characters-'+l]}for l in LOCALES}
 source_talents={l:{r['id']:r for r in data['talents-'+l]}for l in LOCALES}
 source_const={l:{r['id']:r for r in data['constellations-'+l]}for l in LOCALES}
 english_talents={r['name']:r['id']for r in data['talents-en']}
 by_stats_name={v:k for k,v in data['index']['namemap'].items()}
 glyphs,glyph_records=element_icons(data['elements-en'],assets);icon_map=icon_map or {}
 element_labels={}
 for sid,r in source_chars['en'].items():
  if r['elementText']not in element_labels:element_labels[r['elementText']]={l:source_chars[l][sid]['elementText']for l in LOCALES}
 failures=[];coverage=[]
 for c in result['characters']:
  cid=c['id'];records={l:source_chars[l].get(cid)for l in LOCALES}
  if not all(records.values()):failures.append(dict(id=cid,reason='Missing exact native character ID'));continue
  if records['en']['name']!=c['name']['en']:raise ValueError('Native name identity changed '+cid)
  c['sourceId']=int(cid)
  for t in c.get('traits',[]):
   if t['id']=='element'and records['en']['elementText']in glyphs:t['icon']=glyphs[records['en']['elementText']]
  c['sections']=material_sections(records)
  stats_key=by_stats_name.get(records['en']['name']);raw=data['stats'].get(stats_key)
  if raw:c['statProgression']=progression(raw,data['curve'],records)
  c['detailSources']=[dict(url=SOURCES['characters-en'],kind='community',label=C('원본 캐릭터·돌파 표','Native character and ascension tables','元のキャラクター・突破表','原始角色与突破表')),dict(url=SOURCES['talents-en'],kind='community',label=C('원본 특성·레벨 계수','Native talents and level coefficients','元の天賦・レベル係数','原始天赋与等级系数')),dict(url=SOURCES['constellations-en'],kind='community',label=TYPES['constellation'])]
  if cid in ('10000005','10000007'):
   variants={}
   for name,tid in english_talents.items():
    m=re.fullmatch(r'Traveler \((Anemo|Geo|Electro|Dendro|Hydro|Pyro|Cryo)\)',name)
    if not m:continue
    element=m[1];tr={l:source_talents[l][tid]for l in LOCALES};co={l:source_const[l][tid]for l in LOCALES}
    label={l:tr[l]['name']for l in LOCALES}
    variant=dict(sourceId=tid,label=label,sourceUrl=SOURCES['talents-en'],skillTables=tables(tr,co,icon_map))
    if element in glyphs:variant['icon']=glyphs[element]
    traits=copy.deepcopy(c.get('traits',[]))
    for trait in traits:
     if trait['id']=='element':
      trait['value']=element_labels[element]
      if element in glyphs:trait['icon']=glyphs[element]
    variant['traits']=traits
    variants[element.lower()]=variant
   c['variantDetails']=variants;c.pop('skillTables',None)
  else:
   tid=english_talents.get(records['en']['name'])
   if tid is None:failures.append(dict(id=cid,reason='No exact same-name talent record'));continue
   c['skillTables']=tables({l:source_talents[l][tid]for l in LOCALES},{l:source_const[l][tid]for l in LOCALES},icon_map)
  coverage.append(dict(id=cid,skills=len(c.get('skillTables',[])),variants={k:len(v['skillTables'])for k,v in c.get('variantDetails',{}).items()},progressionRows=len(c.get('statProgression',{}).get('rows',[]))))
 if source_ids!=[c['id']for c in result['characters']]:raise ValueError('Stable IDs changed')
 result['sourceUrls']=list(dict.fromkeys([*result['sourceUrls'],*SOURCES.values()]))
 if len(result['sourceUrls'])>40:raise ValueError('Source URL bound exceeded')
 report=dict(gameId='genshin',status='partial'if failures else'ok',characters=len(result['characters']),detailCharacters=len(coverage),ordinarySkillTables=sum(c['skills']for c in coverage),travelerVariants=sum(len(c['variants'])for c in coverage),variantSkillTables=sum(sum(c['variants'].values())for c in coverage),progressionCharacters=sum(bool(c['progressionRows'])for c in coverage),glyphs=glyph_records,failures=failures,coverage=coverage)
 return result,report


def main():
 ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);ap.add_argument('--source-dir',type=Path,required=True);ap.add_argument('--report',type=Path,default=ROOT/'detail-manifest.json');ap.add_argument('--assets',type=Path,default=ROOT/'icons');ap.add_argument('--icon-map',type=Path);ap.add_argument('--refresh',action='store_true');args=ap.parse_args()
 doc=json.loads(args.input.read_bytes());doc=next(r for r in doc if r['gameId']=='genshin')if isinstance(doc,list)else doc
 data,receipts=load_sources(args.source_dir,args.refresh);out,report=enrich(doc,data,args.assets,json.loads(args.icon_map.read_bytes())if args.icon_map else None)
 report['sources']=receipts;report['outputBytes']=len(packed(out));args.output.write_bytes(packed(out));args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items()if k not in ('sources','glyphs','coverage')},ensure_ascii=False))
if __name__=='__main__':main()
