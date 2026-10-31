"""Extract bounded, exact source material groups. No site or snapshot mutations."""
from pathlib import Path
import json,re,sys,html,datetime,base64,gzip,hashlib
ROOT=Path(__file__).resolve().parents[3];CACHE=ROOT/'work/materials-remaining';OUT=Path(__file__).parent
sys.path.insert(0,str(ROOT/'ops/character-rosters/enrichment'))
from enrich_nte_details import DOM
from enrich_a import flight,json_field
LOCALES=('ko','en','ja','zh')
def C(*v):return dict(zip(LOCALES,v))
def load(name):return json.loads((CACHE/(name+'.body')).read_bytes())
def receipt(name):return json.loads((CACHE/(name+'.receipt.json')).read_bytes())
def text(name):return (CACHE/(name+'.body')).read_text('utf-8')
rosters={g['gameId']:g for g in json.loads((ROOT/'content/character-rosters/bootstrap.json').read_bytes())}
out={'icons':{},'requirements':{},'gaps':[],'sourceReceipts':[]}
def gap(game,detail,ids=None):out['gaps'].append({'game':game,'detail':detail,**({'characterIds':ids}if ids else{})})
def setup(game):out['icons'][game]={'items':[],'sourceUrls':[]};out['requirements'][game]={};return {},out['requirements'][game]
def group(ident,title,items,url,categoryId,category,**rest):return dict(id=ident,title=title,items=items,sourceUrl=url,sourceKind='community',categoryId=categoryId,category=category,**rest)

# DNA pages expose source totals and exact native 64px sprite atlas rectangles.
icons,req=setup('dna');category=C('돌파','Ascension','突破','突破');missing=[]
for c in rosters['dna']['characters']:
 rows={}
 for locale in LOCALES:
  key='dna-'+c['id']+'-'+('zh-CN'if locale=='zh'else locale)
  if not(CACHE/(key+'.body')).exists():continue
  page=text(key);dom=DOM(page);heading=dom.root.find(lambda n:n.tag=='div'and n.text()=='Ascension Materials')
  if not heading:continue
  parts=[]
  for a in [n for n in heading.parent.walk()if n.tag=='a'and re.fullmatch(r'/(?:[\w-]+/)?db/inventory/item_\d+',n.attrs.get('href',''))]:
   img=a.find(lambda n:n.tag=='img');spans=[n for n in a.walk()if n.tag=='span'];name=spans[-1].text();amount=re.search(r'×\s*([\d,]+)',a.text());pos=re.search(r'object-position:\s*(-?\d+)px\s+(-?\d+)px',img.attrs.get('style','')if img else'')
   if not img or not name or not amount or not pos:raise ValueError('Incomplete DNA item '+c['id'])
   ident=a.attrs['href'].split('/')[-1];src=img.attrs['src'];sprite={'x':-int(pos[1]),'y':-int(pos[2]),'width':64,'height':64}
   item=icons.setdefault(ident,dict(id=ident,name={},icon=src,sprite=sprite,sourceUrl='https://duetnightabyss.th.gl/db/inventory/'+ident,sourceKind='community'))
   if item['icon']!=src or item['sprite']!=sprite:raise ValueError('DNA atlas identity mismatch')
   if locale in item['name']and item['name'][locale]!=name:raise ValueError('DNA name mismatch')
   item['name'][locale]=name;parts.append({'id':ident,'quantity':int(amount[1].replace(',',''))})
  rows[locale]=parts;out['sourceReceipts'].append(receipt(key))
 if not rows or not rows.get('ko'):missing.append(c['id']);continue
 if any(sorted(v,key=lambda x:x['id'])!=sorted(rows['ko'],key=lambda x:x['id'])for v in rows.values()):raise ValueError('DNA locale costs diverge '+c['id'])
 req[c['id']]=[group('dna-ascension-total',C('돌파 재료 합계','Ascension materials total','突破素材合計','突破材料合计'),rows['ko'],receipt('dna-'+c['id']+'-ko')['url'],'ascension',category)]
out['icons']['dna']['items']=list(icons.values());out['icons']['dna']['sourceUrls']=['https://duetnightabyss.th.gl/db/characters']
if missing:gap('dna','Exact material total block absent from fetched source; no requirements fabricated.',missing)
gap('dna','Source supplies aggregate ascension totals only; individual stage and skill costs are not exposed in these character-page blocks.')

# NTE uses exact character-name joins, native item IDs, and declared pinned PNG paths.
icons,req=setup('nte');raw='https://raw.githubusercontent.com/Waifus-Grace/NTE_Assets/cef09a29d4d92c7b1e0b950d89ba8c75b1c529e7/'
chars=load('nte-characters')[0]['Rows'];costs=load('nte-breakthrough')[0]['Rows'];items=load('nte-items')[0]['Rows'];locales={l:load('nte-locale-'+('zh-CN'if l=='zh'else l))for l in LOCALES};tree={x['path']for x in load('nte-tree')['tree']if x['type']=='blob'}
items.update(load('nte-capital')[0]['Rows'])
def native(v):
 namespace=v.get('TableId','').split('/')[-1].split('.')[0];key=v.get('Key');return {l:locales[l].get(namespace,{}).get(key,'').strip()for l in LOCALES}
def additem(ident):
 row=items.get(ident)or next((v for k,v in items.items()if k.casefold()==ident.casefold()),None)
 if not row:raise ValueError('Missing exact NTE item '+ident)
 if ident in icons:return
 path=row['ItemIcon']['AssetPathName'].split('.')[0].removeprefix('/Game/')+'.png'
 if path not in tree and path.startswith('UI/UI_Icon/')and path.removeprefix('UI/')in tree:path=path.removeprefix('UI/')
 item=dict(id=ident,name=native(row['ItemName']),sourceUrl=raw+'DataTable/Inventory/DT_ItemConfig.json',sourceKind='community')
 if path in tree:item['icon']=raw+path
 else:gap('nte','Native icon path absent from pinned asset inventory: '+path,[ident])
 icons[ident]=item
missing=[]
for c in rosters['nte']['characters']:
 matches=[(k,v)for k,v in chars.items()if(v.get('bIsManual')or k in ('1046','1051'))and any(name and name==native(v['ItemName']).get(l)for l,name in c['name'].items())]
 if c['name']['en']=='Zero':matches=[x for x in matches if x[0]=='1051']
 if len(matches)!=1:missing.append(c['id']);continue
 cid,row=matches[0];prefix=row['ElementData']['BreakthroughPackId'];groups=[]
 for k,v in costs.items():
  if not k.startswith(prefix+'_')or not v.get('NeedItems')and not v.get('NeedGolds'):continue
  level=v['MaxCharacterLevel'];stage=int(k.rsplit('_',1)[1]);parts=[]
  for token in [*v['NeedItems'].split(','),*v['NeedGolds'].split(',')]:
   if not token or token=='0':continue
   ident,n=token.split(':');additem(ident);parts.append({'id':ident,'quantity':int(n)})
  if parts:groups.append(group('nte-breakthrough-'+str(stage),C(f'{stage}단계 돌파 · Lv.{level}',f'Ascension {stage} · Lv.{level}',f'突破{stage}段階 · Lv.{level}',f'{stage}阶突破 · {level}级'),parts,raw+'DataTable/Character/DT_CharacterBreakthroughDataTable.json','ascension',category,regions=['global']))
 if groups:req[c['id']]=groups
out['icons']['nte']['items']=list(icons.values());out['icons']['nte']['sourceUrls']=[raw+'DataTable/Inventory/DT_ItemConfig.json']
if missing:gap('nte','Current roster identity has no unique exact playable-name match in pinned Global1.4.5 table; no guessed mapping.',missing)
empty=[c['id']for c in rosters['nte']['characters']if c['id']not in req and c['id']not in missing]
if empty:gap('nte','Exact playable identity matched, but its named breakthrough pack has no cost rows in pinned Global1.4.5 data.',empty)
gap('nte','Pinned Global1.4.5 ascension only. Skill cost tables were found, but native internal Level versus visible skill-rank semantics require confirmation before publishing. Character EXP costs not converted into assumed item counts.')
out['sourceReceipts'] += [receipt('nte-'+k)for k in ['characters','breakthrough','items','capital','tree','abilities','locale-ko','locale-en','locale-ja','locale-zh-CN']]

# Trickcal preserves the actual service and distinct skill enhancement tables.
icons,req=setup('trickcal');categories={'Skill':C('저학년 스킬','Freshman skill','低学年スキル','低年级技能'),'Ultimate':C('고학년 스킬','Senior skill','高学年スキル','高年级技能'),'Basic':C('일반 공격','Normal attack','通常攻撃','普通攻击'),'Passive':C('패시브','Passive','パッシブ','被动')}
for c in rosters['trickcal']['characters']:
 groups=[]
 for region,locale in [('kr','ko'),('global','en')]:
  key='trickcal-'+c['id']+'-'+region
  if not(CACHE/(key+'.body')).exists():continue
  src=receipt(key)['url'];s=flight(text(key));skills=json_field(s,'skills')
  for index,skill in enumerate(skills):
   kind=skill.get('kind');cat=categories.get(kind,C('스킬','Skill','スキル','技能'))
   for level,value in skill.get('levelCost',{}).items():
    parts=[]
    for material in value.get('mats',[]):
     ident=region+'-'+str(material['id']);it=icons.setdefault(ident,dict(id=ident,name={},sourceUrl=src,sourceKind='community'))
     it['name'][locale]=material['label']
     if material.get('iconUrl'):it['icon']=material['iconUrl']
     parts.append({'id':ident,'quantity':material['qty']})
    if value.get('gold'):
     icons.setdefault('gold',dict(id='gold',name=C('골드','Gold','ゴールド','金币'),sourceUrl=src,sourceKind='community'))
     parts.append({'id':'gold','quantity':value['gold']})
    if parts:groups.append(group('trickcal-'+region+'-'+str(index)+'-'+level,{l:cat[l]+' · Lv.'+level for l in LOCALES},parts,src,'skill-'+kind.lower(),cat,regions=[region]))
  out['sourceReceipts'].append(receipt(key))
 if groups:req[c['id']]=groups
out['icons']['trickcal']['items']=list(icons.values());out['icons']['trickcal']['sourceUrls']=['https://wiki.cheeky.tsuncloud.com/korea/apostles','https://wiki.cheeky.tsuncloud.com/global/apostles']
missing=[c['id']for c in rosters['trickcal']['characters']if c['id']not in req]
if missing:gap('trickcal','No usable cost-bearing skill table found at declared source URLs for these roster IDs.',missing)
gap('trickcal','Gold costs are exact, but source does not declare a gold image in these blocks; gold remains a text item. No invented icon or unreleased regional costs. Equipment and board costs remain outside this skill-table extraction.')

# Remaining games were inspected individually; absence here is source-specific.
details={
 'nikke':'Fresh full native-mirror character response has backstory, combat, skills, stat growth, teammate, voice and costume data, but no material or enhancement-cost tables. All saved characters use that provider; no copied generic costs.',
 'limbus':'Fresh exact identity page and existing localization enrichment supply skills/stats but not Uptie/thread/EXP costs or item-icon mapping. This does not establish that no such sources exist elsewhere.',
 'gfl2':'Fresh exact Alva page and saved GFL2 HELP extraction supply skills, fortification and neural-key effects but no character material-cost tables. Existing source is English; no invented locale names.',
 'umamusume':'Fresh UmaTools native roster contains identities, base stats, growth, aptitudes, objectives and events; it has no awakening material/cost fields. Training stat growth is distinct from consumable cost.',
 'hi3':'Inspected hi3-database repository tree: battlesuits.csv, stats.csv and events.csv only; existing official CMS supplies profile/skill prose. No exact item-icon+cost collection established in inspected source set.',
 'holodreams':'Fresh official English homepage and existing roster sources are cast/profile/news pages with no per-character material requirements. Do not infer another game’s ascension system or assert that this game has no progression.'}
for g,detail in details.items():
 gap(g,detail)
 key='hi3-tree'if g=='hi3'else'uma'if g=='umamusume'else g
 if(CACHE/(key+'.receipt.json')).exists():out['sourceReceipts'].append(receipt(key))
out['checkedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();(OUT/'remaining-native.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(json.dumps({'coverage':{g:{'characters':len(v),'groups':sum(map(len,v.values())),'icons':len(out['icons'][g]['items'])}for g,v in out['requirements'].items()},'gaps':out['gaps'],'bytes':(OUT/'remaining-native.json').stat().st_size},ensure_ascii=False))
