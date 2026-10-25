import importlib.util,json,pathlib,subprocess,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('zzz_enrich',ROOT/'enrich.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ZZZDetails(unittest.TestCase):
 def test_source_formulas_are_literal_and_do_not_execute(self):
  self.assertEqual(m.safe_math('5+AvatarSkillLevel(1)*2.25',12),32)
  for value in ['__import__("os").system("id")','2**100000000','f(1)','1;2']:
   with self.assertRaises((ValueError,SyntaxError)):m.safe_math(value,1)
 def test_cal_scale_and_level_are_preserved(self):
  self.assertEqual(m.text('{CAL:5+AvatarSkillLevel(1)*2.25,100,2}%','en',12),'3200%')
  self.assertEqual(m.text('{CAL:0.07+AvatarSkillLevel(1)*0.015,100,2}%','en',12),'25%')
  self.assertEqual(m.text('<IconMap:Icon_Normal>\n<color=#fff>hit</color>','en'),'[Basic Attack]\nhit')
 def test_source_growth_base_panel_excludes_core(self):
  # Fixed published Enka inputs. Cross-provider/core-F comparison is documented
  # separately; this fixture is not an independent in-game measurement.
  source={'BaseProps':{'11101':603,'12101':95,'13101':49,'12201':118},'GrowthProps':{'11101':818426,'12101':54230,'13101':66882},'PromotionProps':[{}, {}, {}, {}, {}, {'11101':2069,'12101':169,'13101':169}]}
  self.assertEqual(m.stat_values(source,60,5),{'hp':'7500','atk':'583','def':'612','impact':'118'})
  self.assertEqual(m.stat_values(source,1,0),{'hp':'603','atk':'95','def':'49','impact':'118'})
 def test_skill_scale_uses_exact_avatar_and_level(self):
  raw={1011001:{'ID':1011001,'AvatarID':1011,'DamagePercentage':3120,'DamagePercentageGrowth':290,'StunRatio':1560,'StunRatioGrowth':80}}
  self.assertEqual(m.multiplier('{Skill:1011001, Prop:1001}',1,1011,raw),'31.2%')
  self.assertEqual(m.multiplier('{Skill:1011001, Prop:1001}',12,1011,raw),'63.1%')
  self.assertEqual(m.multiplier('{{Skill:1011001, Prop:1002}/2}',1,1011,raw),'7.8%')
  with self.assertRaises(ValueError):m.multiplier('{Skill:1011001, Prop:1001}',1,1021,raw)
 def test_lossless_core_text_parameters_retain_wording(self):
  for originals in [['ATK 200, shield 300%','ATK 1,000, shield 1,400%'],['First source wording. '*30,'Second source wording. '*30]]:
   template,parameters=m.parameterize(originals)
   for level,original in enumerate(originals):
    rebuilt=__import__('re').sub(r'\{(\d+)\}',lambda x:parameters[int(x.group(1))-1][level],template)
    self.assertEqual(rebuilt,original)
   self.assertTrue(all(len(v)<=300 for row in parameters for v in row))
 def test_catalog_parser_rejects_executable_downloads(self):
  with tempfile.TemporaryDirectory()as folder:
   source=pathlib.Path(folder)/'unsafe.js';source.write_text('const x=process.exit(0); export{x as characters};')
   result=subprocess.run(['node',str(ROOT/'parse-catalog.mjs'),str(source)],capture_output=True,text=True)
   self.assertNotEqual(result.returncode,0);self.assertIn('Nonliteral',result.stderr.replace('nonliteral','Nonliteral'))
 def test_source_url_matches_declared_slug_normalization(self):
  self.assertEqual(m.gg_url({'Name':'Soldier 0 - Anby'},'en'),'https://zzz.gg/en/characters/soldier-0-anby')
 def test_variant_numeric_heading_is_retained_once(self):
  import copy
  skills=[{'TextType':0,'SkillLetter':0,'TextTitle':'Base attack','Text':'Basic attack.'}, {'TextType':1,'DescType':0,'SkillLetter':0,'Text':'Base attack stance 2','Value':''},{'TextType':1,'DescType':1,'SkillLetter':0,'Text':'Damage','Value':'{Skill:1011001, Prop:1001}'}]
  base={'Name':'Anby','Skills':skills,'Talents':[{'TalentLevel':i,'TalentName':'M'+str(i),'TalentDesc':'Effect '+str(i)}for i in range(1,7)],'Profile':None,'CampName':'Cunning Hares','TotalMaterials':[]}
  native={l:copy.deepcopy(base)for l in m.LOCALES};catalogs={l:{'skill_scaling':[{'ID':1011001,'AvatarID':1011,'DamagePercentage':3120,'DamagePercentageGrowth':290}]}for l in m.LOCALES};row={'id':'1011'}
  m.with_details(row,native,catalogs,{})
  values=[v for s in row['skillTables']for v in s['values']]
  self.assertEqual(len(values),1);self.assertEqual(values[0]['levels'][0],'31.2%');self.assertEqual(values[0]['levels'][-1],'63.1%')
  table=next(s for s in row['skillTables']if s['values']);self.assertEqual(table['name']['en'],'Base attack stance 2')
if __name__=='__main__':unittest.main()
