import io,tempfile,unittest
from unittest.mock import patch
from PIL import Image
import artwork

class ArtworkTests(unittest.TestCase):
 def test_only_declared_official_cdn_originals_are_accepted(self):
  self.assertEqual(artwork.asset_url('https://act-upload.hoyoverse.com/event-ugc-hoyowiki/test.png'),'https://act-upload.hoyoverse.com/event-ugc-hoyowiki/test.png')
  for url in ['http://act-webstatic.hoyoverse.com/test.png','https://evil.example/test.png','https://user@act-webstatic.hoyoverse.com/test.png','https://act-webstatic.hoyoverse.com/test.svg']:
   with self.assertRaises(ValueError):artwork.asset_url(url)
 def test_shared_official_asset_does_not_merge_character_identities(self):
  blob=io.BytesIO();Image.new('RGBA',(1024,1024),(255,255,255,255)).save(blob,format='PNG');b=blob.getvalue()
  class Response(io.BytesIO):status=200
  index=[dict(name='Exact male',entry_page_id='1'),dict(name='Exact female',entry_page_id='2')]
  def source(key,url,*args,**kwargs):
   i=url.rsplit('=',1)[1];return {'page':dict(id=i,name=index[int(i)-1]['name'],menu_id='2',beta=False,status='Online',header_img_url='https://act-webstatic.hoyoverse.com/shared.png')},{'url':url}
  doc=dict(gameId='genshin',characters=[dict(id='10000117',name={'ko':'Exact male'}),dict(id='10000118',name={'ko':'Exact female'})])
  with tempfile.TemporaryDirectory()as tmp,patch.object(artwork,'list_rows',return_value=(index,[])),patch.object(artwork,'source',side_effect=source),patch.object(artwork.urllib.request,'urlopen',side_effect=lambda *a,**k:Response(b)):
   report=artwork.collect(doc,tmp,tmp)
  self.assertEqual(report['references'],2);self.assertEqual(report['originals'],1);self.assertEqual(len({r['characterId']for r in report['records']}),2)
  self.assertEqual({r['officialEntryId']for r in report['records']},{'1','2'})
  out=artwork.apply(doc,report);self.assertTrue(all(c['image']['kind']=='card'for c in out['characters']))
  self.assertTrue(all('Shared'in c['image']['caption']['en']for c in out['characters']))

if __name__=='__main__':unittest.main()
