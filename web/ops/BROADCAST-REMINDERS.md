# Official broadcast reminders and game assets — 2026-10-23

Android 1.0.2 (versionCode 9) adds a separate opt-in official-broadcast setting. In Settings, enable notifications, keep Link to My games enabled, select the actual services and enable My games · Official broadcast reminders. Choose 60/15/0 minutes. The My games broadcast panel also links to these settings in the app.

The native `broadcast_reminders` channel is independent of `schedule_reminders`. Quiet hours and Android notification permissions apply. No FCM sender is connected: reminders use the latest public feed stored locally, with bounded Android background sync. Exact alarms require the user's Android special access; otherwise Android may delay delivery. A stale feed or broadcast status is excluded after 24 hours. Exact broadcast alerts delayed more than ten minutes are discarded.

The public mobile protocol remains schema 1 for older APKs. A separate `broadcasts` array preserves nested reviewed official metadata and leaves gameplay clocks null. Normal game entries and widgets do not consume broadcast reservations. Program start takes precedence over player transmission start; date-only, forecast, ended/cancelled and unverified records cannot schedule alerts. An older reservation for the same game/service/video cannot override a newer cancellation. Reaching a scheduled time never claims actual LIVE status. Existing schedule preferences, language mode, selected services and owner editorial records are retained; broadcast opt-in defaults off.

`Game.localizedLogos` and `logoSources` allow reviewed locale-specific wordmarks. The common catalog chooses the locale variant for both web and app; explicit owner artwork remains authoritative. Settings use `Game.icon`, never a wordmark. Stella Sora's reviewed Japanese wordmark is 1707×662 from https://stellasora.jp/ and its official website bundle. The 512×512 anniversary app icon is the Google Play original from https://play.google.com/store/apps/details?id=com.Stargazer.StellaSora. Neither original has been cropped or upscaled.

Native source: https://github.com/tomochelly/gagether-android/commit/e0beff59751dc937e78345a1f6a8c8b480873b28
Runtime test: https://github.com/tomochelly/gagether-android/actions/runs/39882968131

API 30 and 36 emulator builds, pure policy tests and actual AlarmManager → receiver → visible NotificationManager delivery passed, including the separate channel, duplicate suppression, rescheduling and cancellation. Four release-draft regression tests passed. Web tests cover all four display languages, actual-service isolation, null gameplay clocks, icon/wordmark separation, owner overrides and separate preference persistence. Physical Galaxy/Fold long-run delivery is not verified. Managed browser QA is blocked by the pre-existing /site vinext PID14 supervisor conflict; no unrelated process was killed.

The first signed-release publication stopped safely because GitHub assigned an untagged identity to its empty draft. Publication now retains the API-returned release ID and only reuses the exact approved version's unambiguous empty draft. Existing differing artifacts remain protected from replacement. Certificate continuity with the distributed 1.0.0 APK is mandatory.

Published Android APK: https://github.com/tomochelly/gagether-android/releases/tag/v1.0.2
SHA-256: f8464eebbfb9b885018c63be64ba659867ffa70c3b5047dff72a036caf48ef14
Public binary downloaded and checked against verification.json; original signing certificate matched.
Web checks: 190 tests and TypeScript compile passed. Live four-language feed projections contain unique IDs with 551/534/536/534 game entries and 10/7/8/5 separate broadcast records (KO/EN/JA/ZH).
