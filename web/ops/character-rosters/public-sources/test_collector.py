import argparse,io,json,tempfile,unittest,urllib.error
from pathlib import Path
from unittest.mock import patch
import collect_rosters as c
from asset_policy import classify_image

def character(i='1',name='Same'):
 return {'id':i,'name':c.names(en=name),'sourceUrl':'https://example.test/source','sourceKind':'community'}
def document(game='genshin',count=1):
 return {'gameId':game,'sourceName':'test','sourceUrls':['https://example.test/source'],'checkedAt':'2026-01-01T00:00:00Z','characters':[character(str(i))for i in range(count)],'coverage':{'sourceCount':count,'includedCount':count}}
class ReliabilityTests(unittest.TestCase):
 def test_truncated_tree_rejected(self):
  with self.assertRaises(c.SourceError):c.decode_source(c.Source('art','https://example.test','tree'),b'{"truncated":true,"tree":[{"path":"valid"}]}')
 def test_200_javascript_shell_not_success(self):
  with self.assertRaises(c.SourceError):c.decode_source(c.Source('roster','https://example.test','py:characters'),b'<html><script src="app.js"></script></html>')
 def test_duplicate_source_ids_rejected(self):
  d=document(count=2);d['characters'][1]['id']='0'
  with self.assertRaises(c.SourceError):c.validate_normalized(d)
 def test_no_image_cross_form_or_name(self):
  prior=document();prior['characters'][0]['image']={'url':'https://example.test/art.png','kind':'portrait','sourceUrl':'https://example.test'}
  new=document();new['characters'][0]['name']=c.names(en='Different form');self.assertEqual(c.preserve_images(new,prior),0)
  new=document();self.assertEqual(c.preserve_images(new,prior),1);self.assertEqual(new['characters'][0]['image']['url'],'https://example.test/art.png')
 def test_unknown_asset_never_inherits_neutral(self):
  im=classify_image({'url':'https://unknown.test/art.jpg','kind':'card','locale':'neutral'});self.assertNotIn('locale',im)
 def test_exact_language_exception_wins(self):
  im=classify_image({'url':'https://raw.githubusercontent.com/Aceship/Arknight-Images/main/characters/char_285_medic2_1.png','kind':'full-body'});self.assertEqual(im['locale'],'en')
 def test_blocked_source_preserves_valid_cache(self):
  with tempfile.TemporaryDirectory()as td:
   p=Path(td)/'sources'/'genshin';p.mkdir(parents=True);(p/'en.body').write_bytes(b'{"lastGood":true}')
   error=urllib.error.HTTPError('https://example.test',403,'Forbidden',{},None)
   with patch('urllib.request.urlopen',side_effect=error):
    with self.assertRaises(c.SourceError):c.Fetcher(Path(td),retries=0).fetch('genshin',c.Source('en','https://example.test'))
   self.assertEqual((p/'en.body').read_bytes(),b'{"lastGood":true}')
 def test_bad_200_never_replaces_valid_cache(self):
  with tempfile.TemporaryDirectory()as td:
   p=Path(td)/'sources'/'genshin';p.mkdir(parents=True);(p/'en.body').write_bytes(b'{"lastGood":true}')
   class Response:
    status=200;headers={}
    def read(self,n):return b'<!doctype html>temporary error'
   with patch('urllib.request.urlopen',return_value=Response()):
    with self.assertRaises(c.SourceError):c.Fetcher(Path(td),retries=0).fetch('genshin',c.Source('en','https://example.test'))
   self.assertEqual((p/'en.body').read_bytes(),b'{"lastGood":true}')
 def test_game_failure_not_ingest_eligible(self):
  with tempfile.TemporaryDirectory()as td:
   p=Path(td);b=p/'bootstrap';b.mkdir();c.atomic_json(b/'genshin.json',document(count=10));args=argparse.Namespace(workdir=p/'work',bootstrap=b,timeout=1,retries=0)
   with patch.object(c.Fetcher,'fetch',side_effect=c.SourceError('HTTP403 blocked')):r=c.collect_one('genshin',args)
   self.assertFalse(r['eligibleForIngest']);self.assertEqual(r['status'],'failed');self.assertEqual(len(c.read_json(Path(r['path']))['characters']),10)
 def test_partial_count_cannot_replace_bootstrap(self):
  with tempfile.TemporaryDirectory()as td:
   p=Path(td);b=p/'bootstrap';b.mkdir();c.atomic_json(b/'genshin.json',document(count=10));args=argparse.Namespace(workdir=p/'work',bootstrap=b,timeout=1,retries=0)
   with patch.object(c.Fetcher,'fetch',return_value=({},{})),patch.object(c,'normalize',return_value=document(count=1)):r=c.collect_one('genshin',args)
   self.assertFalse(r['eligibleForIngest']);self.assertIn('shrank',r['error']);self.assertEqual(len(c.read_json(Path(r['path']))['characters']),10)
 def test_unchanged_output_preserves_checked_at(self):
  with tempfile.TemporaryDirectory()as td:
   p=Path(td);old=document();c.atomic_json(p/'normalized/genshin.json',old);args=argparse.Namespace(workdir=p,bootstrap=p/'missing',timeout=1,retries=0);fresh={**old,'checkedAt':'2099-01-01T00:00:00Z'}
   with patch.object(c.Fetcher,'fetch',return_value=({},{})),patch.object(c,'normalize',return_value=fresh):r=c.collect_one('genshin',args)
   self.assertEqual(r['status'],'unchanged');self.assertFalse(r['changed']);self.assertEqual(c.read_json(Path(r['path']))['checkedAt'],old['checkedAt'])
if __name__=='__main__':unittest.main()
