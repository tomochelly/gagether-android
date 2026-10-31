import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('hsr_enrich',Path(__file__).with_name('enrich.py'))
h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)

class NativeTextTests(unittest.TestCase):
    def records(self,desc,params):
        return {l:dict(id='1',desc=desc,params=params) for l in h.LOCALES}

    def test_fractional_integer_marker_is_not_truncated(self):
        r=h.parameterized(self.records('DMG #1[i]% for #2[i] turns',[[1.1375,2],[1.225,2]]),2)
        self.assertEqual(r['descriptionTemplate']['en'],'DMG {1}% for {2} turns')
        self.assertEqual(r['parameters'],{'en':[['113.75','122.5'],['2']]})

    def test_never_reconstruct_missing_source_precision(self):
        self.assertEqual(h.format_param(.4037,'i',True),'40.37')
        self.assertEqual(h.format_param(.40375,'i',True),'40.375')
        self.assertEqual(h.format_param(.053,'f1',True),'5.3')
        self.assertEqual(h.format_param(.0744,'f1',True),'7.44')
        self.assertEqual(h.format_param(.5,'f1',True),'50.0')

    def test_no_float_artifacts(self):
        self.assertEqual(h.format_param(.11375,'i',True),'11.375')
        self.assertEqual(h.format_param(.15,'i',True),'15')
        self.assertEqual(h.number('10.000'),'10')

    def test_unbound_parameter_explicit_and_not_guessed(self):
        records=self.records('HP #5[i]% or below; costs #1[i] HP',[[.25]])
        with self.assertRaises(ValueError):h.parameterized(records,1)
        gaps=[];r=h.parameterized(records,1,gaps,'character')
        self.assertEqual(len(gaps),4)
        self.assertIn('[value absent from source]',r['descriptionTemplate']['en'])
        self.assertNotIn('#5',r['descriptionTemplate']['en'])
        self.assertEqual(r['parameters']['en'],[['0.25']])

    def test_markup_preserves_reading_and_native_text(self):
        self.assertEqual(h.clean('{RUBY_B#Gate}Treasury{RUBY_E#} {NICKNAME}','en'),'Treasury（Gate） Trailblazer')
        self.assertEqual(h.clean('<color=#FFF>1</color>\\n2','en'),'1\n2')

    def test_missing_level_is_rejected(self):
        with self.assertRaises(ValueError):h.parameterized(self.records('#1[i]%',[[.5]]),2)

    def test_no_guessed_icon_paths(self):
        self.assertEqual(h.icon('icon/skill/1001_skill.png'),h.RAW+'icon/skill/1001_skill.png')
        with self.assertRaises(ValueError):h.icon('../other.png')
        with self.assertRaises(ValueError):h.icon('icon/../other.png')

class NumericTests(unittest.TestCase):
    def test_level80_himeko_independent_panel(self):
        # HoYoWiki entry9 publicly indexes1047HP/756ATK/436DEF/96SPD.
        v={'hp':(484.704,7.128),'atk':(350.064,5.148),'def':(201.96,2.97),'spd':(96,0),'crit_rate':(.05,0),'crit_dmg':(.5,0)}
        raw={'values':[{k:dict(base=b,step=s) for k,(b,s) in v.items()} for _ in range(7)]}
        props={l:{p:dict(name=p,icon=None) for p in h.STAT_KEYS.values()}for l in h.LOCALES}
        progression=h.make_progression(raw,props)
        self.assertEqual(progression['rows'][-1],dict(stage=6,level=80,values=dict(hp='1047',atk='756',**{'def':'436'},spd='96',crit_rate='5%',crit_dmg='50%')))
        self.assertEqual(len(progression['rows']),14)
        rows=h.expand_progression(progression)
        self.assertEqual(len(rows),86)
        self.assertEqual(len({(r['stage'],r['level']) for r in rows}),86)
        progression['rows'][-1]['values']['hp']='1048'
        with self.assertRaises(ValueError):h.expand_progression(progression)

    def test_exact_form_eidolon_binding(self):
        char=dict(skill_trees=['t','alt'],ranks=['e'])
        trees={'t':dict(max_level=6,level_up_skills=[dict(id='131001',num=1)]),'alt':dict(max_level=6,level_up_skills=[dict(id='1131001',num=1)])}
        ranks={'e':dict(level_up_skills=[dict(id='131001',num=1)])}
        caps,bonuses=h.skill_caps(char,trees,ranks)
        self.assertEqual(caps,{'131001':6,'1131001':6})
        self.assertEqual(bonuses,{'131001':1})

class CacheFailureTests(unittest.TestCase):
    def test_html_failure_cannot_replace_last_valid_source(self):
        url='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/characters.json'
        class Response:
            status=200
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self):return b'<html>temporary source error</html>'
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp);valid=b'{"last":"good"}'
            (p/'chars-en.body').write_bytes(valid)
            receipt=dict(url=url,checkedAt='2026-10-25T00:00:00Z',status=200,bytes=len(valid),sha256=h.sha(valid))
            (p/'chars-en.meta.json').write_text(json.dumps(receipt))
            with patch.dict(h.URLS,{'chars-en':url},clear=True),patch.object(h.urllib.request,'urlopen',return_value=Response()):
                with self.assertRaises(ValueError):h.load_sources(p,refresh=True)
            self.assertEqual((p/'chars-en.body').read_bytes(),valid)
            self.assertEqual(json.loads((p/'chars-en.meta.json').read_text()),receipt)

    def test_changed_cached_bytes_are_rejected(self):
        url='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/characters.json'
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp);valid=b'{"last":"good"}';(p/'chars-en.body').write_bytes(b'{"bad":"changed"}')
            (p/'chars-en.meta.json').write_text(json.dumps(dict(url=url,sha256=h.sha(valid))))
            with patch.dict(h.URLS,{'chars-en':url},clear=True):
                with self.assertRaisesRegex(ValueError,'hash mismatch'):h.load_sources(p)

if __name__=='__main__':unittest.main()
