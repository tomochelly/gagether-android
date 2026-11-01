import contextlib, importlib.util, io, json, pathlib, re, struct, tempfile, unittest, zlib
from unittest.mock import patch

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('ai_sync_check', HERE / 'ai-sync-check.py')
check = importlib.util.module_from_spec(spec); spec.loader.exec_module(check)


def png(w, h, salt=b''):
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'tEXt', b'k\x00' + salt) + chunk(b'IEND', b'')


def jpeg(w, h):
    return b'\xff\xd8' + b'\xff\xe0' + struct.pack('>H', 16) + b'JFIF\x00' + b'\x00' * 9 + b'\xff\xc0' + struct.pack('>HBHH', 17, 8, h, w) + b'\x00' * 10


class ImageHeaders(unittest.TestCase):
    def test_formats(self):
        self.assertEqual(check.image_size(png(3840, 2160)), ('png', 3840, 2160))
        self.assertEqual(check.image_size(jpeg(1920, 1080)), ('jpeg', 1920, 1080))
        self.assertEqual(check.image_size(b'GIF89a' + struct.pack('<HH', 640, 360) + b'\x00' * 8), ('gif', 640, 360))
        vp8 = b'RIFF' + b'\x00' * 4 + b'WEBP' + b'VP8 ' + b'\x00' * 4 + b'\x00\x00\x00' + b'\x9d\x01\x2a' + struct.pack('<HH', 2048, 1024)
        self.assertEqual(check.image_size(vp8), ('webp', 2048, 1024))
        bits = (1000 - 1) | ((500 - 1) << 14)
        vp8l = b'RIFF' + b'\x00' * 4 + b'WEBP' + b'VP8L' + b'\x00' * 4 + b'\x2f' + bits.to_bytes(4, 'little')
        self.assertEqual(check.image_size(vp8l), ('webp', 1000, 500))
        vp8x = b'RIFF' + b'\x00' * 4 + b'WEBP' + b'VP8X' + b'\x00' * 8 + (4095).to_bytes(3, 'little') + (2159).to_bytes(3, 'little')
        self.assertEqual(check.image_size(vp8x), ('webp', 4096, 2160))
        avif = b'\x00\x00\x00\x1cftypavif' + b'\x00' * 16 + b'\x00\x00\x00\x14ispe' + b'\x00' * 4 + struct.pack('>II', 160, 90) + b'\x00\x00\x00\x14ispe' + b'\x00' * 4 + struct.pack('>II', 3840, 2160)
        self.assertEqual(check.image_size(avif), ('avif', 3840, 2160))
        self.assertIsNone(check.image_size(b'<html>not an image</html>'))


def change(item_id, new_url, w, h, old_url=None, ow=None, oh=None, member='카르티시아'):
    art = lambda url, a, b: {'ko': {'image': url, 'imageSource': 'https://wutheringwaves.kurogames.com/kr/main/news/detail/1', 'imageVerified': True, 'width': a, 'height': b, 'verifiedAt': '2026-11-01T00:00:00Z'}}
    return {'id': item_id, 'set': {'pickupMembers': [{'name': {'ko': member}, 'type': 'new', 'localizedArtwork': art(new_url, w, h)}]},
            'before': {'pickupMembers': [{'name': {'ko': member}, 'type': 'new', 'localizedArtwork': art(old_url, ow, oh)}] if old_url else None}}


class ImageChecks(unittest.TestCase):
    def fetcher(self, files):
        def fetch(url):
            if url not in files: raise OSError('down')
            return files[url]
        return fetch

    def test_slot_paths_follow_member_names(self):
        new, old = check.item_slots(change('a', 'https://x/new.png', 1, 1, 'https://x/old.png', 1, 1), 'change')
        self.assertEqual(list(new), ['pickupMembers[name=카르티시아].localizedArtwork.ko'])
        self.assertEqual(list(old), list(new))

    def test_smaller_mismatch_non_image_and_duplicates(self):
        files = {
            'https://x/big.png': ('image/png', png(3840, 2160)), 'https://x/old.png': ('image/png', png(1920, 1080)),
            'https://x/small.png': ('image/png', png(1280, 720)), 'https://x/html': ('text/html', b'<html>'),
            'https://x/dup.png': ('image/png', png(2000, 1000, b'same')),
        }
        f = {'entries': [], 'changes': [
            change('ok', 'https://x/big.png', 3840, 2160, 'https://x/old.png', 1920, 1080),
            change('smaller', 'https://x/small.png', 1280, 720, 'https://x/old.png', 1920, 1080),
            change('declared', 'https://x/big.png', 7680, 4320),
            change('html', 'https://x/html', 10, 10),
            change('down', 'https://x/missing.png', 10, 10),
            change('recorded', 'https://x/big.png', 3840, 2160, 'https://x/gone.png', 5000, 5000),
            change('dup-a', 'https://x/dup.png', 2000, 1000, member='A'), change('dup-b', 'https://x/dup.png', 2000, 1000, member='B'),
            change('not-ready', 'https://x/html', 1, 1),
        ]}
        ready = {c['id'] for c in f['changes']} - {'not-ready'}
        rows, reasons, error = check.check_images(f, ready, self.fetcher(files))
        self.assertIsNone(error)
        self.assertNotIn('ok', reasons); self.assertIn('smaller', reasons['smaller']); self.assertIn('recorded 7680x4320', reasons['declared'])
        self.assertIn('not image', reasons['html']); self.assertIn('download failed', reasons['down'])
        self.assertIn('smaller', reasons['recorded'])  # old file unavailable: falls back to the recorded size
        self.assertEqual([r for r in rows if r['id'] == 'recorded'][0]['old'], (5000, 5000, 'recorded'))
        self.assertNotIn('dup-a', reasons); self.assertEqual([r for r in rows if r['id'] == 'dup-a'][0]['duplicate'], ['dup-b/B'])
        self.assertFalse([r for r in rows if r['id'] == 'not-ready'])
        self.assertEqual([r for r in rows if r['id'] == 'ok'][0]['old'], (1920, 1080, 'measured'))

    def test_limits_are_reported_not_dropped(self):
        many = {'id': 'many', 'gameId': 'wuwa', 'detailImages': [{'image': 'https://x/%d.png' % i, 'imageSource': 'https://x', 'width': 1, 'height': 1} for i in range(check.LIMITS['maxImagesPerItem'] + 1)]}
        rows, reasons, error = check.check_images({'entries': [many], 'changes': []}, {'many'}, self.fetcher({}))
        self.assertIn('image-limit', reasons['many']); self.assertFalse(rows)
        with patch.dict(check.LIMITS, {'maxImagesPerFile': 2, 'maxImagesPerItem': 5}):
            entries = [{'id': 'e%d' % i, 'image': 'https://x/%d.png' % i, 'imageSource': 'https://x'} for i in range(3)]
            rows, reasons, error = check.check_images({'entries': entries, 'changes': []}, {'e0', 'e1', 'e2'}, self.fetcher({}))
            self.assertIn('split', error)


class SummaryAndLimits(unittest.TestCase):
    def test_cells_escape_and_truncate(self):
        self.assertEqual(check.cell('a|b\nc<script>'), 'a\\|b c&lt;script>')
        self.assertIn('… (sha256 ', check.cell('x' * 500))

    def test_table_uses_only_file_values_and_public_codes(self):
        f = {'entries': [], 'changes': [{'id': 'c1', 'set': {'endAt': '2026-11-26T10:59:00+09:00'}, 'before': {'endAt': None}}]}
        result = {'items': [{'id': 'c1', 'gameId': 'wuwa', 'status': 'applied', 'code': 'applied', 'applyFields': ['endAt']}]}
        text = '\n'.join(check.file_table(f, result, [], {}))
        self.assertIn('endAt: null → 2026-11-26T10:59:00+09:00', text)

    def test_limits_match_the_server_constants(self):
        source = (HERE.parent / 'lib' / 'ai-sync-limits.ts').read_text(encoding='utf-8')
        server = {k: int(v.replace('_', '')) for k, v in re.findall(r'(\w+):([\d_]+)', source)}
        for key, value in check.LIMITS.items(): self.assertEqual(server[key], value, key)

    def test_paths_follow_the_server_pattern(self):
        self.assertTrue(check.PATH_RE.match('.gagether/updates/20261101T0930Z-wuwa-39.json'))
        for bad in ['.gagether/updates/../x.json', '.gagether/updates/a.json.txt', '.gagether/emergency.json', '.gagether/updates/a b.json']:
            self.assertIsNone(check.PATH_RE.match(bad))

    def test_main_skips_replayed_files_and_reports_pending_beyond_the_run_limit(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp); d = root / '.gagether' / 'updates'; d.mkdir(parents=True)
            for i in range(check.LIMITS['maxFilesPerRun'] + 2): (d / ('f%02d.json' % i)).write_text('{}')
            (d / 'README.ko.md').write_text('x'); (d / 'example.json.txt').write_text('{}')
            calls = []
            def fake_call(action, path, exclude=()):
                calls.append(path)
                return 200, ({'replayed': True} if path.endswith('f00.json') else {'items': [], 'fileSha256': 'x'})
            with patch.object(check, 'call', fake_call), patch.object(check, 'process', lambda p, l, f: ('done', '', [])), patch.dict('os.environ', {'AI_UPDATES_CHECKOUT': tmp, 'GITHUB_STEP_SUMMARY': str(root / 's.md')}):
                with contextlib.redirect_stdout(io.StringIO()): code = check.main()
            self.assertEqual(code, 1)
            self.assertEqual(len(calls), check.LIMITS['maxFilesPerRun'] + 2)
            summary = (root / 's.md').read_text(encoding='utf-8')
            self.assertIn('f06.json` | pending', summary); self.assertNotIn('f00.json', summary.split('### 결과')[1])


if __name__ == '__main__':
    unittest.main()
