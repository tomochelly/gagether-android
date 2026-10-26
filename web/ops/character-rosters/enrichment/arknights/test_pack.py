import base64, copy, gzip, hashlib, importlib.util, json, pathlib, unittest
spec=importlib.util.spec_from_file_location('arknights_pack',pathlib.Path(__file__).with_name('pack.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class ExactPacking(unittest.TestCase):
    def fixture(self):
        row=dict(id='char_1_exact',sourceId='char_1_exact',name=dict(ko='원문',en='Native',ja='',zh=''),sourceUrl='https://example.org/exact/native',sourceKind='community',nameSources={'en':{'kind':'community','url':'https://example.org/name'}},image={'url':'https://example.org/full.png','sourceUrl':'https://example.org/illustration','kind':'splash','variantLabel':dict(ko='2정예화',en='Elite2',ja='',zh=''),'preview':{'url':'https://example.org/preview.png','sourceUrl':'https://example.org/preview-source'}},images=[{'url':'https://example.org/base.png','sourceUrl':'https://example.org/base','kind':'full-body'}],stats=[{'id':'hp','value':'100'}],regionalStats={'kr':[{'id':'hp','value':'100'}]},statProgression={'native':'checkpoint'},regionalStatProgression={'kr':{'native':'checkpoint'}},skillTables=[{'id':'original','description':'unaltered source'}],regionalSkillTables={'kr':[{'id':'original','description':'unaltered source'}]})
        return dict(gameId='arknights',sourceUrls=['https://example.org/native'],checkedAt='2026-10-25T00:00:00Z',characters=[row])
    def test_wire_preserves_full_native_provenance_images_and_tables_inside_exact_block(self):
        source=self.fixture();before=copy.deepcopy(source);full,wire=m.encode(source);self.assertEqual(source,before)
        form=wire['detailCatalog']['forms']['char_1_exact'];body=gzip.decompress(base64.b64decode(form['payload']));self.assertEqual(len(body),form['bytes']);self.assertEqual(hashlib.sha256(body).hexdigest(),form['sha256'])
        original=json.loads(body);self.assertEqual(original['id'],original['sourceId']);details=original['details'];self.assertEqual(details['sourceUrl'],source['characters'][0]['sourceUrl']);self.assertEqual(details['image'],source['characters'][0]['image']);self.assertEqual(details['images'],source['characters'][0]['images']);self.assertEqual(details['nameSources'],source['characters'][0]['nameSources'])
        for base,regional in [('stats','regionalStats'),('statProgression','regionalStatProgression'),('skillTables','regionalSkillTables')]:self.assertNotIn(base,details);self.assertEqual(details[regional]['kr'],source['characters'][0][base])
        self.assertNotIn('images',wire['characters'][0]);self.assertNotIn('regionalSkillTables',wire['characters'][0]);self.assertIn('preview',wire['characters'][0]['image']);self.assertNotIn('sourceUrl',wire['characters'][0]['image']['preview'])
    def test_wrong_game_or_changed_operator_source_cannot_be_encoded(self):
        source=self.fixture();source['gameId']='other'
        with self.assertRaisesRegex(ValueError,'Wrong'):m.encode(source)
        source=self.fixture();source['characters'][0]['sourceId']='another-outfit'
        with self.assertRaisesRegex(ValueError,'identity'):m.encode(source)

if __name__=='__main__':unittest.main()
