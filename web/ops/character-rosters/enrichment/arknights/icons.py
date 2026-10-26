"""Archive declared native skill glyph bytes without changing their pixels."""
import argparse, concurrent.futures, hashlib, io, json, pathlib, re, urllib.parse, urllib.request
from PIL import Image
from enrich import ICON_COMMIT, ICON_SOURCE, atomic

def collect(urls, tree, destination):
    if tree.get('truncated'):
        raise ValueError('Incomplete skill glyph inventory')
    files = {r['path']: r for r in tree['tree'] if r['type'] == 'blob'}
    destination = pathlib.Path(destination)
    destination.mkdir(parents=True, exist_ok=True)
    def read(url):
        if not url.startswith(ICON_SOURCE):
            raise ValueError('Unexpected glyph source')
        filename = urllib.parse.unquote(url[len(ICON_SOURCE):])
        declared = files.get(filename)
        if not declared or not re.fullmatch(r'skill_icon_[a-zA-Z0-9_\[\]-]+\.png', filename):
            raise ValueError('Glyph was not declared by the native skill identity')
        path = destination / (declared['sha'] + '.png')
        if path.exists():
            body = path.read_bytes()
        else:
            request = urllib.request.Request(ICON_SOURCE + urllib.parse.quote(filename), headers={'User-Agent': 'GAGETHER-Arknights-Glyph/1.0'})
            with urllib.request.urlopen(request, timeout=60) as response:
                body = response.read(4_000_001)
                if response.status != 200 or len(body) > 4_000_000:
                    raise ValueError('Glyph response exceeded bound')
        git_sha = hashlib.sha1(b'blob ' + str(len(body)).encode() + b'\0' + body).hexdigest()
        if git_sha != declared['sha'] or not body.startswith(b'\x89PNG\r\n\x1a\n'):
            raise ValueError('Glyph original differs from the declared Git blob')
        with Image.open(io.BytesIO(body)) as image:
            image.load()
            if image.format != 'PNG' or min(image.size) < 8 or max(image.size) > 4096:
                raise ValueError('Invalid original glyph dimensions')
            width, height = image.size
        path.write_bytes(body)
        return dict(gameId='arknights', sourceKind='community', sourceId=filename[:-4], url=url, assetCommit=ICON_COMMIT, gitBlobSha=git_sha, httpStatus=200, bytes=len(body), sha256=hashlib.sha256(body).hexdigest(), ext='png', width=width, height=height, path=str(path.resolve()))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        rows = list(pool.map(read, sorted(set(urls))))
    atomic(destination / 'icon-receipts.json', dict(status='ok', rows=rows, count=len(rows)))
    return rows

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--report', type=pathlib.Path, required=True)
    p.add_argument('--tree', type=pathlib.Path, required=True)
    p.add_argument('--output-dir', type=pathlib.Path, required=True)
    args = p.parse_args()
    rows = collect(json.loads(args.report.read_text())['declaredIconUrls'], json.loads(args.tree.read_text()), args.output_dir)
    print(json.dumps(dict(count=len(rows), bytes=sum(r['bytes'] for r in rows))))
