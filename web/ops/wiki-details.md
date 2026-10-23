# Wiki-backed entity details

Official regional notices establish pickup/event dates. Community databases supply exact game-specific attributes, numeric stats, upgrade materials and native icons. `content/wiki-sources.json` records all15games and actual source-access scope; an accessible page is not a completed import.

`content/entity-catalog.json` contains versioned entity/outfit profiles. `saveEntries` supplements matching featured entities in the same game and allowed service; lower-rarity members and different outfits do not match. Existing detailed stats/skills and owner overrides take priority. Enrichment is idempotent and does not alter schedules, artwork or rewards. New entities require source investigation before extending this catalog.

Upgrade costs live in `entityDetails[].materials`, separate from `rewards`. Materials support optional localized names, exact native icons and quantities. Empty localized names render icon+quantity. The owner editor supports uploading/selecting those icons and editing quantities/groups. Material IDs are unique within each group; icons and source URLs pass the same HTTPS/provenance checks as other details.

`content/trait-icons.json` and `content/stat-icons.json` map exact same-game labels to reviewed native files. Legacy Blue Archive attack/armor/weapon trait IDs normalize before matching. Owner-supplied icons take priority. Atlas material rectangles, source hashes and original pixel sizes are preserved in `content/wuwa-material-provenance.json`; no banner is recropped or replaced.

Authenticated `/api/collection` includes `wiki` coverage with live profile, native-icon and material-group counts plus unprofiled pickup IDs. Historical and service-duplicate occurrences are included; gaps are not a successful-collection flag. Unreachable sources remain listed with their actual access status.

Regression checks: `node --test tests/wiki-details.test.mjs` covers profile matching, service/outfit isolation, sparse refresh preservation, material validation/rendering, BA icon aliases, curated notice-body collection, reward isolation and all15source records. Full project regression: `node --test tests/*.test.mjs`.

Body-fetch scheduling uses one slot per actual game/service before filling additional slots, ordered by the oldest actual body attempt. Metadata-only feed touches do not advance that attempt timestamp. Bounded retries and reviewed-body protection remain unchanged.
