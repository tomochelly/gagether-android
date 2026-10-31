import hashlib, importlib.util, json, pathlib, tempfile, unittest
spec=importlib.util.spec_from_file_location('checker',pathlib.Path(__file__).with_name('check-source-mirror.py'));checker=importlib.util.module_from_spec(spec);spec.loader.exec_module(checker)
class SourceMirrorTest(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=pathlib.Path(self.temp.name)
  (self.root/'public').mkdir();(self.root/'ops').mkdir();(self.root/'lib').mkdir();(self.root/'lib/code.ts').write_text('verified code')
  entries=[{'path':p,'sha256':hashlib.sha256(b'data').hexdigest()} for p in sorted(checker.CANONICAL_ONLY)]
  entries.append({'path':'lib/code.ts','sha256':hashlib.sha256(b'verified code').hexdigest()})
  self.manifest={'version':1,'entries':entries,'fingerprint':hashlib.sha256(json.dumps(entries,separators=(',',':')).encode()).hexdigest()}
  self.receipt={'siteVersion':154,'runtimeFingerprint':self.manifest['fingerprint'],'canonicalOnly':sorted(checker.CANONICAL_ONLY)}
  self.save()
 def save(self):
  (self.root/'public/source-manifest.json').write_text(json.dumps(self.manifest));(self.root/'ops/source-mirror.json').write_text(json.dumps(self.receipt))
 def test_exact_code_with_explicit_canonical_data_scope(self):
  result=checker.verify(self.root,self.manifest);self.assertEqual(result['codeFilesVerified'],1);self.assertEqual(len(result['canonicalOnlyDataFiles']),len(checker.CANONICAL_ONLY))
 def test_changed_or_missing_code_fails(self):
  (self.root/'lib/code.ts').write_text('changed')
  with self.assertRaisesRegex(RuntimeError,'code.*differ'):checker.verify(self.root,self.manifest)
  (self.root/'lib/code.ts').unlink()
  with self.assertRaisesRegex(RuntimeError,'code.*differ'):checker.verify(self.root,self.manifest)
 def test_new_deployment_or_changed_canonical_data_hash_fails(self):
  live=json.loads(json.dumps(self.manifest));live['entries'][0]['sha256']='0'*64
  with self.assertRaisesRegex(RuntimeError,'Production changed'):checker.verify(self.root,live)
 def test_exception_scope_cannot_expand_to_code(self):
  self.receipt['canonicalOnly'].append('lib/code.ts');self.save()
  with self.assertRaisesRegex(RuntimeError,'data scope'):checker.verify(self.root,self.manifest)
 def test_tampered_pinned_manifest_fails(self):
  self.manifest['entries'][0]['sha256']='0'*64;self.save()
  with self.assertRaisesRegex(RuntimeError,'fingerprint'):checker.verify(self.root,self.manifest)
if __name__=='__main__':unittest.main()
