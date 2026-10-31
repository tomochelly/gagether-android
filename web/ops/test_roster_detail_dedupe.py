import base64,copy,gzip,hashlib,importlib.util,json,pathlib,unittest
spec=importlib.util.spec_from_file_location('dedupe',pathlib.Path(__file__).with_name('dedupe-roster-details.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Dedupe(unittest.TestCase):
 def fixture(self):
  details={'stats':[{'id':'speed','value':'80'}],'statDetailLabel':{'ko':'원문'}};raw=json.dumps(dict(id='exact',sourceId='native',details=details)).encode();block=dict(sourceId='native',sha256=hashlib.sha256(raw).hexdigest(),bytes=len(raw),payload=base64.b64encode(gzip.compress(raw)).decode());return [dict(gameId='umamusume',detailCatalog=dict(version=3,forms={'exact':block}),characters=[dict(id='exact',sourceId='native',name={'ko':'이름'},**copy.deepcopy(details))])]
 def test_only_proven_duplicates_move_into_complete_blocks_with_original_ids_and_bytes_unchanged(self):
  original=self.fixture();before=copy.deepcopy(original);out,r=m.dedupe(original);self.assertEqual(original,before);self.assertEqual(r['removedExactDuplicateFields'],2);self.assertNotIn('stats',out[0]['characters'][0]);self.assertEqual(out[0]['detailCatalog'],original[0]['detailCatalog']);self.assertEqual(m.dedupe(out)[1]['removedExactDuplicateFields'],0)
 def test_different_fields_are_retained_and_corrupted_or_wrong_identity_blocks_cannot_change_source(self):
  original=self.fixture();original[0]['characters'][0]['stats'][0]['value']='90';out,_=m.dedupe(original);self.assertEqual(out[0]['characters'][0]['stats'][0]['value'],'90')
  for field,value in [('sha256','0'*64),('sourceId','other'),('bytes',1)]:
   source=self.fixture();source[0]['detailCatalog']['forms']['exact'][field]=value
   with self.assertRaises(ValueError):m.dedupe(source)
if __name__=='__main__':unittest.main()
