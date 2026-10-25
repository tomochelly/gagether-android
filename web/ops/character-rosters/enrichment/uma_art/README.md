# Exact-outfit Umamusume complete artwork

`collect.py` improves only existing source forms. The previous collector explicitly
kept seasonal outfits as128px square portraits. The current source declares a
separate768×1024 complete static3D game render for each exact card ID. This is
GameTora-provided game model artwork, honestly labeled community, **not** official
gacha splash art. Existing higher-resolution official full-body originals stay
primary and remain byte-for-byte unchanged.

Korean official portal was read first, followed by Japanese official character
portal, then the public GameTora character page and its declared gallery script.
The successful original script receipt is from before another client reported
403. No alternate route, mirror, proxy or bypass was used. Source HTML/JS receipts
and raw bodies are retained in the native research cache; only bounded provenance
is kept here.

```bash
python ops/character-rosters/enrichment/uma_art/collect.py \
  --input /canonical/umamusume-last-good.json \
  --output-dir /canonical/uma-art \
  --source-dir /canonical/uma-art-source \
  --card-data /canonical/sources/gametora-cards.body --include-official
python -m unittest discover -s ops/character-rosters/enrichment/uma_art -p 'test_*.py'
```

`--card-data` uses the already validated GameTora character-cards source and its
matching `.receipt.json` to link each actual declared `url_name` character page.
Without it, provenance links the exact successfully inspected gallery script.
`--use-source-cache` validates existing source SHA256 receipts instead of fetching
HTML/JS; it may still fetch missing original image files. Existing cached originals
are reused only if bytes/hash/native format match.

The pinned gallery chunk must still be declared by the reference page. If source
chunk names change, inspect and update that declaration explicitly. Never invent
an asset filename, try quality suffixes, substitute another outfit, follow mirrors,
truncate an image or upscale pixels. Every downloaded original records HTTP status,
actual read clock, SHA256, bytes, dimensions, exact source outfit and alpha bounds.
The >16alpha bounds are **metadata only**; image bytes and native dimensions are
never modified. Contacts use cropped alpha extents solely for visual inspection.

Full snapshots, original images and recovery pieces belong in the canonical Site
source, not the public code mirror. The native output `umamusume-art.json` may be
merged by exact character ID using only its image/image-choice fields. Preserve
names, all service availability, stats, owner frames and separately collected
status/history data. Failures retain the exact prior image; a source failure can
never become an empty roster or another costume.
