"""Pinned native tables -> inert material display data; never edits canonical rosters."""
import pathlib,json,re,datetime,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[3]
P=ROOT/'work/materials-extra-sources';OUT=pathlib.Path(__file__).resolve().parent
PRIOR=pathlib.Path(r'C:/Users/ianri/Documents/Codex/2026-10-28/gagether-sites-project-appgprj-6ad1ef24b5c08191a367cd141de63a3a-x20-4/outputs/character-materials-20261031/sources')
def read(n):return json.loads((P/(n+'.json')).read_text('utf-8'))
def C(*v):return dict(zip(['ko','en','ja','zh'],v))
def group(ident,title,items,url):return dict(id=ident,title=title,items=items,sourceUrl=url,sourceKind='community')
rosters={g['gameId']:g for g in json.loads((ROOT/'content/character-rosters/bootstrap.json').read_text('utf-8'))}
result={'icons':{},'requirements':{},'gaps':[]}
# StellaSora: exact source dictionary IDs and item-path declarations.
pin='33268f4a89cd314fff385a6ffdd6ecbbdc995a8b';base='https://raw.githubusercontent.com/JforPlay/sstoy/'+pin+'/'
items=read('stella-Item');chars=read('stella-Character');adv=read('stella-CharacterAdvance');skills=read('stella-CharacterSkillUpgrade')
loc={l:read('stella-'+s+'-Item')for l,s in [('ko','KR'),('en','EN'),('ja','JP'),('zh','CN')]}
tree=json.loads((PRIOR/'stella-tree.json').read_text('utf-8'));paths={r['path']for r in tree['tree']};assert not tree.get('truncated')
req={};needed=set()
def stitems(r):
 out=[{'id':str(r['Tid'+str(i)]),'quantity':r['Qty'+str(i)]}for i in range(1,5)if r.get('Tid'+str(i))and r.get('Qty'+str(i))]
 if r.get('GoldQty'):out.append({'id':'1','quantity':r['GoldQty']})
 needed.update(x['id']for x in out);return out
labels=[C('일반 공격','Normal attack','通常攻撃','普攻'),C('주력 스킬','Main skill','メインスキル','主力技'),C('지원 스킬','Support skill','支援スキル','支援技'),C('궁극기','Ultimate','必殺技','必杀技')]
for character in rosters['stellasora']['characters']:
 cid=character['id'];r=chars.get(cid)
 if not r:continue
 rows=[]
 for a in sorted(adv.values(),key=lambda x:x['AdvanceLvl']):
  n=a['AdvanceLvl']
  if a['Group']!=r['AdvanceGroup']or n>8:continue
  title=C(f'돌파 {n} · Lv.{n*10}',f'Ascension {n} · Lv.{n*10}',f'突破 {n} · Lv.{n*10}',f'突破 {n} · Lv.{n*10}')
  rows.append({**group('stella-ascension-'+str(n),title,stitems(a),base+'public/data/CharacterAdvance.json'),'categoryId':'ascension','category':C('돌파','Ascension','突破','突破')})
 for si,gid in enumerate(r.get('SkillsUpgradeGroup',[])):
  ss=sorted([x for x in skills.values()if x['Group']==gid],key=lambda x:x['Id'])
  for n,s in enumerate(ss[1:],2):
   title={l:v+f' · Lv.{n-1} → {n}'for l,v in labels[si].items()}
   rows.append({**group('stella-skill-'+str(si)+'-'+str(n),title,stitems(s),base+'public/data/CharacterSkillUpgrade.json'),'categoryId':'skill-'+str(si),'category':labels[si]})
 if rows:req[cid]=rows
icons=[]
for mid in sorted(needed):
 r=items[mid];file=r['Icon'].rsplit('/',1)[-1];path='public/assets/items/'+file+'.png'
 if path not in paths:result['gaps'].append({'game':'stellasora','id':mid,'reason':'Exact native icon missing from pinned asset tree'});continue
 names={l:d.get(r['Title'],'')for l,d in loc.items()};assert all(names.values())
 icons.append(dict(id=mid,name=names,icon=base+path,sourceUrl=base+'public/data/Item.json',sourceKind='community'))
result['icons']['stellasora']={'items':icons,'sourceUrls':[base+'public/data/'+f+'.json'for f in ['Item','Character','CharacterAdvance','CharacterSkillUpgrade']]}
result['requirements']['stellasora']=req
# Endfield: exact prior roster skill IDs bind native char IDs; no name guessing.
pin='a0ed1dac31c502f636c70cee4e3010ca69562a70';base='https://raw.githubusercontent.com/rmxlinux/EndfieldData/'+pin+'/TableCfg/'
items=read('endfield-ItemTable');growth=read('endfield-CharGrowthTable');loc={l:read('endfield-I18nTextTable_'+s)for l,s in [('ko','KR'),('en','EN'),('ja','JP'),('zh','CN')]}
def localized(v):return {l:d.get(str(v['id']),v.get('text',''))for l,d in loc.items()}
assetbase='https://raw.githubusercontent.com/555me/EndfieldAssets/966ed92d2556386a37e4ec076a812ff46ca2fae9/assets/beyond/dynamicassets/gameplay/ui/'
assetpaths={}
for prefix in ['sprites','textures']:
 tree=read('endfield-'+prefix+'-tree');assert not tree.get('truncated')
 for r in tree['tree']:
  if r['path'].endswith('.png'):assetpaths.setdefault(pathlib.PurePosixPath(r['path']).stem,[]).append(prefix+'/'+r['path'])
baseline=json.loads((ROOT/'ops/character-rosters/enrichment/endfield_details/baseline.json').read_text('utf-8'))
ids={r['id']:set(re.sub(r'_(?:NormalAttack|NormalSkill|ComboSkill|UltimateSkill)$','',s)for s in r['skillIds'])for r in baseline['identities']}
req={};needed=set()
def efitems(xs,gold=0):
 out=[{'id':x['id'],'quantity':x['count']}for x in xs if x['count']>0]
 if gold:out.append({'id':'item_gold','quantity':gold})
 assert len({x['id']for x in out})==len(out)
 needed.update(x['id']for x in out);return out
for character in rosters['endfield']['characters']:
 cid=character['id'];native=ids.get(cid,set())
 if len(native)!=1 or next(iter(native))not in growth:
  result['gaps'].append({'game':'endfield','characterId':cid,'reason':'No unique existing native skill-ID binding'});continue
 g=growth[next(iter(native))];rows=[]
 for nid,n in g['charBreakCostMap'].items():
  title=localized(n['name']);assert all(title.values())
  category=C('승급','Promotion','昇進','晋升')if n['nodeType']==1 else C('장비 적응','Equipment','装備','装备')
  rows.append({**group('endfield-'+nid,title,efitems(n['requiredItem']),base+'CharGrowthTable.json'),'categoryId':'promotion'if n['nodeType']==1 else'equipment','category':category})
 for n in g['skillLevelUp']:
  sn=localized(g['skillGroupMap'][n['skillGroupId']]['name']);assert all(sn.values())
  level=n['level'];title={l:v+f' · Lv.{level-1} → {level}'for l,v in sn.items()}
  rows.append({**group('endfield-'+n['skillGroupId']+'-'+str(level),title,efitems(n['itemBundle'],n['goldCost']),base+'CharGrowthTable.json'),'categoryId':n['skillGroupId'],'category':sn})
 for nid,n in g['talentNodeMap'].items():
  if nid in g['charBreakCostMap']or not n['requiredItem']:continue
  if n['nodeType']==4:
   info=n['passiveSkillNodeInfo'];name=localized(info['name']);title={l:v+' · '+str(info['level'])for l,v in name.items()}
  elif n['nodeType']==3:
   name=localized(n['attributeNodeInfo']['title']);title=name
  else:continue
  if not all(name.values()):continue
  rows.append({**group('endfield-'+nid,title,efitems(n['requiredItem']),base+'CharGrowthTable.json'),'categoryId':re.sub(r'_\d+$','',nid),'category':name})
 if rows:req[cid]=rows
icons=[]
for mid in sorted(needed):
 r=items[mid];matches=assetpaths.get(r['iconId'],[])
 # An item icon must be in the native item sprite namespace, not a same-named UI placeholder.
 candidates=[p for p in matches if '/item/'in p.lower() or '/itemicon/'in p.lower()]
 if len(candidates)!=1:
  candidates=matches if len(matches)==1 else []
 if len(candidates)!=1:
  result['gaps'].append({'game':'endfield','id':mid,'reason':'No unique exact native icon path','paths':matches});continue
 name=localized(r['name']);assert all(name.values())
 icons.append(dict(id=mid,name=name,icon=assetbase+candidates[0],sourceUrl=base+'ItemTable.json',sourceKind='community'))
result['icons']['endfield']={'items':icons,'sourceUrls':[base+'ItemTable.json',base+'CharGrowthTable.json']}
result['requirements']['endfield']=req
for g,rows in result['requirements'].items():
 known={x['id']for x in result['icons'][g]['items']}
 for cid,groups in rows.items():
  for r in groups:
   for i in r['items']:
    assert i['id']in known,(g,cid,i)
target=OUT/'extra-stella-endfield.json';target.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(json.dumps({'bytes':target.stat().st_size,'games':{g:{'characters':len(v),'groups':sum(map(len,v.values())),'icons':len(result['icons'][g]['items'])}for g,v in result['requirements'].items()},'gaps':result['gaps']}))
