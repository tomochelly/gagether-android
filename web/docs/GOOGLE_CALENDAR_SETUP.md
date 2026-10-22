# Google Calendar connection

The event detail panel supports two modes:

- Without configuration: open Google's event editor so the visitor can review and save manually. This does not grant GAGETHER write access and cannot enforce deduplication.
- With `GOOGLE_CALENDAR_CLIENT_ID`: Google Identity Services browser token flow, followed by a separate explicit Add click. Writes target the consenting visitor's primary calendar. This is not a background or two-way sync.

## Activate

1. In Google Cloud / Google Auth Platform, select an owner-controlled project and enable Google Calendar API.
2. Configure the OAuth consent screen for external users. Use GAGETHER as the app name, an actual monitored support/developer email, `https://gagether.wiki` as homepage and `https://gagether.wiki/calendar-privacy` for the calendar integration privacy notice. Confirm any additional privacy/terms requirements in Google's console; do not invent contact details. Verify domain ownership where required.
3. Add scope `https://www.googleapis.com/auth/calendar.events.owned`. It includes read/create/change/delete rights on owned calendars; there is no insert-only primary-calendar scope. The implementation only inserts and reads its own deterministic event ID after a conflict. No list, patch or delete calls are made.
4. Create a **Web application** OAuth client. Authorized JavaScript origins: `https://gagether.wiki` and, if visitors use it, `https://gagether.tomochelly.chatgpt.site`. Origins have no trailing path. The popup token flow does not use an application callback route or client secret.
5. Set the Sites production runtime environment key `GOOGLE_CALENDAR_CLIENT_ID` to the resulting `…apps.googleusercontent.com` ID. Deploy the saved version to apply the environment revision. Never put a Google client secret or access token in the source or APK.
6. While the Google app is in Testing, add intended tester accounts. Complete Google's applicable OAuth verification/publication requirements before opening the integration to everyone. Publishing the Site alone does not publish the Google OAuth app.
7. In a normal browser, open an official dated entry, expand Google Calendar, connect a tester account, and explicitly add the event. Confirm the primary calendar and time zone. Add the same entry again and confirm no duplicate. Test denied consent, closed popup, expired access, reconnect, revoked permission, and date-only events.

## Behavior and privacy

- Tokens live only in the mounted panel's memory. No refresh tokens, database persistence, cookies or localStorage. Connecting alone does not write.
- All four UI languages have consent, errors, result and privacy text.
- Exact instants retain offsets; date-only ranges use Google all-day dates with an exclusive next-day end. Forecasts, broadcasts, unknown or mixed/partial intervals are rejected. No synthetic midnight or notification time.
- API-created events are transparent (available) and have no reminders by default. Users can configure reminders in Google Calendar. The manual editor uses Google's settings; users must review them.
- Stable SHA-256 IDs prevent duplicate inserts of the same entry/service. A conflict reads only that ID and leaves existing content unchanged. No automatic overwrites when a source schedule changes.
- Embedded Android WebViews use the external Google event editor; Google OAuth is offered only in a normal browser. A native OAuth integration would require separate Android work.
- Live Google login, grant/revoke and writes require a configured OAuth client and an authorized test account. Fixture tests and a successful build do not verify those paths.

Official references:
- https://developers.google.com/identity/oauth2/web/guides/use-token-model
- https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid
- https://developers.google.com/workspace/calendar/api/auth
- https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
