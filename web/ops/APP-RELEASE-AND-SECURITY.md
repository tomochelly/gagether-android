# Android release and PHP scope review — 2026-10-23

## PHP advisory
The production web app uses TypeScript/React (Vinext) on Cloudflare Workers with D1/R2. Its package manifest, Worker entry point and source contain no PHP execution engine or Composer deployment. The PHP project advisory dated 2026-10-21 (https://www.php.net/) concerns CVE-2026-109618 and CVE-2026-109619 in PHP web execution engines. The inspected GAGETHER application is outside that direct runtime scope. This review does not audit the hosting provider's internal systems. If a PHP component is introduced, reassess and apply the PHP project's fixed version guidance before enabling it.

## Android source and release gate
The canonical app source is the GitHub repository root (`tomochelly/gagether-android`). The native Sites `android/` copy is a recovery mirror. Do not create a signing key to replace an existing key.

`android-runtime.yml` builds isolated debug/test APKs and tests Android API30 and36: four device locales, explicit manual locale, preservation of selected actual service, denied notification permission where supported, real AlarmManager delivery through the actual receiver into NotificationManager, duplicate suppression, explicit scheduled test notification and stale-feed cancellation. The test APK is never published as the release app.

A successful same-repository main-branch push run triggers the existing protected `android-release` environment. `release-build.yml` builds the exact tested SHA with the existing signing secrets, verifies the APK signature and runs `publish-release.py`. The publisher compares the certificate to the pinned SHA-256 of release1.0.0, then publishes immutable APK, SHA256SUMS and verification.json. Manual workflow dispatch remains build-only. Failed tests, absent secrets or a mismatched certificate block publication. A GitHub release is not a Play/Galaxy Store rollout.

The site's `content/android-release.json` must be updated only after the public release, APK digest and verification.json have been read back. Never advertise an unbuilt version. GitHub release cancellation does not remove an installed APK; emergency rollback requires a compatible higher-versionCode build using the same key.

## Reminder limits
Notifications are local alarms based on a successfully validated feed, not FCM push. The feed accepts the site's15 games and the three reviewed CN services. A feed older than24h does not arm game reminders. Optional exact-alarm access improves delivery timing; denied access uses OS-controlled inexact fallback. Notification permission and channel blocking are reported separately. App settings show armed count, last posting and scheduled-test delivery. Actual posting is not proof the user saw/read a notification.

Physical Galaxy/Fold battery-management, offline/Doze/reboot and long-duration observations remain separate from emulator checks. No guaranteed delivery time is claimed.

## Site announcements
Owner settings store `announcements` (up to20, stable unique ID, four-language title/body, optional real publication date and safe HTTPS/root-relative link) and `announcementSeconds` (3–60, default7). The site editor uses the existing authenticated revision/audit/restore flow. Explicit empty arrays disable notices. Hover, focus, detail dialog, pause control and reduced-motion preferences stop automatic rotation. No game-data sync should copy or overwrite owner announcements.

## Verification record
- Public Android1.0.1 (versionCode8): https://github.com/tomochelly/gagether-android/releases/tag/v1.0.1
- Runtime checks: https://github.com/tomochelly/gagether-android/actions/runs/39874185215 (API30/36 passed).
- Signed publish: https://github.com/tomochelly/gagether-android/actions/runs/39874502764 (passed).
- Downloaded public APK SHA256: `596a26df0c725e9ff31bd4c956401a2d975e22bb166f1865ba864276cf90c14e`; existing release certificate matched.
- Live Korean mobile feed: schema1,15 games,551 timed entries, no unsupported game IDs; unchanged production data.
- Web regression:184 tests passed, TypeScript passed, isolated SQLite/R2 editor create/edit/revision/upload/announcement settings passed.
- Browser visual QA could not run because the managed preview reported another Vinext server and remained stopped. This is not a verified screenshot review.
