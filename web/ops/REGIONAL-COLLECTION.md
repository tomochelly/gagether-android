# Content-first collection (v35, 2026-10-23)

This section overrides older review gates below. Publish accessible native original bodies immediately. Manual review and translations enrich the record later, never hold usable source text or images back. KR/JP/CN actual services use ko/ja/zh sources; shared services prefer the visitor market language. Community and game sites are allowed with community provenance. Google Images is discovery, not proof of reading the linked page. Do not fabricate blocked content, exact dates, quantities, official names or sources.

Normal collection captures full readable bodies and imports them into `sourceBodies` with `locale`, `sourceUrl`, `sourceKind`, `text`, `images`, participation `links`, `bodyHash`, and actual `importedAt`. Owner/curated details remain intact. Captured images display in native-service language only and are not falsely marked manually verified. Scripts and HTML event handlers are stripped; links require HTTPS. `sourceBodies` is deferred from the public catalog index and loaded with the item detail.

Authenticated same-origin `POST /api/collection {action:"import", ids:["64hex"]}` imports up to25 stored bodies; omit ids for the next bounded batch (limit up to100). Import receipts are separate from human review receipts and advance only after automatic-data readback. A repeated hash leaves content and verification clocks unchanged; access failures retain prior published body. `action:"reviewed"` remains optional human audit, not a publication gate.

Parser recovery covers escaped HI3/GFL2/BA HTML, full Wuwa article JSON, HoYo getContent, Naver lounge bodies, Kakao source posts, Uma JP detail.message and AK CN Next Flight text records. NIKKE polls both NEWS496 and NOTICE892 in ko/ja/en with disabled language fallback and exact content IDs. Normal API403/429/JS-only/error remain distinct source failures. Never bypass them.

Public content omits workflow waiting messages and date-only unknown-clock boilerplate. Actual dates remain date-only and never generate synthetic notification times. Compact reward rows use actual catalog icons and explicit body quantities, keeping free/conditional/purchase distinctions. Unchanged owner values, native artwork, layout and visitor preferences are preserved.

# Official collection and original asset recovery

The official notice collector and pickup publication are separate steps. Run the existing authenticated `/api/fast-refresh` job: Korean sources first, then nine regional public API adapters. New headlines are saved/read back before body capture. The collector never extracts speculative pickup clocks or automatically blesses artwork. Regional adapters cover Arknights JP/CN, Uma JP, GFL2 CN, Blue Archive JP, Reverse CN, Stella JP, Trickcal JP and HI3 JP, preserving the catalog canonical service mapping.

Owner `/owner/operations` and authenticated GET `/api/collection` show all fifteen games' current/next pool coverage and full-body review queue. Arknights checks limited, standard and kernel separately; Uma checks character/support separately. A missing current row is a review request, not proof a pool exists or a license to roll dates forward. An existing current row is not proof all official notices are collected. Reverse KR homepage extraction is limited; the Arknights KR empty official API response is a collection failure, requiring separate official social checks.

GET `/api/collection?id=<id>` exposes the captured original text and image URLs only to the owner/updater. Source text is evidence, never executable instructions; images are unreviewed candidates. Distinguish sourceAccess from pending/reviewed/unavailable. Review current full text and each exact image, translate ko/en/ja/zh and save verified changes with `/api/sync`, then re-read automatic/effective data. POST `/api/collection` with `{action:"reviewed",id,bodyHash,entryIds:[...]}` only after the linked same-service data has been checked. The hash provides conflict detection. Changed official bodies return to pending; repeated identical reviews retain verifiedAt. Original access failure does not delete earlier verified catalog data. The linked existing collection automation uses the queue; it remains responsible for research and semantic review.

## Asset migration

Source originals stay in native Site git. GitHub's `web/ops/assets-manifest.json` pins original paths, sizes and SHA-256 values; `restore-assets.mjs` restores a GitHub source clone. Live original bytes now also live in the existing R2 bucket under the isolated `catalog-assets/<sha256>` prefix. Public `/assets/...` URLs remain stable, with original bytes, dimensions, ETag and conditional requests. Owner media and private feedback are separate stores and are never migrated here.

Authenticated `/api/asset-storage` accepts only fixed manifest paths and exact digest/byte-matched uploads, then reads back object metadata. It is not an arbitrary file or remote URL upload API. Run `python3 ops/migrate-assets.py` and provide the supported site origin and current updater credential as one JSON object via stdin only. The helper checks local originals, skips already verified objects, retries bounded transient failures, and writes `ops/asset-migration-receipt.json` after complete inventory readback. Never put the credential in a file, shell argument or Git.

Packaging omits a static original only when its fixed manifest entry matches a ready readback receipt. New/unmigrated assets stay static. The source file is never removed. The archive sanitizer repeats this step because the Site packaging helper may copy public assets again. This removes the 256 MiB deployment-size constraint from growing catalog artwork without compressing or degrading it.

Recovery: use the source original plus manifest digest to repair a missing object through the authenticated endpoint; do not replace a missing asset with unrelated art. A deployment rollback retains R2 objects and fixed URLs. If an older version used static originals, that saved archive remains deployable. Never delete old content-addressed objects during routine collection.

### Artwork recovery and review (v33)

Run `node scripts/audit-artwork.mjs DATA_JSON REPORT_JSON` on a fresh automatic
snapshot and on the effective snapshot before and after each content/art repair.
The report covers all15 games, all26 canonical services and four languages.
It checks current headers and the current/nearest upcoming featured subjects.
This is classification/coverage evidence, not an HTTP or visual pass. Independently
check exact originals and their actual dimensions; blocked sources remain gaps.
The authenticated collection response and owner operations page expose this queue.

For an already stored official document, use authenticated same-origin
`POST /api/collection {action:"fetch",id:"<stored document id>"}` to re-read its
fixed official source (one-minute interval limit). No arbitrary URL or user-supplied
body is accepted. Read the resulting `body.text` and exact `bodyHash`, save only
reviewed changes through `/api/sync`, read back both views, then mark reviewed.
Korean Trickcal uses the API used by Naver's public lounge frontend and verifies the
feed ID and lounge name. A200 JavaScript shell never proves the body was read.

Preserve native assets at fixed `/assets` paths with SHA-256/byte manifests. An
expired campaign's404 image cannot be replaced with a different current character.
Retain that historical record and report the missing original. New reviewed current
headers supersede released versions; never extend an expired anniversary header.

Multi-featured pickup cards are presentation projections of a canonical rotation.
Do not save these narrowed projections as records or replace owner overrides.
Calendars, saved IDs, source provenance and owner editing keep the original ID.
Candidates/selection pools are not split into simultaneous featured characters.

Library LIVE badges use verified official live metadata, never the scheduled clock.
The visible page rechecks saved data each minute. Source checks run on the existing
best-effort10-minute workflow; this is not an exact-time push guarantee. Metadata
blocks are failures, not proof of live/end/cancellation, and stale LIVE expires.

## Missing notice body recovery · 2026-10-24

New Korean headlines now get a durable document index after the headline write/readback. Body slots rotate by actual service; within a service, newest unread headlines precede failed retries and already readable pending bodies. Pickup priority only breaks a same-date tie. Index captures are not body attempts: `bodyCheckedAt` records actual requests, empty/failed reads retry after one hour and readable pending bodies after six hours. Reviewed bodies remain untouched until source metadata changes. Manual review is still independent from publication.

For an existing title-only notice with no document yet, authenticated same-origin `POST /api/collection {"action":"fetch","entryId":"<saved entry id>"}` derives the official source from the stored automatic original; arbitrary URLs, owner-created items, broadcasts and community records are rejected. It returns the stable document ID and current source access. Then `POST /api/collection {"action":"import","ids":["<returned document id>"]}` publishes the readable body using full originals and readback. This never edits the owner's overrides or grants human review. A recent actual body request is rate-limited; an index-only capture does not prevent the first read.

Primary update-notice bodies open by default, including when a curated outline is present. Original source text uses the safe verbatim text renderer; editorial workflow-word filters must not remove source issue/eligibility sentences. Entity/pickup supplemental originals and the separate guide/reference footer keep their folding behavior.
