import copy,hashlib,json,tempfile,unittest
from pathlib import Path
import enrich

class EnrichmentTests(unittest.TestCase):
 def test_source_parameter_formats_preserve_native_precision_and_units(self):
  self.assertEqual(enrich.format_label('{param1:F1P} / {param2:F2}秒',{'param1':[.664986],'param2':[1.256]},0),'66.5% / 1.26秒')
  self.assertEqual(enrich.numeric(.12345,'P'),'12%')
  self.assertEqual(enrich.numeric(.12345,'F2P'),'12.35%')
  self.assertEqual(enrich.numeric(1.5,'I'),'2')
  self.assertEqual(enrich.plain(0),'0');self.assertEqual(enrich.plain(100),'100')
 def test_unbound_or_unrecognized_parameters_fail(self):
  for template in ['{param3:F1}','{param1:UNKNOWN}']:
   with self.assertRaises(ValueError):enrich.format_label(template,{'param1':[1]},0)
 def records(self):
  rows={l:dict(id=123,name='Exact same character',combat1=dict(name=l+' native',description=l+' native prose',attributes=dict(labels=['native label|{param1:F1P}'],parameters=dict(param1=[.1,.2]))),images={})for l in enrich.LOCALES}
  cons={l:dict(id=123,name='Exact same character',**{'c'+str(i):dict(name=l+' constellation '+str(i),description=l+' native constellation prose')for i in range(1,7)},images={})for l in enrich.LOCALES}
  return rows,cons
 def test_four_native_locales_and_all_constellations_are_retained_once(self):
  rows,cons=self.records();out=enrich.tables(rows,cons)
  self.assertEqual(len(out),7);self.assertEqual(len({s['id']for s in out}),7)
  self.assertEqual(out[0]['maxLevel'],2);self.assertEqual(out[0]['baseMaxLevel'],2)
  for l in enrich.LOCALES:
   self.assertEqual(out[0]['name'][l],l+' native');self.assertTrue(out[0]['descriptionTemplate'][l].startswith(l+' native prose'))
   self.assertEqual(out[0]['parameters'][l],[['10.0%','20.0%']])
 def test_localized_attribute_omission_is_not_silently_english(self):
  rows,cons=self.records();rows['ko']['combat1']['attributes']['labels']=[]
  with self.assertRaises(ValueError):enrich.tables(rows,cons)
 def test_growth_preserves_before_and_after_ascension_and_zero_crit(self):
  raw=dict(base=dict(hp=100,attack=10,defense=20,critrate=0,critdmg=.5),curve=dict(hp='a',attack='a',defense='a'),specialized='FIGHT_PROP_ATTACK_PERCENT',promotion=[dict(hp=i*10,attack=i,defense=i*2,specialized=0)for i in range(7)])
  out=enrich.progression(raw,{str(i):{'a':1}for i in range(1,91)},{});self.assertEqual(len(out['rows']),96)
  before=next(r for r in out['rows']if r['level']==20 and r['stage']==0);after=next(r for r in out['rows']if r['level']==20 and r['stage']==1)
  self.assertEqual(before['values']['hp'],'100');self.assertEqual(after['values']['hp'],'110');self.assertEqual(after['values']['crit_rate'],'0%');self.assertEqual(out['defaultLevel'],90)
 def test_absent_material_quantity_is_never_zero(self):
  out=enrich.material_sections({l:dict(costs=dict(ascend1=[dict(name='Mora',id=202)]))for l in enrich.LOCALES})
  self.assertIn('[quantity absent]',out[0]['body']['en']);self.assertNotIn('× 0',out[0]['body']['en'])
 def test_element_base64_uses_original_bytes_and_hash(self):
  # A real original glyph is pinned alongside the collector; no pixel editing.
  row=json.loads((Path(__file__).parent/'element-icon-manifest.json').read_text())[0]
  source=Path(row['path']).read_bytes()
  import base64
  with tempfile.TemporaryDirectory()as tmp:
   glyphs,records=enrich.element_icons([dict(name='Exact',images=dict(base64='data:image/png;base64,'+base64.b64encode(source).decode()))],tmp)
   self.assertEqual(records[0]['sha256'],hashlib.sha256(source).hexdigest());self.assertEqual(Path(records[0]['file']).read_bytes(),source)
   self.assertTrue(glyphs['Exact'].startswith('https://gagether.wiki/roster-detail-icons/'))

if __name__=='__main__':unittest.main()
