# WuWa_Verse1 public post source · 2026-10-25 JST

Scope:12 exact search-discovered Oct22–24,2026 posts by WuWa Universe (@WuWa_Verse1), pinned account ID1794837038853734401. Direct profile read returned HTTP403. This does not mean that the user's browser is blocked or the account is unavailable.

## Successful public access

The official credentialless X oEmbed endpoint and public embed JSON both returned HTTP200 for all12 posts. The JSON verifies exact post ID, account ID, handle, body text, created_at and declared media. The syndication request uses the same deterministic numeric-ID checksum documented in Vercel/react-tweet's public primary source. It is not a guest token, authorization header, session, cookie, private API, fingerprint change or rate-limit workaround. A raw request omitting the public checksum returned200{}; the valid documented embed request returned the actual public embed data. No account login was used.

References:
- https://github.com/vercel/react-tweet/blob/main/packages/react-tweet/src/api/fetch-tweet.ts
- https://help.x.com/en/using-x/embed-x-feed
- https://create.twitter.com/en/products/embedded-tweets

## Deliverables

- registry.json: fixed account, source kind, curated post IDs, profile access limit and mechanism references.
- wuwa-verse-public.mjs: pure reusable request/parser functions; intended to be ported/imported by the isolated server-side leak collector. Exact identity, safe X CDN host/path and publication-time validation; no quoted-tweet media mixing. discoverWuwaVersePosts extracts only exact account/status links from independently readable source-body text. It does not scrape X timelines.
- collect_wuwa_verse.py: reproducible stdlib HTTP research collector, Node only for the public checksum. Bounded3-way requests,20seconds,3MB; first401/403/429 stops new requests. Successful source bytes and separate receipts; failed reads never replace prior successful files. No bypass/retries/credentials.
- collected/posts.json:12 exact authored posts with14 original photo metadata and4 video metadata records. Source type remains unconfirmed community material. No gameplay schedule conversion.
- collected/collection-receipts.json: all24 requests succeeded; original SHA/bytes and checked times. sourceAccess body means the authored text is available through public embed metadata; originalPostViewed remains false.
- media-manifest.json and media/:18 original unchanged image files,14 photos and4 video posters;5,742,202bytes. Every native image's real MIME/dimensions/SHA/bytes verified. No original reencoding/resizing.
- video-head-receipts.json: all4 selected highest-quality MP4 variants returned200 video/mp4 and support byte ranges. This is availability/type verification only. watched=false and playbackVerified=false remain true statements; no video playback or viewing was performed.
- test_public.mjs: actual metadata fixture tests exact account/post validation, original image selection, hostile host rejection, exact quoted-source link discovery and unconfirmed video properties.

## Actual media

-2114039529564713238:3.8 Rover attribute conversion animation,14.116seconds; source declares3840×2160 MP4 plus lower-bandwidth variants.
-2113426381988077758:Lily ultimate,54.316seconds; source declares1920×1080 MP4 plus lower variants.
-2113361612589740499:Lily singing,31.983seconds;916×1022 top rendition.
-2113322228502938106:Lily tester clip,4.109seconds;592×600 top rendition.

A representative latest Lily screenshot was viewed: a text-free in-game-style character screenshot, matching the post's declared material. Other originals are not claimed individually visually inspected. Generic automatic images remain source-image and visuallyInspected:false. Posters are not treated as played video.

## Discovery limit and parent integration

Official profile oEmbed also returned200 but only a timeline anchor—no status links or ordered post collection. There is no verified public full-profile JSON discovery route here. Do not claim continuous whole-profile monitoring from12 curated IDs. Refresh the curated IDs and discover new exact status links inside the already accessible, already classified leak RSS/article bodies. Add each discovered post only after public-embed author+ID validation and leak classification, since the account also posts official news, giveaways and unrelated material.

Source images/videos must remain behind the existing explicit leak-warning gate. Do not mount images, posters, video sources, external embeds or network requests before consent, and do not autoplay after consent. User click may mount direct declared video variants with native controls and a source-post fallback. Keep missing/unavailable media as a source link; never invent replacement thumbnails. Selected video quality must not silently discard higher original variants. No official-calendar/pickup/native alert/Discord mutation.

Videos and source links are metadata; the post text credits GameData,Pero,NeonTeam,Seele,Nanoka,Hiragara,Tester andFS as applicable. Preserve that claimed attribution without representing the aggregate account or any unverified leaker as official. The3.8 banner/rerun images remain rumor records, never operational dates.

Only publish normalized items, fixed registry, code and needed byte-hashed originals. Raw public embed replies/HTML are internal evidence, not executable scripts. Never insert oEmbed HTML directly as trusted application HTML. Preserve previous saved leak values and actual content timestamps on unchanged source hashes or failed updates.
