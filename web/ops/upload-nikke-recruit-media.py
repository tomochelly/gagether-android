"""Exact reviewed NIKKE media only. Existing Site identity arrives through hidden stdin."""
import getpass, hashlib, json, pathlib, sys, urllib.request
root = pathlib.Path(__file__).resolve().parent.parent
directory = pathlib.Path(sys.argv[1]).resolve()
base = 'https://gagether.wiki'
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError('Unexpected redirect; identity was not forwarded')
opener = urllib.request.build_opener(NoRedirect)
token = getpass.getpass('Existing Site identity (hidden): ')
headers = {'OAI-Sites-Authorization': 'Bearer '+token, 'X-Gagether-Sync-Token': token,
           'Origin': base, 'Content-Type': 'video/mp4'}
manifest = json.loads((root/'content/nikke-recruit-media.json').read_text(encoding='utf-8'))
receipt = []
for clip in manifest['clips'] + manifest.get('sounds', []):
    data = (directory/(clip.get('rank',clip.get('id'))+'.mp4')).read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    if digest != clip['sha256'] or len(data) != clip['bytes']:
        raise RuntimeError('Reviewed clip mismatch')
    url = base+'/api/nikke/convene-media/'+digest
    with opener.open(urllib.request.Request(url, data=data, headers=headers, method='POST'), timeout=60) as response:
        result = json.load(response)
    if not result.get('ok') or result.get('sha256') != digest:
        raise RuntimeError('Upload readback failed')
    with opener.open(urllib.request.Request(url, headers={**headers,'Range':'bytes=0-65535'}), timeout=60) as response:
        if response.status != 206 or response.read() != data[:65536]:
            raise RuntimeError('Public range mismatch')
    with opener.open(urllib.request.Request(url,headers=headers), timeout=60) as response:
        if response.status != 200 or hashlib.sha256(response.read()).hexdigest() != digest:
            raise RuntimeError('Public full hash mismatch')
    receipt.append({**result,'rank':clip.get('rank',clip.get('id')),'sitePathRangeReadback':65536,'sitePathFullHashReadback':True})
    print(json.dumps(receipt[-1]), flush=True)
(root/'ops/qa/nikke-recruit-media-upload.json').write_text(json.dumps(receipt, indent=2)+'\n', encoding='utf-8')
