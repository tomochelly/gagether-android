import base64,copy,gzip,hashlib,importlib.util,json,pathlib,unittest
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parent
def module(name):
 s=importlib.util.spec_from_file_location('gfl2_'+name,ROOT/(name+'.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
e=module('enrich');p=module('pack')
def fixture():
 c=dict(id='Exact Form',sourceUrl='https://gfl2.help/en/characters/Exact%20Form',name=e.C('캐릭터','Exact Form','',''),regions=['cn'],image=dict(url='https://example.com/original.png',sourceUrl='https://example.com/source',kind='full-body'),stats=[])
 skills=[dict(title='Title '+k,key=k,type=t,description='Deals <#D05C19:80%> and applies {!Effect}.',cost='0',range='7')for k,t in [('basic','basic'),('skill1','active'),('skill2','active'),('ultimate','ultimate'),('passive','passive')]]
 data=dict(name='Exact Form',stats=dict(health='123',attack='45',defense='67',stability='12',mobility='6'),skills=skills,fortification=[dict(affect='skill1',effect='Damage +10%',lvl='2')],neural=[dict(number=1,type='attack',effect='ATK +25'),dict(number=1,type='key',effect='A key effect')],key_names={'1':'Actual key name'},expansion_key='Expansion effect',remoulding_pattern={'effects':{'embryo':{'effect':'Effect +5%','price':{'support':2}}}},summons=[])
 imgs=['/static/images/chara-info/Exact Form/skills/'+k+'.png'for k in ['basic','skill1','skill2','ultimate','passive']]+['/static/images/hp_icon.png','/static/images/chara-info/Exact Form/helix/key1.png']
 raw=''.join('<img src="'+v+'">'for v in imgs)
 return c,data,raw
class Tests(unittest.TestCase):
 def test_plain_native_markup(self):
  self.assertEqual(e.clean('A <#FFF:12%> {!Buff} **end**'),'A 12% Buff end')
 def test_missing_glossary_is_explicit(self):
  self.assertEqual(e.clean('Performs {!0}'), 'Performs [effect name unavailable]')
 def test_empty_material_cost_is_not_zero(self):
  c,d,h=fixture();d['remoulding_pattern']['effects']['embryo']['price']['bulwark']='';r,_,gaps=e.enrich_character(c,d,h);self.assertTrue(any('cost embryo/bulwark'in v for v in gaps));self.assertNotIn('cost:bulwark',[v['id']for t in r['skillTables']if t['id']=='remoulding:embryo'for v in t['values']])
 def test_exact_path(self):
  c,_,_=fixture();self.assertEqual(e.source_url(c),'https://gfl2.help/en/characters/Exact%20Form');c['id']='Other';self.assertRaises(ValueError,e.source_url,c)
 def test_preserves_art_names_release_and_native_prose(self):
  c,d,h=fixture();r,icons,gaps=e.enrich_character(c,d,h)
  for k in ('image','name','regions'):self.assertEqual(r[k],c[k])
  self.assertEqual(r['sourceId'],c['id']);self.assertEqual(r['stats'][0]['value'],'123');self.assertEqual(r['skillTables'][0]['description']['en'],'Deals 80% and applies Effect.');self.assertEqual(r['skillTables'][0]['description']['ko'],'');self.assertEqual(r['skillTables'][0]['nameLocale'],'en')
  self.assertIn('https://gfl2.help/static/images/chara-info/Exact Form/skills/basic.png',icons)
 def test_base_and_fortification_separate(self):
  c,d,h=fixture();r,_,_=e.enrich_character(c,d,h);t={x['id']:x for x in r['skillTables']};self.assertIn('80%',t['skill:skill1']['description']['en']);self.assertEqual(t['fortification:1']['description']['en'],'Damage +10%')
 def test_missing_fortification_is_explicit_and_never_invented(self):
  c,d,h=fixture();d['fortification']=[];r,_,gaps=e.enrich_character(c,d,h+'<h2>Fortification</h2><h4>SOON</h4>');self.assertFalse(any(t['id'].startswith('fortification:')for t in r['skillTables']));self.assertTrue(any('0/6 stages (source section: SOON)'in v for v in gaps));self.assertIn('돌파 1~6단계',r['sections'][0]['body']['ko']);self.assertIn('0개',r['sections'][0]['body']['ko'])
 def test_unbound_fortification_rejected(self):
  c,d,h=fixture();d['fortification'][0]['affect']='wrong';self.assertRaises(ValueError,e.enrich_character,c,d,h)
 def test_duplicate_skill_rejected(self):
  c,d,h=fixture();d['skills'].append(d['skills'][0]);self.assertRaises(ValueError,e.enrich_character,c,d,h)
 def test_neural_stats_not_silently_added_to_panel(self):
  c,d,h=fixture();r,_,_=e.enrich_character(c,d,h);self.assertEqual(next(s for s in r['stats']if s['id']=='attack')['value'],'45');self.assertTrue(any(t['id']=='neural:stats'for t in r['skillTables']))
 def test_only_declared_images(self):
  c,d,h=fixture();r,icons,gaps=e.enrich_character(c,d,h);self.assertIsNone(next(s for s in r['stats']if s['id']=='attack').get('icon'));self.assertTrue(gaps)
 def test_packed_complete_fields_and_identity(self):
  c,d,h=fixture();r,_,_=e.enrich_character(c,d,h);roster=dict(gameId='gfl2',checkedAt='2026-10-25T00:00:00Z',characters=[r]);out,wire=p.encode(roster);block=wire['detailCatalog']['forms'][c['id']];raw=gzip.decompress(base64.b64decode(block['payload']));decoded=json.loads(raw)
  self.assertEqual(decoded['sourceId'],c['id']);self.assertEqual(len(raw),block['bytes']);self.assertEqual(hashlib.sha256(raw).hexdigest(),block['sha256']);self.assertEqual(decoded['details']['skillTables'],r['skillTables']);self.assertNotIn('stats',wire['characters'][0]);self.assertEqual(wire['characters'][0]['regions'],['cn']);self.assertEqual(wire['characters'][0]['image'],c['image'])
 def test_cached_packed_source_survives_missing_refresh_fields(self):
  c,d,h=fixture();r,_,_=e.enrich_character(c,d,h);_,wire=p.encode(dict(gameId='gfl2',checkedAt='2026-10-25T00:00:00Z',characters=[r]));_,nextwire=p.encode(wire);self.assertEqual(nextwire['detailCatalog']['forms'],wire['detailCatalog']['forms'])
 def test_other_source_cannot_reuse_packed_facts(self):
  c,d,h=fixture();r,_,_=e.enrich_character(c,d,h);_,wire=p.encode(dict(gameId='gfl2',checkedAt='2026-10-25T00:00:00Z',characters=[r]));wire['characters'][0]['sourceId']='Other';self.assertRaises(ValueError,p.encode,wire)
 def test_failed_source_retains_original_and_reports_partial(self):
  c,d,h=fixture();r,_,_=e.enrich_character(c,d,h);roster=dict(gameId='gfl2',checkedAt='2026-10-25T00:00:00Z',characters=[r]);before=copy.deepcopy(roster)
  with patch.object(e,'read_source',side_effect=ValueError('source blocked')):out,report,_=e.enrich(roster,'/unused')
  self.assertEqual(out,before);self.assertEqual(report['status'],'partial');self.assertEqual(report['enriched'],0);self.assertEqual(len(report['failures']),1)
 def test_partial_kit_cannot_pack(self):
  c,_,_=fixture();self.assertRaises(ValueError,p.encode,dict(gameId='gfl2',checkedAt='2026-10-25T00:00:00Z',characters=[c]))
if __name__=='__main__':unittest.main()
