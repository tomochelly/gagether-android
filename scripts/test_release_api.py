import ast,json,pathlib,unittest
class ReleaseDraftTests(unittest.TestCase):
 def find(self,rows):
  module=ast.parse(pathlib.Path('scripts/publish-release.py').read_text());node=next(x for x in module.body if isinstance(x,ast.FunctionDef) and x.name=='find_release');ns={'json':json,'repo':'owner/repo','version':'1.0.2','tag':'v1.0.2','gh':lambda *args:json.dumps([rows])};exec(compile(ast.Module(body=[node],type_ignores=[]),'<release-api>','exec'),ns);return ns['find_release']()
 def test_exact_tag_wins(self):
  row={'id':1,'tag_name':'v1.0.2','draft':False};self.assertEqual(self.find([row]),row)
 def test_untagged_empty_draft_is_reused(self):
  row={'id':2,'tag_name':'untagged-123','draft':True,'name':'GAGETHER 1.0.2 — Android','assets':[]};self.assertEqual(self.find([row]),row)
 def test_other_version_or_populated_draft_is_not_reused(self):
  self.assertIsNone(self.find([{'tag_name':'untagged-1','draft':True,'name':'GAGETHER 1.0.1 — Android','assets':[]}]))
  self.assertIsNone(self.find([{'tag_name':'untagged-2','draft':True,'name':'GAGETHER 1.0.2 — Android','assets':[{'name':'unrelated.apk'}]}]))
 def test_ambiguous_drafts_fail_closed(self):
  row={'tag_name':'untagged-1','draft':True,'name':'GAGETHER 1.0.2 — Android','assets':[]}
  with self.assertRaises(SystemExit):self.find([row,row])
if __name__=='__main__':unittest.main()
