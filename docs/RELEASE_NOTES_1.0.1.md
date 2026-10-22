# GAGETHER 1.0.1

15개 게임과 리버스1999 중국 서버를 앱 일정 수신 허용 범위에 반영했습니다. 새 게임이 포함된 정상 피드를 앱이 거부하던 동기화 문제를 수정했습니다.

기기 언어를 기본으로 따르며 한국어·영어·일본어·중국어와 앱 안의 명시적 언어 선택을 지원합니다. 언어 변경은 게임 서비스 선택을 바꾸지 않습니다. Android13 이상에서는 시스템의 앱별 언어 설정도 사용할 수 있습니다.

테스트 알림도 실제 AlarmManager 예약과 Receiver를 거쳐 게시합니다. 알림 권한·채널 차단·예약 수·최근 게시 상태를 표시하고, 정시 알림 권한이 허용되면 정확한 알람을 사용합니다. 권한이 없으면 OS의 지연 가능한 예약으로 동작합니다. 알림은 기기 예약 방식이며 FCM 서버 푸시는 연결하지 않았습니다.

이 APK는 기존1.0.0과 같은 앱ID·서명, versionCode8로 배포합니다. 기존 앱 위에 업데이트할 수 있으며 앱 데이터를 지우거나 제거할 필요가 없습니다. `.beta` 설치본과는 별도 앱입니다. 실제 Galaxy/Fold와 OneUI 절전 환경의 검수는 별도이며, 에뮬레이터 검증 범위는 첨부 verification.json과 CI 결과를 확인하세요. Google Play/Galaxy Store 배포는 포함하지 않습니다.

## English

Fixes native feed acceptance for all15 games and the Reverse:1999 CN service. Device language is followed by default, with explicit manual override; language changes preserve selected services. Test notifications now exercise real alarm delivery. Permission/channel state and scheduling diagnostics are exposed. Exact timing uses optional Android alarm access; the OS may delay fallback reminders. Updates the same signed1.0.0 application without deleting user data. Galaxy/Fold physical-device and store verification remain separate.

## 日本語

全15ゲームとリバース1999中国版の正常な予定データを受信可能に修正。端末言語への追従・明示的な言語選択に対応し、サービス選択は保持します。テスト通知も実際のアラーム予約とReceiverを通します。権限・通知チャンネル・予約状態を表示し、正確なアラーム権限がない場合はOSによって遅延する予約を使います。同じ署名・アプリIDの1.0.0へ上書き更新可能です。Galaxy/Fold実機・ストア検証は別途です。

## 中文

修复含全部15款游戏及重返未来1999国服的正常日程被拒收问题。默认跟随设备语言，可手动选择，语言切换不改变服务区。测试通知也通过真实系统闹钟和Receiver，显示权限、通知渠道与预约状态。精确闹钟权限可选，未授权时系统可能延迟。使用与1.0.0相同的签名和应用ID更新，保留应用数据；Galaxy/Fold真机及商店验证另行进行。
