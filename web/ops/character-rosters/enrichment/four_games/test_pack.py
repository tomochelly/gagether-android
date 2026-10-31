import base64,copy,gzip,hashlib,importlib.util,json,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('four_pack',Path(__file__).with_name('pack.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class PackTest(unittest.TestCase):
 def fixture(self):
  return {'gameId':'genshin','sourceUrls':['https://example.org/native'],'checkedAt':'2026-10-26T00:00:00Z','characters':[{'id':'traveler','sourceId':'native-male','name':{'ko':'여행자','en':'Traveler','ja':'旅人','zh':'旅行者'},'stats':[{'id':'hp','value':'100'}],'regions':['global'],'image':{'url':'https://example.org/original.png','width':2048,'height':1024},'variantDetails':{'anemo':{'sourceId':'702','label':{'ko':'바람','en':'Anemo','ja':'風','zh':'风'},'skillTables':[{'id':'skill-native','description':{'ko':'실제 원문','en':'Exact source text'}}]}}}]}
 def test_exact_variant_and_source_survive_lossless_one_form_packing(self):
  source=self.fixture();before=copy.deepcopy(source);out,report=m.encode(source);self.assertEqual(source,before);c=out['characters'][0];f=out['detailCatalog']['forms']['traveler'];raw=gzip.decompress(base64.b64decode(f['payload']));self.assertEqual(hashlib.sha256(raw).hexdigest(),f['sha256']);self.assertEqual(len(raw),f['bytes']);original=json.loads(raw);self.assertEqual(original['id'],c['id']);self.assertEqual(original['sourceId'],'native-male');self.assertEqual(original['details']['variantDetails'],before['characters'][0]['variantDetails']);self.assertNotIn('variantDetails',c);self.assertEqual(c['image'],before['characters'][0]['image']);self.assertEqual(c['regions'],['global']);self.assertEqual(report['characters'],1)
 def test_wrong_game_duplicate_or_oversize_is_rejected(self):
  s=self.fixture();s['gameId']='other'
  with self.assertRaisesRegex(ValueError,'Wrong'):m.encode(s)
  s=self.fixture();s['characters']*=2
  with self.assertRaisesRegex(ValueError,'Duplicate'):m.encode(s)
  s=self.fixture();s['characters'][0]['sections']=['x'*1_000_001]
  with self.assertRaisesRegex(ValueError,'decoded bound'):m.encode(s)
if __name__=='__main__':unittest.main()
