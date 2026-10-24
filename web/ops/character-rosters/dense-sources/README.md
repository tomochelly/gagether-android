# Blue Archive / Umamusume public roster collector

`collect_dense_rosters.py` is self-contained and uses Python 3.10+ standard library only. It has no dependency on the research directory, existing `/tmp` files, Site credentials, or a delivery service.

```sh
python scripts/collect_dense_rosters.py --refresh --workdir "$RUNNER_TEMP/dense-rosters"
```

Copy the collector into the repository's `scripts/` directory before using that command. `--root` is an alias of `--workdir`. With no refresh flag, missing sources are fetched and existing raw files may be reused; production runs should always use `--refresh`. An optional `GITHUB_TOKEN` increases the normal public GitHub API rate limit and is sent only to `api.github.com`; it is never logged.

Outputs:

- `WORKDIR/normalized/bluearchive.json`
- `WORKDIR/normalized/umamusume.json`
- `WORKDIR/normalized/run.json` — success marker and SHA-256 hashes of both outputs.

`sourceVersion` is a string. Each document contains source URLs, actual collection time, complete supported native names, stable outfit IDs, rarity, traits, supported regions, basic stats with explicit basis, exact image mapping, and coverage limits. A parent synchronizer must compare meaningful fields and preserve owner edits and unchanged verified times. The collector never writes to GAGETHER or deploys.

## Current coverage

| Game | Source forms | Exact images |
|---|---:|---|
| Blue Archive | 278 | 274 neutral full bodies |
| Umamusume | 271 | 135 official original racewear full bodies, 136 exact outfit portraits |

Blue Archive flags: JP278, Global264, CN212. Only JP/Global/KR are emitted as applicable GAGETHER regions; KR follows Global. CN flag is retained in source coverage, not enabled as an independent BA service.

UmaTools has EN/JP names and JP/Global availability, with no Korean progression. Missing KO/ZH names remain empty and KR availability is not copied. Primary outfit IDs ending `01` plus exact native Japanese name plus official visual title `勝負服` are required to use official racewear. Alternate outfits keep their own portrait. Numeric values are community-source data with the stated source basis, not invented Lv.90 values.

## Normal public sources

- https://ba.joexyz.online/api/students
- https://github.com/jozsefsallai/ba-tools
- https://api.github.com/repos/nico0748/SchaleDB/git/trees/main?recursive=1
- https://raw.githubusercontent.com/nico0748/SchaleDB/main/data/en/localization.json and actual `jp`, `kr`, `zh` equivalents.
- https://raw.githubusercontent.com/daftuyda/UmaTools/main/public/assets/uma_data.json
- https://api.github.com/repos/daftuyda/UmaTools/git/trees/main?recursive=1
- https://umamusume.jp/character/ — publicly rendered inline `__NUXT_DATA__`, not an invented/private API.

Exact art URLs come from declared repository paths or official frontend data. HTTP401/403 aborts without bypass or retry on another hostname. HTTP429/5xx and network failures retry at most twice, waiting at most30 seconds per retry. JS-only, missing source data, truncated asset trees, duplicated IDs, and a source inventory below the known minimum fail with nonzero exit status. A decrease below the previous successful output also fails. Both documents are validated before either normalized output is replaced. The last successful normalized files remain intact on collection/validation failure; parent delivery should require exit0 and validate `run.json` hashes.

Raw sources may have refreshed before a later failure. They are diagnostic cache, not a successful normalized snapshot. Do not treat cache existence or HTTP200 as collection success.

## Tested

- Fresh empty work directory with `--refresh`: HTTP sources fetched, normalized outputs created; BA278 and Uma271, string source versions.
- ID uniqueness, language-key structure, declared asset paths, native official base-outfit mapping, and success-manifest hashes.
- Raised minimum-count failure: nonzero exit and byte-identical prior normalized outputs.
- HTTP403 unit probe: one normal attempt, no retries, explicit `blocked` status.

Mapping checks are not a claim of complete per-image visual inspection. Exact source identities and source-native dimensions are preserved. Unmeasured portrait dimensions are omitted.
