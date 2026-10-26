import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('arknights_native_enrichment', Path(__file__).with_name('enrich.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def attributes(hp=100, attack=20):
    return dict(maxHp=hp, atk=attack, **{'def': 10}, magicResistance=0, cost=12, blockCnt=1, baseAttackTime=1.25, respawnTime=70)


def operator(name='Native operator'):
    return dict(name=name, rarity='TIER_6', profession='CASTER', position='RANGED', description='Deals <@ba.kw>Arts damage</>.',
                itemUsage='Introduction\nwith source lines.', itemDesc='A separate native note.', skills=[], talents=[], trait=None,
                phases=[dict(maxLevel=50, attributesKeyFrames=[dict(level=1, data=attributes()), dict(level=50, data=attributes(500, 150))]),
                        dict(maxLevel=80, attributesKeyFrames=[dict(level=1, data=attributes(500, 150)), dict(level=80, data=attributes(1000, 300))]),
                        dict(maxLevel=90, attributesKeyFrames=[dict(level=1, data=attributes(1000, 300)), dict(level=90, data=attributes(1600, 500))])])


def skill(skill_id='sk_fixture'):
    def level(attack, cost):
        return dict(name='Actual skill', description='ATK <@ba.vup>+{atk:0%}</>; {duration} seconds.', skillType='MANUAL', durationType='NONE', duration=12,
                    blackboard=[dict(key='atk', value=attack)], spData=dict(spType='INCREASE_WITH_TIME', spCost=cost, initSp=0, maxChargeTime=1))
    return dict(skillId=skill_id, iconId=None, levels=[level(.3, 30), level(.6, 20)])


class NativeArknightsTests(unittest.TestCase):
    def test_blackboard_decimal_percent_negative_duration_and_markup_are_exact(self):
        text = '<@ba.vup>+{atk:0%}</>, {-def:0%}, {time:0.0}s, {duration}, {name}'
        result = m.expand_description(text, [dict(key='ATK', value=.35), dict(key='def', value=-.2), dict(key='time', value=1.25), dict(key='name', valueStr='source token')], 8)
        self.assertEqual(result, '+35%, 20%, 1.3s, 8, source token')
        with self.assertRaisesRegex(ValueError, 'Unbound'):
            m.expand_description('Never invent {missing:0%}', [])
        with self.assertRaisesRegex(ValueError, 'Unknown native numerical format'):
            m.expand_description('{atk:guess}', [dict(key='atk', value=1)])

    def test_complete_rank_specific_prose_roundtrips_without_300_character_truncation(self):
        texts = ['Original opening\n' + 'a' * 931 + '\nRank1 ending.', 'Entirely different paragraph\n' + 'b' * 1564 + '\nMastery effect.']
        template, matrix = m.prose_parameters(texts, 'ko')
        self.assertTrue(all(len(piece) <= 300 for row in matrix['ko'] for piece in row))
        for rank, text in enumerate(texts):
            actual = __import__('re').sub(r'\{(\d+)\}', lambda found: matrix['ko'][int(found[1]) - 1][rank], template['ko'])
            self.assertEqual(actual, text)
        self.assertEqual(template['en'], '')

    def test_phase_controls_use_only_native_endpoints_and_exclude_unapplied_bonuses(self):
        raw = operator()
        raw['favorKeyFrames'] = [dict(level=100, data=attributes(999999, 999999))]
        before = copy.deepcopy(raw)
        progression = m.checkpoint_progression(raw, 'ko')
        self.assertEqual([(r['stage'], r['level']) for r in progression['rows']], [(0, 1), (0, 50), (1, 1), (1, 80), (2, 1), (2, 90)])
        self.assertEqual(progression['defaultLevel'], 90)
        self.assertEqual(progression['rows'][-1]['values']['hp'], '1600')
        self.assertEqual(progression['rows'][-1]['values']['interval'], '1.25s')
        self.assertEqual(raw, before)
        raw['phases'][0]['maxLevel'] = 51
        with self.assertRaisesRegex(ValueError, 'endpoints'):
            m.checkpoint_progression(raw, 'ko')

    def test_playable_inventory_excludes_tokens_traps_and_unobtainable_npcs(self):
        table = dict(char_play=operator(), char_token={**operator(), 'profession': 'TOKEN'}, char_trap={**operator(), 'profession': 'TRAP'}, char_npc={**operator(), 'isNotObtainable': True}, npc_other=operator())
        self.assertEqual(list(m.playable(table)), ['char_play'])

    def test_class_changes_require_exact_obtainable_base_and_template_membership(self):
        base = {'char_base': operator('Base name'), 'char_npc': {**operator('NPC'), 'isNotObtainable': True}}
        patches = {'infos': {'char_base': {'tmplIds': ['char_base', 'char_guard'], 'default': 'char_base'}, 'char_npc': {'tmplIds': ['char_npc', 'char_fake'], 'default': 'char_npc'}},
                   'patchChars': {'char_guard': {**operator('Same native name'), 'profession': 'WARRIOR'}, 'char_fake': operator('Not obtainable through an NPC'), 'char_orphan': operator('Not explicitly mapped')}}
        before = copy.deepcopy((base, patches))
        playable = m.playable_inventory(base, patches)
        self.assertEqual(list(playable), ['char_base', 'char_guard'])
        self.assertEqual(playable['char_guard']['profession'], 'WARRIOR')
        self.assertEqual((base, patches), before)
        patches['infos']['char_base']['tmplIds'].append('char_missing')
        with self.assertRaisesRegex(ValueError, 'template missing'):
            m.playable_inventory(base, patches)

    def test_class_change_panels_keep_patch_table_provenance_and_separate_stats(self):
        raw = operator('Amiya')
        raw['profession'] = 'WARRIOR'
        row = m.enrich_character(dict(id='char_guard', name=m.C(), sourceUrl='https://example.org/old', sourceKind='community'),
                                 {'en': raw}, {'en': {'skill_table': {}, 'char_patch_table': {'patchChars': {'char_guard': raw}}}}, set())
        self.assertEqual(row['sourceId'], 'char_guard')
        self.assertEqual(row['name']['en'], 'Amiya')
        self.assertEqual(row['traits'][0]['value']['en'], 'Guard')
        self.assertTrue(row['sourceUrl'].endswith('/en/gamedata/excel/char_patch_table.json'))
        self.assertTrue(row['statProgression']['sourceUrl'].endswith('/char_patch_table.json'))
        self.assertTrue(row['skillTables'][0]['sourceUrl'].endswith('/char_patch_table.json'))

    def test_exact_skill_identity_and_declared_icon_paths_fail_closed(self):
        data = skill()
        table = m.make_skill(data, 'en', {'skill_icon_sk_fixture.png'})
        self.assertEqual(table['icon'], m.ICON_SOURCE + 'skill_icon_sk_fixture.png')
        self.assertNotIn('icon', m.make_skill(data, 'en', {'skill_icon_some_other_operator.png'}))
        self.assertEqual(table['values'][0]['levels'], ['30', '20'])
        raw = operator()
        raw['skills'] = [dict(skillId='sk_fixture')]
        with self.assertRaisesRegex(ValueError, 'identity'):
            m.native_tables(raw, 'en', {'sk_fixture': skill('wrong_exact_id')}, set())

    def test_native_numeric_passive_enum_requires_actual_passive_skill(self):
        data = skill()
        for row in data['levels']:
            row['spData']['spType'] = 8
            row['skillType'] = 'PASSIVE'
            row['duration'] = -1
            row['description'] = 'Passive source text.'
        table = m.make_skill(data, 'en')
        self.assertIn('Passive', table['type']['en'])
        self.assertNotIn('duration', [v['id'] for v in table['values']])
        data['levels'][0]['skillType'] = 'MANUAL'
        with self.assertRaisesRegex(ValueError, 'enum'):
            m.make_skill(data, 'en')

    def test_talent_conditions_are_alternatives_with_highest_base_potential_first(self):
        candidates = [dict(name='Talent', description='At E1 source text.', requiredPotentialRank=0, unlockCondition=dict(phase='PHASE_1', level=1)),
                      dict(name='Talent', description='At E2 source text.', requiredPotentialRank=0, unlockCondition=dict(phase='PHASE_2', level=1)),
                      dict(name='Talent', description='Potential upgraded source text.', requiredPotentialRank=4, unlockCondition=dict(phase='PHASE_2', level=1))]
        before = copy.deepcopy(candidates)
        table = m.condition_table('talent:0', candidates, 'en', m.TALENT)
        self.assertEqual(table['parameters']['en'][0], ['At E2 source text.', 'At E1 source text.', 'Potential upgraded source text.'])
        self.assertEqual(table['levelLabels'][0]['en'], 'Elite 2 · Lv.1 · Potential 1')
        self.assertEqual(table['levelLabels'][2]['en'], 'Elite 2 · Lv.1 · Potential 5')
        # Sorting must not rewrite the source client object shared elsewhere.
        self.assertEqual(candidates, before)

    def test_cn_only_membership_does_not_become_other_server_release_or_translation(self):
        original = dict(id='char_fixture', name=m.C(ko='Editorial rendering', zh='Old CN'), nameSources={'ko': dict(url='https://example.org/source', kind='translation')},
                        sourceUrl='https://example.org/source', sourceKind='community', traits=[], images=[], artworkFrames=[{'immutable': 'preserve-for-root'}])
        raw = operator('新的中文名')
        before = copy.deepcopy(original)
        patched = m.enrich_character(original, {'zh': raw}, {'zh': {'skill_table': {}}}, set())
        self.assertEqual(patched['regions'], ['cn'])
        self.assertEqual(set(patched['regionalStatProgression']), {'cn'})
        self.assertEqual(set(patched['regionalSkillTables']), {'cn'})
        self.assertEqual(patched['name']['zh'], '新的中文名')
        self.assertEqual(patched['name']['ko'], 'Editorial rendering')
        self.assertEqual(patched['nameSources']['ko']['kind'], 'translation')
        self.assertEqual(patched['artworkFrames'], before['artworkFrames'])
        self.assertEqual(original, before)

    def test_selected_services_keep_their_own_stats_and_skill_revision(self):
        original = dict(id='char_fixture', name=m.C(), sourceUrl='https://example.org/source', sourceKind='community')
        kr, cn = operator('한국 이름'), operator('中文名')
        cn['phases'][2]['attributesKeyFrames'][-1]['data']['atk'] = 777
        kr['skills'] = cn['skills'] = [dict(skillId='sk_fixture')]
        kskill, cskill = skill(), skill()
        cskill['levels'][1]['blackboard'][0]['value'] = .9
        row = m.enrich_character(original, {'ko': kr, 'zh': cn}, {'ko': {'skill_table': {'sk_fixture': kskill}}, 'zh': {'skill_table': {'sk_fixture': cskill}}}, set())
        self.assertEqual(row['regionalStatProgression']['kr']['rows'][-1]['values']['atk'], '500')
        self.assertEqual(row['regionalStatProgression']['cn']['rows'][-1]['values']['atk'], '777')
        self.assertIn('+60%', row['regionalSkillTables']['kr'][0]['parameters']['ko'][0][1])
        self.assertIn('+90%', row['regionalSkillTables']['cn'][0]['parameters']['zh'][0][1])
        self.assertEqual(row['regionalSkillTables']['kr'][0]['regions'], ['kr'])
        self.assertEqual(row['regionalSkillTables']['cn'][0]['regions'], ['cn'])


if __name__ == '__main__':
    unittest.main()
