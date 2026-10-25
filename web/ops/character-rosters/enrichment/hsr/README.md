# Honkai: Star Rail native detail collector

`enrich.py` augments only IDs in its input roster. It preserves names, originals,
artwork variants and owner framing. Sources are native Korean/English/Japanese/
Chinese Mar-7th/StarRailRes tables, honestly labeled community. The Korean official
homepage was read first, followed by an official HoYoWiki API sample cross-check.
The homepage HTML is an application shell; the wiki API supplies native identity,
descriptions and tables, but its Korean sample has coarser/differing numeric rows
and is not used to overwrite complete community vectors. Source receipts record
the actual read clock, hash and bytes. See `source-audit.json` for the immutable
official sample receipt; a new collection never invents a new check clock for it.

```bash
python ops/character-rosters/enrichment/hsr/enrich.py \
  --input /canonical/hsr-last-good.json --output /canonical/hsr.json \
  --source-dir /canonical/hsr-source-cache --manifest /canonical/hsr-manifest.json \
  --refresh
python -m unittest discover -s ops/character-rosters/enrichment/hsr -p 'test_*.py'
```

Use `--download-icons --icon-dir /canonical/hsr-icons` for an audited baseline.
Routine collection emits declared source URLs and does not redownload every icon.
The opt-in download preserves original bytes and records SHA256, dimensions,
format, native URL and uses; source URLs are never guessed.
`audit_icons.py --inventory /canonical/hsr-icons/inventory.json --output-dir
/canonical/hsr-icon-audit` verifies every hash/dimension and produces numbered
dark-background contact sheets with an exact source/index map. Originals remain
unchanged.

Panels are Lv.80/ascension6, excluding Light Cones, Relics, Traces and Eidolons.
The source formula is `base[ascension] + step[ascension] * (level - 1)`; HP/ATK/DEF
are floored. Stages overlap at their actual ascension boundary levels. An
independent official HoYoWiki Himeko sample matches1047HP/756ATK/436DEF/96SPD.
All86stage/level combinations remain selectable through exact decimal source
base/step coefficients. Fourteen independently stored endpoint checkpoints must
match the coefficient expansion; no interpolation of rounded panels is used.

Playable E0 skill caps come from exact `character_skill_trees.level_up_skills`
bindings. Extra selectable levels require an exact same-character Eidolon
`level_up_skills` binding. Alternate numeric ID prefixes confer no implicit
bonus. Raw theoretical10/15-level rows beyond actual playable caps remain in
source receipts and are listed in the manifest, without becoming fake levels.

Native skill/major Trace/E1–E6 descriptions remain complete in all four languages.
Parameter templates deduplicate identical numeric vectors without dropping facts.
Minor stat Traces retain their individual source IDs, native titles, source values,
declared glyphs and exact published level/ascension/prerequisite titles in one
table per character. This keeps every character within40skill tables.

Precision is explicitly community-source precision. Decimal arithmetic removes
binary float noise; `[i]` does not truncate genuine fractional percentages. The
normalized source itself may lose digits: March7th shieldLv2=0.4037 versus a
separately published game-table40.38%. No missing digits are reconstructed.
The declared upstream GitHub repository returned451/DMCA; it was not accessed
through alternate routes. Missing native parameters receive a visible localized
unavailable marker and an exact manifest gap; empty source descriptions are not
invented. Raw source receipts preserve the original text/vectors.

Full generated snapshots, icon bytes and recovery pieces are canonical-only.
Do not add them to public GitHub. This directory contains only collector code,
synthetic tests and bounded provenance summaries.

The manifest reports `status:ok` for a successful complete collection containing
explicitly audited published gaps. `gaps` and `unusedTheoreticalRows` distinguish
those source limitations from `fetchFailures`. Fetch/parse/hash errors abort
before writing a roster so the orchestrator retains the full last-good snapshot.
