# GAGETHER · Sites → Cloudflare Workers 이전 인수인계

확인일: 2026-10-31. 이 문서는 Sites 안에서 완료한 작업과 별도 이전 담당자가 확인할 사항을 구분한다. 확인되지 않은 사항은 **미확인**이다. D1/R2 원본, 피드백·사용자 데이터, 시크릿 값은 이 문서와 공개 저장소에 포함하지 않는다.

## 1. 배포 및 소스 기준

- 기존 기본 화면: https://gagether.wiki/ko
- Orbit 별도 화면: https://gagether.wiki/orbit/ko
- Orbit v306 구현·검증·배포를 먼저 완료했고, v307은 승인받은 운영자 백업 기능을 추가한 최종 배포다.
- 프로젝트: `appgprj_6ad1ef24b5c08191a367cd141de63a3a` (공개 사이트).
- Sites version ID: `appgprj_6ad1ef24b5c08191a367cd141de63a3a~appgver_0dec98900c7c8191a179a74739cfff57`.
- deployment ID: `appgdep_6ae5c644e9ec8191a3a02c207de8a0f1`.
- 배포 성공 시각: `2026-10-31T10:43:40.537141+00:00`.
- Sites 게시 소스 SHA: `651abafcf4978c4dd8c8a1706ab8db7cb39ce87b`.
- 런타임 fingerprint: `951a3c8a59c514d2c54e16a6d44c325cab3169f2026b8f3529c9c9d03ca40ff0`.
- 저장한 배포 아카이브: 267,601,920 bytes, SHA-256 `41c30b93fd02f46c2d1102b368928d353e542d0ba958a8096d9bdb244a5093ef` (배포 빌드이며 개인정보 백업 파일이 아니다).
- GitHub 소스 반영 커밋: `0ef3aae11ea8e35313916190bc2b798dda08bee5`. 저장소 `tomochelly/gagether-android`, 브랜치 `main`, 경로 `web/`.
- 전체 런타임 913개 중 **814개 공개 동기화 + 99개 비공개 파일 해시 고정**. 사용자가 공개 제외를 명시 승인했으므로 공개 GitHub 단독 체크아웃은 전체 배포 소스가 아니다. 비공개 overlay를 적용해야 동일 소스를 재구성한다.
- `ops/export-github.mjs`의 파일 수집·제외 절차로 전송 목록을 생성하고 원본 바이트를 보존했다. `ops/private-source-manifest.json`, `ops/source-mirror.json`, `ops/check-source-mirror.py`가 배포 fingerprint와 정확한 제외 파일을 고정한다. 누락 코드·새 배포·목록 외 제외는 실패한다.
- 과거 이미 공개된 파일의 옛 버전·Git 이력은 삭제하지 않았다. 이번에 제외한 JSON의 새 내용과 복원 조각은 공개 전송하지 않았다. 빌드에는 이전의 공개 잔존본 대신 제공 ZIP의 정확한 버전을 적용한다.
- 이후 긴급 수정 외 Sites 재배포는 중단한다. 문서·내보내기 보조 도구의 GitHub 반영을 이유로 동일 런타임을 다시 배포하지 않는다.

### 완료 범위와 검증

Orbit은 시안의 중앙 일정표·주변 정보·대형 픽업 이미지·게임 레일/그리드·드래그·구면 전환·도입 연출을 유지한다. 일정/타임라인/상세 정보/도감/기존 기능을 연결했고, 가챠는 구현된 명조·이환·니케에만 기존 디자인으로 노출한다. 기본 사이트는 유지하며 Beta 진입과 실제 투표 집계를 제공한다. 검증을 위한 가짜 투표는 넣지 않았다.

v306은 관련 Node 검사 11개, 타입·빌드, 4언어 390px 모바일 가로 넘침 0, 데스크톱 이미지 로딩과 공개 운영 데이터 표시를 확인했다. v307은 새 내보내기 통합 검사 3개, 타입 검사, 64개 API 포함 배포 빌드를 통과했다. 미인증 백업 화면·API 404, 공개 기본/Orbit 200, 실제 소스 fingerprint를 확인했다. 전체 게임의 모든 외부 자료가 최신이라는 뜻은 아니다. 기존 수집 실패·미공개 자료·원본 미확인 항목은 임의 보완하지 않았다.

공개 제외 정책 변경 후 미러 검사 5개와 공개 런타임 814개 해시 대조를 통과했다. 공개 GitHub 단독의 전체 빌드/전체 CI는 비공개 overlay가 필요한 별도 조건이다. 비공개 자료를 CI에 공개 업로드하거나 검사를 무조건 통과시키는 방식으로 숨기지 않는다. 최종 원격 CI 결과는 CONTINUATION에 기록한다.

## 2. 백업 다운로드와 보관

운영자로 로그인한 브라우저에서 https://gagether.wiki/owner/migration-export 를 직접 연다. 공개 메뉴에는 링크가 없다. 기존 `editorIdentity` 인증을 통과한 GET 요청만 허용한다. 나머지 인증·메서드는 404, 응답은 private/no-store이다. 내보내기 내용은 로그에 남기지 않고 요청 운영자 ID와 시각만 기록한다. 운영 DB/R2에 쓰기·삭제하지 않는다.

- D1: **D1 SQL 백업 준비 → D1 SQL 파일 받기**. 하나의 TAR 안에 약 3MB씩 나눈 SQL과 manifest/README가 들어 있다.
- R2: **R2 전체 목록 준비 → 전체 객체 목록 받기 → 각 묶음 받기**. 원본은 스트리밍하고 묶음마다 메타데이터·SHA-256 manifest를 포함한다. 목록 이후 변경된 객체는 409 또는 실패로 처리하므로 목록을 새로 준비해야 한다.
- 파일은 사용자에게 제공하는 로컬 다운로드에만 둔다. 공개 GitHub, 공개 호스팅, 이슈 첨부로 올리지 않는다.
- **첫 백업 후 삭제하지 않는다. 도메인 이전 완료 후 사용자가 제거를 요청하면 제거 → 해당 화면/API 404 확인 → 최종 소스 GitHub 재동기화** 순서로 수행한다.

### 제공 파일

아래 파일명은 사용자에게 전달한 다운로드 묶음 기준이다. 이 문서에는 이름·크기·해시만 포함한다.

| 파일 | bytes | SHA-256 |
| --- | ---: | --- |
| `gagether-private-source-overlay.zip` | 28927885 | `a0aa2909dcecff0a1e68892b5eddd2b0280cc22477f485f71e88c69e55244042` |
| `gagether-private-validation-inputs.zip` | 17742 | `8f2a6507949ef349d476365ee2b8c95a2e4ec9ab3c3aafd160291a4b67698851` |
| `gagether-d1-2026-10-31T10-45-27-964Z.tar` | 113071104 | `db9ed4353d0420caffcba5c2209facc173133e450ffd503167833444d6a870dd` |
| `gagether-r2-inventory.private.json` | 4556293 | `2264799b1f9bd21e00ad368b27d080650650ffa29dd94b58386be10c8af709b2` |
| `gagether-backup-verification.private.zip` | 27061 | `57fb10173381ddbd52277a5375d8a448b8d1a00d4834c28cf8bcb0a11e1788bf` |
| `gagether-r2-bundles/gagether-r2-part-01.tar` | 199526400 | `fba82978301ba393e552c9eec815ceebbf70e65c3f81d0f3776100a48929fae0` |
| `gagether-r2-bundles/gagether-r2-part-02.tar` | 194242560 | `2aff136d4e0b292f6a7da82188eaaf8951abc52f4b387f883d60aecc2b570d8a` |
| `gagether-r2-bundles/gagether-r2-part-03.tar` | 197550080 | `42a43a7df19fef8a4e096544a40efc6ca1ad0a3e3b6ab9d324d620d95627d4d1` |
| `gagether-r2-bundles/gagether-r2-part-04.tar` | 194037760 | `d0c785c48d5e2b7761ae25a96b066b641fff7ae288b0fc1454a619b6cefda065` |
| `gagether-r2-bundles/gagether-r2-part-05.tar` | 196833280 | `a01ffda67afec60dce814eef0dbe4fb25c2f3fbbcc3c7ce19116d938709c7e9d` |
| `gagether-r2-bundles/gagether-r2-part-06.tar` | 204247040 | `d9c96628361bfb0445472082572abb7cefabce8193142a01000b2f447b4ca4bf` |
| `gagether-r2-bundles/gagether-r2-part-07.tar` | 185446400 | `1666e4025c36e24a2732c3ba9cc98ec7e9a3a8fe7fc990f8c19b68e65cba5454` |
| `gagether-r2-bundles/gagether-r2-part-08.tar` | 72990720 | `ee792a08c6b20b2116aec8a80a2a667021085426584ad8584db3e46983907ea0` |

## 3. D1 스키마·데이터

실제 내보내기: `2026-10-31T10:45:27.964Z` ~ `2026-10-31T10:50:59.102Z`. 49개 애플리케이션/마이그레이션 테이블, SQL 46개. sqlite_schema 목록에는 테이블 51개, 인덱스 86개(자동 인덱스 포함), 트리거 15개, 뷰 0개가 있다. 원본 CREATE TABLE/명시 인덱스/트리거 및 감사 트리거를 포함하며 `__appgarden_migrations`의 24개 기록도 포함한다. `sqlite_sequence`의 high-water mark를 복원한다.

Cloudflare 내부 `_cf_KV`는 내보내기/직접 복원 대상이 아니며 행 수는 **미확인**이다. 전체 sqlite_schema 관측 목록은 비공개 manifest에 포함했다. SQLite 자동 인덱스는 테이블 제약으로 재생성한다. D1의 내부 테이블 제외와 SQL 가져오기 규칙은 [Cloudflare 공식 문서](https://developers.cloudflare.com/d1/best-practices/import-export-data/)를 따른다.

SQL은 테이블 생성 → 데이터 → 인덱스/뷰/트리거 순서이며 감사 데이터가 두 번 쌓이지 않게 트리거를 마지막에 만든다. TEXT는 UTF-8 hex CAST로 NUL/따옴표를 보존하고 BLOB은 X'hex'로 내보낸다. 큰 값은 가져올 대상에만 임시 보조 테이블을 만들어 분할하며 마지막에 제거한다. 숫자는 SQLite 직렬화로 64bit 정수를 보존한다.

로컬 SQLite 복원 결과: **스키마 일치, integrity_check 통과, foreign_key_check 통과, sequence 일치**, 49개 테이블 모두 복원 행 수 = 내보낸 행 수 = **종료 시점 운영 행 수**. 그러나 시작/종료 사이 `public_favorite_browsers`가 16,785 → 16,786으로 변했고 6개 테이블의 행 수/최신 revision 또는 시각이 변했다. 따라서 verifier의 `verified:false`, `rowsMatchStartAndEnd:false`는 보수적으로 유지한다. 복원 실패로 오해하지 말고 **비원자적 첫 백업**으로 취급한다.

변경 감지: `entries`, `official_channels`, `official_documents`, `public_favorite_browsers`, `refresh_jobs`, `source_checks`. 시작·종료 시각과 테이블별 관측 가능한 최신 revision/시각은 D1 manifest에 있다. 해당 컬럼이 없는 테이블은 빈 목록이며 임의 revision을 생성하지 않았다. D1 백업 중에는 갱신이 계속됐다. 이후 R2 백업 단계에서만 아래 GitHub 작업을 잠시 중지했다. 방문자의 즐겨찾기·프로필·사용량 기록을 잠그지 않았으므로 작업을 멈춰도 완전한 단일 시점 스냅샷은 보장하지 않는다.

| 테이블 | 시작 | 내보냄/복원/종료 |
| --- | ---: | ---: |
| `__appgarden_migrations` | 24 | 24 |
| `community_likes` | 0 | 0 |
| `community_limits` | 1 | 1 |
| `community_reports` | 0 | 0 |
| `community_reviews` | 1 | 1 |
| `editorial` | 46 | 46 |
| `editorial_history` | 124 | 124 |
| `entries` | 2395 | 2395 |
| `feedback_limits` | 6 | 6 |
| `feedback_requests` | 3 | 3 |
| `forum_comments` | 0 | 0 |
| `forum_likes` | 1 | 1 |
| `forum_limits` | 13 | 13 |
| `forum_media` | 1 | 1 |
| `forum_posts` | 1 | 1 |
| `forum_reports` | 0 | 0 |
| `gfl2_record_limits` | 0 | 0 |
| `gfl2_record_reports` | 0 | 0 |
| `gfl2_records` | 0 | 0 |
| `gfl2_setups` | 0 | 0 |
| `official_channels` | 102 | 102 |
| `official_documents` | 1231 | 1231 |
| `operations_health` | 1646 | 1646 |
| `orbit_beta_votes` | 1 | 1 |
| `owner_push_drafts` | 3 | 3 |
| `owner_push_sends` | 4 | 4 |
| `owner_secret_handoffs` | 1 | 1 |
| `public_catalog_versions` | 19 | 19 |
| `public_entry_index` | 2395 | 2395 |
| `public_favorite_browsers` | 16785 | 16786 |
| `public_favorite_totals` | 22 | 22 |
| `refresh_jobs` | 158 | 158 |
| `source_checks` | 7 | 7 |
| `usage_meta` | 1 | 1 |
| `usage_views` | 4631 | 4631 |
| `usage_visitors` | 1367 | 1367 |
| `visitor_accounts` | 25 | 25 |
| `visitor_login_challenges` | 0 | 0 |
| `visitor_oauth_challenges` | 0 | 0 |
| `visitor_profiles` | 23 | 23 |
| `visitor_sessions` | 22 | 22 |
| `wuwa_record_limits` | 1 | 1 |
| `wuwa_record_reports` | 0 | 0 |
| `wuwa_records` | 2 | 2 |
| `wuwa_setups` | 6 | 6 |
| `zzz_record_limits` | 0 | 0 |
| `zzz_record_reports` | 0 | 0 |
| `zzz_records` | 0 | 0 |
| `zzz_setups` | 0 | 0 |

`sqlite_sequence`는 복원본에서 2행이며 저장한 high-water 값과 일치한다. 운영에서 이 내부 테이블의 직접 COUNT는 **미확인**이다. `_cf_KV`의 행 수 역시 미확인이다.

### 가져오기 및 재검증 (별도 이전 담당자용, 이 작업에서 실행하지 않음)

비어 있는 새 대상 DB에 TAR의 SQL을 파일명 순서대로 `wrangler d1 execute <대상DB> --remote --file <SQL파일>`로 적용한다. 기존 운영 DB에 덮어쓰지 않는다. 데이터 파일은 임의 순서를 바꾸지 않는다. SQL 자체에는 BEGIN/COMMIT을 넣지 않았다. 데이터 로드 후 인덱스·트리거 파일까지 적용해야 한다.

`__appgarden_migrations`는 Sites의 적용 기록이고 Wrangler의 `d1_migrations`와 동일하지 않다. 새 D1로 가져온 뒤 Wrangler 마이그레이션 기준선을 별도 설계해야 하며 기존 CREATE 마이그레이션을 무조건 다시 적용하지 않는다. 실제 Cloudflare 원격 가져오기와 새 DB ID는 **미확인**이다.

```text
python web/ops/verify-migration-backup.py d1 gagether-d1-2026-10-31T10-45-27-964Z.tar --out private-d1-check
```

출력 폴더는 새 폴더여야 한다. restored.sqlite와 verification.private.json을 만들며 공개 저장소에 넣지 않는다. 첫 백업은 위 변경 때문에 보수적 실패 상태를 반환한다. 전환 직전 다시 내보내고 start/end/revision·행 수를 확인한다.

## 4. R2 전체 목록·원본

처음 목록: 2026-10-31T10:52:33.121Z ~ 10:52:58.389Z, **5,457개 / 1,431,006,348 bytes**. 운영 중 신규·갱신 객체가 생겨 목록을 재작성했다. 전달용 목록 기준 **5,459개 / 1,436,166,624 bytes**; 목록/수집 구간 `2026-10-31T10:54:57.122Z` ~ `2026-10-31T12:11:54.461Z`.

전달 TAR 재검증: **5,459개 / 1,436,166,624 bytes**, 누락 0개, 모든 파일 크기·SHA-256·메타데이터 대조 통과.

고정 기준 목록 5,459개에 대한 누락 0개. 기준 목록 이후 메타데이터가 달라진 객체 33개, 추가로 관측한 객체 0개. 객체별 원본 SHA-256과 실제 수집 메타데이터는 전달 manifest에 있다. 여러 시점에 수집했으므로 원자적 스냅샷이라고 표시하지 않는다.

manifest는 키, size, etag, version, content-type, 전체 httpMetadata, 사용자 customMetadata, uploaded, 파일 경로, SHA-256을 포함한다. 원본을 재인코딩하지 않았다. 디스크 파일명은 안전한 해시 경로이며 실제 R2 키는 manifest의 `key`가 원본이다. 복원 때 파일명만 그대로 업로드하지 말고 key와 content-type/메타데이터를 복원해야 한다. R2 etag를 SHA-256으로 간주하지 않는다. [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)의 목록·조건부 읽기 규칙을 적용했다.

| 최상위 경로 | 객체 수 | bytes |
| --- | ---: | ---: |
| `broadcast-evidence/` | 20 | 3322780 |
| `catalog-assets/` | 430 | 345280565 |
| `character-rosters/` | 224 | 569575699 |
| `editor/` | 42 | 76591770 |
| `feedback/` | 1 | 68 |
| `forum-media/` | 1 | 3298306 |
| `leak-assets/` | 13 | 1275927 |
| `nikke-recruit-media/` | 9 | 12536859 |
| `nte-board-art/` | 10 | 1717576 |
| `nte-board-audio/` | 4 | 45322 |
| `nte-board-bgm/` | 1 | 5036243 |
| `official-documents/` | 1448 | 10076267 |
| `recovery/` | 6 | 184143 |
| `reviewed-rewards/` | 64 | 2356758 |
| `runtime/` | 2485 | 287090908 |
| `wuwa-combat-images/` | 6 | 71586 |
| `wuwa-convene-media/` | 13 | 80761787 |
| `wuwa-equipment-icons/` | 389 | 7232110 |
| `wuwa-reference-art/` | 60 | 23287799 |
| `zzz-equipment-icons/` | 233 | 6424151 |

객체 키 전체와 사용자 메타데이터는 비공개 목록 파일에만 있다. Sites 기본 도구에는 전체 R2 다운로드/목록 기능이 없어 승인받은 운영자 내보내기를 사용했다. 실제 CF 계정의 R2 S3 API 키·물리 버킷명·계정 ID는 **미확인**이며 이 작업에서 새 키를 만들지 않았다. 추후 계정 접근권한을 확보하면 Cloudflare S3 호환 API 또는 Wrangler/SDK로 원본 key와 메타데이터를 보존해 업로드할 수 있다.

```text
python web/ops/verify-migration-backup.py r2 gagether-r2-inventory.private.json gagether-r2-bundles --out private-r2-check
```

새 폴더에 보고서를 만들고 각 TAR의 파일 개수·총 bytes·모든 SHA-256·목록 메타데이터를 대조한다. 누락·중복·목록 외 객체·손상 파일은 실패한다. 모든 part를 같은 폴더에 넣어 검사한다. 최종 이전 직전에는 운영자 화면에서 다시 목록/원본을 받는다.

### 백업 동안 예약 작업 일시 중지 기록

- refresh: 중지 2026-10-31T11:41:48.698Z; 재개 2026-10-31T12:14:37.453Z; 재개 확인 True.
- rosters: 중지 2026-10-31T11:43:45.967Z; 재개 2026-10-31T12:13:04.685Z; 재개 확인 True.

GitHub UI로 원래 활성 상태를 확인하고 중지했다. 중지/재개가 이미 끝난 실행 기록을 삭제하지는 않는다. 공지 갱신 실행 41197778379에는 중지를 요청했으며 다음 예약 실행으로 정상 수집이 이어질 수 있다. 최종 재개 확인 상태는 위 시각과 CONTINUATION을 기준으로 한다.

## 5. 환경 변수·시크릿·바인딩 (값 없음)

Sites 환경 설정 revision 9에서 확인한 이름이다. 값은 이 문서·GitHub·백업 안내에 쓰지 않는다. 새 계정에는 사용자가 별도 보안 경로로 설정해야 한다.

| 이름 | 용도 |
| --- | --- |
| `PATCHWORK_EDITOR_EMAILS` | 운영자 허용 이메일 목록, editorIdentity 권한 확인; 시크릿 |
| `GAGETHER_SYNC_TOKEN_SHA256` | 수집 요청 토큰 검증 해시; 시크릿 |
| `GOOGLE_SIGN_IN_CLIENT_ID` | Google 사용자 로그인 OAuth client ID |
| `GOOGLE_CALENDAR_CLIENT_ID` | Google Calendar 연동 OAuth client ID, 일부 로그인 fallback |
| `DISCORD_SIGN_IN_CLIENT_ID` | Discord 로그인 OAuth client ID |
| `DISCORD_SIGN_IN_CLIENT_SECRET` | Discord OAuth 서버 교환; 시크릿 |
| `DISCORD_SIGN_IN_REDIRECT_URI` | Discord 로그인 callback 허용 주소 |
| `DISCORD_SETUP_KEY_ID` | Discord 설정 전달 암호화 키 식별자 |
| `DISCORD_SETUP_PUBLIC_KEY` | Discord 설정 전달용 공개키 |
| `GAGETHER_FCM_APP_READY` | Android FCM 앱 준비 상태 |
| `GAGETHER_FCM_SERVICE_ACCOUNT` | FCM 서버 전송 서비스 계정 JSON; 시크릿 |
| `DB` | Sites가 제공하는 D1 binding |
| `BUCKET` | Sites가 제공하는 R2 binding |
| `CONNECTORS` | Sites 실행 문맥에서 선택적으로 제공하는 연결 서비스 binding |

Firebase 소스 설정 `content/android-push.json` 필드: `projectId`, `senderId`, `applicationId`, `firebaseAppId`, `registeredAt`, `firebaseMessagingVersion`, `googleServicesPluginVersion`. FCM 서비스 계정 내부 필드: `project_id`, `client_email`, `private_key`, `private_key_id`. Android 설정과 Google OAuth 허용 origin/callback도 새 운영 환경에서 확인해야 한다. 실제 콘솔 접근권한·새 허용 설정 여부는 **미확인**이다.

Cloudflare account ID, 실제 D1 database ID, 물리 R2 bucket 이름은 Sites 도구에서 **미확인**이다. `vite.config.ts` 및 생성 빌드의 0으로 된 ID/로컬 DB·bucket 이름은 운영 리소스 ID가 아니므로 복사하지 않는다.

별도 Discord 배포 워크플로에서 요구하는 이름: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DISCORD_APPLICATION_ID`, `DISCORD_DATABASE_ID`, `DISCORD_TEST_GUILD_ID`, `DISCORD_BOT_TOKEN`, `DISCORD_PUBLIC_KEY`, `BOT_ENABLED`, `SCHEDULER_ENABLED`. 실제 설정 존재/값/배포 상태는 **미확인**. Discord는 별도 DB를 쓰므로 현재 Sites DB 백업이 그 DB까지 포함한다고 주장하지 않는다.

## 6. 예약 작업·백그라운드 기능

GitHub 워크플로 파일의 cron은 UTC이다. 아래 일정은 소스 설정이며 실행 누락 없는 SLA를 의미하지 않는다.

| 기능 | 경로 / 주기 | 고정 주소·인증 / 역할 |
| --- | --- | --- |
| 공지·방송 갱신 | `.github/workflows/gagether-refresh.yml`, `2,7,12,17,22,27,32,37,42,47,52,57 * * * *` | `web/ops/game-refresh-request.py`, 이전 `refresh-request.py`; `https://gagether.wiki/api/fast-refresh`; fast/details 작업 |
| 도감 수집 | `.github/workflows/gagether-rosters.yml`, `31 */6 * * *` | `web/ops/character-rosters/run.py`; audience `https://gagether.wiki/api/characters` |
| 긴급 데이터 변경 | `.github/workflows/gagether-emergency.yml`, dispatch 및 `.gagether/emergency.json` push | `web/ops/emergency-request.py`, `web/app/api/emergency/route.ts`; audience `https://gagether.wiki/api/emergency` |
| 소스 일치 확인 | `.github/workflows/gagether-source-drift.yml`, `23 * * * *`, dispatch/push | `web/ops/check-source-mirror.py`; `https://gagether.wiki/source-manifest.json`; OIDC 없음 |
| Discord 검증/수동 배포 | `.github/workflows/gagether-discord.yml` | push/PR 검증; main에서 수동 deploy 옵션과 production environment 조건; 별도 Worker |
| 웹 CI | `.github/workflows/gagether-web-ci.yml` | Node·Python·타입·편집기 검사. 새 공개 제외 정책상 full build/test에는 비공개 overlay 필요 |

OIDC 서버 검증 경로: `web/lib/refresh-identity.ts`, `web/lib/character-roster-refresh.ts`, `web/app/api/emergency/route.ts`. issuer는 GitHub Actions, repository/owner ID와 `tomochelly/gagether-android`, main ref, 각 workflow_ref 및 event를 고정한다. 호스트를 유지해도 새 Worker에서 이 JWT 검증과 audience가 같게 동작하는지 별도 검증해야 한다. 토큰을 운영자 인증 대신 사용하지 않는다.

- Sites 시간별 AI 갱신: `Automation_f297f3b5da788191bdf146aa749178ea`, 매시 0분, Asia/Tokyo, **비활성 유지**.
- 로컬 Codex ‘가게더 전체 품질 점검’: 60분 간격, ACTIVE. 이전 기간 일반 변경·Sites 재배포를 막고 읽기 점검/발견 기록을 우선하도록 갱신했다. 실제 긴급 장애 외 자동 게시 금지.
- `web/build/sites-worker.ts`는 fetch 처리이며 자체 scheduled handler는 없다. 요청 중 `ctx.waitUntil`로 공개 화면/API·도감 캐시와 만료 재생성을 수행한다. 방문으로 발생하는 즐겨찾기·프로필·사용량 쓰기도 계속된다.
- FCM은 운영자 초안·수동 발송 기능이다. 이번 작업에서 알림을 전송하지 않았다.
- `web/discord/wrangler.jsonc`에는 1분 cron이 있지만 기본 `BOT_ENABLED`/`SCHEDULER_ENABLED`는 false다. 실제 배포 여부는 **미확인**. `GAGETHER_ORIGIN`은 동일 사용자 도메인을 가리킨다.
- Android CI/runtime/release 워크플로는 기존대로 보존했다. 앱 배포는 하지 않았다.

## 7. Sites 의존 코드와 이전 때 필요한 확인

| 경로 | Sites 의존점 / 새 호스팅에서 확인할 내용 |
| --- | --- |
| `web/app/chatgpt-auth.ts` | Sites가 주입하는 `oai-authenticated-user-id`, `oai-authenticated-user-email`, `oai-authenticated-user-full-name`, encoding 헤더 신뢰 |
| `web/lib/editor-access.ts` | 위 identity와 운영자 허용 목록으로 editorIdentity 결정. 일반 인터넷 요청이 헤더를 위조해 관리자 권한을 얻지 않게 새 인증 경계 필요 |
| `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback` | Sites 소유 로그인 경로. 일반 Worker에 코드만 옮기면 자동 제공되지 않음 |
| `web/app/owner/**`, `web/app/api/owner/**` | 기존 editorIdentity에 의존. 임시 백업 화면/API도 포함 |
| `web/.openai/hosting.json` | Sites 프로젝트 식별, D1/R2 binding과 플랫폼 배포 계약 |
| `web/build/sites-vite-plugin.ts` | Sites 개발용 인증·예약 경로·신뢰 헤더 처리. 로컬 mock identity를 운영에 쓰면 안 됨 |
| `web/build/sites-worker.ts` | Sites 실행 context/bindings, fetch·캐시·waitUntil; 독립 Worker 진입점과 연결 문맥 점검 |
| `web/lib/connector-context.ts`, `web/lib/connector-contract.mjs`, `web/build/connector-preview-plugin.mjs`, `web/build/connector-preview-worker.mjs` | Sites CONNECTORS 및 로컬 preview 연결 계약 |
| `web/vite.config.ts` | Sites/Vinext/Cloudflare 플러그인과 로컬 placeholder binding |
| `web/scripts/sites-env.mjs`, `execution-profile.mjs`, `run-framework.mjs` | Sites 관리형 환경과 portable 실행 분기 |
| `web/scripts/prepare-worker-build.mjs`, `verify-worker-build.mjs`, `trim-deploy-output.mjs`, `build-verified.sh` | Sites 산출물 구조 검증·패키징·관리형 빌드 단계 |
| `web/package.json`, `web/ops/restore-roster-snapshot.mjs` | 빌드 전 비공개 snapshot/원본 복원·데이터 준비·검증. 공개 코드만으로 복원 불가 |
| `web/scripts/write-source-manifest.mjs`, `web/ops/check-source-mirror.py` | 배포 코드 fingerprint와 사이트 URL을 기준으로 동기화 검증 |

현재 고정 의존 버전: Vinext 1.0.0-beta.5, Vite 8.0.13, Wrangler 4.92.0, Cloudflare Vite plugin 1.37.1. 이 문서 작성 과정에서 업그레이드하지 않았다. 독립 운영용 실제 리소스 ID가 들어간 루트 Wrangler 설정은 아직 없다. 생성된 `dist/server/wrangler.json`의 로컬 placeholder를 운영 설정으로 사용하지 않는다. Sites가 맡던 리소스 생성·마이그레이션·환경 설정·버전 게시를 별도 이전 담당자가 설계해야 한다.

## 8. 도메인

공식 `.wiki` [RDAP 조회](https://rdap.nic.wiki/domain/gagether.wiki)에서 등록기관 **Porkbun (IANA 1861)**, 등록 2026-10-16T17:52:34Z, 만료 2027-10-16T17:52:34Z를 확인했다. 네임서버 `curitiba`, `fortaleza`, `maceio`, `salvador`의 `ns.porkbun.com`을 통해 **DNS 관리도 Porkbun**임을 확인했다.

Sites custom domain은 active, SSL active이며 target은 `custom-domains.chatgpt.site`이다. 공개 A 응답은 162.159.143.30, 172.66.3.26이었다. TXT 검증 값은 문서에 쓰지 않는다. 실제 등록 계정·결제 접근권한은 **미확인**, **Sites에서 구매했는지도 미확인**이다. Porkbun 등록이라는 사실만으로 구매 경로를 추정하지 않는다. DNS/NS/레코드 변경은 하지 않았다.

## 9. 다음 담당자 체크포인트

1. GitHub main/web와 아래 비공개 overlay를 함께 확보하고 fingerprint를 검증한다. 비공개 파일을 git add하지 않는다.
2. 새 Cloudflare 리소스·시크릿·인증·빌드/배포는 별도 작업에서 준비한다. 이 문서는 새 계정에 이미 설정됐다는 증거가 아니다.
3. 전환 직전 수집 작업과 방문자 쓰기의 처리 방법을 정하고 최종 D1/R2 백업을 다시 받는다. 첫 백업의 시각을 최종 전환 데이터로 오인하지 않는다.
4. 로컬 SQL 복원과 새 D1 행 수·FK·트리거·마이그레이션 기록, R2 key·content-type·메타데이터·SHA-256을 검증한다.
5. 기존/Orbit, 운영자 권한, 일반 사용자 로그인, 즐겨찾기·도감·투표·가챠 기록, Google/Discord callback, Android·FCM, OIDC 갱신을 실제 새 환경에서 확인한다.
6. DNS·로그인 교체·새 배포는 별도 이전 담당자가 수행한다. Sites 사이트와 기존 데이터는 이 작업에서 삭제하지 않는다.
7. 이전 완료 후 사용자가 요청하면 임시 백업 경로 제거, 미인증/운영자 모두 404 확인, GitHub 최종 동기화.

## 10. 공개 동기화에서 제외한 파일과 SHA-256

사용자 명시 결정: 이미지 경로·배치 JSON 99개와 복원 조각 179개는 비공개 ZIP에 포함한다. 아래 목록은 **파일명과 해시만** 공개하며 JSON 내용·원본 이미지·DB/R2 내용은 포함하지 않는다. 저장소 루트에 ZIP을 풀면 `web/` 아래 해당 파일을 정확히 재구성한다. D1/R2 원본은 별도 백업이다.

| 제외 파일 | bytes | SHA-256 |
| --- | ---: | --- |
| `web/content/additional-game-assets.json` | 47052 | `17ffa21266d9b05b02934dc28a41ca31867d3d2e1677d0782e4f20e04926d8c4` |
| `web/content/additional-game-entries.json` | 111515 | `25491119abfb07e5b6d13e14de84eb3c5568f013ca6477db40ec13cd567008c8` |
| `web/content/arknights-gallery-focus.json` | 143614 | `ea6e57cb06f0818167d735ea035b78430c2051322f0d655b8d32bf4de52c96a7` |
| `web/content/arknights-preview-images.json` | 137295 | `cc479cfc02c6d75132643a5f1f1ca96990530189c3f17b77fa4336a42227d53f` |
| `web/content/artwork-audit-2026-10-16.json` | 107573 | `9e2d4d76e3d5eb6fe7121e35d6e3edfce0a3257298e1217eeedefbdb20050b09` |
| `web/content/assets-hoyo-provenance.json` | 2030 | `b18806750eb7eb64b367fdc2ee78289b3b08b1b32f3f80446d0af9ab9f034213` |
| `web/content/assets-kuro-asset-sources.json` | 5034 | `be2e96f16adb68852d7044619bea0bda578adac59ffd3cd4b1ba7e4714bcd8a6` |
| `web/content/assets-other-exact-audit.json` | 18712 | `29f2d3bf3b7c03a2848ea8fdcf7f041a42f07a0a106006717fde9b8dc35232f5` |
| `web/content/assets-others-manifest.json` | 1387 | `2576f581243844ddeb6267f4434964fcdfe21d1a0729c04b40f6fdfa291c9ab9` |
| `web/content/bluearchive-reviewed-banners.json` | 4248 | `c8f07f806735586a9132641aa21411a73dd841505ca34d133877cb7efcf0a31c` |
| `web/content/catalog-preview-images.json` | 4955 | `0e2969bd127e99f659d23bab892ed5315e8eeab49651c8a4d60074aa7945211d` |
| `web/content/character-rosters/artwork-manifest.json` | 2264188 | `b2df77e169c0c650783e0b086979072ce15b775260562abb20f4283bca64c422` |
| `web/content/character-rosters/bootstrap.json` | 36933668 | `ec29021ad01832da2ac48335f1bda58bed04befa11f774cde7a6b91e0f4eb60a` |
| `web/content/character-rosters/recovery/manifest.json` | 3176 | `d4e7bc0868c07b58ae95d3853f7f842b3c7a53e24be368edefe6e2f00fcfa8c8` |
| `web/content/character-rosters/rejected-artwork.json` | 478 | `e0def33674ca2a4fac075780e0f9970221acff613558ab5f03de2f1bebd6d01f` |
| `web/content/character-rosters/restricted-artwork.json` | 11850 | `a3d00ebfd959d7a6f8877195e2903b94b18ce61f04b8d36f6be5dc54affb5b9a` |
| `web/content/combat-display.json` | 55897 | `de788d80e83fa685fe2ea667d01dd6ac6ad559faabc3f5f73420039110dee619` |
| `web/content/combat-research.json` | 154451 | `26512f8dc96ae828c31d431a5b961c2ad14eae9e793a2ec18c508d5e7db59e5f` |
| `web/content/community-others-notes.json` | 5775 | `d2370efa3b3b0f54cb9b6c761986fb323f5b5ce80f9f64b046c55f1ee9a21f40` |
| `web/content/endfield-gallery-focus.json` | 11161 | `a78a6c6f4af4f5100ee00e3039b743a138e54c79e37cd9483f60cf8d37312e6e` |
| `web/content/entity-catalog.json` | 253989 | `f7a54c8b0d883abfec55943f7cb41bb0533fddcc469b177b2e7fafdc4819f6ea` |
| `web/content/excluded-source-images.json` | 1231 | `dc3d3508bffa55265d9312da5de45d5417d0813e712690eceb8d46abdcc457a7` |
| `web/content/foresight.json` | 93574 | `09b13cd6d3ff21c9e1b800b18b768bbe8420c6b3def565a23847fd08b579ab4d` |
| `web/content/four-games-gallery-focus.json` | 3829 | `8d09868b5c114fad9aeb4b9f43247efa80e6996ee4049335f75bc4450f7fc7dd` |
| `web/content/full-artwork-review-2026-10-16.json` | 29430 | `3b6329e6b7f08c0d8e7c4c49fc24e1259a903b0a83fb90c2ebca1de5ad1ecd3a` |
| `web/content/gallery-focus-runtime.json` | 120105 | `ebb496d56bb1985da37b328da7244aa91d5998f3507c2af84f89860b2cd4f9e9` |
| `web/content/gallery-framing-runtime.json` | 362613 | `cb81bd5f442892bd5781d4fef5a1fc7a8c640d897a2e60b63303525e89d29fd8` |
| `web/content/gallery-protected-heads.json` | 17672 | `4e5f2eaa69ae4fea45c55bc49823c82ee3ca0b73509455d1455ebcea542cb2d5` |
| `web/content/gallery-subject-bounds.json` | 745949 | `aef72df0c0976540c0756da101384483c6ade929f1e55679cd0312358b1c0128` |
| `web/content/gfl2-combat-catalog.json` | 577974 | `922277d2528c40489f393d3f539c477c8d4023261cea554953b63041a44b2237` |
| `web/content/holodreams-gallery-focus.json` | 35315 | `fbdc2ce3dc55ddc1286c1b91209a7e88a6727c25ba5c2f9f856b2588dcd98f9c` |
| `web/content/hoyo-localization-research.json` | 14436 | `2018462c9bab07e3473f63c30e1eecbe6299a77acf0544e4735d25f6bed6d45e` |
| `web/content/hoyo-localized.json` | 42046 | `fd91c188503357e484c0720ceeadf48c599126cd16dedc0efcfd9b57f694b887` |
| `web/content/hsr-announced-roster.json` | 1896 | `13debd7b5d5ac82d672100d4795fce529f427b5d00bc8ce9a199b54582f4b03c` |
| `web/content/hsr-gallery-focus.json` | 56064 | `7fb694f2883585cb6270c453816d62f9e599a954faf58be76895c0f8989ac243` |
| `web/content/kuro-image-audit.json` | 7112 | `462f178b75f8bb8b40e97512df5e01473b8581fee40605f9b3aa704d3fef590d` |
| `web/content/kuro-localization-research.json` | 10928 | `c468d354d816bbf143d8fd06219d348952510c4c2eda56ebf2614a6ab0ebeb80` |
| `web/content/kuro-localized.json` | 70042 | `bf2b12ac72b9e4d4ae691f53bafbb7504d5cc591eda2ac9c32b492f62bf02842` |
| `web/content/leaks/bootstrap.json` | 107560 | `6e0f9e9316ea8650d7837d65b44ee0903c7587741ed6c16ef57aec5f9570224a` |
| `web/content/leaks/source-media.json` | 15629 | `4ddd44b2e7ac67085fab1cfcf3a55a07217b6f71d6bda375f83a2c2258afaa9c` |
| `web/content/leaks/x-artwork-manifest.json` | 33177 | `ce789b117078001e1b67dc75ac075df8fe95b1da08a77b507ab46b833709a567` |
| `web/content/limbus-reviewed-releases.json` | 6350 | `e18b04affb24c94cef33068232b76313a889cbdb9ff1080d9c94999e236f006b` |
| `web/content/maintained-artwork.json` | 98591 | `8c5f2739a4e562c371db9016e52bfebf34fe4aaf5a532b9ab010e449396ce8d0` |
| `web/content/maintained-video-notices.json` | 16466 | `c46c15ecf286b0461be16fac1bc83e50e0ea6f33447d867fdc4c958d28017e61` |
| `web/content/maintenance-gallery-focus.json` | 241155 | `ea3609716999121318c46c54c8972ea9aa79c752eae101cbce2d5128f30dbbb5` |
| `web/content/migrations/pickup-rewards-20261024.json` | 18318 | `887558ab7acef4702483254d075c7b9d2debd3ebe12ead3726d6732f43912c72` |
| `web/content/native-icon-provenance.json` | 6780 | `6e885d5448b25c72a83c02aa3ff9e6019fee7ca850a407abb4c66d7a5970ad06` |
| `web/content/nikke-recruit-pool.json` | 4784 | `21307fbc3cf57d016a29b9eb022f9cf819b8b4f86acd24cd9ff844d240002b8b` |
| `web/content/nte-announced-roster.json` | 2592 | `5a9f87c76094cbb0fe74355ba88099a7309a030bffc1408c6a44f451bd4f7259` |
| `web/content/nte-profile-sources.json` | 11184 | `a95219860fe2239fbbf87f0c362af4da2284f3709069559f6ab513c25c54323a` |
| `web/content/official-pickup-updates.json` | 33351 | `ed2648365f1287578d387948438a3bb46cb9265f7c2c14220a1772bbfb0579ee` |
| `web/content/official-video-channels.json` | 1197 | `70ebc8bd64382009b1f2710702d9962a52329865e08684a02b4129237ecbfa49` |
| `web/content/others-adapters-assets.json` | 2966 | `aef2adcea71aa01f679549146d75d81eb41bf552bbd5c81f98d41d0853da6b0d` |
| `web/content/others-additions-research.json` | 1177 | `30b1b493872ec68a19b310f7ed32357ed2e2828d79a360c45592259da22b1105` |
| `web/content/others-additions.json` | 5814 | `0a3a235d7cd8ec6bdf9d16181725c780c67f690a3662c37a36c83864aaf8d86f` |
| `web/content/others-localization-research.json` | 4326 | `84ce88fd43d85cc4773edf0c399188432b21501b6cdb60c3696fdcdaa340afba` |
| `web/content/others-localized.json` | 69762 | `c74f40dc9a96e61fea20eca11ffaabf32a002764a44a1e990fd70ab2eda1e9d6` |
| `web/content/pickup-member-icons.json` | 5786 | `3361b81d3eeadf87e074d68651ea99a331ed9f3d503cb452e1f68b0d3c1fab5d` |
| `web/content/pickup-thumbnail-focus.json` | 3248 | `2439160e43451bcbae85f4a528c982bbbc6ea3f0eabf914d173579e76fedc3ec` |
| `web/content/release-additions-20261025.json` | 12308 | `22e878592851cd437a82242521d929ee6a2cee76ee602896ecfbc64b3dcc66d2` |
| `web/content/research-hoyo.json` | 5133 | `ef42cd0b3e808e6c10b8a2b0be1762aaecfd435ef84d8b287957a591b3bca779` |
| `web/content/research-kuro-hypergryph.json` | 15270 | `5aa78c4ec1cb26dd9fc78cf04ff350f696b59dc45e2171b4acebaf800d38e7a6` |
| `web/content/research-others.json` | 17758 | `d0d768ada0a64f17f0e310368556c1344bfebf142ca43378ebd2b48c9ddc204b` |
| `web/content/reviewed-broadcast-media.json` | 711 | `a92ab01c1e62aefcf4d87aabbc1fe1788bda5fe3f034e6210948da90573a6c37` |
| `web/content/reviewed-owner-artwork-repairs.json` | 1319 | `709f877ce6819e10b24fa876fd851e207ef5450622e8487746f4684d440edd33` |
| `web/content/reviewed-pickup-artwork.json` | 21587 | `6e165fea1f843a3c013e35a8d0d01bd1969cd3a6655695dfbfbe9b8502298d1b` |
| `web/content/reviewed-roster-information.json` | 2754 | `39f8aa8cabe1cba0f25585577fe08d84417fdf6573d5b2a13bda18ac64e718e5` |
| `web/content/reviewed-trickcal-pickups.json` | 5217 | `2cbbce15f4f432eb8cb86a4002321fb7536d3f65de92c33d91b3c86e425a29f1` |
| `web/content/reward-assets.json` | 23448 | `76d56e31aa9e300160ddf17a3c86bbdb9abff66c10bc669977c72b9bd886664c` |
| `web/content/reward-catalog.json` | 82371 | `3cc64de3ebadd2be363e75bd7a8fd98864f9643bff1e70c3b20ffb0df5c1594b` |
| `web/content/roster-detail-icons.json` | 2127690 | `9d2324c8690746516ec89bf73086fce2cfd39481558478a7b75d6e0357926afd` |
| `web/content/roster-material-icons.json` | 371881 | `707a145534c9d9f68d682d05c821f73761273ebd102978be3c75634ad5ad2523` |
| `web/content/silver-palace-roster.json` | 53140 | `58cd45a0f9eedbb0c92213b5a16df4bce2264a40b9ceeb2d4175a10846f93947` |
| `web/content/stat-icons.json` | 6523 | `42789eb271773863593f1646a370e471e9ac070895953e4617fd50de69dc5e62` |
| `web/content/trait-icons.json` | 81372 | `ea541e8804fee990d7532e430d619b757b9e1cfd475d1f2f4ae5d6eb9871d06d` |
| `web/content/uma-selection-art-review-2026-10-17.json` | 20676 | `e7291c8ecbca518683ba22f40bcffb2b3c64dc3e93c6240ea3667b1ba59e68b9` |
| `web/content/upcoming-games.json` | 10103 | `41b7aab6a70bc7732ac0acfa362df825712ddca51a1502e06724b2835522627e` |
| `web/content/version-art-review-2026-10-17.json` | 17635 | `d10c5fd7e3e79a16e81c5fbab7d4b7077f915e20472b3ad56eb2598bf44f3cd5` |
| `web/content/wiki-icon-additions.json` | 32579 | `ae854d69a731b069559ec3b2113b21eaa674f2c94ae4bda89699dd50d05e8152` |
| `web/content/wuwa-announced-roster.json` | 3300 | `8efd150e18c9742d741b84ab6d6aa26807bdbbeaeb3b383995c5821682cf215e` |
| `web/content/wuwa-build-guides.json` | 164268 | `6edccb961f85710dcd812b9fab787b0b28e65678ba79ef999e9bcbd407f15ff6` |
| `web/content/wuwa-character-videos.json` | 108692 | `16eea639170edbd6e3d1778161655a428fb0b5d6d1a9793b5ba7a8c0b049aec9` |
| `web/content/wuwa-combat-artwork.json` | 70520 | `37326bb0c0913b703d2157f557892f827f304d496cbec1f44c0e8eb47c628cb1` |
| `web/content/wuwa-combat-image-repairs.json` | 3186 | `03752410eeb0d1d5aee5c96ca2e82156f508a78a4555c6d39490f2af87ceadf2` |
| `web/content/wuwa-convene-character-cards.json` | 3473 | `9bd965c02cf0954e868e02128445d002259294495689e84a227cfc64376b7b19` |
| `web/content/wuwa-convene-media.json` | 5913 | `263ad7effbf3d982a44fae3583286a41f91f6c6e5ad7148ed3b4fd0ac925fcc4` |
| `web/content/wuwa-convene-weapons.json` | 14533 | `4f8ddb5e9603a2741519087103d0dbc9c53c66414d6c5aca433b8e9a7f21bdf9` |
| `web/content/wuwa-equipment-catalog.json` | 131636 | `1204cf606f7368bb75029e1790fdd7e0617760bb39ebc0d8e45cb52df3bc262d` |
| `web/content/wuwa-equipment-images.json` | 68843 | `bbd3d8d7ca8a2097c881297c3f803c87ab65e90f41802e33714f7c80ead6c713` |
| `web/content/wuwa-material-provenance.json` | 35740 | `30a09c5d666886049d3fe398e2c2dd853e5942b11a2a4aaeec60aa605b540646` |
| `web/content/wuwa-reference-artwork.json` | 14527 | `5ef3eea7cdfa318a2f92620d5a870be8eb4e1e616fe7fb5c2c13e8b3d7b13bbb` |
| `web/content/wuwa-reference-framing.json` | 9804 | `edd3b5160c8a7613aad9076e30324d13b48b9619f8d27b0c97ecd46128aece97` |
| `web/content/wuwa-reference-splashes.json` | 36931 | `371b355e6385064d4392fd318446028715110003793a83400b64545f4e79d752` |
| `web/content/wuwa-reference.json` | 1498548 | `a864611af3e863605a1828bf424ddb1e816f5dbec02f9a1c0fe601686c46f4c8` |
| `web/content/wuwa-upcoming-3-8.json` | 20343 | `04b9b12e0bc858a5bc86c052b1c74dd5c867690125fe5a294a31a7ed2267a9d2` |
| `web/content/wuwa-wastes-tokens.json` | 162613 | `6437e375552972b82f12324afd69d0296d29049cc23c67e482a8e7fd4538d937` |
| `web/content/zzz-combat-catalog.json` | 108699 | `3a19b83688862f60f05177afd99ceec26f870b181bb455dad522e26ae751a081` |
| `web/content/zzz-equipment-images.json` | 41483 | `b7542bdff8d4007db44503dbfba6ba33dba46c0f475d3ff98e8b6ce49c6a7e72` |
| `web/content/zzz-reviewed-artwork.json` | 3109 | `21cfd63f717105543d529624326e4c1dce8d5f016f93752073704f6fddb5c9c5` |
| `web/content/character-rosters/recovery/000.b64` | 100002 | `69edf12accdd04738edd3a143b65c2026cb5ed2f300ad1dcff4423fb1fbd4f08` |
| `web/content/character-rosters/recovery/001.b64` | 100002 | `45abc4c736029cc83173774bb09f3ad7238ff5fd68fe6148e0e5b10ed7e1e4f7` |
| `web/content/character-rosters/recovery/002.b64` | 100002 | `5b471e7edc4468a5470fa8c5a4cc2c8346ea7ff2fdc4a4bc21b0097537821b3a` |
| `web/content/character-rosters/recovery/003.b64` | 100002 | `04f9dc7e67063292f539019e68fd9c7397a5cbce35d127728afad51cb40bc603` |
| `web/content/character-rosters/recovery/004.b64` | 100002 | `7338de8ca9baf73fef274c2a55bfe6ff72fbc048f44dc89407d55d266f8ab8ba` |
| `web/content/character-rosters/recovery/005.b64` | 100002 | `cb5c857041ac29cebc430686ade5b36ed3cfe704b6788271dcec48457f1fc4cf` |
| `web/content/character-rosters/recovery/006.b64` | 100002 | `f82c53dcde4b0dd3156ce41a52b69a1ba8c6567043272e5d420d90f54f8f5ff8` |
| `web/content/character-rosters/recovery/007.b64` | 100002 | `d83c50f17ab6aaca9eadffd755a5f9609429e3a1ffc6a068fcc802b75b004a9e` |
| `web/content/character-rosters/recovery/008.b64` | 100002 | `9602edf40eef0efbaa8b44a695c700aeb6172318f865cdb067ff1bd73cf7f43e` |
| `web/content/character-rosters/recovery/009.b64` | 100002 | `6a68dfb347f24231693027e600aebb87ff35a7cbc899c3feed038656b1ec8973` |
| `web/content/character-rosters/recovery/010.b64` | 100002 | `6709a8969689e4d284cac03f0224da35d074faf8a7f0a272ae4813dfec40516d` |
| `web/content/character-rosters/recovery/011.b64` | 100002 | `0c0176bf994c7ad1ab780b96cdee5b60781b268c9a6724e6d1a753d5b5d53e99` |
| `web/content/character-rosters/recovery/012.b64` | 100002 | `596b747c4b5ce1f9b5a4cab99f3f43d1d677a601753332a5d140cdf427a975d0` |
| `web/content/character-rosters/recovery/013.b64` | 100002 | `5428a2c35d9de945328aeadb3f7ecfd56a5c94d82a7b8f195226afff65712976` |
| `web/content/character-rosters/recovery/014.b64` | 100002 | `63011999e5f78b1ffefe7e3f8428783e291191175eb372a478be2cfb3390f82e` |
| `web/content/character-rosters/recovery/015.b64` | 100002 | `6001ededb7b83fffa2f02fb82dd62c05991381dfb5515923632cd7ebfebf80e1` |
| `web/content/character-rosters/recovery/016.b64` | 100002 | `c34ba466733d793d1e179920c83f5ad3b1fd34f6d57dfce22ef8b05f0871ff13` |
| `web/content/character-rosters/recovery/017.b64` | 100002 | `0b68549b029403f4365a1cedf72af115ebb10727cae5e264f509394f287caf1d` |
| `web/content/character-rosters/recovery/018.b64` | 100002 | `b7dcfcbfbe69980ce4c05fa96485221e2bf3074feb40066156267b3f817ed3a5` |
| `web/content/character-rosters/recovery/019.b64` | 100002 | `7bc995869c7042d3550a42ca781f5b9150516c237d761f1b05b5ef608e1ce523` |
| `web/content/character-rosters/recovery/020.b64` | 100002 | `abbb1ca307c580fb0698ff55a9808e38d943e2b10d4a771de17b52a183043298` |
| `web/content/character-rosters/recovery/021.b64` | 100002 | `5affe6d5d1788cf21f9efefa0c00afdc25f715f7c594a8412959ea2fc37a5ae3` |
| `web/content/character-rosters/recovery/022.b64` | 100002 | `cefd274e5388625753cf316a59a821ba64e39fde316dfefcd14fd7414a8a3a85` |
| `web/content/character-rosters/recovery/023.b64` | 100002 | `6a831efb2dbf3ff3e7a5ad0e804701ef545b73ad31e0e3f79760e7840d8f0a1d` |
| `web/content/character-rosters/recovery/024.b64` | 100002 | `c069fb5e746629feef1df4f3526f601e7af9b2df0ef2872cd08d535e082edecf` |
| `web/content/character-rosters/recovery/025.b64` | 100002 | `6f3a749fbe5e3fafed70a039ad955568531ad7479a0bcb519458ee83fd82c419` |
| `web/content/character-rosters/recovery/026.b64` | 100002 | `35e78863431670bf24daffe8a5ecf559cf291a1667be0b052bbbb416b8ff8303` |
| `web/content/character-rosters/recovery/027.b64` | 100002 | `4df0f54ec905625043321d7441ffa28ad1b92094809f807a7b9b8034a56daec4` |
| `web/content/character-rosters/recovery/028.b64` | 100002 | `03a277974a6fbca88aa41874ed63ade2f749debf06e707c748d8a81960f5b66b` |
| `web/content/character-rosters/recovery/029.b64` | 100002 | `8ec1e6f02d8942fb5449ad75cd8b18f51f1739151183ac87040e9b409b059d21` |
| `web/content/character-rosters/recovery/030.b64` | 100002 | `1fd23c1b8580f99d0cb5b5da7fd2f04fc2b9d06823792e8306e3648a077b0021` |
| `web/content/character-rosters/recovery/031.b64` | 100002 | `cc5bd7c7e9307e3d7967abbcd0c7efdc8955cbca2a6fa6bacf5a8c52fa5b2b48` |
| `web/content/character-rosters/recovery/032.b64` | 100002 | `a33c5fe86c2ac0af6d749ffa2daed547e07cc5b0897525cbb77feb4f1cf1c3a9` |
| `web/content/character-rosters/recovery/033.b64` | 100002 | `e2f9ac9b8745118fc4972bc427cf53671f63cc209699b33e8293c53c20e4eb9d` |
| `web/content/character-rosters/recovery/034.b64` | 100002 | `a8ccd86b5d524d08b9418c24d3ad5df850609f2a9c6a8e21841bca4c222b72e0` |
| `web/content/character-rosters/recovery/035.b64` | 100002 | `0e3cd29f47a96cdfae92fcd7b16c510503cae1c75cbfdbafdf883ee6143a6a50` |
| `web/content/character-rosters/recovery/036.b64` | 100002 | `b164d065e5f56d3ad581eb0bf83ff0d42b1e16aaf4ee42436ca1d08ed5fa4876` |
| `web/content/character-rosters/recovery/037.b64` | 100002 | `ca136c2aab75d6fe5e1c15c681948231a9c4159a68449df65c28cf1cc4e82c5c` |
| `web/content/character-rosters/recovery/038.b64` | 100002 | `43fe89b73be4d159aa7f34a8cb5415bf68b7f087eaceda6db19b7787f0e3922e` |
| `web/content/character-rosters/recovery/039.b64` | 100002 | `bf786a4206820f186fdae9bc4419b766907e9d87c7755b09d64435e6cca50c22` |
| `web/content/character-rosters/recovery/040.b64` | 100002 | `6b2ee9b713e617cb30e8a10b338e1f1f6fbd05db7cca9f38b89e77dd41c5ae3d` |
| `web/content/character-rosters/recovery/041.b64` | 100002 | `ac6225be55963e08237856f0360b4e130d62e73cf73c6b7b7e62b1c9226eb67d` |
| `web/content/character-rosters/recovery/042.b64` | 100002 | `392adf923ce874e6e87ff52ecae0bb366bbce46ef8f411d2ac06bbe7835ed17e` |
| `web/content/character-rosters/recovery/043.b64` | 100002 | `8adf9d41a30808aa34bc687f48fc7b0b831f8fc23fc9c7e7f1f619a8fccff46f` |
| `web/content/character-rosters/recovery/044.b64` | 100002 | `bc38079f611256b3fac6bfece459ca23a129736a709eb1c1e843206987ec9b5e` |
| `web/content/character-rosters/recovery/045.b64` | 100002 | `e0536ae108e3bd3542253fea9bfebe8715ccdd151c2ca9b9da2e141cc55975cf` |
| `web/content/character-rosters/recovery/046.b64` | 100002 | `5fcf13284a39a00f289d673300959f1ecb0ce8a66412bcafe95bc054806665f9` |
| `web/content/character-rosters/recovery/047.b64` | 100002 | `1b5bc0c7aa0636237264c178bb68b534f3792aa57af83e3000e84757365a5f6b` |
| `web/content/character-rosters/recovery/048.b64` | 100002 | `82e782c48810a7a6a5730a9c26c4f3e02cbc3c6fadcc6b9f868481bc7c459ea6` |
| `web/content/character-rosters/recovery/049.b64` | 100002 | `0b389607da6d91639f0e5a7dc125aee57b1ae6486b26b0af327546e501665d63` |
| `web/content/character-rosters/recovery/050.b64` | 100002 | `ce821d2dac09b9b8f54c603668bb1cb856b1e85b676e4ad2e04d5680d8af8936` |
| `web/content/character-rosters/recovery/051.b64` | 100002 | `f44493821ab6b4eafd2ee92b073fa3476267867659a713f9aa838feac1aefb4c` |
| `web/content/character-rosters/recovery/052.b64` | 100002 | `72d74b050e7099d4ea965ee41cfeaad35e6910d5fcd4adb4b49f61b03adcae29` |
| `web/content/character-rosters/recovery/053.b64` | 100002 | `27f15749c67b67a38096d510e80ddf8776da7b54244e33697a5958f9f16a50fb` |
| `web/content/character-rosters/recovery/054.b64` | 100002 | `e2f648f758b72f50752f951cc4cad931692c4ef22e9f474b982b15b47eef66bc` |
| `web/content/character-rosters/recovery/055.b64` | 100002 | `b1665c3d3089f3ab90b5edb882807281d2df4cb2862f7e2e31297aa77d2e515f` |
| `web/content/character-rosters/recovery/056.b64` | 100002 | `3d4d9fd7017c057af5071ded2e761280598e24d63ecde08e54effe354d3d9c43` |
| `web/content/character-rosters/recovery/057.b64` | 100002 | `cd426effcb08a4516bb1dd58feede7f2c2758ab12e4e12aed1319531eaa8bcad` |
| `web/content/character-rosters/recovery/058.b64` | 100002 | `4a6cf55d5c941be1c5b68b3c0a892d24dc434f54125d87cc860a3a8fbcb45acd` |
| `web/content/character-rosters/recovery/059.b64` | 100002 | `f111181c2c42319a0b064f39015389e07f71f2c01e22dda47524a2e3cb7481bf` |
| `web/content/character-rosters/recovery/060.b64` | 100002 | `03ebae046fb44d6fa624c2763dbda20a189e6eefb70f8e4f9dd6bfca6291970a` |
| `web/content/character-rosters/recovery/061.b64` | 100002 | `5a0281cc565f7aac9948e741ee8a8a47c90a0e71af840bd14ae75a4a0c22925d` |
| `web/content/character-rosters/recovery/062.b64` | 100002 | `0d990ce29f137d2d0c30af0c382b767d3ca6a0dd0275f68f728eea63e916c9d4` |
| `web/content/character-rosters/recovery/063.b64` | 100002 | `7f6bdfdec18f5ebe07445c19bcc50772ee1da19822765a715450d55c0cbd9563` |
| `web/content/character-rosters/recovery/064.b64` | 100002 | `c35ea9f47255baf93fb6f04444bc8076255588f8231eeddf6d7e427fcf3da5c4` |
| `web/content/character-rosters/recovery/065.b64` | 100002 | `48501ef3070377ad5c6dd7106af1fdba642d7c09f156bbd04a471c90e4a601b0` |
| `web/content/character-rosters/recovery/066.b64` | 100002 | `f45f669cb31878df447416be649eb27cc1025a85bbfd28c6bdea4fc1221d2cbb` |
| `web/content/character-rosters/recovery/067.b64` | 100002 | `466333b38f0fc661aa961a0919951200f5c56d7a37f82b69bcf15ffbc63d014a` |
| `web/content/character-rosters/recovery/068.b64` | 100002 | `bcf6f4a54fa511d1ae459d0158d86747395d4f005ea2dfd478f125e1afab99ff` |
| `web/content/character-rosters/recovery/069.b64` | 100002 | `670db56ed719cc130b124846f03aca0941cd5c88b93201ac333b20bdeb11d8da` |
| `web/content/character-rosters/recovery/070.b64` | 100002 | `f41b59bc29e1965ccf0ae7cc4abb14db11a99d0d8f9bd415d7e01f3c105d40a3` |
| `web/content/character-rosters/recovery/071.b64` | 100002 | `413f26f0d44a3ed7931dc15689f108579a95c401c8950fa9eedd2af024315e58` |
| `web/content/character-rosters/recovery/072.b64` | 100002 | `ab952e325eb91051b395c2ec2b13e348d8a7f5e281d5948682a2ebd170eb5590` |
| `web/content/character-rosters/recovery/073.b64` | 100002 | `0829a2914bd2c9cda12be6f3b4db8a22cbca3b5244b4498355a3e266a0dc5ca4` |
| `web/content/character-rosters/recovery/074.b64` | 100002 | `4a5d59890b19d70359c428e051d14134b7fecef1066492011ebe321b3426ec19` |
| `web/content/character-rosters/recovery/075.b64` | 100002 | `82fd4cd5d0ebd5504b33600d736e09395d7243b88c6b5e819657f399f4c5d9fe` |
| `web/content/character-rosters/recovery/076.b64` | 100002 | `4544b924aed458032a483b4929047d4ab3c3212416da1eb91e1f0efbe36a8ef6` |
| `web/content/character-rosters/recovery/077.b64` | 100002 | `ea53864c6ad7d8bb6537b04c24fd6a38bcefa33cb3cbef4b9bc5056c004afbbb` |
| `web/content/character-rosters/recovery/078.b64` | 100002 | `837695746f8419ef9fffef57ddbeb285e1136a53c0ceea32c7b484661fdd4a4d` |
| `web/content/character-rosters/recovery/079.b64` | 100002 | `7a128d68341cf652bf4fd5be929149c9a550d4d4c97bbad8e5953895500f263a` |
| `web/content/character-rosters/recovery/080.b64` | 100002 | `a82c18f86949f2e1e2cdc79082052b8c5f72bc9f3751d36dc393e4ff5af6eb89` |
| `web/content/character-rosters/recovery/081.b64` | 100002 | `dd589550fe7b206acec9fcc660f4da340dd39ab2c87aa4309d2bedea9b4b56f6` |
| `web/content/character-rosters/recovery/082.b64` | 100002 | `251b3f7124d1901890185c2a217fcf5c0155d6dabd1fb4e74382240595743126` |
| `web/content/character-rosters/recovery/083.b64` | 100002 | `7db452d786b2310b4a2965d2e2bee4deae4cac8e298cc31aa22c2fbdc823f3d4` |
| `web/content/character-rosters/recovery/084.b64` | 100002 | `c5d36711a4fc52779093686f745d6c02fdb2227a9925688afdd51e6c3e3d389f` |
| `web/content/character-rosters/recovery/085.b64` | 100002 | `26bbe70fd1c577bb255eb69688c47299f0a9d6c590fb28848ff8014fbedcd37c` |
| `web/content/character-rosters/recovery/086.b64` | 100002 | `8a569fa0ebd7a59660aa53ec5e20a23e3894e60d62b5642f4ce4765067731d1e` |
| `web/content/character-rosters/recovery/087.b64` | 100002 | `7a9277d756db4b9860dc8a2246cb5a51f6be3f60ef6b72c1cb89bae29fd02480` |
| `web/content/character-rosters/recovery/088.b64` | 100002 | `9a7eefb13fc4de061f8bc6e41a456741e034858f4d9ec54c9aafbbd3815cb134` |
| `web/content/character-rosters/recovery/089.b64` | 100002 | `5da98ec6d0fbe42bb4375d90c89dde621fcaa4d8c9a2f38a20ad7edaf242402f` |
| `web/content/character-rosters/recovery/090.b64` | 100002 | `4738256a60fc0eaef8b8908bba19aa2537b1128cace9c27b066753ae19801530` |
| `web/content/character-rosters/recovery/091.b64` | 100002 | `67073a1badcee6c096373c382591a8fa30dbe075e39fecff5bbaf52ee9aa962c` |
| `web/content/character-rosters/recovery/092.b64` | 100002 | `c4164b7cc91544ace97a4ef870d0a1f01cdb978a93a7bf4d0499219fe03a931d` |
| `web/content/character-rosters/recovery/093.b64` | 100002 | `4f9dd66c3665d4e16bc53d8c54cb0dd7b3795b907c2057e60c72b4fe73136789` |
| `web/content/character-rosters/recovery/094.b64` | 100002 | `0f2cd3533a7328a94d6d9269476b86b4c62d2149a9cfe3839ab8db5a9f8faf91` |
| `web/content/character-rosters/recovery/095.b64` | 100002 | `4d54b3e8d80514d4b7bdff0ff3e6d65907227cfc931676f4a206f66940441c56` |
| `web/content/character-rosters/recovery/096.b64` | 100002 | `0cfd98f886dda686cfa99dd925867a26e52dde05306cf39f9fd47340e894c1d9` |
| `web/content/character-rosters/recovery/097.b64` | 100002 | `3899919ffcf62321bedfd9c8b85e668b638a246e70d7348da81a44081170ff0b` |
| `web/content/character-rosters/recovery/098.b64` | 100002 | `605bd76f23343712e171d308bff81bf634624f96339052f73a358da9847016ce` |
| `web/content/character-rosters/recovery/099.b64` | 100002 | `ad6322472c7b665314e6e1fbcc6453f1d845984c20e1376f25c3d4d0dbb3b78b` |
| `web/content/character-rosters/recovery/100.b64` | 100002 | `577e26755614837d18ef1ee51300502052f3ba38c3212b1cd3b31e1339df3949` |
| `web/content/character-rosters/recovery/101.b64` | 100002 | `00ece082922e3c4abf8d38a5a3c3e291859e685498316a1f9404033faca7ef2d` |
| `web/content/character-rosters/recovery/102.b64` | 100002 | `e0f2571dd84a17f18469ade73fc0c3b8c9e35f4f920e4c74797d0ad871a0705a` |
| `web/content/character-rosters/recovery/103.b64` | 100002 | `b1022107536fed49109482f0fb71a341a1e41f9f3a9a02de7f0a46f563584855` |
| `web/content/character-rosters/recovery/104.b64` | 100002 | `7ec150404576f3e45eba9bd74bbe615e1ce313560fc7936012912ba0338d53ea` |
| `web/content/character-rosters/recovery/105.b64` | 100002 | `59540e70596a931979e10c53483778843c5777bcd17d3809e54c10811b2dc880` |
| `web/content/character-rosters/recovery/106.b64` | 100002 | `362f0c21711094f262ffd193bb05791bdb662dde2eae9fe6a8a0864b233df6f0` |
| `web/content/character-rosters/recovery/107.b64` | 100002 | `a1c0358b1933443c13809ba74143c5b5607e828615b5216c64b33203fc690191` |
| `web/content/character-rosters/recovery/108.b64` | 100002 | `490252addc4d19569e68a5a95cf0ddcffcc8e2689cd76c03f68ab12b6d5d57d2` |
| `web/content/character-rosters/recovery/109.b64` | 100002 | `29c4b2ddea32d8e95901840965573c0d865f6ebc4bad9b66d780bac80fd4d66f` |
| `web/content/character-rosters/recovery/110.b64` | 100002 | `5286f57511d471030a8943a645e901194ba07e4d5db9993076321e848d5a0b0b` |
| `web/content/character-rosters/recovery/111.b64` | 100002 | `28c4c7b08723dbcdab9a3809f9ab723f12d705adc86041499ff018b76ff491c9` |
| `web/content/character-rosters/recovery/112.b64` | 100002 | `fa0c255adc5ad3aea8359a5374ec382a05ace8d42c5bb3590da6dbcb3c3256fe` |
| `web/content/character-rosters/recovery/113.b64` | 100002 | `5c0394f0b8e88a0cf6b2cf507374e7819b518ddc8e58ec718a640a3926659d32` |
| `web/content/character-rosters/recovery/114.b64` | 100002 | `0f04ce591a155ab1b12e4d8f4fced75a56894707196c0939fe6b8eba7314b4de` |
| `web/content/character-rosters/recovery/115.b64` | 100002 | `256e5667c799eb33c925bc02a9f9017082267b42fc3d811b47f4eab92027f28b` |
| `web/content/character-rosters/recovery/116.b64` | 100002 | `69652ddc18ca191eee6863b817b7a5824bd4dfa8a96680781eae39cab111adcf` |
| `web/content/character-rosters/recovery/117.b64` | 100002 | `09496c6e1ca8d9239c6f490f15b4609b8d4aa2bcdd7cb0d35498f2a88b01d651` |
| `web/content/character-rosters/recovery/118.b64` | 100002 | `6fe9c0b24350a448c70bafeee2af78935b902b70d2c1b2a7194bc09ad555abe9` |
| `web/content/character-rosters/recovery/119.b64` | 100002 | `12113b02e153be2dd86bb6cec2d54af6109e45e3a3e1ca5fa99a8013caab0a43` |
| `web/content/character-rosters/recovery/120.b64` | 100002 | `9c235f823b6d94d6ec4611c05ee6eaf95d8f2cb599c2f5f5ded8e0bf2a44f498` |
| `web/content/character-rosters/recovery/121.b64` | 100002 | `fe9004f80b5715ecda9991f153e2ccfca99263d3c5cf4171e15c7ce9d06176bd` |
| `web/content/character-rosters/recovery/122.b64` | 100002 | `cb1fcd262b8445d5ecf0a072b885b092ec05c82b399f33cd1f630a68022e3ad3` |
| `web/content/character-rosters/recovery/123.b64` | 100002 | `8ab50ae558b6e17ed2d100119ccdbd378d72e2005628cd8384efcfa047b4fa27` |
| `web/content/character-rosters/recovery/124.b64` | 100002 | `250430c435eb1ea640d8519153cd0169c8e5aadf7b7071cf470b1fecff88ccdd` |
| `web/content/character-rosters/recovery/125.b64` | 100002 | `79f589b110ce42a280c9771b0abdbe5315cbbc63487c9a4fb50260111e0bbadd` |
| `web/content/character-rosters/recovery/126.b64` | 100002 | `29d92835e036c7ac0a2543b8f27cf9ffe2c5c2b90d7885af48ac98e5c6643ab5` |
| `web/content/character-rosters/recovery/127.b64` | 100002 | `2c8aa5f946103d096b70894a8d2f11ee887fba31989bb5ecd9cbad1fde232512` |
| `web/content/character-rosters/recovery/128.b64` | 100002 | `559c6046ad5743218d334c812812e669da838b6e7ea2a0aae4fda47abb798d0d` |
| `web/content/character-rosters/recovery/129.b64` | 100002 | `14bdf837fd1223f8e9473a6d932fc4588716e6366d06cf3a34907c1397543f9f` |
| `web/content/character-rosters/recovery/130.b64` | 100002 | `0ce6d294fd5993f71e2be861747c2847b0fb1a0264413b290f3bda24db8711c9` |
| `web/content/character-rosters/recovery/131.b64` | 100002 | `e7169c0c13e6f9297b6f40417e00547cb67080c4f28b6872c8a0accc3d80c6f8` |
| `web/content/character-rosters/recovery/132.b64` | 100002 | `db6d62d3c678865b2b62a5e49e327a2884691e5f4529ca083940abcafa5248c4` |
| `web/content/character-rosters/recovery/133.b64` | 100002 | `990849f25671b1a85463423d44be8f5a98cc47fe0bc7e6164dff38c1dcd87651` |
| `web/content/character-rosters/recovery/134.b64` | 100002 | `af6d2a6f6225c75af515cc50fa7de2949e741eb8be76463dd38a87dba4a621be` |
| `web/content/character-rosters/recovery/135.b64` | 100002 | `b7a350a7ab3c2f542daf4db37386df7e1d2d2e93a58e53421495448d9fea4d32` |
| `web/content/character-rosters/recovery/136.b64` | 100002 | `f1ec527f2ca1586ddfd0720fafa39a447de41b245458d12e3cd25f66ee8a0734` |
| `web/content/character-rosters/recovery/137.b64` | 100002 | `0fd7de49d90a5fe090eada1f5a34623b2c1d2fda4096908d083d5191bf8adb65` |
| `web/content/character-rosters/recovery/138.b64` | 100002 | `938058a2bcda43286e6da4162562e136d563fdd4fd8030c7c1df27e9bac9a682` |
| `web/content/character-rosters/recovery/139.b64` | 100002 | `c805b8eff6411cc21cd62f4510acbdc252c414cb182f286f6bbb8e32d07edefd` |
| `web/content/character-rosters/recovery/140.b64` | 100002 | `18e66a4a68fd62617a345feacc449f86a795446a280ea3dcba6dd23dd60b8704` |
| `web/content/character-rosters/recovery/141.b64` | 100002 | `2d6dba749a8a309cf9e8a51dbec9d2b9dbb8242f6114172fb9716bd198ab8d82` |
| `web/content/character-rosters/recovery/142.b64` | 100002 | `4fb5a7386a1ddb97d8ee1b3325d73a379c5d0036e3ae52f942676e486ea3698b` |
| `web/content/character-rosters/recovery/143.b64` | 100002 | `3b3d799c21b6ce1c76c6da1faeba0012e84b7240c12876dfbf6c4805836eab3a` |
| `web/content/character-rosters/recovery/144.b64` | 100002 | `ad7e2d90e4dc6d54248d4e41f73b052f9d704ef4372f89179271b595f990bd49` |
| `web/content/character-rosters/recovery/145.b64` | 100002 | `c581f7d504f9d491c99f464f80ff983512e2e64009ddcad442db762b1c2108d0` |
| `web/content/character-rosters/recovery/146.b64` | 100002 | `4615152b8bc45b459b73684f81db6773c4d18005f3cd0b8f90378f0f305e70fb` |
| `web/content/character-rosters/recovery/147.b64` | 100002 | `09d633dc4d8cd37c7a01ec538ea49add2ed99f94e48193b0c24f745148c0dbaa` |
| `web/content/character-rosters/recovery/148.b64` | 100002 | `57efd391ca78dda7499257cf36e155b430a0a1d795d418504a4d91a5fc3e1ccd` |
| `web/content/character-rosters/recovery/149.b64` | 100002 | `f9fa4449c193eb1d15d11ae399c57ca6cf1be86f83ede778fb329fab39e39760` |
| `web/content/character-rosters/recovery/150.b64` | 100002 | `64d2fcb36688a8fce895e0e7f854106fdbc66763ac7d9aea54f1e5edcbd0633e` |
| `web/content/character-rosters/recovery/151.b64` | 100002 | `6973fe96fa604f4a66279f9bebf23bd517c38417eb618f84c518adc9ddf1ffd0` |
| `web/content/character-rosters/recovery/152.b64` | 100002 | `fa0d5d97dc45e9fc0938b9d6c8aec58345d83c278a8f3e9b4e267cb5e4f9c065` |
| `web/content/character-rosters/recovery/153.b64` | 100002 | `a3ff928c2a0264e2a40085f6cec5be83c952ea113b69b4c072ee0814a43544c0` |
| `web/content/character-rosters/recovery/154.b64` | 100002 | `c48b166316aeb0c0c2428e489aab93b37e9adae83e21fdd87ed3f946bae5cbd5` |
| `web/content/character-rosters/recovery/155.b64` | 100002 | `c098c6a458928850fab1e8462f2011c2eb0b6eb1bd716ced3b368e526428f82b` |
| `web/content/character-rosters/recovery/156.b64` | 100002 | `f74d86f0ed4a29910d7e406c0497acb92631e2dbb9a3227ddea4bd6471b4fab9` |
| `web/content/character-rosters/recovery/157.b64` | 100002 | `fbe1bb0e71ccc034a3c3c9c90739816d5d036d29a494f69561c6f55a72c3718a` |
| `web/content/character-rosters/recovery/158.b64` | 100002 | `2b4aa6ab42c412cbd93b60d16bbc7d44652aab9ac53d0528860704ee0174a984` |
| `web/content/character-rosters/recovery/159.b64` | 100002 | `e2d2b5ba639ad5e3c9080830d07b3161a10f6b3030f2ee8b5e00eb051917f8b3` |
| `web/content/character-rosters/recovery/160.b64` | 100002 | `03013bcd2e1166a61bfacef50722a6d4021568df07e3669ac570474d249bf492` |
| `web/content/character-rosters/recovery/161.b64` | 100002 | `d57f49e2b48cf150afe39f6e541d9a9062e1d78aaf752fd20465663ff87aef1f` |
| `web/content/character-rosters/recovery/162.b64` | 100002 | `163861b0671ccc81e29da573c843c33756340f0af45f8fba1957c31c379a593c` |
| `web/content/character-rosters/recovery/163.b64` | 100002 | `a97d394bed6da72f3b493c0551140aea19c73e77d02b0f39dff9472cac6b4983` |
| `web/content/character-rosters/recovery/164.b64` | 100002 | `6283400aed16cf00eccb5d182b91da18e5a8db3c3b67e3bcf61409b92db40cd7` |
| `web/content/character-rosters/recovery/165.b64` | 100002 | `0d76b6bc87c147afe81020596d390945474adf0340215f83ab7262ba4070d056` |
| `web/content/character-rosters/recovery/166.b64` | 100002 | `6d5b7a75b227b23d11536a88d8d13507bef407e1532ff779de6398604821a37f` |
| `web/content/character-rosters/recovery/167.b64` | 100002 | `3bade94fd01e7a7c958635d1819071cbcf5c89a94bf4693806c1c9ea4be06c13` |
| `web/content/character-rosters/recovery/168.b64` | 100002 | `e96aafc330a36b6e6ba434611ffb59ee344580fec9df49698aa5f002690bb8f6` |
| `web/content/character-rosters/recovery/169.b64` | 100002 | `1133253b8f5ebc54ed5d562552c74669fae4c45ac064baef0dad87601f6b4a6e` |
| `web/content/character-rosters/recovery/170.b64` | 100002 | `4b8235aa98684edc396b01068b2c3173d7559cc58f81245bab233a5361e09b57` |
| `web/content/character-rosters/recovery/171.b64` | 100002 | `9847167b2f20b0bc177e27e34b31eca41f02f2bb374651e23ab8e0fa9a762e7c` |
| `web/content/character-rosters/recovery/172.b64` | 100002 | `97e27bdf5cab927d04a7dda6bb885e481224d8f93c96e90711197de5fbfdc234` |
| `web/content/character-rosters/recovery/173.b64` | 100002 | `9bca99d096c01dcad34dfc44b5a1a844cfe3216e72c8c319569116ae35b782e7` |
| `web/content/character-rosters/recovery/174.b64` | 100002 | `807c0cd473ac1a714f3585d9dc3514c824aeb816a2a9ab5d7eb4c256173bdbe1` |
| `web/content/character-rosters/recovery/175.b64` | 100002 | `9fcc53f97e304862cf2964df37d5633708a34d2cbda6eed3697a40cd0e130346` |
| `web/content/character-rosters/recovery/176.b64` | 100002 | `97029ed93588711c713e16b8e678e2248ddfb667dfc2845df7a9cd1e2b0751ae` |
| `web/content/character-rosters/recovery/177.b64` | 100002 | `38449b891eac34af660c2862afd9401ba12ab5b74e9740bf97ec158ce684040b` |
| `web/content/character-rosters/recovery/178.b64` | 18994 | `24504d6da7a678902320be4adabca6cb7e48a6a63643dead42bf730f19c76bcc` |

### 추가 비공개 검증 입력 5개

`gagether-private-validation-inputs.zip`은 기존 수치 검증에 필요한 보존 원본이다. Windows 줄바꿈을 원본 LF로 복원했으며 각 파일이 기존 코드의 고정 SHA-256과 일치함을 확인했다. 배포 런타임은 아니고 전체 연구 디렉터리 백업도 아니다.

| 제외 파일 | bytes | SHA-256 |
| --- | ---: | --- |
| `web/ops/research/wuwa-echo-stat-rules/source-public_Data_EchoStats.json` | 3318 | `5e4772d31a81c5132b5ef0021aa3a5ca1415f19d43598b771048b84f4c381215` |
| `web/ops/research/wuwa-echo-stat-rules/source-contexts_GameDataContext.tsx.txt` | 17726 | `9cf8743956b424adc08b3e08f00e7bf4d17da06c011133e3ada34c8acf619b9c` |
| `web/ops/research/wuwa-echo-stat-rules/source-lib_calculations_echoes.ts.txt` | 2519 | `1c892b2c7aa78eb433db90b7cfa43a82653954aee1c911f5530df0b46dc7dca8` |
| `web/ops/research/wuwa-echo-stat-rules/source-components_echo_EchoPanel.tsx.txt` | 11695 | `8a902bdb6573247bac8e1f65b6c41b66d9811e7935181e8c79309cf4b4d58a2d` |
| `web/ops/research/wuwa-echo-stat-rules/source-scripts_sync_echoes.py` | 19280 | `26186f226d19beec1a92e8e7aed93f0d973bef53ab6e8e7d4fc2c84103f0f8b4` |


## 11. 최종 GitHub 검증

소스 기준 커밋 `0ef3aae11ea8e35313916190bc2b798dda08bee5`에서 원격 런타임 814개가 배포본과 정확히 일치했다. 처음 전송 때 Git ignore 규칙으로 누락된 `build/wuwa-data.ts`를 발견해 코드와 예외 규칙을 반영한 뒤 다시 검증했다. 공개 제외 99개 파일의 새 내용 전송 0, web/ 밖 변경 0을 확인했다.

- [배포 소스 일치 검사 41199198703](https://github.com/tomochelly/gagether-android/actions/runs/41199198703): success.
- [Android 검사 41199198824](https://github.com/tomochelly/gagether-android/actions/runs/41199198824): success.
- [웹 전체 검사 41199198696](https://github.com/tomochelly/gagether-android/actions/runs/41199198696): failure, Node 364개 중 140 통과 / 224 실패. 공개 제외한 upcoming-games, reviewed-broadcast-media 등 JSON과 보존 원본 입력의 누락이 로그에서 확인됐다. 후속 타입·편집기·Python 단계는 실행되지 않았다. 전체 CI 통과로 표시하지 않는다.

비공개 overlay/검증 입력을 복원한 전체 CI 재실행과 독립 Cloudflare 빌드는 별도 이전 환경에서 확인할 항목이다. 이번 실제 Sites 빌드와 관련 기능 검증, D1/R2 복원 검증 결과는 앞의 범위를 따른다. 비공개 데이터를 공개해서 CI를 통과시키거나 실패 검사를 생략하지 않았다.
