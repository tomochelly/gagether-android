import importlib.util,io,unittest
from PIL import Image
from pathlib import Path
spec=importlib.util.spec_from_file_location('uma_art',Path(__file__).with_name('collect.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
DECL='"/characters/render/trainee/idle/" width:768,height:1024'
def character(id,kind='portrait'):
 return dict(id=id,name={'ko':'정확한 의상'},sourceId=id+'-same',regions=['jp','kr'],stats=[dict(id='speed',value='88')],artworkFrames=[dict(url='https://example.org/old.png',gallery={'x':40})],image=dict(url='https://example.org/old.png',sourceUrl='https://example.org',kind=kind))
def record(id):return dict(characterId=id,status='ok',url=m.PREFIX+id+'.png',sourceUrl=m.DECLARATION,width=768,height=1024)
class SourceArt(unittest.TestCase):
 def test_source_declared_path_only(self):
  self.assertEqual(m.declared_render_url('100102',DECL),m.PREFIX+'100102.png')
  for v in ['1001','../100102','100102_2','https://elsewhere']:
   with self.assertRaises(ValueError):m.declared_render_url(v,DECL)
  with self.assertRaises(ValueError):m.declared_render_url('100102','missing old expression')
 def test_preserves_official_complete_original_and_other_outfits(self):
  full=character('100101','full-body');other=character('100103');doc={'characters':[full,character('100102'),other]};out=m.apply_records(doc,[record('100101'),record('100102')]);self.assertEqual(out['characters'][0],full);self.assertEqual(out['characters'][2],other);self.assertEqual(doc['characters'][1]['image']['kind'],'portrait')
 def test_exact_outfit_original_and_owner_data_are_retained(self):
  c=character('100102');out=m.apply_records({'characters':[c]},[record('100102')])['characters'][0]
  self.assertEqual(out['image']['url'],m.PREFIX+'100102.png');self.assertEqual(out['image']['sourceKind'],'community');self.assertEqual(out['images'],[c['image']]);self.assertEqual(out['name'],c['name']);self.assertEqual(out['regions'],c['regions']);self.assertEqual(out['stats'],c['stats']);self.assertEqual(out['artworkFrames'],c['artworkFrames'])
 def test_wrong_outfit_and_duplicate_mapping_are_rejected(self):
  r=record('100102');r['url']=m.PREFIX+'100103.png'
  with self.assertRaises(ValueError):m.apply_records({'characters':[character('100102')]},[r])
  with self.assertRaises(ValueError):m.apply_records({'characters':[character('100102')]},[record('100102'),record('100102')])
 def test_native_dimensions_and_alpha_are_checked_without_transforming(self):
  im=Image.new('RGBA',(768,1024));im.paste((255,255,255,255),(200,40,500,1000));b=io.BytesIO();im.save(b,format='PNG');v=m.inspect(b.getvalue());self.assertEqual(v['width'],768);self.assertEqual(v['alphaBounds'],dict(left=200,top=40,right=500,bottom=1000,threshold=16))
  b=io.BytesIO();Image.new('RGBA',(192,256)).save(b,format='PNG')
  with self.assertRaises(ValueError):m.inspect(b.getvalue())
 def test_failed_asset_does_not_erase_last_good(self):
  c=character('100102');self.assertEqual(m.apply_records({'characters':[c]},[dict(characterId='100102',status='failed')]),{'characters':[c]})
if __name__=='__main__':unittest.main()
