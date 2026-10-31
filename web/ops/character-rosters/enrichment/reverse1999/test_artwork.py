import json,tempfile,unittest
from pathlib import Path
from artwork import plans
from enrich import C

class DeclaredOriginalTests(unittest.TestCase):
 def fixture(self,root):
  (root/'cn').mkdir()
  (root/'asset-commit.json').write_text(json.dumps({'sha':'a'*40}))
  for folder,paths in [('headicon_img',['12301.png','12302.png']),('fight',['skill/1230111.png']),('characterget',['charactercareer_big_0101.png'])]:
   (root/('asset-'+folder+'-tree.json')).write_text(json.dumps({'tree':[{'path':p,'type':'blob','sha':'b'*40}for p in paths],'truncated':False}))
  (root/'ArcanistMap.json').write_text(json.dumps([{'id':123,'live2d':[{'id':12302,'des':'进阶皮肤'},{'id':12303,'des':'Other costume'}]}]))
  (root/'cn/character.json').write_text(json.dumps([{'id':123,'name':'Test','nameEng':'Test','heroType':7,'isOnline':'1','skill':'1#11','exSkill':0,'skinId':12301,'career':101}]))
  return {'gameId':'reverse1999','characters':[{'id':'stable','name':C(en='Test'),'regions':['cn']}]}
 def test_exact_skin_and_asset_inventory_only_no_guessed_costume(self):
  with tempfile.TemporaryDirectory()as d:
   root=Path(d);doc=self.fixture(root);rows,index=plans(doc,root)
   self.assertEqual([r['skinId']for r in rows],[12301,12302])
   self.assertTrue(all('/'+'a'*40+'/'in r['url']for r in rows))
   self.assertEqual(index['skillIcons']['1230111'].rsplit('/',1)[1],'1230111.png')
   self.assertIn('0101.png',index['traitIcons']['stable']['afflatus'])
   self.assertFalse(index['missing'])
 def test_absent_declared_png_is_reported_without_filename_fallback(self):
  with tempfile.TemporaryDirectory()as d:
   root=Path(d);doc=self.fixture(root)
   (root/'asset-headicon_img-tree.json').write_text(json.dumps({'tree':[]}))
   rows,index=plans(doc,root);self.assertEqual(rows,[]);self.assertEqual(len(index['missing']),2)

if __name__=='__main__':unittest.main()
