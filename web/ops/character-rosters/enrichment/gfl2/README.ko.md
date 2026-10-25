# 소녀전선2: 망명 상세 보강

기존 GFL2 HELP 캐릭터59개의 정확한 경로/ID만 대상으로 한다. 한국 공식 캐릭터 목록과 소개 페이지를 먼저 열람했다. 공식 페이지에는 소개·일러스트만 있고 전투 수치/스킬표는 없어 GFL2 HELP의 공개 영어 원문 `__NUXT_DATA__`를 사용한다. 비공개 API·로그인·블록 우회는 없다.

## 재현

```sh
python ops/character-rosters/enrichment/gfl2/enrich.py \
  --input /canonical/input/gfl2.json \
  --output /canonical/output/gfl2-expanded.json \
  --cache-dir /canonical/cache/gfl2 \
  --report /canonical/output/gfl2-details-report.json \
  --refresh
```

캐시 재생은 `--refresh`를 생략한다. 실제 정기 수집은 `--refresh`를 사용해야 새 원문을 읽는다. 캐시의 원래 URL·시간·SHA·바이트를 검증하며 재생을 신규 확인으로 표시하지 않는다. 개별 원문 실패는 해당 입력을 보존하고 결과를 `partial`로 기록한다. 전체 원문·생성 도감·완전 캐시는 공개 GitHub에 넣지 않는다.

`pack.encode(expanded)`는 `(complete, wire)`를 반환한다. wire는 목록용 projection이 아니라 각 ID/sourceId/decoded bytes/SHA를 묶은 완전한 V3 원본 표현이다. 모든 세부 필드는 각 블록에 남고 목록 traits는 따로 유지한다. 게임은 `gfl2`만, sourceId가 없는 기존59개는 실제 source path ID를 명시적으로 사용한다. decoded1MB·전송4.4MB 경계를 유지한다. source catalog의 게임 허용과 상세1폼 압축해제는 공통 라이브러리에서 처리한다.

## 사실 범위

- 59개 전부 기본 스킬·패시브, 원문에서 제공하는 돌파 효과, 뉴럴 헬릭스 고유키/공용키/확장키/능력치 노드,6단계 리몰딩 패턴, 실제 소환물 스킬·계승 비율을 추출한다. 최종1,536표: 기본302/돌파348/뉴럴497/리몰딩354/소환35.
- 스킬 효과 원문과 안정피해·쿨타임·사거리·효과범위·리몰딩 지수 소모를 각각 보존한다. 돌파 효과는 기본 스킬에 자동 합산하지 않는다. 뉴럴 능력치도 기초 패널에 합산하지 않는다.
- HELP의 기초5개 패널은 레벨·돌파·장비·뉴럴 기준을 명시하지 않는다. 임의로 Lv.60/0돌파 등으로 바꾸거나 성장 행을 만들지 않는다.
- 원문은 영어다. `nameLocale:en`과 영어 원문을 보존하며 한국어 UI/공식 한국 이름을 유지한다. 영어를 한국어 원문인 것처럼 필드에 복사하지 않는다.
- 현행 데이터베이스 설명은 각 서비스의 실제 적용일/출시 확인이 아니다. 기존 인형59개에 `regions`를 만들거나 KR/JP/Global/CN의 같은 판본이라고 단정하지 않는다.
- 인형·복장 일러스트와 기존 이름/출시 정보는 수정하지 않는다. 원본 일러스트 교체는 독립 작업이다.

## 아이콘

각 열람한 캐릭터 HTML이 실제 선언한 `img src`만 사용한다. 캐릭터 스킬/키는 정확한 캐릭터 디렉터리로 묶고, 공통 클래스 재료 아이콘은 같은 게임의 열람한 다른 페이지에서 선언된 원본을 재사용한다. 파일명을 추측하거나 다른 게임 아이콘을 대체하지 않는다.

`download_icons(urls, output)`는 원본 바이트·HTTP200·PNG/WebP/JPEG 서명·네이티브 크기·SHA를 검증해 반환한다. URL별 source identity와 동일바이트별 실제 파일을 따로 관리한다. 재인코딩/리사이즈하지 않는다. 전체 아이콘은751개 원본 URL이며,695개 동일바이트별 원본(686 PNG·9 WebP)28,083,790바이트다. 같은 SHA는 한 파일로 제공할 수 있다. 배포 용량에 따라 검증 원본 URL 전달과 정적 원본 보관을 구분할 수 있으나, 원본 바이트와 확인 영수증은 유지한다.

## 확인된 원문 한계

- Lewis의 원문 `fortification`은 빈 배열이고, 실제 HTML의 Fortification 항목도 `SOON`이다.6단계 효과가 제공되지 않아 표를 만들지 않으며 별도 한국어 주석을 표시한다.6단계가 모두 제공된 인형은58/59명이다. 루이스의 기본 스킬·뉴럴 헬릭스·리몰딩19표는 유지한다.

- Andoris Auto-Turret의 En Passant는 효과명 `{!0}`, `{!1}`이 원문에서 바인딩되지 않았다.
- Helen Covering Charge도 효과명 `{!1}`이 없다. 숫자 토큰은 화면에 노출하지 않고 `effect name unavailable`로 표시하며 한국어 자료 주석을 제공한다.
- Helen 일반 공격은 설명 사거리6칸과 별도 표4칸이 다르다. 양쪽 원문값을 유지하고 불일치 주석을 표시한다. 임의 정답을 선택하지 않는다.
- Soppo 첫 리몰딩 패턴의 bulwark 재료 수량이 빈칸이다.0개로 해석하지 않고 해당 수량을 생략하며 주석에 남긴다.

`report.json`은 이 한계들과 각 실제 원문 hash/time을 기록한다. 읽을 수 없는/미제공 정보를 추정으로 채우지 않는다.

## 검증

`python -m unittest discover -s ops/character-rosters/enrichment/gfl2 -p 'test_*.py'`

정확한 경로·원문 마크업·누락효과명·빈 재료·스킬/돌파 분리·뉴럴 비합산·기존 일러/이름/서버 보존·출처 선언 아이콘·identity/hash-bound 완전 압축 원본을 검증한다. 통합 소유자가 실제 전체 데이터 스키마·원본 자산·운영 UI와 배포를 추가 검증한다.
