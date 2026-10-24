import importlib.util,json,pathlib,tempfile,unittest
spec=importlib.util.spec_from_file_location('roster_enrichment',pathlib.Path(__file__).with_name('run.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class PreserveInput(unittest.TestCase):
 def test_rejects_source_identity_changes_and_keeps_input_on_supplement_failure(self):
  saved_root,saved_groups=module.ROOT,module.GROUPS
  try:
   with tempfile.TemporaryDirectory()as td:
    root=pathlib.Path(td);module.ROOT=root;module.GROUPS={'x':['fixture']}
    source=root/'fixture.json';source.write_text(json.dumps({'gameId':'fixture','characters':[{'id':'original'}]}))
    helper=root/'enrich_x.py';helper.write_text('import argparse,json,pathlib\np=argparse.ArgumentParser();p.add_argument("--input-dir");p.add_argument("--output-dir");p.add_argument("--cache-dir");a=p.parse_args();pathlib.Path(a.output_dir,"fixture.json").write_text(json.dumps({"gameId":"fixture","characters":[{"id":"different"}]}))\n')
    result,reports=module.enrich_files({'fixture':source},root/'work');self.assertEqual(result['fixture'],source);self.assertIn('identity',reports['x']['validationErrors'][0])
    helper.write_text('raise RuntimeError("unavailable supplement")\n')
    result,reports=module.enrich_files({'fixture':source},root/'work2');self.assertEqual(result['fixture'],source);self.assertEqual(reports['x']['status'],'partial');self.assertEqual(json.loads(source.read_text())['characters'][0]['id'],'original')
  finally:module.ROOT,module.GROUPS=saved_root,saved_groups
if __name__=='__main__':unittest.main()
