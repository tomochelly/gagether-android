import base64,copy,gzip,hashlib,importlib.util,json,pathlib,unittest
spec=importlib.util.spec_from_file_location('uma_pack',pathlib.Path(__file__).with_name('pack-uma-catalog.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ExactPacking(unittest.TestCase):
 def fixture(self):
  roster={'gameId':'umamusume','characters':[{'id':'100101','sourceId':'100101-outfit','name':{'ko':'Exact outfit'},'stats':[{'id':'speed','value':'80'}],'statProgression':{'rows':[]}}]}
  catalog={'version':1,'sourceUrl':'https://example.org/native','checkedAt':'2026-10-25T00:00:00Z','skills':{'jp':{'description':'JP current'},'global':{'description':'Global current'}},'forms':{'100101':{'sourceId':'100101-outfit','stats':[{'id':'speed','value':'80'}],'statProgression':{'rows':[]},'regionalSkillRefs':{'jp':['jp'],'global':['global']}}}}
  horses={'profiles':[{'outfitIds':['100101'],'background':{'id':'horse-exact','summary':'Real horse facts'}}]};return roster,catalog,horses
 def test_wire_moves_complete_facts_to_verified_exact_identity_blocks_without_region_or_horse_loss(self):
  r,c,h=self.fixture();before=copy.deepcopy((r,c,h));out,wire=m.encode(r,c,h);self.assertEqual((r,c,h),before);self.assertNotIn('stats',wire['characters'][0]);self.assertNotIn('statProgression',wire['characters'][0]);f=wire['detailCatalog']['forms']['100101'];b=gzip.decompress(base64.b64decode(f['payload']));self.assertEqual(len(b),f['bytes']);self.assertEqual(hashlib.sha256(b).hexdigest(),f['sha256']);decoded=json.loads(b);self.assertEqual(decoded['id'],'100101');self.assertEqual(decoded['sourceId'],'100101-outfit');self.assertEqual(decoded['details']['stats'],r['characters'][0]['stats']);self.assertEqual(decoded['details']['regionalSkillTables']['jp'][0]['description'],'JP current');self.assertEqual(decoded['details']['regionalSkillTables']['global'][0]['description'],'Global current');self.assertEqual(decoded['details']['historicalBackground']['id'],'horse-exact');self.assertEqual(out['characters'],r['characters'])
 def test_wrong_outfit_duplicate_mapping_incomplete_source_and_decoded_overflow_never_emit_partial_catalog(self):
  for change in [lambda r,c,h:c['forms']['100101'].update(sourceId='another-outfit'),lambda r,c,h:h['profiles'].append(h['profiles'][0]),lambda r,c,h:c['forms'].clear(),lambda r,c,h:c['skills']['jp'].update(description='x'*1000001)]:
   r,c,h=self.fixture();change(r,c,h)
   with self.assertRaises((ValueError,KeyError)):m.encode(r,c,h)
if __name__=='__main__':unittest.main()
