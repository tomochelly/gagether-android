# NTE native default artwork recovery

`output/nte.json` preserves the existing 24 roster IDs and upgrades every primary image to a large native default-outfit composition. Zero defaults to female source ID 1051; male source ID 1046 is a separate selectable image. Gender labels come from `CharGenderType`, not visual inference.

`output/manifest.json` describes 25 originals totaling 77,113,020 bytes: exact source paths, native IDs, name keys, English/Korean names, source URLs, native dimensions, Git blob hashes, SHA256 values, byte counts and local paths. `output/assets/<sha256>.png` contains unchanged source bytes.

`collect_nte_art.py` is a reusable standard-library collector. Its callable interface is `enrich(document, cache_dir, asset_dir=None, reference=None)`. By default it selects the latest commit whose actual README explicitly says Global, rather than blindly taking the newest CN commit. It validates immutable source references, native names, declared CharacterIllustration paths and the complete source asset tree. Metadata mode reads normal PNG headers; download mode checks full bytes against the source Git blob hash.

`global-equivalence.json` records independent comparison of Global 1.4.5 (`cef09a29...`) and CN 1.4.13 (`1816e237...`). All 25 asset paths have identical Git blob hashes and sizes. Native IDs, name keys, English/Korean names and illustration paths also match the Global table. The manifest keeps the actual CN download URL and the Global identity evidence, proving that the downloaded bytes are the same Global originals.

`test_art_replay.py` verifies an offline replay of actual Global source bytes, all 24 identities, both Zero genders, unchanged repeated output, rejection of copied-name dummy rows, and input preservation. The resulting roster passes the current project's strict schema.

## Classification and limitations

The native 2160×2560 canvases are complete CharacterIllustration source files. Some files intentionally stop at the knees or thighs, so they use `kind: card` and the caption “기본 외형 원본 일러스트 · 클라이언트 추출”. Do not call them complete feet/full-body art or gacha splashes, or synthesize missing anatomy. Native dimensions were read from the PNGs, not assumed from directory names.

These are common native Global client art files rather than localized promotional posters. Some outfits contain fixed decorative Latin lettering. Neutral means the same common native asset, not a claim that every pixel is text-free. All 25 were inspected together on a labeled, normally alpha-composited gray contact sheet; the full native Adler image was inspected separately. This is not an individual pixel-by-pixel visual audit of every file. `native-defaults-review.jpg` is the analysis sheet; saved originals are unchanged.

Dummy rows 1056 (bat) and 1091 (radio) copy Lacrimosa's name, and 1091 points at Linko art. The collector uses actual manual-playable row 1004 for Lacrimosa and explicitly identified gender rows for Zero. It never blindly merges all matching names.

Artwork does not establish release/current pickup dates. No owner data, schedules or private data were changed. No image conversion, cropping or upscaling was applied. Publish only required originals, the fixed manifest, normalized roster and helper; do not publish raw source caches or complete copied Localization tables.
