# GAGETHER 1.0.2

- Separate opt-in official broadcast reminders for selected My games and actual services, with 60/15/0-minute choices and a separate Android notification channel.
- Uses confirmed program start, falling back to scheduled transmission. Game schedule clocks and widgets remain separate. Cancelled/ended, date-only and unverified broadcasts do not schedule alerts.
- Website-managed app settings now use square game icons; Japanese Stella Sora pages use the reviewed Japanese official logo.
- Existing language, selected services, game reminder rules and signing identity are preserved. Broadcast reminders default off for existing users.

Local scheduled reminders, not FCM push. Android may delay inexact alarms and background collection. Runtime checks cover API 30 and 36 emulators; physical Galaxy/Fold timing has not been tested.
