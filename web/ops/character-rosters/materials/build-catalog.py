"""Build exact game-scoped read-only material projections from retained source snapshots."""
import collections,datetime,hashlib,json,pathlib,re
ROOT=pathlib.Path(__file__).resolve().parents[3]
OLD=pathlib.Path('C:/Users/ianri/Documents/Codex/2026-10-28/gagether-sites-project-appgprj-6ad1ef24b5c08191a367cd141de63a3a-x20-4/outputs/character-materials-20261031/sources')
WORK=ROOT/'work/materials-recovery'
LOCALES=['ko','en','ja','zh'];CLIENTS=dict(ko='kr',en='en',ja='jp',zh='cn');SERVICES=dict(ko='kr',en='global',ja='jp',zh='cn')
def read(p):return json.loads(p.read_bytes())
def old(k):return read(OLD/(k+'.json'))
def local(k):return read(WORK/(k+'.json'))
def C(*v):return dict(zip(LOCALES,v))
rosters={r['gameId']:r for r in read(ROOT/'content/character-rosters/bootstrap.json')}
icons={};requirements={};audit={'sourceMode':'community client-data mirrors; no official publication claim','games':{}}
def item(game,id,names,icon,source,**extra):
 rows=icons.setdefault(game,{'items':{},'sourceUrls':[]})
 if source not in rows['sourceUrls']:rows['sourceUrls'].append(source)
 rows['items'][str(id)]=dict(id=str(id),name=names,icon=icon,sourceUrl=source,sourceKind='community',**extra)
def group(game,char,id,title,items,source,categoryId,category,regions=None):
 if not items:return
 values=[dict(id=str(i),quantity=q)for i,q in items if q and float(q)>0]
 if not values:return
 assert len({i['id']for i in values})==len(values),(game,char,id,'duplicate material')
 row=dict(id=id,title=title,items=values,sourceUrl=source,sourceKind='community',categoryId=categoryId,category=category)
 if regions:row['regions']=regions
 requirements.setdefault(game,{}).setdefault(str(char),[]).append(row)

# ZZZ: exact source-defined totals already reflected in saved material prose.
z={l:old('zzz-'+l)for l in LOCALES};zc={l:{str(c['ID']):c for c in v['characters']}for l,v in z.items()}
s=(ROOT/'ops/research/zzz-shiyu-20261028/nanoka-home.html').read_text('utf-8')
m=re.search(r'<script[^>]+data-url="([^"]+/item.json)"[^>]*>(.*?)</script>',s,re.S)
nanoka= json.loads(json.loads(m[2])['body']);nanoka_source=m[1]
titles={'level':C('Lv.60 육성 재료','Lv.60 development materials','Lv.60育成素材','60级养成材料'),'skills':C('스킬 Lv.12 육성 재료 합계','All skills to Lv.12 materials','全スキルLv.12育成素材','全部技能12级材料'),'core':C('핵심 스킬 육성 재료 합계','All core skill materials','コアスキル育成素材合計','全部核心技材料')}
zitems={l:{str(i['ItemID']):i for c in v['characters']for g in c.get('TotalMaterials',[])for i in g['Items']}for l,v in z.items()}
for row in rosters['zzz']['characters']:
 c=zc['en'].get(row['id']);
 if not c:continue
 for g in c.get('TotalMaterials',[]):
  key=g['Key'];group('zzz',row['id'],'zzz-materials-'+key,titles[key],[(i['ItemID'],i['Number'])for i in g['Items']],'https://zzz.gg/en/characters/'+re.sub(r'[^a-z0-9]+','-',c['Name'].lower()).strip('-'),key,titles[key])
for id in {i['id']for gs in requirements['zzz'].values()for g in gs for i in g['items']}:
 native=nanoka.get(id);base=zitems['en'][id]
 names={l:v[id]['Name']for l,v in zitems.items()if id in v}
 if native and native['name'].casefold()==base['Name'].casefold():
  filename=pathlib.PurePosixPath(native['icon']).stem
  item('zzz',id,names,'https://static.nanoka.cc/assets/zzz/'+filename+'.webp',nanoka_source)
 else:audit.setdefault('missingIcons',[]).append(dict(game='zzz',id=id,reason='Missing exact independent native icon identity'))

# Genshin: separate ascension stages and one-talent upgrade costs; never multiply by three.
gm={'en':{str(x['id']):x for x in old('genshin-materials')}}
gm.update({l:{str(x['id']):x for x in local('genshin-materials-'+l)}for l in ['ko','ja','zh']})
gc={str(x['id']):x for x in old('genshin-characters')};gt={x['name']:x for x in old('genshin-talents')}
gsource='https://genshin-db-api.vercel.app/api/v5/'
for c in rosters['genshin']['characters']:
 id=c['id'];native=gc.get(id)
 if not native:continue
 for key,vals in native.get('costs',{}).items():
  if any('count'not in x for x in vals):
   audit.setdefault('gaps',[]).append(dict(game='genshin',characterId=id,group=key,reason='Source omits required quantity; no synthetic zero'))
   continue
  n=int(key.replace('ascend',''));group('genshin',id,'genshin-'+key,C(f'돌파 {n}단계',f'Ascension {n}',f'突破{n}段階',f'突破阶段{n}'),[(i['id'],i['count'])for i in vals],gsource+'characters?query=names&matchCategories=true&verboseCategories=true&resultLanguage=English','ascension',C('돌파','Ascension','突破','突破'))
 # Separate talent IDs bind through exact source names, as in the existing enrichment.
 # Traveler element forms never merge into the base character's costs.
 talent=gt.get(native['name'])if id not in ['10000005','10000007']else None
 if talent:
  for key,vals in talent.get('costs',{}).items():
   if not re.fullmatch('lvl[0-9]+',key):continue
   if any('count'not in x for x in vals):continue
   n=int(key[3:]);group('genshin',id,'genshin-talent-'+key,C(f'특성 1개 Lv.{n-1} → {n}',f'One talent Lv.{n-1} → {n}',f'天賦1種 Lv.{n-1} → {n}',f'单个天赋 Lv.{n-1} → {n}'),[(i['id'],i['count'])for i in vals],gsource+'talents?query=names&matchCategories=true&verboseCategories=true&resultLanguage=English','talent',C('특성 1개 강화','One talent upgrade','天賦1種の強化','单个天赋升级'))
for id in {i['id']for gs in requirements['genshin'].values()for g in gs for i in g['items']}:
 native=gm['en'].get(id)
 if not native:raise ValueError('Missing Genshin material '+id)
 names={l:v[id]['name']for l,v in gm.items()if id in v};filename=native['images']['filename_icon']
 item('genshin',id,names,'https://enka.network/ui/'+filename+'.png',gsource+'materials?query=names&matchCategories=true&verboseCategories=true&resultLanguage=English')

# HSR: native ascension stage costs and each trace's explicit source-level upgrade.
hi={l:old('hsr-'+l+'-items')for l in LOCALES};hc=old('hsr-en-characters');hp=old('hsr-en-character_promotions');ht={l:old('hsr-'+l+'-character_skill_trees')for l in LOCALES};hs={l:local('hsr-'+l+'-skills')for l in LOCALES}
hbase='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/'
for c in rosters['hsr']['characters']:
 id=c['id'];native=hc.get(id)
 if not native:continue
 for i,vals in enumerate(hp[id].get('materials',[]),1):
  group('hsr',id,'ascension-'+str(i),C(f'승급 {i}단계',f'Ascension {i}',f'昇格{i}段階',f'晋阶{i}'),[(x['id'],x['num'])for x in vals],hbase+'index_new/en/character_promotions.json','ascension',C('캐릭터 승급','Character ascension','キャラクター昇格','角色晋阶'))
 for tid in native['skill_trees']:
  trace=ht['en'].get(tid)
  if not trace:continue
  skills=trace.get('level_up_skills',[]);sid=skills[0]['id']if skills else None
  labels={l:ht[l].get(tid,{}).get('name') or hs[l].get(sid,{}).get('name') or trace['anchor'] for l in LOCALES}
  for i,stage in enumerate(trace['levels'],1):
   labels2={l:f'{v} · Lv.{i}'if len(trace['levels'])>1 else v for l,v in labels.items()}
   group('hsr',id,'trace-'+tid+'-'+str(i),labels2,[(x['id'],x['num'])for x in stage.get('materials',[])],hbase+'index_new/en/character_skill_trees.json','trace-'+tid,labels)
for id in {i['id']for gs in requirements['hsr'].values()for g in gs for i in g['items']}:
 native=hi['en'][id];item('hsr',id,{l:v[id]['name']for l,v in hi.items()if id in v},hbase+native['icon'],hbase+'index_new/en/items.json')

# Arknights: retain actual regional material changes. Identical groups collapse across clients.
ak={l:old('ark-'+s+'-character_table')for l,s in CLIENTS.items()};ai={l:old('ark-'+s+'-item_table')['items']for l,s in CLIENTS.items()};ac={l:old('ark-'+s+'-gamedata_const')for l,s in CLIENTS.items()}
abase='https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/'
for c in rosters['arknights']['characters']:
 id=c['id'];regional={}
 for l,records in ak.items():
  if id not in records:continue
  char=records[id];source=abase+CLIENTS[l]+'/gamedata/excel/character_table.json';regional[l]=[]
  for n,phase in enumerate(char['phases']):
   if not n:continue
   vals=[(x['id'],x['count'])for x in phase.get('evolveCost') or []];gold=ac[l]['evolveGoldCost'][int(char['rarity'].split('_')[1])-1][n-1]
   if gold>0:vals.insert(0,('4001',gold))
   regional[l].append(('elite-'+str(n),C(f'{n}차 정예화',f'Elite {n}',f'昇進{n}',f'精英{n}'),vals,'elite',C('정예화','Elite promotion','昇進','精英化')))
  for n,stage in enumerate(char.get('allSkillLvlup',[]),2):
   regional[l].append(('skill-level-'+str(n),C(f'스킬 Lv.{n-1} → {n}',f'Skill Lv.{n-1} → {n}',f'スキル Lv.{n-1} → {n}',f'技能 Lv.{n-1} → {n}'),[(x['id'],x['count'])for x in (stage['lvlUpCost'] or [])],'skill-level',C('스킬 레벨','Skill level','スキルレベル','技能等级')))
  for si,skill in enumerate(char.get('skills',[]),1):
   for mi,stage in enumerate(skill.get('levelUpCostCond',[]),1):
    vals=[(x['id'],x['count'])for x in stage.get('levelUpCost')or []]
    regional[l].append((f'skill-{si}-mastery-{mi}',C(f'{si}스킬 마스터리 {mi}',f'Skill {si} mastery {mi}',f'スキル{si}特化{mi}',f'技能{si}专精{mi}'),vals,'mastery-'+str(si),C(f'{si}스킬 마스터리',f'Skill {si} mastery',f'スキル{si}特化',f'技能{si}专精')))
  for gid,title,vals,cat,category in regional[l]:
   if not vals:continue
   key=json.dumps([gid,vals]);match=next((g for g in requirements.setdefault('arknights',{}).setdefault(id,[])if g.get('_signature')==key),None)
   if match:match['regions'].append(SERVICES[l])
   else:
    group('arknights',id,gid+'-'+SERVICES[l],title,vals,source,cat,category,[SERVICES[l]])
    requirements['arknights'][id][-1]['_signature']=key
for gs in requirements['arknights'].values():
 for g in gs:g.pop('_signature',None)
assets=local('ark-assets-items');paths={x['path']for x in assets['tree']};commit=local('ark-assets-root')['sha']
for id in {i['id']for gs in requirements['arknights'].values()for g in gs for i in g['items']}:
 native=next((v[id]for v in ai.values()if id in v),None);filename=native['iconId']+'.png'
 if filename not in paths:audit.setdefault('missingIcons',[]).append(dict(game='arknights',id=id,filename=filename,reason='Native icon absent from declared asset inventory'))
 item('arknights',id,{l:v[id]['name']for l,v in ai.items()if id in v},'https://raw.githubusercontent.com/fexli/ArknightsResource/'+commit+'/items/'+filename if filename in paths else '',abase+'en/gamedata/excel/item_table.json')

# Blue Archive: explicit per-level skill costs; currency and Lv10 secret tech are source formulas.
ba={l:old('ba-'+s+'-students')for l,s in CLIENTS.items()};bi={l:old('ba-'+s+'-items')for l,s in CLIENTS.items()};bc={l:{str(v['Id']):v for v in local('ba-'+l+'-currency')}for l in LOCALES}
btree=old('ba-tree');bpaths={x['path']for x in btree['tree']};bcommit=btree['sha'];bsource='https://raw.githubusercontent.com/nico0748/SchaleDB/'+bcommit+'/'
client=(WORK/'ba-common-legacy.js').read_text('utf-8')
excredits=json.loads(re.search(r'const skill_ex_upgrade_credits = (\[[^\]]+\])',client)[1]);credits=json.loads(re.search(r'const skill_upgrade_credits = (\[[^\]]+\])',client)[1])
for c in rosters['bluearchive']['characters']:
 id=c['id'];char=ba['en'].get(id)
 if not char:continue
 for key,limit,costs in [('SkillExMaterial',5,excredits),('SkillMaterial',9,credits)]:
  category=C('EX 스킬','EX skill','EXスキル','EX技能')if key=='SkillExMaterial'else C('기본·강화·서브 스킬 각각','Each normal/passive/sub skill','ノーマル・パッシブ・サブ各スキル','每个普通／被动／辅助技能')
  for n in range(2,limit+1):
   vals=list(zip(char[key][n-2],char[key+'Amount'][n-2]));vals.append(('currency-1',costs[n-2]));cat='ex-skill'if key=='SkillExMaterial'else'other-skill'
   group('bluearchive',id,cat+'-'+str(n),{l:f'{v} · Lv.{n-1} → {n}'for l,v in category.items()},vals,'https://schaledb.com/data/en/students.json',cat,category)
 category=C('기본·강화·서브 스킬 각각','Each normal/passive/sub skill','ノーマル・パッシブ・サブ各スキル','每个普通／被动／辅助技能')
 group('bluearchive',id,'other-skill-10',{l:f'{v} · Lv.9 → 10'for l,v in category.items()},[('9999',1),('currency-1',credits[8])],bsource+'js/common.js','other-skill',category)
for id in {i['id']for gs in requirements['bluearchive'].values()for g in gs for i in g['items']}:
 native=bc['en'][id[9:]]if id.startswith('currency-')else bi['en'][id]
 names={l:(bc[l][id[9:]]if id.startswith('currency-')else bi[l][id])['Name'].replace('\n',' ')for l in LOCALES if id.startswith('currency-')or id in bi[l]}
 path='images/item/icon/'+native['Icon']+'.webp'
 if path not in bpaths:audit.setdefault('missingIcons',[]).append(dict(game='bluearchive',id=id,filename=path,reason='Native icon absent from declared asset inventory'))
 item('bluearchive',id,names,bsource+path if path in bpaths else '',bsource+'data/en/currency.json'if id.startswith('currency-')else'https://schaledb.com/data/en/items.json')

for extra in sorted((ROOT/'ops/character-rosters/materials').glob('extra-*.json'))+sorted((ROOT/'ops/character-rosters/materials').glob('remaining-*.json')):
 d=read(extra)
 if not isinstance(d,dict) or 'icons'not in d or'requirements'not in d:continue
 for game,catalog in d['icons'].items():
  if game in icons:raise ValueError('Duplicate delegated game '+game)
  icons[game]={**catalog,'items':{r['id']:r for r in catalog['items']}}
 for game,data in d['requirements'].items():
  if game in requirements:raise ValueError('Duplicate delegated requirements '+game)
  requirements[game]=data
 audit.setdefault('gaps',[]).extend(d.get('gaps',[]))

overrides=ROOT/'ops/character-rosters/materials/icon-overrides.json'
if overrides.exists():
 for game,rows in read(overrides).items():
  for id,url in rows.items():
   if id in icons.get(game,{}).get('items',{}):icons[game]['items'][id]['icon']=url
 audit['missingIcons']=[r for r in audit.get('missingIcons',[])if not icons.get(r['game'],{}).get('items',{}).get(r['id'],{}).get('icon')]

for game,rows in requirements.items():
 used={v['id']for groups in rows.values()for g in groups for v in g['items']}
 missing=used-set(icons.get(game,{}).get('items',{}))
 audit['games'][game]=dict(characters=len(rows),groups=sum(map(len,rows.values())),icons=len(icons.get(game,{}).get('items',{})),missingIconIds=sorted(missing))
 for char,groups in rows.items():
  assert char in {c['id']for c in rosters[game]['characters']},(game,char,'unknown identity')
  assert len({g['id']for g in groups})==len(groups),(game,char,'duplicate group')
for game,data in icons.items():data['items']=list(data['items'].values())
stamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
for name,obj in [('roster-material-icons',dict(version=1,checkedAt=stamp,games=icons)),('roster-material-requirements',dict(version=1,games=requirements))]:
 p=ROOT/'content'/(name+'.json');p.write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8');audit[name+'Bytes']=p.stat().st_size
(ROOT/'ops/character-rosters/materials/catalog-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(audit,ensure_ascii=False,indent=2))
