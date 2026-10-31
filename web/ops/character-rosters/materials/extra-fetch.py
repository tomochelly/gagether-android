import urllib.request,pathlib,json,concurrent.futures,hashlib,datetime
out=pathlib.Path('work/materials-extra-sources');out.mkdir(parents=True,exist_ok=True)
base='https://raw.githubusercontent.com/JforPlay/sstoy/33268f4a89cd314fff385a6ffdd6ecbbdc995a8b/public/data/'
jobs=[('stella-'+n,base+n+'.json')for n in ['Item','Character','CharacterAdvance','CharacterSkillUpgrade','CharacterUpgrade']]+[('stella-'+loc+'-Item',base+loc+'/Item.json')for loc in ['KR','EN','JP','CN']]
jobs += [('stella-resources-source','https://raw.githubusercontent.com/JforPlay/sstoy/33268f4a89cd314fff385a6ffdd6ecbbdc995a8b/src/modules/resources-calc.ts')]
ebase='https://raw.githubusercontent.com/rmxlinux/EndfieldData/a0ed1dac31c502f636c70cee4e3010ca69562a70/TableCfg/'
jobs += [('endfield-'+n,ebase+n+'.json')for n in ['ItemTable','CharGrowthTable','CharacterTable','CharLevelUpTable','CharBreakTable','I18nTextTable_KR','I18nTextTable_EN','I18nTextTable_JP','I18nTextTable_CN']]
jobs += [('endfield-ui-root','https://api.github.com/repos/555me/EndfieldAssets/git/trees/ac3b210146ace8835fd153ee7704f7bced42fcfb')]
jobs += [('endfield-sprites-tree','https://api.github.com/repos/555me/EndfieldAssets/git/trees/a53ef8a6cd372c593a0c26572ece8decd5ee887a?recursive=1'),('endfield-textures-tree','https://api.github.com/repos/555me/EndfieldAssets/git/trees/86f45eea683c66ed0469814dbf4fe68c0d270f37?recursive=1')]
rbase='https://raw.githubusercontent.com/St-Pavlov-Foundation/re1999-data-global/36d8067c56889cec3a56160672cd12fbd54cdd50/data/'
jobs += [('reverse-'+n,rbase+'json/'+n+'.json')for n in ['item','character_rank','character_talent','currency']]
jobs += [('reverse-language-'+l,rbase+'configs/language/language_'+l+'.json')for l in ['kr','en','jp','zh']]
jobs += [('reverse-asset-root','https://api.github.com/repos/myssal/Reverse-1999-CN-Asset/git/trees/45e75248ba3b25053fd32e63ab13c2f9f54dd9df')]
jobs += [('reverse-atlassrc-tree','https://api.github.com/repos/myssal/Reverse-1999-CN-Asset/git/trees/88c66df598b428d5ff86cc345dcc4682bd4c7bfe?recursive=1'),('reverse-singlebg-root','https://api.github.com/repos/myssal/Reverse-1999-CN-Asset/git/trees/52884b3702cc89fdcfc36ca3a2da0b139cc6dba1')]
jobs += [('reverse-prop-tree','https://api.github.com/repos/myssal/Reverse-1999-CN-Asset/git/trees/e7059850fbea6f14eb88603d876c76df55e7bfc5?recursive=1'),('reverse-currency-tree','https://api.github.com/repos/myssal/Reverse-1999-CN-Asset/git/trees/169974613ca289499e01788b482a1765bc6cfe40?recursive=1')]
def get(j):
 k,u=j;p=out/(k+'.json')
 if not p.exists():
  try:
   with urllib.request.urlopen(u,timeout=50)as r:b=r.read(90000000)
  except Exception as e:return k,str(e)
  p.write_bytes(b);(out/(k+'.receipt.json')).write_text(json.dumps({'url':u,'sha256':hashlib.sha256(b).hexdigest(),'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}))
 return k,p.stat().st_size
with concurrent.futures.ThreadPoolExecutor(max_workers=5)as ex:print(list(ex.map(get,jobs)))
