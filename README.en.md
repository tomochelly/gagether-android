# GAGETHER Android
[한국어](README.md) · English · [日本語](README.ja.md)

> Your games. Their schedules. One place to keep track.

**GAGETHER** brings gacha banners, events and approaching deadlines into a calendar for the games you follow. Its Android companion combines a shared mobile web interface with configurable reminders and home-screen widgets.

[Try the web app](https://gagether.wiki) · [Releases / downloads](https://github.com/tomochelly/gagether-android/releases) · [Changelog](CHANGELOG.md)

## At a glance

| Feature | What it helps you do |
| --- | --- |
| Followed games | Browse schedules for your games and their actual service regions |
| Home-screen widgets | Choose next-event, scrollable agenda or grouped-game views |
| Custom reminders | Configure start/end reminders and multiple advance notice times |
| Compact mobile view | Expand artwork when needed and reduce scrolling |
| Personal calendar | Keep notes, pull records and personal plans on the current device |
| Shared web experience | Receive web content and UI changes without reinstalling the APK |

**Get started:** open the web app without signing in. App installers and source archives are separate; see Releases and the release status below. Reminders are scheduled on the device.

## Release status

Android companion for [GAGETHER](https://gagether.wiki), a multilingual calendar for gacha-game banners, events and shop packages. **[GAGETHER 1.0.3 APK](https://github.com/tomochelly/gagether-android/releases/tag/v1.0.3)** is available as a release-signed build (versionCode 10). Download `GAGETHER-1.0.3.apk` from Assets; source archives are not installers. Release unit tests, APK/AAB builds and APK signature verification passed. Google Play/Galaxy Store publication is not complete.

Application ID `app.patchwork.radar` installs separately from the older `.beta` app. Settings and personal records are not migrated automatically.

## Problem and approach
Schedules and announcements are scattered across games and services. GAGETHER combines a shared mobile web interface with native Android reminders and home-screen widgets. Web content updates reach the app without rebuilding the APK; changes to native code still require an app update.

## Implemented
- Login-free public browsing, followed-game and actual-service selections.
- Resizable next-event, agenda and grouped-game widgets.
- Per-content start/end reminders with configurable offsets and quiet hours.
- Responsive web layouts for narrow phones, Fold cover/internal displays and multi-window widths.
- Optional compact mobile view and device-local calendar notes/pull records.
- Read-only public data sync; validation, stale-data suppression and rescheduling.
- Optional character-inspired reminder text, explicitly fan-written; factual fallback for unreviewed characters/languages.

## Engineering decisions
Android Java, WebView/WebMessage, JobScheduler, AlarmManager and RemoteViews form the native layer. The hosted UI is a separate React/TypeScript service. This repository contains the Android companion and the React/TypeScript service source in `web/`. Production databases, private signing keys and private user data are excluded. See [Web portfolio and publication scope](web/PORTFOLIO.md) and the [verification record](web/ops/catalog-expansion/verification-20261024.json).
- Display language does not redefine a game's service schedule.
- Unverified, forecast and date-only schedules do not become exact alarms.
- No updater credentials or owner-session secrets belong in the app.
- Personal notes remain in local app/browser storage, not a shared public database.

## Portfolio context
An independently directed product developed with AI assistance. Product scope, information priorities and feedback-driven revisions were directed by the project owner; AI tools assisted with implementation, research and tests. Implementation and validation are documented separately, including the device testing and performance measurements that remain outstanding.

The repository demonstrates integration boundaries, data validation, localization, adaptive layouts and explicit handling of uncertain schedules. See [validation scope](docs/VALIDATION.md), [release/signing](docs/RELEASE.md) and [change history](CHANGELOG.md).

## Build
Android 8.0+ (API 26), target/compile API 36. Use JDK 17 and the checked-in Gradle wrapper:
```sh
./gradlew :app:assembleDebug :app:testDebugUnitTest
```
Production APK/AAB builds require an owner-managed signing key. Never rename a debug APK to imply production signing.

## Limitations
Reminders are locally scheduled, not FCM remote push. Background sync is OS-scheduled and can be delayed. Web Push, cross-device note sync and hinge-aware Flex mode are not implemented. Full Galaxy/Fold device QA remains necessary. GitHub publication alone does not remove Android installation warnings.

## Rights
GAGETHER is an independent fan project, not an official game service. Game logos, artwork and characters belong to their respective rightsholders. Public source availability does not grant rights to redistribute those assets or imply an open-source license where none is specified.
