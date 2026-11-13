# AD-02: FE mapping and backend source review

Reviewed directly from `D:\SEP_BE`, including the working-tree changes to AuditLogController and the new AuditLogQueryService/AuditLogResponseDto. The deployed API is not the contract baseline for this review. No BE, database, migration or permission changes were made.

## FE mapping

- `GET /admin/audit-logs`: actorId, action, entityType, entityId, from, to, keyword, page, size. Page is zero-based; size supports 10/20/50/100. FE displays server totalElements and resets to page 0 after filters/size changes. Filters apply once on submit; keyword is limited to 200 characters. No client-side filtering of one page is presented as global search.
- `AuditLogResponseDto`: id, actorId/userId, action, entityType, entityId, timestamp/createdAt, ipAddress, oldValue, newValue. The mapper prefers actorId. Compatibility aliases remain for existing Dashboard/account consumers, with no invented names/email. description/outcome/profile are absent from the new DTO and not displayed as returned data.
- Query service orders by createdAt DESC, id DESC. Keyword searches action/entityType/stored description/IP with escaped SQL LIKE; exact UUID also matches id/userId/entityId. Keyword search can match a stored description that is intentionally not returned in the safe DTO.
- `GET /admin/audit-logs/export`: same applied filters, no page/size; FE requests limit=10000, receives text/csv as Blob and initiates a real browser download. No success toast or fake export. BE caps limit, escapes CSV/formula cells, and exports only id/actorId/action/entityType/entityId/timestamp. Export omits email/IP/description/payload; UI explains cap and scope.
- `GET /admin/system-status`: maps complete SystemStatusResponseDto, including usedMemoryBytes/maxMemoryBytes, maximumPoolSize and server Instant timestamp. Decimal MB uses bytes / 1,000,000; it is not mislabeled MiB. Pool null and nullable counts remain unknown; zero is a valid measurement. Database responseTimeMs=-1 means no measured ping time.
- API connection is reported separately from backend overallStatus. Current SystemMonitoringService derives HEALTHY/UNHEALTHY from DB connectivity, not job queues or the whole deployment. A failed request leaves health unknown. No fabricated uptime, availability, failed jobs or error-rate indicators are shown.
- Independent Loading/Error/Retry per resource, Empty for a real empty audit page, exact timestamp text for timezone-less LocalDateTime, UUID validation, responsive table scroll and drawer. UI only exposes requests with existing VIEW_AUDIT_LOG / VIEW_SYSTEM_STATUS permissions; no permission policy changes.

## Sensitive-action coverage: 15 review groups

`doc.txt` AD-02 describes categories but does not enumerate 15 canonical action IDs. The following is an explicit review checklist of 15 sensitive operation groups found in source, not a claim that a supplied canonical 15-event list has been fully satisfied.

| # | Operation group | Source / audit observed | Assessment |
| --- | --- | --- | --- |
| 1 | Password login success/failure | AuthServiceImpl.login, AuthSessionIssuer | No AuditService call found in these paths. Authentication/session issuance is not a central audit event. |
| 2 | Logout/session revocation | AuthServiceImpl.logout, AuthSessionStore | No central logout audit found. |
| 3 | Change password | ChangePasswordService.change | Password and session invalidation are transactional; no central change-password audit found. Do not log credentials. |
| 4 | Account status | AdminUserService.changeStatus | CHANGE_USER_STATUS via recordAs; before/after status and reason. No-op returns without mutation/audit. |
| 5 | Assign role | AdminUserService.changeRole | ASSIGN_USER_ROLE via recordAs; before/after role and reason. |
| 6 | Role permission changes | RolePermissionService | UPDATE_ROLE_PERMISSIONS. Version and changes persist with the audit. New safe DTO may suppress nested permission lists, so UI cannot reconstruct full diffs. |
| 7 | Recommendation configuration change | AdminRecommendationConfigController | GET-only current configuration; no supported mutation to audit. Do not invent an update event or edit UI. |
| 8 | Creator channel ownership/OAuth | CreatorAccountLinkService; MetaOwnershipService; TikTokOwnershipService | Successful ownership/verification events use creator_identity_audit, not general audit_log. Conflict rejections use CreatorConflictAudit. Partial central visibility, not absence of all logging. |
| 9 | Creator claim review/revoke | CreatorClaimService | SUBMIT_CREATOR_CLAIM, REVIEW_CREATOR_CLAIM, REJECT_CREATOR_CLAIM, REVOKE_CREATOR_CLAIM. |
| 10 | Classification review | DataQualityService | APPROVE_DATA_QUALITY / REJECT_DATA_QUALITY using QualityItem before/after in a write transaction. |
| 11 | Create plan | PlanService.createPlan | CREATE_PLAN with saved plan ID and response snapshot. |
| 12 | Update plan | PlanService.updatePlan | UPDATE_PLAN with before/after. |
| 13 | Deactivate plan | PlanService.deactivatePlan | DEACTIVATE_PLAN with before/after. |
| 14 | Create/cancel subscription | SubscriptionService | CREATE_SUBSCRIPTION / CANCEL_SUBSCRIPTION. |
| 15 | Payment refund and settlement | AdminPaymentService.refundPayment / PaymentSettlementService.apply | REFUND_PAYMENT exists; settlement PAID/FAILED changes have no AuditService call in the reviewed settlement service. Refund implementation changes DB status; this alone does not prove bank/gateway payout. |

Additional observed events: CreatorRegistrationInvitationService INVITE_CREATOR, GoogleBrandLoginService LINK_GOOGLE_IDENTITY, CreatorPortalProfiles UPDATE_CREATOR_PROFILE, RelationshipServiceImpl RELATIONSHIP_CREATED/STAGE_CHANGED/DETAILS_UPDATED, CampaignHistoryService DUPLICATE_CAMPAIGN_BRIEF, DealService/CollaborationExecution cooperation events. Regular channel invitation success is not the same operation as Creator registration invitation success; do not merge their coverage claims.

## Transactions and sensitive data

- AuditService.record/recordAs require an active transaction via MANDATORY and store through the same audit repository. Principal account/plan/subscription/refund/claim/classification mutations have write transactions. An audit persistence failure should roll back the mutation; this is a source-level assessment, not a newly executed BE rollback test.
- CreatorClaimService and invitation flows explicitly use noRollbackFor CreatorOwnershipConflictException so rejection evidence can commit; the helper itself is not an independent durable transaction. Meta and TikTok ownership have their own transaction boundaries and identity audit repository. Do not infer that every arbitrary thrown exception leaves a durable failure event.
- AuditService stores generic old/new objects and free-text reason without a shared write-time allowlist/redactor. The NEW response DTO safely returns only top-level scalar status/role/enabled/permission/version/revision/profileRevision, excluding description and other payload fields. Export is further restricted. This protects API output, but does not sanitize historical/raw stored JSON or free-text reason.
- Existing examples are intentionally limited: account status/role maps contain no passwords; profile audit records changedFields/sharing/contact visibility rather than private contact values; registration invitation audit stores email and expiry. Assess data minimization and retention for stored email/reasons. No claim is made that actual passwords/tokens were found in persisted rows.
- FE additionally masks obvious secret-named keys when rendering payloads, as defense against unexpected responses. This is display-only, not a substitute for BE storage sanitization. React renders strings as text; no payload HTML is executed.
- Current audit timestamps are LocalDateTime (no offset), and IP comes from servlet getRemoteAddr. FE does not guess timezone or claim proxy IP is the end-user origin.

## Backend gaps and priorities

| Priority | Area | Current state / necessary action |
| --- | --- | --- |
| P0 | Financial audit semantics | Add settlement event coverage at the verified payment transaction boundary with idempotent transaction references. Define manual refund vs actual gateway-confirmed refund; do not label the DB event as a confirmed payout. No new FE endpoint is required just to record these events. |
| P0 | Stored sensitive audit data | Introduce write-time payload allowlist/redaction and reason minimization; assess historical data/retention. New response DTO/export already restrict output. No evidence here of actual persisted token leakage. |
| P1 | Security audit completeness | Record login success/failure, logout/revocation and credential change using appropriate durable failure logging; sanitized actor/correlation metadata only. These can feed the existing audit list API. |
| P1 | Safe Audit DTO | Implemented locally. Remaining optional enhancements: explicit outcome, correlation ID, event source and offset-aware timestamp. Do not infer outcome from action strings; define semantics before adding fields. |
| P1 | Keyword search | Implemented locally; FE mapped. No duplicate search API proposed. |
| P1 | CSV export | Implemented locally; FE mapped. Contract returns capped metadata, not all filtered rows. If full large exports later become a real requirement, add cursor/async export with explicit completion metadata. |
| P1 | Identity audit visibility | Decide whether central audit must include creator_identity_audit and how to expose source/correlation; avoid duplicate events. Merge/split/ownership transfer is outside the current MVP (resolveConflict rejects it). |
| P2 | Actor profile | New DTO intentionally exposes UUID only. No profile endpoint needed for current UI. A minimal authorized actor projection is optional only if a concrete identity-display requirement is approved; no bulk user lookup just to fabricate a name. |
| P2 | Job monitoring | System-status has no worker/job metrics. A separate crawler operational API exists in FE, but is not a platform-wide job monitor. Add a job endpoint only when backed by a durable job store with defined status/retry/error semantics. |
| P2 | Error rates | No rate/window/request denominator in current DTO. Add aggregated telemetry only when deployment instrumentation exists, defining time window, denominator and source. No guessed failed/total percentages. |

## Validation scope

FE service/browser tests use fixtures shaped from the latest local DTO, including nullable safe metadata, exact filters, keyword, real CSV Blob download, MB conversion, absent Hikari data, failed DB ping, permissions, Retry and mobile overflow. These are FE checks, not authenticated BE integration. No local Spring listener was found on port 8080 at review time; the BE was not started or modified. Previously observed deployed OpenAPI/401 results are not used as proof of the unmerged local changes. Recheck authenticated list/export/system responses against a running latest BE after it is available.
