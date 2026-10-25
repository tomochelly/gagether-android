# GAGETHER 작업 이어받기

2026-10-25 (JST). 이 파일은 채팅 한도에 걸려도 소스·검증·배포 상태를 다시 확인하기 위한 체크포인트다. 비밀키·로그인 정보·운영자 개인 데이터는 기록하지 않는다.

## 현재 상태 · v157 도감·PV 언어·밝은 테마 배포·운영/CI 검증 완료

- 사용자 요청4개: 니케SSR딱지삭제,젠레스도감전신/상세보강,명조PV언어분류/중국어판,화이트유리효과. `ops/GALLERY-PV-ZZZ.ko.md`와 `ops/character-rosters/enrichment/zzz/README.ko.md`에구현·원본/출처·검증기록.
- 젠레스61ID유지/공식전신61원본50,006,381bytes/1,412표/2,595개원문수치행각1회/4언어43,908레벨설명검사. Lv60승급5핵심0/장비·시네마제외,성장12체크포인트. 피로이스M6는원문미공개를유지한다. 원본은무재인코딩·alpha8bounds보수적구도;owner이미지별구도는유지. 재현보강기는실제6시간수집c그룹연결,고정Pillow13/기존TYPESCRIPT_PATH지원.
- 명조zh실제공식채널UCVZqteUtWfSnwQ0ShjHixVw/MDkTlOfQZsE/초驗TRANSCENDO/원본공개2026-10-24T20:00:36-07:00 확인. 한국어/일본어/영어/중국어판분리,없는판본은영어원본만표시. 원본/저장/owner자료유지,명조CN게임일정추가없음. 영상관All languages가능/언어전환시재생정지/복귀자동재생방지.
- 니케목록등급딱지삭제(실제등급/정렬/상세보존),밝은유리/meteor청회색. 실제공개자료QA컴포넌트에서6개젠레스원본과엔비성장·스킬·핵심F/닫기확인. localDB503이라생산편집증거로주장하지않음. 일시적miniflare fetch실패는managed stop/start뒤복구. QAroute삭제완료.
- native최종Node437/실패0/생략0,tsc,실제editor/SQLite/R2,Pythons26+13+8 통과. 실제39API빌드완료,fingerprint0e4700e2801f9660e17f9de5c05ff00891c248b2e1d592f904cd847ed6d48736. bootstrap21,507,300bytes/복구40parts/보호상한24MB,개별ingest4.4MB유지. 기존canonical-only3파일과복구조각은공개GitHub로전송하지않는다.
- **v157 succeeded**,2026-10-25T06:41:03.828104Z(15:41JST),sourcea9ddb16b3e5fb6f21ce6d341c1ac0e3b6108bac7,versionappgprj_6ad1ef24b5c08191a367cd141de63a3a~appgver_c8cde204d3e08191a61243969f490146,deploymentappgdep_6adda4669a4c81918028e2ba1e7ec4c8. archiveSHA3e4a7134cc336acf6e276ce09cc28f2f989f062b974557c55072b622fe186c75/232488960bytes/927files. 운영젠레스61full-body/엔비20스킬표7500·583·612,니케203카드·딱지0·light·넘침없음,명조KO/ZH/JA 각언어PV1개/타언어선택0/한국어복귀확인. public독립snapshot421tests/실패0/생략0+tsc통과. GitHub main fab63faccfdbdc74996471581c9dc7a5505ed2c4 반영완료. 실제web40170396619 success(Node421/실패0/생략0,editor SQLite/R2/tsc/Python26+13+8/Pillow13),source40170396664 success(504runtime/507manifest/3canonical hash),Android40170396645 success. rosters40170396756는parser/Pillow설치통과후collect실행중이며전체재ingest완료로표시하지않음. 최종문서checkpoint는같은runtime을재배포하지않는다. 아래v156은이전이력.

## 현재 상태 · v156 게임별 독립 갱신 배포·실제 검증 완료

- v155의 실제 fast54개/19background 작업은 모두 저장재조회·완료. fast 요청214개,complete29/partial25,전송/검증/저장오류0. details19개:complete10/partial8/failed1(전체 유출 유지보수 출처오류),전송/검증/저장오류0. source502개해시/실제GitHub web419개/26Python/tsc/editor/Android 모두 success. 이 정상 분리는 운영에서 검증됐다.
- 발견한 보완: 명조 상세에 독립 외부도감 가짜 성공영수증이 추가되던 집계를 제거. 명조는 자체 reference 실제결과만 사용하고 rosters 단계를 생략. 해당 작업만:v2키로 새로 시작해 옛 건강상태를 재사용하지 않음. 이전 데이터/진행/이력삭제없음. 신규 회귀 포함 native434개/실패0/생략0,Python26,tsc,실제39API빌드 통과. 최종 runtime fingerprint b3f619d840e5ff5b14396f6aac8d80de6c6a35354f9126d18a3fbf2dda76ed02,505files.
- 초기 예약 대기 공백을 막기 위해 push도 fast bounded45minute heartbeat를 bootstrap하게 함. manual은1wave, details는once. 서버 임대·30분handoff·중복성공no-op·실제source시각/일부실패표시 모두 유지. 운영 배포후 이 bootstrap은 건강한 in-progress상태로 남는 것이 정상이며, 첫 wave 저장재조회와 fresh 명조:v2 실제완료를 확인하고 종료할 것(45분 종료까지 기다릴 필요없음).
- **v156 succeeded**,2026-10-25T05:34:54.758703Z(14:34:54JST). source f67ea332a411d620714cab4a969472b69a3188ec, version appgprj_6ad1ef24b5c08191a367cd141de63a3a~appgver_0d1a48d267548191a525373496fd5836, deployment appgdep_6add94e9e340819192d1d0875c0ae669, saved archive SHA256223326a16422c1f614750e6462827460f3b2fd68792edb94ab58fdbf844be5eb/178462720bytes/866files. Public main05b0a376e0172551067795f397a6c94d00387ee7に最終8filesを反映済み. public targeted9tests/Python26/tsc pass. 실제 최종 GitHubsource40166230934 success(502runtime 코드+canonical-only3hash), web CI40166230921 success(Node420/실패0/생략0,Python26,tsc,editor SQLite/R2,숫자파서12),Android40166230915 success. 최종 workflow40166230962: details job121087736177 success, 새 명조:v2만 due여서6요청/complete/167건 실제저장재조회,전송/검증오류0. fast job121087736381은 정상 heartbeat를 계속 실행 중이며45분 타임박스 또는30분 이후 새예약handoff까지 in_progress가 정상이다. 05:43:30Z 공개plan에서 최종 bootstrap 이후 fast54/54 최신완료, 미완료0, validation-failed0, heartbeat05:43:28Z 확인. 전체73개 완료 기록이며 일부 출처의 partial/유출 유지보수 failed는 숨기지 않고 last-good 유지. 아래v155는 초기검증이력이다.

## 게임별 독립 갱신 · v155 배포 성공 / GitHub 실제 실행 검증 중

- 새 사용자 요청: 게임/데이터가 늘어 빠른 수집을 독립시키고 상세 작업·예약 지연의 영향을 줄이는 구조를 실제 적용.
- `ops/INDEPENDENT-REFRESH.ko.md`에 구조·인증·주기·한계·배포순서/롤백 기록.18게임×4종류72작업 + 전체 유지보수1작업. 기존 공개 Site ID와 DB/R2/owner/updater/OIDC 범위 유지, 새 계정/자격/공개 쓰기 없음. 시간당 AI 자동화는 paused 그대로.
- 작업별 진행/잠금/상태, 게임별 SQL읽기·피드/공식 원문/영상/본문 범위, 새 저장CAS·필드병합 경로 구현. 동시에 저장된 다른 본문/언어·owner text/style 보존. 확인된 예약/진행 방송부터 읽고 종료된 영상만6시간 probe cache. 모르는 상태는 종료로 바꾸지 않는다.
- GitHub 실행기 신규 `ops/game-refresh-request.py`: fast/details 독립 job, 최대4병렬·fair round robin, 서버 시각/작업 주기로 due만 확인.5분 wakeup + 예약 실행45분 heartbeat(루프60초),12분 운영 임대·30분 후 새 예약으로 정상 handoff. 중복 wakeup은 성공 no-op. legacy 글로벌 요청기는 호환용 유지.
- 새 `/api/fast-refresh?plan=1`, 고정 game/lane GET/POST, signed run_id 전용 운영 임대, owner 콘솔18행×4종류 상태/실행 신호. 공개 API는 편집/개인 데이터·JWT를 노출하지 않는다.
- 신규 SQLite 독립실행/실패격리/같은 작업잠금/실제CAS충돌/언어·본문·owner보존/방송우선/인증·선택자/임대만료·handoff 테스트7개, mounted console 테스트1개, Python game runner9개 추가. 기존17개Python와합계26개 통과. 초기 native431개 중1실패는 seed-only 신규 생성의 병합 우선순위로 수정했고 관련검사 통과. 다음 전체433개 중1실패는 새 UI 테스트의 static TS import loader 순서로 dynamic import로 수정. 최종 전체433개(실패/생략0), TypeScript, 실제39API 배포 빌드 모두 통과.
- 최종 실제빌드 fingerprint87fa4a0d382714e1a5c05dfffa2f3ce0dc8914242cdfffae848e1a0a12881f71, 실행 소스505개 모두 해시 일치. 원본429개/345185065bytes 그대로 보존. 최종 Node433개/실패0/생략0, Python26개, tsc, 실제editor/SQLite/R2 검증 통과. 로컬 preview root는 렌더됐고 /api/fast-refresh?plan=1은 저장 상태 unavailable503; 원인확정 안 함, 실제 SQLite검사 및 배포후GitHub경로로 검증할 것. 인증 우회/완화하지 않음.
- **v155 운영 배포 succeeded**,2026-10-25T05:16:04.894604Z(14:16:04JST). 게시 source01d3cbc197c9b9dd69c90151f18b3fa51213143e, version appgprj_6ad1ef24b5c08191a367cd141de63a3a~appgver_d942d95349f881919562d55b8c3ddc59, deployment appgdep_6add907efb048191a5832e8151c69c88. same public audience/DB/R2. 실제 https://gagether.wiki/api/fast-refresh?plan=1 에서 version2/18게임/73작업/5lanes/serverTime 확인. 공개 GitHub main05259f0958993bc3cc42d8b5cbda18b791503efb에 정확한 runtime code+manifest/receipt+workflow/script 게시. Public CI 로컬419개/실패0/생략0, Python26,tsc,codehash502개+canonical-only3hash검사 통과. 실제 GitHub fast/details 실행과 저장 재조회, source/web CI 결과 확인을 마칠 것. canonical-only3파일/복구조각 전체공개 금지 유지. 아래v154는 이전 상태다.
- 실제 새 GitHub실행: fast/details workflow40165151313 진행 중, web CI40165151268 진행 중, source check40165151410 success, Android40165151510 success. 05:22:15Z 공개plan에서18개details와16개uploads 완료/저장재조회, notices18/broadcasts18/maintenance1 진행, validation-failed0, signed runner heartbeat runId40165151313 확인. 이 중간 기록만으로 fast 전체 완료를 주장하지 않는다.


## 자동 갱신 실패 메일 수정 · 2026-10-25 실제 운영 검증 완료

- 사용자 요청: 반복 GitHub 실패 알림 원인 확인 후 필요한 수정 실행. 첨부 #308과 최신 #312는 실제 단계 실패가 아니라 80회 continuation 한도였다. #309/#311은 저장 상태를 이어받아 partial/2121건 재조회로 종료했다.
- `ops/REFRESH-RELIABILITY.ko.md`: 12분/240요청 제한 내 저장 체크포인트 재조회 후 continuing으로 정상 양도. 완료로 표시하지 않음. 실제 인증/통신/단계/저장검증 실패는 계속 실패. 기존 OIDC/예약/권한 유지.
- public GitHub main 커밋 `25131ef106bbcc2b0df103f2cd19269d8f27175a`에 최신 실행 코드/자동화 및 검증 반영. 전체 bootstrap/artwork manifest/recovery manifest·압축 조각은 공개하지 않았다. 세 파일은 native source/v154아카이브에 완전 보관, 운영 source-manifest의 해시로 정확히 고정한다. GitHub만으로 전체 운영 데이터가 복구된다고 주장하지 않는다.
- 운영 manifest 전체와 500개 나머지 runtime 파일의 SHA를 실제 검사하는 새 source checker. 임의 예외 확대/새 배포/코드 누락·변경은 계속 실패한다. 실제 GitHub source run `40161657264` success, fingerprint ad21b13019ac11fe075b75aa6b43ffdbe789021e00506756eeedf4528d78f75e. 기존 source incident #4 closed.
- 로컬 native 전체 Node425개/실패0/생략0. 공개 이전 데이터와 호환되는 mirror 전체 Node411개/실패0/생략0, TypeScript/실제editor SQLite/R2검사 통과. Python 요청기·source checker17개 및 공개 도감 수집기12개 통과. 전체 URL 밀도 CommonJS 회귀는 실제 큰 native JSON과 public용 합성 URL 스트레스 모두 통과. full-data 전용 최신 상세/복구 테스트는 native에 유지한다.
- 최초 mirror 검사3실패는 최신 전체 데이터 수치기대와 작은 이전 public snapshot의 불일치였음. 기존 public 스냅샷 테스트를 그대로 보존하고 URL 회귀는 같은 크기의 합성 stress도 허용하여, 데이터 공개 없이 엄격한 검증을 유지했다. 최종 mirror411개 통과.
- 실제 GitHub web CI `40161657276`와 Android `40161657266` success. rosters `40161657263`은17게임 전달/재조회 성공 및 partial 경고. 필수 정적 잠재보상 레지스트리를 후속 commit `16b8f718f86d75e9ad286ee1379b73dbb0d106c7`에 보완했고 source check `40161882329`도 success. 최신 web CI `40161882336`, source `40161882329`, rosters `40161882374`, Android `40161882361` 모두 success. refresh `40161657257`도 success. 실제107개 continuation 단계 뒤 partial/공지3건 추가/automatic·effective2184건 저장 재조회 완료. finishedAt `2026-10-25T04:33:08.449Z`(13:33:08JST). 두 장애 이슈 #4/#5 모두 실제 복구 확인 후 closed. 일부 출처·세부 보완의 partial 경고는 그대로 유지한다.
- native 첫 운영 수정 소스 체크포인트 `0c7fa5ded56979f81c8a58eda61210175d6b534c`가 원본 저장소에 push됨. 이후 이 운영 실행 결과만 갱신하는 docs 체크포인트는 게시 v154의 runtime을 다시 배포하지 않는다.
- runtime/source-manifest 전체 파일 변경 없음 확인. 사이트는 아래 v154 그대로이며 자동화 코드·검증 보관을 위해 동일 사이트를 재배포하지 않는다. 사용자 알림 설정/기존 데이터/운영자 편집 변경 없음.

## 현재 상태 · 신규 PV 배너/일반 업로드 수집/도감 연출·구도 v154 운영 성공

- 사용자의 추가 요청: 명조 방금 공개 PV와 중국 명일방주7.5주년 탈룰라 갱신, 모든 도감의 은은한 hover 확대/유리 반사/별똥별 내부 선, 투명 캐릭터 얼굴 잘림 조정. 새 PV는 픽업처럼 큰 배너로 표시.
- `ops/PV-AND-GALLERY.ko.md`에 정확한 소스·원본·수집 경로·한계 기록. 기존 v153 도감 편집/글 서식과 owner override 유지.
- 일반 YouTube upload 체크포인트 추가(RSS실패 시 등록 채널의 /videos, assignment/JSONscript둘다), exact channel/video 검증, 모르는 공개 시각null, 최초발견/불변검증시각, 현재 글·수동 편집·실패한 채널의 lastgood 보존. 방송/LIVE와 분리.
- 신규 PV 배너는 대시보드/게임별, 원어표시·재생/닫기·원본링크·7일 freshness. Simple펼치기전 image/player 미마운트. 기존 구성을 보존하고 신규영역만 픽업앞에 추가.
- 명조 TRANSCENDO KO/EN/JA실제id와 메타데이터 추가. YouTube thumb는 출처파일응답 HTML오류, 정확히일치하는 공식X poster도403으로 실제그림검수는 못 함. 무관한 일러로대체하지 않으며 읽기실패때 PV재생표시로 유지. 동영상 시청했다고 주장하지 않는다.
- 탈룰라/冻河 중국 서버 전용 새 픽업 ID `arknights-cn-20261101-talulah-donghe`: 공식11/01 12:00~11/15 03:59 UTC+8, 합본원본배너·상세확률·300회추가/교환소시각. 기존 quick-arknights-cn-4916 기사는 덮어쓰지 않았다. 한국/일본/글로벌 일정 생성 없음.
- 전체transparent subject905개bounds·background215개제외(실제1120원본검사). 미검사full-body원본전체안전fit. BA/NIKKE 넓은포즈48개머리보호 수동검수로 적절한closeup. 원본pixel/DPR·cachedload·resize·ownerframe우선, 상세/원본 unchanged. WuWa배경구도보존.
- 임시 public-data `app/qa-gallery`로 실제 카드/PV컴포넌트 렌더/얼굴구도/hover/glass/meteor·PViframe열기/닫기 확인 후 삭제. 로컬 공개SSR은 브라우저로딩실패였으나 원인미확정, 운영배포후확인완료. 인증/권한 변경없음.
- 최종 Node425개 통과(실패/생략0), TypeScript통과, 실제배포빌드39API검증통과. fingerprint ad21b13019ac11fe075b75aa6b43ffdbe789021e00506756eeedf4528d78f75e. 최종빌드에서 QAroute제외확인.
- v154 succeeded, 2026-10-25T03:53:25.303685Z(12:53:25JST). 게시소스5fd1e0ce819041e6338dd9a83f44977b9ac2a4df, version appgprj_6ad1ef24b5c08191a367cd141de63a3a~appgver_12f490c6d3ac8191917162b90fe53f1f, deployment appgdep_6add7d1a0850819186bbceb8b3916e26. 공개범위변경없음.
- 아카이브SHA256 bafd10c2a25e6d80f0d733808c6b380408e2f306c77bf60d3bffce265f037e93,178442240bytes/867files. 로컬검증빌드를 저장/배포했다.
- 운영 https://gagether.wiki/ko/games/wuwa 에서 TRANSCENDO 신규PV/3언어 선택/재생버튼 표시 확인. https://gagether.wiki/ko/games/arknights?region=cn 의 실제기준cn, 탈룰라·冻河와1560×500원본배너 로딩 확인. 다른게임PV가 명일방주에 섞이지 않음.
- 운영 BA264폼·검색5개(히나/의상/히나타), 실제히나1400×927원본에282×187 보호구도·maxWidth none/transform none, glass/meteor요소와가로넘침없음 확인. 공개화면에서도 얼굴/헤일로가잘리지 않음을 스크린샷으로확인했다.
- 아래v153은 이전이력. 이후문서체크포인트커밋은 실제게시소스SHA와다를수있으며 같은동작을 다시배포하지 않는다.

## 현재 상태 · 도감 이미지 편집 + 공통 글 서식 v153 운영 성공

- 사용자 새 요청: 도감 원본별 위치/크기 수동 조정과 모든 텍스트 편집의 굵기·기울임 등 서식, 편한 글자 크기 조절, 넓은 실시간 미리보기.
- v153 **succeeded**, 2026-10-25T03:09:39.790179Z(12:09:39JST). 동일 Site/공개 범위 유지. 아래v152는 이전 이력이다.
- 게시 소스 b153bc736d8aa8ce841e8ebfa567d4fe53bb3791, version appgprj_6ad1ef24b5c08191a367cd141de63a3a~appgver_ecb0bdeb0bb481919224cdf46382a26d, deployment appgdep_6add72deb3c4819193ac8f68a1e877b3.
- 로컬 성공 빌드의 아카이브SHA256 4677d6dd6ceb8b96780cba65e08cf79c53b0b9da99fc9d685d6a1c3964496ffc(177408000bytes/866files). 이후 이 배포 결과만 보존하는 문서 체크포인트 커밋은 게시SHA와 다를 수 있다.
- 최종 Node419개 통과(실패/생략0), TypeScript 및 배포 빌드/39API 검증 통과. runtime fingerprint eac13af0c18a72198927f8da1cf95800e1bf90c58768820f95e088d9924b0113. 로컬 빌드에서 테스트 전용 QA 안내문/라우트가 제외됨을 확인했다.
- `/owner/characters` 및 `/api/editor/characters`:18게임 정확한 캐릭터/원본(니케 의상·방랑자 성별 포함), 목록/상세 별도 구도, 드래그/방향키/숫자·범위 크기·위치 조절, 자동 복원, CAS·이력, 세션 초안·3-way 복구. 기존 운영자 인증 전용. 수집 DB/R2와 별도 editorial 키이며 공개 view에서만 합성. 원본 확대보기는 그대로.
- 운영자 도감 toolbar/상세의 구도 편집 링크 및 운영 toolbar의 도감 이미지 링크 추가. 다른 게임/의상/이미지의 구도를 섞지 않는다.
- 공통 TextAppearanceEditor: 제목/본문별 B/I/U/취소선/정렬/색, ±·범위·숫자 크기, 줄간격, 목록, 실행취소/재실행, 큰 양쪽 편집/미리보기. 한 필드 전체에 서식을 적용하며 본문 문자열에는 HTML/마크업을 넣지 않는다.
- Entry/세부단락/글블록/프로필·스킬/보상/사이트공지/게임소개/브랜드/화면문구에 서식 저장·공개 표시 경로 추가. EditorPanel의 기존 textStyle 저장 누락과 OwnerInlineForm의 실시간 미리보기 갱신 누락도 수정. UI 원문 ID/검색/다른 언어/저장 이력 보존.
- 새 실제 SQLite/R2 API/갱신·CAS·초안 충돌·복원 검증, mounted 이미지·글 편집/입력 보존·중복 저장·포털 Escape 검증 추가. 초기 전체414개 중3실패는 UiText의 부분 Context 기본값과 Wuwa fixture의 editorial 테이블 누락으로 확인/수정. 관련25개와 최종 전체419개 통과. 숫자 크기 입력의 빈값→2→24 부분입력까지 추가한 글 서식3개도 최종 통과했다.
- 브라우저에서 동일 편집 컴포넌트의 공용자료/메모리 저장 QA 화면으로 니케 이미지 키보드 이동/크기/저장값 재로딩, 방랑자 상세 원본, 넓은 글 편집 B/I/24px·본문 실시간 반영을 확인했다. 이 작업에서 운영자 실제 로그인/생산 DB 편집을 했다고 주장하지 않는다. preview의 로그인 경로는404여서 인증은 변경하지 않았다.
- 임시 `app/qa-owner`는 UI 검증 후 삭제했다. source helper/운영 빌드에 포함하지 않았다. 공개 SSR 미리보기는 브라우저의 “This page couldn’t load”로 끝났으나, 실제 v153 운영에서 블루아카이브264폼·니케203폼 및 엠마 상세 스테이터스/스킬/원본 선택지, 명조60종 자료 로딩을 확인했다. 공개 gagether.wiki 메인도 실제 자료·달력·일정 표시 정상 확인. 같은 Source를 실제 SQLite/R2 환경에 연결한 API/저장·갱신/복원 검증은 통과했다. 운영자 인증을 우회하거나 미리보기용으로 약화하지 않았다.

## 현재 상태 · 연속 사선 세로 갤러리 + NIKKE 상세 v152 운영 성공

- 최종 v152 **succeeded**, 2026-10-25T01:52:21Z(10:52:21JST).
- 게시 소스1f730b8e315d1ccdad62ea8af55733d6d079c123, version appgprj_6ad1ef24b5c08191a367cd141de63a3a~appgver_c166d8a17a14819180b30bab85f5bfd3, deployment appgdep_6add60b60ce08191868119cc825b57a5.
- 성공한 로컬 빌드 아카이브SHA256 c816ebf4967563dd0ed686af394c179399ae6922cad04a4ada40f32dc74b3809. fingerprint2fdebaf9e39fb0c9d1c04678155bcc69a94273b5939883d50ddcf1f908694474.
- 공개 BA 한국264폼7열/무간격/실제 행 교대 사선/가로넘침 없음 확인. 공개 NIKKE203폼·레벨별 능력치·스킬·소개 표시 확인. 최종 v152에서 엠마 기본→오피스 테라피→기본 실제 전환과 선택 상태 복귀를 확인했다.
- 최종 Node411개(실패/생략0), TypeScript, 배포 빌드/38API 검증 통과. 이 항목은 완료 상태이며 아래v151/v150은 이력이다. 이후 이 체크포인트만 저장하는 소스커밋은 게시 SHA와 다를 수 있다.

- 사용자 정정: 명조처럼 이어지는 사선을 유지하고 카드 폭을 줄여 세로로 길게. 니케 상세/UI도 보강.
- 블루 아카이브·니케에 3:5 연속 사선, 행 간격0, 실제 auto-fill 열 수로 교대 방향/내부 이음선 적용. 보통/작게·원본 pixel/DPR 확대 한계와 cached hydration 유지. 다른 게임의3/2열 UI는 유지.
- NIKKE 기존203폼 ID 보존, 스킬609개 Lv.1–10, 능력치4263행(Lv.1 및10레벨 간격~200), 코스튬 원본183개. 소개/스쿼드/장탄/치명타/동일 게임 아이콘 포함. 코스튬 전환 시 선택한 스테이터스·스킬 레벨 유지.
- 일반 enrich_a 수집 경로도 같은 nikke_details.py를 호출. 정확한 native ID/레벨 바인딩 검증, 반복 갱신 중복 방지, 실패한 상세는 이전 자료 보존. 원본 요청/해시/바이트/시간 및 누락은 enrichment/nikke/detail-manifest.json.
- 전부 한국어/영어 스킬 보유. 원본에 일본어가 없는6폼(ID39,73,108,162,182,189)의18스킬은 빈 native 필드와 원문 EN 표시를 유지. 소장품 강화는 기본 스킬에 포함하지 않으며 기준에 명시.
- bootstrap17661282bytes, exact gzip recovery27parts, NIKKE ingest범위4.4MB 이내. 기존 다른17게임·운영자 편집·상세 지연 읽기 보존.
- 전체 Node410개 통과(실패/생략0), TypeScript 통과, production build 및38API 검증 통과. fingerprint b6157d5e82ae07eaed6dc1d344f4a37040db99d894a831e037f1b4a8188db782.
- 미리보기 BA한국264폼 보통7열/작게8열, 연속 사선/교대/내부 이음선/가로 넘침 없음 확인. NIKKE203폼, 엠마 Lv.1 15000/500/84 및 스킬 Lv.10 10.77% 실제 표시·코스튬 선택 상태 유지 확인.
- v151 게시 성공: source644a827939254236e1b0733893e8928246fa8b26, version appgprj_6ad1ef24b5c08191a367cd141de63a3a~appgver_9dcce08713688191b61aa0859276b527, deployment appgdep_6add5f49725c8191a5b31d32c92487fd, 2026-10-25T01:46:06Z. 공개 BA7열/무간격/교대 사선 및 NIKKE203폼·능력치/스킬/소개 정상 표시 확인.
- 운영 기존 기본 이미지에는 variantId가 없어서 코스튬이1개면 전환 UI 자체가 숨겨지고2개이상이면 기본 복귀 버튼이 빠지는 경우를 확인했다. 첫 원본을 기본 선택지로 유지하도록 보완하고 실제 sparse 데이터/1코스튬/스킬선택 유지/기본 복귀 mounted 회귀 검증 추가. 최종 후속 TypeScript 및 실제 배포 빌드/38API 검증 통과. fingerprint2fdebaf9e39fb0c9d1c04678155bcc69a94273b5939883d50ddcf1f908694474. 최종 전체 Node411개 통과(실패/생략0). v152 게시 및 운영 복귀 검증 완료.
- 아래v150은 이전 게시 상태다.

## 이전 상태 · 블루 아카이브 세로형 도감 v150 운영 성공

- 최종 배포 v150 **succeeded**, 2026-10-25 10:21:50 JST. 공개 도감: https://gagether.tomochelly.chatgpt.site/ko/games/bluearchive/characters
- 게시 소스 `861d0dc2d2b3606448859190742a61b71c9af83e`, version `appgprj_6ad1ef24b5c08191a367cd141de63a3a~appgver_aec3ea8fb5308191b79bf6e13f597d71`, deployment `appgdep_6add5995b2cc8191a789125677154b44`.
- 최종 아카이브 SHA256 `cf1d3960fbc1155f4612e4c5f9847e09a551eaef7b65eb71e9bf3122edf88938`. 성공한 로컬 빌드로 게시했으며 서버 재빌드가 아니다.
- 운영 기본 한국 서비스264폼, 3:5 카드, 보통6열, 캐시된 일러스트별 실제1.16~1.5배 확대 로딩 확인. 작게8열 및 상세 원본/복귀는 앞선 브라우저 검증과 갤러리 회귀 검증에서 확인했다. 일본278폼과의 서비스 구분도 유지한다.
- 이 항목은 사용자 요청 완료 상태다. 아래 v149 초기 UI 게시, v147/v148 데이터 보강 및 빌드 정체 실패는 이력이다. 이후 문서 체크포인트 커밋은 게시 소스 SHA와 다를 수 있다.

- 사용자의 새 요청: 가로로 넓은 도감 대신 전신·배경 없는 일러스트에 맞는 세로형 카드, 한 줄에 더 많은 캐릭터, 적절한 클로즈업.
- 블루 아카이브에만 3:5 세로 카드와 auto-fill 그리드를 적용했다. 기본은 보통이며 작게 선택을 유지한다. 독립 도감 목록은 최대1520px까지 활용한다.
- 목록 전신 일러스트는 실제 원본 종횡비에 따라1.16~1.5배로 확대하며 확대 후에도 native pixel/DPR 한계를 지킨다. 상세·원본은 기존 전체 구도를 유지한다. 다른 게임의 기존 연속 사선 갤러리는 유지한다.
- 브라우저 미리보기 폭1350px에서 보통6열(약199×332), 작게8열(약148×247), 278개 폼 보존 및 가로 넘침 없음 확인. 캐릭터 클릭으로 기존 지연 상세 읽기를 여는 것도 확인했다. 추가 스타일 전용 테스트는 만들지 않았다.
- 나츠 상세 원본은 실제323×1026 로딩, object-fit:contain, transform:none 확인. 상세 닫기 후 기존 목록으로 돌아오는 것도 확인했다.
- 작업 중 먼저 배포된 v148의 도감 데이터/한국어 이름/수치/품질 방어 수정을 보존 병합했다. 병합 커밋 `6be0cf7`, v148 이후 문서 커밋 `5245b15` 포함. source-manifest 충돌만 실제 병합 소스에서 재생성해 해결했다.
- 병합본 전체 Node 테스트408개(실패·생략0), TypeScript, 프로덕션 빌드 및38개 API 경로 검증 통과. 새 source fingerprint: `17186eac6f05172b8723aa4e141df24a68c04c991d30eb61653bd11303530b74`.
- 기본 세로 UI는 v149에 게시 성공했다: source `d778655e9973ce95d3e7317f2f9acb580a786e36`, version `appgprj_6ad1ef24b5c08191a367cd141de63a3a~appgver_b7bd59fff314819184dca249589245f1`, deployment `appgdep_6add581a900c81918e17e78943ecfcd6`.
- 운영 확인에서 캐시된 이미지의 load 이벤트가 hydration 전에 끝나는 경우 확대값이 초기1.18에 남는 점을 확인했다. ref/effect로 complete 이미지를 처리하고 확대값을 React state로 보존하도록 보완했다. 나구사1.483984375·나기사1.4589·나츠1.16 등 실제 비율 반영과 크기 변경 후 유지 확인. 원본 파일은 변경하지 않았다.
- 캐시 hydration 및 밀도 변경 회귀 검증을 기존 갤러리 테스트에 추가했고 해당 테스트·TypeScript·최종 빌드 통과. 최종 source fingerprint: `2e3787132f4c22dbdf6fcf0eaf7f1d4bc69f50b80e5c2f9809f2a98367a5a455`.
- 서비스 범위는 유지한다. 운영 기본 한국 서비스264폼, 일본 서비스278폼이다. 이 차이는 서비스 필터이므로 누락으로 보고 임의로 통합하지 않는다.
- v150에 최종 캐시 보완까지 반영했고 공개 동작 검증을 완료했다. 원본 이미지나 다른 게임의 갤러리 배치는 이번 UI 작업으로 변경하지 않았다.

## 이전 성공 상태 · v147

- 최종 공개 배포 v147 **succeeded**, 2026-10-25 09:51:54 JST. URL: https://gagether.tomochelly.chatgpt.site (기존 공개 도메인 https://gagether.wiki 유지).
- 배포 소스: `2ad10bc971d23e53441ad3851315bdbc05a11788`.
- 저장 버전 ID: `appgprj_6ad1ef24b5c08191a367cd141de63a3a~appgver_322e3840780081918efb4705ac4c5c4d`.
- 배포 ID: `appgdep_6add5296e1348191ba3ace08366439a1`.
- 로컬 성공 빌드를 아카이브로 저장·배포했다(서버 재빌드 아님). 보관 아카이브 SHA256: `659c29e58b573b76334954776d782c6ce16578752974fcaddec1d9e3954c4433`.
- 공개 운영 펠리카 페이지에서 정예화·레벨 선택, 스킬 M3 전환(일반 공격1단계57%, 처형900%), 잠재1의 선구자/샛별 이미지가 실제1000×559로 로드됨을 브라우저에서 확인했다. 이 작업을 미완료 배포로 다시 취급하지 않는다.
- 배포 후 이 인수인계 결과만 추가 저장하는 문서 커밋은 위의 배포 소스 SHA와 다를 수 있다. 동작 소스/빌드 fingerprint와 실제 저장 버전을 대조한다.

- CPU 프로파일에서 `vite-plugin-commonjs@0.10.4`의 `isCommonjs` 주석 제거 정규식이 30초 표본의 87.1%를 사용한 것을 확인했다. 큰 단일 행 JSON에 다수 URL이 있으면 필터를 적용하기 전에 계산이 급증한다. 시간 제한을 늘리거나 데이터 일부를 버리는 방식으로 해결하지 않는다.
- `build/commonjs-json-guard.ts`와 `guardCommonjsJson(vinext())`로 JSON 모듈만 해당 스캐너에서 제외했다. JSON 내용과 Vite의 원래 JSON 처리는 보존하고 실행 가능한 CommonJS 처리는 그대로 둔다. 빈 next.config.ts 제거는 해결책이 아니어서 원본으로 복원했다. node_modules는 수정하지 않았다.
- 전체 프로덕션 빌드 성공. 실제 Worker 신규 산출물, API 38개, 원본 이미지 해시 검사 통과. 최종 source fingerprint: `61b273099afed4c70d1d1a223002b9e78d8a4c23f4464ba2cc2df4b0011282da`.
- 전체 Node 테스트 406개 통과(실패·생략 0), TypeScript 통과. 추가 회귀 검증은 실제 플러그인에 전체 대형 도감 JSON을 입력하는 제한 시간 있는 프로세스와 실제 CommonJS 모듈 실행을 함께 확인한다.
- 관리형 미리보기 복구 확인. 한국어 펠리카 화면에서 기초 Lv.20의 HP1566/ATK88, 스킬 M3 배율 변경, 잠재1 사진 두 장의 실제1000×559 로딩을 브라우저로 확인했다.
- 아래 v146 실패는 과거 기록이다. 문제는 해결됐고 v147에 엔드필드 상세 수치·스킬·잠재 보상이 반영됐다.

## 사이트와 소스

- 기존 Site ID: `appgprj_6ad1ef24b5c08191a367cd141de63a3a` (다른 Site를 만들지 않는다).
- 공개 URL: https://gagether.wiki
- Sites URL: https://gagether.tomochelly.chatgpt.site
- 이 작업의 체크아웃: `/workspace/sites/gagether-endfield`.
- `.openai/hosting.json`과 Sites 도구가 반환하는 원본 저장소를 기준으로 복구한다. 기존 공개 범위와 D1/R2 바인딩을 보존한다.
- 재개 시 `git status`를 먼저 확인하고, `get_site`·`list_site_versions`와 필요한 배포 상태를 대조한다. 새 채팅에서 메모나 이전 답변만 보고 배포 완료로 판단하지 않는다.

## 복구한 요청과 이번 범위

- 명조 WuWa_Verse1 참고자료 및 이환 캐릭터 도감 상세화는 이전 v142 작업에 포함됐다.
- 블루 아카이브 상세 스킬 작업은 v144 이후 소스에 있다. 이번 재개 시 운영 v145의 `localized_traits.py` 추가 수정을 충돌 없이 보존했다.
- 이어받은 미완료 요청: 엔드필드 상세 스테이터스·스킬 및 잠재능력 단계별 일러스트/명함 보상. 디스코드 작업은 보류 상태를 유지한다.
- 엔드필드 기존 35개 폼 중 출시된 34개 폼에 레벨·정예화별 3,196개 능력치 행과 136개 전투 스킬 그룹을 연결했다. 스킬 1~9/M1~M3, 특성·잠재능력·기지 스킬을 포함한다.
- 보상 메타데이터 118건(기념사진 101건·명함 테마 17건), 열람 가능한 가이드 제공 이미지 93개를 연결했다. 잠재 단계 아코디언을 열 때만 이미지가 마운트된다.
- 수치의 원본·검증·정확한 제외 ID: `ops/character-rosters/enrichment/endfield/README.md`, `detail-manifest.json`, `potential-rewards.json`.
- 일반 도감 갱신에서도 해당 데이터를 재현하는 경로: `ops/character-rosters/enrichment/enrich_endfield_details.py` 및 `run.py`. 원본 누락은 마지막 정상 데이터를 보존한다.

## 알려진 자료 한계

- 이미지 93개는 AppMedia 가이드의 원본 크기 WebP 제공본이다. 게임 네이티브 원본/4K라고 표시하지 않는다.
- 남성 관리자·결(Arcane)·리노는 검증된 보상 이미지가 없어 메타데이터만 유지한다. 명함 테마도 텍스트 메타데이터다.
- 관리자 잠재5의 미확정 데이터와 공개 추출본에 수치가 없는 특성 8단계는 제외했다. 미래 출시 캐릭터의 수치를 추정하지 않는다.
- 페리카 추가 사진은 별도 기념 이벤트 조건을 명시한다.
- 기존 펠리카 기본 공식 full-body 이미지가 `locale:en`으로 저장돼 한국어 보기에서 제외되는 점을 확인했다. 잠재 보상93개 이미지의 신규 로딩과는 별개인 기존 분류 문제다. 원본의 언어를 실제 검수하기 전에는 임의로 neutral로 변경하지 않는다.

## 이전 실패 기록 · v146

- 재개 전 운영 기준: v145, source `dbf6c4248fef4a00a798a62f10c88c7015dad7e0`, 배포 성공 확인.
- 미완료 변경 보존 커밋: `fabd9d4`. 운영 소스와 병합한 체크포인트: `f4928a0029269a57d6509fa226f777e98bf3f338`.
- TypeScript 검사, 실제 SQLite/R2 편집 검증, Python 보존/실패 경로 2개 테스트 통과.
- 전체 Node 테스트 405개 통과, 실패·생략 0개. 자동 갱신 요청 Python 테스트 6개도 통과했다.
- 체크아웃에 누락됐던 관리형 실행환경 설정을 공식 configure-execution-profile 도구로 복구했다. 로컬 빌드는 client reference 분석 단계에서 진행이 멈춰 3분 제한 뒤 종료됐다(exit137). 확대 진단에서도 같은 단계가 정체돼 중단했다. 완성된 로컬 아카이브가 없어 Sites 서버 빌드 대체 경로로 전환한다.
- 관리형 미리보기는 브라우저에서 `ERR_CONNECTION_REFUSED`가 발생했고, 오류 탭 재선택은 URL 정책에 막혔다. 우회하지 않는다. 공개 운영 v145의 펠리카 페이지가 열리는 것은 별도 확인했다. 새 엔드필드 내용의 실제 화면 검증은 아직 미완료다.
- 별도 GitHub 복제본에 이 기록을 쓰려던 추가 작업은 자동 승인 검토에서 대상·공유 권한 미확인으로 거절됐다. 복제본에 기록됐거나 전체 소스가 동기화됐다고 주장하지 않는다. 이 Site의 원본 저장소를 복구 기준으로 사용한다.
- 실제 저장된 구현 소스: `d672db7163fc844f61158476f6cb103fefdaa124`.
- 저장 버전 v146: `appgprj_6ad1ef24b5c08191a367cd141de63a3a~appgver_756d37cf9b608191a96df608c729652c`.
- v146 배포 ID: `appgdep_6add4de7220c81919dfd84f512a0d42d`. 최종 상태 **failed**, 2026-10-25 09:35 JST 확인. 서버 메시지: `Cloudflare Sandbox build stream ended without a terminal event`. 의존성 설치는 완료했으나 역시 `[1/5] analyze client references...`에서 끝났다. 새 내용은 운영에 반영되지 않았다. 현재 검증된 성공 운영본은 v145다.
- 추가 60초 로컬 진단에서 모듈 읽기/변환까지는 진행됨을 확인했다. 도감 bootstrap JSON(약15MB UTF-8)의 변환 시작을 포함하지만 어느 변환이 정체 원인인지는 확정하지 못했다. 진단용 Vite 플러그인과 그때의 source-manifest 변경은 제거해 검증된 설정으로 되돌렸다. 장시간 같은 빌드를 반복하거나 미검증 산출물을 배포하지 않는다.

## 다음 행동

1. 최신 Site 원본 소스·저장 버전·배포 상태를 대조해 위의 현재 상태를 갱신한다.
2. 현재 v153 도감 구도 편집·공통 글 서식 게시·공개 검증은 완료됐다. 새로운 요청이 없는 한 같은 변경을 다시 배포하거나 종료된 v146 실패 배포를 재사용하지 않는다.
3. 이후에도 JSON 가드와 회귀 검증을 유지하고 데이터·운영자 편집·지역/언어 규칙을 보존한다.

사용자가 다음 채팅에서 “가게더 이어서”라고 하면 이 파일과 최신 저장소/배포 상태를 먼저 읽는다. 마지막 완료 지점을 재확인해 중복 구현과 작업 유실을 피한다. 채팅 자체의 서비스 한도를 변경하는 기능은 이 프로젝트에 없다.

## 도감 후속 검증 완료 · 2026-10-25

- 운영 v148 게시 성공: source `30ba29aba4e99a8e522f024101d3a98e8273caa3`, version `appgprj_6ad1ef24b5c08191a367cd141de63a3a~appgver_0b5189d75d788191842d4c83e8121eba`, deployment `appgdep_6add5625069c81918b138bc52633f557` (2026-10-25 01:07:03 UTC). 기존 v147 엔드필드 상세·잠재 보상을 병합 보존했다.
- 명조 외 17개 게임 2,284폼의 한국어 이름과 원문·번역 근거를 보강했다. 기존 명조 60폼과 별도 수록이며, 부족했던 9폼을 추가했다. 공통 도감은 연속 사선 갤러리·등급 우선·큰 상세창을 사용한다.
- 젠존제 61폼 능력치, 트릭컬 한국 135폼 능력치/136폼 스킬, 붕괴3rd 85폼 능력치, 리버스1999 136폼 능력치를 보강했다. 기존 지역별 수치·운영자 편집·원본 이미지는 보존한다.
- 리버스 겨울의 러시아 문자 이름이 ASCII 정규화 후 빈 키가 되면서 NPC 테스트 패널과 연결되던 오류를 수정했다. 비플레이어/오프라인·빈/중복 키·중복 Lv.1·비정상 패널을 차단하고 JSON 문자열 내부의 `])`가 페이로드를 잘라내던 파서를 교정했다. 136폼 재대조, 3폼 6값 교정, 실제 운영 겨울 HP1263/ATK242/방어106·106 확인.
- 카드/초상화는 원본 이미지로 표시하며, 완전한 splash/full-body만 전체 일러스트로 부른다. 젠존제 11호/엔비/콜레다의 기존 카드 원본과 파일은 유지한다. 복구 bootstrap 읽기도 같은 품질 검사를 거친다.
- 최종 병합본 Node 408개, 수집기 Python 12개, TypeScript, 실제 운영 빌드와 38 API 경로 검증 통과. 운영 브라우저에서 젠존제 갤러리 61명/11호 상세 수치·원본 이미지 표기, 트릭컬 앨리스 한국 서비스 수치·한국어 스킬, 리버스 겨울 교정 수치를 확인했다.
- 기존 6시간 GitHub 수집은 17개 게임 모두 저장/재조회 성공. run `40147167737`의 partial:true는 원문별 상세/수치 부족을 뜻하므로 전체 사실 완성으로 보고하지 않는다. Unicode/NPC/파서 수정 공개 commit `78bb7f2ea1116ae09ce52d9b9acbaa93570cce5d`, 읽기/복구 품질 방어 공개 commit `551539b8d9060b27b8e63b7f7477a4469eae727f`.
- 남은 수치 자료: 붕괴3rd 26폼, 트릭컬 코페, 미출시 엔드필드 명하. hololive Dreams에는 전투 능력치를 만들지 않는다. 검수값을 추정 수치로 채우지 않는다.
- 전체 수정 데이터의 공개 GitHub 압축 복구본 게시만 자동 승인 검토에서 거절되어 보류 중이다. 사용자의 구체적인 데이터 공개 승인을 받기 전 재시도·우회 게시하지 않는다. Site 원본 저장소에는 완전한 데이터가 있으며, 읽을 수 있는 코드와 자동 수집 수정은 공개 저장소에 반영됐다. 현재 bootstrap SHA256 `af7fe4fecddf01b802487d7a32feb6e030fa1f3cf491a2fd2a31dfc6bd930662`.

- v155 local archive SHA256 dd3f43a44d1fb43a0834f2ab10cab304c36cbf184a70c0972acf498684d8a1cd(155259724bytes). Saved Sites archive metadata SHA256 de6c4b7e014b6d40f456472d7c9c1f01afe2298540fb810cf40c2b51aae881ed,178462720bytes/866files. 두 값은 서로 다른 보관 표현의 값으로 구분하여 기록하며, 실제 source checker/runtime fingerprint로 배포 실행 코드를 대조할 것.

- 최종 local archive SHA256 bb2eb46f15d5811900c1840e825b63e0d20ac70afb9989720489c039d94b4173,155257666bytes. Sites saved archive SHA256223326a16422c1f614750e6462827460f3b2fd68792edb94ab58fdbf844be5eb/178462720bytes/866files와 구분. 최종 runtime fingerprint b3f619d840e5ff5b14396f6aac8d80de6c6a35354f9126d18a3fbf2dda76ed02. 이후 이 실제운영결과 문서만 저장하는 소스SHA는 게시SHA f67ea332a411d620714cab4a969472b69a3188ec와 달라도 runtime은 같으며 재배포하지 않는다.


## 현재 상태 · 스타레일 상세 v158 배포·GitHub 검증 완료

98폼 상세/1383원문아이콘 추가. Node443/Python26+14+11/tsc/editor/production build통과. runtime 821e3d6e3a9d584681bde016324919a3a425a08c75fe1295767f644bfe44a04a; managed미리보기 연결실패와 별개로 운영KO상세·레벨/돌파/성혼선택·아이콘실제로드확인. v158 source 20c7763da05f24d9da4f3c2db3f61739e0c9dd7d; appgdep_6addb08911208191bf8f315cdde855da succeeded. ops/HSR-DETAILS.ko.md 참고. public main3d3e91296b977a186e361c5225d2effb55e048be; 실제source40173415101/Android40173415087success, code507+canonical3 일치. public Node425/tsc통과. 실제web40173415164/job121108906942 success(Node425/Python26+14+8+11/tsc/editor). routine rosters40173415092는 진행 중이며 완료 주장을 하지 않는다. 최종 docs/QA checkpoint만 native저장소로 push하고 재배포하지 않는다.


## 우마무스메 전체 서버 보강 · 배포 진행 중

271전신/실제3서버범위JP271·KR214·Global112/844성급패널/9376서버스킬참조/135경주마접힌배경. Node449,Python28+14+18+6+11,tsc/editor/build통과. native30,470,981bytes/32MBbound/84복구조각. runtime f11ae8de3a6bc4680d29675b7b07980bf93ff4d8e79375d0a0a05e3cd936527e (512files). v158은이전배포이며새배포는아직미확정. ops/UMA-DETAILS.ko.md참고. 다음:기존publicSite배포→실제갤러리/상세/배경fold→publiccode동기화+3hashpins유지→native최종체크포인트.

- 배포한도복구:Git원본은9개묶음으로동일바이트전송·merge tree보존. 첫373MB archive는256MiB입력한도로버전저장전거절. 공식135는기존원본URL전달/native원본보존,새136은정적배포. 최종runtime f11ae8de3a6bc4680d29675b7b07980bf93ff4d8e79375d0a0a05e3cd936527e. 새archive재포장·저장예정이며운영은아직v158이다.

- 확장archive한도도확인하여최종Uma271모두검증된원본URL전달로정리(native원본전부보존),아이콘/상세/경주마데이터사이트포함. Node450전체+영향7+source전달추가조건검증,tsc/build통과. 최종runtime e53cad0ab1cf71b0aef98ff20f2ff81ccb25f1387d58ab21065ed41392c3db8b. 아직사이트버전은v158이며새버전저장재시도직전이다.


## 현재 상태 · 우마무스메 v159 배포·실제GitHub검증 완료

source cb668b0d14618c9e300366bb9f1c679b7fbec768,deployment appgdep_6addc379f26081919b264a82dbb50b0f succeeded. runtime e53cad0ab1cf71b0aef98ff20f2ff81ccb25f1387d58ab21065ed41392c3db8b(512=509code+3canonical). 운영JP271/KR214/Global112,전신원본들·성급3→5·성장률·모티브기본fold/펼친본문/아이콘실제로드확인. 최종archiveinput227775379/확장260684671로한도통과. ops/UMA-DETAILS.ko.md참조. 다음:publicruntime509+canonical3 검증/실제CI→최종native문서체크포인트.

- public main28995a3b5dd617c280cf203df768d8f010038944,실제source40178785958/Android40178785948success,실행코드509+canonical3정확일치. public430/tsc통과. 다음:실제web40178785962최종결과기록후native docs/QA체크포인트push(재배포없음).

- 최종실제web40178785962/job121125159392 success(Node430,tsc,owner실제DB/R2,Python28+14+8+11+18+6+11). source/Android도success. routine rosters40178785951는진행중이며완료주장금지. sourcecb668b0d14618c9e300366bb9f1c679b7fbec768가실제v159게시본이고이후docs/QA sourcecheckpoint는runtime동일로재배포하지않는다. 다음사용자요청시이v159와새sourcecheckpoint·실제Site상태부터재확인.


## 우마무스메 표시 수정·소녀전선2 보강 진행 중

운영은 아직v159. Uma 목록/상세 성급 딱지 제거, 전신·설명 분리. GFL2 기존59명 공식 전체 일러스트/1536원문표/751아이콘URL(695네이티브원본)/정기수집 연결. 원문영어·패널기준미표기·Lewis돌파미제공 등은 명시. docs:ops/GFL2-DETAILS.ko.md. native30750092bytes/88복구조각. 754새 원본46,626,728bytes는4개15MB이하 묶음으로 원본Git에 저장(last9eecbe24f562d869b279f5fb163e2eb1323a3b73), 배포는 아직 안 됨. 전체Node451중 회복조각/구도참조2건은원인교정후통과; 추가GFL2원본/SQLite검증2개와영향검사 진행. 다음:productionbuild와동일tree merge→기존publicSite저장/배포→실제화면→public실행코드/hashpins/CI→최종checkpoint.


## 현재 상태 · 우마무스메 표시·GFL2 v160 배포 완료

source cc4ca7b2862d9b2bca9e2f6f4272018b46e61fd6,version appgprj_6ad1ef24b5c08191a367cd141de63a3a~appgver_6b070f1a78f88191990dc282af461921,deployment appgdep_6addcf4aeabc8191b456fa4d5acbc036 succeeded. runtime2cfa2bb724371bdc1406499a259d3182e0a074bc5699f0760d82ee0a907d01ad(512=509code+3canonical). 운영Uma KR214/딱지0/전신상세·성급선택·모티브기본fold, GFL2그로자공식원본1955×2552/게임아이콘/스킬확인. docs:ops/GFL2-DETAILS.ko.md. 로컬publicNode431/tsc/실제source509+3 통과. 다음:publicsource commit/실제CI확인→native최종문서·QA checkpoint(재배포없음).
