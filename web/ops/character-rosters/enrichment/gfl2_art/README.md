# GFL2 complete official character illustrations

The former `gfl2.help/static/images/chara/full/...` images are often cropped
small portraits. For example the successfully read Groza source is376×512 and
ends at her thighs. Its filename is not proof of a complete illustration.

The Korean official character page exposes59 explicit `full-img data-src` popup
originals. The official Korean and English `allroles.html` lists share numeric
role IDs. This collector joins those IDs, the exact official Korean name, and
the complete-image declaration. It does not use page order or repeated CSS class
indices. `Balthilde` in the existing community database corresponds exactly to
`Bathilde` in the official EN list through the already reviewed same-role Korean
name 바틸다; no fuzzy aliases or neighboring forms are permitted.

Korean official sources are read before English identity data. Sources are fixed
ordinary public pages; no guessed filenames, quality suffixes, mirrors, proxies,
authentication or access-block bypass. A blocked/partial source produces a failed
phase and preserves the caller's last-good art. Partial asset failures retain
those exact prior character images. The collector never claims a source page's
59 characters establish regional release eligibility.

```bash
python ops/character-rosters/enrichment/gfl2_art/collect.py \
  --input /canonical/gfl2-last-good.json \
  --source-dir /canonical/gfl2-art-sources \
  --output-dir /canonical/gfl2-art
python -m unittest discover \
  -s ops/character-rosters/enrichment/gfl2_art -p 'test_*.py'
```

`--use-source-cache` verifies source URL/SHA receipts and marks them cached replay,
never a fresh source read. Original byte caches also require exact SHA256 and
valid native image dimensions. There is no re-encoding, resize, crop or upscaling.
Alpha>16 bounds are separate presentation metadata. All new images are labeled
`full-body` and “official complete character illustration”, not gacha splash art.
They use verified neutral classification after inspection: no localized text is
visible in the delivered originals, even where the CDN path contains `tw`.

The checked2026-10-25 inventory contains59 unique original URLs/SHA256 values,
18,542,938 total bytes, source dimensions955–4092px, HTTP200 for every asset. Six
contact sheets were visually inspected and show complete characters, including
weapons/effects/scenery when part of their original. Dynamic and standing poses
remain intact. New source records must be visually rechecked before claiming
the same inspection. `art-audit.json` contains bounded provenance/asset metadata;
complete source snapshots and raw image bytes stay in canonical source storage.

## Integration

Run this independent artwork phase after GFL2 detail enrichment. Pass the complete
last-good/enriched document and merge only `image`/`images` by the exact character
ID and source identity. `apply_records` preserves names, availability, stats,
skills and all owner frames; it retains the former cropped portrait as an image
alternative. It is idempotent when the official image is already primary.

Pin all native originals by exact SHA/bytes in the canonical artwork manifest.
For deployment-size control, verified original provider URLs can use the existing
`source-original` delivery: keep native bytes in canonical Git and omit only their
byte-identical packaged duplicates. Never change original dimensions/quality or
publish full canonical snapshots/recovery parts to the public code mirror.

Tests cover independent numeric-role joins, known exact spelling alias, rejecting
wrong names/forms/paths, rejecting non-popup/untrusted/duplicate declarations,
owner/stat/availability/old-image preservation, asset failure and native bounds.
