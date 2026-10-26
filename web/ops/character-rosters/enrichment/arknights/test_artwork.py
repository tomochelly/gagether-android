import copy
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest

from PIL import Image

spec = importlib.util.spec_from_file_location('arknights_artwork', Path(__file__).with_name('artwork.py'))
art = importlib.util.module_from_spec(spec)
spec.loader.exec_module(art)
COMMIT = 'a' * 40


def fixture():
    native = {}
    for locale in art.REGIONS:
        native[locale] = {
            'characters': {'char_001_exact': {'profession': 'WARRIOR', 'phases': [{}, {}, {}]}},
            'skins': {'buildinEvolveMap': {'char_001_exact': {'0': 'char_001_exact#1', '1': 'char_001_exact#1', '2': 'char_001_exact#2'}},
                      'charSkins': {
                          'char_001_exact#1': {'charId': 'char_001_exact', 'illustId': 'illust_char_001_exact_1'},
                          'char_001_exact#2': {'charId': 'char_001_exact', 'illustId': 'illust_char_001_exact_2'}}}}
    tree = {'sha': 'b' * 40, 'tree': [
        {'path': 'char_001_exact_1.png', 'type': 'blob', 'sha': 'c' * 40, 'size': 123},
        {'path': 'char_001_exact_2.png', 'type': 'blob', 'sha': 'd' * 40, 'size': 456}], 'truncated': False}
    return native, tree


class ArtworkTests(unittest.TestCase):
    def test_exact_native_phases_join_regions_without_costume_or_token_substitution(self):
        native, tree = fixture()
        native['zh']['characters']['token_001_exact'] = {'profession': 'TOKEN', 'phases': [{}]}
        native['zh']['skins']['charSkins']['char_001_exact@costume'] = {'charId': 'char_001_exact', 'illustId': 'illust_char_001_exact_costume'}
        result, missing = art.plan_artwork(native, tree, COMMIT)
        self.assertEqual(missing, [])
        self.assertEqual([row['phase'] for row in result], [0, 2])
        self.assertEqual(result[1]['regions'], ['kr', 'global', 'jp', 'cn'])
        self.assertEqual(result[1]['sourceId'], 'illust_char_001_exact_2')
        self.assertIn('/' + COMMIT + '/charpack/char_001_exact_2.png', result[1]['url'])
        self.assertEqual(set(result[1]['variantLabel']), set(art.REGIONS))

    def test_cn_only_membership_and_phase_never_appear_in_other_clients(self):
        native, tree = fixture()
        for locale in ('ko', 'en', 'ja'):
            native[locale]['characters'] = {}
        result, _ = art.plan_artwork(native, tree, COMMIT)
        self.assertEqual(result[1]['regions'], ['cn'])
        self.assertEqual(len(result[1]['nativeDeclarations']), 1)

    def test_another_form_incomplete_inventory_and_low_resolution_fallback_are_rejected(self):
        native, tree = fixture()
        wrong = copy.deepcopy(native)
        wrong['zh']['skins']['charSkins']['char_001_exact#2']['illustId'] = 'illust_char_001_other_2'
        with self.assertRaisesRegex(ValueError, 'another operator'):
            art.plan_artwork(wrong, tree, COMMIT)
        with self.assertRaisesRegex(ValueError, 'Incomplete'):
            art.plan_artwork(native, {**tree, 'truncated': True}, COMMIT)
        tree['tree'][1]['path'] = 'char_001_exact_2b.png'
        result, missing = art.plan_artwork(native, tree, COMMIT)
        self.assertEqual([r['phase'] for r in result], [0])
        self.assertEqual(len(missing), 4)

    def test_declared_phase_cannot_exceed_native_operator_progression(self):
        native, tree = fixture()
        native['ko']['characters']['char_001_exact']['phases'] = [{}]
        with self.assertRaisesRegex(ValueError, 'phase exceeds'):
            art.plan_artwork(native, tree, COMMIT)

    def test_class_change_requires_native_patch_parent_template_and_distinct_illustration_identity(self):
        native, tree = fixture()
        for client in native.values():
            client['patches'] = {'infos': {'char_001_exact': {'tmplIds': ['char_001_exact', 'char_1001_class']}},
                                 'patchChars': {'char_1001_class': {'profession': 'MEDIC', 'phases': [{}, {}, {}]}}}
            client['skins']['buildinPatchMap'] = {'char_001_exact': {'char_1001_class': 'char_1001_class#2'}}
            client['skins']['charSkins']['char_1001_class#2'] = {
                'charId': 'char_001_exact', 'tmplId': 'char_1001_class',
                'illustId': 'illust_char_1001_class_2', 'displaySkin': {'skinGroupId': 'ILLUST_2'}}
        tree['tree'].append({'path': 'char_1001_class_2.png', 'type': 'blob', 'sha': 'e' * 40, 'size': 500})
        rows, missing = art.plan_artwork(native, tree, COMMIT)
        self.assertEqual(missing, [])
        self.assertEqual(len(rows), 3)
        self.assertEqual(rows[2]['characterId'], 'char_1001_class')
        self.assertEqual(rows[2]['classChangeParentId'], 'char_001_exact')
        self.assertEqual(rows[2]['phase'], 2)
        native['zh']['skins']['charSkins']['char_1001_class#2']['tmplId'] = 'char_001_exact'
        with self.assertRaisesRegex(ValueError, 'template identity'):
            art.plan_artwork(native, tree, COMMIT)

    def test_preview_requires_declared_matching_full_composition_export(self):
        native, tree = fixture()
        rows, _ = art.plan_artwork(native, tree, COMMIT)
        self.assertEqual(art.plan_previews(rows, tree, COMMIT), [])
        tree['tree'].append({'path': 'char_001_exact_2b.png', 'type': 'blob', 'sha': 'e' * 40, 'size': 100})
        previews = art.plan_previews(rows, tree, COMMIT)
        self.assertEqual(len(previews), 1)
        self.assertEqual(previews[0]['sourceId'], rows[1]['sourceId'])
        self.assertEqual(previews[0]['originalGitBlobSha'], rows[1]['gitBlobSha'])
        self.assertTrue(previews[0]['preview'])
        self.assertEqual(previews[0]['assetPath'], 'charpack/char_001_exact_2b.png')

    def test_metadata_only_keeps_unchanged_verified_urls_without_network_or_invented_dimensions(self):
        native, tree = fixture()
        rows, _ = art.metadata_artwork(native, tree, COMMIT)
        self.assertNotIn('width', rows[1])
        previous = [{**rows[1], 'width': 2048, 'height': 2048, 'bytes': 456, 'sha256': 'f' * 64}]
        fresh_commit = '1' * 40
        current, _ = art.metadata_artwork(native, tree, fresh_commit, previous)
        self.assertEqual(current[1]['url'], previous[0]['url'])
        self.assertEqual(current[1]['width'], 2048)
        self.assertIn('/' + fresh_commit + '/', current[0]['url'])
        changed = copy.deepcopy(tree)
        changed['tree'][1]['sha'] = '2' * 40
        new, _ = art.metadata_artwork(native, changed, fresh_commit, previous)
        self.assertNotIn('width', new[1])
        self.assertIn('/' + fresh_commit + '/', new[1]['url'])

    def test_png_bytes_git_identity_dimensions_and_alpha_bounds_are_preserved(self):
        native, tree = fixture()
        im = Image.new('RGBA', (300, 400), (250, 30, 50, 0))
        im.putpixel((20, 40), (20, 30, 40, 255))
        im.putpixel((220, 340), (20, 30, 40, 8))
        im.putpixel((299, 399), (20, 30, 40, 7))
        buf = io.BytesIO()
        im.save(buf, format='PNG')
        body = buf.getvalue()
        row = art.plan_artwork(native, tree, COMMIT)[0][0]
        row.update(gitBlobSha=art.git_blob_sha(body), declaredBytes=len(body))
        with tempfile.TemporaryDirectory() as directory:
            result = art.download_original(row, directory, lambda request: body)
            self.assertEqual(Path(result['path']).read_bytes(), body)
            self.assertEqual((result['width'], result['height']), (300, 400))
            self.assertEqual(result['alphaBounds'], [20, 40, 221, 341])
            self.assertTrue(result['hasTransparency'])
            result2 = art.download_original(row, directory, lambda request: self.fail('Immutable cached original must be reused'))
            self.assertEqual(result2['sha256'], result['sha256'])
        with self.assertRaisesRegex(ValueError, 'Git blob'):
            art.verify_image(body, {**row, 'gitBlobSha': 'e' * 40})
        with self.assertRaisesRegex(ValueError, 'not an original PNG'):
            art.verify_image(b'not an image', row)


if __name__ == '__main__':
    unittest.main()
