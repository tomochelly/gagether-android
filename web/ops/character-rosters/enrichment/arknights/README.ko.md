# 명일방주 실제 서비스별 원본 도감

`enrich.py`는 공개 클라이언트 추출 자료를 exact operator ID로 결합한다. 원출처는 게임 클라이언트이지만 전달 경로가 커뮤니티 미러이므로 `sourceKind: community`를 유지한다. 계정 API·토큰·개인 정보·임의 URL·서버 쓰기를 사용하지 않는다. 이미지 수집은 같은 폴더 `artwork.py`, 압축은 `pack.py`로 별도 처리한다.

## 원본과 지역

- `ArknightsAssets/ArknightsGamedata/master/{kr,en,jp,cn}/gamedata/excel/`의 character/skill/skin/handbook/uniequip/char_patch 테이블만 읽는다. 각 파일에 HTTP 상태·실제 수집 시각·바이트 수·SHA256을 남긴다. 잘못된 URL·hash나300명 미만의 불완전한 playable 목록은 거부한다.
- 이전 `Kengxxiao/ArknightsGameData_YoStar`는 마지막 push가2025-11-13으로 멈춰 있었고, 이번에 확인한 새 미러는2026-10-24까지 갱신되어 있었다. 수집 시각만 새롭게 쓰는 것으로 이 누락은 해결되지 않는다.
- 2026-10-25 실제 새 원본은 한국·글로벌·일본 각415명, 중국432명이다. 기존432개의 stable ID를 보존하면서 한국·글로벌·일본에 각각41명의 실제 클라이언트 수록을 추가로 확인했다. 여기에 `char_patch_table.infos[obtainableBase].tmplIds`로 선언된 아미야 가드·메딕2개 클래스 전환 폼을 별도 exact ID로 추가하여 최종 폼 수는 각417/중국434다. 원래 캐스터 아미야와 능력치·직군·그림을 혼동하지 않는다. `patchChars`에만 있는 orphan/NPC template은 플레이어블로 만들지 않는다. 서버별 이름·능력치·스킬이 각 클라이언트 원본을 사용한다. 중국에만 존재하는17명은 다른 서비스에 실장된 것으로 복제하지 않는다.
- TOKEN/TRAP/비획득 NPC 제외. 기존 공개 사실이 새 원본에 없거나 해당 캐릭터 해독에 실패하면 원래 행을 보존하고 보고한다. 발표만 된 캐릭터의 미공개 패널·스킬·실장 서비스는 만들지 않는다. 기존 이미지·구도·원본 ID는 이 수치 보강기가 수정하지 않는다.

## 상세 데이터

- 정예화0/1/2의 실제 Lv.1·최고 레벨 attributesKeyFrames만 제공한다. 최대6개의 원본 체크포인트이며 중간 레벨을 임의 계산하지 않는다. HP·공격력·방어력·마법 저항·코스트·저지 수·공격 간격·재배치 시간을 수록하고 신뢰도·잠재능력·모듈·편성 효과를 기본 패널에 합산하지 않는다.
- 원본에 선언된 기본 스킬 전 레벨과 특화I~III, SP 소모·초기 SP·실제 지속 시간·충전 횟수. 스킬 `skillId`와 활성화/SP 회복 enum을 엄격하게 검사한다. 패시브의 native numeric SP enum8은 `skillType: PASSIVE`가 함께 있을 때만 인정한다. 음수 지속 시간 sentinel은 실제 초 단위 시간으로 표시하지 않는다.
- 정예화·레벨·잠재능력 조건별 재능과 특성을 별개 선택지로 보존한다. 최고 정예화의 기본 잠재능력 변형을 먼저 표시하되, 낮은 단계와 잠재능력 강화 문구도 모두 남긴다. 서로 다른 조건의 효과를 중복 합산하지 않는다.
- native blackboard의 정확한 소수·백분율·부호·duration을 치환하고 미지 변수를0으로 바꾸지 않는다. 레벨마다 문구 구조가 바뀌어도 모두 보존하기 위해 완성된 원문을300자 이하의 parameter 열로 나눈다. 합치면 해당 레벨 원문과 정확히 일치한다. 실행 가능한 markup은 제거하고 줄바꿈은 유지한다.
- 스킬 아이콘은 fexli/ArknightsResource의 고정 commit `184aa662f210100150716d4f58cadc0b4e3642fc`에서 실제 tree에 선언된 exact skillId/iconId 파일만 연결한다. 다른 캐릭터 아이콘이나 추측한 URL을 채우지 않는다. 원본 파일 pinning/외부 전달 검증은 배포 통합 단계가 담당한다.
- `skill-icons.json`에는 해당 고정 tree의1698개 PNG 파일명과 tree/source hash만 저장한다. 별도 `--icon-tree`를 주지 않은 정기 실행도 이 선언 목록을 사용하므로 이미 연결된891개 스킬 glyph가 다음 갱신 때 사라지지 않는다. 다른 commit의 같은 파일명을 검증 없이 재사용하지 않는다.
- 서버별 한국어·영어·일본어·중국어 문구는 각각 본래 언어 필드에만 저장한다. 선택한 서버에 없는 다른 서비스의 개정 스킬을 섞지 않는다. 표시 언어에 원문이 없으면 기존 UI의 원문 언어 표시를 사용한다.

## 재현

```sh
python ops/character-rosters/enrichment/arknights/enrich.py \
  --input /path/to/full-arknights-roster.json \
  --native-dir /path/to/native \
  --fetch \
  --icon-tree /path/to/fexli-skills-tree.json \
  --output /path/to/enriched.json \
  --report /path/to/report.json
python -m unittest discover -s ops/character-rosters/enrichment/arknights -p 'test_enrich.py'
```

`download_native(directory, refresh=False)`는6시간 이내 hash가 맞는 source cache를 재사용하고, 지난 자료는 실제로 다시 요청한다. `--refresh`는 즉시 새로 읽는다. 서버 스냅샷/복구 조각/다운로드한 전체 native 테이블을 공개 GitHub fixture로 복사하지 않는다. 완전한 원본 입력을 읽은 뒤 별도 출력하며 원본을 수정하지 않는다. CLI에서 캐릭터 실패가 있으면 보고서와 last-good 포함 출력을 남기고 실패 종료한다.

최종 실제 실행:434폼/지역417·417·417·434, 상세 실패0, 서비스별 스킬·재능·특성7094표, 레벨·조건별 설명45238개, 정확한 능력치 체크포인트9726행, 선언된 스킬 아이콘891URL. Python11회귀와 전체 roster schema 검증 통과. 클래스 전환의 해금은 원본 stage8/14조건이며, patch table의 낮은 정예화 체크포인트가 그 단계에서 해당 클래스를 해금할 수 있다는 뜻은 아니다. 모듈 강화의 별도 전투 수치나 장문 archive profile의 완전 수록을 이 작업으로 주장하지 않는다.
