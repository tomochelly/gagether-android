# PATCHWORK data operations

The Site is public. Existing writes require the updater token or editor identity. The fast collector has a separate, narrowly scoped GitHub OIDC trigger.

The live, self-contained instructions are available at `GET /api/operations`. Existing Site service access is obtained using Sites `get_site` and sent as `OAI-Sites-Authorization: Bearer <token>` to this Site origin only. Credentials are never stored in this repository, a schedule, or browser code.

- `POST /api/refresh`: seven official feeds; writes official notice metadata only. It never guesses banner dates or prices.
- `GET /api/data`: source-backed seed records merged with persisted D1 records. `persistent:false` indicates a storage problem; seed information remains available.
- `POST /api/sync`: provenance-validated, localized structured data; maximum 100 entries. Exact schema and rules at `/api/operations`.
- Stable entry IDs make repeated updates idempotent. Writes are followed by a GET readback.
- Browser preferences and saved IDs are device-local. Product data is held in D1.

## Region policy

UI language is independent of service region. Global/Asia, Korean, Japanese and Chinese services are never assumed equivalent. Where Global schedules vary by regional server, the initial beta uses the verified Asia time. Arknights EN follows its own official UTC−7 schedule. Korean and Chinese service coverage is still being researched; an empty state is intentional.

Unknown times stay null. Publication/visibility timestamps from CMS feeds are not gameplay dates. Unknown money prices stay absent. Premium currency is not presented as fiat. Conflicting official statements are documented in `timingNote`.

## QA

Run `node scripts/validate-content.mjs`, `node node_modules/typescript/bin/tsc --noEmit`, then the Sites build helper. Managed browser QA is unavailable when the control-browser skill is absent; do not improvise a browser path.

## Deployed source verification

On 2026-10-16, Genshin, Honkai Star Rail, Zenless Zone Zero, Wuthering Waves, Arknights Global, and Blue Archive Japan each returned eight official notices through the deployed Worker. Umamusume returned HTTP 403 in the deployed environment, despite successful research access; its records remain the last confirmed snapshot and the source state reports failure. Do not claim this feed is connected or bypass access restrictions. Consult independently accessible official sources for its curated updates.

An open board checks stored data every five minutes and refreshes official feeds if all last checks are older than fifteen minutes. Unattended structured record updates use the linked cloud task.

## Fast collection and hourly review

- `POST /api/fast-refresh`: runs the predefined Korean official adapters, existing localized feeds, official YouTube stream discovery and player status checks. It accepts no caller-supplied content or URLs.
- GitHub workflow: `tomochelly/gagether-android/.github/workflows/gagether-refresh.yml`, main branch, at minutes 7/17/27/37/47/57. GitHub may delay/drop queued runs or disable scheduled workflows after 60 days of repository inactivity. The site reports actual completion, not an unconditional freshness guarantee.
- Authentication uses GitHub RS256 OIDC, pinned issuer/audience/repository ID/owner ID/workflow/ref. No permanent Site token is copied to GitHub. Existing `/api/sync` and `/api/refresh` permissions are unchanged.
- D1 holds a bounded execution lease and the most recent result. `GET /api/fast-refresh` exposes actual source checks, last completion, partial failures and changed notice IDs for hourly review.
- Minimal new notices have no invented gameplay time, price, images or foreign official names. Existing reviewed content and owner edits survive. Changed existing notices await hourly review.
- YouTube metadata is read without watching. New scheduled/live programs are separate update records; no PVs/premieres or completed historical streams are imported as live events. Existing broadcasts use atomic compare-and-swap patches. Unreadable/private/bot-challenged pages remain unresolved, not cancelled.
- The hourly task still researches every actual service, complete pickup rosters, regional notices, translations and artwork. Bilibili status and cancellation announcements needing interpretation remain in that review.
- Workflow source is retained in `ops/gagether-refresh.yml`. Pause it in GitHub Actions to stop the ten-minute trigger without changing hourly research.
