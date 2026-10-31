import copy,json,unittest,tempfile
from pathlib import Path
from unittest.mock import patch
import collect as c

def flight(value):return '<script>self.__next_f.push('+json.dumps([1,json.dumps(value,ensure_ascii=False)])+')</script>'
class CollectorTests(unittest.TestCase):
 def test_inert_json_decoder_preserves_text_and_ignores_executable_source(self):
  s='<script>throw new Error("never evaluate")</script>'+flight({'text':'text "])" and <script>not executable</script>'})
  self.assertEqual(c.field(c.flight(s),'text'),'text "])" and <script>not executable</script>')
 def test_released_identity_wins_over_story_trial_placeholders(self):
  rows=[dict(id=i+1,title='A'+str(i),href='/korea/apostles/a'+str(i),released=True)for i in range(80)]
  rows.extend([dict(id=999,title='A0',href='/korea/apostles/trial',released=False,kind='trial'),dict(id=1000,title='A0',href='/korea/apostles/story',released=False,kind='story')])
  self.assertEqual(c.list_items(flight({'items':rows}))['A0']['id'],1)
  rows.append(dict(id=1001,title='A0',href='/korea/apostles/ambiguous',released=True))
  with self.assertRaisesRegex(ValueError,'Duplicate'):c.list_items(flight({'items':rows}))
 def test_article_identity_and_declared_full_sd_asset(self):
  page='<h1>Alice</h1><img src="https://cheeky.tsuncloud.com/deploy/com.epidgames.trickcalrevive/sprites/rawsprites/heroicons/alice/Alice.png">'+flight({'skills':[dict(kind='Basic',name='Basics',desc='Damage')]})
  skills,art=c.native_detail(page,{'title':'Alice'});self.assertEqual(skills[0]['name'],'Basics');self.assertIn('/heroicons/alice/',art)
  with self.assertRaisesRegex(ValueError,'identity'):c.native_detail(page,{'title':'Not Alice'})
 def test_kr_original_checkpoints_are_not_interpolated_or_globalized(self):
  char={'sections':[dict(id='native-skill-low',body=c.C('아르카나\n설명\nLv.1\n피해: 100%\nLv.10\n피해: 200%'),regions=['kr']),dict(id='foreign-section',body=c.C(en='Global exact values'),regions=['global'])]}
  tables,converted=c.kr_existing_tables(char,[dict(kind='Skill',iconUrl='https://source.example/icon.png')],'https://source.example/kr')
  self.assertEqual(converted,{'native-skill-low'});self.assertEqual(tables[0]['regions'],['kr']);self.assertEqual(tables[0]['description']['en'],'');self.assertNotIn('maxLevel',tables[0]);self.assertIn('Lv.10',tables[0]['description']['ko']);self.assertEqual(len(char['sections']),2)
 def test_native_global_levels_remain_exact_rows_and_templates_are_omitted(self):
  skill=dict(kind='Skill',name='Arcana',desc='<color=#abcdef>Exact effect</color>',detail='Damage: 200%',detailLevels=[1,2],detailByLevel={'1':'Damage: 100%\\nDuration: 3s','2':'Damage: 200%\\nDuration: 4s'})
  tables,unknown=c.native_tables([skill],'https://source.example/global','global','en');self.assertEqual(unknown,0);table=tables[0]
  self.assertEqual(table['maxLevel'],2);self.assertEqual([v['levels']for v in table['values']],[['100%','200%'],['3s','4s']]);self.assertEqual(table['description']['en'],'Exact effect');self.assertEqual(table['description']['ko'],'');self.assertEqual(table['regions'],['global'])
  skill['detailByLevel']={};skill['detail']='Damage: {1}%';tables,unknown=c.native_tables([skill],'https://source.example/kr','kr','ko');self.assertEqual(unknown,1);self.assertNotIn('{1}',json.dumps(tables));self.assertNotIn('maxLevel',tables[0])
 def test_level_zero_native_basic_coefficients_remain_visible(self):
  raw=dict(kind='Basic',name='Basics',desc='Exact basic effect',detail='Damage: 100%',detailLevels=[0],detailByLevel={'0':'Damage: 100%'})
  tables,_=c.native_tables([raw],'https://source.example/global','global','en');self.assertIn('Damage: 100%',tables[0]['description']['en']);self.assertNotIn('maxLevel',tables[0])
 def test_enhanced_skill_does_not_mutate_shared_labels(self):
  before=copy.deepcopy(c.TYPES);skill=dict(kind='Basic',name='Basics',desc='Basic',enhanced=[dict(kind='Basic',name='Enhance',desc='Enhanced')]);tables,_=c.native_tables([skill],'https://source.example/global','global','en');self.assertEqual(c.TYPES,before);self.assertIn('Enhanced',tables[1]['type']['en'])
 def test_traits_bind_only_equal_facets_and_declared_icons(self):
  char={'traits':[dict(id='personality',value={'en':'Composed'}),dict(id='position',value={'en':'Mid'}),dict(id='role',value={'en':'Tank'})]};item={'facets':{'Synergy':['Composed'],'Position':'Middle','Role':'DPS'},'traits':[{'label':'Composed','iconUrl':'https://source.example/cool.png'},{'label':'Middle','iconUrl':'https://source.example/mid.png'},{'label':'DPS','iconUrl':'https://source.example/dps.png'}]};c.bind_traits(char,item);self.assertEqual(char['traits'][0]['icon'],'https://source.example/cool.png');self.assertEqual(char['traits'][1]['icon'],'https://source.example/mid.png');self.assertNotIn('icon',char['traits'][2])
 def test_cached_replay_never_renews_source_clock_and_old_online_cache_refreshes(self):
  url=c.KR;old='2000-01-01T00:00:00Z'
  with tempfile.TemporaryDirectory()as directory:
   root=Path(directory);key=c.sha(url.encode());body=root/(key+'.body');meta=root/(key+'.json');body.write_bytes(b'old');meta.write_text(json.dumps(dict(url=url,checkedAt=old,sha256=c.sha(b'old'),bytes=3)))
   offline=c.Sources(root,offline=True)
   with patch('urllib.request.urlopen',side_effect=AssertionError('Offline must not fetch')):self.assertEqual(offline.get(url),b'old')
   self.assertEqual(offline.receipts[url]['checkedAt'],old)
   class Response:
    status=200
    def __enter__(self):return self
    def __exit__(self,*a):pass
    def read(self,n):return b'new'
   online=c.Sources(root)
   with patch('urllib.request.urlopen',return_value=Response())as fetch:self.assertEqual(online.get(url),b'new');self.assertEqual(fetch.call_count,1)
   self.assertNotEqual(online.receipts[url]['checkedAt'],old);self.assertEqual(online.receipts[url]['mode'],'live-read')
 def test_fixed_sources_reject_other_sites_and_credentials(self):
  for url in ['http://wiki.cheeky.tsuncloud.com/korea/apostles','https://evil.example/image.png','https://name:password@wiki.cheeky.tsuncloud.com/korea/apostles','https://wiki.cheeky.tsuncloud.com/korea/apostles/../../private']:
   with self.assertRaises(ValueError):c.allowed(url)
if __name__=='__main__':unittest.main()
