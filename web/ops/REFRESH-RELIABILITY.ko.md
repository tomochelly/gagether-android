# 자동 갱신 실행·코드 보관 검증 · 2026-10-25

## 원인과 변경

실패 #308(40149911508), #312(40158762993)는 실제 소스 오류가 아니라 80회 continuation 요청 한도를 소진했다. 방송 cursor306까지 저장하고 다음 예약 실행이 이어받았으며 #309, #311은 partial 결과와 automatic/effective2121건을 실제 재조회했다.

요청기는 12분 또는 최대240요청 중 먼저 도달한 경계에서 종료한다. 종료 전에 GET으로 같은 runId·startedAt·stage·cursor의 정상 continuation 결과가 운영 저장소에 남았는지 확인한다. 이때 결과는 continuing이며 완료로 보고하지 않는다. 다음 예약 실행이 같은 체크포인트를 이어받는다. 18분 작업 제한, 네 번의 일시적 통신 재시도, OIDC의 기존 저장소/워크플로/main/대상 인증은 유지한다. 인증 실패, 실제 단계 실패, 누락·불일치 체크포인트, 최종 저장/재조회 실패는 계속 실패한다. partial은 경고로 유지한다.

## 코드 검증 범위

사이트 실행 코드와 공개 GitHub web/를 실제 배포 v154의 source-manifest에 맞춘다. check-source-mirror.py는 운영 manifest 전체가 저장한 manifest 및 fingerprint와 일치하는지 확인하고, 아래 세 파일을 제외한 모든 실행 파일을 바이트 SHA256으로 대조한다. 코드가 없거나 다르거나 새 배포가 등장하면 실패한다. 경고를 무조건 숨기거나 알림 설정을 바꾸지 않는다.

전체 운영 데이터의 공개 저장소 복제는 이전 승인 검토에서 보류됐다. 이번 작업은 공개 가능한 코드만 갱신하며 아래 세 파일의 전체 내용·압축복구 조각은 공개하지 않는다.

- content/character-rosters/bootstrap.json
- content/character-rosters/artwork-manifest.json
- content/character-rosters/recovery/manifest.json

세 데이터 파일은 이미 공개된 운영 source-manifest의 정확한 해시로 고정하며 완전한 파일은 기존 native Sites 소스와 v154 아카이브에 보관한다. GitHub의 기존 공개 데이터는 이전 스냅샷이다. 따라서 이 검증을 전체 운영 데이터 백업 또는 GitHub 단독 완전 복구 검증이라고 부르지 않는다. 예외 경로를 새 코드나 추가 데이터로 확장하면 검사에 실패한다. 새 배포 시 코드를 먼저 대조하고 manifest/receipt를 함께 갱신한다.

운영 전체 데이터에 의존하는 최신 상세/전체복구 테스트는 native Sites 소스에서 실행한다. 공개 GitHub에는 기존 공개 스냅샷과 호환되는 실제 코드/API/편집/배너/구도 테스트를 추가한다. 데이터 차이를 숨기기 위해 assertion을 완화하지 않는다. GitHub에서 최신 완전 빌드를 복구하려면 native 소스에서 세 파일 및 복구 조각을 가져와야 한다.

이번 변경은 자동화 실행 파일과 검증 파일의 변경이다. v154의 공개 UI/DB/접근권한을 다시 배포하거나 기존 글·수동 편집을 수정할 필요가 없다.
