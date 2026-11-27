# Checklist Duyệt Luồng Demo — InfluencerMatch (7 Workflows)

> **Nguyên tắc chung:**
> - Không nhầm lẫn *OAuth success* với *ownership verified*.
> - Không dùng dữ liệu seed để trình bày như lịch sử hợp tác thật ngoài đời.
> - Không cấp ownership giả, không sửa trực tiếp môi trường production.
> - Phân tách rõ 3 kịch bản **A (Xuyên nghiệp vụ)**, **B (Xác minh kênh OAuth/Manual)**, **C (Four-Memory Engine)**.

---

## 1. Checklist Tổng Duyệt (Preflight trước ngày demo)

### Môi trường & Tài khoản
- [ ] PostgreSQL demo tách biệt hoàn toàn, có phương án reset/backup.
- [ ] Đủ session thử nghiệm cho: `Brand A`, `Brand B`, `Creator C1` (`nguyenvy19042005@gmail.com`), `Data Manager`, `Admin`.
- [ ] Chuẩn bị dữ liệu 3 nhóm Creator trong DB (file seed mẫu: `D:\SEP_BE\src\main\resources\db\seed\demo_creator_nguyenvy_3platforms.sql`):
  - [ ] **Nhóm 1 — Creator Tester (OAuth FB / IG / TikTok Sandbox):** Đã add sẵn role tester trên từng nền tảng; điền đúng ID số trong link FB, tên + numeric `author_id` TikTok, tên + numeric IG Account ID vào DB (`is_stable_id = true`).
  - [ ] **Nhóm 2 — Creator Crawler tự nhiên:** Dữ liệu crawl công khai ngoài mạng để test WF5 + WF1 (Discovery/Recommendation) và guard WF2/WF4 (dùng email test của nhóm khi gửi Invitation).
  - [ ] **Nhóm 3 — Tài khoản Creator demo nhận thông báo:** `nguyenvy19042005@gmail.com` để nhận trực tiếp email OTP / Invitation / Notification.
- [ ] Có *Dataset manifest* phân biệt rõ dữ liệu crawler thật và fixture seed.
- [ ] SMTP & Notification chạy thật (`smtp.gmail.com`), chỉ gửi tới các tài khoản Gmail demo của nhóm để mở xem trực tiếp.
- [ ] Payment gateway chạy thật/sandbox (VNPay Sandbox hoặc PayOS QR số tiền nhỏ), kiểm tra đúng `RETURN_URL` / `CALLBACK_URL` của môi trường đang chạy.
- [ ] **Google Login (`GOOGLE_LOGIN_CLIENT_ID`):** Đổi **App name** trên Google Cloud Console (OAuth consent screen / Branding) từ `Amora` → `InfluencerMatch` để popup đăng nhập hiển thị đúng tên hệ thống.

### Data / WF1 / WF5
- [ ] Đã sửa hoặc khoanh vùng lỗi P0 về `stable` metadata (`stable=false` không bị biến thành `true`).
- [ ] `C1` có snapshot `FRESH`, phân loại `KOL/KOC`, `industry/category` hợp lệ.
- [ ] `C1` có tối thiểu 3 bài đăng (Reels/TikTok tối thiểu 2 bài có views hợp lệ) và đủ nguồn `ER / VR / STAB`.
- [ ] Có `Creator embedding` hợp lệ nếu demo chấm điểm semantic `M3`.
- [ ] `Recommendation run` đạt trạng thái `COMPLETED` và `C1` không bị `excluded`.
- [ ] `Contact readiness` trả về `PASS`.

### WF2 / WF4 / WF3
- [ ] Email invitation gửi vào hộp thư test (không bắn ra creator thật).
- [ ] Ownership của `C1` đã `APPROVED` với bằng chứng khớp đúng tài khoản.
- [ ] OAuth test có đúng App Roles / Tester / Sandbox user và callback hợp lệ.
- [ ] *(Nếu dùng Manual Challenge)* Endpoint tạo mã & luồng Data Manager review đã triển khai và kiểm thử.
- [ ] Deal revision khớp, Creator `accept` và Brand `confirm` thành công.
- [ ] Luồng `Submission → Review → Outcome → Final Review → COMPLETED` chạy thông suốt.

### WF6 / SP7 / Tổng duyệt vận hành
- [ ] Thanh toán sandbox thành công và callback sai chữ ký / sai số tiền bị từ chối.
- [ ] History seed cho Kịch bản C đủ `R/T/K`, tối thiểu 3 hợp tác hợp lệ từ ≥ 2 Brand.
- [ ] `M4` direct/cohort khớp đúng lịch sử của `Brand A`.
- [ ] Không diễn giải `self-reported KPI` là `provider-verified`.
- [ ] Đã chạy thử bằng 2 browser sessions (Brand & Creator); reload/retry không gây trừ quota hay gửi lặp.
- [ ] Có phương án fallback đã test sẵn nếu provider OAuth tạm thời lỗi.

---

## 2. Checklist Chi Tiết Từng Workflow

### WF5 · Thu thập và kiểm định dữ liệu kênh *(Đầu vào dữ liệu)*
**Trạng thái:** Cần sửa P0 | **Kịch bản:** A (đầu vào), B (kiểm tra identity)
- [ ] **Tiền điều kiện:** Nguồn crawl hợp lệ; tách rõ public metrics, OAuth identity và Manual Claim; có `Creator UUID` ổn định.
- [ ] `[AI Crawler]` Chọn hồ sơ có nguồn rõ (`platform`, canonical URL, `username`, `account kind`, snapshot).
- [ ] `[AI Crawler]` Crawl có kiểm soát: đọc public metrics & bài đăng có `collected_at` và provenance.
- [ ] `[AI Crawler]` Bảo toàn metadata qua adapter (`live_fetcher_service` / `live_sync_service` / `mapper`): giữ đúng `isStableExternalId`, `namespace`, `identity source/observed_at`.
- [ ] `[Hệ thống]` Ingest vào PostgreSQL demo (`POST creators/ingest`), kiểm tra duplicate identity và snapshot mới nhất.
- [ ] `[Data Manager]` Kiểm tra phân loại `KOL/KOC`, `niche`, `data confidence`; phân biệt giá trị `missing` và `0`.
- [ ] `[Data Manager]` Xử lý duplicate/refresh: không merge nhầm theo `username`, không đổi `Creator UUID`, có lưu audit.
- [ ] `[Hệ thống]` Tách bạch `FRESH` / `ACTIVE` với quyền sở hữu (không dùng dữ liệu crawler làm bằng chứng OAuth).
- [ ] **Lưu ý chặn:** Không sửa giả followers/views để vượt ngưỡng ingestion (`5.000` Java / `7.000` TikTok crawler).

---

### WF6 · Đăng ký và kích hoạt gói dịch vụ *(Độc lập)*
**Trạng thái:** Cần preflight | **Kịch bản:** Độc lập (có thể demo trước WF1 để chứng minh quota)
- [ ] **Tiền điều kiện:** Có subscription plan, Brand test, xác nhận chọn 1 gateway (VNPay hoặc PayOS) đang chạy được ở sandbox.
- [ ] `[Brand]` Xem bảng giá và chọn gói tại `SubscriptionPage.tsx`.
- [ ] `[Hệ thống]` Tạo Payment Order (`POST /billing/subscribe` hoặc `/billing/subscribe/payos`), lưu order ở trạng thái `PENDING`.
- [ ] `[Brand]` Hoàn tất thanh toán trên trang sandbox (hoặc simulator có gắn nhãn rõ).
- [ ] `[Hệ thống]` Xác minh callback/webhook (`GET /billing/vnpay/ipn` hoặc `POST /billing/payos/webhook`): kiểm tra chữ ký, số tiền, order, callback lặp.
- [ ] `[Brand]` Reload app và kiểm tra quota/entitlement đã cập nhật đúng (chỉ kích hoạt sau khi BE xác minh IPN/webhook).
- [ ] `[Admin]` Test các case lỗi: hủy giao dịch, pending, sai signature, callback lặp, chưa thanh toán.

---

### WF1 · Chuẩn bị chiến dịch và lựa chọn kênh
**Trạng thái:** Có điều kiện | **Kịch bản:** A (Xuyên nghiệp vụ), C (Thuật toán)
- [ ] **Tiền điều kiện:** Brand A có quota; Campaign embedding `READY`; C1 đúng platform (ưu tiên TikTok/IG Reels, tránh Facebook nếu chưa chốt chính sách VR `NOT_SCORABLE`), snapshot `FRESH`.
- [ ] `[Brand]` Tạo Campaign và nhập Brief (`POST /brands/{brandId}/campaigns`).
- [ ] `[Hệ thống]` Xác nhận Campaign embedding `READY` trước khi chấm `M3`.
- [ ] `[Brand]` Mở Discovery và lọc Creator (`GET /campaigns/{id}/discovery`), kiểm tra nguồn metric.
- [ ] `[Brand]` Thêm C1 vào Shortlist (`POST /campaigns/{id}/shortlist`), đảm bảo đúng `Creator ID`.
- [ ] `[Brand]` Chạy AI Recommendation từ Shortlist (`POST /campaigns/{id}/ai-recommendations`), đạt `COMPLETED`.
- [ ] `[Brand]` Xem giải thích điểm & mức bằng chứng (`ER`, `VR`, `STAB`); nhóm *Tham khảo* khi thiếu `M1` vẫn tiếp cận được.
- [ ] `[Brand]` Kiểm tra Contact Readiness (`POST …/shortlist/contact-readiness`) -> `Ready`.

---

### WF2 · Tiếp cận và xác nhận thỏa thuận
**Trạng thái:** Có điều kiện | **Kịch bản:** A
- [ ] **Tiền điều kiện:** C1 đạt Contact Readiness từ run `COMPLETED`; SMTP/outbox demo đã cách ly.
- [ ] `[Brand]` Kiểm tra lại Creator có thể tiếp cận (`POST …/shortlist/contact-readiness`).
- [ ] `[Brand]` Tạo Outreach Relationship (`POST …/shortlist/outreach`) đúng Creator UUID.
- [ ] `[Brand]` Tạo Deal (`POST /campaigns/{id}/deals`), chọn đúng Creator/kênh, không gắn nhầm Master.
- [ ] `[Brand]` Tạo Proposal revision (`POST …/deals/{dealId}/proposals`) có `KPI type` và `target > 0` cho SP7.
- [ ] `[Brand]` Gửi Cooperation Invitation (`POST …/deals/{dealId}/invitations`) tới email sandbox/nhóm.
- [ ] `[Creator]` Mở link demo (`POST /cooperation-invitations/continue`): nếu chưa Claim thì điều hướng sang **WF4**.
- [ ] `[Creator]` Sau khi WF4 `APPROVED`, xem đúng revision và chấp nhận (`POST /creators/portal/cooperation-deals/{id}/accept`).
- [ ] `[Brand]` Brand confirm sau khi Creator accept (`POST …/deals/{dealId}/confirm`) -> Collaboration chuyển `PLANNED`.
- [ ] **Lưu ý:** Giữ tách biệt `CreatorInvitation` và `CooperationInvitation`; không auto-confirm chỉ vì OAuth thành công.

---

### WF4 · Liên kết và xác nhận quyền sở hữu kênh
**Trạng thái:** Chưa hoàn chỉnh | **Kịch bản:** B (OAuth/Manual), là bước chặn trong A nếu chưa Claim
- [ ] **Tiền điều kiện:** Meta App Roles/Tester & TikTok Sandbox test users hợp lệ; không dùng ID OAuth tài khoản B để Claim hồ sơ Creator A.
- [ ] `[Creator]` Mở trang Xác minh kênh (`ChannelVerification.tsx`): hiển thị đủ 4 nút (*Facebook / Instagram / TikTok / Xác minh thủ công*) theo capability API.
- [ ] `[Creator]` *(Test Facebook)* OAuth trong phạm vi App Roles; không auto-Claim khi chỉ có ASID không khớp crawler.
- [ ] `[Creator]` *(Test Instagram)* OAuth Professional account đúng config/scopes; mismatch là trạng thái hợp lệ.
- [ ] `[Creator]` *(Test TikTok)* Login Kit sandbox, `open_id` theo `client_key`; resolver trả `id_type` và `observed_at` mới.
- [ ] `[Creator]` *(Test Manual)* Chọn Xác minh thủ công, đúng Creator UUID/URL hoặc target cố định từ Invitation; nhận mã challenge (khi đã triển khai).
- [ ] `[Creator]` Đặt mã lên bio/giới thiệu công khai và gửi Claim (`PENDING`).
- [ ] `[Data Manager]` Mở đúng URL đối chiếu mã trực tiếp, xét duyệt `APPROVED/REJECTED` có audit, chặn self-review.
- [ ] `[Hệ thống]` Revalidate ownership trước Invitation (`POST /cooperation-invitations/continue`): kiểm tra `CreatorMaster`, target Deal, conflict.

---

### WF3 · Thực hiện, nghiệm thu và hoàn tất hợp tác
**Trạng thái:** Có điều kiện | **Kịch bản:** A
- [ ] **Tiền điều kiện:** Deal đúng revision; Creator đã Claim đúng kênh; Brand đã confirm; có `KPI target > 0`; mở 2 browser sessions riêng (Brand & Creator).
- [ ] `[Creator]` Nhận assignment nếu pending (`POST /creators/portal/collaborations/{id}/accept-assignment`) -> `READY`.
- [ ] `[Brand]` Bắt đầu Campaign/Deal (`POST …/deals/{dealId}/start`) -> `IN_PROGRESS`.
- [ ] `[Creator]` Nộp deliverable từ Creator Portal (`POST /collaborations/{id}/deliverables/{d}/submissions`) để hệ thống ghi server timestamp (`nguồn T`).
- [ ] `[Brand]` Review deliverable (`POST …/deliverables/{d}/review`); nộp revision mới nếu cần.
- [ ] `[Creator]` Ghi nhận publication (`POST …/deliverables/{d}/publication`) đúng URL/ngày đăng.
- [ ] `[Creator]` Gửi kết quả KPI actual (`POST …/outcome` hoặc `…/deliverables/{d}/outcome`) với đúng nguồn quan sát/tự báo cáo.
- [ ] `[Brand]` Ghi nhận finance & nghiệm thu outcome (`POST …/outcome/finance`, `POST …/outcome/accept`).
- [ ] `[Brand]` Đánh giá Final Review (`POST …/review`: rating, brand-fit, phản hồi) -> Collaboration `COMPLETED`, phát sinh completion evidence.

---

### SP7 · Ghi nhận bằng chứng và dùng lịch sử trong chấm điểm
**Trạng thái:** Có điều kiện | **Kịch bản:** A (evidence mới), C (thuật toán có lịch sử)
- [ ] **Tiền điều kiện:** Kịch bản A có 1 collaboration hoàn thành từ WF3; Kịch bản C dùng DB demo riêng có lịch sử trong 24 tháng (ngoài campaign đang chấm).
- [ ] `[Hệ thống]` Xác nhận `kpiType` và `target > 0` được snapshot bất biến lúc Brand confirm.
- [ ] `[Creator]` Xác nhận submission có `source=CREATOR_PORTAL` và timestamp server cho `On-time T`.
- [ ] `[Brand]` Xác nhận outcome accepted (`K`) và final review (`R`) đủ trường.
- [ ] `[Hệ thống]` Kiểm tra sinh `COLLABORATION_COMPLETION` evidence đúng schema, không revoke, trong cửa sổ 24 tháng.
- [ ] `[Brand]` *(Kịch bản A)* Chạy Recommendation sau 1 hợp tác -> `LIMITED_HISTORY / M1 unavailable` (expected result, vào nhóm *Tham khảo*).
- [ ] `[Admin]` *(Kịch bản C - M1)* Chuẩn bị fixture trong DB demo: `A–C1` (3 collaboration) + `B–C1` (1 collaboration), mỗi cái đủ `R/T/K` -> `M1 AVAILABLE` (từ ≥ 2 Brand).
- [ ] `[Admin]` *(Kịch bản C - M4)* Chuẩn bị cho `Brand A`: ≥ 3 review `C1` (nhánh *direct*) và/hoặc ≥ 5 review từ ≥ 3 chủ thể (nhánh *cohort fallback*).
- [ ] `[Brand]` Chạy ranking thật, kiểm tra giải thích điểm (`M1 = 0.5R + 0.3T + 0.2K`, `M4`, `M3`, `CRITIC/TOPSIS`, missing evidence).

---

## 3. Backlog Rủi Ro Cần Chốt Trước Khi Mở Demo (P0 / P1)

- [ ] **[P0 - AI Crawler]** Sửa lỗi mất cờ `stable=false → true` trên live fetch / live sync; viết regression test bảo toàn cờ.
- [ ] **[P0 - AI Crawler]** Sửa lỗi Instagram fallback `pk` sai chủ thể & Facebook ID chưa phân biệt Profile/Page.
- [ ] **[P0 - AI + BE]** Bổ sung `id_type` và `observed_at` vào contract TikTok resolver giữa AI và BE.
- [ ] **[P0 - BE]** Thống nhất predicate `category/niche` giữa Discovery và Recommendation (trả về reason code rõ ràng).
- [ ] **[P0 nếu demo Facebook]** Chốt scoring policy cho Facebook VR (hiện bị `EvidenceValidator` loại -> `NOT_SCORABLE`).
- [ ] **[P1 - BE + FE]** Triển khai Manual code challenge (tận dụng `CreatorClaim` + Data Manager review + audit) nếu demo nút Thủ công có mã.
- [ ] **[P1 - BE / DevOps]** Cấu hình chặn gửi email thật ở SMTP/outbox/notification dispatcher (dùng Mailpit/Mailtrap).
- [ ] **[P1 - BE / Data]** Tạo fixture M1/M4 qua lifecycle API, kiểm tra đủ `R/T/K` và đúng Brand.
