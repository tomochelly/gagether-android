"""Version-reviewed native equipment collector. Incomplete reads never replace last-good data."""
import concurrent.futures,datetime,hashlib,io,json,pathlib,re,urllib.request
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parent.parent
RESEARCH=ROOT/'ops/research/wuwa-equipment'
OUTPUT=ROOT/'content/wuwa-equipment-catalog.json'
REPO='https://api.github.com/repos/DommyMM/wuwabuild'
RAW='https://raw.githubusercontent.com/DommyMM/wuwabuild/'
VERSION='3.7'
OFFICIAL='https://wutheringwaves.kurogames.com/kr/main/news/detail/5572'
LANGS={'ko':'ko','en':'en','ja':'ja','zh':'zh-Hans'}
STAT_KEYS={'HP':'hp','ATK':'atk','DEF':'def','HP%':'hpPercent','ATK%':'atkPercent','DEF%':'defPercent','Crit Rate':'critRate','Crit DMG':'critDamage','Energy Regen':'energyRegen','Healing Bonus':'healingBonus','Glacio DMG':'glacio','Fusion DMG':'fusion','Electro DMG':'electro','Aero DMG':'aero','Spectro DMG':'spectro','Havoc DMG':'havoc','Basic Attack DMG Bonus':'basicDamage','Heavy Attack DMG Bonus':'heavyDamage','Resonance Skill DMG Bonus':'skillDamage','Resonance Liberation DMG Bonus':'liberationDamage'}
LATEST_ECHOES={'Formrender','Soulfrayer','Skywatch Lancer','Bloomburst Puppet','Jade Nether Serpent','Reminiscence: Suhsin the Inevitable'}
LATEST_SETS={'Heart of Sworn Vigil','Flash of Electric Reflection','Flower of Tinged Yearning'}
def get(url,limit=16000000):
 request=urllib.request.Request(url,headers={'User-Agent':'GAGETHER public equipment catalog/1'})
 with urllib.request.urlopen(request,timeout=25) as response:
  if response.status!=200:raise ValueError('Unexpected response '+url)
  data=response.read(limit+1)
  if len(data)>limit:raise ValueError('Source exceeds bound: '+url)
  return data

def localized(source):
 result={locale:source.get(key,'').strip() for locale,key in LANGS.items()}
 if any(not value or len(value)>200 or re.search(r'<[^>]*>',value) for value in result.values()):raise ValueError('Incomplete native names')
 return result

def native_id(value):
 if not isinstance(value,int) or value<1:raise ValueError('Invalid native ID')
 return str(value)

def asset(value,commit):
 if not isinstance(value,str) or not re.fullmatch(r'/assets/UIResources/[A-Za-z0-9_./-]+\.webp',value) or '..' in value:raise ValueError('Invalid declared asset '+str(value))
 return RAW+commit+'/public'+value

def main():
 RESEARCH.mkdir(parents=True,exist_ok=True)
 now=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')
 commit=json.loads(get(REPO+'/git/ref/heads/main'))['object']['sha']
 if not re.fullmatch('[a-f0-9]{40}',commit):raise ValueError('Invalid source commit')
 raw,sources,originals={},{},{}
 sources=[]
 for name in ['Echoes','Fetters','Weapons','EchoStats','Stats']:
  url=RAW+commit+'/public/Data/'+name+'.json';original=get(url);raw[name]=json.loads(original);originals[name]=original
  sources.append({'name':'WuWaBuilds · '+name,'url':url,'kind':'community','checkedAt':now,'sha256':hashlib.sha256(original).hexdigest()})
 echoes=[]
 for row in raw['Echoes']:
  if row.get('cost') not in [1,3,4] or not row.get('fetter'):raise ValueError('Invalid native Echo cost/sets')
  echo={'id':native_id(row['id']),'name':localized(row['name']),'icon':asset(row['icon'],commit),'cost':row['cost'],'setIds':[native_id(value) for value in row['fetter']]}
  if row.get('phantomIcon'):echo['phantomIcon']=asset(row['phantomIcon'],commit)
  echoes.append(echo)
 sets=[{'id':native_id(row['id']),'name':localized(row['name']),'icon':asset(row['icon'],commit)} for row in raw['Fetters']]
 weapons=[{'id':native_id(row['id']),'name':localized(row['name']),'icon':asset(row['icon']['icon'],commit),'typeId':row['type']['id'],'rarity':row['rarity']['id']} for row in raw['Weapons']]
 for name,rows,lower,upper in [('Echoes',echoes,150,1000),('Fetters',sets,30,100),('Weapons',weapons,100,500)]:
  if len({row['id'] for row in rows})!=len(rows) or not lower<=len(rows)<=upper:raise ValueError('Incomplete inventory '+name)
 set_ids={row['id'] for row in sets}
 if any(set(row['setIds'])-set_ids for row in echoes):raise ValueError('Unknown native Echo set')
 if not LATEST_ECHOES.issubset({row['name']['en'] for row in echoes}) or not LATEST_SETS.issubset({row['name']['en'] for row in sets}):raise ValueError('Official3.7 additions missing')
 if OUTPUT.exists():
  previous=json.loads(OUTPUT.read_bytes())
  for key,rows in [('echoes',echoes),('sets',sets),('weapons',weapons)]:
   if {row['id'] for row in previous[key]}-{row['id'] for row in rows}:raise ValueError('Inventory regression '+key)
 stats=raw['EchoStats'];labels={value:localized(raw['Stats'][key]) for key,value in STAT_KEYS.items()}
 mains={cost:{STAT_KEYS[key]:values for key,values in options.items()} for cost,options in stats['mainStats'].items()}
 subs={STAT_KEYS[key]:values for key,values in stats['subStats'].items()}
 defaults={cost:{'key':STAT_KEYS[value[0]],'values':value[1:]} for cost,value in stats['defaultMainStats'].items()}
 urls=sorted({row[key] for rows in [echoes,sets,weapons] for row in rows for key in ['icon','phantomIcon'] if row.get(key)})
 assets=RESEARCH/'assets';assets.mkdir(exist_ok=True)
 def image(url):
  original=get(url,2000000)
  with Image.open(io.BytesIO(original)) as item:
   item.load();width,height,fmt=item.width,item.height,item.format
  if fmt!='WEBP' or not 16<=width<=4096 or not 16<=height<=4096:raise ValueError('Invalid image '+url)
  sha=hashlib.sha256(original).hexdigest();(assets/(sha+'.webp')).write_bytes(original)
  return {'url':url,'sha256':sha,'bytes':len(original),'width':width,'height':height,'format':fmt,'originalPath':'ops/research/wuwa-equipment/assets/'+sha+'.webp'}
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:images=list(executor.map(image,urls))
 for name,original in originals.items():(RESEARCH/(name+'.json')).write_bytes(original)
 sources.append({'name':'KURO ·3.7 Korean update notes','url':OFFICIAL,'kind':'official','checkedAt':now})
 catalog={'version':1,'sourceVersion':VERSION,'sourceCommit':commit,'checkedAt':now,'sources':sources,'echoes':echoes,'sets':sets,'weapons':weapons,'statLabels':labels,'mainStats':mains,'subStats':subs,'defaultMainStats':defaults}
 report={'version':1,'sourceVersion':VERSION,'sourceCommit':commit,'checkedAt':now,'coverage':{'echoes':len(echoes),'sets':len(sets),'weapons':len(weapons),'phantomSkins':sum('phantomIcon' in row for row in echoes),'imageUrls':len(images),'imageBytes':sum(row['bytes'] for row in images),'missingImages':[],'missingNativeNames':[],'unknownSets':[]},'officialVersionEvidence':{'ko':OFFICIAL,'en':'https://wutheringwaves.kurogames.com/en/main/news/detail/5571','echoes':sorted(LATEST_ECHOES),'namedEchoes':sorted(LATEST_ECHOES-{'Reminiscence: Suhsin the Inevitable'}),'additionalCost4':{'officialDescription':'one new COST 4 Echo','nativeProviderId':'60002255','nativeProviderName':'Reminiscence: Suhsin the Inevitable'},'sets':sorted(LATEST_SETS)},'statAssumption':'Published rarity5 main-stat level0/25 endpoints and substat roll values; probabilities omitted. Not a damage simulator.','images':images}
 (RESEARCH/'receipt.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 temporary=OUTPUT.with_suffix('.json.new');temporary.write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8');temporary.replace(OUTPUT)
 print(json.dumps({'sourceVersion':VERSION,'sourceCommit':commit,'coverage':report['coverage'],'catalogBytes':OUTPUT.stat().st_size}))
if __name__=='__main__':main()
