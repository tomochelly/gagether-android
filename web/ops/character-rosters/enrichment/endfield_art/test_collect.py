import hashlib,io,json,pathlib,unittest
from PIL import Image
import collect
ROOT=pathlib.Path(__file__).resolve().parent
class ExactOfficialArt(unittest.TestCase):
 def test_exact_current_declared_identity_maps(self):
  script=(ROOT/'sources/operator-data.js.txt').read_text();w=collect.declared_map(script,'W');f=collect.declared_map(script,'F');self.assertEqual(len(w),35);self.assertEqual(set(w),set(f));self.assertIn('endministrator1.ec409283.png',w['endministrator1']);self.assertIn('endministrator2.1ec20a16.png',w['endministrator2']);self.assertIn('prelica.d0bbdb53.png',f['perlica'])
 def test_changed_declared_map_fails_closed(self):
  script=(ROOT/'sources/operator-data.js.txt').read_text()
  with self.assertRaises(ValueError):collect.declared_map(script.replace('W={akekuri:', 'UNRELATED={akekuri:'),'W')
  with self.assertRaises(ValueError):collect.declared_map('W={one:"https://example.invalid/x.png"}','W')
 def test_all_native_bytes_and_source_bound_heads(self):
  result=json.loads((ROOT/'result.json').read_text());self.assertEqual(len(result['manifest']),36);self.assertEqual(len(result['focus']['entries']),36);heads={(f['url'],f['sha256']):f for f in result['focus']['entries']}
  for m in result['manifest']:
   b=pathlib.Path(m['originalPath']).read_bytes();self.assertEqual(hashlib.sha256(b).hexdigest(),m['sha256']);self.assertEqual(len(b),m['bytes']);facts=collect.inspect(b);self.assertEqual((facts['width'],facts['height']),(m['width'],m['height']));self.assertIn((m['url'],m['sha256']),heads);self.assertEqual(m['delivery'],'source-original');h=heads[(m['url'],m['sha256'])]['head'];self.assertTrue(0<=h['left']<h['right']<=100 and 0<=h['top']<h['bottom']<=100)
 def test_empty_and_other_format_images_rejected(self):
  p=io.BytesIO();Image.new('RGBA',(5,5),(0,0,0,0)).save(p,format='PNG')
  with self.assertRaises(ValueError):collect.inspect(p.getvalue())
  p=io.BytesIO();Image.new('RGB',(5,5),'white').save(p,format='JPEG')
  with self.assertRaises(ValueError):collect.inspect(p.getvalue())
if __name__=='__main__':unittest.main()
