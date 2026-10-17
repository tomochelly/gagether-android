# GAGETHER Android
[한국어](README.md) · English · [日本語](README.ja.md)

Android companion for [GAGETHER](https://gagether.wiki), a multilingual calendar for gacha-game banners, events and shop packages. The 1.0.0 source milestone builds on 0.2.4. This does **not** mean a signed production APK or store release has been published.

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
Android Java, WebView/WebMessage, JobScheduler, AlarmManager and RemoteViews form the native layer. The hosted UI is a separate React/TypeScript service. This repository contains the Android companion, not the production web backend or its database.
- Display language does not redefine a game's service schedule.
- Unverified, forecast and date-only schedules do not become exact alarms.
- No updater credentials or owner-session secrets belong in the app.
- Personal notes remain in local app/browser storage, not a shared public database.

## Portfolio context
An independently directed product developed with AI assistance. Product scope, information priorities and feedback-driven revisions were directed by the project owner; AI tools assisted with implementation, research and tests. Do not present generated code as entirely hand-written or claim unmeasured user/performance results.

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
