#!/usr/bin/env python3
"""Compile exact-outfit, service-scoped Uma details from declared public sources.

Full generated catalogs and originals stay in canonical Site storage. This helper
does not publish, add character identities, guess image URLs or execute source JS.
"""
from __future__ import annotations
import argparse,copy,concurrent.futures,datetime as dt,hashlib,io,json,re,urllib.request
from decimal import Decimal
from pathlib import Path

LOCALES=('ko','en','ja','zh');SERVERS={'jp':'ja','kr':'ko','global':'en'}
GT='https://gametora.com';MEDIA='https://media.gametora.com'
MANIFEST=GT+'/data/manifests/umamusume.json'
UMA_DATA='https://raw.githubusercontent.com/daftuyda/UmaTools/main/public/assets/uma_data.json'
OFFICIAL_KR='https://umamusume.kakaogames.com/'
KEYS={'cards':'character-cards','skills':'skills','evolutions':'evolutions','evo_strings':'static/evo_strings'}
STATS=('speed','stamina','power','guts','wit')
RAW_STATS=('Speed','Stamina','Power','Guts','Wit')
GRADE={'G':'00','F':'02','E':'04','D':'06','C':'08','B':'10','A':'12','S':'14'}

def C(ko,en,ja,zh):return dict(zip(LOCALES,(ko,en,ja,zh)))
STAT_LABELS=dict(zip(STATS,[C('스피드','Speed','スピード','速度'),C('스태미나','Stamina','スタミナ','耐力'),C('파워','Power','パワー','力量'),C('근성','Guts','根性','毅力'),C('지능','Wit','賢さ','智力')]))
STAT_ICONS={s:GT+f'/images/umamusume/icons/utx_ico_obtain_0{i}.png'for i,s in enumerate(STATS)}
BASE_BASIS=C('육성 시작 기본값 · 인자·서포트·육성 보너스 제외','Initial training base values; excludes factors, supports and training bonuses.','育成開始時の基礎値。因子・サポート・育成ボーナスを除外。','育成开始基础值；不含因子、支援及育成加成。')
GROWTH_BASIS=C('캐릭터 고유 성장률 · 초기 능력치에 합산하지 않음','Character training growth bonus; not added to the initial panel.','キャラ固有の成長率。初期ステータスには加算しない。','角色固有成长率；不计入初始属性。')
GROWTH_LABEL=C('성장률','Growth bonuses','成長率','成长率')
SERVER_LABELS={'jp':C('일본 서버','Japan server','日本版','日服'),'kr':C('한국 서버','Korean server','韓国版','韩服'),'global':C('글로벌 서버','Global server','グローバル版','国际服')}
CATEGORIES={'unique':C('고유 스킬','Unique skill','固有スキル','固有技能'),'innate':C('초기 스킬','Initial skill','初期スキル','初始技能'),'event':C('육성 이벤트 스킬','Training event skill','育成イベントスキル','育成事件技能'),'inherited':C('계승 고유 스킬','Inherited unique','継承固有スキル','继承固有技能'),'evolution':C('진화 스킬','Evolved skill','進化スキル','进化技能')}
EFFECT_LABELS={
 1:STAT_LABELS['speed'],2:STAT_LABELS['stamina'],3:STAT_LABELS['power'],4:STAT_LABELS['guts'],5:STAT_LABELS['wit'],
 6:C('작전 변경','Strategy change','作戦変更','跑法变更'),8:C('시야','Field of view','視野','视野'),9:C('지구력 회복','Stamina recovery','持久力回復','持久力回复'),
 10:C('출발 반응 시간 배율','Start reaction multiplier','スタート反応時間倍率','出闸反应时间倍率'),13:C('흥분 지속 시간','Rushed duration','掛かり時間','焦躁持续时间'),14:C('출발 지연 시간','Start delay','出遅れ時間','出闸延迟'),
 21:C('현재 속도','Current speed','現在速度','当前速度'),22:C('현재 속도','Current speed','現在速度','当前速度'),27:C('목표 속도','Target velocity','目標速度','目标速度'),
 28:C('횡이동 속도','Lateral speed','横移動速度','横向移动速度'),29:C('흥분 확률 변화','Rushed chance change','掛かり確率変化','焦躁概率变化'),31:C('가속력','Acceleration','加速力','加速度'),32:C('모든 기초 능력','All base attributes','全基礎能力','全部基础属性'),
 35:C('레인 이동','Lane change','レーン移動','赛道横向移动'),37:C('무작위 레어 스킬 발동','Random rare skills','ランダムなレアスキル発動','随机稀有技能发动'),38:C('불리한 스킬 효과 무효','Debuff immunity','デバフ無効','负面技能效果免疫'),
 41:C('연계 스킬 조건 무시 발동','Linked skill activation','連携スキルの条件無視発動','无视条件发动联动技能'),42:C('특정 스킬 지속 시간 배율','Specific skill duration multiplier','対象スキル効果時間倍率','特定技能持续时间倍率'),
 48:C('전력 스퍼트 가속력','Full spurt acceleration','全開スパート加速力','全力冲刺加速度'),49:C('고유 스킬 재발동','Unique skill reactivation','固有スキル再発動','再次发动固有技能'),50:C('인기 관련 조건 무시','Ignore popularity conditions','人気条件を無視','无视人气条件')}

def now():return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z')
def packed(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
def sha(b):return hashlib.sha256(b).hexdigest()
def number(v):
 s=format(Decimal(str(v)),'f');return s.rstrip('0').rstrip('.')if'.'in s else s
def add_copies(a,b,join=' · '):return {l:a[l]+join+b[l]for l in LOCALES}
def clean(s):
 s=re.sub(r'<[^>]+>','',s or '').replace('\\n','\n').strip()
 if re.search(r'\{\d+\}|#\d+\[',s):raise ValueError('Unbound source parameter')
 return s

def load_one(directory,key,url,refresh=False,json_body=True):
 directory=Path(directory);directory.mkdir(parents=True,exist_ok=True)
 body=directory/(key+'.body');meta=directory/(key+'.receipt.json')
 if refresh or not body.exists()or not meta.exists():
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-character-detail-research/1.0'}),timeout=35)as r:b=r.read();status=r.status
  if json_body:
   parsed=json.loads(b)
   if key=='gametora-manifest':
    if not isinstance(parsed,dict)or any(not re.fullmatch(r'[a-f0-9]{8}',parsed.get(k,''))for k in KEYS.values()):raise ValueError('Incomplete manifest response')
   elif not isinstance(parsed,list)or not parsed:raise ValueError('Empty or non-list source collection')
  elif b'<html'not in b.lower():raise ValueError('Official reference is not HTML')
  receipt=dict(url=url,checkedAt=now(),status=status,bytes=len(b),sha256=sha(b))
  pending=body.with_suffix('.body.tmp');pending.write_bytes(b);pending.replace(body)
  pending=meta.with_suffix('.json.tmp');pending.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');pending.replace(meta)
 b=body.read_bytes();receipt=json.loads(meta.read_text())
 if receipt['url']!=url or receipt['sha256']!=sha(b):raise ValueError('Source cache identity mismatch: '+key)
 return json.loads(b)if json_body else b.decode(),dict(key=key,**receipt)

def load_sources(directory,refresh=False):
 # Official Korean source is checked before the community numerical references.
 official,receipt=load_one(directory,'kr-home',OFFICIAL_KR,refresh,False)
 manifest,mrec=load_one(directory,'gametora-manifest',MANIFEST,refresh)
 if not isinstance(manifest,dict)or any(not re.fullmatch(r'[a-f0-9]{8}',manifest.get(k,''))for k in KEYS.values()):raise ValueError('Incomplete GameTora public manifest')
 data={};receipts=[receipt,mrec]
 for key,name in KEYS.items():
  data[key],r=load_one(directory,'gt-'+key,GT+'/data/umamusume/'+name+'.'+manifest[name]+'.json',refresh);receipts.append(r)
 data['base'],r=load_one(directory,'uma-data',UMA_DATA,refresh);receipts.append(r)
 if any(not isinstance(v,list)or not v for v in data.values()):raise ValueError('Incomplete source collection')
 return data,receipts

def regional_skill(source,server,inherited=False):
 """Same documented shallow-field / nested-gene merge as GameTora's viewer."""
 out=copy.deepcopy(source);regional=source.get('loc',{}).get(server,{})
 for key,value in regional.items():
  if key=='gene_version':out[key]={**out.get(key,{}),**copy.deepcopy(value)}
  else:out[key]=copy.deepcopy(value)
 if inherited:
  gene=out.get('gene_version')
  if not isinstance(gene,dict):raise ValueError('Missing exact inherited source')
  # Inherited glyph/name are the same skill family; absent descriptions stay blank.
  out={**{k:out[k]for k in ['jpname','enname','name_en','name_ko','name_tw']if k in out},**gene}
 return out

def category_ids(card,key,server):
 v=card.get(key+'_'+server,card.get(key,[]))
 if v==-1:return []
 if not isinstance(v,list):raise ValueError('Invalid source skill binding')
 return v

def format_effect(effect):
 t=effect['type'];v=effect['value'];d=Decimal(str(v))/10000
 if t not in EFFECT_LABELS:raise ValueError('Unknown native effect type: '+str(t))
 if t==6:return '大逃げ'if v==0 else str(v)
 if t in [38,41,49,50]:return '✓'
 if t==9:return number(Decimal(str(v))/100)+'%'
 if t in [21,22,27,28]:return number(d)+' m/s'
 if t in [31,48]:return number(d)+' m/s²'
 if t in [13,14]:return number(d)+' s'
 if t==8:return number(d)+' m'
 if t==29:return number(d)+' pp'
 if t==35:return number(Decimal(str(v))/100)+'%'
 if t in [10,42]:return '×'+number(d)
 return number(d)

def skill_copies(skill,server):
 names=C(skill.get('name_ko',''),skill.get('name_en')or skill.get('enname',''),skill.get('jpname',''),skill.get('name_tw',''))
 # The source's community English JP description is distinct from Global text.
 en=(skill.get('endesc_old')or skill.get('endesc'))if server=='ja' else (skill.get('desc_en')or skill.get('endesc'))
 descriptions=C(skill.get('desc_ko',''),en or '',skill.get('jpdesc',''),skill.get('desc_tw',''))
 return {l:clean(v)for l,v in names.items()},{l:clean(v)for l,v in descriptions.items()}

def append_evolution(descriptions,strings):
 if not strings:return descriptions
 headers=C('진화 조건','Evolution requirements','進化条件','进化条件')
 original=C('일본어 원문','Japanese original','日本語原文','日文原文')
 lang={'ko':'ko','en':'en','ja':'ja','zh':'zh_tw'}
 for l in LOCALES:
  groups=strings.get(lang[l]);fallback=not groups
  if fallback:groups=strings.get('ja')
  if not groups:raise ValueError('Missing published evolution conditions')
  # An AND of OR groups is preserved; never flatten alternate conditions to AND.
  lines=[]
  for i,group in enumerate(groups):
   if not isinstance(group,list)or not group:raise ValueError('Invalid evolution condition group')
   lines.append(str(i+1)+'. '+(C(' 또는 ',' / OR / ',' または ',' 或 ')[l].join(clean(v)for v in group)))
  text=headers[l]+(' ('+original[l]+')'if fallback else'')+':\n'+'\n'.join(lines)
  descriptions[l]=(descriptions[l]+'\n\n'+text).strip()
 return descriptions

def table(skill,region,category,level=None,evo_strings=None,inherited=False):
 server=SERVERS[region];source=regional_skill(skill,server,inherited)
 names,descriptions=skill_copies(source,server)
 if category=='evolution':descriptions=append_evolution(descriptions,evo_strings)
 typ=CATEGORIES.get(category)
 if category=='awakening':typ=C(f'각성 Lv.{level}',f'Awakening Lv.{level}',f'覚醒 Lv.{level}',f'觉醒 Lv.{level}')
 if category=='unique'and source.get('rarity')==3:typ=add_copies(typ,C('★1~2','★1–2','★1〜2','★1～2'))
 if category=='unique'and source.get('rarity')in [4,5]:typ=add_copies(typ,C('★3 이상','★3+','★3以上','★3以上'))
 # Every visible numerical row is the actual selected server's base record.
 basis=add_copies(SERVER_LABELS[region],C('공개 원문 기본 효과 · 성장·거리·조건 배율 적용 전','Published base effects, before level, course-distance and conditional scaling.','公開された基礎効果。レベル・距離・条件倍率の適用前。','公开基础效果；未应用等级、赛程距离及条件倍率。'))
 values=[]
 def row(id,label,value):values.append(dict(id=id,label=label,levels=[str(value)]))
 if source.get('cost')is not None:row('cost',C('기본 스킬 Pt','Base skill Pt','基本スキルPt','基础技能Pt'),source['cost'])
 activation={0:C('확정','Guaranteed','確定','必定'),1:C('지능 판정','Wit check','賢さ判定','智力判定')}.get(source.get('activation'))
 if activation:
  for l in LOCALES:
   if descriptions[l]:descriptions[l]+='\n'+C('발동 판정: ','Activation: ','発動判定：','发动判定：')[l]+activation[l]
  if not any(descriptions.values()):row('activation',add_copies(C('발동 판정','Activation','発動判定','发动判定'),activation),'✓')
 for i,g in enumerate(source.get('condition_groups',[])):
  suffix=''if len(source['condition_groups'])==1 else f' {i+1}'
  label=add_copies(C('기본 지속 시간','Base duration','基準持続時間','基础持续时间'),{l:suffix for l in LOCALES},'')
  if g.get('time_scale'):label=add_copies(label,C('조건별 변동','Conditional scaling','条件によって変動','按条件变化'))
  if g.get('base_time') is not None:row(f'duration:{i}',label,'—'if g['base_time']==-1 else number(Decimal(str(g['base_time']))/10000)+' s')
  if g.get('cd'):row(f'cooldown:{i}',C('기본 재발동 대기','Base cooldown','基本クールダウン','基础冷却时间'),number(Decimal(str(g['cd']))/10000)+' s')
  for j,e in enumerate(g.get('effects',[])):
   label=EFFECT_LABELS.get(e['type'])
   if not label:raise ValueError('Unmapped native effect')
   if e['type']==6 and e['value']==0:label=add_copies(label,C('대도주','Runaway','大逃げ','大逃'))
   if suffix:label=add_copies(label,{l:suffix for l in LOCALES},'')
   if e.get('value_scale')or e.get('additional_activation'):label=add_copies(label,C('조건별 변동 · 기본값','Conditional; base value','条件変動・基礎値','条件变化；基础值'))
   row(f'effect:{i}:{j}',label,'✓'if e['type']==6 and e['value']==0 else format_effect(e))
 iconid=source.get('iconid')
 out=dict(id=f"uma:{source['id']}:{category}"+(f':{level}'if level else''),name=names,type=typ,icon=MEDIA+f'/umamusume/skills/icon/{iconid}.png',sourceUrl=GT+'/umamusume/skills',sourceKind='community',basis=basis,description=descriptions,values=values)
 if category=='unique':
  if source.get('rarity')==3:out.update(minStars=1,maxStars=2)
  elif source.get('rarity')in [4,5]:out.update(minStars=3,maxStars=5)
 if category=='inherited':out.update(minStars=3,maxStars=5)
 if any(len(v)>3000 for c in [names,descriptions,typ,basis]for v in c.values()):raise ValueError('Source description exceeds schema bound')
 return out

def star_progression(card,base):
 rows=[];rarity=int(card['rarity'])
 source=base['UmaBaseStats']
 for stars in range(rarity,6):
  v=source.get(f'{stars}★')
  field={2:'two_star_stats',3:'three_star_stats',4:'four_star_stats',5:'five_star_stats'}.get(stars)
  expected=card['base_stats']if stars==rarity else card.get(field)
  # UmaTools omits some actual 2/3-star rows. GameTora publishes them directly;
  # use those source integers, never interpolate from natural-rarity and5-star.
  if v is None and isinstance(expected,list)and len(expected)==5:v=dict(zip(RAW_STATS,expected))
  if not isinstance(v,dict)or set(v)!=set(RAW_STATS):raise ValueError('Missing actual star panel '+str(card['card_id']))
  vals={s:str(v[k])for s,k in zip(STATS,RAW_STATS)}
  if any(not x.isdigit()or int(x)<1 for x in vals.values()):raise ValueError('Invalid initial panel')
  if expected is not None and list(map(int,vals.values()))!=expected:raise ValueError('Independent source star panel mismatch')
  rows.append(dict(level=stars,values=vals))
 return dict(sourceUrl=GT+'/umamusume/characters/'+card['url_name'],sourceKind='community',basis=BASE_BASIS,stats=[dict(id=s,label=STAT_LABELS[s],icon=STAT_ICONS[s])for s in STATS],rows=rows,levelLabel=C('성급','Star rarity','才能開花','星级'),levelPrefix='★',defaultLevel=rarity)

def enrich(doc,sources,receipts=(),asof=None):
 if doc.get('gameId')!='umamusume':raise ValueError('Wrong game identity')
 asof=asof or dt.datetime.now(dt.timezone.utc).date().isoformat()
 cards={str(c['card_id']):c for c in sources['cards']};base={str(c['UmaId']):c for c in sources['base']};skills={int(s['id']):s for s in sources['skills']};evolutions={str(c['card_id']):c for c in sources['evolutions']if'card_id'in c};strings={str(c['card_id']):c['skills']for c in sources['evo_strings']}
 if len(cards)!=len(sources['cards'])or len(skills)!=len(sources['skills']):raise ValueError('Duplicate source identity')
 out=copy.deepcopy(doc);catalog=dict(version=1,sourceUrl=MANIFEST,checkedAt=max((r['checkedAt']for r in receipts),default=now()),skills={},forms={});counts={r:dict(forms=0,unique=0,innate=0,awakening=0,evolution=0,event=0,inherited=0)for r in SERVERS};audit=[];future=[];reconciled=[]
 for c in out['characters']:
  cid=c['id'];card=cards[cid];raw=base[cid]
  if str(card['card_id'])!=cid or raw['UmaSlug']!=c['sourceId']:raise ValueError('Outfit source identity mismatch '+cid)
  available=[]
  for r,key in [('jp','release'),('kr','release_ko'),('global','release_en')]:
   date=card.get(key)
   if date and re.fullmatch(r'\d{4}-\d{2}-\d{2}',date):
    if date<=asof:available.append(r)
    else:future.append(dict(id=cid,region=r,date=date))
  if not available:raise ValueError('No currently released source service '+cid)
  if set(c.get('regions',[]))!=set(available):reconciled.append(dict(id=cid,before=c.get('regions',[]),after=available))
  c['regions']=available
  p=star_progression(card,raw)
  stats=[dict(id=s,label=STAT_LABELS[s],value=p['rows'][0]['values'][s],basis=BASE_BASIS,icon=STAT_ICONS[s])for s in STATS]
  for i,s in enumerate(STATS):stats.append(dict(id='growth-'+s,label=STAT_LABELS[s],value=str(card['stat_bonus'][i])+'%',basis=GROWTH_BASIS,group='detail',icon=STAT_ICONS[s]))
  for t in c.get('traits',[]):
   grade=t.get('value',{}).get('en')
   if grade in GRADE:t['icon']=MEDIA+'/umamusume/ui/rank/simple/'+GRADE[grade]+'.png'
  c.update(stats=stats,statProgression=p,statDetailLabel=GROWTH_LABEL)
  links=c.get('detailSources',[])+[dict(url=GT+'/umamusume/characters/'+card['url_name'],kind='community'),dict(url=GT+'/umamusume/skills',kind='community')]
  c['detailSources']=list({v['url']:v for v in links}.values())
  refs={}
  for region in available:
   server=SERVERS[region];lst=[];counts[region]['forms']+=1
   bindings=[('unique',i,None)for i in category_ids(card,'skills_unique',server)]+[('innate',i,None)for i in category_ids(card,'skills_innate',server)]+[('awakening',i,n+2)for n,i in enumerate(category_ids(card,'skills_awakening',server))]+[('event',i,None)for i in category_ids(card,'skills_event',server)]
   eallowed={int(e['new'])for e in evolutions.get(cid,{}).get('evolutions',[])if server in e.get('servers',[])}
   for e in category_ids(card,'skills_evo',server):
    if int(e['new'])in eallowed:bindings.append(('evolution',e['new'],None))
   for category,sid,level in bindings:
    source=skills[int(sid)]
    if server in source.get('unreleased',[]):continue
    es=strings.get(cid,{}).get(str(sid))if category=='evolution'else None
    t=table(source,region,category,level,es)
    key=sha(packed(t));catalog['skills'][key]=t;lst.append(key);counts[region][category]+=1
    if category=='unique'and source.get('gene_version'):
     inherited=table(source,region,'inherited',inherited=True)
     # Low-star and upgraded unique skills can share the exact same inheritance.
     if not any(catalog['skills'][k]['id']==inherited['id']for k in lst):
      key=sha(packed(inherited));catalog['skills'][key]=inherited;lst.append(key);counts[region]['inherited']+=1
   if len(lst)>40 or len({catalog['skills'][key]['id']for key in lst})!=len(lst):raise ValueError('Invalid service skill table count or identity '+cid+'/'+region)
   refs[region]=lst
  detail=dict(sourceId=c['sourceId'],stats=stats,statProgression=p,statDetailLabel=GROWTH_LABEL,traits=c.get('traits',[]),regionalSkillRefs=refs)
  catalog['forms'][cid]=detail
  audit.append(dict(id=cid,stars=[r['level']for r in p['rows']],services={r:len(x)for r,x in refs.items()}))
 out['sourceUrls']=list(dict.fromkeys(out.get('sourceUrls',[])+[r['url']for r in receipts if r['url']!=OFFICIAL_KR]))
 if len(out['sourceUrls'])>40:raise ValueError('Too many provenance sources')
 if receipts:out['checkedAt']=catalog['checkedAt']
 manifest=dict(status='ok',generatedAt=now(),asof=asof,sourceKind='community',sourceReceipts=list(receipts),counts=counts,catalogTables=len(catalog['skills']),identities=len(catalog['forms']),sourceIdentityPreserved=True,artworkPreserved=True,serviceReconciliation=reconciled,futureReleases=future,forms=audit,limits=dict(EnglishEvolutionRequirements='Japanese original explicitly marked where no native English condition string is published.',dynamicEffects='Published base value only; no invented conditional multiplier.',servicePolicy='Exact source release dates and service-specific bindings/loc overrides; no Chinese gameplay service added.',inheritance='Source rarity enum3 is the1/2-star unique; enums4/5 are3+star. Green unique skill factors require3+star parent, verified at https://gametora.com/umamusume/legacies .'),sourceGaps=[dict(id=t['id'],key=key,reason='No native inherited description in source; published activation/numerical/cost rows retained without invented prose.')for key,t in catalog['skills'].items()if not any(t.get('description',{}).values())])
 return out,catalog,manifest

def collect_icons(doc,catalog):
 usage={}
 def walk(v,path):
  if isinstance(v,dict):
   for k,x in v.items():
    if k=='icon'and isinstance(x,str):usage.setdefault(x,[]).append(path)
    else:walk(x,path+'/'+str(k))
  elif isinstance(v,list):
   for i,x in enumerate(v):walk(x,path+'/'+str(i))
 walk(doc,'roster');walk(catalog,'catalog');return usage

def download_icons(usage,directory):
 from PIL import Image
 directory=Path(directory);directory.mkdir(parents=True,exist_ok=True)
 def fetch(item):
  url,uses=item;receipt=directory/(sha(url.encode())+'.json')
  if receipt.exists():
   old=json.loads(receipt.read_text());p=directory/old['file']
   if old.get('url')==url and old.get('status')==200 and p.exists()and sha(p.read_bytes())==old['sha256']:return dict(old,uses=uses)
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'GAGETHER-detail-research/1.0'}),timeout=35)as r:b=r.read();status=r.status
  with Image.open(io.BytesIO(b))as im:width,height=im.size;fmt=im.format
  if fmt not in ['PNG','WEBP','JPEG']or width<1 or height<1:raise ValueError('Invalid native icon')
  ext='jpg'if fmt=='JPEG'else fmt.lower();digest=sha(b);file=digest+'.'+ext;(directory/file).write_bytes(b)
  out=dict(url=url,status=status,checkedAt=now(),sha256=digest,bytes=len(b),width=width,height=height,format=fmt,file=file,uses=uses)
  receipt.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');return out
 assets=[];failures=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=8)as pool:
  jobs={pool.submit(fetch,x):x[0]for x in usage.items()}
  for job in concurrent.futures.as_completed(jobs):
   try:assets.append(job.result())
   except Exception as e:failures.append(dict(url=jobs[job],error=str(e)))
 return dict(declaredCount=len(usage),downloadedCount=len(assets),assets=sorted(assets,key=lambda a:a['url']),failures=failures)

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--input',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);p.add_argument('--source-dir',type=Path,required=True);p.add_argument('--refresh',action='store_true');p.add_argument('--download-icons',action='store_true');p.add_argument('--asof');a=p.parse_args()
 doc=json.loads(a.input.read_text());source,receipts=load_sources(a.source_dir,a.refresh);out,catalog,manifest=enrich(doc,source,receipts,a.asof)
 a.output_dir.mkdir(parents=True,exist_ok=True)
 b=packed(out)+b'\n'
 if len(b)>4_400_000:raise ValueError('Light source roster exceeds4.4MB; no output truncated')
 for name,obj in [('umamusume.json',out),('catalog.json',catalog)]:
  body=packed(obj)+b'\n';target=a.output_dir/name;pending=target.with_suffix('.json.tmp');pending.write_bytes(body);pending.replace(target);manifest.setdefault('outputs',{})[name]=dict(bytes=len(body),sha256=sha(body))
 usage=collect_icons(out,catalog);manifest['icons']=dict(declared=len(usage))
 if a.download_icons:
  inventory=download_icons(usage,a.output_dir/'icons');(a.output_dir/'icons/inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2)+'\n');manifest['icons'].update(downloaded=inventory['downloadedCount'],failures=inventory['failures'])
 (a.output_dir/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(dict(status=manifest['status'],outputs=manifest['outputs'],counts=manifest['counts'],tables=manifest['catalogTables'],icons=manifest['icons']),ensure_ascii=False))

if __name__=='__main__':main()
