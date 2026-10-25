#!/usr/bin/env python3
"""Reverse base-stat regressions; no network or production writes."""
import copy
import importlib.util
import json
import pathlib
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('enrich_a', pathlib.Path(__file__).with_name('enrich_a.py'))
enrich_a = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(enrich_a)


def winter_profile():
    values = {'hp': 1263, 'atk': 242, 'reality_def': 106, 'mental_def': 106,
              'crit_rate': 5.86, 'crit_dmg': 138.5}
    return {'slug': 'winter', 'characterStats': {
        key: {'insight_0_min': value, 'insight_2_max': 999999}
        for key, value in values.items()}}


class ReverseBaseStatsTests(unittest.TestCase):
    def test_inert_flight_json_string_can_contain_array_call_closer(self):
        body = json.dumps({'description': 'Effect ]) stays inside the JSON string',
                           'character': winter_profile()}, separators=(',', ':'))
        source = '<script>self.__next_f.push(' + json.dumps([1, body]) + ');</script>'
        decoded = enrich_a.flight(source)
        self.assertEqual(enrich_a.json_field(decoded, 'character'), winter_profile())
        self.assertIn('Effect ]) stays', decoded)

    def test_unicode_identity_cannot_join_npc_punctuation(self):
        playable = {'id': 3013, 'nameEng': 'Зима', 'name': 'winter', 'heroType': 1, 'isOnline': '1'}
        npc = {'id': 9998, 'nameEng': 'Machine D III', 'name': 'npc', 'heroType': 0, 'isOnline': '0'}
        index, rejected = enrich_a.reverse_native_index([playable, npc], {'winter': 'Зима', 'npc': '???'})
        self.assertEqual(index[enrich_a.reverse_identity('Зима')]['id'], 3013)
        self.assertNotIn('', index)
        self.assertTrue(any(row.get('heroId') == 9998 for row in rejected))

    def test_duplicate_identity_is_not_arbitrarily_selected(self):
        rows = [{'id': ident, 'nameEng': 'Same', 'name': str(ident), 'heroType': 1, 'isOnline': '1'}
                for ident in [1, 2]]
        index, rejected = enrich_a.reverse_native_index(rows, {})
        self.assertNotIn('same', index)
        self.assertTrue(any('ambiguous' in row['reason'] for row in rejected))

    def test_only_exact_insight_zero_minimum_is_used(self):
        stats = enrich_a.reverse_prydwen_base(winter_profile(), 'winter')
        self.assertEqual({row['id']: row['value'] for row in stats}, {
            'hp': '1263', 'atk': '242', 'reality_def': '106', 'mental_def': '106',
            'crit_rate': '5.86%', 'crit_dmg': '138.5%'})
        with self.assertRaisesRegex(ValueError, 'slug mismatch'):
            enrich_a.reverse_prydwen_base(winter_profile(), 'another-character')

    def test_absurd_or_incomplete_base_values_are_rejected(self):
        profile = winter_profile()
        profile['characterStats']['hp']['insight_0_min'] = 999999
        with self.assertRaisesRegex(ValueError, 'Out-of-range'):
            enrich_a.reverse_prydwen_base(profile, 'winter')
        profile = winter_profile()
        profile['characterStats']['hp']['insight_0_min'] = None
        with self.assertRaisesRegex(ValueError, 'complete verified'):
            enrich_a.reverse_prydwen_base(profile, 'winter')

    def test_omitted_optional_stat_keeps_prior_verified_fact(self):
        basis = {'en': 'same source, Insight0 Lv.1'}
        previous = [{'id': 'hp', 'value': '999999', 'basis': basis},
                    {'id': 'crit_rate', 'value': '5.86%', 'basis': basis},
                    {'id': 'crit', 'value': '221', 'basis': {'en': 'Insight2 Lv.50'}}]
        merged = enrich_a.merge_reverse_stats(previous, [{'id': 'hp', 'value': '1263', 'basis': basis}])
        self.assertEqual({row['id']: row['value'] for row in merged}, {'hp': '1263', 'crit_rate': '5.86%'})

    def test_zero_optional_critical_pair_does_not_hide_verified_core_or_reappear(self):
        profile = winter_profile()
        for key in ['crit_rate', 'crit_dmg']:
            profile['characterStats'][key]['insight_0_min'] = 0
        rejected = []
        stats = enrich_a.reverse_prydwen_base(profile, 'winter', rejected)
        self.assertEqual({row['id'] for row in stats}, {'hp', 'atk', 'reality_def', 'mental_def'})
        self.assertEqual(len(rejected), 2)
        previous = [{'id': key, 'value': '0%', 'basis': stats[0]['basis']}
                    for key in ['crit_rate', 'crit_dmg']]
        self.assertEqual(len(enrich_a.merge_reverse_stats(previous, stats)), 4)

    def test_native_growth_requires_verified_playable_identity_and_unique_row(self):
        row = {'heroId': 3013, 'level': 1, 'hp': 1263, 'atk': 242, 'def': 106, 'mdef': 106}
        accepted, proof = enrich_a.reverse_native_base_rows([row, dict(row, heroId=9998, hp=999999)], {3013})
        self.assertEqual(accepted[3013]['hp'], 1263)
        self.assertEqual(proof['levelOneRows'], 2)
        self.assertIn('Out-of-range', proof['rejected'][0]['reason'])
        self.assertFalse(enrich_a.reverse_native_base_rows([row], set())[0])
        accepted, _ = enrich_a.reverse_native_base_rows([dict(row, insight=0, rank=1)], {3013})
        self.assertEqual(accepted[3013]['hp'], 1263)
        self.assertFalse(enrich_a.reverse_native_base_rows([dict(row, insight=1)], {3013})[0])
        self.assertFalse(enrich_a.reverse_native_base_rows([dict(row, insight=0, rank=2)], {3013})[0])
        self.assertFalse(enrich_a.reverse_native_base_rows([dict(row, insight=0)] * 2, {3013})[0])

    def test_optional_native_failure_preserves_successful_profile(self):
        class Cache:
            def json(self, url):
                raise OSError('native source unavailable')

            def get(self, url):
                body = json.dumps({'character': winter_profile()}, separators=(',', ':'))
                return 'self.__next_f.push(' + json.dumps([1, body]) + ')'

        doc = {'characters': [{'id': '26', 'name': {'ko': '겨울', 'en': 'Зима'},
                               'sourceUrl': 'https://www.prydwen.gg/re1999/characters/winter/',
                               'stats': [{'id': 'hp', 'value': '999999'}]}]}
        report = enrich_a.enrich_reverse1999(doc, Cache())
        self.assertEqual(doc['characters'][0]['stats'][0]['value'], '1263')
        self.assertEqual(report['verifiedPrydwenBaseIds'], ['26'])
        self.assertEqual(len(report['sourceRejections']), 2)

    def test_names_only_never_replaces_stats_with_native_fallback(self):
        class Cache:
            def json(self, url):
                raise OSError('native source unavailable')

            def get(self, url):
                raise AssertionError('names-only must not read detail profiles')

        prior = [{'id': 'hp', 'value': '1263'}]
        doc = {'characters': [{'id': '26', 'name': {'ko': '겨울', 'en': 'Зима'},
                               'sourceUrl': 'https://www.prydwen.gg/re1999/characters/winter/',
                               'stats': copy.deepcopy(prior)}]}
        with patch.object(enrich_a, 'NAMES_ONLY', True):
            report = enrich_a.enrich_reverse1999(doc, Cache())
        self.assertEqual(doc['characters'][0]['stats'], prior)
        self.assertEqual(report['nativeFallbacks'], [])


if __name__ == '__main__':
    unittest.main()
