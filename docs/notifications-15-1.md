# Notification flow 15.1

The FE contract was checked directly against NotificationController, NotificationDto, NotificationService and RealtimeNotificationService in `D:\SEP_BE`. No BE/business/permission changes were made.

- GET `/notifications?page=0&size=20`: full pagination metadata (items/page/size/totalElements/totalPages), with actual backend notification fields. Both Jackson `read` and `isRead` boolean names are understood. Missing/malformed responses reject; no mock inbox fallback.
- GET `/notifications/unread-count`: exact unreadCount. Null/error remains unknown, never zero or a count inferred from one page.
- PATCH `/notifications/{id}/read`: update only after confirming the returned notification belongs to the current account and is read. PATCH `/notifications/read-all`: validate markedCount and resync REST; do not assume zero because an SSE event could arrive concurrently. No success toast on mutation errors.
- GET `/notifications/stream`: authenticated fetch stream using bearer header and the same base URL as apiClient. CONNECTED establishes the stream; NOTIFICATION provides the real DTO. Keepalive comments are ignored. Streaming UTF-8, split frames, multiline data and LF/CRLF are handled.

One external store is shared by AppHeader (Brand), CreatorHeader and AdminHeader (Admin/Data Manager). Multiple mounted bells/panels share one stream per authenticated tab session. Account/role/permissions/auth-version changes clear state and reject late responses from the old session; token rotation restarts the stream without replaying old toasts. Logout immediately aborts REST/SSE and clears notification state/toasts. Final consumer unmount cleans listeners and timers. API response ownership is checked on REST and SSE.

Disconnects reconnect with exponential delay from 1s up to 30s plus small jitter. Backoff resets after a stable connection, not every short-lived handshake. Every CONNECTED, including reconnect, resyncs REST for notifications missed during downtime. Expired-stream 401 uses the existing Axios REST refresh flow; 403 pauses automatic streaming until retry/authorization change. The BE does not provide SSE event IDs or Last-Event-ID replay, so this is REST catch-up rather than guaranteed event replay. Notification IDs deduplicate list inserts and live toasts.

The bell opens a compact popup with a bounded scrollable list, not a side drawer. On narrow screens the popup is pinned within viewport margins. Loading, Empty, Error/Retry, unknown count, realtime connection state and mutation failures are separate. Pagination uses the server total. Existing Brand related-entity destinations are preserved; other roles are not sent to Brand pages. Email Preferences are hidden because there is no supported preference API.

Removed INITIAL_NOTIFICATIONS/INITIAL_EMAIL_ALERTS, Header-local fake inboxes/counts, fake mark-read/save toasts, sample Creator identities/avatars and unverified level/verification badges in the touched Creator shell.

Verification: production build and lint for the changed notification code; temporary VM tests for shared streams, deduplication, mutation failures/successes, null counts, backoff, role/account isolation, token rotation, logout/unmount and SSE framing. Browser tests use isolated QA fixtures for all four roles, actual PATCH wiring, popup widths 320/375/768/1440, SSE duplicate delivery, reconnect REST catch-up, reload, error/retry, empty and cleanup. The temporary QA script is removed after running; no tests folder or screenshot artifacts are restored.

Live local probe on 2026-11-13: `http://127.0.0.1:8080/api/v1/notifications`, `/unread-count`, `/stream` returned 404 HTML. This does not verify the latest source is running at that address. Authenticated runtime integration remains to be checked against a running latest backend; fixture tests do not establish it. No real notification was marked read during the live probe.
