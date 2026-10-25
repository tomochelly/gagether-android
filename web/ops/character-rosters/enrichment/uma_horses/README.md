# Umamusume real-horse backgrounds

`collect.py` builds a deduplicated historical catalogue for the exact existing
character/outfit IDs. It never substitutes a fictional game biography for the
real horse's record, and never adds a new character or service.

```bash
python ops/character-rosters/enrichment/uma_horses/collect.py \
  --roster content/character-rosters/bootstrap.json \
  --cache /canonical/uma-horse-cache --refresh \
  --output /canonical/uma-horses.json --audit /canonical/uma-horses-audit.json
python -m unittest discover \
  -s ops/character-rosters/enrichment/uma_horses -p 'test_*.py'
```

The four GameTora files are discovered from its published manifest, using the
same URL construction declared by the site's public client. The authoritative
relationship is explicit `characters.char_id = character_rl_details.char_id`,
with the historical JBIS identifier and date of birth. The source's optional
`race` field is neither a species guarantee nor required: it is absent/false for
many known horses. Name similarity alone never binds a horse.

The Korean official home page is read first. The Japanese official About page
explains that the characters inherit names and histories from real racehorses.
Historical numerical facts and pedigree/race rows come from GameTora, clearly
attributed as community data. Japanese Wikipedia's actual horse infoboxes are
independently checked by exact Japanese name and complete birth date, not a
title-only match. This rejects alcohol, flower, weapon and unrelated-name pages.
The saved baseline matches all135 real horses.37 matching JRA official profiles
were actually read and their birth dates and total records cross-checked; other
profiles must not be presented as independently JRA-verified.

Biographies contain freshly generated factual summaries in Korean, English,
Japanese and Chinese, dates, sex, optional sourced death/coat, sire/dam, selected
victories and actual pedigree connections to other represented horses. Proper
names use native source spellings; unlocalized parent names retain the English
or Japanese original. No encyclopedia prose, photo or fictional anecdote is
copied. No missing death date becomes an assertion that the horse is alive.

Scratches (`dns`) and excluded entries are not counted as starts. Complete
source race dates may supply an omitted career-year range; incomplete dates do
not. Sirius Symboli's source lists22of26starts, so its list is representative,
never claimed complete. Victories retain actual dates and source names. Their
historical grade overrides take precedence when choosing highlights; the UI
does not relabel an old win with today's G1 status. A three-race same-year
milestone requires three actual winning records, including a source-declared
alternate course when applicable. It does not invent a Triple Crown from a
character's fictional training objectives.

Raw source/cache receipts, the full generated catalogue and detailed audit stay
in canonical storage. Runtime integration stores deduplicated profiles inside
the protected roster snapshot; only one requested character's background is
hydrated, and the section starts collapsed. Do not add the full catalogue or raw
source bodies to the public GitHub mirror. This directory contains collector
code, synthetic tests and bounded provenance only.

The baseline read at2026-10-25 downloaded the published source files with actual
HTTP200/hash/byte/read-clock receipts. A direct JBIS request returned403; it was
stopped rather than bypassed, and no JBIS direct verification is claimed.
Historical raw sources may change. Fresh HTTP/JSON/hash/identity failures raise
before output replacement; callers retain the last good catalogue.
