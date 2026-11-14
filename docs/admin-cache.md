# Admin memory cache

| Data | TTL |
| --- | --- |
| Dashboard account total, campaign/subscription summary, growth per month-range, revenue by plan | 60 seconds |
| Creator list shared by Dashboard count and Admin catalog | 60 seconds |
| Paginated plan catalog and Dashboard plan total | 5 minutes |
| RBAC matrix | 5 minutes |
| Payment summary on the plan management page only | 30 seconds |

The account directory/detail, transaction screens/reports, Audit Logs/export, System Monitoring, notifications/SSE, claim/review queues and operational jobs remain live. The Dashboard caches only the numeric account total, not account records from the no-store user endpoint.

Cache exists only in RAM in the current tab. F5/reopening creates a new cache. Keys include session ID, account ID, role, sorted permissions, authVersion and status, never tokens. Non-Admin roles bypass this cache; Data Manager retains its existing independent cache. Logout and account/authorization changes clear both caches; rotating a token for the same identity preserves cached values.

Only successful validated results are stored. Real zero and empty lists remain valid. Failures/malformed responses are not converted into successful zeros; concurrent identical queries share an in-flight promise. Consumers receive cloned values. Clearing an entry while it is loading prevents the old response from repopulating it.

Successful account/permission/plan/payment/subscription/campaign/Creator/crawler mutations invalidate related tags through the API interceptor or crawler transport wrapper. Examples: a refund clears billing summaries; a plan update clears catalog and billing cache; role changes clear RBAC/user summaries; Creator changes clear the Creator list. Notification read actions do not evict unrelated Admin data. External changes made in another tab/process become visible after TTL or manual refresh; this is not a cross-tab realtime invalidation protocol.

Dashboard and catalog/RBAC pages initialize from cached values to avoid loading flashes. Derived Creator/plan counts share the source cache TTL instead of extending it with a second cache. Pagination/range keys are independent. Existing Refresh/Retry actions bypass the corresponding cache. Plan payment statistics are kept separate from live transaction-page requests.

RBAC's former fabricated fallback matrix was removed so an empty response/error cannot become pretend permissions. Payment-stat parsing validates real numeric values before caching. The plan page distinguishes unavailable statistics from a valid zero.

Validation uses temporary VM/browser QA scripts (removed afterward): concurrent deduplication, TTL, clone isolation, zero/empty, failure retry, token rotation, account/permission isolation, stale response rejection, domain invalidation, other-role bypass, actual SPA navigation request counts, live Audit refetch, catalog/RBAC refresh, plan mutation invalidation and F5. Existing dataQualityFlow tests also cover crawler behavior after the invalidator hook. Browser API fixtures test FE behavior; they do not establish authenticated live backend integration.
