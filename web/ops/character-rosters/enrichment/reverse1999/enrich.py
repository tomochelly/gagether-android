#!/usr/bin/env python3
"""Exact-ID Reverse:1999 native combat details; no Site writes or fabricated values.

Global client languages and CN client facts are kept separate. Public native
mirrors are community provenance, never official server publication evidence.
"""
from __future__ import annotations
import argparse,copy,datetime as dt,hashlib,html,json,re,unicodedata
from pathlib import Path

LOCALES=('ko','en','ja','zh')
BASE='https://raw.githubusercontent.com/St-Pavlov-Foundation/'
GLOBAL=BASE+'re1999-data-global/main/data/'
CN=BASE+'re1999-data/main/data/'
ROOT=Path(__file__).resolve().parent

def packed(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
def now():return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00','Z')
def sha(b):return hashlib.sha256(b).hexdigest()
def C(ko='',en='',ja='',zh=''):return dict(zip(LOCALES,(ko,en,ja,zh)))
def norm(v):return re.sub(r'[\W_]+','',unicodedata.normalize('NFKC',str(v)).casefold(),flags=re.UNICODE)
def clean(v):
 s=str(v or '').replace('\\n','\n')
 s=re.sub(r'▩(\d)%s<(\d)>',lambda m:'▩'+m[1]+m[2]+'%s',s)
 s=re.sub(r'<br\s*/?>|</(?:p|li)>','\n',s,flags=re.I)
 s=html.unescape(re.sub('<[^>]*>','',s))
 return re.sub(r'\n{3,}','\n\n',s).strip()

def unique_character(character,rows,languages):
 """Join only an existing canonical row, in any actually native name slot.

 heroType is species, not a playable boolean: APPLe=5, Voyager=4, Pavia=2.
 Type0 records include a second non-player APPLe3999 and are excluded.
 """
 known={norm(n)for n in character['name'].values()if norm(n)};matches=[]
 for r in rows:
  if str(r.get('isOnline'))!='1' or not isinstance(r.get('heroType'),int) or r['heroType']<=0:continue
  if not r.get('skinId') or not r.get('skill'):continue
  names=[r.get('nameEng',''),r.get('name',''),*(m.get(r.get('name'),'')for m in languages.values())]
  if known&{norm(n)for n in names if n and not str(n).startswith('language_')}:matches.append(r)
 if len(matches)>1:raise ValueError('Ambiguous exact native identity: '+character['id'])
 return matches[0]if matches else None

def description_parameters(descriptions):
 """Losslessly split only strings, so long native effects fit cell bounds.

 UI replaces adjacent placeholders verbatim. This preserves each complete rank,
 without reducing a long effect to a summary or inventing level coefficients.
 """
 maximum=len(next(iter(descriptions.values())))
 templates=C();parameters={}
 for l,values in descriptions.items():
  if len(values)!=maximum:raise ValueError('Native rank range mismatch')
  width=max(1,max((len(v)+149)//150 for v in values))
  if width>100:raise ValueError('Native description exceeds parameter bound')
  templates[l]=''.join('{'+str(i+1)+'}'for i in range(width))
  parameters[l]=[[v[i*150:(i+1)*150]for v in values]for i in range(width)]
 return templates,parameters

class Native:
 def __init__(self,path,cn=False):
  self.path=Path(path);self.cn=cn;self.base=CN if cn else GLOBAL;self.receipts=[]
  self.characters=self.load('character.json','json/',fallback='character.body')
  self.skills={r['id']:r for r in self.load('skill.json','json/')}
  self.effects={r['id']:r for r in self.load('skill_effect.json','json/')}
  self.passives=self.load('skill_passive_level.json','json/')
  self.portrays=self.load('skill_ex_level.json','json/')
  self.devices={r['id']:r for r in self.load('fight_device.json','json/')}
  self.rank_replaces=self.load('character_rank_replace.json','json/')
  self.choices={r['id']:r for r in self.load('fight_card_choice.json','json/',fallback='../cn-choice.json'if cn else'global-choice.json')}
  self.languages={}if cn else{l:{r['key']:r['content']for r in self.load('language_'+name+'.json','configs/language/')}for l,name in [('ko','kr'),('en','en'),('ja','jp'),('zh','zh')]}
 def load(self,name,prefix,fallback=None):
  path=self.path/name
  if not path.exists()and fallback:path=self.path/fallback
  b=path.read_bytes();value=json.loads(b)
  # Existing fetched source mtimes are the real source retrieval clocks. Replay
  # does not advance them. New downloads must retain independent HTTP receipts.
  receipt_file=self.path/(name+'.receipt.json')
  if receipt_file.exists():
   receipt=json.loads(receipt_file.read_text())
   if receipt['sha256']!=sha(b)or receipt['bytes']!=len(b):raise ValueError('Native cache receipt mismatch')
  else:receipt={'url':self.base+prefix+name,'bytes':len(b),'sha256':sha(b),'checkedAt':dt.datetime.fromtimestamp(path.stat().st_mtime,dt.timezone.utc).isoformat().replace('+00:00','Z')}
  self.receipts.append({**receipt,'mode':'validated-source-replay'})
  return value
 def text(self,value):
  if self.cn:return C(zh=clean(value))
  return {l:clean(m.get(value,''))for l,m in self.languages.items()}
 def skill(self,ident,hero,shared=False):
  row=self.skills.get(int(ident))
  if not row or not shared and row.get('heroId')not in (0,hero['id']):raise ValueError('Unbound native skill identity')
  if row['skillEffect']not in self.effects:raise ValueError('Missing native effect identity')
  return row
 def effect(self,skill):return self.text(self.effects[skill['skillEffect']]['desc'])

def source_basis(cn=False):
 return C('중국 서비스 클라이언트 원문 · 한국·글로벌 서비스와 별도'if cn else'글로벌 클라이언트 한국어·영어·일본어·중국어 원문 · 중국 서비스 수치와 별도',
          'CN client original; separate from KR/Global client facts.'if cn else'Global client native KO/EN/JA/ZH text; separate from CN client facts.',
          '中国サーバーのクライアント原文。韓国・Globalとは別。'if cn else'Globalクライアントの韓・英・日・中原文。中国サーバーとは別。',
          '中国大陆客户端原文；与韩服、国际服分别保存。'if cn else'国际服客户端韩英日中原文；与中国大陆客户端分别保存。')

def native_tables(native,hero,icons=None):
 icons=icons or{};tables=[];groups=[];references={}
 replacement=[r for r in native.rank_replaces if r.get('id')==hero['id']]
 if len(replacement)>1:raise ValueError('Ambiguous native rank replacement identity')
 if replacement:
  # The native skill formatter explicitly uses getHeroRankReplaceConfig for
  # Portray labels. Keep the separate original actions in their own tables.
  original=hero;hero={**hero,**replacement[-1]}
  for part in original['skill'].split('|'):
   ids=[int(v)for v in part.split(',')[0].split('#')[1:]]
   rows=[native.skill(v,hero)for v in dict.fromkeys(ids)if v in native.skills]
   if rows:groups.append(('pre-insight-'+part.split('#')[0],rows,'replacement'))
 for part in hero['skill'].split('|'):
  cells=part.split(',')[0].split('#');index=int(cells[0]);ids=[int(v)for v in cells[1:]if v]
  if not ids:continue
  rows=[native.skill(v,hero)for v in dict.fromkeys(ids)if v in native.skills]
  if not rows:raise ValueError('Missing all declared incantation ranks')
  if hero.get('deviceId'):
   # Device cards are distinct actions, not three incantation star ranks.
   for i,row in enumerate(rows,1):groups.append((str(index)+'-device-'+str(i),[row],'device'));references[index*10+i]=native.text(row['name'])
  else:groups.append((str(index),rows,'incantation'))
  references[index]=native.text(rows[0]['name'])
  # Native fight_card_choice binds Brume and Nautika's conditional actions.
  choices=[]
  for row in rows:
   branch=native.choices.get(row['id'])
   if branch:choices.append([int(v)for v in branch['choiceSkIlls'].split('#')])
  if choices:
   for i in range(max(map(len,choices))):
    branch_rows=[native.skill(ids[i],hero)for ids in choices if i<len(ids)]
    groups.append((str(index)+'-choice-'+str(i+1),branch_rows,'choice'))
    references[index*10+i+1]=native.text(branch_rows[0]['name'])
 if hero.get('exSkill'):
  ultimate=native.skill(hero['exSkill'],hero);groups.insert(0,('ultimate',[ultimate],'ultimate'));references[3]=native.text(ultimate['name'])
 for row in native.passives:
  if row['heroId']==hero['id']and row.get('skillPassive'):
   skill=native.skill(row['skillPassive'],hero);groups.append(('insight-'+str(row['skillLevel']),[skill],'insight'))
   if row['skillLevel']==1:references[0]=native.text(skill['name'])
 device=native.devices.get(hero.get('deviceId'))
 if device:
  for field in ['powerSkill','specialPowerSkill']:
   for record in device.get(field,'').split('|'):
    if record:
     ident=int(record.split('#')[0]);row=native.skill(ident,hero,shared=True)
     groups.append(('energy-'+field+'-'+str(ident),[row],'energy'))
 for key,rows,kind in groups:
  hero_names=native.text(hero.get('name',''))
  name=native.text(rows[0]['name']);descs={l:[native.effect(r)[l].replace('{name}',hero_names[l])for r in rows]for l in LOCALES if any(native.effect(r)[l]for r in rows)}
  if not descs or any(not v for values in descs.values()for v in values):raise ValueError('Incomplete native rank effect')
  types={'incantation':C('일반 주문','Incantation','通常スペル','普通咒语'),'replacement':C('전환 전 주문','Action before replacement','切替前のスペル','替换前咒语'),'choice':C('선택 주문','Choice incantation','選択スペル','可选咒语'),'device':C('장치 주문','Device incantation','装置スペル','装置咒语'),'energy':C('장치 에너지 주문','Device energy incantation','装置エネルギースペル','装置能量咒语'),'ultimate':C('최종 술식','Ultimate','アルティメット','至终的仪式'),'insight':C('통찰 패시브','Insight passive','洞察パッシブ','洞悉传承')}
  if kind=='insight':
   if key.endswith('-0'):types[kind]=C('기본 특성','Base trait','基本特性','基础特性')
   else:types[kind]={l:v+' '+key.rsplit('-',1)[1]for l,v in types[kind].items()}
  table={'id':('cn:'if native.cn else'global:')+str(hero['id'])+':'+key,'name':name,'type':types[kind],'sourceUrl':native.base+'json/skill.json','sourceKind':'community','basis':source_basis(native.cn),'regions':['cn']if native.cn else['global','kr','jp'],'values':[]}
  if native.cn:table['nameLocale']='zh'
  if len(rows)>1:
   template,params=description_parameters(descs);table.update(maxLevel=len(rows),descriptionTemplate=template,parameters=params,levelLabels=[C(str(i)+' ★',str(i)+' ★',str(i)+' ★',str(i)+' ★')for i in range(1,len(rows)+1)])
  else:table['description']={l:descs[l][0]if l in descs else''for l in LOCALES}
  icon=icons.get(str(rows[0].get('icon'))or'')or icons.get(norm(name['en']))
  if icon:table['icon']=icon
  if kind=='insight'and icons.get('insight:'+key.rsplit('-',1)[1]):table['icon']=icons['insight:'+key.rsplit('-',1)[1]]
  tables.append(table)
 portrays=sorted([r for r in native.portrays if r['heroId']==hero['id']],key=lambda r:r['skillLevel'])
 if portrays:
  if [r['skillLevel']for r in portrays]!=list(range(1,len(portrays)+1)):raise ValueError('Noncontiguous native Portray range')
  descriptions={l:[]for l in (['zh']if native.cn else LOCALES)}
  for r in portrays:
   for l,v in native.text(r['desc']).items():
    if l not in descriptions:continue
    def replace(m):
     key=int(m[1]);label=references.get(key,{}).get(l)
     if not label:raise ValueError('Unknown Portray native skill-name placeholder')
     return '['+label+']'
    value=re.sub(r'▩(\d+)%s',replace,v).replace('{name}',native.text(hero.get('name',''))[l])
    if not value or '%s'in value or '▩'in value:raise ValueError('Unresolved native Portray text')
    descriptions[l].append(value)
  template,params=description_parameters(descriptions)
  table={'id':('cn:'if native.cn else'global:')+str(hero['id'])+':portray','name':C('형상','Portray','塑造','塑造'),'type':C('형상 강화','Portray enhancement','塑造強化','塑造强化'),'sourceUrl':native.base+'json/skill_ex_level.json','sourceKind':'community','basis':source_basis(native.cn),'regions':['cn']if native.cn else['global','kr','jp'],'maxLevel':len(portrays),'levelLabels':[C('형상 '+str(r['skillLevel']),'Portray '+str(r['skillLevel']),'塑造 '+str(r['skillLevel']),'塑造 '+str(r['skillLevel']))for r in portrays],'descriptionTemplate':template,'parameters':params,'values':[]}
  tables.append(table)
 return tables

def parse_flight(source):
 chunks=[];decoder=json.JSONDecoder()
 for m in re.finditer(r'self\.__next_f\.push\(',source):
  try:
   x,_=decoder.raw_decode(source,m.end())
   if isinstance(x,list)and len(x)>1 and isinstance(x[1],str):chunks.append(x[1])
  except(ValueError,TypeError):pass
 text=''.join(chunks);m=re.search(r'"character"\s*:',text)
 if not m:raise ValueError('Missing inert character profile')
 return decoder.raw_decode(text,m.end())[0]

def enrich(document,global_native,cn_native,profile_dir=None,asset_report=None):
 if document['gameId']!='reverse1999':raise ValueError('Wrong game')
 out=copy.deepcopy(document);report={'status':'ok','characters':len(out['characters']),'global':0,'cn':0,'identities':[],'failures':[],'notApplicable':[],'sources':global_native.receipts+cn_native.receipts,'profileReads':0,'artCandidates':[],'iconUrls':[]}
 stats_icons={};profiles={};insight_icons={}
 asset_report=asset_report or{};native_icons=asset_report.get('skillIcons',{})
 if profile_dir:
  for c in out['characters']:
   path=Path(profile_dir)/(c['id']+'.html');receipt=Path(profile_dir)/(c['id']+'.receipt.json')
   if not path.exists()or not receipt.exists():continue
   try:
    meta=json.loads(receipt.read_text());b=path.read_bytes()
    if meta['url']!=c['sourceUrl']or meta['sha256']!=sha(b):raise ValueError('Profile receipt identity mismatch')
    source=b.decode();p=parse_flight(source)
    if p['slug']!=c['sourceUrl'].rstrip('/').split('/')[-1]or norm(p['name'])!=norm(c['name']['en']):raise ValueError('Profile source character mismatch')
    profiles[c['id']]=p;report['sources'].append(meta);report['profileReads']+=1
    for i in range(1,4):
     url='https://cdn.prydwen.gg/images/re1999/icons/insight_'+str(i)+'.webp'
     if url in source:insight_icons['insight:'+str(i)]=url
    for sid,file in [('hp','atr_hp'),('atk','atr_atk'),('reality_def','atr_reality'),('mental_def','atr_mental'),('crit_rate','atr_critrate'),('crit_dmg','atr_critdmg')]:
     url='https://cdn.prydwen.gg/images/re1999/icons/'+file+'.webp'
     if url in source:stats_icons[sid]=url
   except Exception as error:report['failures'].append({'id':c['id'],'stage':'profile','error':str(error)})
 for c in out['characters']:
  icons={**native_icons,**insight_icons};p=profiles.get(c['id'])
  if p:
   for skill in p.get('skills',[]):
    if skill.get('name')and str(skill.get('image','')).startswith('https://'):icons[norm(skill['name'])]=skill['image']
   source=(Path(profile_dir)/(c['id']+'.html')).read_text()
   for i in range(1,4):
    url='https://cdn.prydwen.gg/images/re1999/icons/insight_'+str(i)+'.webp'
    if url in source:icons['insight:'+str(i)]=url
   report['iconUrls']+=list(icons.values())
   for key,kind,caption in [('imageFull','full-body',C('통찰 0 원본 일러스트','Insight 0 original illustration','洞察0オリジナルイラスト','洞悉0原始立绘')),('imageInsight','full-body',C('통찰 II 원본 일러스트','Insight II original illustration','洞察IIオリジナルイラスト','洞悉II原始立绘'))]:
    if p.get(key)and str(p[key]).startswith('https://'):
     report['artCandidates'].append({'characterId':c['id'],'url':p[key],'kind':kind,'sourceUrl':c['sourceUrl'],'sourceKind':'community','locale':'neutral','variant':key,'caption':caption})
  for stats in [c.get('stats',[]),*c.get('regionalStats',{}).values()]:
   for s in stats:
    if s['id']in stats_icons:s['icon']=stats_icons[s['id']]
  for trait in c.get('traits',[]):
   if trait['id']=='afflatus':
    trait['label']=global_native.text('language_10030938')
    key={'Beast':'language_10017231','Plant':'language_10017232','Star':'language_10017233','Mineral':'language_10017234','Spirit':'language_10017235','Intellect':'language_10017236'}.get(trait['value'].get('en'))
    if key:trait['value']=global_native.text(key)
    if asset_report.get('traitIcons',{}).get(c['id'],{}).get('afflatus'):trait['icon']=asset_report['traitIcons'][c['id']]['afflatus']
   if trait['id']=='damageType':
    trait['label']=C('피해 유형','Damage type','ダメージ種別','创伤类型')
    key={'Reality':'language_10018033','Mental':'language_10018034'}.get(trait['value'].get('en'))
    if key:trait['value']=global_native.text(key)
  regions={};identity={'id':c['id'],'name':c['name']['en']}
  for key,native in [('global',global_native),('cn',cn_native)]:
   supported=c.get('regions',[])
   if supported and (key=='global'and not any(r in supported for r in ['global','kr','jp'])or key=='cn'and'cn'not in supported):
    report['notApplicable'].append({'id':c['id'],'service':key,'reason':'Canonical regional coverage excludes this actual service'});continue
   try:
    hero=unique_character(c,native.characters,native.languages)
    if not hero:raise ValueError('No exact online native identity for this service')
    tables=native_tables(native,hero,icons)
    if not tables:raise ValueError('No source skill tables')
    identity[key]={'heroId':hero['id'],'heroType':hero['heroType'],'tables':len(tables)};regions[key]=tables;report[key]+=1
   except Exception as error:report['failures'].append({'id':c['id'],'stage':key,'error':str(error)})
  if regions.get('global'):
   c['skillTables']=regions['global']
   # These are the three actual services using this global client source.
   # CN always has its own exact character table, even when text is identical.
   c.setdefault('regionalSkillTables',{})['cn']=regions.get('cn',[])
  elif regions.get('cn'):
   c['skillTables']=regions['cn'];c.setdefault('regionalSkillTables',{})['cn']=regions['cn']
  sources=[{'url':native.base+'json/skill.json','kind':'community'}for region,native in [('global',global_native),('cn',cn_native)]if regions.get(region)]
  c['detailSources']=list({s['url']:s for s in [*c.get('detailSources',[]),*sources]}.values())
  report['identities'].append(identity)
 report['iconUrls']=sorted(set(report['iconUrls']+list(stats_icons.values())))
 if asset_report.get('records'):
  for c in out['characters']:
   original=c.get('image');records=[r for r in asset_report['records']if r['characterId']==c['id']]
   base=next((r for r in records if r['variant']=='base'),None)
   if not base:continue
   def image(r):return {k:r[k]for k in ['url','sourceUrl','kind','sourceKind','locale','width','height','caption']if k in r}
   c['image']=image(base)
   choices=[image(r)for r in records if r['url']!=base['url']]+[*c.get('images',[]),*([original]if original and original['url']!=base['url']else[])]
   c['images']=list({r['url']:r for r in choices}.values())[:10]
 if report['failures']:report['status']='partial'
 out['sourceUrls']=list(dict.fromkeys([*out['sourceUrls'],GLOBAL+'json/skill.json',GLOBAL+'json/skill_effect.json',GLOBAL+'json/skill_passive_level.json',GLOBAL+'json/skill_ex_level.json',CN+'json/character.json',CN+'json/skill.json',CN+'json/skill_effect.json',CN+'json/skill_passive_level.json',CN+'json/skill_ex_level.json']))
 out['checkedAt']=max(s['checkedAt']for s in report['sources'])
 if [(c['id'],c.get('sourceId'),c.get('regions'))for c in out['characters']]!=[(c['id'],c.get('sourceId'),c.get('regions'))for c in document['characters']]:raise ValueError('Canonical identity or regional coverage changed')
 return out,report

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--input',required=True,type=Path);ap.add_argument('--sources',required=True,type=Path);ap.add_argument('--profiles',type=Path);ap.add_argument('--assets',type=Path);ap.add_argument('--output',required=True,type=Path);ap.add_argument('--report',required=True,type=Path);args=ap.parse_args()
 raw=json.loads(args.input.read_text());doc=next(r for r in raw if r['gameId']=='reverse1999')if isinstance(raw,list)else raw
 out,report=enrich(doc,Native(args.sources),Native(args.sources/'cn',True),args.profiles,json.loads(args.assets.read_text())if args.assets else None)
 args.output.write_bytes(packed(out));args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':report['status'],'characters':len(out['characters']),'global':report['global'],'cn':report['cn'],'failures':len(report['failures']),'bytes':len(packed(out))}))
if __name__=='__main__':main()
