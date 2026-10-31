"""Upload only reviewed simulator clips to this Site; credentials via hidden stdin."""
import getpass, hashlib, json, pathlib, urllib.request
root = pathlib.Path(__file__).resolve().parent.parent
base = 'https://gagether.wiki'
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError('Unexpected redirect; credentials were not forwarded')
opener = urllib.request.build_opener(NoRedirect)
token = getpass.getpass('Site token (hidden): ')
headers = {'OAI-Sites-Authorization': 'Bearer '+token,
           'X-Gagether-Sync-Token': token, 'Origin': base,
           'Content-Type': 'video/mp4'}
manifest = json.loads((root/'content/wuwa-convene-media.json').read_text())
rows = manifest['clips'] + manifest.get('characters', [])
receipt = []
for row in rows:
    digest = row['sha256']
    if len(digest)!=64 or any(c not in '0123456789abcdef' for c in digest):
        raise RuntimeError('Invalid reviewed clip hash')
    data = (root/'ops/research/wuwa-convene-media'/(digest+'.mp4')).read_bytes()
    if len(data)!=row['bytes'] or hashlib.sha256(data).hexdigest()!=digest:
        raise RuntimeError('Reviewed clip mismatch')
    url = base+'/api/wuwa/convene-media/'+digest
    with opener.open(urllib.request.Request(url, data=data, headers=headers, method='POST'),timeout=50) as response:
        result = json.load(response)
    if not result.get('ok') or result.get('sha256')!=digest:
        raise RuntimeError('Upload readback failed')
    with opener.open(urllib.request.Request(url, headers={**headers,'Range':'bytes=0-65535'}),timeout=50) as response:
        part=response.read()
        if response.status!=206 or part!=data[:65536] or response.headers.get('Content-Type')!='video/mp4':
            raise RuntimeError('Public ranged bytes mismatch')
    receipt.append({**result,**({k:row[k] for k in ['grade','characterId','audio'] if k in row}),'rangeReadback':65536})
    print(json.dumps(receipt[-1]),flush=True)
(root/'ops/qa/wuwa-convene-media-upload.json').write_text(json.dumps(receipt,indent=2)+'\n')
