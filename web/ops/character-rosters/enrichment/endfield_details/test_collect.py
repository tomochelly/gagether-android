import copy,importlib.util,json,shutil,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('native_glyphs',ROOT/'collect.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
BASE=next(r for r in json.load(open(ROOT.parents[3]/'content/character-rosters/bootstrap.json'))if r['gameId']=='endfield')
PREFIX='https://raw.githubusercontent.com/555me/EndfieldAssets/966ed92d2556386a37e4ec076a812ff46ca2fae9/'
def stripped(doc):
 out=copy.deepcopy(doc)
 def walk(v):
  if isinstance(v,dict):
   if isinstance(v.get('icon'),str)and v['icon'].startswith(PREFIX):v.pop('icon')
   for x in v.values():walk(x)
  elif isinstance(v,list):
   for x in v:walk(x)
 walk(out)
 for row in out['characters']:
  row['detailSources']=[s for s in row.get('detailSources',[])if s['url']!='https://api.github.com/repos/555me/EndfieldAssets/git/trees/ac3b210146ace8835fd153ee7704f7bced42fcfb?recursive=1']
  if not row['detailSources']and'detailSources'not in next(x for x in BASE['characters']if x['id']==row['id']):row.pop('detailSources')
 return out
# Start each collector test from the current roster with only this registry's glyphs removed.
# Integration may already have applied those glyphs to the canonical snapshot.
BASE=stripped(BASE)
class NativeGlyphs(unittest.TestCase):
 def test_all_existing_facts_and_input_preserved(self):
  before=copy.deepcopy(BASE);doc,patches,report=c.enrich(BASE)
  self.assertEqual(BASE,before);self.assertEqual(stripped(doc),stripped(before));self.assertEqual([x['id']for x in doc['characters']],[x['id']for x in before['characters']]);self.assertEqual(report['glyphOriginals'],189);self.assertEqual(report['glyphBytes'],691942)
  self.assertEqual(report['counts']['characters'],34);self.assertEqual(report['counts']['skillIcons'],136);self.assertEqual(report['counts']['statIcons'],272);self.assertEqual(report['counts']['progressionStatIcons'],272);self.assertEqual(report['counts']['talentIcons'],127);self.assertEqual(report['counts']['baseSkillIcons'],128);self.assertEqual(report['counts']['attributeNodeIcons'],136);self.assertLess(report['rosterBytes'],4400000);self.assertNotIn('minghe',patches)
 def test_offline_idempotence_and_original_clocks(self):
  first,_,_=c.enrich(BASE);again,patches,report=c.enrich(first)
  self.assertEqual(again,first);self.assertEqual(first['checkedAt'],BASE['checkedAt']);self.assertEqual(patches,{});self.assertEqual(report['counts']['skillIcons'],0)
 def test_unknown_characters_and_foreign_skill_ids_never_borrow_icons(self):
  doc=copy.deepcopy(BASE);unknown=copy.deepcopy(doc['characters'][0]);unknown['id']='future-unknown';doc['characters'].append(unknown);known=doc['characters'][0];known['skillTables'][0]['id']='foreign-unbound';result,patches,_=c.enrich(doc)
  self.assertEqual(result['characters'][-1],unknown);self.assertNotIn('future-unknown',patches);self.assertNotIn('icon',result['characters'][0]['skillTables'][0])
 def test_preexisting_source_icons_are_authoritative(self):
  doc=copy.deepcopy(BASE);row=doc['characters'][0];row['stats'][0]['icon']='https://example.org/native-owner-icon.png';row['skillTables'][0]['icon']='https://example.org/source-glyph.png'
  result,_,_=c.enrich(doc);self.assertEqual(result['characters'][0]['stats'][0]['icon'],row['stats'][0]['icon']);self.assertEqual(result['characters'][0]['skillTables'][0]['icon'],row['skillTables'][0]['icon'])
 def test_changed_table_original_rejected(self):
  with tempfile.TemporaryDirectory()as tmp:
   dest=Path(tmp)/'registry';shutil.copytree(ROOT,dest,ignore=shutil.ignore_patterns('__pycache__'))
   p=dest/'sources/CharGrowthTable.json';p.write_bytes(p.read_bytes()+b' ')
   with self.assertRaisesRegex(ValueError,'table original hash'):c.load_registry(dest)
 def test_changed_glyph_original_rejected(self):
  with tempfile.TemporaryDirectory()as tmp:
   dest=Path(tmp)/'registry';shutil.copytree(ROOT,dest,ignore=shutil.ignore_patterns('__pycache__'))
   first=json.loads((dest/'originals-manifest.json').read_text())[0];p=dest/first['localFile'];p.write_bytes(p.read_bytes()+b' ')
   with self.assertRaisesRegex(ValueError,'glyph original hash'):c.load_registry(dest)
 def test_manifest_cannot_substitute_arbitrary_asset_url(self):
  with tempfile.TemporaryDirectory()as tmp:
   dest=Path(tmp)/'registry';shutil.copytree(ROOT,dest,ignore=shutil.ignore_patterns('__pycache__'))
   p=dest/'originals-manifest.json';rows=json.loads(p.read_text());rows[0]['url']='https://unrelated.example/borrowed.png';p.write_text(json.dumps(rows))
   with self.assertRaisesRegex(ValueError,'glyph identity'):c.load_registry(dest)
if __name__=='__main__':unittest.main()
