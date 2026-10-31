import copy,importlib.util,json,pathlib,tempfile,unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('uma_enrich',pathlib.Path(__file__).with_name('enrich.py'));u=importlib.util.module_from_spec(spec);spec.loader.exec_module(u)

def skill(id=100011):
 return dict(id=id,iconid=20013,rarity=5,activation=0,jpname='シューティングスター',jpdesc='終盤に速度が上がる',name_ko='슈팅 스타',desc_ko='종반에 속도가 상승한다',enname='Shooting Star',endesc='JP source description',name_en='Shooting Star',desc_en='Global source description',condition_groups=[dict(base_time=60000,condition='phase>=2&order_rate<=70',effects=[dict(type=22,value=3500),dict(type=31,value=1000)])],loc={'en':dict(condition_groups=[dict(base_time=50000,condition='phase>=2&order_rate<=50',effects=[dict(type=22,value=3500)])]),'ko':dict(condition_groups=[dict(base_time=50000,condition='phase>=2&order_rate<=50',effects=[dict(type=22,value=3500)])])},gene_version=dict(id=900011,iconid=20011,rarity=1,activation=1,cost=200,desc_en='Inherited version',desc_ko='계승 버전',condition_groups=[dict(base_time=36000,condition='phase>=2',effects=[dict(type=22,value=1500)])]))

def fixture():
 c=dict(id='100101',sourceId='100101-special-week',name=u.C('스페셜 위크','Special Week','スペシャルウィーク','特別週'),sourceUrl='https://example.org',sourceKind='community',regions=['jp','kr','global'],image=dict(url='https://example.org/exact-original.png',sourceUrl='https://example.org',kind='full-body'),artworkFrames=[{'owner':'original'}],traits=[dict(id='turf',label=u.C('잔디','Turf','芝','草地'),value=u.C('A','A','A','A'))])
 doc=dict(gameId='umamusume',characters=[c],sourceUrls=['https://example.org'],checkedAt='2026-10-01T00:00:00Z')
 card=dict(card_id=100101,url_name='100101-special-week',rarity=3,release='2021-02-24',release_ko='2022-06-20',release_en='2025-06-26',base_stats=[83,88,98,90,91],four_star_stats=[92,98,109,100,101],five_star_stats=[102,108,120,110,110],stat_bonus=[0,20,0,0,10],skills_unique=[100011],skills_innate=[],skills_awakening=[],skills_event=[],skills_evo=[dict(old=100011,new=100101111)])
 base=dict(UmaId='100101',UmaSlug='100101-special-week',UmaBaseStats={f'{star}★':dict(zip(u.RAW_STATS,row))for star,row in [(3,card['base_stats']),(4,card['four_star_stats']),(5,card['five_star_stats'])]})
 evo=skill(100101111);evo['unreleased']=['en'];evo.pop('gene_version')
 sources=dict(cards=[card],base=[base],skills=[skill(),evo],evolutions=[dict(card_id=100101,evolutions=[dict(new=100101111,old=100011,servers=['ja','ko'])])],evo_strings=[dict(card_id=100101,skills={'100101111':{'ja':[['スタミナ600以上'],['速度スキル3個','GⅠ2勝']],'ko':[['스태미나 600 이상'],['속도 스킬 3개','GⅠ 2승']]}})])
 return doc,sources

class RegionalSkills(unittest.TestCase):
 def test_exact_server_override_does_not_mutate_original(self):
  s=skill();before=copy.deepcopy(s);self.assertEqual(u.regional_skill(s,'ja')['condition_groups'][0]['base_time'],60000);self.assertEqual(u.regional_skill(s,'ko')['condition_groups'][0]['base_time'],50000);self.assertEqual(u.regional_skill(s,'en')['condition_groups'][0]['condition'],'phase>=2&order_rate<=50');self.assertEqual(s,before)
 def test_nested_inherited_override_keeps_real_gene_cost(self):
  s=skill();s['loc']['en']['gene_version']=dict(condition_groups=[dict(base_time=30000,condition='phase>=2',effects=[dict(type=22,value=1500)])]);g=u.regional_skill(s,'en',True);self.assertEqual(g['cost'],200);self.assertEqual(g['condition_groups'][0]['base_time'],30000);self.assertEqual(s['gene_version']['condition_groups'][0]['base_time'],36000)
 def test_regional_empty_and_unavailable_lists_are_not_japanese_fallbacks(self):
  c=dict(skills_awakening=[1,2,3,4,5,6],skills_awakening_en=[1,2,3,4],skills_awakening_ko=-1);self.assertEqual(len(u.category_ids(c,'skills_awakening','en')),4);self.assertEqual(u.category_ids(c,'skills_awakening','ko'),[]);c['skills_awakening_en']=[];self.assertEqual(u.category_ids(c,'skills_awakening','en'),[])
 def test_global_evolutions_are_not_added_from_japanese_bindings(self):
  d,s=fixture();_,cat,m=u.enrich(d,s,asof='2026-10-25');f=cat['forms']['100101'];self.assertEqual(len(f['regionalSkillRefs']['jp']),3);self.assertEqual(len(f['regionalSkillRefs']['kr']),3);self.assertEqual(len(f['regionalSkillRefs']['global']),2);self.assertEqual(m['counts']['global']['evolution'],0)
 def test_native_english_jp_and_global_descriptions_stay_distinct(self):
  self.assertEqual(u.skill_copies(skill(),'ja')[1]['en'],'JP source description');self.assertEqual(u.skill_copies(skill(),'en')[1]['en'],'Global source description')
 def test_native_unique_star_gates_and_inheritance_do_not_leak_into_low_star_panel(self):
  s=skill();self.assertEqual(u.table(s,'jp','unique')['minStars'],3);s['rarity']=3;t=u.table(s,'jp','unique');self.assertEqual((t['minStars'],t['maxStars']),(1,2));s['rarity']=4;self.assertEqual(u.table(s,'jp','unique')['minStars'],3);self.assertEqual(u.table(s,'jp','inherited',inherited=True)['minStars'],3)
 def test_complete_evolution_and_or_logic_and_honest_original_marker(self):
  x=u.append_evolution(u.C('','','',''),{'ja':[['A','B'],['C']]});self.assertIn('1. A / OR / B\n2. C',x['en']);self.assertIn('Japanese original',x['en']);self.assertNotIn('Japanese original',x['ja'])

class PanelsAndIdentity(unittest.TestCase):
 def test_all_actual_star_rows_are_source_integers(self):
  _,s=fixture();p=u.star_progression(s['cards'][0],s['base'][0]);self.assertEqual([r['level']for r in p['rows']],[3,4,5]);self.assertEqual(p['rows'][2]['values']['power'],'120');self.assertEqual(p['defaultLevel'],3)
 def test_missing_intermediate_panel_never_interpolates(self):
  _,s=fixture();del s['base'][0]['UmaBaseStats']['4★'];del s['cards'][0]['four_star_stats'];self.assertRaises(ValueError,u.star_progression,s['cards'][0],s['base'][0])
 def test_independent_panel_conflict_is_fatal(self):
  _,s=fixture();s['cards'][0]['five_star_stats'][0]+=1;self.assertRaises(ValueError,u.star_progression,s['cards'][0],s['base'][0])
 def test_source_integers_fill_real_low_star_row_omitted_by_secondary_source(self):
  _,s=fixture();c=s['cards'][0];b=s['base'][0];c['rarity']=2;c['base_stats']=[82,96,100,77,70];c['three_star_stats']=[87,101,105,81,76];b['UmaBaseStats']['2★']=dict(zip(u.RAW_STATS,c['base_stats']));del b['UmaBaseStats']['3★'];p=u.star_progression(c,b);self.assertEqual(p['rows'][1]['values']['speed'],'87')
 def test_growth_not_added_to_initial_panel_and_outfit_owner_data_unchanged(self):
  d,s=fixture();before=copy.deepcopy(d);out,cat,_=u.enrich(d,s,asof='2026-10-25');c=out['characters'][0];self.assertEqual(c['stats'][1]['value'],'88');self.assertEqual(c['stats'][6]['value'],'20%');self.assertEqual(c['image'],before['characters'][0]['image']);self.assertEqual(c['artworkFrames'],before['characters'][0]['artworkFrames']);self.assertEqual(d,before);self.assertEqual(cat['forms']['100101']['sourceId'],c['sourceId'])
 def test_actual_release_dates_scope_availability_and_preserve_future_separately(self):
  d,s=fixture();s['cards'][0]['release_ko']='2026-11-01';o,cat,m=u.enrich(d,s,asof='2026-10-25');self.assertNotIn('kr',o['characters'][0]['regions']);self.assertNotIn('kr',cat['forms']['100101']['regionalSkillRefs']);self.assertEqual(m['futureReleases'][0]['date'],'2026-11-01')
 def test_wrong_outfit_id_is_not_joined(self):
  d,s=fixture();s['base'][0]['UmaSlug']='100102-other-outfit';self.assertRaises(ValueError,u.enrich,d,s)

class PrecisionAndCache(unittest.TestCase):
 def test_exact_base_units_and_unknown_effect_fail_closed(self):
  self.assertEqual(u.format_effect(dict(type=27,value=3500)),'0.35 m/s');self.assertEqual(u.format_effect(dict(type=31,value=1000)),'0.1 m/s²');self.assertEqual(u.format_effect(dict(type=9,value=550)),'5.5%');self.assertEqual(u.format_effect(dict(type=29,value=-30000)),'-3 pp');self.assertRaises(ValueError,u.format_effect,dict(type=9999,value=0))
 def test_unbound_source_parameter_is_not_published(self):
  self.assertRaises(ValueError,u.clean,'Bonus {0}%')
 def test_missing_inherited_prose_keeps_published_activation_and_numeric_facts(self):
  s=skill();s['gene_version'].pop('desc_en');s['gene_version'].pop('desc_ko');t=u.table(s,'jp','inherited',inherited=True);self.assertFalse(any(t['description'].values()));self.assertTrue(any(v['id']=='activation'for v in t['values']));self.assertTrue(any(v['id'].startswith('effect:')for v in t['values']))
 def test_html_or_empty_json_cannot_replace_last_good_source_cache(self):
  class R:
   status=200
   def __init__(self,b):self.b=b
   def __enter__(self):return self
   def __exit__(self,*args):pass
   def read(self):return self.b
  with tempfile.TemporaryDirectory()as td:
   p=pathlib.Path(td);body=b'[{"id":1}]';url='https://example.org/data';(p/'gt-skills.body').write_bytes(body);(p/'gt-skills.receipt.json').write_text(json.dumps(dict(url=url,sha256=u.sha(body),bytes=len(body),checkedAt='2026-10-25T00:00:00Z',status=200)))
   for invalid in [b'<html>error</html>',b'[]',b'{"error":"source failed"}']:
    with patch.object(u.urllib.request,'urlopen',return_value=R(invalid)):
     self.assertRaises((ValueError,json.JSONDecodeError),u.load_one,p,'gt-skills',url,True)
    self.assertEqual((p/'gt-skills.body').read_bytes(),body)

if __name__=='__main__':unittest.main()
