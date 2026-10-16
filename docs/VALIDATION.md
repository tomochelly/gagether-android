# 0.2.2-beta 검증 기록

검증일: 2026-10-17 (JST)

| 항목 | 결과 |
| --- | --- |
| Debug APK 빌드 | 성공 |
| Debug 단위 테스트 | 12개 통과, 실패 0 |
| Release 단위 테스트 | 12개 통과, 실패 0 |
| Release APK / AAB 패키징 | unsigned 개발 검증용 산출물 생성 성공 |
| Release lintVital 검사 | 통과 |
| 실제 API 응답 호환성 | 저장된 최신 일본어 응답 486개 항목·191,382 bytes 수신 검증 통과; 중국 서버 항목 3개 포함 |
| 테스트 APK 서명 | v2 서명 검증 성공, 기존 0.2.1-beta와 같은 인증서 |
| 출시 서명 누락 방지 | `-PrequireReleaseSigning=true`일 때 키가 없으면 빌드 실패하는 것 확인 |
| GitHub 워크플로 | YAML 구문 확인; GitHub 실행 결과는 아직 없음 |
| Galaxy / Fold / 에뮬레이터 | 이 환경에서 실기기·에뮬레이터 실행을 수행하지 않음 |

배포할 베타 파일: `GAGETHER-0.2.2-beta.apk` (1,237,219 bytes)

```text
SHA-256: a81381b2569706870a16eb9dc91f7cb216ea3db9fe7fcbcbfd181519e34a7b10
package: app.patchwork.radar.beta
versionCode: 4
versionName: 0.2.2-beta-debug
minSdk: 26
targetSdk: 36
```

출시용 서명 키를 아직 연결하지 않았으므로 unsigned APK/AAB는 사용자 다운로드 파일에 포함하지 않습니다. APK 서명 검증은 파일 무결성과 인증서를 확인한 결과이며, Play Protect 판정이나 스토어 심사 통과를 의미하지 않습니다.

웹사이트와 자동 수집 데이터는 이번 Android 빌드에서 수정하지 않았습니다.

## 0.2.4-beta — 2026-10-17

- Local JDK 17 / Gradle 8.13 / Android API 36 build: `:app:testDebugUnitTest :app:assembleDebug` passed.
- 27 native tests passed, including 9 new tests for custom start/end offsets, legacy settings, exact-end delivery, invalid offsets, withdrawn settings, grouped banners, three-speaker rotation, unreviewed-language fallback and honest late-alert wording.
- Site TypeScript check and 13 Node tests passed (calendar CRUD/conflicts/storage failures, service filtering, date boundaries, collapsed art, default/simple SSR, 4-language controls and native feed evidence filtering).
- No browser, emulator, physical Galaxy/Fold or real notification-delivery test was available. OS power management can delay scheduled alerts.
- Remote FCM and browser Web Push remain unconfigured.
