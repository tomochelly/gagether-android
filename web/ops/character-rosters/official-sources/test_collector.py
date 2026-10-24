import copy, hashlib, json, pathlib, tempfile, unittest, urllib.error
from unittest.mock import patch
import collect

class RecoveryContract(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
  self.c=collect.Collector(pathlib.Path(self.temp.name),pathlib.Path('not-needed-for-write-contract'))
 def data(self,game='hi3',ids=('a',)):
  return {'gameId':game,'sourceName':'fixture','sourceUrls':['https://example.test'],'checkedAt':'2026-10-24T00:00:00Z','characters':[{'id':i,'name':{'ko':'가','en':'A','ja':'ア','zh':'甲'},'sourceUrl':'https://example.test/'+i,'sourceKind':'official'} for i in ids],'coverage':{'sourceCount':len(ids),'includedCount':len(ids)}}
 def test_unchanged_values_preserve_exact_file_and_checked_at(self):
  self.c.write_game('hi3',self.data());p=self.c.normal/'hi3.json';before=p.read_bytes()
  later=self.data();later['checkedAt']='2026-10-24T01:00:00Z';self.c.write_game('hi3',later)
  self.assertEqual(before,p.read_bytes());self.assertFalse(self.c.games['hi3']['changed'])
 def test_failure_preserves_previous_and_other_game_continues(self):
  self.c.write_game('hi3',self.data());p=self.c.normal/'hi3.json';before=p.read_bytes()
  def failure(_):raise RuntimeError('source failed')
  self.c.run_game('hi3',failure);self.c.run_game('endfield',lambda _:self.data('endfield'))
  self.assertEqual(before,p.read_bytes());self.assertEqual(self.c.games['hi3']['status'],'failed');self.assertTrue(self.c.games['hi3']['preservedPrevious']);self.assertEqual(self.c.games['endfield']['status'],'success')
 def test_source_omission_does_not_delete_previous_identity(self):
  self.c.write_game('hi3',self.data(ids=('a','b')));self.c.write_game('hi3',self.data(ids=('a',)))
  result=json.loads((self.c.normal/'hi3.json').read_text());self.assertEqual({r['id']for r in result['characters']},{'a','b'});self.assertEqual(result['coverage']['retainedPreviousIds'],['b'])
 def test_runtime_proxy_denial_is_distinct_from_origin_403(self):
  with patch('urllib.request.urlopen',side_effect=urllib.error.URLError('Tunnel connection failed: 403 Forbidden')):
   with self.assertRaises(urllib.error.URLError):self.c.fetch('proxy','https://example.test')
  self.assertEqual(self.c.outcomes[-1]['status'],'runtime-network-blocked');self.assertNotIn('httpStatus',self.c.outcomes[-1])
  with patch('urllib.request.urlopen',side_effect=urllib.error.HTTPError('https://example.test',403,'Forbidden',{},None)):
   with self.assertRaises(urllib.error.HTTPError):self.c.fetch('origin','https://example.test')
  self.assertEqual(self.c.outcomes[-1]['status'],'blocked');self.assertEqual(self.c.outcomes[-1]['httpStatus'],403)
 def test_bundled_script_normalization_files_match_manifest(self):
  for row in json.loads((collect.ROOT/'opencc-sources.json').read_text()):self.assertEqual(hashlib.sha256((collect.ROOT/row['file']).read_bytes()).hexdigest(),row['sha256'])

if __name__=='__main__':unittest.main()
