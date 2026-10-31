#!/usr/bin/env python3
"""Source-bound HoYo/Arknights reference enrichment; no account APIs or writes.

CLI: enrich_c.py --input-dir normalized --output-dir enriched [--source-root cache/sources]
Callable: enrich(game, document, cache_dir, source_root=None).
Failure returns/copies the unchanged complete input; the report carries failures.
Names marked translation are editorial renderings, not official Korean releases.
"""
from __future__ import annotations
import argparse,copy,concurrent.futures,datetime,hashlib,json,math,pathlib,tempfile,urllib.error,urllib.request
ROOT=pathlib.Path(__file__).resolve().parent
LOCALES=('ko','en','ja','zh')
GAMES=('genshin','hsr','zzz','arknights')
RAW='https://raw.githubusercontent.com/'
URLS={
 'gi_stats':RAW+'theBowja/genshin-db/main/src/data/stats/characters.json',
 'gi_curve':RAW+'theBowja/genshin-db/main/src/data/curve/characters.json',
 'gi_index':RAW+'theBowja/genshin-db/main/src/data/index/English/characters.json',
 'hsr_promotions':RAW+'Mar-7th/StarRailRes/master/index_new/en/character_promotions.json',
 'zzz_avatars':RAW+'EnkaNetwork/API-docs/master/store/zzz/avatars.json',
 'zzz_properties':RAW+'EnkaNetwork/API-docs/master/store/zzz/property.json',
 **{'ak_'+l:RAW+'ArknightsAssets/ArknightsGamedata/master/'+{'ko':'kr','ja':'jp','en':'en','zh':'cn'}[l]+'/gamedata/excel/character_table.json' for l in LOCALES},
 **{'hsr_'+kind+'_'+l:RAW+'Mar-7th/StarRailRes/master/index_new/'+{'ko':'kr','ja':'jp','en':'en','zh':'cn'}[l]+'/'+kind+'.json' for kind in ('paths','elements')for l in LOCALES},
}
# Labels are interface translations, not game data. Values below come from source tables.
def C(ko,en,ja,zh):return dict(zip(LOCALES,(ko,en,ja,zh)))
LABELS={'hp':C('HP','HP','HP','生命值'),'atk':C('공격력','ATK','攻撃力','攻击力'),'def':C('방어력','DEF','防御力','防御力'),'crit_rate':C('치명타 확률','CRIT Rate','会心率','暴击率'),'crit_dmg':C('치명타 피해','CRIT DMG','会心ダメージ','暴击伤害'),'spd':C('속도','SPD','速度','速度'),'impact':C('충격력','Impact','衝撃力','冲击力'),'proficiency':C('이상 마스터리','Anomaly Proficiency','異常マスタリー','异常精通'),'mastery':C('이상 장악력','Anomaly Mastery','異常掌握','异常掌控'),'res':C('마법 저항','RES','術耐性','法术抗性'),'cost':C('배치 코스트','DP Cost','配置コスト','部署费用'),'block':C('저지 수','Block','ブロック数','阻挡数'),'interval':C('공격 간격','Attack interval','攻撃間隔','攻击间隔')}
TRAIT_LABELS={'element':C('속성','Element','属性','属性'),'weapon':C('무기','Weapon','武器','武器'),'path':C('운명의 길','Path','運命','命途'),'specialty':C('특성','Specialty','特性','特性'),'profession':C('직군','Class','職業','职业'),'position':C('배치 위치','Position','配置位置','部署位置')}
PROFESSIONS={'PIONEER':C('뱅가드','Vanguard','先鋒','先锋'),'WARRIOR':C('가드','Guard','前衛','近卫'),'TANK':C('디펜더','Defender','重装','重装'),'SNIPER':C('스나이퍼','Sniper','狙撃','狙击'),'CASTER':C('캐스터','Caster','術師','术师'),'MEDIC':C('메딕','Medic','医療','医疗'),'SUPPORT':C('서포터','Supporter','補助','辅助'),'SPECIAL':C('스페셜리스트','Specialist','特殊','特种')}
POSITIONS={'MELEE':C('근거리','Melee','近距離','近战'),'RANGED':C('원거리','Ranged','遠距離','远程')}
SPECIALTIES={'Stun':C('격파','Stun','撃破','击破'),'Attack':C('강공','Attack','強攻','强攻'),'Support':C('지원','Support','支援','支援'),'Anomaly':C('이상','Anomaly','異常','异常'),'Defense':C('방어','Defense','防護','防护'),'Rupture':C('명파','Rupture','命破','命破')}
ELEMENTS={'Physics':C('물리','Physical','物理','物理'),'Wind':C('바람','Wind','風','风'),'FireFrost':C('서리','Frost','霜烈','烈霜'),'AuricEther':C('현묵','Auric Ink','玄墨','玄墨'),'Phys':C('물리','Physical','物理','物理'),'Physical':C('물리','Physical','物理','物理'),'Elec':C('전기','Electric','電気','电'),'Electric':C('전기','Electric','電気','电'),'Fire':C('불','Fire','炎','火'),'Ice':C('얼음','Ice','氷','冰'),'Ether':C('에테르','Ether','エーテル','以太'),'AuricInk':C('현묵','Auric Ink','玄墨','玄墨'),'Frost':C('서리','Frost','霜烈','霜烈')}

def now():return datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z')
def atomic(path,data):
 path=pathlib.Path(path);path.parent.mkdir(parents=True,exist_ok=True)
 with tempfile.NamedTemporaryFile(dir=path.parent,delete=False)as f:f.write(data);p=pathlib.Path(f.name)
 p.replace(path)
def dump(path,d):atomic(path,(json.dumps(d,ensure_ascii=False,indent=2)+'\n').encode())
class Sources:
 def __init__(self,cache_dir,source_root=None):self.cache=pathlib.Path(cache_dir);self.cache.mkdir(parents=True,exist_ok=True);self.source_root=pathlib.Path(source_root)if source_root else None;self.receipts=[]
 def get(self,key,source_game=None,source_key=None):
  url=URLS[key]
  # These bytes belong to the just-completed parent public collector, not an arbitrary URL.
  parent=self.source_root/source_game/(source_key+'.body') if self.source_root and source_game and source_key else None
  if parent and parent.is_file():
   b=parent.read_bytes();d=json.loads(b);meta=parent.with_suffix('.meta.json');m=json.loads(meta.read_bytes())if meta.exists()else{}
   self.receipts.append({'key':key,'url':url,'sha256':hashlib.sha256(b).hexdigest(),'via':'parent-source-receipt','parentMeta':m});return d
  path=self.cache/(key+'.json');meta=self.cache/(key+'.meta.json');m=json.loads(meta.read_bytes())if meta.exists()else{};headers={'User-Agent':'GAGETHER-reference-enrichment/1.0','Accept':'application/json'}
  if m.get('etag'):headers['If-None-Match']=m['etag']
  if m.get('lastModified'):headers['If-Modified-Since']=m['lastModified']
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=35)as r:
    limit=24000000 if key.startswith('ak_')else 20000000
    b=r.read(limit+1)
    if len(b)>limit:raise ValueError('Source exceeds fixed byte bound')
    d=json.loads(b);m={'url':url,'sha256':hashlib.sha256(b).hexdigest(),'checkedAt':now(),'status':r.status,'etag':r.headers.get('ETag'),'lastModified':r.headers.get('Last-Modified')};atomic(path,b);dump(meta,m)
  except urllib.error.HTTPError as e:
   if e.code!=304 or not path.exists():raise
   b=path.read_bytes()
   if hashlib.sha256(b).hexdigest()!=m.get('sha256'):raise ValueError('Cached source hash mismatch')
   d=json.loads(b);m.update(checkedAt=now(),status=304);dump(meta,m)
  self.receipts.append({'key':key,**m});return d

def fmt(n):
 if isinstance(n,bool)or not isinstance(n,(int,float))or not math.isfinite(n):raise ValueError('Invalid numeric source stat')
 return f'{n:.3f}'.rstrip('0').rstrip('.') if n%1 else str(int(n))
def stat(id,value,basis,label=None):return {'id':id,'label':label or LABELS[id],'value':str(value),'basis':basis}
def add_sources(doc,urls):
 doc['sourceUrls']=list(dict.fromkeys([*doc['sourceUrls'],*urls]))
 if len(doc['sourceUrls'])>40:raise ValueError('Source URL limit exceeded')
def oldids(doc):return [r['id']for r in doc['characters']]
def namesource(row,locale,url,kind='community'):row.setdefault('nameSources',{})[locale]={'url':url,'kind':kind}
def gi(doc,s):
 stats=s.get('gi_stats');curve=s.get('gi_curve');index=s.get('gi_index');names=index['namemap'];by_name={v:k for k,v in names.items()};basis=C('Lv.90 · 돌파 6단계 · 무기·성유물·별자리·특성 제외 · 기본 HP/공격력/방어력 반올림','Lv.90, ascension 6; no weapon, artifacts, constellations or talents. Base HP/ATK/DEF rounded.','Lv.90・突破6段階。武器・聖遺物・命ノ星座・天賦を除外。基礎HP・攻撃力・防御力は四捨五入。','90级、突破6；不含武器、圣遗物、命座或天赋。基础生命/攻击/防御四舍五入。')
 missing=[]
 for c in doc['characters']:
  key=by_name.get(c['name']['en']);raw=stats.get(key)
  if raw is None:missing.append(c['id']);continue
  promotion=raw['promotion'][6];vals={k:raw['base'][k]*curve['90'][raw['curve'][k]]+promotion[k]for k in ('hp','attack','defense')}
  cr=raw['base']['critrate']+(promotion['specialized']if raw['specialized']=='FIGHT_PROP_CRITICAL'else 0);cd=raw['base']['critdmg']+(promotion['specialized']if raw['specialized']=='FIGHT_PROP_CRITICAL_HURT'else 0)
  c['stats']=[stat('hp',math.floor(vals['hp']+.5),basis),stat('atk',math.floor(vals['attack']+.5),basis),stat('def',math.floor(vals['defense']+.5),basis),stat('crit_rate',fmt(cr*100)+'%',basis),stat('crit_dmg',fmt(cd*100)+'%',basis)]
  for t in c.get('traits',[]):
   if t['id']in TRAIT_LABELS:t['label']=TRAIT_LABELS[t['id']]
 add_sources(doc,[URLS[k]for k in ('gi_stats','gi_curve','gi_index')]);return {'missingStatsIds':missing,'level':90,'ascension':6}
def hsr(doc,s):
 promotions=s.get('hsr_promotions');native={kind:{l:s.get('hsr_'+kind+'_'+l)for l in LOCALES}for kind in ('paths','elements')}
 basis=C('Lv.1 · 돌파 0단계 · 광추·유물·행적·성혼 제외 · 원본 기초 수치','Lv.1, ascension 0; no Light Cone, Relics, Traces or Eidolons. Raw base values.','Lv.1・昇格0。光円錐・遺物・軌跡・星魂を除いた元データの基礎値。','1级、未晋阶；不含光锥、遗器、行迹或星魂。原始基础值。');missing=[]
 for c in doc['characters']:
  raw=promotions.get(c['id'])
  if raw is None:missing.append(c['id']);continue
  v=raw['values'][0]
  c['stats']=[stat(k,fmt(v[k]['base'])+('%'if k.startswith('crit')else''),basis)if not k.startswith('crit')else stat(k,fmt(v[k]['base']*100)+'%',basis)for k in ('hp','atk','def','spd','crit_rate','crit_dmg')]
  for t in c.get('traits',[]):
   kind={'path':'paths','element':'elements'}.get(t['id'])
   if not kind:continue
   key=t['value']['en'];t['label']=TRAIT_LABELS[t['id']]
   t['value']={l:native[kind][l].get(key,{}).get('name',t['value'].get(l,''))for l in LOCALES}
   icon=native[kind]['en'].get(key,{}).get('icon')
   if icon:t['icon']=RAW+'Mar-7th/StarRailRes/master/'+icon
 add_sources(doc,[URLS['hsr_promotions'],*[URLS['hsr_'+k+'_'+l]for k in ('paths','elements')for l in LOCALES]]);return {'missingStatsIds':missing,'level':1,'ascension':0}
def zzz(doc,s):
 avatars=s.get('zzz_avatars','zzz','avatars');props=s.get('zzz_properties');basis=C('Lv.1 · 승급 0단계 · 핵심 패시브 강화 0 · 음동기·디스크·시네마 제외 · Enka BaseProps','Lv.1, promotion 0, core enhancement 0; no W-Engine, Drive Discs or Mindscapes. Enka BaseProps.','Lv.1・昇格0・コア強化0。音動機・ドライバディスク・凸を除外したEnka BaseProps。','1级、未晋升、核心强化0；不含音擎、驱动盘或影画。Enka BaseProps。')
 ids={'hp':'11101','atk':'12101','def':'13101','crit_rate':'20101','crit_dmg':'21101','impact':'12201','proficiency':'31201','mastery':'31401'};missing=[]
 for c in doc['characters']:
  raw=avatars.get(c['id'])
  if raw is None:missing.append(c['id']);continue
  base=raw.get('BaseProps',{});c['stats']=[stat(k,fmt(base[p]/100)+('%'if k.startswith('crit')else''),basis)if k.startswith('crit')else stat(k,fmt(base[p]),basis)for k,p in ids.items()if p in base]
  c['rarityLabel']={4:'S',3:'A',2:'B'}.get(raw.get('Rarity'),c.get('rarityLabel',''))
  if raw.get('Rarity')in (2,3,4):c['rarity']=raw['Rarity']
  for t in c.get('traits',[]):
   if t['id']in TRAIT_LABELS:t['label']=TRAIT_LABELS[t['id']]
   if t['id']=='specialty':t['value']=SPECIALTIES.get(t['value']['en'],t['value'])
   if t['id']=='element':
    words=[ELEMENTS.get(e)for e in raw['ElementTypes']]
    if all(words):t['value']={l:', '.join(w[l]for w in words)for l in LOCALES}
 add_sources(doc,[URLS['zzz_avatars'],URLS['zzz_properties'],'https://github.com/EnkaNetwork/API-docs/blob/master/docs/zzz/api.md']);return {'missingStatsIds':missing,'level':1,'promotion':0,'coreEnhancement':0}
def ak(doc,s):
 tables={l:s.get('ak_'+l,'arknights',l)for l in LOCALES};editorial=json.loads((ROOT/'ak-editorial-ko.json').read_text());translations=[];missing=[]
 basis=C('Lv.1 · 정예화 0단계 · 신뢰도·잠재능력·모듈 제외 · 선택한 실제 서비스의 원본 수치','Lv.1, Elite 0; no Trust, Potential or Module bonuses. Native table for the selected actual service.','Lv.1・昇進0。信頼度・潜在・モジュールを除いた選択サーバーの元データ。','1级、精英化0；不含信赖、潜能或模组加成。使用所选实际区服的原始数值。')
 service={'ko':'kr','en':'global','ja':'jp','zh':'cn'};keys={'hp':'maxHp','atk':'atk','def':'def','res':'magicResistance','cost':'cost','block':'blockCnt','interval':'baseAttackTime'}
 for c in doc['characters']:
  available={l:table[c['id']]for l,table in tables.items()if c['id']in table}
  if not available:missing.append(c['id']);continue
  regional={}
  for l,raw in available.items():
   frame=raw['phases'][0]['attributesKeyFrames'][0]
   if frame['level']!=1:raise ValueError('Arknights base level is not 1')
   v=frame['data'];regional[service[l]]=[stat(k,fmt(v[p])+('s'if k=='interval'else''),basis)for k,p in keys.items()]
   if raw.get('name'):
    c['name'][l]=raw['name'];namesource(c,l,URLS['ak_'+l])
  c['stats']=regional.get('kr')or regional.get('global')or regional.get('jp')or regional['cn']
  different={service:values for service,values in regional.items()if values!=c['stats']}
  c.pop('regionalStats',None)
  if different:c['regionalStats']=different
  # Do not publish a guessed official KO name for a Chinese-only operator.
  if not c['name']['ko']and c['id']in editorial:
   cn=available.get('zh',{});translation=editorial[c['id']]
   if cn.get('name')!=translation['sourceName']or cn.get('appellation')!=translation['sourceAppellation']:raise ValueError('Editorial name source identity changed: '+c['id'])
   ko=translation['ko'];c['name']['ko']=ko;namesource(c,'ko',URLS['ak_zh'],'translation');translations.append({'id':c['id'],'locale':'ko','value':ko,'sourceName':cn.get('name'),'sourceAppellation':cn.get('appellation'),'url':URLS['ak_zh'],'kind':'translation','note':'Editorial Korean rendering of the exact Chinese-service name/appellation; not an official Korean release name.'})
  raw=available.get('ko')or available.get('en')or available.get('zh')or next(iter(available.values()))
  for t in c.get('traits',[]):
   if t['id']in TRAIT_LABELS:t['label']=TRAIT_LABELS[t['id']]
   if t['id']=='profession':t['value']=PROFESSIONS.get(raw['profession'],t['value'])
   if t['id']=='position':t['value']=POSITIONS.get(raw['position'],t['value'])
 add_sources(doc,[URLS['ak_'+l]for l in LOCALES]);return {'missingStatsIds':missing,'level':1,'elite':0,'regionalDifferences':sum(bool(c.get('regionalStats'))for c in doc['characters']),'editorialNames':translations}
FUNCTIONS={'genshin':gi,'hsr':hsr,'zzz':zzz,'arknights':ak}
def enrich(game,document,cache_dir,source_root=None):
 if game not in FUNCTIONS:return copy.deepcopy(document),{'gameId':game,'status':'skipped'}
 doc=copy.deepcopy(document);before=oldids(doc);s=Sources(cache_dir,source_root)
 try:
  detail=FUNCTIONS[game](doc,s)
  if before!=oldids(doc):raise ValueError('Enrichment changed stable source IDs/order')
  if any(len(c.get('stats',[]))>40 for c in doc['characters']):raise ValueError('Stat limit exceeded')
  report={'gameId':game,'status':'ok','characters':len(doc['characters']),'stats':sum(bool(c.get('stats'))for c in doc['characters']),'koreanNames':sum(bool(c['name']['ko'])for c in doc['characters']),'sources':s.receipts,'originalTraitValues':sorted({t['id']+':'+t['value'].get('en','')for c in doc['characters']for t in c.get('traits',[])if not t['value'].get('ko')}),**detail};return doc,report
 except Exception as e:return copy.deepcopy(document),{'gameId':game,'status':'failed','preservedInput':True,'error':f'{type(e).__name__}: {e}','sources':s.receipts}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--input-dir',required=True,type=pathlib.Path);ap.add_argument('--output-dir',required=True,type=pathlib.Path);ap.add_argument('--source-root',type=pathlib.Path);ap.add_argument('--cache-dir',type=pathlib.Path);args=ap.parse_args();args.output_dir.mkdir(parents=True,exist_ok=True);reports=[]
 def run(game):
  path=args.input_dir/(game+'.json')
  if not path.exists():return {'gameId':game,'status':'skipped','reason':'Input absent'}
  d=json.loads(path.read_text());out,report=enrich(game,d,args.cache_dir or args.output_dir/'sources',args.source_root)
  target=args.output_dir/path.name
  if report['status']=='failed'and target.exists():report['preservedPreviousOutput']=True
  else:dump(target,out)
  return report
 with concurrent.futures.ThreadPoolExecutor(max_workers=4)as ex:
  for report in ex.map(run,GAMES):reports.append(report)
 dump(args.output_dir/'enrichment-report.json',{'checkedAt':now(),'results':reports,'partial':any(r['status']=='failed'for r in reports)})
 print(json.dumps([{k:v for k,v in r.items()if k not in ('sources','editorialNames')}for r in reports],ensure_ascii=False))
 if all(r['status']!='ok'for r in reports):raise SystemExit(1)
if __name__=='__main__':main()
