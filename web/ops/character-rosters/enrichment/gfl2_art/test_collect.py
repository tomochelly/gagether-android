import copy,importlib.util,io,unittest,tempfile
from unittest.mock import patch
from pathlib import Path
from PIL import Image
spec=importlib.util.spec_from_file_location('gfl2_art',Path(__file__).with_name('collect.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
URL='https://res.17996cdn.net/gf2/tw/images/home/ilus-GROZA_758a2123fb.webp?v03'
def char(id='Groza',ko='그로자',en='Groza'):
 return dict(id=id,name=dict(ko=ko,en=en),sourceUrl='https://gfl2.help/en/characters/'+id,regions=['kr','cn'],stats=[dict(id='health',value='100')],artworkFrames=[dict(url='https://example.org/old.png',detail={'x':40})],image=dict(url='https://gfl2.help/static/images/chara/full/'+id+'.png',sourceUrl='https://gfl2.help/en/characters/'+id,kind='portrait'))
def record(c):return dict(characterId=c['id'],sourceId=c.get('sourceId'),canonicalSourceUrl=c['sourceUrl'],officialKoreanName=c['name']['ko'],url=URL,sourceUrl=m.DETAIL_KO+'?role=3',status='ok',width=1955,height=2552)
class ExactOfficialArt(unittest.TestCase):
 def test_role_join_does_not_use_page_position_or_duplicate_css_index(self):
  doc=dict(gameId='gfl2',characters=[char()]);out,fail=m.resolve(doc,{'3':'그로자','4':'네메시스'},{'4':'Nemesis','3':'GROZA'},{'그로자':URL});self.assertFalse(fail);self.assertEqual(out[0]['officialRoleId'],'3');self.assertEqual(out[0]['sourceUrl'],m.DETAIL_KO+'?role=3')
 def test_known_source_spelling_alias_is_exact_not_fuzzy(self):
  doc=dict(gameId='gfl2',characters=[char('Balthilde','바틸다','Balthilde')]);out,fail=m.resolve(doc,{'44':'바틸다'},{'44':'Bathilde'},{'바틸다':URL});self.assertEqual(len(out),1);self.assertFalse(fail)
  doc['characters'][0]['name']['en']='Balthilda';out,fail=m.resolve(doc,{'44':'바틸다'},{'44':'Bathilde'},{'바틸다':URL});self.assertFalse(out);self.assertEqual(len(fail),1)
 def test_other_character_or_form_is_not_substituted(self):
  c=char();c['name']['ko']='네메시스';out,fail=m.resolve(dict(gameId='gfl2',characters=[c]),{'3':'그로자'},{'3':'Groza'},{'그로자':URL});self.assertFalse(out);self.assertTrue(fail)
  c=char();c['sourceUrl']='https://gfl2.help/en/characters/Nemesis';out,fail=m.resolve(dict(gameId='gfl2',characters=[c]),{'3':'그로자'},{'3':'Groza'},{'그로자':URL});self.assertFalse(out);self.assertTrue(fail)
 def test_only_declared_official_complete_image_is_accepted(self):
  s='<div class="role-name-des role-name-des-3"><div class="role-name">그로자</div><div class="header-div full-img" data-src="'+URL+'"></div><div class="des-right">';self.assertEqual(m.parse_complete_originals(s,1),{'그로자':URL})
  for bad in [s.replace('full-img','role-img'),s.replace('res.17996cdn.net','example.com'),s+s]:
   with self.assertRaises(ValueError):m.parse_complete_originals(bad,1)
 def test_complete_original_preserves_owner_frames_stats_and_portrait(self):
  c=char();doc=dict(gameId='gfl2',characters=[c]);out=m.apply_records(doc,[record(c)])['characters'][0]
  self.assertEqual(c['image']['kind'],'portrait');self.assertEqual(out['image']['kind'],'full-body');self.assertEqual(out['image']['sourceKind'],'official');self.assertEqual(out['images'],[c['image']])
  for k in ('name','regions','stats','artworkFrames','sourceUrl'):self.assertEqual(out[k],c[k])
 def test_failed_images_and_corrupt_identity_keep_last_good(self):
  c=char();doc=dict(gameId='gfl2',characters=[c]);self.assertEqual(m.apply_records(doc,[dict(characterId='Groza',status='failed')]),doc)
  r=record(c);r['canonicalSourceUrl']='https://gfl2.help/en/characters/Nemesis'
  with self.assertRaises(ValueError):m.apply_records(doc,[r])
  with self.assertRaises(ValueError):m.apply_records(doc,[record(c),record(c)])
 def test_new_original_download_and_cached_replay_use_same_exact_bytes(self):
  im=Image.new('RGBA',(955,955));im.paste((255,255,255,255),(100,10,700,940));stream=io.BytesIO();im.save(stream,format='PNG');b=stream.getvalue();c=char();item=record(c);item.pop('status');receipt=dict(url=URL,httpStatus=200,bytes=len(b),sha256=m.sha(b),checkedAt='2026-10-25T00:00:00Z')
  with tempfile.TemporaryDirectory()as directory:
   with patch.object(m,'fetch',return_value=(b,receipt))as fetch:
    records,failures=m.collect([item],directory)
    self.assertFalse(failures);self.assertEqual(len(records),1);self.assertEqual((Path(directory)/records[0]['file']).read_bytes(),b);fetch.assert_called_once_with(URL)
   with patch.object(m,'fetch',side_effect=AssertionError('must use hash-validated cache')):
    again,failures=m.collect([item],directory);self.assertFalse(failures);self.assertEqual(again,records)
 def test_native_bytes_bounds_and_thumbnail_rejection(self):
  im=Image.new('RGBA',(955,955));im.paste((255,255,255,255),(200,10,700,940));b=io.BytesIO();im.save(b,format='PNG');before=b.getvalue();v=m.inspect(before);self.assertEqual(v['alphaBounds'],dict(left=200,top=10,right=700,bottom=940,threshold=16));self.assertEqual(before,b.getvalue())
  b=io.BytesIO();Image.new('RGBA',(376,512),(255,255,255,255)).save(b,format='PNG')
  with self.assertRaises(ValueError):m.inspect(b.getvalue())
if __name__=='__main__':unittest.main()
