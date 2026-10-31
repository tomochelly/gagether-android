import copy,importlib.util,json,pathlib,tempfile,unittest
HERE=pathlib.Path(__file__).parent
spec=importlib.util.spec_from_file_location('limbus_enrich',HERE/'enrich.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class NoNetwork:
 def __init__(self):self.calls=[]
 def get(self,url,*args):self.calls.append(url);raise ValueError('source unavailable')
def fixtures():
 source='https://www.prydwen.gg/limbus-company/identities/g-corp-manager-corporal-gregor/'
 c={'id':'1','name':{'ko':'기존 이름','en':'[G Corp. Manager Corporal] Gregor','ja':'','zh':''},'sourceUrl':source,'sourceKind':'community','image':{'url':'https://gagether.wiki/roster-bootstrap/pinned.webp','sourceUrl':source,'kind':'splash'},'stats':[{'id':'hp','label':m.LABELS['hp'],'value':'203','basis':m.C('기준','basis','基準','基准')}]}
 long='원문 조각 '+('문장 A\n'*100)
 native={locale:{'names':{},'skills':{},'passives':{},'keywords':{}}for locale in m.LANGS}
 native['en']['names']['11203']=({'id':11203,'title':'G Corp. Manager Corporal','name':'Gregor'},'https://example.test/en/names')
 for locale in m.LANGS:
  native[locale]['skills']['1120301']=({'id':1120301,'levelList':[{'level':1,'name':'Hack'if locale=='en'else'원문 이름','desc':long,'coinlist':[{'coindescs':[{'desc':'[WhenUse] test'}]}]},{'level':4,'name':'Hack'if locale=='en'else'원문 이름','desc':long+' source 4'}]},'https://example.test/'+locale+'/skills')
 char={'id':1,'slug':'g-corp-manager-corporal-gregor','data':{'unitId':'1','skills':[{'skill_id':'1_1','name':'Hack','type':'Gluttony','skill_power':'4','coin_power':'3','number_of_coins':2,'amount':3,'offense_level':'5','skill_effect':'<p>Condition<br />+20%</p>','coin_effects':[{'level':'1','dark':'<b>Hit</b> 50%'}],'attack_type':'Slash'}],'status':{'hp_1':'68','hp_30':'203','def_1':'12','def_30':'58','speed_1':'3-7','speed_30':'3-7'},'resistances':{'slash':'Normal'},'passives':[{'name':'Emergency Rations','passive_id':'1_1','passive_type':'Passive','description':'<p>Heal</p>','type':'Gluttony','cost':'4','category':'Owned'}]}}
 icons={'stat_hp':m.ICON+'stat_hp.webp','affinity_gluttony':m.ICON+'affinity_gluttony.webp','attackt_slash':m.ICON+'attackt_slash.webp'}
 return c,char,native,icons
class Tests(unittest.TestCase):
 def patch(self,c=None,char=None):
  fc,fchar,native,icons=fixtures();return m.patch_character(c or fc,char or fchar,'Stats (At level 60)',native,icons,NoNetwork(),set())
 def test_exact_identity_and_skill_binding(self):
  c,char,native,icons=fixtures();self.assertEqual(m.match_identity(c,native),'11203');self.assertEqual(m.match_skill(char['data']['skills'][0],'11203',native),'1120301');self.assertIsNone(m.match_skill(char['data']['skills'][0],'11202',native));c['name']['en']='Other Gregor';self.assertIsNone(m.match_identity(c,native))
 def test_source_identity_mismatch_fails(self):
  c,char,native,icons=fixtures();char['data']['unitId']='2'
  with self.assertRaisesRegex(ValueError,'identity mismatch'):self.patch(c,char)
 def test_native_explicit_levels_and_lossless_chunks(self):
  c,char,native,icons=fixtures();result,report=self.patch();skill=next(s for s in result['skillTables']if s['id']=='native-1120301');self.assertEqual(skill['maxLevel'],2);self.assertEqual([l['en']for l in skill['levelLabels']],['Uptie 1','Uptie 4'])
  for locale in m.LANGS:
   for index,level in enumerate(native[locale]['skills']['1120301'][0]['levelList']):
    reconstructed=skill['descriptionTemplate'][locale]
    for n,row in enumerate(skill['parameters'][locale],1):self.assertTrue(all(len(cell)<=300 for cell in row));reconstructed=reconstructed.replace('{'+str(n)+'}',row[index])
    self.assertEqual(reconstructed,m.level_body(level,locale,native))
 def test_numeric_source_never_marked_as_uptie(self):
  result,_=self.patch();s=result['skillTables'][0];self.assertNotIn('maxLevel',s);self.assertIn('not declared',s['basis']['en']);self.assertEqual({v['id']:v['levels'][0]for v in s['values']}['coin-count'],'2');self.assertEqual(s['description']['ko'],'');self.assertIn('Coin 1',s['description']['en'])
 def test_good_pinned_art_and_input_preserved(self):
  c,char,native,icons=fixtures();before=copy.deepcopy(c);result,_=self.patch(c,char);self.assertEqual(c,before);self.assertEqual(result['image'],before['image'])
 def test_art_fetch_failure_keeps_details(self):
  c,char,native,icons=fixtures();c.pop('image');char['data']['full_image']='https://cdn.prydwen.gg/images/limbus-company/characters/declared.webp';result,report=self.patch(c,char);self.assertEqual(len(result['skillTables']),3);self.assertIsNone(result.get('image'));self.assertIsNotNone(report['artFailure'])
 def test_rejected_art_never_fetched(self):
  c,char,native,icons=fixtures();c.pop('image');url='https://cdn.prydwen.gg/images/limbus-company/characters/rejected.webp';char['data']['full_image']=url;network=NoNetwork();result,report=m.patch_character(c,char,'Stats (At level 60)',native,icons,network,{url});self.assertEqual(network.calls,[]);self.assertNotIn('image',result)
 def test_growth_has_only_published_endpoints(self):
  result,_=self.patch();self.assertEqual([r['level']for r in result['statProgression']['rows']],[1,60]);self.assertEqual(result['statProgression']['rows'][1]['values']['hp'],'203');self.assertIn('no interpolation',result['statProgression']['basis']['en'])
 def test_rendered_level_ignores_scripts_and_handles_react_comments(self):
  c,char,native,icons=fixtures();result,_=m.patch_character(c,char,'<h4>Stats (At level <!-- -->60<!-- -->)</h4><script>Stats (At level 70)</script>',native,icons,NoNetwork(),set());self.assertEqual(result['statProgression']['defaultLevel'],60);self.assertEqual(result['stats'][0]['value'],'203')
  result,_=m.patch_character(c,char,'<script>Stats (At level 60)</script>',native,icons,NoNetwork(),set());self.assertNotIn('statProgression',result)
 def test_resistances_and_skills_idempotent(self):
  result,_=self.patch();second,_=self.patch(result);self.assertEqual(result,second);ids=[s['id']for s in result['stats']];self.assertEqual(len(ids),len(set(ids)))
 def test_same_source_slot_keeps_distinct_variants_and_deduplicates_native_reference(self):
  c,char,native,icons=fixtures();variant=copy.deepcopy(char['data']['skills'][0]);variant['coin_power']='7';char['data']['skills'].append(variant);result,_=self.patch(c,char)
  numerical=[s for s in result['skillTables']if s['id'].startswith('prydwen-')];self.assertEqual(len(numerical),2);self.assertEqual([s['type']['en']for s in numerical],['Skill 1 · values','Skill 1 · values']);self.assertEqual(len({s['id']for s in result['skillTables']}),len(result['skillTables']));self.assertEqual(len([s for s in result['skillTables']if s['id'].startswith('native-')]),1)
 def test_cache_allowlist_and_hash(self):
  with tempfile.TemporaryDirectory()as path:
   cache=m.Cache(path,True)
   with self.assertRaisesRegex(ValueError,'allowlist'):cache.get('https://evil.test/source')
   url='https://www.prydwen.gg/limbus-company/identities/exact/';stem=pathlib.Path(path)/m.sha(url.encode());stem.with_suffix('.body').write_bytes(b'altered');stem.with_suffix('.json').write_text(json.dumps({'url':url,'sha256':m.sha(b'original')}))
   with self.assertRaisesRegex(ValueError,'hash'):cache.get(url)
if __name__=='__main__':unittest.main()
