"""Verify deployed code without publishing the canonical-only roster snapshot.

The owner-authorized private exceptions are data files, individually pinned by the checked-in
production manifest. A new/mutated deployment, missing code or hash mismatch
still fails. This is code-mirror verification, not a complete data backup.
"""
import hashlib, json, pathlib, urllib.request
CANONICAL_ONLY=frozenset([
 "content/additional-game-assets.json",
 "content/additional-game-entries.json",
 "content/arknights-gallery-focus.json",
 "content/arknights-preview-images.json",
 "content/artwork-audit-2026-10-16.json",
 "content/assets-hoyo-provenance.json",
 "content/assets-kuro-asset-sources.json",
 "content/assets-other-exact-audit.json",
 "content/assets-others-manifest.json",
 "content/bluearchive-reviewed-banners.json",
 "content/catalog-preview-images.json",
 "content/character-rosters/artwork-manifest.json",
 "content/character-rosters/bootstrap.json",
 "content/character-rosters/recovery/manifest.json",
 "content/character-rosters/rejected-artwork.json",
 "content/character-rosters/restricted-artwork.json",
 "content/combat-display.json",
 "content/combat-research.json",
 "content/community-others-notes.json",
 "content/endfield-gallery-focus.json",
 "content/entity-catalog.json",
 "content/excluded-source-images.json",
 "content/foresight.json",
 "content/four-games-gallery-focus.json",
 "content/full-artwork-review-2026-10-16.json",
 "content/gallery-focus-runtime.json",
 "content/gallery-framing-runtime.json",
 "content/gallery-protected-heads.json",
 "content/gallery-subject-bounds.json",
 "content/gfl2-combat-catalog.json",
 "content/holodreams-gallery-focus.json",
 "content/hoyo-localization-research.json",
 "content/hoyo-localized.json",
 "content/hsr-announced-roster.json",
 "content/hsr-gallery-focus.json",
 "content/kuro-image-audit.json",
 "content/kuro-localization-research.json",
 "content/kuro-localized.json",
 "content/leaks/bootstrap.json",
 "content/leaks/source-media.json",
 "content/leaks/x-artwork-manifest.json",
 "content/limbus-reviewed-releases.json",
 "content/maintained-artwork.json",
 "content/maintained-video-notices.json",
 "content/maintenance-gallery-focus.json",
 "content/migrations/pickup-rewards-20261024.json",
 "content/native-icon-provenance.json",
 "content/nikke-recruit-pool.json",
 "content/nte-announced-roster.json",
 "content/nte-profile-sources.json",
 "content/official-pickup-updates.json",
 "content/official-video-channels.json",
 "content/others-adapters-assets.json",
 "content/others-additions-research.json",
 "content/others-additions.json",
 "content/others-localization-research.json",
 "content/others-localized.json",
 "content/pickup-member-icons.json",
 "content/pickup-thumbnail-focus.json",
 "content/release-additions-20261025.json",
 "content/research-hoyo.json",
 "content/research-kuro-hypergryph.json",
 "content/research-others.json",
 "content/reviewed-broadcast-media.json",
 "content/reviewed-owner-artwork-repairs.json",
 "content/reviewed-pickup-artwork.json",
 "content/reviewed-roster-information.json",
 "content/reviewed-trickcal-pickups.json",
 "content/reward-assets.json",
 "content/reward-catalog.json",
 "content/roster-detail-icons.json",
 "content/roster-material-icons.json",
 "content/silver-palace-roster.json",
 "content/stat-icons.json",
 "content/trait-icons.json",
 "content/uma-selection-art-review-2026-10-17.json",
 "content/upcoming-games.json",
 "content/version-art-review-2026-10-17.json",
 "content/wiki-icon-additions.json",
 "content/wuwa-announced-roster.json",
 "content/wuwa-build-guides.json",
 "content/wuwa-character-videos.json",
 "content/wuwa-combat-artwork.json",
 "content/wuwa-combat-image-repairs.json",
 "content/wuwa-convene-character-cards.json",
 "content/wuwa-convene-media.json",
 "content/wuwa-convene-weapons.json",
 "content/wuwa-equipment-catalog.json",
 "content/wuwa-equipment-images.json",
 "content/wuwa-material-provenance.json",
 "content/wuwa-reference-artwork.json",
 "content/wuwa-reference-framing.json",
 "content/wuwa-reference-splashes.json",
 "content/wuwa-reference.json",
 "content/wuwa-upcoming-3-8.json",
 "content/wuwa-wastes-tokens.json",
 "content/zzz-combat-catalog.json",
 "content/zzz-equipment-images.json",
 "content/zzz-reviewed-artwork.json"
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
 print('::notice::Runtime code mirror verified. Owner-excluded data files are hash-pinned and retained in the private source overlay; the GitHub snapshot is not a complete production data backup.')
 summary=__import__('os').environ.get('GITHUB_STEP_SUMMARY')
 if summary:
  with open(summary,'a') as f: f.write('Runtime code mirror verified: '+str(result['codeFilesVerified'])+' files.\n\nOwner-excluded data: exact hashes are recorded in ops/private-source-manifest.json; restore the private overlay before building.\n')
if __name__=='__main__': main()
