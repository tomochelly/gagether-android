# GAGETHER 디스코드 봇

15개 게임의 가게더 저장값을 조회하는 슬래시 명령어와 채널 구독 알림입니다. 사이트에서 수정한 값이 반영된 공개 읽기 API만 사용합니다. 운영자·업데이터 권한, 개인 설정, 메일, 제보, 사용자 계정에 접근하지 않습니다. 별도 AI API나 Gateway 상시 연결은 필요하지 않습니다.

## 사용

- `/명조`, `/블아`, `/명일방주`, `/원신`, `/스타레일`, `/젠레스`, `/니케`, `/우마무스메`, `/소녀전선2`, `/엔드필드`, `/이환`, `/트릭컬`, `/붕괴3`, `/리버스`, `/스텔라소라`
- 결과 아래 **요약 · 픽업 · 이벤트 · 공지 · 방송** 버튼, 서비스 선택, 다음/이전, 방송 종료 아카이브
- `/검색`: 입력 창에 검색어를 쓰거나 명령어의 선택 입력란 사용
- `/알림`: **새 알림 설정 → 게임 → 서비스 → 종류 → 시간 → 언어 → 채널 → 저장**
- 서버 관리/관리자 권한이 있는 사람만 채널 알림을 설정·변경합니다. 조회와 검색은 서버 구성원 모두 사용할 수 있습니다.
- 게임별 서비스 선택은 해당 서버·사용자별로 기억합니다. 웹 내 게임/Google 계정과 자동 연결하지 않습니다.
- 알림은 채널 단위입니다. 이 버전에는 역할 멘션, 개인 DM, 조용한 시간 설정이 없습니다. 모든 자동 멘션을 차단합니다.

## 실제 연결에 필요한 것

이 소스만으로 Discord 앱이나 Cloudflare 계정이 자동 생성되지 않습니다. Discord의 앱 등록/초대는 무료입니다. Cloudflare 무료 한도 내에서 운영하도록 구성했지만 실제 CPU·요청·DB 사용량과 서비스 정책에 따라 제한될 수 있습니다. 유료 플랜 자동 가입은 하지 않습니다.

1. [Discord Developer Portal](https://discord.com/developers/applications)에서 **GAGETHER 전용 앱**을 만듭니다. Application ID, General Information의 Public Key, Bot의 토큰을 준비합니다. 토큰은 채팅/코드에 붙이지 않습니다. Privileged Intents는 필요하지 않습니다.
2. Cloudflare 계정에 별도 D1 `gagether-discord`를 만듭니다. **사이트 기존 DB를 사용하지 않습니다.**
3. GitHub 저장소 `tomochelly/gagether-android`의 Settings → Secrets and variables → Actions에 다음을 등록합니다.

| Secrets | 값 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | 해당 계정 Workers 배포·D1 관리에 필요한 범위만 부여한 토큰 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 계정 ID |
| `DISCORD_BOT_TOKEN` | 전용 봇 토큰 |
| `DISCORD_PUBLIC_KEY` | Discord 앱 공개 키 |

| Variables | 값 |
|---|---|
| `DISCORD_APPLICATION_ID` | 전용 앱 ID |
| `DISCORD_DATABASE_ID` | 새 봇 전용 D1 ID |
| `DISCORD_TEST_GUILD_ID` | 우선 시험할 디스코드 서버 ID |

4. GitHub Actions → **GAGETHER Discord bot** → Run workflow에서 `deploy`를 켭니다. 처음에는 `enable_notifications`를 끈 상태로 배포합니다. CI가 실패하면 배포하지 않습니다. 배포 시 DB 생성은 하지 않으며 이미 만든 전용 DB에 추가형 마이그레이션을 적용합니다.
5. 배포 결과의 Worker URL 뒤에 `/interactions`를 붙여 Discord 앱의 **Interactions Endpoint URL**로 저장합니다. Discord가 보낸 서명 있는 PING이 통과해야 저장됩니다. `/health`는 설정 여부만 보여 주며 비밀값이나 구독 목록을 공개하지 않습니다.
6. 워크플로 로그의 Invite 링크로 시험 서버에 초대합니다. 최소 권한은 채널 보기·메시지 보내기·링크 삽입·메시지 기록 보기이며 Administrator는 요청하지 않습니다. 앱 등록/초대만으로 알림 구독이 생기지는 않습니다.
7. `/명조`, `/블아` → 일본 선택, `/검색`, `/알림`을 시험합니다. `/알림`에서 구독을 저장한 뒤 `enable_notifications`를 켜고 다시 배포합니다. 기본 Worker Cron은 1분 간격입니다.

명령어 등록은 이 **전용 앱의 시험 서버 명령어 집합**을 교체하고 GET으로 재확인합니다. 기존 다른 봇 앱의 토큰을 사용하지 마세요. 전체 공개 명령어 등록은 별도 `node discord/scripts/register-commands.mjs --global` 명령으로만 합니다.

## 로컬 확인/수동 배포

저장소의 `web` 폴더에서 기존 의존성을 설치한 후 실행합니다.

```sh
bash scripts/install-pnpm.sh
node --test tests/discord*.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
node discord/scripts/register-commands.mjs --dry-run
node node_modules/wrangler/bin/wrangler.js deploy --config discord/wrangler.jsonc --dry-run
```

수동 배포는 `wrangler login`, `wrangler d1 create gagether-discord` 후 실제 ID를 환경 변수로 설정하고 `node discord/scripts/configure.mjs`를 실행합니다. 비밀은 `wrangler secret put DISCORD_BOT_TOKEN --config discord/wrangler.jsonc` 및 `DISCORD_PUBLIC_KEY`로 입력합니다. 토큰이 담긴 파일을 커밋하지 않습니다. `.env.example`은 이름 안내용이며 자동으로 로드하지 않습니다.

## 알림 기준과 장애 처리

- 사이트의 `/api/discord/data?locale=ko&region=kr` 공개 투영을 이용하며 ETag/304 및 봇 DB 캐시로 불필요한 조회를 줄입니다. 별도 수집기로 원본 정보를 중복 관리하지 않습니다.
- 실제 서비스와 시장/언어 범위를 사이트 공통 규칙으로 분리합니다. CN은 명일방주·소녀전선2·리버스1999만 선택합니다. 공유 서비스의 한국/일본은 같은 실제 일정과 각 시장 공지를 사용합니다.
- 날짜만 있는 일정·예상 픽업에는 정확한 시각 알림을 만들지 않습니다. 명시된 실제 시각만 예약합니다. 방송 예정과 LIVE는 별개이며 신선한 실제 LIVE 메타데이터만 LIVE 알림을 만듭니다.
- 기본 1분 점검. 정상적인 환경에서는 마감 전 알림을 1분 내 감지하는 것을 목표로 하지만 Cloudflare·Discord·가게더 장애 시 보장하지 않습니다. 5분 이내 지연만 따라잡으며 종료 후 오래 지난 종료 임박 알림은 폐기합니다. LIVE와 새 공지는 가게더의 수집 지연도 더해집니다.
- 초기 구독/재활성화는 기존 공지 목록을 기준점으로 저장하고 과거 공지를 일괄 발송하지 않습니다. 이후 새 공식 공지를 전송합니다. 공지 본문이 같으면 재발송하지 않습니다.
- 같은 게임/서비스/풀/회차/시각의 동시 픽업은 하나의 알림으로 묶습니다. 채널·언어·이벤트 키와 DB 발송함으로 겹치는 설정의 중복도 줄입니다.
- 채널 보기·발송·Embed 권한을 확인한 후 구독을 저장합니다. 자동 발송 직전에 구독 켜짐·설정 버전·현재 일정/취소 여부를 다시 확인합니다.
- 429는 Retry-After 뒤 제한된 유효 기간 안에서 다시 시도합니다. 네트워크 끊김·5xx·중단된 전송은 `uncertain`으로 보류하고, 최근 메시지의 동일 nonce와 실제 message ID가 확인됐을 때만 성공으로 완료합니다. Discord의 nonce 중복 검사는 짧은 기간에만 유효하므로 불확실한 전송을 무작정 재전송하지 않습니다.
- 권한 오류는 `failed`, 일정 변경/구독 해제는 `cancelled`, 지나간 알림은 `expired`. `/알림 → 설정 목록`에서 실패·확인 대기 수를 보여 줍니다. 일부 수집 실패와 전체 실패는 봇 DB `bot_health`에 구분합니다.
- 매 실행 최대 20건 발송, 최대 50개 활성 채널/서비스/언어 설정. 게임은 한 설정에 15개까지 고를 수 있습니다. 더 큰 공개 배포는 부하 측정 후 큐/실행 분할을 확장해야 합니다.

## 중지·복구

- 채널 단위: `/알림 → 설정 목록 → 해당 설정 → 알림 끄기`.
- 전체 알림 중지: workflow를 `enable_notifications=false`로 재배포. 전체 명령어도 중지하려면 Worker 변수 `BOT_ENABLED=false`.
- 코드 롤백: Cloudflare Workers → Deployments에서 이전 버전 재배포. 별도 봇 DB와 추가형 스키마를 보존합니다. 사이트 DB·소스·업로드에는 영향을 주지 않습니다.
- 전송 불확실: 봇 D1 `outbox`의 `uncertain` 및 해당 채널 최근 메시지를 대조합니다. 메시지가 발견되면 자동으로 실제 ID를 연결합니다. 최근 100건에 없다는 이유만으로 미발송을 단정하거나 행을 삭제해서 재전송하지 않습니다.
- 인증/권한 오류: Discord의 토큰·초대·채널 권한을 복구하고 조회부터 재시험합니다. 토큰 재발급 시 Cloudflare와 GitHub Secrets를 함께 교체합니다.
- 구독/설정 감사는 별도 `audit`에 보존합니다. Discord 서버/사용자/채널 ID는 관리 기능에만 사용하며 공개 건강 API에 내보내지 않습니다.

## 확인 범위

자동 테스트는 서명 검증, 15개 게임/4개 언어/서비스 분리, 명령어·메뉴, 권한, SQLite 구독/CAS, 일정 경계·예약 취소, 공지 기준점, 중복 방지, 429/실패/불확실 전송을 검증합니다. 실제 앱 ID·봇 토큰·시험 서버 및 Cloudflare 연결 후 Discord 명령어 표시·이미지 로딩·채널 발송·Cron 지연을 마지막으로 확인해야 합니다. 소스 테스트나 Worker dry-run을 실제 Discord 발송 성공으로 표시하지 않습니다.

공식 구현 근거: [Discord HTTP interactions](https://docs.discord.com/developers/interactions/receiving-and-responding), [Discord Workers 예제](https://docs.discord.com/developers/tutorials/hosting-on-cloudflare-workers), [메시지 nonce](https://docs.discord.com/developers/resources/message#message-create), [Workers Cron](https://developers.cloudflare.com/workers/configuration/cron-triggers/).
