# GAGETHER 작업 이어받기 · 2026-10-31

## 완료된 게시본

Orbit v306 완료 뒤 승인받은 운영자 백업 기능을 v307에 추가해 게시했다. 기존 기본 사이트는 /ko, 별도 Orbit은 /orbit/ko를 유지한다. 가챠는 기존 구현 게임의 디자인을 보존한다.

- Sites source: 651abafcf4978c4dd8c8a1706ab8db7cb39ce87b
- version: appgprj_6ad1ef24b5c08191a367cd141de63a3a~appgver_0dec98900c7c8191a179a74739cfff57
- deployment: appgdep_6ae5c644e9ec8191a3a02c207de8a0f1
- 성공: 2026-10-31T10:43:40.537141+00:00
- runtime fingerprint: 951a3c8a59c514d2c54e16a6d44c325cab3169f2026b8f3529c9c9d03ca40ff0

v306 관련 11개 검사·타입·빌드·4언어 모바일/데스크톱 운영 확인, v307 내보내기 통합 3개·타입·64 API 빌드와 미인증 404 확인을 마쳤다. 사용자 데이터/설정/로그인 방식/DNS는 변경하지 않았다. 외부 원본·수집 실패 등 기존 미확인 자료는 추정하지 않았다.

## 공개 소스 정책

사용자 최신 지시대로 GitHub main/web를 원본으로 삼는다. 배포 런타임 913개 중 814개는 바이트 그대로 공개, 이미지 경로·배치 JSON 99개와 복원 조각 179개는 비공개 다운로드만 제공한다. 정확한 목록·해시는 ops/private-source-manifest.json과 MIGRATION-HANDOFF.ko.md를 따른다. 공개 체크아웃에 남은 과거 버전만으로 현재 배포를 재구성하지 않는다. 비공개 overlay가 필요하다.

ops/export-github.mjs 절차로 전송 목록을 생성했다. 코드 일치 검사는 814개 해시·배포 fingerprint·정확한 99개 제외 목록을 강제한다. 공개 제외 정책 검사 5개 통과. 코드 누락이나 새 배포를 무조건 승인하지 않는다. 기존 공개 이력과 web/ 밖 Android·워크플로는 보존한다.

## 이전 백업과 다음 작업

운영자 직접 경로 /owner/migration-export: 기존 editorIdentity만 GET 허용, 그 외 404, private/no-store. 내용은 로그에 남기지 않는다. 도메인 이전 완료 후 사용자가 제거를 요청하기 전까지 유지한다.

D1 첫 백업 49개 테이블/SQL 46개를 SQLite로 복원해 스키마·무결성·FK·sequence를 검증했다. 복원 행 수는 종료 운영 관측치와 모두 일치한다. 시작/종료 사이 6개 테이블이 갱신돼 원자적 스냅샷이 아니며 전체 verified:false를 유지한다. 전환 직전 최종 백업이 필요하다.

R2 전체 원본 다운로드와 개수·bytes·SHA-256 대조는 진행 중이다. 완료 수치·다운로드 해시·최종 GitHub SHA는 MIGRATION-HANDOFF.ko.md에 확정 기록할 것. 공지 갱신과 도감 수집을 백업 동안 잠시 중지했으므로 종료 시 반드시 재개하고 UI에서 활성 상태를 확인할 것. 로컬 work/migration/paused-workflows.json에 중지/재개 기록을 남겼다.

일반 품질 점검 자동화는 읽기 점검 우선으로 바꿨다. 최종 동기화 이후 긴급 장애 외 Sites 변경·재배포 금지. 실제 새 Workers 배포, DNS·로그인 교체는 다른 작업에서 담당한다. Sites 삭제·데이터 삭제 금지.

공개 GitHub 단독 전체 CI/빌드는 비공개 overlay 부족으로 실패할 수 있다. 최종 CI 상태를 확인해 기록하며, 검사 생략을 성공으로 표시하지 않는다. 전체 이전 절차와 미확인은 MIGRATION-HANDOFF.ko.md를 참고한다.

