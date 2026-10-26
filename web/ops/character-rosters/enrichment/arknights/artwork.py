"""Exact native Arknights default/Elite artwork from a fixed public asset mirror.

This collector never guesses an operator filename, changes an original, writes
live data, or treats another client's inventory as regional availability. Every
selected file must be declared by native buildinEvolveMap + charSkins illustId
and the full-resolution asset Git tree. Immutable PNG bytes are independently
checked against Git's blob ID before their SHA256/dimensions are recorded.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import datetime
import hashlib
import io
import json
from pathlib import Path
import re
import tempfile
import time
import urllib.parse
import urllib.request

from PIL import Image

REPOSITORY = 'fexli/ArknightsResource'
API = 'https://api.github.com/repos/' + REPOSITORY
RAW = 'https://raw.githubusercontent.com/' + REPOSITORY
REGIONS = {'ko': 'kr', 'en': 'global', 'ja': 'jp', 'zh': 'cn'}
CLIENTS = {'ko': 'kr', 'en': 'en', 'ja': 'jp', 'zh': 'cn'}
NATIVE = 'https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/'
LABELS = {
    0: {'ko': '기본 일러스트', 'en': 'Default illustration', 'ja': '初期イラスト', 'zh': '初始立绘'},
    1: {'ko': '1차 정예화', 'en': 'Elite 1', 'ja': '昇進1', 'zh': '精英化1'},
    2: {'ko': '2차 정예화', 'en': 'Elite 2', 'ja': '昇進2', 'zh': '精英化2'},
}


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z')


def git_blob_sha(body):
    return hashlib.sha1(b'blob ' + str(len(body)).encode() + b'\0' + body).hexdigest()


def playable(row):
    return not row.get('isNotObtainable') and row.get('profession') not in ('TOKEN', 'TRAP')


def read_json(path):
    return json.loads(Path(path).read_text())


def native_sources(native_root):
    root = Path(native_root)
    return {locale: {'characters': read_json(root / locale / 'character_table.json'),
                     'skins': read_json(root / locale / 'skin_table.json'),
                     'patches': read_json(root / locale / 'char_patch_table.json')
                     if (root / locale / 'char_patch_table.json').exists() else {}}
            for locale in REGIONS}


def plan_artwork(native, tree, commit):
    if not re.fullmatch('[a-f0-9]{40}', commit):
        raise ValueError('Expected immutable asset commit')
    if tree.get('truncated') or not isinstance(tree.get('tree'), list):
        raise ValueError('Incomplete asset inventory')
    files = {row['path']: row for row in tree['tree'] if row.get('type') == 'blob'}
    if len(files) != len([row for row in tree['tree'] if row.get('type') == 'blob']):
        raise ValueError('Duplicate asset paths')
    variants, missing = {}, []
    for locale, region in REGIONS.items():
        client = native[locale]
        operators = [(key, value, None) for key, value in client['characters'].items()]
        patches = client.get('patches', {})
        for parent, info in patches.get('infos', {}).items():
            if parent not in client['characters']:
                raise ValueError('Class-change parent is not in the native operator inventory')
            for patch_id in info.get('tmplIds', []):
                if patch_id == parent:
                    continue
                patch = patches.get('patchChars', {}).get(patch_id)
                if not patch or patch_id in client['characters']:
                    raise ValueError('Missing or duplicate native class-change identity')
                operators.append((patch_id, patch, parent))
        for char_id, character, patch_parent in operators:
            if not playable(character):
                continue
            if not re.fullmatch('char_[a-z0-9_]+', char_id):
                raise ValueError('Unexpected operator identity')
            evolve = client['skins'].get('buildinEvolveMap', {}).get(char_id)
            if patch_parent:
                patch_skin_id = client['skins'].get('buildinPatchMap', {}).get(patch_parent, {}).get(char_id)
                patch_skin = client['skins'].get('charSkins', {}).get(patch_skin_id)
                group = (patch_skin or {}).get('displaySkin', {}).get('skinGroupId')
                stage = re.fullmatch(r'ILLUST_([012])', group or '')
                if not patch_skin or not stage:
                    raise ValueError('Class-change default illustration has no declared phase')
                evolve = {stage[1]: patch_skin_id}
            if not evolve:
                missing.append({'characterId': char_id, 'region': region, 'reason': 'No declared default evolve artwork'})
                continue
            seen = set()
            for stage, skin_id in sorted(evolve.items(), key=lambda x: int(x[0])):
                phase = int(stage)
                skin = client['skins'].get('charSkins', {}).get(skin_id)
                if phase not in LABELS or phase >= len(character.get('phases', [])):
                    raise ValueError('Artwork phase exceeds native operator progression: ' + char_id)
                if not skin or skin.get('charId') != (patch_parent or char_id):
                    raise ValueError('Artwork skin identity mismatch: ' + char_id)
                if patch_parent and skin.get('tmplId') != char_id:
                    raise ValueError('Class-change artwork template identity mismatch')
                illust_id = skin.get('illustId')
                if not isinstance(illust_id, str) or not illust_id.startswith('illust_' + char_id + '_'):
                    raise ValueError('Artwork illustration belongs to another operator: ' + char_id)
                if illust_id in seen:
                    continue
                seen.add(illust_id)
                asset_id = illust_id.removeprefix('illust_')
                if not re.fullmatch(re.escape(char_id) + r'_[0-9]+\+?', asset_id):
                    raise ValueError('Not a declared base/Elite illustration')
                path = asset_id + '.png'
                file = files.get(path)
                if not file:
                    missing.append({'characterId': char_id, 'region': region, 'phase': phase,
                                    'skinId': skin_id, 'sourceId': illust_id, 'reason': 'Declared full-resolution PNG absent in asset tree'})
                    continue
                key = (char_id, illust_id)
                if key not in variants:
                    asset_path = 'charpack/' + path
                    variants[key] = {
                        'characterId': char_id, 'phase': phase,
                        'variantId': 'elite-' + str(phase), 'variantLabel': LABELS[phase],
                        'sourceId': illust_id, 'assetPath': asset_path,
                        'url': RAW + '/' + commit + '/' + urllib.parse.quote(asset_path, safe='/'),
                        'sourceUrl': 'https://github.com/' + REPOSITORY + '/blob/' + commit + '/' + urllib.parse.quote(asset_path, safe='/'),
                        'sourceKind': 'community', 'assetCommit': commit,
                        'gitBlobSha': file['sha'], 'declaredBytes': file.get('size'),
                        'regions': [], 'nativeDeclarations': []}
                    if patch_parent:
                        variants[key]['classChangeParentId'] = patch_parent
                out = variants[key]
                if out['phase'] != phase:
                    raise ValueError('Conflicting phase for a single native artwork identity')
                out['regions'].append(region)
                out['nativeDeclarations'].append({
                    'region': region, 'locale': locale, 'skinId': skin_id, 'illustId': illust_id,
                    'url': NATIVE + CLIENTS[locale] + '/gamedata/excel/skin_table.json'})
    return sorted(variants.values(), key=lambda row: (row['characterId'], row['phase'])), missing


def plan_previews(rows, tree, commit):
    """Use only a separately declared b export of the identical native asset.

    The mirror documents charpack/*b.png as lower-resolution full illustrations.
    This never substitutes charpor/avatar crops for a complete composition.
    """
    if tree.get('truncated'):
        raise ValueError('Incomplete preview inventory')
    files = {r['path']: r for r in tree['tree'] if r.get('type') == 'blob'}
    out = []
    for row in rows:
        base = row['assetPath'].removeprefix('charpack/')
        if base.endswith('b.png') or not base.endswith('.png'):
            raise ValueError('Preview parent is not an original default/Elite PNG')
        path = base[:-4] + 'b.png'
        declared = files.get(path)
        if not declared:
            continue
        asset_path = 'charpack/' + path
        out.append({**row, 'assetPath': asset_path,
                    'url': RAW + '/' + commit + '/' + urllib.parse.quote(asset_path, safe='/'),
                    'sourceUrl': 'https://github.com/' + REPOSITORY + '/blob/' + commit + '/' + urllib.parse.quote(asset_path, safe='/'),
                    'assetCommit': commit, 'gitBlobSha': declared['sha'],
                    'declaredBytes': declared.get('size'), 'preview': True,
                    'originalGitBlobSha': row['gitBlobSha']})
    return out


def _reuse_verified_identity(row, previous):
    """An unrelated repository commit must not churn immutable URLs/owner frames."""
    old = previous.get((row['characterId'], row['sourceId'], row.get('preview', False)))
    if not old or old.get('gitBlobSha') != row['gitBlobSha']:
        return row
    commit = old.get('assetCommit', '')
    expected = RAW + '/' + commit + '/' + urllib.parse.quote(row['assetPath'], safe='/')
    if not re.fullmatch('[a-f0-9]{40}', commit) or old.get('url') != expected:
        raise ValueError('Previous artwork URL does not match its exact pinned identity')
    if old.get('declaredBytes') != row.get('declaredBytes'):
        raise ValueError('Unchanged Git blob cannot change declared byte size')
    out = dict(row)
    for key in ('url', 'sourceUrl', 'assetCommit', 'width', 'height', 'bytes', 'sha256',
                'ext', 'alphaBounds', 'alphaThreshold', 'hasTransparency'):
        if key in old:
            out[key] = old[key]
    return out


def metadata_artwork(native, tree, commit, previous=None):
    """Metadata-only routine collection; never downloads artwork PNGs.

    `previous` is the prior independently verified receipt list. Missing new
    dimensions are omitted. New same-ID declarations are not image-readback
    evidence, and exact operator/client memberships always come from `native`.
    """
    rows, missing = plan_artwork(native, tree, commit)
    prior = {(r['characterId'], r['sourceId'], r.get('preview', False)): r for r in previous or []}
    previews = {r['sourceId']: _reuse_verified_identity(r, prior)
                for r in plan_previews(rows, tree, commit)}
    result = []
    for row in rows:
        row = _reuse_verified_identity(row, prior)
        if row['sourceId'] in previews:
            row['previewImage'] = previews[row['sourceId']]
        result.append(row)
    return result, missing


def verify_image(body, row):
    if not body.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError('Asset response is not an original PNG')
    if row.get('declaredBytes') is not None and len(body) != row['declaredBytes']:
        raise ValueError('Asset byte size differs from declared Git tree')
    if git_blob_sha(body) != row['gitBlobSha']:
        raise ValueError('Asset bytes differ from declared Git blob')
    with Image.open(io.BytesIO(body)) as im:
        im.load()
        if im.format != 'PNG' or max(im.size) > 16000 or min(im.size) < 1:
            raise ValueError('Invalid original artwork dimensions')
        alpha = im.getchannel('A') if 'A' in im.getbands() else Image.new('L', im.size, 255)
        bounds = alpha.point(lambda a: 255 if a >= 8 else 0).getbbox()
        if bounds is None:
            raise ValueError('Empty transparent artwork')
        return {'width': im.width, 'height': im.height, 'bytes': len(body),
                'sha256': hashlib.sha256(body).hexdigest(), 'ext': 'png',
                'alphaBounds': list(bounds), 'alphaThreshold': 8,
                'hasTransparency': alpha.getextrema()[0] < 255}


def download_original(row, destination, fetch=None):
    if not row['url'].startswith(RAW + '/' + row['assetCommit'] + '/charpack/'):
        raise ValueError('Unapproved asset URL')
    destination = Path(destination)
    destination.mkdir(parents=True, exist_ok=True)
    # Git IDs are verified content identities, so retries never reuse a stale
    # branch asset or another operator's identically named download.
    path = destination / (row['gitBlobSha'] + '.png')
    if path.exists():
        body = path.read_bytes()
    else:
        request = urllib.request.Request(row['url'], headers={'User-Agent': 'GAGETHER-Arknights-Art/1.0', 'Accept': 'image/png'})
        if fetch:
            body = fetch(request)
        else:
            for attempt in range(3):
                try:
                    with urllib.request.urlopen(request, timeout=60) as response:
                        body = response.read(40 * 1024 * 1024 + 1)
                    break
                except Exception:
                    if attempt == 2:
                        raise
                    time.sleep(2 ** attempt)
        if len(body) > 40 * 1024 * 1024:
            raise ValueError('Original artwork exceeds bounded download size')
        verify_image(body, row)
        # Independent bounded collection runs may converge on one immutable
        # blob. Unique temporary files keep their identical atomic writes safe.
        with tempfile.NamedTemporaryFile(dir=destination, suffix='.part', delete=False) as handle:
            handle.write(body)
            temporary = Path(handle.name)
        try:
            temporary.replace(path)
        finally:
            temporary.unlink(missing_ok=True)
    facts = verify_image(body, row)
    return {**row, **facts, 'path': str(path.resolve())}


def collect(native_root, tree_path, commit, destination, workers=4, limit=None, previews_only=False):
    planned, missing = plan_artwork(native_sources(native_root), read_json(tree_path), commit)
    if previews_only:
        planned = plan_previews(planned, read_json(tree_path), commit)
    selected = planned if limit is None else planned[:limit]
    results, errors = [], []

    def job(row):
        try:
            return download_original(row, Path(destination) / 'originals'), None
        except Exception as error:
            return None, {'characterId': row['characterId'], 'variantId': row['variantId'],
                          'url': row['url'], 'error': type(error).__name__ + ': ' + str(error)}

    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, min(6, workers))) as pool:
        for row, error in pool.map(job, selected):
            if error:
                errors.append(error)
            else:
                results.append(row)
            if (len(results) + len(errors)) % 25 == 0:
                print(json.dumps({'downloaded': len(results), 'failed': len(errors), 'selected': len(selected)}, ensure_ascii=False), flush=True)
    result = {'version': 1, 'checkedAt': now(), 'assetRepository': REPOSITORY, 'assetCommit': commit,
              'assetTreeSha': read_json(tree_path)['sha'], 'planned': len(planned),
              'downloaded': len(results), 'complete': len(selected) == len(planned) and not errors and not missing,
              'rows': results, 'missingDeclarations': missing, 'failures': errors,
              'note': 'Original full-resolution PNGs; no re-encoding/downscaling. Phase choices and actual service membership come from each native client. Alpha below8 excluded only in presentation bounds; original bytes untouched. Visual inspection is sampled, not a claim that every source image was manually reviewed.'}
    output = Path(destination) / ('preview-receipts.json' if previews_only else 'artwork-receipts.json')
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--native-root', required=True)
    parser.add_argument('--tree', required=True)
    parser.add_argument('--commit', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--workers', type=int, default=4)
    parser.add_argument('--limit', type=int)
    parser.add_argument('--previews-only', action='store_true')
    parser.add_argument('--metadata-only', action='store_true')
    parser.add_argument('--previous', help='Previous verified full and/or preview receipt JSON; optional')
    args = parser.parse_args()
    if args.metadata_only:
        old = read_json(args.previous) if args.previous else []
        if isinstance(old, dict):
            old = old['rows']
        rows, missing = metadata_artwork(native_sources(args.native_root), read_json(args.tree), args.commit, old)
        result = {'version': 1, 'checkedAt': now(), 'mappingOnly': True,
                  'sourceMappingComplete': not missing, 'downloaded': 0, 'rows': rows,
                  'missingDeclarations': missing, 'failures': [],
                  'note': 'Metadata mapping only; new PNG bytes/dimensions not fetched or claimed verified.'}
        path = Path(args.output) / 'metadata-artwork.json'
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    else:
        result = collect(args.native_root, args.tree, args.commit, args.output, args.workers, args.limit, args.previews_only)
    print(json.dumps({key: value for key, value in result.items() if key not in ('rows', 'missingDeclarations', 'failures')}, ensure_ascii=False))
    if result['failures'] or result['missingDeclarations']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
