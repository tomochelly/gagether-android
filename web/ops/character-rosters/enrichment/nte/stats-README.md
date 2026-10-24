# NTE source-bound detailed stats

Deliverables: `output/patches.json` (fact fields only, preserve parent artwork), `output/nte.json` (full snapshot for inspection), `output/manifest.json`, `enrich_nte_details.py`, `nte-detail-assets.json` (must sit beside helper).

Current results for all24 stable roster IDs:

- Kaiden's actual1–80 HP/ATK/DEF tables,1,920 rows. Kept as explicitly labeled provider tables, never relabeled as independently verified game-final panels.
- Raw Global1.4.5 client CRIT rate/CRIT DMG/Ultimate-energy-cap/energy-efficiency fields. Each has its own source basis, separate from Kaiden level panels.
-96 main native-client skill tables,549 source-bound numerical rows at skill levels1–13. All titles and labels use actual Korean/English/Japanese/Chinese client localization, not invented Korean names. The Zero male variant adds4 separate source abilities.
-96 exact primary-declared skill icons;24 element icons verified in the Global Git tree. Arc icon paths are declared in the game tables but absent from the repository, so they are omitted rather than guessed.
-48 native client passive descriptions,189 complete native awakening/resonance effects,24 concise console specialization facts. No community build recommendations or flavor/AFFIX text copied. Three awakening descriptions have incomplete or unbound native text and are recorded as omitted.
- Native element/arc labels and localized interface role labels; rarity hasS/A labels and an internal sort ordinal, not a claim of stars.

Primary dataset is pinned commit `cef09a29d4d92c7b1e0b950d89ba8c75b1c529e7`; its fetched README explicitly says1.4.5(Global). Current main `1816e237...` says1.4.13(CN), and is not used for these mechanics. The snapshot does not infer current pickups or introduce an independent Chinese service.

Exact source identities are joined against the native English name only after excluding nonmanual dummy rows. Actual Lacrimosa is1004, not the bat/radio clones1056/1091. Zero is explicitly resolved to female1051 by default; male1046 has distinct source skill coefficients. Both genders point to exactly the same base, growth and breakthrough packs, but different ability IDs and coefficient expressions; they receive `variantDetails` independently. Do not display female coefficients behind the male original.

Important discrepancy: Kaiden Adler80=13122/382/912, Neverness.app reader=8638/272/600. Raw client base+growth+breakthrough component composition was not independently established, so no guessed sum replaces those provider panels. The source tables and exact version remain explicit. Raw primary CRIT/energy fields are direct declarations and not inferred from either site's HP math.

Coefficients bind only declared damage/DEF/HP arrays, effect-curve keys with explicit constant/linear interpolation, or literal numeric client templates. Unknown/ambiguous curves and unbound placeholders are omitted in the manifest, never zero-filled. Binary floating point noise is formatted to at most3decimal places. Values are coefficients, not simulated final damage; gear/awakening effects are not added.

The helper reads fixed public URLs only, uses inert JSON/HTML parsing, and never executes downloaded scripts or changes production. `enrich('nte', document, cache_dir, offline=False)` returns `(doc,report)`. Its default fetches sources normally. `--offline` is an explicit replay; missing files fail rather than silently fetching. Source/identity failures must retain the caller's prior snapshot. Output is idempotent and retains input clocks, artwork, regions and roster IDs. The parent should merge `patches.json` fields by stable ID, preserving newly repaired originals.

Current raw downloaded source files in global-client/ and kaiden/ are research cache only; do not publish the complete localization files. Source URL/byte hashes and normalization mode are in the manifest.

Validated: all24 exact IDs and native locales; unchanged original art/regions;80 source rows per character;13 coefficient values per included row; no unresolved placeholders in passive/awakening text; primary native names including 우미츠키/레이븐/구원;96verified skill-icon paths; explicit gender-specific Zero23% versus19.2% first basic coefficients; idempotent reapplication. All outputs fit the parent request-size limit (compact roster <1MB).
