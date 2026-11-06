# AI 업데이트 파일 작성 규칙 (Codex용)

GAGETHER 예약 조사 작업은 쓰기 토큰 없이 이 폴더에 **업데이트 파일만 커밋**한다. 커밋하면 GitHub 워크플로가 이미지를 검사하고, 사이트(`/api/ai-sync`)가 커밋된 파일을 직접 읽어 항목별로 반영한다. 설계: 비공개 저장소 `web/ops/AI-UPDATES.ko.md`.

## 1. 어디에, 어떤 이름으로

- 저장소 `tomochelly/gagether-android`의 최신 `main`에서 자기 브랜치 **`codex/…`**를 만든다. **자기 브랜치(codex/…)에 push만 하면 반영된다. PR은 만들지 않아도 된다.** 기존 `ai-updates` 직접 push도 지원한다. `main`이나 그 밖의 브랜치에는 업데이트를 커밋하지 않는다.
- 브랜치에 `.github/workflows/gagether-ai-sync.yml` 호출 파일이 있어야 한다. 오래된 브랜치는 운영자가 확인한 최신 main에서 새로 만들고, 호출 파일·core·검사 코드를 직접 바꾸지 않는다.
- 여러 브랜치에 같은 파일을 복사해도 `requestId`(파일 이름)와 SHA-256이 같으면 완료된 요청을 다시 반영하지 않는다. 같은 이름·다른 내용은 409로 거절한다. 이름을 바꾸면 별도 요청이므로 재전송을 위해 이름만 바꾸지 않는다.
- 위치와 이름: `.gagether/updates/<UTC 시각>-<요약>.json`. 예: `.gagether/updates/20261101T0930Z-wuwa-39-pickups.json`
  - 이름은 영문자·숫자·`-`·`_`만 쓴다(`^[A-Za-z0-9_-]+$`, 최대 100자).
  - 파일 안 `requestId`는 파일 이름에서 `.json`을 뺀 값과 같아야 한다.
- 한 번 실행에 파일 하나를 새로 만든다. 파일 하나에 `entries`와 `changes`를 합쳐 최대 100개, 1,000,000 bytes까지.
- **한 번 커밋한 업데이트 파일은 고치지 말고 새 파일로 낸다.** 같은 이름인데 내용이 달라지면 사이트가 오류로 거절한다. 고칠 것이 있으면 새 시각·새 이름으로 다시 낸다.
- 이 폴더의 다른 파일(`.json`이 아닌 이 README, `example.json.txt`)은 바꾸지 않는다. `.github/` 등 다른 경로도 바꾸지 않는다.

## 2. 먼저 읽을 것

- 지금 공개 데이터: `GET https://gagether.wiki/api/data` (토큰 없음). 아래 `before`는 반드시 이 응답에서 가져온다. `/api/entry`는 값이 조금 다를 수 있으니 쓰지 않는다.
- 항목 형식과 내용 규칙: `GET https://gagether.wiki/api/operations`.

## 2.1 사이트 요청과 저장소 작업 (2026-11-06)

- `gagether.wiki`로 보내는 모든 요청에는 User-Agent를 직접 지정한다. 예: `GagetherUpdater/1.0 (+https://gagether.wiki)`. 기본값(`Python-urllib/…` 등)은 차단된다. User-Agent에 이메일, 토큰 등 개인 정보나 비밀 값은 넣지 않는다.
- 같은 공개 자료(`/api/data` 등)를 짧은 간격으로 반복해서 받지 않는다. 한 번 실행에서 한 번 받은 응답을 저장해 두고 그것으로 비교한다.
- 코드 저장소 변경(업데이트 파일이 아닌 코드·설정·문서)은 PR까지만 한다. 배포 브랜치(`staging`, `production`)에는 직접 push하지 않는다. 업데이트 파일은 1장대로 `codex/…` 브랜치에 낸다.
- 이미 반영된 내용(예: 이미 `live`로 들어간 방송, 이미 있는 픽업)은 다시 제출하기 전에 공개 자료(`GET /api/data`)와 대조한다. 같은 값이면 내지 않는다.

## 3. 파일 형식 (version 1)

```json
{
  "version": 1,
  "requestId": "20261101T0930Z-wuwa-39-pickups",
  "reason": "무엇을 왜 반영하는지 5~300자",
  "mode": "apply",
  "researchedAt": "2026-11-01T09:28:00Z",
  "entries": [ { "...": "새 항목 전체" } ],
  "changes": [ { "id": "...", "set": { "칸": "새 값" }, "before": { "칸": "지금 공개 값" }, "sources": ["https://..."] } ]
}
```

- `mode`: `apply`(검사 뒤 반영) 또는 `dryRun`(검사와 표만, 아무것도 반영하지 않음).
- `entries`: 새 항목. `/api/sync`와 같은 항목 전체 객체(`id`, `gameId`, `region`, `kind`, 4개 언어 `title`·`summary`, `server`, `startAt`, `endAt`, `publishedAt`, `verifiedAt`, `sourceUrl`, `sourceTitle` 등). 이미 있는 `id`면 건너뛴다.
- `changes`: 기존 항목의 칸 바꾸기. 칸은 항목의 **최상위 키**이고, 하위 객체(`localizedArtwork`, `pickupMembers` 등)는 그 키 전체를 새 값으로 바꾼다.
  - `before`에는 `set`에 적은 칸마다 **지금 `/api/data`에 보이는 값 그대로**를 적는다. 칸이 없으면 `null`. `set`과 `before`의 칸 목록은 같아야 한다.
  - 사이트의 지금 값과 `before`가 하나라도 다르면 그 항목은 건너뛴다(그 사이 다른 수집이나 운영자가 바꾼 것). 다음 실행에서 최신 값을 다시 읽어 새 파일로 낸다.
- 바꿀 수 없는 것: `id`, `gameId`, `region`, `editor`, `hidden`, 그리고 어디에 있든 `imageFraming`·`previewFocus`(운영자 구도).
- 칸을 지우는 기능은 없다. `null`은 `startAt`, `endAt`, `publishedAt`에만 쓸 수 있다.
- 운영자가 고친 칸은 반영되지 않는다. 함께 움직이는 칸은 묶음으로 본다.
  - 기간 묶음: `startAt`, `endAt`, `startDate`, `endDate`, `timingNote`, `pickupArchive`
  - 이미지 묶음: `image`, `imageSource`, `imageVerified`, `imageKind`, `imageLocale`, `imageCaption`, `imageFit`, `imagePosition`, `previewBounds`, `previewArtwork`, `localizedArtwork`, `textFreePreview`, `originalLanguageFallback`, `width`, `height`
  - 묶음 중 하나라도 운영자가 고쳤으면 그 묶음의 칸은 모두 건너뛰고, 나머지 칸은 반영한다.

## 3.1 pickupHistory: 지난 픽업 이력

이미 시작했거나 끝난 픽업 배너를 출시 시점까지 거슬러 기록할 때 쓴다. 지금·다음 픽업은 지금처럼 `entries`로 낸다. 같은 파일에 `entries`·`changes`와 함께 넣을 수 있고, 세 배열을 합쳐 100개까지다. `id`는 파일 안에서(세 배열 전체) 겹치지 않게 짓는다.

```json
"pickupHistory": [
  {
    "id": "ba-kr-20240123-aru",
    "gameId": "bluearchive",
    "service": "kr",
    "pool": "character",
    "startDate": "2024-01-23",
    "endDate": "2024-01-30",
    "startAt": null,
    "endAt": null,
    "bannerName": {"ko": "공지에 적힌 배너 이름"},
    "members": [{"rosterId": "10000", "role": "featured", "type": "rerun"}],
    "sources": [{"url": "https://forum.nexon.com/bluearchive/board_view?board=1076&thread=...", "kind": "official", "title": "공지 제목", "publishedAt": "2024-01-22T09:00:00+00:00"}]
  }
]
```

- 배너 하나에 한 줄. 같은 날 시작한 여러 배너를 한 줄로 묶지 않는다(예: 같은 날 픽업 5개면 5줄, 배너마다 공지 속 이름과 출처를 따로 적는다). 같은 배너를 지역 라벨만 바꿔 여러 번 쓰지 않는다. `service`는 정규 서비스만 쓴다: 소녀전선2·리버스: 1999의 한국·일본은 `global`, 블루 아카이브 글로벌은 `kr`, NIKKE·림버스 등 공용 서비스는 `global`. CN은 레지스트리에 CN 서비스가 있는 게임(명일방주, 소녀전선2, 리버스: 1999)만 쓴다.
- `pool`: `character`, `standard`(명일방주 일반·커널), `support`(우마무스메 서포트 카드). 무기 픽업은 내지 않는다.
- 날짜: 그 서버 공지에 적힌 현지 날짜. 시각(`startAt`·`endAt`)은 공식 공지에 시각과 시간대가 있을 때만 오프셋을 붙여 쓰고, 없으면 `null`. 시각을 쓰면 그 날짜가 `startDate`·`endDate`와 같아야 한다. 종료일을 모르면 `endDate: null`. 시작일이 오늘(일본 날짜) 이후인 배너는 내지 않는다.
- 멤버: `rosterId`는 `https://gagether.wiki/api/characters?game=<게임 ID>`(명조는 `https://gagether.wiki/api/wuwa/library`)의 `characters[].id`에서 이름으로 찾는다. 찾을 수 없으면 `"rosterId": null`과 공식 이름 `"name": {"ko": "...", "ja": "..."}`를 넣는다. 비슷한 캐릭터의 ID를 대신 쓰지 않는다. `role`은 `featured`·`rate-up`·`candidate`이고 `featured`가 1명 이상이어야 한다. 선택형 모집만 예외다(아래). `type`은 공지가 신규·복각을 밝힌 경우만 `new`·`rerun`, 아니면 `unknown`.
- 선택형 모집(이용자가 후보 중 1명을 고르는 모집): `featured`를 쓰지 않고 후보 전원을 `"role": "candidate"`로 넣는다(2명 이상). `candidate`와 `rate-up`을 섞거나 후보를 1명만 넣으면 거절된다. 후보 목록은 공지에 적힌 그대로 넣고 줄이거나 늘리지 않는다.
  - 공지가 고르는 수를 밝히면 `"selectionCount": 1`처럼 넣는다(후보 수 이하). 밝히지 않으면 이 칸을 넣지 않는다. 후보 전원이 `candidate`인 배너에만 쓸 수 있다.
  - 사이트에서 후보로 나온 회차는 "선택 후보로 등장"으로 따로 보이고, 픽업 등장 횟수·마지막 등장·복각 간격에는 들어가지 않는다.
- 이용자별 기간: 공통 종료일이 없고 기간이 이용자마다 다르면(예: 블루 아카이브 PremiumDash처럼 첫 모집 후 28일, D+28) `"endDate": null`, `"endAt": null`로 두고 `periodNote`에 공지의 기간 문구를 그대로 옮긴다. 날짜를 계산해 넣지 않는다. 공통 종료일이 있으면 `periodNote`를 쓰지 않는다(함께 내면 거절). 공식 언어 문구만 넣고, 없는 언어는 비워 둔다.

```json
{
  "id": "ba-kr-20261013-premiumdash",
  "gameId": "bluearchive",
  "service": "kr",
  "pool": "character",
  "startDate": "2026-10-13",
  "endDate": null,
  "startAt": null,
  "endAt": null,
  "bannerName": {"ko": "공지에 적힌 모집 이름"},
  "periodNote": {"ko": "공지에 적힌 기간 문구(예: 첫 모집 후 28일)"},
  "members": [
    {"rosterId": "10000", "role": "candidate", "type": "unknown"},
    {"rosterId": "10001", "role": "candidate", "type": "unknown"}
  ],
  "sources": [{"url": "https://forum.nexon.com/bluearchive/board_view?board=1018&thread=...", "kind": "official", "title": "공지 제목"}]
}
```

- 출처: 공식 공지를 먼저 넣는다(`"kind": "official"`). 공식 공지를 찾지 못한 회차만 커뮤니티 자료를 `"kind": "community"`로 넣는다. https 원문 URL과 게시 시각을 그대로 적는다.
- 이미 기록된 배너(같은 게임·서버·풀·시작일·featured 멤버, 선택형은 후보 전원)는 덮어쓰지 않는다. 다시 내면 새 출처 URL만 더해진다. 틀린 기록은 운영자가 고친다.
- 예상·유출·커뮤니티 예측은 넣지 않는다.
- 저장은 운영자가 켜는 스위치를 따른다. 꺼져 있으면 판정만 하고 `waiting`으로 남으며, 켜진 뒤 실행에서 저장된다. 같은 파일을 고치거나 다시 내지 않는다.

## 3.2 출시 예정 게임: 출시 시각·사전 다운로드·첫 픽업

출시 예정 게임(`GET https://gagether.wiki/api/data`의 게임 중 출시 전인 게임) 페이지의 "출시 정보" 칸은 아래 공식 항목을 읽는다. 공식 발표가 없으면 사이트는 "미발표"로 둔다. 발표 전에는 내지 않는다.

- 출시 시각: 그 서비스의 출시 항목 `<gameId>-<region>-launch-<yyyymmdd>`(예: `azur-promilia-kr-launch-20261126`)에 `changes`로 `startAt`을 넣는다. `before`는 지금 값(`null`)을 그대로 적는다. 값은 공지에 적힌 시각과 시간대를 오프셋으로 붙인 ISO 시각(예: `"2026-11-26T11:00:00+09:00"`)이고, 그 서비스 시간대의 날짜가 id의 날짜와 같아야 한다. 출시 항목이 아직 없으면 `entries`로 새로 낸다(`kind: "update"`, `startDate`는 출시일, `sourceKind: "official"`).
  - 출시 시각이 들어오면 사이트는 그 시각에 출시 예정 화면을 일반 게임 화면으로 바꾼다. 시각이 없으면 그 서비스 날짜의 자정에 바꾼다.
- 사전 다운로드: 새 항목 `<gameId>-<region>-predownload-<yyyymmdd>`를 `entries`로 낸다. `startAt`은 공지의 사전 다운로드 시작 시각(오프셋 포함), id의 날짜는 그 서비스 시간대의 시작 날짜, `kind: "update"`, `sourceKind: "official"`, 공지 원문 `sourceUrl`·`sourceTitle`. 종료 시각이 공지에 있으면 `endAt`도 넣는다.
- 첫 픽업: 공식 발표된 출시 픽업 배너를 지금 픽업과 같은 형식(`kind: "pickup"`, `pickupMembers` 등)으로 `entries`에 낸다. 공식 항목만 출시 정보 칸에 보이며, 발표 전에는 칸 자체가 나오지 않는다. 뽑기 규칙(천장·확률 등)은 공지에 적힌 내용만 `summary`·`detailSections`에 넣는다.
- `region`은 그 게임에 등록된 서비스만 쓴다. CN은 공식 CN 서비스가 있는 게임만(아주르 프로밀리아는 출시일 항목만) 허용된다.
- 출시 예정 게임의 캐릭터 목록, 사전등록 보상, 테스트 이력, 지원 기기는 이 경로로 받지 않는다(비공개 저장소의 검토 파일로 관리한다).

## 4. 내용 규칙 (AGENTS.md 5~7장 요약)

- 날짜·시각·등급·가격·출처·번역을 지어내지 않는다. 모르는 값은 비워 두거나 `null`.
- 공식 공지가 종료 시각 없이 "다음 버전 업데이트 점검 전까지"로만 밝힌 기간은 `endAt: null`에 `endCondition: {"kind": "next-version-maintenance", "sourceUrl": "<그 공식 공지 URL>", "recordedAt": "<기록한 실제 UTC 시각>"}`을 함께 낸다(기간 칸 묶음). 자유 텍스트(`timingNote`)로 쓰지 않고, 종료 시각이 발표되면 `endAt`을 낸다.
- 공식 공지가 "어떤 배너가 N회 진행된 뒤 종료(○○부터 집계)"로만 밝힌 기간은 `endAt: null`에 `endCondition: {"kind": "after-banner-rounds", "rounds": <N, 1~20의 정수>, "anchorId": "<집계를 시작하는 배너의 항목 id>", "sourceUrl": "<그 규칙이 적힌 공식 공지 URL>", "recordedAt": "<기록한 실제 UTC 시각>"}`을 낸다. `anchorId`는 `GET /api/data`에 있는 같은 게임의 항목 id여야 하고 자기 자신이면 안 된다. 그 게임의 공식 배너 용어가 사이트에 등록된 게임만 쓸 수 있다(지금은 명일방주: 엔드필드). 등록되지 않은 게임은 `invalid`로 거절된다.
- 한국 공식 사이트·공지를 먼저 보고, 지역 서비스 일정이 다르면 그 지역 공식 공지를 본다. 공식·커뮤니티·영상 출처는 `sourceKind`로 구분하고 원문 URL을 그대로 적는다.
- 영상은 보지 않았으면 본 것처럼 쓰지 않는다. 막힌 출처를 우회하지 않는다.
- 유출 정보와 Foresight(예측) 자료는 이 경로로 넣지 않는다. 이 저장소는 공개라 파일이 먼저 보인다. 예측 픽업은 `pickupArchive.status: "forecast"`로만 표시한다.
- CN 일정은 명일방주, 소녀전선2, 리버스: 1999에만 허용한다.
- 비밀 값(토큰, 키, 개인 정보)은 절대 적지 않는다.

## 5. 이미지 규칙 (ops/rules/artwork.md)

- 그림은 그 캐릭터·의상·무기·서포트와 정확히 일치해야 한다. 다른 캐릭터나 일반 그림으로 대신하지 않는다.
- `image`는 원본 파일 URL, `imageSource`는 그 그림을 확인한 공식 페이지 URL.
- `width`·`height`는 **실제 파일 픽셀 크기**를 적는다. 다르면 그 항목은 제외된다.
- 같은 자리의 지금 이미지보다 작은(픽셀 수가 적은) 이미지는 제외된다. 화질을 낮추지 않는다.
- 다른 캐릭터 항목과 같은 파일(sha256 같음)이면 실행 요약에 표시된다. 일부러 같은 그림을 쓰는 경우가 아니면 고친다.
- 항목 하나에 새 이미지 30개, 파일 하나에 200개까지. 넘으면 그 항목(또는 파일)은 반영되지 않는다. 파일을 나눠 새로 낸다.

## 6. 결과 확인

- push하면 Actions의 "GAGETHER AI updates" 실행이 돈다. 실행 요약(Summary)에 항목별 판정과 칸별 전→후, 이미지 크기·링크가 남는다.
- 판정 코드
  - `applied` 반영, `partial` 일부 칸 묶음만 반영
  - `conflict` `before`가 지금 값과 다름, `missing` 공개 데이터에 없는 id, `exists` 이미 있는 id, `held` 바꾸려는 칸이 모두 보호됨, `unchanged` 이미 같은 값
  - `invalid` 형식·출처·기간·이미지 검증 실패(메시지 참고), `excluded` 이미지 검사에서 제외
  - 이력(`pickupHistory`): `inserted` 새 배너 저장, `sources-added` 기존 배너에 출처 추가, `exists` 이미 같은 배너·출처, `duplicate-in-file` 같은 파일 안 중복, `waiting`/`history-apply-off` 저장 스위치 꺼짐(판정만)
  - `pending`·`retry` 한도나 일시 오류로 남음. 다음 실행(다음 push 또는 수동 실행)에서 이어서 처리된다
- 실행이 실패(빨강)로 끝나면 같은 파일을 고치지 말고, 원인이 일시적이면 그대로 두고(다음 실행이 이어서 처리), 내용 문제면 새 파일로 다시 낸다.
- 반영 뒤 `GET /api/data`로 값이 보이는지 확인한다.

## 7. 한도

| 항목 | 값 |
| --- | --- |
| 파일당 항목 | 100 |
| 파일 크기 | 1,000,000 bytes |
| 실행당 처리 파일 | 5 (나머지는 다음 실행) |
| 시간당 새 반영 시작 | 6 |
| 시간당 호출 | 60 |

예시: [`example.json.txt`](example.json.txt) (예시 값이며 실제 정보가 아니다).
