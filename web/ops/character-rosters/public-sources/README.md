# GAGETHER public character roster collector

Python 3.11+ standard library only. This package reads fixed public sources and writes local JSON. It contains no credentials, HTTP ingest client, source edits, deployment commands, player-account queries, or access-limit workarounds.

```sh
python collect_rosters.py --workdir .roster-cache
python collect_rosters.py --workdir .roster-cache --games holodreams
python -m unittest discover -s . -p test_collector.py -v
```

The package is self-contained: `bootstrap/` supplies 13 last-known roster snapshots, `asset_policy.py` uses `asset-classification.json`, and `collect_rosters.py` contains all exact public URLs and normalizers. It does not require the earlier research directory or downloaded fixtures. Workdir can be outside the checkout.

## Outputs and delivery contract

- `WORKDIR/normalized/<game>.json`: generic `{gameId, sourceName, sourceUrls, checkedAt, characters, coverage, sourceVersion?}` records.
- `WORKDIR/run.json`: per-game `updated|unchanged|failed`, `eligibleForIngest`, `changed`, verified source fetch statuses, failures, counts and output paths.
- `run.json.ingestFiles`: only games whose **every required source was freshly checked** during this run (HTTP200 or validated304). Failed-game bootstrap/last-good files are excluded.
- `run.json.changedFiles`: only changed, fresh successful games. This is the preferred list for a separate delivery job to avoid unnecessary writes.
- `WORKDIR/sources/<game>/`: validated source cache and ETag/Last-Modified metadata. Cache this directory between GitHub Actions runs. Art-source trees are relatively large.

Delivery and credentials belong to the parent integration. Do not blindly upload every file under `normalized/`: failed games may have a recovery bootstrap copied there. Read `run.json` eligibility. Partial success exits0 by default; zero successful games exits1. `--strict` exits1 on any failed game after saving successful games and the manifest.

## Failure behavior

Each game runs independently, with at most three concurrent games by default (`--workers`, maximum4). Retries apply only to temporary network failures/408/429/5xx. HTTP403 is blocked and is never retried through another host. HTTP200 JS shells, missing expected source arrays, bad JSON, duplicate IDs, language ID-set mismatch, and truncated GitHub trees fail validation. Source payloads are validated **before** replacing last-good cache files. A drop of more than25% of a prior/bootstrap normalized roster is rejected for review.

Failure preserves prior output exactly; if no prior output exists, the bundled bootstrap is copied as recovery data. It is not marked fresh or ingest-eligible. Within successful games, omitted images are preserved only for the same source-form ID with a matching observed name. New valid images can replace prior ones. Factual output is sorted by stable source ID; unchanged output retains its previous `checkedAt`.

## Evidence and scope

`asset-classification.json` records representative `view_image` visual inspections, exact sample URLs/SHA256 values, source-class language decisions and per-file exceptions. It is **not** a per-file visual audit of the entire library. `image.locale` uses the observed source asset class; unknown providers/classes receive no neutral label. Exact exceptions take precedence. Arknights art is a mixed class with English in-world livery, so no class-wide neutral declaration is made; two inspected files are explicitly `en`. GFL2 and Holo member images are cropped portraits; Stella CG images are scene/splash illustrations, not guaranteed full-body.

The source index is a character/form catalog. Membership does not establish a current pickup, release date, current server schedule, or official translation. Explicit future flags are excluded where supplied, but some client repositories lack release flags. Never derive current pickups or exact debut dates from these records. Native source names are joined only when supplied; English-only community catalogs leave other languages blank. No community review paragraphs or rankings are copied. DNA currently has atlas-only icons, so its standalone `image` is omitted. Catalog gaps are reported in coverage rather than filled with guessed characters or images.

Source/art licenses are not exhaustively established by this package. Preserve provenance and game copyright ownership. This package does not redistribute the providers' wrapper source code.

## Verification

- Live clean-workdir run: holodreams54 official members,54 images, successful Japanese/English source fetch and parse.
- All13 normalizers parsed their actual fetched public source fixtures successfully (`offline-smoke-result.json`). This is an offline replay, not a fresh13-game online run.
- Reliability unit tests cover blocked fetch preservation, invalid HTTP200 preservation, JS-only rejection, truncated trees, duplicate IDs, partial-count guard, exact-form image preservation, locale policy exceptions, and unchanged timestamp preservation.
