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
 def test_zzz_partial_keeps_verified_progress_but_failed_or_wrong_identity_never_promotes(self):
  saved_root,saved_groups=module.ROOT,module.GROUPS
  try:
   with tempfile.TemporaryDirectory()as td:
    root=pathlib.Path(td);module.ROOT=root;module.GROUPS={'c':['zzz']};(root/'zzz').mkdir()
    source=root/'zzz.json';source.write_text(json.dumps({'gameId':'zzz','characters':[{'id':'1011','stats':[]}]}))
    (root/'enrich_c.py').write_text('import argparse,pathlib,shutil\np=argparse.ArgumentParser();p.add_argument("--input-dir");p.add_argument("--output-dir");p.add_argument("--cache-dir");a=p.parse_args();shutil.copyfile(pathlib.Path(a.input_dir,"zzz.json"),pathlib.Path(a.output_dir,"zzz.json"))\n')
    for status,identity,expected in [('partial','1011',True),('failed','1011',False),('ok','other-form',False)]:
     helper='import argparse,json,pathlib\np=argparse.ArgumentParser();p.add_argument("--input");p.add_argument("--output-dir");p.add_argument("--cache-dir");a=p.parse_args();d=json.loads(pathlib.Path(a.input).read_text());d["characters"][0]["id"]='+repr(identity)+';d["verifiedSupplement"]=True;pathlib.Path(a.output_dir,"zzz.json").write_text(json.dumps(d));pathlib.Path(a.output_dir,"manifest.json").write_text(json.dumps({"status":'+repr(status)+'}));raise SystemExit('+('0'if status=='ok'else'1')+')\n'
     (root/'zzz/enrich.py').write_text(helper)
     result,reports=module.enrich_files({'zzz':source},root/('work-'+status));saved=json.loads(result['zzz'].read_text())
     self.assertEqual(saved.get('verifiedSupplement',False),expected);self.assertEqual(saved['characters'][0]['id'],'1011');self.assertEqual(reports['c']['status'],'partial')
  finally:module.ROOT,module.GROUPS=saved_root,saved_groups
 def test_hsr_scoped_detail_helper_promotes_only_checked_same_form_facts(self):
  saved_root,saved_groups=module.ROOT,module.GROUPS
  try:
   with tempfile.TemporaryDirectory()as td:
    root=pathlib.Path(td);module.ROOT=root;module.GROUPS={'c':['hsr']};(root/'hsr').mkdir()
    source=root/'hsr.json';source.write_text(json.dumps({'gameId':'hsr','characters':[{'id':'1001','stats':[]}]}))
    (root/'enrich_c.py').write_text('import argparse,pathlib,shutil\np=argparse.ArgumentParser();p.add_argument("--input-dir");p.add_argument("--output-dir");p.add_argument("--cache-dir");a=p.parse_args();shutil.copyfile(pathlib.Path(a.input_dir,"hsr.json"),pathlib.Path(a.output_dir,"hsr.json"))\n')
    for status,identity,expected in [('ok','1001',True),('failed','1001',False),('ok','other-form',False)]:
     helper='import argparse,json,pathlib\np=argparse.ArgumentParser();[p.add_argument(x)for x in ["--input","--output","--source-dir","--manifest"]];p.add_argument("--refresh",action="store_true");a=p.parse_args();d=json.loads(pathlib.Path(a.input).read_text());d["characters"][0]["id"]='+repr(identity)+';d["verifiedSupplement"]=True;pathlib.Path(a.output).write_text(json.dumps(d));pathlib.Path(a.manifest).write_text(json.dumps({"status":'+repr(status)+'}));raise SystemExit('+('0'if status=='ok'else'1')+')\n'
     (root/'hsr/enrich.py').write_text(helper)
     result,reports=module.enrich_files({'hsr':source},root/('work-'+status+identity));saved=json.loads(result['hsr'].read_text())
     self.assertEqual(saved.get('verifiedSupplement',False),expected);self.assertEqual(saved['characters'][0]['id'],'1001');self.assertEqual(reports['c']['status'],'completed'if expected else'partial')
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
