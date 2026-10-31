import pathlib,urllib.request,concurrent.futures,json,hashlib,datetime,gzip,base64
ROOT=pathlib.Path(__file__).resolve().parents[3]
OUT=ROOT/'work/materials-remaining';OUT.mkdir(parents=True,exist_ok=True)
JOBS={
 'dna':'https://duetnightabyss.th.gl/ko/db/characters/char_1101',
 'nikke':'https://nikke-api-gunwoos-projects.vercel.app/api/nikkes/209001',
 'limbus':'https://www.prydwen.gg/limbus-company/identities/g-corp-manager-corporal-gregor/',
 'gfl2':'https://gfl2.help/en/characters/Alva',
 'trickcal':'https://wiki.cheeky.tsuncloud.com/korea/apostles/alice',
 'nte-tree':'https://api.github.com/repos/Waifus-Grace/NTE_Assets/git/trees/cef09a29d4d92c7b1e0b950d89ba8c75b1c529e7?recursive=1',
 'uma':'https://raw.githubusercontent.com/daftuyda/UmaTools/main/public/assets/uma_data.json',
 'hi3-tree':'https://api.github.com/repos/YossaponSopap/hi3-database/git/trees/main?recursive=1',
 'holodreams':'https://hololive-dreams.com/en/',
}
if __import__('sys').argv[1:] == ['more']:
 rows=json.loads((ROOT/'content/character-rosters/bootstrap.json').read_bytes())
 dna=next(g for g in rows if g['gameId']=='dna')
 JOBS={f'dna-{c["id"]}-{l}':f'https://duetnightabyss.th.gl/{l}/db/characters/{c["id"]}'for c in dna['characters'] for l in ['ko','en','ja','zh-CN']}
 ref='https://raw.githubusercontent.com/Waifus-Grace/NTE_Assets/cef09a29d4d92c7b1e0b950d89ba8c75b1c529e7/'
 for n,p in {'characters':'DataTable/Character/DT_Character.json','breakthrough':'DataTable/Character/DT_CharacterBreakthroughDataTable.json','upgrade':'DataTable/Character/DT_CharacterUpgradeDataTable.json','items':'DataTable/Inventory/DT_ItemConfig.json','skills':'DataTable/Skill/DT_SkillUpgradeData.json'}.items():JOBS['nte-'+n]=ref+p
 for l in ['ko','en','ja','zh-CN']:JOBS['nte-locale-'+l]=ref+'Localization/'+l+'/game.json'
if __import__('sys').argv[1:] == ['trickcal']:
 rows=json.loads((ROOT/'content/character-rosters/bootstrap.json').read_bytes())
 game=next(g for g in rows if g['gameId']=='trickcal');JOBS={}
 for c in game['characters']:
  form=game.get('detailCatalog',{}).get('forms',{}).get(c['id'])
  detail=json.loads(gzip.decompress(base64.b64decode(form['payload'])))['details']if form else c
  for source in detail.get('detailSources',[]):
   u=source['url']
   if u.startswith('https://wiki.cheeky.tsuncloud.com/korea/apostles/')or u.startswith('https://wiki.cheeky.tsuncloud.com/global/apostles/'):
    region='kr'if'/korea/'in u else'global';JOBS['trickcal-'+c['id']+'-'+region]=u
 ref='https://raw.githubusercontent.com/Waifus-Grace/NTE_Assets/cef09a29d4d92c7b1e0b950d89ba8c75b1c529e7/'
 JOBS['nte-abilities']=ref+'DataTable/Character/DT_CharacterAbilityConfig.json'
def one(k,u):
 p=OUT/(k+'.body');m=OUT/(k+'.receipt.json')
 if p.exists()and m.exists():return json.loads(m.read_bytes())
 try:
  with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'GAGETHER-material-reference/1.0'}),timeout=35)as r:b=r.read(35_000_001);status=r.status
  if len(b)>35_000_000:raise ValueError('Source size bound')
  p.write_bytes(b);x={'key':k,'url':u,'status':status,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()};m.write_text(json.dumps(x));return x
 except Exception as e:return {'key':k,'url':u,'error':str(e)}
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=5)as ex:
  for x in ex.map(lambda kv:one(*kv),JOBS.items()):print(json.dumps(x),flush=True)
