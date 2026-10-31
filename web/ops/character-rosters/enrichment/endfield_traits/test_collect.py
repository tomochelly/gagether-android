import copy,importlib.util,json,unittest
from pathlib import Path
root=Path(__file__).parent
spec=importlib.util.spec_from_file_location('endfield_traits',root/'collect.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Traits(unittest.TestCase):
 def setUp(self):
  self.html=(root/'sources/operator-ko.html').read_text();r=json.loads((root/'sources/css-receipts.json').read_text());self.css='\n'.join(Path(v['file']).read_text()for v in r);self.characters,self.urls=m.declarations(self.html,self.css)
 def test_all_exact_official_keys(self):
  self.assertEqual(len(self.characters),35);self.assertEqual(len(self.urls),11);self.assertEqual(self.characters['laevatain']['element'],'fire');self.assertEqual(self.characters['endministrator1']['class'],'guard');self.assertEqual(self.characters['perlica']['nameKo'],'펠리카')
 def test_changed_or_missing_declarations_fail(self):
  with self.assertRaises(ValueError):m.declarations(self.html.replace('data-key="perlica"','data-key="unknown"',1).replace('>펠리카<','><',1),self.css)
  with self.assertRaises(ValueError):m.declarations(self.html,self.css.replace('[data-key=guard]','[data-key=unknown]'))
 def test_only_icons_change_and_mismatched_ids_fail(self):
  c={'id':'perlica','name':{'ko':'펠리카'},'traits':[{'id':'class','value':{'ko':'캐스터'}},{'id':'element','value':{'ko':'전기'}}],'stats':[{'id':'hp','value':'5495'}]};r={'gameId':'endfield','characters':[c]};before=copy.deepcopy(r);icons={k:{'publicUrl':u}for k,u in self.urls.items()};out=m.enrich(r,{'perlica':self.characters['perlica']},icons);self.assertEqual(r,before);self.assertEqual(out['characters'][0]['stats'],c['stats']);self.assertEqual(out['characters'][0]['traits'][0]['icon'],self.urls['caster'])
  with self.assertRaises(ValueError):m.enrich(r,{'other':self.characters['perlica']},icons)
 def test_only_declared_source_host(self):
  with self.assertRaises(ValueError):m.source_url('https://example.org/endfield/image.png')
  with self.assertRaises(ValueError):m.source_url('https://web-static.hg-cdn.com/other.png')
if __name__=='__main__':unittest.main()
