import copy,unittest
from apply import apply
class ArtChanges(unittest.TestCase):
 def test_exact_art_only_and_input_immutable(self):
  rows=[{'gameId':'hsr','characters':[{'id':'1001','image':{'url':'old','kind':'splash'},'stats':[{'value':'123.456'}],'artworkFrames':{'old':{'gallery':{'zoom':1.4}}}}]},{'gameId':'other','characters':[{'id':'x'}]}];before=copy.deepcopy(rows)
  r={'hsr':{'entries':[{'id':'1001','url':'new','width':2048,'height':2048}]}};out=apply(rows,r)
  self.assertEqual(rows,before);self.assertEqual(out[1],before[1]);self.assertEqual(out[0]['characters'][0]['stats'],before[0]['characters'][0]['stats']);self.assertEqual(out[0]['characters'][0]['artworkFrames'],before[0]['characters'][0]['artworkFrames']);self.assertEqual(out[0]['characters'][0]['image']['url'],'new');self.assertEqual(apply(out,r),out)
 def test_identity_mismatch_stops_write(self):
  with self.assertRaises(ValueError):apply([{'gameId':'hsr','characters':[{'id':'1001'}]}],{'hsr':{'entries':[]}})
if __name__=='__main__':unittest.main()
