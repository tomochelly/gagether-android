# Official roster collector

Python 3.10+ standard library, Node20+, and **typescript@5.9.3** only. No credentials. All reads use the published official site/API; downloaded JavaScript is parsed as literals and never executed.

```bash
ROSTER_WORKDIR="$RUNNER_TEMP/gagether-rosters"
npm install --prefix "$ROSTER_WORKDIR" --no-save --no-package-lock typescript@5.9.3
python scripts/official-rosters/collect.py --workdir "$ROSTER_WORKDIR"
```

Copy this directory to the desired repository path (the example uses `scripts/official-rosters`). `--game hi3` or `--game endfield` restricts a run. `--typescript /absolute/path/to/typescript/lib/typescript.js` can point to an existing exact install instead.

Outputs:

- `normalized/hi3.json`: canonical official battlesuits, native names, type/element/available native weapon labels, exact native full-illustration variants with locale.
- `normalized/endfield.json`: official operators,4native names, exact full illustrations, rarity and official native element/class/faction/race.
- `source-outcomes.json`: per-source HTTP/error/rate-limit outcome and SHA256 plus per-game normalization success/failure.
- `hi3-identity-audit.json`: CMS IDs, actual native names, source URLs and identity match method.
- `raw/`: actual downloaded official sources for reproducible parsing. These are internal research inputs, not source-body review completion.

Exit0: all requested games succeeded. Exit1: partial/total failure. A failed game preserves its existing normalized file byte-for-byte. Other games continue. Successful output never deletes previously accepted IDs; source-disappeared IDs are retained and listed. Unchanged roster values preserve the existing output and `checkedAt`. A fresh fetch time is still recorded in the separate outcome report.

Install/download network failure must not be interpreted as an empty roster. Upload outcome reports even on failure; merge successful game files only. This collector does not call live `/api/sync`, edit owner data, deploy, send notifications, or decide per-service release availability. The application owns a merge that preserves owner overrides and existing reviewed detail/media.

HI3 uses111 published suits today, rather than39 base characters. Observed native source coverage: zh111,en110,ko110,ja103. Empty names are source gaps, not inferred non-release. The native sources do not provide numerical combat stats or initial ranks; no values are synthesized from stale community spreadsheets. Chinese reference data does not add an independent CN service for HI3.

HI3 locale variants are accepted only after exact official-name or unique character-specific artwork identity joins, with2explicit reviewed CMS metadata corrections guarded by exact IDs/strings. Names are never paired by array position. New ambiguous identities stop HI3 output and retain its previous success until reviewed.

Endfield finds all script URLs from the actual official homepage. Literal JSON is read via TypeScript AST. The full-art map is selected by the actual `illust:<binding>[key]` relationship, not a minified variable name or a guessed URL. Endministrator full art is chosen by declared tall-original dimensions. Locale dictionaries are identified using native text fingerprints, not bundle array order.

Perlica's inspected full-art original has an English proper-name label, so `image.locale` is`en`. Uninspected Endfield art is not automatically asserted`neutral`. Source payloads can include officially announced future operators; their presence is not proof of current acquisition availability.

`TSCharacters.txt` and`TSPhrases.txt` are frozen Apache2 OpenCC script-normalization dictionaries. Their original URLs/checksums are in`opencc-sources.json`; license is`OPENCC-LICENSE.txt`. They normalize Traditional/Simplified script solely for exact identity matching and do not generate native localized names.

Run recovery-contract checks with `python -m unittest discover -s scripts/official-rosters -p 'test_*.py' -v`. Five checks cover unchanged-value preservation, per-game failure isolation, source omissions, runtime-proxy versus origin403 classification, and bundled dictionary checksums. Parser/source fixture validation evidence is supplied separately in `collector-validation.json`; the production collector itself has no dependency on those research files.
