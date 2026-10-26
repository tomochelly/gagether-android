# Arknights native artwork collection

`artwork.py` joins each actual client's `character_table` and
`skin_table.buildinEvolveMap` / `charSkins.illustId` to a complete fixed
`fexli/ArknightsResource` `charpack` Git tree. This is a community mirror of
native game illustrations, not a claim of publisher-hosted source verification.

The 2026-10-25 source inventory contains 432 primary operators, with 415 in each
KR/JP/Global client. Two separately declared native class-change Amiya forms
bring the distinct form rows to 434 (417 KR/JP/Global). The declared base/Elite
join has 833 unique full originals: 432 initial illustrations, 400 Elite 2
illustrations, and Amiya's distinct Elite 1 illustration. All paths exist in
the non-truncated charpack tree. Elite 2 art is
preferred for an operator's default presentation where that actual client
declares it. Low-rarity operators without Elite 2 retain the initial illustration.

Asset source commit: `184aa662f210100150716d4f58cadc0b4e3642fc`.
Charpack tree: `49a5e1d6316b5defc67f047225f7fd6882bc2220`.
These 833 original files total 2,937,953,154 declared bytes. Full-resolution PNG
bytes are never resized, cropped or re-encoded. Every download must match the
tree's Git blob SHA and byte length before dimensions, SHA256 and alpha bounds
are recorded. A download failure remains a failure; no other outfit is used.

## Preview exports

The mirror separately declares 514 matching `b.png` full-composition preview
exports (169 initial, 345 Elite 2), totaling 592,704,084 verified bytes. They are
separate source exports, never replacements for full originals. No avatar or
half-portrait is treated as a complete illustration. A gallery can use the
preview while details/original viewing retain the full source. When a b export
is absent, that is explicit; do not synthesize a filename or downscale the
original and call it a source export.

Sample checks: Amiya Elite 2 original 2248×2248 / 4,444,236 bytes; corresponding
preview 1024×1024 / 1,201,704 bytes. Jacinta Elite 2 original 2372×2372 /
6,558,195 bytes; preview 1024×1024 / 1,471,743 bytes. Both full compositions and
their preview counterparts were inspected with normal alpha compositing.
Elite 2 art includes surrounding structures, sky/ground or effects, while the
outside is transparent. Hidden RGB under alpha=0 may look like texture strips
in a raw image viewer, but normal browser compositing correctly hides it. Do
not alter the source PNG to remove invisible RGB. Alpha>=8 bounds are derived
presentation geometry only. This is sampled visual QA, not a claim that every
operator artwork was manually inspected.

Additional full-original samples were inspected: Mon3tr Elite 2 (2560×2560 /
7,411,259 bytes), Guard Amiya (2048×2048 / 4,463,407 bytes), and Medic Amiya
(2560×2560 / 8,197,936 bytes). The two class-change forms have distinct correct
blade/healing-staff compositions. Mon3tr's native illustration includes stylized
English `RHODES ISLAND` lettering; do not claim the entire corpus is text-free.

## Completed download verification

At 2026-10-25T23:17Z all 833 full originals and all 514 separately declared
preview exports completed actual downloads and exact Git blob/size/SHA256,
native-dimension and nonempty-alpha validation, with zero missing declarations
and zero failed files. Full PNG bytes total 2,937,953,154; preview bytes total
592,704,084. Eight focused unit tests pass, including native class identities,
regional isolation, incomplete/incorrect image rejection, immutable-byte reuse,
separate preview identity and metadata-only URL preservation. Original corpus
files remain unchanged. Canonical project pinning, UI integration and deployment
are separate owner-agent work and are not claimed completed by this collector.

## Routine collection

`metadata_artwork(native, tree, commit, previousVerifiedRows=None)` performs no
PNG download. It returns `(rows, missingDeclarations)`, with exact regional
membership and an optional `previewImage`. `native` is a dictionary keyed by
ko/en/ja/zh, each holding `characters` and `skins` native tables.

Pass prior verified full and preview rows together to preserve immutable URLs,
dimensions/hash/alpha geometry when the exact native source ID and Git blob are
unchanged. An unrelated repository commit must not invalidate owner image
placements. New blob dimensions stay absent until actually read, never guessed.
Metadata-only completeness means the source identity join is complete; it does
not claim that new original bytes were downloaded or visually inspected.

CLI `--metadata-only [--previous receipt.json]` writes `metadata-artwork.json`.
The manual full collection writes `artwork-receipts.json`. `--previews-only`
writes a separate `preview-receipts.json`. PNGs use verified Git blob SHA names
under the selected output's `originals/` directory. `--limit` is available for
bounded development samples and never changes the complete source inventory.

Amiya's Guard/Medic class changes are bound as distinct form IDs using native
`char_patch_table.infos.tmplIds` / `patchChars`,
`skin_table.buildinPatchMap`, the exact skin `tmplId` and its declared
`displaySkin.skinGroupId` Elite phase. Their native `skin.charId` legitimately
remains base Amiya; that alone must not merge the class forms or copy Caster
stats into them. Missing parent/template/phase proof fails rather than guessing.
