"""Bounded native details + declared artwork metadata; no artwork bulk downloads."""
import argparse, copy, json, pathlib, re, urllib.request
from enrich import enrich, download_native, atomic
from artwork import native_sources, metadata_artwork, plan_artwork, plan_previews
from pack import encode

API = 'https://api.github.com/repos/fexli/ArknightsResource/git/'
BASELINE = '184aa662f210100150716d4f58cadc0b4e3642fc'

def github(path):
    with urllib.request.urlopen(urllib.request.Request(API + path, headers={'User-Agent': 'GAGETHER-ArknightsReference/1.0', 'Accept': 'application/vnd.github+json'}), timeout=45) as response:
        body = response.read(4_000_001)
        if response.status != 200 or len(body) > 4_000_000:
            raise ValueError('Asset inventory response exceeded bound')
        value = json.loads(body)
        if value.get('truncated'):
            raise ValueError('Asset inventory is incomplete')
        return value

def current_inventory():
    commit = github('ref/heads/main')['object']['sha']
    if not re.fullmatch('[a-f0-9]{40}', commit):
        raise ValueError('Invalid fixed repository commit')
    root = github('trees/' + commit)
    node = next(r for r in root['tree'] if r['path'] == 'charpack' and r['type'] == 'tree')
    return commit, github('trees/' + node['sha'])

def bind_artwork(document, rows):
    out = copy.deepcopy(document)
    by_id = {}
    for row in rows:
        by_id.setdefault(row['characterId'], []).append(row)
    for character in out['characters']:
        candidates = by_id.get(character['id'], [])
        if not candidates:
            continue
        images = []
        for row in sorted(candidates, key=lambda r: -r['phase']):
            if set(row['regions']) != set(character.get('regions', [])):
                raise ValueError('Artwork is not shared by all declared operator services')
            image = dict(url=row['url'], sourceUrl=row['sourceUrl'], kind='splash' if row['phase'] == 2 else 'full-body', locale='neutral', sourceKind='community', variantId=row['variantId'], variantLabel=row['variantLabel'])
            for key in ('width', 'height'):
                if key in row:
                    image[key] = row[key]
            # Preview lookup is a separate public presentation registry. Keep
            # the existing JSON image contract readable by already-open clients.
            images.append(image)
        old = [character.get('image'), *character.get('images', [])]
        character['image'] = images[0]
        # Old standing originals remain available in details; shared client
        # illustration identity is not a language-specific campaign poster.
        alternatives = {a['url']: a for a in [*images[1:], *[{**a, 'locale': 'neutral'} for a in old if a]] if a['url'] != images[0]['url']}
        character['images'] = list(alternatives.values())
        if len(character['images']) > 10:
            raise ValueError('Native artwork alternatives exceed bound')
    return out

def main():
    p = argparse.ArgumentParser()
    for field in ('input', 'output', 'native-dir', 'report'):
        p.add_argument('--' + field, type=pathlib.Path, required=True)
    p.add_argument('--refresh', action='store_true')
    args = p.parse_args()
    download_native(args.native_dir, args.refresh)
    doc, report = enrich(json.loads(args.input.read_text()), args.native_dir)
    try:
        commit, tree = current_inventory()
        native = native_sources(args.native_dir)
        # Reuse the original immutable URL for every unchanged known Git blob,
        # so unrelated repository updates cannot discard existing owner frames.
        if commit == BASELINE:
            baseline_tree = tree
        else:
            root = github('trees/' + BASELINE)
            baseline_tree = github('trees/' + next(r['sha'] for r in root['tree'] if r['path'] == 'charpack'))
        previous, _ = plan_artwork(native, baseline_tree, BASELINE)
        previous += plan_previews(previous, baseline_tree, BASELINE)
        rows, missing = metadata_artwork(native, tree, commit, previous)
        doc = bind_artwork(doc, rows)
        report['artwork'] = dict(status='partial' if missing else 'ok', assetCommit=commit, variants=len(rows), missing=missing, bulkImageDownloads=0)
        if missing:
            report['status'] = 'partial'
    except Exception as error:
        report['artwork'] = dict(status='failed', error=str(error), bulkImageDownloads=0)
        report['status'] = 'partial'
    _, wire = encode(doc)
    atomic(args.output, wire)
    atomic(args.report, report)
    if report.get('status') != 'ok':
        raise SystemExit(1)

if __name__ == '__main__':
    main()
