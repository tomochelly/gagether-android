import argparse,copy,importlib.util,io,json,pathlib,subprocess,tempfile,types,unittest
from contextlib import redirect_stdout
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('zzz_enrich',ROOT/'enrich.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ZZZDetails(unittest.TestCase):
 def test_failed_source_fallback_keeps_released_facts_and_drops_announced_beta_facts(self):
  with tempfile.TemporaryDirectory()as folder:
   root=pathlib.Path(folder);source=root/'input.json';out=root/'out'
   released={'id':'1011','stats':[{'id':'hp','value':'603'}]};announced={'id':'1631','availability':{'status':'announced'},'stats':[{'id':'beta','value':'999999'}]}
   source.write_text(json.dumps({'gameId':'zzz','characters':[released,announced]}));before=source.read_bytes()
   with patch.object(m.sys,'argv',['enrich.py','--input',str(source),'--output-dir',str(out)]),patch.object(m.Sources,'get',side_effect=RuntimeError('upstream blocked')):
    with self.assertRaisesRegex(RuntimeError,'upstream blocked'):m.main()
   saved=json.loads((out/'zzz.json').read_text());self.assertEqual(saved['characters'][0],released);self.assertNotIn('stats',saved['characters'][1]);self.assertEqual(source.read_bytes(),before)
   audit=json.loads((out/'manifest.json').read_text());self.assertEqual(audit['status'],'failed');self.assertTrue(audit['preservedReleasedInput']);self.assertEqual(audit['announcedIdentityOnlyIds'],['1631'])
 def test_full_lane_skips_announced_beta_facts_and_counts_but_preserves_identity_and_receipts(self):
  with tempfile.TemporaryDirectory()as folder:
   root=pathlib.Path(folder);source=root/'input.json'
   preview={'id':'1631','name':m.C('세베리안','Severian','セヴェリアン','赛维里安'),'availability':{'status':'announced','sourceUrl':'https://zenless.hoyoverse.com/en-us/news/166054'},'sourceUrl':'https://example.test/native','sourceKind':'community','image':{'url':'https://example.test/severian-card.webp','kind':'card','sourceUrl':'https://example.test/card'},'detailSources':[{'url':'https://zenless.hoyoverse.com/en-us/news/166054','kind':'official'}],'stats':[{'id':'beta','value':'999999'}],'skillTables':[{'id':'beta','values':[{}]}],'statProgression':{'beta':True},'variantDetails':{'beta':{}},'sections':[{'id':'beta'}]}
   document={'gameId':'zzz','characters':[{'id':'1011','name':m.C('엔비','Anby','アンビー','安比')},preview],'sourceUrls':['https://example.test/native'],'coverage':{'includedCount':2}}
   source.write_text(json.dumps(document));before=source.read_bytes();calls=[]
   class FakeSources:
    def __init__(self,path,replay=None):self.root=path;path.mkdir(parents=True,exist_ok=True);self.receipts=[]
    def get(self,key,url,maximum=0):
     self.receipts.append({'key':key,'url':url,'status':200})
     if key=='official-ko':return json.dumps({'data':{'list':[{'sExt':{}}for _ in range(50)]}}).encode()
     if key=='enka':return b'{"1011":{}}'
     if key=='gg-page':return b'<script src="/_nuxt/router.js"></script>'
     if key.startswith('gg-discovery-'):return ','.join('"../data/'+m.GG_LOCALES[l]+'/characters.json":()=>x(()=>import("./'+l+'.js"))'for l in m.LOCALES).encode()
     return b'unused source fixture'
   catalog={'characters':[{'ID':1011,'Skills':[{'TextType':1,'Value':'published'}]}]}
   def stats(row,raw):calls.append(('stats',row['id']));row['stats']=[{'id':'hp','value':'603'}]
   def details(row,*args):calls.append(('details',row['id']));row['skillTables']=[{'id':'published','values':[{}]}];row['detailSources']=[]
   def art(item,*args):
    row,_=item;calls.append(('art',row['id']));return row['id'],{'url':'https://example.test/full.png','kind':'full-body'},{'characterId':row['id']}
   args=argparse.Namespace(input=source,output_dir=root/'output',cache_dir=root/'cache',replay_source_root=None)
   with patch.object(m,'Sources',FakeSources),patch.object(m.subprocess,'run',return_value=types.SimpleNamespace(stdout=json.dumps(catalog))),patch.object(m,'with_stats',side_effect=stats),patch.object(m,'with_details',side_effect=details),patch.object(m,'official_match',return_value={'iInfoId':'verified'}),patch.object(m,'download_art',side_effect=art),redirect_stdout(io.StringIO()):audit=m.run(args)
   saved=json.loads((args.output_dir/'zzz.json').read_text());announced=saved['characters'][1]
   self.assertEqual(source.read_bytes(),before);self.assertEqual([c['id']for c in saved['characters']],['1011','1631'])
   self.assertEqual(announced,{k:v for k,v in preview.items()if k not in ['stats','skillTables','statProgression','variantDetails','sections']})
   self.assertEqual(calls,[('stats','1011'),('details','1011'),('art','1011')])
   self.assertEqual((audit['numericRows'],audit['sourceNumericRows'],audit['characters']),(1,1,2));self.assertEqual(audit['announcedIdentityOnlyIds'],['1631']);self.assertEqual(audit['status'],'ok')
   self.assertEqual({r['key']for r in audit['sources']},{'official-ko','enka','gg-page','gg-discovery-0',*[f'catalog-{l}'for l in m.LOCALES]})
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
