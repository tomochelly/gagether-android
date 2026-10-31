import unittest
from types import SimpleNamespace
from enrich import C,clean,description_parameters,native_tables,norm,unique_character

class ReverseNativeDetailsTests(unittest.TestCase):
 def test_native_species_is_not_a_playability_flag(self):
  character={'id':'30','name':C('애플','APPLe','APPLe','APPLe')}
  valid={'id':3028,'name':'APPLe','nameEng':'APPLe','heroType':5,'isOnline':'1','skinId':302801,'skill':'1#1','exSkill':0}
  npc={**valid,'id':3999,'heroType':0}
  self.assertEqual(unique_character(character,[valid,npc],{})['id'],3028)
  with self.assertRaisesRegex(ValueError,'Ambiguous'):unique_character(character,[valid,{**valid,'id':4000}],{})
  self.assertIsNone(unique_character(character,[{**valid,'isOnline':'0'}],{}))

 def test_unicode_identity_never_collapses_cyrillic_to_empty(self):
  self.assertNotEqual(norm('Зима'),norm('???'))
  self.assertEqual(norm('Glyndŵr'),norm('Glyndŵr'))

 def test_chunked_native_descriptions_roundtrip_without_summary_or_rank_mix(self):
  values={'ko':['단계1 '+('가나다🧩'*180),'단계2 '+('마바사'*350)],'en':['first '+('ABC'*240),'second '+('DEF'*420)]}
  template,params=description_parameters(values)
  for locale,rows in values.items():
   self.assertTrue(all(len(cell)<=150 for cells in params[locale]for cell in cells))
   for rank,original in enumerate(rows):
    import re
    result=re.sub(r'\{(\d+)\}',lambda m:params[locale][int(m[1])-1][rank],template[locale])
    self.assertEqual(result,original)

 def test_choice_skill_placeholder_survives_markup_cleanup(self):
  self.assertEqual(clean('▩2%s<1>: <nobr>1-target</nobr>\n<id:5>'),'▩21%s: 1-target')

 def test_source_has_no_ultimate_is_preserved_without_guessing(self):
  native=SimpleNamespace(cn=True,base='https://example.test/',rank_replaces=[],passives=[],portrays=[],choices={},devices={})
  native.text=lambda v:C(zh=v)
  rows={11:{'id':11,'name':'咒语甲','icon':11,'skillRank':1},12:{'id':12,'name':'咒语甲','icon':11,'skillRank':2},21:{'id':21,'name':'咒语乙','icon':21,'skillRank':1}}
  native.skills=rows;native.skill=lambda ident,hero,shared=False:rows[ident];native.effect=lambda row:C(zh='原文效果'+str(row['id']))
  result=native_tables(native,{'id':1,'skill':'1#11#12|2#21','exSkill':0,'deviceId':0},{'11':'https://example.test/11.png'})
  self.assertEqual(len(result),2)
  self.assertEqual(result[0]['icon'],'https://example.test/11.png')
  self.assertTrue(all(r['regions']==['cn']for r in result))
  self.assertNotIn('Ultimate',[r['type']['en']for r in result])

if __name__=='__main__':unittest.main()
