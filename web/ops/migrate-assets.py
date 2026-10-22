"""Copy fixed-manifest originals to isolated R2 storage; credentials via stdin only."""
import concurrent.futures, hashlib, json, pathlib, sys, time, urllib.request, urllib.error
root = pathlib.Path(__file__).resolve().parent.parent
access = json.loads(sys.stdin.readline())
base = access['url'].rstrip('/')
if base not in ('https://gagether.wiki', 'https://gagether.tomochelly.chatgpt.site'):
    raise SystemExit('Unexpected site origin')
token = access['token']
headers = {'Authorization': 'Bearer '+token, 'OAI-Sites-Authorization': 'Bearer '+token,
           'X-Gagether-Sync-Token': token, 'User-Agent': 'GAGETHER-OriginalAssetMigration/1.0'}
manifest = json.loads((root/'ops/assets-manifest.json').read_text())
def request(path, data=None):
    for attempt in range(4):
        try:
            q=urllib.request.Request(base+path,data=data,headers=headers,method='POST' if data is not None else 'GET')
            with urllib.request.urlopen(q,timeout=90) as r: return json.load(r)
        except urllib.error.HTTPError as exc:
            if exc.code not in [429,500,502,503,504] or attempt==3: raise RuntimeError('HTTP '+str(exc.code)) from None
        except (TimeoutError,urllib.error.URLError):
            if attempt==3: raise RuntimeError('Asset request unavailable') from None
        time.sleep(min(8,2**attempt))
def inventory():
    rows=[]; offset=0
    while offset is not None:
        r=request('/api/asset-storage?offset='+str(offset));rows.extend(r['assets']);offset=r['nextOffset']
    return rows
initial={a['path']:a for a in inventory()}
def upload(a):
    blob=(root/a['path']).read_bytes()
    if len(blob)!=a['bytes'] or hashlib.sha256(blob).hexdigest()!=a['sha256']: raise RuntimeError('Local original mismatch: '+a['path'])
    ready=initial.get(a['path'].removeprefix('public/'))
    if ready and ready.get('ready') and ready['sha256']==a['sha256'] and ready['bytes']==a['bytes']: return a['path']
    url='/api/asset-storage?path='+urllib.parse.quote(a['path'].removeprefix('public/'),safe='')
    r=request(url,blob)
    if not r.get('ok') or r.get('sha256')!=a['sha256']: raise RuntimeError('Upload readback mismatch')
    return a['path']
completed=0
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for path in pool.map(upload,manifest):
        completed+=1
        if completed%25==0 or completed==len(manifest): print(json.dumps({'uploaded':completed,'total':len(manifest)}),flush=True)
rows=inventory()
expected={a['path'].removeprefix('public/'):(a['sha256'],a['bytes']) for a in manifest}
if len(rows)!=len(manifest) or any(not a['ready'] or expected.get(a['path'])!=(a['sha256'],a['bytes']) for a in rows): raise SystemExit('Storage verification incomplete')
receipt={'version':1,'verifiedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'assets':rows}
(root/'ops/asset-migration-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'ok':True,'ready':len(rows),'bytes':sum(a['bytes'] for a in rows)}),flush=True)
