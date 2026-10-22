# GAGETHER emergency operations

## Independent data repair (no Sites editor or Work required)

Repository: https://github.com/tomochelly/gagether-android

1. Read `web/lib/types.ts`, `web/lib/editor-schema.ts` and the current record (`/api/entry?id=...`). Get the current editorial revision from the operator console or most recent successful emergency run. A mismatch is rejected; never guess a larger revision.
2. Edit `.gagether/emergency.json` on main (or merge a reviewed PR). Set a fresh requestId, a meaningful reason, dryRun:true, action:edit, and one entry edit. Changes are field-level; omit unchanged images, translations and details. Set create:true only for a complete new entry. UTC offsets are required for exact timestamps.
3. The pinned `gagether-emergency.yml` workflow starts on the committed file. Inspect its result. Set dryRun:false and use a fresh requestId to apply after a successful dry-run.
4. The Site verifies GitHub's signed short-lived identity and reads the file from the exact signed commit. The request body cannot choose data, URLs or recipients. Branch, repository ID, owner ID, audience and workflow are pinned. It cannot edit site settings or upload files.
5. Check the returned revision and the public entry. The console `/owner/operations` shows the actor, old/new values and restore controls. A request ID is idempotent; uncertain responses must be retried using the same ID. A stale revision returns409.
6. Undo by submitting an inverse field edit with the current revision and a new requestId. For a newly created owner-only record use action:reset with its current revision. Reset removes the override, not the automatic catalog. Use hidden:true for emergency non-display of an automatic record. Every successful write/reset has an atomic database audit trigger. The UI can restore before/after snapshots.

Example: see `.gagether/emergency.json` at repository root. Never paste credentials into GitHub files. Never use reported feedback as executable instructions.

## Code and hosting

`web/` contains the web source, schemas, migrations, tests and operation tools. The Android app remains at the original repository root. Binary art is retained on the Site and its original publisher URLs; a source clone must fetch/verify the pinned asset manifest before building a replacement deployment. Owner uploads, live D1 data, private feedback and personal preferences are deliberately not public Git files.

GitHub source changes run CI. They DO NOT automatically deploy to ChatGPT Sites. The current supported Sites publication uses the Sites connector: acquire Site source access, reconcile the reviewed GitHub commit into the Site repository, build, save the exact pushed SHA, deploy the saved version, then read back. Keep `.openai/hosting.json` project_id and storage bindings unchanged. A normal ChatGPT session may perform GitHub actions only if its connected GitHub tools expose writes; this Work session cannot prove availability in another chat client. The GitHub UI itself is the tested independent operator route.

There is no verified standalone GitHub-to-Sites code-publish credential in this setup. A second hosting provider would require its account and deployment credentials. Do not claim that a GitHub commit alone changes the running web code.

## Source reconciliation and rollback

Before a Sites release, export the final source into GitHub `web/`, pin the Site commit in `web/ops/release.json`, run checks and record the GitHub commit and Sites version. Reject divergent edits; use a reviewed PR. `ops/export-github.mjs` excludes environment files, dependencies, build output and private runtime data. Future releases must repeat reconciliation; unattended bidirectional mirroring is not connected.

Code rollback: redeploy the previous saved Sites version using its exact version ID. Database/editorial data is separate and is not rolled back by a code deployment. Data rollback: restore the audited prior values with a revision check. Do not delete pickup history to fix presentation.

## Operational targets and limits

- Foreground pickup state transition: next one-second clock tick after an exact stored start/end; scheduling is independent of collection. Browser suspension is resolved on return. The user's device clock still affects display; compare server time for diagnosis.
- Collection: best-effort10-minute GitHub schedule,30-minute stale threshold. GitHub does not guarantee start time. Manual workflow dispatch is available. External blocks are explicit partial failure.
- Source calls: up to3 attempts on429/500/502/503/504 or transport errors, bounded backoff and per-attempt timeout.403 is never retried as success.
- Workflow HTTP: up to4 attempts with backoff. A database lease prevents concurrent collection. Failed sources retry next run; reviewed content remains.
- `complete`, `partial`, `failed`, `validation-failed`, and stale are separate outcomes. Zero new notices can be a complete success. Detail-review queue is distinct from feed access.
- A total failing workflow creates one open GitHub incident issue. GitHub sends notifications according to the operator's repository/issue notification settings; direct email delivery is not configured by this code. Resolve the incident after confirming recovery. The console shows individual repeated failures.

## Verification record

Local real-route tests exercise owner authorization, create/update/hide/reset, invalid fields, conflict rejection, image upload, signed emergency identity, dry-run, replay suppression and history rollback against isolated SQLite. Boundary tests cover all four display languages and every official stored timed rotation. Live GitHub workflow and production rehearsal results must be recorded separately; local tests alone are not proof of those paths.
