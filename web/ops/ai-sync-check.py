#!/usr/bin/env python3
"""GAGETHER AI update checks and apply (ops/AI-UPDATES.ko.md).

Runs only inside the reusable workflow gagether-ai-sync-core.yml, from a checkout of main.
It reads update files from the pushed ai-updates commit, checks their images, calls
/api/ai-sync (dryRun, then apply) and writes a public run summary. Standard library only:
the job holds an OIDC token, so nothing is installed and downloaded files are never run.
The summary is public: it shows only the committed file, server status codes and image
measurements, never stored or owner-only values.
"""
import hashlib, json, os, re, struct, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

# Mirror of lib/ai-sync-limits.ts; ops/test_ai_sync_check.py fails when they differ.
LIMITS = {
    'maxItemsPerFile': 100,
    'maxFileBytes': 1_000_000,
    'maxFilesPerRun': 5,
    'scanWindowFiles': 20,
    'itemsPerApplyCall': 20,
    'maxImagesPerItem': 30,
    'maxImagesPerFile': 200,
    'maxImageBytes': 40_000_000,
}
ENDPOINT = 'https://gagether.wiki/api/ai-sync'
SITE = 'https://gagether.wiki'
AGENT = 'GAGETHER-AI-Sync/1.0 (+https://github.com/tomochelly/gagether-android)'
PATH_RE = re.compile(r'^\.gagether/updates/[A-Za-z0-9_-]+\.json$')
CELL = 200


# ------------------------------------------------------------------ image headers
def image_size(data):
    """Return (format, width, height) from the file header, or None."""
    if data[:8] == b'\x89PNG\r\n\x1a\n' and data[12:16] == b'IHDR':
        w, h = struct.unpack('>II', data[16:24]); return 'png', w, h
    if data[:6] in (b'GIF87a', b'GIF89a'):
        w, h = struct.unpack('<HH', data[6:10]); return 'gif', w, h
    if data[:2] == b'\xff\xd8':
        i = 2
        while i + 9 < len(data):
            if data[i] != 0xFF: i += 1; continue
            marker = data[i + 1]
            if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7: i += 2; continue
            length = struct.unpack('>H', data[i + 2:i + 4])[0]
            if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
                h, w = struct.unpack('>HH', data[i + 5:i + 9]); return 'jpeg', w, h
            i += 2 + length
        return None
    if data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        chunk = data[12:16]
        if chunk == b'VP8 ' and data[23:26] == b'\x9d\x01\x2a':
            w, h = struct.unpack('<HH', data[26:30]); return 'webp', w & 0x3FFF, h & 0x3FFF
        if chunk == b'VP8L' and data[20] == 0x2F:
            b = int.from_bytes(data[21:25], 'little'); return 'webp', (b & 0x3FFF) + 1, ((b >> 14) & 0x3FFF) + 1
        if chunk == b'VP8X':
            return 'webp', int.from_bytes(data[24:27], 'little') + 1, int.from_bytes(data[27:30], 'little') + 1
        return None
    if data[4:8] == b'ftyp' and data[8:12] in (b'avif', b'avis', b'mif1', b'heic'):
        best = None; i = data.find(b'ispe')
        while i != -1 and i + 16 <= len(data):
            w, h = struct.unpack('>II', data[i + 8:i + 16])
            if not best or w * h > best[0] * best[1]: best = (w, h)
            i = data.find(b'ispe', i + 4)
        return ('avif',) + best if best else None
    return None


# ------------------------------------------------------------------ slots
def _segment(node, index):
    name = node.get('name') if isinstance(node, dict) else None
    if isinstance(name, dict) and isinstance(name.get('ko'), str): return '[name=%s]' % name['ko']
    if isinstance(name, str): return '[name=%s]' % name
    return '[%d]' % index


def slots(value, path=''):
    """Every object with an image string, keyed by a stable JSON path."""
    found = {}
    def walk(v, p, depth):
        if depth > 12: return
        if isinstance(v, list):
            for i, x in enumerate(v): walk(x, p + _segment(x, i), depth + 1)
        elif isinstance(v, dict):
            if isinstance(v.get('image'), str) and v['image']: found[p or '(entry)'] = v
            for k, x in v.items():
                if isinstance(x, (dict, list)): walk(x, (p + '.' if p else '') + k, depth + 1)
    walk(value, path, 0)
    return found


def item_slots(item, kind):
    """(new slots, before slots) of one file item."""
    if kind == 'new': return slots(item), {}
    new, old = {}, {}
    for key, value in item['set'].items():
        if key in ('image', 'imageSource', 'width', 'height', 'imageVerified', 'imageKind', 'imageLocale'):
            continue  # top-level artwork fields are compared as one slot below
        new.update(slots(value, key)); old.update(slots(item['before'].get(key), key))
    if 'image' in item['set']:
        new['(entry)'] = {k: item['set'].get(k) for k in ('image', 'imageSource', 'width', 'height')}
        old_image = item['before'].get('image')
        if old_image: old['(entry)'] = {'image': old_image, 'width': item['before'].get('width'), 'height': item['before'].get('height')}
    return new, old


# ------------------------------------------------------------------ download
class LimitedRedirect(urllib.request.HTTPRedirectHandler):
    max_redirections = 3


def download(url, limit=LIMITS['maxImageBytes']):
    if url.startswith('/'): url = SITE + url
    if not url.startswith('https://'): raise ValueError('not https')
    opener = urllib.request.build_opener(LimitedRedirect)
    with opener.open(urllib.request.Request(url, headers={'User-Agent': AGENT, 'Accept': 'image/*'}), timeout=30) as r:
        ctype = r.headers.get('Content-Type', '').split(';')[0].strip().lower()
        data = r.read(limit + 1)
    if len(data) > limit: raise ValueError('larger than %d bytes' % limit)
    return ctype, data


def check_images(file, ready_ids, fetch=download):
    """Image checks of ops/AI-UPDATES.ko.md 5. Returns (rows, exclude reasons, file error)."""
    rows, reasons, by_sha = [], {}, {}
    items = [('new', e) for e in file.get('entries', [])] + [('change', c) for c in file.get('changes', [])]
    planned = []
    for kind, item in items:
        if item.get('id') not in ready_ids: continue
        new, old = item_slots(item, kind)
        changed = {p: s for p, s in new.items() if not old.get(p) or old[p].get('image') != s.get('image')}
        if len(changed) > LIMITS['maxImagesPerItem']:
            reasons[item['id']] = 'image-limit: %d images (max %d)' % (len(changed), LIMITS['maxImagesPerItem']); continue
        planned.append((item, changed, old))
    total = sum(len(c) for _, c, _ in planned)
    if total > LIMITS['maxImagesPerFile']:
        return [], reasons, 'file has %d new images (max %d); split it into new files' % (total, LIMITS['maxImagesPerFile'])
    for item, changed, old in planned:
        for path, slot in changed.items():
            owner = path.split('[name=')[-1].split(']')[0] if '[name=' in path else item['id']
            row = {'id': item['id'], 'path': path, 'owner': owner, 'url': slot['image'], 'source': slot.get('imageSource'), 'declared': (slot.get('width'), slot.get('height'))}
            rows.append(row)
            try:
                ctype, data = fetch(slot['image'])
            except Exception as error:
                row['problem'] = 'download failed (%s)' % type(error).__name__
                reasons.setdefault(item['id'], row['problem']); continue
            row['bytes'] = len(data); row['sha256'] = hashlib.sha256(data).hexdigest()
            size = image_size(data)
            if not ctype.startswith('image/'): row['problem'] = 'not image/* (%s)' % (ctype or 'none')
            elif not size: row['problem'] = 'unknown image format'
            else:
                row['format'], row['width'], row['height'] = size
                w, h = row['declared']
                if w is not None and h is not None and (w, h) != (size[1], size[2]):
                    row['problem'] = 'recorded %sx%s but file is %dx%d' % (w, h, size[1], size[2])
            previous = old.get(path)
            if previous and 'problem' not in row:
                basis, ow, oh = None, None, None
                try:
                    _, odata = fetch(previous['image']); osize = image_size(odata)
                    if osize: basis, ow, oh = 'measured', osize[1], osize[2]
                except Exception:
                    pass
                if not basis and isinstance(previous.get('width'), int) and isinstance(previous.get('height'), int):
                    basis, ow, oh = 'recorded', previous['width'], previous['height']
                if basis:
                    row['old'] = (ow, oh, basis)
                    if row['width'] * row['height'] < ow * oh: row['problem'] = 'smaller than the current image (%dx%d)' % (ow, oh)
            if 'sha256' in row: by_sha.setdefault(row['sha256'], set()).add((item['id'], owner))
            if row.get('problem'): reasons.setdefault(item['id'], row['problem'])
    for row in rows:
        if len(by_sha.get(row.get('sha256'), ())) > 1:
            row['duplicate'] = sorted('%s/%s' % pair for pair in by_sha[row['sha256']] if pair != (row['id'], row['owner']))
    return rows, reasons, None


# ------------------------------------------------------------------ server
def oidc_token():
    url = os.environ['ACTIONS_ID_TOKEN_REQUEST_URL'] + '&audience=' + urllib.parse.quote(ENDPOINT, safe='')
    with urllib.request.urlopen(urllib.request.Request(url, headers={'Authorization': 'Bearer ' + os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']}), timeout=20) as r:
        token = json.load(r)['value']
    print('::add-mask::' + token)
    return token


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs): return None


def call(action, path, exclude=()):
    body = json.dumps({'action': action, 'path': path, 'exclude': sorted(exclude)}).encode()
    for attempt in range(3):
        request = urllib.request.Request(ENDPOINT, data=body, method='POST', headers={'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': AGENT, 'X-Gagether-AI-Sync-Identity': oidc_token()})
        try:
            with urllib.request.build_opener(NoRedirect).open(request, timeout=120) as r: return r.status, json.load(r)
        except urllib.error.HTTPError as error:
            try: result = json.loads(error.read().decode()[:20000])
            except Exception: result = {'error': 'HTTP %d' % error.code}
            if error.code in (502, 503, 504) and attempt < 2: time.sleep(2 ** (attempt + 1)); continue
            return error.code, result
        except (urllib.error.URLError, TimeoutError) as error:
            if attempt < 2: time.sleep(2 ** (attempt + 1)); continue
            return 0, {'error': 'network: %s' % type(error).__name__}


# ------------------------------------------------------------------ summary
def cell(value):
    text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False, sort_keys=True)
    if text is None: text = ''
    if len(text) > CELL: text = text[:CELL] + '… (sha256 %s)' % hashlib.sha256(text.encode()).hexdigest()[:12]
    return text.replace('\\', '\\\\').replace('|', '\\|').replace('\n', ' ').replace('\r', ' ').replace('<', '&lt;')


def file_table(file, result, image_rows, reasons):
    items = {i['id']: i for i in result.get('items', [])}
    lines = ['| 항목 | 게임 | 종류 | 판정 | 이유 | 칸: 전 → 후 |', '| --- | --- | --- | --- | --- | --- |']
    for kind, item in [('신규', e) for e in file.get('entries', [])] + [('변경', c) for c in file.get('changes', [])]:
        r = items.get(item.get('id'), {})
        why = reasons.get(item.get('id')) or r.get('message') or ', '.join(r.get('conflictFields', [])) or ''
        if kind == '신규': change = cell((item.get('title') or {}).get('ko', ''))
        else:
            shown = r.get('applyFields') or list(item['set'])
            change = '<br>'.join('%s: %s → %s' % (cell(k), cell(item['before'].get(k)), cell(item['set'][k])) for k in shown)
        lines.append('| `%s` | %s | %s | %s | %s | %s |' % (cell(item.get('id')), cell(r.get('gameId') or item.get('gameId') or ''), kind, cell(r.get('status', '?') + (' / ' + r['code'] if r.get('code') else '')), cell(why), change))
    if image_rows:
        lines += ['', '| 항목 | 자리 | 이미지 | 형식·크기 | 기존 | 공식 출처 | 중복 | 결과 |', '| --- | --- | --- | --- | --- | --- | --- | --- |']
        official = {s['url']: s['official'] for i in result.get('items', []) for s in i.get('imageSources', [])}
        for row in image_rows:
            size = '%s %dx%d, %s bytes' % (row['format'], row['width'], row['height'], format(row['bytes'], ',')) if 'width' in row else '-'
            old = '%dx%d (%s)' % row['old'] if row.get('old') else '-'
            src = {True: '공식', False: '비공식'}.get(official.get(row.get('source')), '-')
            lines.append('| `%s` | %s | [링크](%s) | %s | %s | %s | %s | %s |' % (cell(row['id']), cell(row['path']), row['url'].replace(')', '%29'), size, old, src, cell(', '.join(row.get('duplicate', [])) or '-'), cell(row.get('problem', '통과'))))
    return lines


def summary(text):
    target = os.environ.get('GITHUB_STEP_SUMMARY')
    if target:
        with open(target, 'a', encoding='utf-8') as f: f.write(text + '\n')
    print(text)


# ------------------------------------------------------------------ main
def process(path, local, first):
    raw = local.read_bytes()
    if hashlib.sha256(raw).hexdigest() != first.get('fileSha256'): return 'error', 'local checkout differs from the signed commit', []
    file = json.loads(raw.decode('utf-8'))
    ready = {i['id'] for i in first.get('items', []) if i.get('status') == 'ready'}
    image_rows, reasons, error = check_images(file, ready)
    if error: return 'error', error, ['- ' + error]
    status, dry = call('dryRun', path, reasons.keys())
    if status != 200: return 'error', 'dryRun %s: %s' % (status, dry.get('error')), []
    lines = ['### `%s`' % path, '', '사유: %s · 모드: %s · 파일 sha256 `%s`' % (cell(file.get('reason', '')), file.get('mode'), dry.get('fileSha256', '')[:16]), '']
    if file.get('mode') != 'apply':
        lines += ['dryRun 전용 파일이라 반영하지 않았습니다.', ''] + file_table(file, dry, image_rows, reasons)
        return 'dry', '', lines
    result = None
    for _ in range(LIMITS['maxItemsPerFile'] // LIMITS['itemsPerApplyCall'] + 3):
        status, result = call('apply', path, reasons.keys())
        if status == 429: lines += file_table(file, dry, image_rows, reasons); return 'pending', 'hourly limit: %s' % result.get('error'), lines
        if status != 200: lines += file_table(file, dry, image_rows, reasons); return 'error', 'apply %s: %s' % (status, result.get('error')), lines
        if result.get('replayed') or not result.get('continuation'): break
    lines += file_table(file, result if result and not result.get('replayed') else dry, image_rows, reasons)
    if result and result.get('continuation'): return 'pending', '%d items left for the next run' % result.get('remaining', 0), lines
    counts = (result or {}).get('counts', {})
    lines.insert(3, '반영 결과: ' + ', '.join('%s %d' % kv for kv in sorted(counts.items())))
    if not counts.get('applied') and not counts.get('partial') and (counts.get('failed') or counts.get('excluded')): return 'error', 'nothing applied', lines
    return 'done', '', lines


def main():
    root = Path(os.environ.get('AI_UPDATES_CHECKOUT', 'updates'))
    candidates = sorted(p for p in (root / '.gagether' / 'updates').glob('*.json') if PATH_RE.match(p.relative_to(root).as_posix()))
    window = candidates[-LIMITS['scanWindowFiles']:]
    summary('## GAGETHER AI 업데이트\n\n커밋 `%s` · 확인한 파일 %d개 (최근 %d개까지)\n' % (os.environ.get('GITHUB_SHA', '')[:12], len(window), LIMITS['scanWindowFiles']))
    outcomes, processed = [], 0
    for local in window:
        path = local.relative_to(root).as_posix()
        if local.stat().st_size > LIMITS['maxFileBytes']: outcomes.append((path, 'error', 'file larger than %d bytes' % LIMITS['maxFileBytes'])); continue
        status, first = call('dryRun', path)
        if status == 200 and first.get('replayed'): continue
        if status != 200: outcomes.append((path, 'error', 'dryRun %s: %s' % (status, first.get('error')))); continue
        if processed >= LIMITS['maxFilesPerRun']: outcomes.append((path, 'pending', 'run limit of %d files; handled by the next run' % LIMITS['maxFilesPerRun'])); continue
        processed += 1
        state, note, lines = process(path, local, first)
        summary('\n'.join(lines) + '\n')
        outcomes.append((path, state, note))
    summary('### 결과\n\n| 파일 | 상태 | 메모 |\n| --- | --- | --- |\n' + '\n'.join('| `%s` | %s | %s |' % (cell(p), s, cell(n)) for p, s, n in outcomes) if outcomes else '처리할 새 파일이 없습니다.')
    bad = [o for o in outcomes if o[1] in ('error', 'pending')]
    for p, s, n in bad: print('::error::%s %s: %s' % (p, s, n))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
