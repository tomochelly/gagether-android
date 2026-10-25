"""Verify deployed code without publishing the canonical-only roster snapshot.

The three exceptions are data files, individually pinned by the checked-in
production manifest. A new/mutated deployment, missing code or hash mismatch
still fails. This is code-mirror verification, not a complete data backup.
"""
import hashlib, json, pathlib, urllib.request
CANONICAL_ONLY=frozenset([
 'content/character-rosters/bootstrap.json',
 'content/character-rosters/artwork-manifest.json',
 'content/character-rosters/recovery/manifest.json',
])
def verify(root, live):
 root=pathlib.Path(root)
 expected=json.loads((root/'public/source-manifest.json').read_text())
 receipt=json.loads((root/'ops/source-mirror.json').read_text())
 entries=expected.get('entries')
 if expected.get('version')!=1 or not isinstance(entries,list): raise RuntimeError('Unsupported source manifest')
 paths=[r.get('path') for r in entries]
 if any(not isinstance(p,str) or p.startswith('/') or '..' in p.split('/') for p in paths) or len(set(paths))!=len(paths): raise RuntimeError('Invalid runtime source paths')
 digest=hashlib.sha256(json.dumps(entries,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
 if expected.get('fingerprint')!=digest or receipt.get('runtimeFingerprint')!=digest: raise RuntimeError('Invalid pinned production fingerprint')
 if live!=expected: raise RuntimeError('Production changed; reconcile the new deployment before updating its receipt')
 omitted=receipt.get('canonicalOnly')
 if not isinstance(omitted,list) or set(omitted)!=CANONICAL_ONLY or len(omitted)!=len(CANONICAL_ONLY): raise RuntimeError('Invalid canonical-only data scope')
 mismatches=[]
 for row in entries:
  path=row['path']
  if path in CANONICAL_ONLY: continue
  file=root/path
  if not file.is_file() or file.is_symlink() or hashlib.sha256(file.read_bytes()).hexdigest()!=row['sha256']: mismatches.append(path)
 if mismatches: raise RuntimeError('GitHub code and deployed Site differ: '+', '.join(mismatches))
 if not CANONICAL_ONLY.issubset(set(paths)): raise RuntimeError('Pinned canonical data hashes are missing')
 return {'fingerprint':digest,'codeFilesVerified':len(entries)-len(CANONICAL_ONLY),'canonicalOnlyDataFiles':sorted(CANONICAL_ONLY),'siteVersion':receipt['siteVersion']}
def main():
 root=pathlib.Path(__file__).resolve().parents[1]
 request=urllib.request.Request('https://gagether.wiki/source-manifest.json',headers={'User-Agent':'GAGETHER-OfficialRefresh/1.0 (+https://github.com/tomochelly/gagether-android)'})
 with urllib.request.urlopen(request,timeout=30) as r: live=json.load(r)
 result=verify(root,live)
 print(json.dumps(result))
 print('::notice::Runtime code mirror verified. Three roster data files are hash-pinned and retained in the native Site source; the GitHub snapshot is not a complete production data backup.')
 summary=__import__('os').environ.get('GITHUB_STEP_SUMMARY')
 if summary:
  with open(summary,'a') as f: f.write('Runtime code mirror verified: '+str(result['codeFilesVerified'])+' files.\n\nCanonical-only roster data: 3 hash-pinned files; full data is retained in native Site source.\n')
if __name__=='__main__': main()
