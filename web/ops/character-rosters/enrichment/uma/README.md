# Umamusume service-scoped details

This collector augments only the exact outfit IDs in its input. It preserves
names, source IDs, full originals and owner framing. It does not add a Chinese
gameplay service. The supported service keys are Japan, Korea and Global.

```bash
python ops/character-rosters/enrichment/uma/enrich.py \
  --input /canonical/umamusume.json --output-dir /canonical/uma-details \
  --source-dir /canonical/uma-sources --refresh --download-icons
python -m unittest discover -s ops/character-rosters/enrichment/uma -p 'test_*.py'
python ops/character-rosters/enrichment/uma/audit.py \
  --original /canonical/umamusume.json --roster /canonical/uma-details/umamusume.json \
  --catalog /canonical/uma-details/catalog.json
```

The Korean official homepage is read first. It is not presented as a complete
numerical source. The actual values and native text are community data from
GameTora's declared public manifest and UmaTools. Source receipts preserve each
HTTP status, actual read time, URL, byte count and SHA256. The GameTora JSON URL
template and native icon paths were read from an already-successful public JS
source cache. A separate request for current static JS returned403; it was not
retried through another route. Routine collection reads the public JSON manifest
and its declared objects, never executes website scripts or guesses hashes.

Natural-rarity through5-star initial panels use published integer rows only.
UmaTools' natural/4/5-star rows are cross-checked against GameTora; intermediate
2/3-star rows omitted by UmaTools come directly from GameTora's dedicated fields.
There is no interpolation, fabricated training level, or addition of growth
bonuses to the initial panel. Factors, support cards and training bonuses are
excluded. Aptitudes and training growth rates stay separate.

Release dates and skill bindings are scoped to the actual service. A source
`skills_awakening_en` list wins over the Japanese list, including an explicit
empty list or unavailable marker. Evolutions require the source's explicit
matching service declaration. Skill `loc` overrides replace the same fields
as GameTora's viewer, while nested inherited skill overrides preserve other
published inherited fields. Low-star and upgraded uniques that point to the
same inherited skill produce only one inherited table.
Low-star uniques carry an explicit1–2-star display range; upgraded and high-star
uniques carry3–5stars. Inherited unique information also requires3+stars, matching
the Green spark rule in the successfully read GameTora Legacies guide.

The catalog stores complete ready-to-render SkillTable objects by content hash,
and each exact outfit points to its own per-service table references. It carries
unique, initial, awakening, evolution, event and inherited unique skills. No
theoretical skill-level slider is invented. Native descriptions, activation
checks, skill-point costs, base durations and numerical effects are retained.
Conditional scaling is explicitly marked as a published base value; no unknown
multiplier is guessed. Evolution requirements preserve their AND-of-OR grouping.
If a newly published inherited skill has no prose in any native source locale,
its actual cost, activation and numerical rows remain; no description is invented.
Where no native English requirement string exists, the Japanese original is
shown with an explicit original-language label. Source-facing raw conditions
and full vectors are preserved in separately archived source bodies, rather
than exposing implementation expressions in the product.

Image downloads are optional for a reviewed baseline. All originals are kept
byte-for-byte with declared URLs, hashes, dimensions and format; no resizing or
upscaling is applied. Future unchanged icons can reuse their validated receipts.
The source image family has70px stat symbols,64px skill symbols and50px aptitude
grades; these are native sizes, not4K assets. Download errors remain explicit.

The light source roster stays below4.4MB. The full generated catalog and images
belong only in the existing canonical Site storage, not the public GitHub code
mirror. The parent compiler may losslessly pack per-outfit detail payloads into
the existing protected snapshot to keep initial lists and Worker memory bounded.
HTTP/parse/identity/shape/math failures stop generated-output replacement and
retain the previously published snapshot.
