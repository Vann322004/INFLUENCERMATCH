# Shortlist and comparison integration

Contracts checked against local `D:/SEP_BE`: ShortlistController, ShortlistItemDto,
CompareDtos, ShortlistCompareService, ShortlistItemWriter, ContactReadinessResponse,
CooperationOutreachService and campaign/brand controllers. No backend changes.

## Mapped behavior

- Owned campaign selection reads `/brands/me` and all pages of `/brands/{id}/campaigns`.
  It requires VIEW_OWN_BRAND_DATA and VIEW_OWN_CAMPAIGN (or the backend support permission).
  It never creates a placeholder Brand profile.
- GET shortlist reads Spring pagination metadata. Existing array consumers receive all
  backend pages through the compatibility method in creatorService.
- POST shortlist preserves ADDED, ALREADY_EXISTS and RESTORED. PATCH persists priority/note;
  DELETE soft-deletes. Mutations fail visibly without localStorage fallback or alternate-endpoint replay.
- POST compare accepts 2–5 distinct creator IDs, preserves selection order and nullable
  metrics. Zero is displayed as zero. Missing snapshots stay missing.
- POST batch displays per-item outcomes. PATCH batch-status persists READY_TO_CONTACT.
- POST contact-readiness displays backend readiness/reasons. Confirmed POST outreach sends
  only shortlistItemIds to create CRM drafts. This can create relationships and Deals and
  mark shortlist items CONTACTED. It requires MANAGE_OWN_RELATIONSHIP in addition to
  MANAGE_OWN_SHORTLIST. Existing Deals are reused; partial failures remain visible.
  No fees, proposal terms, deliverables or email dispatch are fabricated.
- Authenticated SHORTLIST_EVENT SSE triggers REST refetch after CONNECTED, crawl events
  and disconnect. Reconnect uses exponential backoff; campaign/session changes and unmount
  abort the stream. FE never triggers crawler work: BE schedules it after commit.

## Removed behavior

Removed local shortlist fallback, fabricated metrics/prices/demographics/Match Score,
optimistic success messages, automatic crawler requests and the wrong channel ownership
invitation endpoint previously used as cooperation outreach. Campaign navigation pointers
are the only shortlist-related values retained in browser storage.

## Backend limitations

- Compare currently returns feeAssessmentStatus=UNAVAILABLE and null verification/
  declaredProfile despite the DTO supporting them. No price estimate is shown.
- Compare provides no audience demographics or Match Score. These sections were removed.
- ER/confidence units are not declared in these DTOs; FE retains raw values without
  guessing a percentage conversion.
- SSE has no heartbeat, replay cursor or event ID. REST reconnect/focus refresh provides
  recovery; delivery during a disconnection is not guaranteed by SSE itself.

## Validation

TypeScript and production build checked; lint reports warnings but no errors.
Temporary service/browser fixtures cover action semantics, PATCH followed by reload,
pagination totals, compare 2–5/order/null/zero, API failures without replay, partial
batch results, draft-only outreach body, responsive widths 375/768/1440, SSE refetch,
reconnect and cleanup. Existing data-quality tests also run.

These fixtures do not prove real database persistence or server-side RBAC.
The available local runtime at localhost:8080 returned HTTP 404 for the shortlist path
during an unauthenticated read-only probe. A current running BE and authenticated Brand
session are still required to verify DB persistence, ownership/RBAC, real crawler events
and real outreach end to end. Do not treat source/fixture checks as live API acceptance.
