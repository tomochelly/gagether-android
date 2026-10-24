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
 def test_bluearchive_detail_failure_or_wrong_identity_retains_valid_base_output(self):
  saved_root,saved_groups=module.ROOT,module.GROUPS
  try:
   with tempfile.TemporaryDirectory()as td:
    root=pathlib.Path(td);module.ROOT=root;module.GROUPS={'e':['bluearchive']}
    source=root/'bluearchive.json';source.write_text(json.dumps({'gameId':'bluearchive','characters':[{'id':'10000','stats':[]}]}))
    (root/'enrich_e.py').write_text('import argparse,pathlib,shutil\np=argparse.ArgumentParser();p.add_argument("--input-dir");p.add_argument("--output-dir");p.add_argument("--cache-dir");a=p.parse_args();shutil.copyfile(pathlib.Path(a.input_dir,"bluearchive.json"),pathlib.Path(a.output_dir,"bluearchive.json"))\n')
    helper=root/'enrich_bluearchive_details.py'
    helper.write_text('import argparse,json,pathlib\np=argparse.ArgumentParser();p.add_argument("--input");p.add_argument("--output-dir");p.add_argument("--cache-dir");a=p.parse_args();pathlib.Path(a.output_dir,"bluearchive.json").write_text(json.dumps({"gameId":"bluearchive","characters":[{"id":"other-outfit"}]}))\n')
    result,reports=module.enrich_files({'bluearchive':source},root/'work')
    self.assertEqual(reports['e']['status'],'partial');self.assertIn('identity',reports['e']['bluearchiveError'])
    self.assertEqual(json.loads(result['bluearchive'].read_text())['characters'][0]['id'],'10000')
    helper.write_text('raise RuntimeError("source unavailable")\n')
    result,reports=module.enrich_files({'bluearchive':source},root/'work2')
    self.assertEqual(reports['e']['status'],'partial');self.assertEqual(json.loads(result['bluearchive'].read_text())['characters'][0]['id'],'10000')
  finally:module.ROOT,module.GROUPS=saved_root,saved_groups
if __name__=='__main__':unittest.main()
