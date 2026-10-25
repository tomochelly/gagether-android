import copy,importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('uma_horses',Path(__file__).with_name('collect.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def fixture():
    chars=[dict(char_id=1001,url_name='parent',name_ko='부모마',name_en='Parent',name_ja='親馬',name_zh_tw='親馬',birth_year=1995,birth_month=5,birth_day=2,sex=1,rl=dict(races=2,wins=1,active='1997-1998')),
           dict(char_id=1002,url_name='child',name_ko='자마',name_en='Child',name_ja='仔馬',name_zh_tw='子馬',birth_year=2001,birth_month=4,birth_day=3,sex=2,rl=dict(races=1,wins=1,active='2003-2003'))]
    histories=[dict(char_id=1001,jbis_slug='0000293624',pedigree=dict(sire=dict(name='Sire',name_ja='父'),dam=dict(name='Dam',name_ja='母')),race_history=[dict(date='1997-11-29',result=2,race_instance_id=100501),dict(date='1998-04-19',result=1,race_instance_id=100501)]),
               dict(char_id=1002,jbis_slug='0000293625',pedigree=dict(sire=dict(char_id=1001,name='Parent')),race_history=[dict(date='2003-04-19',result=1,race_instance_id=100501)])]
    race=lambda i,n:dict(id=i,name_en=n,name_ko=n,name_ja=n,name_zh_tw=n,grade=100)
    sources={'characters':chars,'static/character_rl_details':histories,'races':[race(100501,'Satsuki Sho'),race(101001,'Japanese Derby'),race(101501,'Kikuka Sho')],'races_extended':[]}
    roster=dict(gameId='umamusume',characters=[dict(id='100101'),dict(id='100102'),dict(id='100201')]);receipts=[dict(url='https://gametora.com/data/umamusume/static/character_rl_details.abcd1234.json',checkedAt='2026-10-25T08:00:00Z')]
    return roster,sources,receipts

class Mapping(unittest.TestCase):
    def test_exact_declared_ids_deduplicate_outfits_without_mutating_the_roster(self):
        roster,sources,receipts=fixture();before=copy.deepcopy(roster);out,a=m.build(roster,sources,receipts)
        self.assertEqual(a['counts']['profiles'],2);self.assertEqual(a['counts']['outfits'],3);self.assertEqual(out['profiles'][0]['outfitIds'],['100101','100102']);self.assertEqual(roster,before)
        self.assertIn('부마는 부모마',next(s for s in out['profiles'][1]['background']['sections']if s['id']=='historical-pedigree-links')['body']['ko'])
    def test_same_name_without_an_explicit_real_horse_record_cannot_bind(self):
        roster,sources,receipts=fixture();sources['static/character_rl_details'][0]['char_id']=9999
        with self.assertRaisesRegex(ValueError,'mapping'):m.build(roster,sources,receipts)
        roster,sources,receipts=fixture();sources['static/character_rl_details'][0]['jbis_slug']='not-a-horse'
        with self.assertRaisesRegex(ValueError,'mapping'):m.build(roster,sources,receipts)
    def test_retired_living_status_is_never_invented_from_an_absent_death_date(self):
        r,s,t=fixture();out,_=m.build(r,s,t);facts=out['profiles'][0]['background']['facts'];self.assertNotIn('died',[f['id']for f in facts]);self.assertNotIn('alive',json.dumps(out))
        s['characters'][0]['rl']['death']='2099-01-01'
        with self.assertRaisesRegex(ValueError,'death'):m.build(r,s,t)

class HistoricalRows(unittest.TestCase):
    def test_scratches_are_not_starts_and_partial_history_remains_explicit(self):
        r,s,t=fixture();s['static/character_rl_details'][0]['race_history'].append(dict(date='1998-05-01',result='dns',race_instance_id=101001));_,a=m.build(r,s,t);self.assertEqual(a['gaps'],[])
        s['characters'][0]['rl']['races']=3;_,a=m.build(r,s,t);self.assertEqual(a['gaps'][0]['kind'],'partial-race-history')
    def test_an_unpublished_career_span_requires_complete_actual_dates(self):
        r,s,t=fixture();del s['characters'][0]['rl']['active'];out,a=m.build(r,s,t);self.assertEqual(next(f for f in out['profiles'][0]['background']['facts']if f['id']=='career')['value']['en'],'1997-1998');self.assertTrue(a['reconciliation'][0]['careerDerivedFromCompleteRaceDates'])
        s['characters'][0]['rl']['races']=3;out,_=m.build(r,s,t);self.assertNotIn('career',[f['id']for f in out['profiles'][0]['background']['facts']])
    def test_three_named_races_must_be_won_in_the_same_actual_year(self):
        r,s,t=fixture();h=s['static/character_rl_details'][0]['race_history'];h[:]=[dict(date=f'1998-{month:02}-01',result=1,race_instance_id=i)for month,i in [(4,100501),(6,101001),(10,101501)]];s['characters'][0]['rl'].update(races=3,wins=3)
        out,_=m.build(r,s,t);section=next(x for x in out['profiles'][0]['background']['sections']if x['id']=='milestones');self.assertIn('1998년 동시 우승: Satsuki Sho',section['body']['ko'])
        h[-1]['date']='1999-10-01';out,_=m.build(r,s,t);section=next(x for x in out['profiles'][0]['background']['sections']if x['id']=='milestones');self.assertNotIn('1998년 동시 우승',section['body']['ko'])
    def test_historical_grade_override_never_gets_a_modern_g1_label(self):
        r,s,t=fixture();h=s['static/character_rl_details'][0]['race_history'];h.append(dict(date='1998-06-01',result=1,race_instance_id=101001,grade_override='G2'));s['characters'][0]['rl'].update(races=3,wins=2);out,_=m.build(r,s,t)
        body=next(x for x in out['profiles'][0]['background']['sections']if x['id']=='representative-wins')['body']['en'];self.assertNotIn('G1',body);self.assertIn('Satsuki Sho',body);self.assertNotIn('Japanese Derby',body)
    def test_a_declared_alternate_course_keeps_the_same_historical_race_identity(self):
        r,s,t=fixture();s['races_extended']=[dict(s['races'][0],id=999000001)];s['static/character_rl_details'][0]['race_history']=[dict(date='1998-04-01',result=1,race_instance_id=999000001),dict(date='1998-06-01',result=1,race_instance_id=101001),dict(date='1998-10-01',result=1,race_instance_id=101501)];s['characters'][0]['rl'].update(races=3,wins=3)
        out,_=m.build(r,s,t);self.assertIn('1998년 동시 우승',next(x for x in out['profiles'][0]['background']['sections']if x['id']=='milestones')['body']['ko'])

class Provenance(unittest.TestCase):
    def test_a_readable_html_failure_cannot_replace_last_good_cached_json(self):
        class Response:
            status=200
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self,*args):return b'<html>error</html>'
        with tempfile.TemporaryDirectory()as temp:
            p=Path(temp)/'good.body';p.write_bytes(b'{"good":true}')
            with patch.object(m.urllib.request,'urlopen',return_value=Response()):
                with self.assertRaises(json.JSONDecodeError):m.download('https://example.org/declared',p)
            self.assertEqual(p.read_bytes(),b'{"good":true}')
    def test_an_alcohol_article_and_a_different_birth_date_cannot_crosscheck(self):
        _,s,_=fixture();chars={c['char_id']:c for c in s['characters']}
        with tempfile.TemporaryDirectory()as temp:
            root=Path(temp);(root/'wiki').mkdir();p=root/'wiki/one.body'
            def doc(body):return dict(query=dict(pages={'1':dict(pageid=1,title='親馬',revisions=[dict(slots=dict(main={'*':body}))])}))
            p.write_text(json.dumps(doc('An alcohol article.')));self.assertEqual(m.wiki_crosschecks(root,chars)[0],{})
            p.write_text(json.dumps(doc('{{競走馬\n| 生 = [[1995年]][[5月3日]]\n}}')));self.assertEqual(m.wiki_crosschecks(root,chars)[0],{})
            p.write_text(json.dumps(doc('{{競走馬\n| 生 = [[1995年]][[5月2日]]\n| 色 = [[鹿毛]]\n}}')));self.assertIn(1001,m.wiki_crosschecks(root,chars)[0])
    def test_modified_source_cache_fails_its_recorded_sha256(self):
        with tempfile.TemporaryDirectory()as temp:
            p=Path(temp)/'source.body';b=b'[]';p.write_bytes(b);p.with_suffix('.meta.json').write_text(json.dumps(dict(status=200,bytes=2,sha256=m.sha(b))))
            self.assertEqual(m.cached(p)[0],[]);p.write_bytes(b'{}')
            with self.assertRaisesRegex(ValueError,'identity'):m.cached(p)

if __name__=='__main__':unittest.main()
