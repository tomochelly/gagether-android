# 배포와 서명

## GitHub에 올릴 것

- 저장소 Code: 이 폴더의 소스 파일과 문서. 압축을 풀어 `app/`, `gradle/`, `gradlew`, `README.md`, `.github/`가 저장소 최상단에 오게 합니다.
- Releases: 검수한 APK, `SHA256SUMS.txt`, 릴리스 설명.
- GitHub는 태그의 소스를 `Source code (zip)`과 `Source code (tar.gz)`로 자동 제공합니다. `source.tar.gz`만 Code에 올릴 필요는 없습니다.
- 운영 사이트의 배포용 tar, 게임 원본 이미지 모음, 서버 데이터, 개인 서명 키는 이 앱 저장소에 포함하지 않습니다.

현재 준비된 Android 프로젝트는 `gagether.wiki/mobile`을 표시하는 앱입니다. 웹사이트 서버 소스의 백업은 별도 작업이며 이 저장소에 포함하지 않습니다.

저장소를 새로 만들 때는 먼저 비공개로 올리고, 코드 공개 범위와 라이선스를 정한 뒤 공개로 바꿀 수 있습니다. 기존 저장소가 있다면 그 주소를 사용합니다.

## 설치 경고

Galaxy Auto Blocker는 허용되지 않은 경로에서 받은 APK 설치를 막을 수 있습니다. GitHub에 게시하거나 출시 키로 서명하는 것만으로 공식 스토어 설치와 같아지지는 않습니다. 일반 이용자 배포는 Play 스토어 또는 Galaxy Store를 목표로 합니다.

Google Play Protect의 유해 앱 경고는 외부 출처 설치 안내와 별개의 문제입니다. 정확한 경고 문구와 해당 APK를 확인해야 하며, 이용자에게 Play Protect를 끄도록 안내하지 않습니다.

## 현재 베타 APK

`GAGETHER-0.2.2-beta.apk`는 `app.patchwork.radar.beta`, versionCode 4의 디버그 빌드입니다. 기존 0.2.1-beta와 같은 인증서로 빌드했는지 확인한 후 배포합니다. 다른 PC나 GitHub Actions에서 새 디버그 키로 빌드한 APK는 기존 베타에 업데이트 설치되지 않을 수 있습니다.

현재 테스트 서명 인증서 SHA-256:

```text
9d495186c16eed03573c931f67ee3fde46b3eff2889c14461433f8ce229ff796
```

공개 인증서 지문은 비밀 키가 아닙니다. 키 파일 자체는 저장소와 소스 압축에 넣지 않습니다.

## 출시용 빌드

정식 서명 키는 소유자가 Android Studio의 **Build → Generate Signed Bundle / APK**에서 생성하고 별도로 보관합니다. 이미 사용하는 키가 있으면 그것을 유지합니다. 이 프로젝트는 키를 자동 생성하지 않습니다.

다음 환경 변수를 설정합니다. 실제 값은 소스에 쓰지 않습니다.

| 환경 변수 | 값 |
| --- | --- |
| `GAGETHER_KEYSTORE_FILE` | 소유자 키 파일의 절대 경로 |
| `GAGETHER_KEYSTORE_PASSWORD` | 키 저장소 비밀번호 |
| `GAGETHER_KEY_ALIAS` | 키 별칭 |
| `GAGETHER_KEY_PASSWORD` | 키 비밀번호 |

```bash
./gradlew -PrequireReleaseSigning=true :app:testReleaseUnitTest :app:assembleRelease :app:bundleRelease
```

출력은 `app/build/outputs/apk/release/app-release.apk`, `app/build/outputs/bundle/release/app-release.aab`입니다. 서명이 없으면 위 명령은 실패합니다. 서명 강제 옵션 없이 개발 검증용 빌드를 만들 수 있으나, 그 unsigned 결과물은 설치나 Play 업로드용으로 배포하지 않습니다.

출시 applicationId는 현재 `app.patchwork.radar`로 설정되어 있습니다. 기존 `.beta` 앱과는 다른 앱으로 설치되며 설정이 자동 이전되지는 않습니다. 최초 스토어 등록 전에 applicationId를 최종 확정합니다.

Play App Signing의 업로드 키와 기기에 설치되는 앱의 서명 키는 다를 수 있습니다. Play가 생성한 앱 서명 키를 사용한다면 업로드 키로 서명한 GitHub APK를 Play 설치본의 업데이트로 배포하지 않습니다. 여러 스토어에서 같은 앱을 업데이트하려면 최초 등록 전에 서명 전략을 정합니다.

## GitHub Actions

`Android checks`는 main 브랜치와 PR에서 테스트·빌드를 수행합니다. 임시 CI 디버그 APK를 사용자 업데이트 파일로 배포하지 않습니다.

`Build signed release`는 수동 실행합니다. GitHub의 `android-release` Environment에 다음 Secrets를 등록합니다.

- `GAGETHER_KEYSTORE_BASE64`: 키 파일을 Base64로 인코딩한 값
- `GAGETHER_KEYSTORE_PASSWORD`
- `GAGETHER_KEY_ALIAS`
- `GAGETHER_KEY_PASSWORD`

Environment는 출시 담당자 승인과 허용 브랜치를 설정하는 편이 좋습니다. 이 워크플로는 서명된 파일을 검토용 Artifact로만 저장하며 스토어나 Releases에 자동 공개하지 않습니다. 키가 없으면 실패합니다.

## 스토어 등록 전에 남은 일

소유자의 개발자 계정, 출시용 서명, 실제 서비스에 맞는 개인정보처리방침·데이터 안전 정보, 스토어 이미지와 설명, Galaxy 실기기 검증, Play Console이 요구하는 테스트를 완료해야 합니다. 이 소스와 APK를 준비한 것만으로 스토어 등록이나 심사 통과가 완료되지는 않습니다.

## 공식 문서

- [Samsung Auto Blocker](https://www.samsung.com/hk_en/support/mobile-devices/protect-your-galaxy-device-with-the-new-auto-blocker-feature/)
- [Android 앱 서명](https://developer.android.com/studio/publish/app-signing?hl=ko)
- [Google Play Protect](https://support.google.com/googleplay/answer/2812853?hl=ko)
- [GitHub Releases와 자동 소스 압축](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
