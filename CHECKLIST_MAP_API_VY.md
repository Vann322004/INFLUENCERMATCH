# CHECKLIST TRIỂN KHAI MAP API & CHỈNH SỬA UI — VY
**Phạm vi:** Flow 1 (Campaign Setup & Brief), Flow 2 (Creator Discovery), Flow 3 (AI Recommendation & Feedback) và các chức năng Hỗ trợ Quản lý dữ liệu (Data Sources, Crawler Jobs, Data Quality).  
**Tài liệu tham chiếu:** [Swagger UI InfluencerMatch](http://221.121.3.226:8080/api/v1/swagger-ui/index.html#/)  
**Base API URL:** `http://221.121.3.226:8080/api/v1`  
**Ngày cập nhật:** 26/10/2026  

---

## 📊 BẢNG MA TRẬN MAP API TỔNG HỢP (SWAGGER MATRIX)

| STT | Chức năng chính | Method | Endpoint Swagger | Quyền (Permission) | Tệp Frontend phụ trách | Trạng thái tích hợp |
| :---: | :--- | :---: | :--- | :--- | :--- | :---: |
| **1** | Campaign Management | `GET`<br>`POST`<br>`PUT`<br>`PATCH` | `/brands/{brandId}/campaigns`<br>`/campaigns/{id}`<br>`/campaigns/{id}/status`<br>`/campaigns/{id}/archive` | `VIEW_OWN_CAMPAIGN`<br>`CREATE_CAMPAIGN`<br>`UPDATE_CAMPAIGN`<br>`CHANGE_CAMPAIGN_STATUS` | `src/services/api/campaignService.ts`<br>`src/pages/campaign/CreateCampaignPage.tsx`<br>`src/pages/campaign/CampaignListPage.tsx` | 🟢 **Hoàn thành** |
| **2** | Campaign Brief / AI Brief | `POST` | `/ai/campaign-autofill` | `CREATE_CAMPAIGN` | `src/services/api/campaignService.ts`<br>`src/pages/campaign/CreateCampaignPage.tsx`<br>`src/components/ai/AiBriefAssistant.tsx` | 🟢 **Hoàn thành** |
| **3** | Creator Discovery | `GET`<br>`GET`<br>`GET`<br>`POST` | `/taxonomies/niches`<br>`/creators`<br>`/campaigns/{campaignId}/discovery`<br>`/creators/{id}`<br>`/campaigns/{campaignId}/shortlist` | `SEARCH_CREATOR`<br>`VIEW_CREATOR_PROFILE`<br>`MANAGE_OWN_SHORTLIST` | `src/services/api/creatorService.ts`<br>`src/pages/creator/CreatorDiscoveryPage.tsx`<br>`src/pages/creator/CreatorDetailPage.tsx` | 🟢 **Hoàn thành** |
| **4** | AI Recommendation (Four-Memory) | `POST` | `/campaigns/{campaignId}/ai-recommendations` | `RUN_RECOMMENDATION` | `src/services/api/aiRecommendationService.ts`<br>`src/components/campaign/AiRecommendationTab.tsx`<br>`src/pages/campaign/CampaignManagementPage.tsx` | 🟢 **Hoàn thành** |
| **5** | AI Run History | `GET` | `/campaigns/{campaignId}/ai-recommendations/runs` | `VIEW_OWN_RECOMMENDATION` | `src/services/api/aiRecommendationService.ts`<br>`src/components/campaign/AiRecommendationTab.tsx`<br>`src/pages/campaign/CampaignManagementPage.tsx` | 🟢 **Hoàn thành** |
| **6** | AI Feedback (Context Evolution) | `POST` | `/campaigns/{campaignId}/ai-recommendations/feedback` | `RUN_RECOMMENDATION` | `src/services/api/aiRecommendationService.ts`<br>`src/components/campaign/AiRecommendationTab.tsx` | 🟢 **Hoàn thành** |
| **7** | Data Sources Management | `GET`<br>`POST` | `/creators/ingest`<br>Quản lý connector & trạng thái nguồn | `DATA_MANAGER` / `ADMIN` | `src/pages/admin/datasources/DataSourcesPage.tsx` | 🟡 Đã có giao diện, cần kiểm tra phân quyền & cấu hình Ingest |
| **8** | Crawler Jobs Monitor | `GET`<br>`POST` | Worker/Crawler Jobs telemetry & cào dữ liệu | `DATA_MANAGER` / `ADMIN` | `src/pages/admin/jobs/CollectionJobsPage.tsx` | 🟢 Đã có giao diện, cần nối telemetry real-time |
| **9** | Data Quality Review | `GET`<br>`PUT` | `/admin/data-quality/pending`<br>`/admin/data-quality/{id}/approve` | `REVIEW_CREATOR_CLASSIFICATION` | `src/services/api/adminService.ts`<br>`src/pages/admin/quality/DataQualityPage.tsx` *(Mới)* | 🔴 **Chưa có trang UI**, service đã có sẵn hàm |

---

## 📌 CHECKLIST CHI TIẾT THEO TỪNG CHỨC NĂNG

---

### 1. Campaign Management (Quản lý Chiến dịch)
> **Luồng nghiệp vụ UI:** Brand đăng nhập → vào Campaign Management → tạo Campaign → nhập mục tiêu, ngân sách, nền tảng, ngành hàng và yêu cầu Creator → lưu bản nháp hoặc tiếp tục chạy đề xuất.

#### A. Map API Backend
- [x] **Lấy ID thương hiệu hiện tại:** Gọi `GET /brands/me` để lấy `brandId`.
- [x] **Lấy danh sách chiến dịch:** `GET /brands/{brandId}/campaigns?page=0&size=20` (Hàm `campaignService.getCampaigns()`).
- [x] **Tạo chiến dịch mới:** `POST /brands/{brandId}/campaigns`
  - Request DTO `CampaignRequest`:
    ```json
    {
      "name": "Chiến dịch Mùa Hè 2026",
      "productService": "Kem chống nắng kiềm dầu",
      "objective": "CONVERSION",
      "budgetMin": 15000000,
      "budgetMax": 30000000,
      "platforms": ["TIKTOK", "INSTAGRAM"],
      "niches": ["Làm đẹp & Mỹ phẩm", "Chăm sóc da"],
      "targetAudiences": ["18-24", "25-34"],
      "locations": ["Thành phố Hồ Chí Minh", "Thành phố Hà Nội"],
      "startDate": "2026-11-01",
      "endDate": "2026-11-30"
    }
    ```
- [x] **Cập nhật chiến dịch Draft:** `PUT /campaigns/{id}`
- [x] **Cập nhật trạng thái chiến dịch:** `PATCH /campaigns/{id}/status`
  - Workflow backend kiểm soát: `DRAFT` ➔ `READY_FOR_DISCOVERY` ➔ `ACTIVE` ➔ `COMPLETED`.
- [x] **Lưu trữ chiến dịch:** `PATCH /campaigns/{id}/archive`

#### B. Chỉnh sửa UI ([CreateCampaignPage.tsx](file:///d:/INFLUENCERMATCH/src/pages/campaign/CreateCampaignPage.tsx) & [CampaignListPage.tsx](file:///d:/INFLUENCERMATCH/src/pages/campaign/CampaignListPage.tsx))
- [x] Nút **"Lưu bản nháp" (Save Draft):**
  - Gửi payload lên API với `status: 'DRAFT'`.
  - Hiển thị Toast thông báo thành công và redirect về `/campaign-management`.
- [x] Nút **"Tiếp tục chạy đề xuất":**
  - Sau khi `POST /brands/{brandId}/campaigns` thành công (có `campaign.id`), gọi ngay `PATCH /campaigns/{id}/status` với `{ status: 'READY_FOR_DISCOVERY' }`.
  - Redirect trực tiếp sang màn hình AI Recommendation: `/creators?campaignId=${campaign.id}&autoRun=true`.
- [x] Chuẩn hóa Enum & Kiểu dữ liệu Form:
  - Objective: `awareness` ➔ `AWARENESS`, `sales` ➔ `CONVERSION`, `engagement` ➔ `ENGAGEMENT`.
  - Platform: `tiktok` ➔ `TIKTOK`, `instagram` ➔ `INSTAGRAM`, `facebook` ➔ `FACEBOOK`. (Phù hợp nghiệp vụ đồ án: TikTok, Instagram, Facebook - Không dùng YouTube).
  - Định dạng tiền tệ VNĐ hiển thị rõ ràng trên ô InputNumber.
- [x] Bổ sung form validation hiển thị lỗi rõ ràng dưới từng field bắt buộc.

---

### 2. Campaign Brief / AI Brief (Trợ lý Tạo Brief Chiến dịch bằng AI)
> **Luồng nghiệp vụ UI:** Brand nhập mô tả chiến dịch → AI hỗ trợ phân tích và điền thông tin Brief nếu được hỗ trợ → Brand kiểm tra, chỉnh sửa và xác nhận.

#### A. Map API Backend
- [x] **Endpoint AI Autofill:** `POST /ai/campaign-autofill`
  - Permission: `CREATE_CAMPAIGN`
  - Request DTO:
    ```json
    {
      "prompt": "Quảng bá dòng kem dưỡng phục hồi da dành cho giới trẻ 18-24 tuổi tại Hà Nội và TP.HCM, ngân sách tầm 25 triệu trên TikTok và Instagram"
    }
    ```
  - Response DTO `ApiResponseCampaignAutofillResponse`:
    ```json
    {
      "data": {
        "name": "Chiến dịch Kem Dưỡng Phục Hồi Da Gen-Z",
        "productService": "Kem dưỡng phục hồi da",
        "objective": "CONVERSION",
        "budgetMin": 20000000,
        "budgetMax": 25000000,
        "platforms": ["TIKTOK", "INSTAGRAM"],
        "niches": ["Làm đẹp & Mỹ phẩm", "Chăm sóc da"],
        "targetAudiences": ["18-24"],
        "locations": ["Thành phố Hà Nội", "Thành phố Hồ Chí Minh"],
        "aiExplanation": "Hệ thống đã phân tích mục tiêu và đề xuất chiến lược tối ưu..."
      }
    }
    ```

#### B. Chỉnh sửa UI ([CreateCampaignPage.tsx](file:///d:/INFLUENCERMATCH/src/pages/campaign/CreateCampaignPage.tsx) & [AiBriefAssistant.tsx](file:///d:/INFLUENCERMATCH/src/components/ai/AiBriefAssistant.tsx))
- [x] Khung nhập văn bản Prompt trên trang tạo Campaign:
  - Nhập prompt ➔ Click nút **"Phân tích bằng AI"** ➔ hiển thị loading `Spin`.
  - Đổ toàn bộ giá trị trả về vào form các Step (Step 1: Tên, Sản phẩm, Mục tiêu; Step 2: Niche, Nền tảng, Tệp tuổi; Step 3: Ngân sách).
  - Hiển thị hộp Callout/Alert nổi bật chứa `aiExplanation` để Brand đọc lý do phân tích.
  - Cho phép Brand tự do kiểm tra và sửa đổi từng ô trước khi gửi đi.
- [x] Tại [AiBriefAssistant.tsx](file:///d:/INFLUENCERMATCH/src/components/ai/AiBriefAssistant.tsx) ở màn hình Creator Discovery:
  - Thay thế mock `setTimeout` bằng việc gọi thực tế `campaignService.autofillCampaign()`.

---

### 3. Creator Discovery (Khám phá KOC/KOL)
> **Luồng nghiệp vụ UI:** Brand vào Creator Discovery → nhập từ khóa, chọn nền tảng và bộ lọc → xem danh sách KOC/KOL → mở hồ sơ chi tiết → đánh giá chỉ số và mức độ phù hợp.

#### A. Map API Backend
- [x] **Lấy danh mục ngách chuẩn:** `GET /taxonomies/niches`
- [x] **Discovery Pipeline theo chiến dịch (4-Stage Hybrid Pipeline):**
  - Swagger Tag: `Creator Discovery` | OperationId: `discoverCreators`
  - `GET /campaigns/{campaignId}/discovery`
  - Query params: `keyword`, `niche`, `minFollowers`, `maxFollowers`, `page`, `size`.
- [x] **Semantic Vector Search:**
  - `GET /creators/search/semantic?q={keyword}&limit=20` (Model BKAI 768-dim pgvector).
- [x] **Chi tiết KOC:** `GET /creators/{id}` (Lấy metrics, rateCard, recentPosts, linkedAccounts).
- [x] **Thêm vào Shortlist:** `POST /campaigns/{campaignId}/shortlist` với `{ "creatorId": "..." }`.

#### B. Chỉnh sửa UI ([CreatorDiscoveryPage.tsx](file:///d:/INFLUENCERMATCH/src/pages/creator/CreatorDiscoveryPage.tsx) & [CreatorDetailPage.tsx](file:///d:/INFLUENCERMATCH/src/pages/creator/CreatorDetailPage.tsx))
- [x] Tích hợp lấy ngách động từ `/taxonomies/niches` cho Dropdown Niche thay vì danh sách tĩnh.
- [x] Thêm nút gạt chuyển chế độ: **"Tìm kiếm thường"** vs **"Tìm kiếm AI ngữ nghĩa (Semantic)"**.
- [x] Chuẩn hóa `engagementRate`: Xử lý giá trị float (ví dụ `0.0489` hiển thị `4.89%`).
- [x] Click vào Creator Card ➔ chuyển hướng sang `/creators/${creator.id}`.
- [x] Tại CreatorDetailPage:
  - Hiển thị đầy đủ số liệu: Followers, Engagement Rate, Avg Views, Avg Likes, Bảng giá tham khảo (`rateCard`), Bài đăng gần đây (`recentPosts`).
  - Nút **"Lưu vào Shortlist"** mở Modal chọn Campaign và gọi `POST /campaigns/{campaignId}/shortlist`.

---

### 4. AI Recommendation (Đề xuất Creator Thông minh Four-Memory)
> **Luồng nghiệp vụ UI:** Brand chọn Campaign → chạy đề xuất AI → xem danh sách Creator được xếp hạng → kiểm tra Match Score, thông tin và lý do đề xuất → chọn Creator phù hợp.

#### A. Map API Backend
- [x] **Tạo Service mới hoặc bổ sung vào `campaignService.ts`:**
  - `POST /campaigns/{campaignId}/ai-recommendations?limit=10`
  - Quyền yêu cầu: `hasAuthority('RUN_RECOMMENDATION')`
  - Response DTO `ApiResponseRecommendationResponseDto`:
    ```typescript
    export interface ScoreBreakdownDto {
      m1Score: number;            // Khớp hồ sơ & ngành hàng
      m2Score: number;            // Hiệu suất & tương tác thực tế
      m4Score: number;            // Khớp lịch sử feedback & context
      followerScore: number;
      engagementScore: number;
      semanticMatchScore: number;
      nicheMatchScore: number;
      finalScore: number;         // Match Score tổng hợp (0.0 -> 1.0)
    }

    export interface ReasoningCardDto {
      summary: string;            // Đoạn tóm tắt lý do
      reasons: string[];          // Danh sách gạch đầu dòng lý do
      explanationAvailable: boolean;
    }

    export interface CreatorRecommendationItemDto {
      creatorId: string;
      masterId: string;
      platform: string;
      displayName: string;
      userName: string;
      avatarUrl: string;
      followers: number;
      avgViews: number;
      avgLikes: number;
      engagementRate: number;
      niche: string;
      creatorType: string;
      finalScore: number;
      scoreBreakdown: ScoreBreakdownDto;
      reasoning: ReasoningCardDto;
      inShortlist: boolean;
    }
    ```

#### B. Chỉnh sửa UI
- [x] Xây dựng Tab / Component **"AI Recommendation"** tại [CampaignManagementPage.tsx](file:///d:/INFLUENCERMATCH/src/pages/campaign/CampaignManagementPage.tsx):
  - [x] Nút hành động nổi bật: **"⚡ Chạy đề xuất AI Four-Memory"**.
  - [x] Loading trạng thái sinh động thể hiện tiến trình 4 bộ nhớ: *"Đang phân tích Brand Profile (M1), Đánh giá Performance (M2), Đối chiếu Lịch sử (M4)..."*
  - [x] Danh sách KOC xếp hạng tự động giảm dần theo `finalScore`.
  - [x] **Huy hiệu Match Score:** Hiển thị Badge % (ví dụ: `92% Match Score`).
  - [x] **Thẻ lý do đề xuất (Reasoning Card):**
    - Đoạn tóm tắt `reasoning.summary`.
    - Các bullet điểm mạnh từ `reasoning.reasons`.
  - [x] **Popover / Tooltip Score Breakdown:** Khi hover vào điểm số, hiển thị chi tiết điểm: Điểm hồ sơ, Điểm tương tác, Điểm ngữ cảnh.
  - [x] Nút **"Chọn Creator này" / "Thêm vào Shortlist"**: Gọi `POST /campaigns/{campaignId}/shortlist`.

---

### 5. AI Run History (Lịch sử các Lần chạy Đề xuất AI)
> **Luồng nghiệp vụ UI:** Brand mở lịch sử AI → xem các lần chạy đề xuất trước đó → kiểm tra kết quả từng lần chạy.

#### A. Map API Backend
- [x] **Endpoint lấy lịch sử đề xuất:**
  - `GET /campaigns/{campaignId}/ai-recommendations/runs`
  - Quyền yêu cầu: `hasAuthority('VIEW_OWN_RECOMMENDATION')`
  - Response DTO `ApiResponseListRecommendationRun`:
    ```typescript
    export interface RecommendationRun {
      id: string;               // UUID lần chạy
      contextVersion: number;   // Phiên bản bộ nhớ ngữ cảnh (v1, v2, v3...)
      status: string;           // SUCCESS, RUNNING, FAILED
      candidatesCount: number;  // Số lượng KOC được gợi ý
      queryBrief: string;       // Tóm tắt brief tại thời điểm chạy
      createdAt: string;        // Thời điểm ISO
    }
    ```

#### B. Chỉnh sửa UI
- [x] Thêm Tab hoặc Drawer **"Lịch sử đề xuất AI"** tại [CampaignManagementPage.tsx](file:///d:/INFLUENCERMATCH/src/pages/campaign/CampaignManagementPage.tsx) hoặc [CampaignHistoryPage.tsx](file:///d:/INFLUENCERMATCH/src/pages/history/CampaignHistoryPage.tsx):
  - [x] Bảng hiển thị danh sách các phiên chạy:
    - Cột 1: Mã phiên & Phiên bản ngữ cảnh (`v{contextVersion}`).
    - Cột 2: Thời gian thực hiện (định dạng `dd/MM/yyyy HH:mm`).
    - Cột 3: Tóm tắt yêu cầu brief (`queryBrief`).
    - Cột 4: Số lượng Creator tìm thấy (`candidatesCount`).
    - Cột 5: Trạng thái (Tag xanh `THÀNH CÔNG` hoặc vàng `ĐANG XỬ LÝ`).
    - Cột 6: Hành động: Nút **"Xem kết quả"** để xem lại danh sách KOC được đề xuất tại thời điểm đó.
  - [x] Xử lý giao diện trống (Empty State) khi chưa có lần chạy nào.

---

### 6. AI Feedback (Phản hồi Đánh giá & Tiến hóa Ngữ cảnh)
> **Luồng nghiệp vụ UI:** Brand xem kết quả đề xuất → gửi phản hồi về mức độ phù hợp hoặc chất lượng đề xuất theo các lựa chọn UI/API hỗ trợ.

#### A. Map API Backend
- [x] **Endpoint gửi Feedback:**
  - `POST /campaigns/{campaignId}/ai-recommendations/feedback`
  - Quyền yêu cầu: `hasAuthority('RUN_RECOMMENDATION')`
  - Request DTO `RecommendationFeedbackRequest`:
    ```json
    {
      "creatorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "action": "REJECT",
      "reasonCode": "PRICE_TOO_HIGH",
      "reasonNote": "Báo giá vượt mức chi trả của đợt này"
    }
    ```
  - Response DTO `ApiResponseRecommendationFeedbackResponse`:
    ```json
    {
      "campaignId": "...",
      "creatorId": "...",
      "action": "REJECT",
      "reasonCode": "PRICE_TOO_HIGH",
      "previousContextVersion": 1,
      "newContextVersion": 2,
      "totalExcludedCount": 1,
      "message": "Feedback recorded successfully"
    }
    ```

#### B. Chỉnh sửa UI
- [x] Thiết kế 2 nút hành động trên mỗi thẻ KOC được đề xuất:
  - [x] **Nút "Phù hợp / Thêm vào chiến dịch" (`action: 'ACCEPT'`):**
    - Gọi API feedback với `action: 'ACCEPT'`.
    - Đồng thời thêm vào Shortlist của chiến dịch.
  - [x] **Nút "Không phù hợp" (`action: 'REJECT'`):**
    - Mở Modal/Popover **"Đóng góp ý kiến cho AI"**.
    - Danh sách Radio chọn mã lý do (`reasonCode`):
      - `PRICE_TOO_HIGH`: Chi phí báo giá quá cao
      - `NOT_TARGET_NICHE`: Sai tệp khách hàng / sai phong cách
      - `POOR_ENGAGEMENT`: Tương tác thấp hoặc nghi ngờ tương tác ảo
      - `BRAND_CONFLICT`: Đã hợp tác với đối thủ cạnh tranh
      - `OTHER`: Lý do khác
    - Ô nhập ghi chú chi tiết (`reasonNote`).
  - [x] Xử lý phản hồi từ Server:
    - Ẩn Creator bị Reject khỏi danh sách.
    - Hiển thị Toast thông báo: *"Đã ghi nhận phản hồi. AI đã nâng cấp bộ nhớ ngữ cảnh lên v{newContextVersion} và sẽ không đề xuất lại Creator này."*

---

### 7. Data Sources Management (Quản lý Nguồn Dữ liệu)
> **Luồng nghiệp vụ UI:** Data Manager mở màn hình quản lý nguồn dữ liệu → xem danh sách nguồn → kiểm tra trạng thái và thông tin nguồn dữ liệu.

#### A. Map API & Kiến trúc
- [x] Endpoint Ingestion: `POST /creators/ingest` (sử dụng Header `X-Service-Key` cho crawler background).
- [x] Phân quyền bảo mật: Đảm bảo kiểm tra role `DATA_MANAGER` hoặc `ADMIN` để vào route `/admin/data-sources`.

#### B. Chỉnh sửa UI ([DataSourcesPage.tsx](file:///d:/INFLUENCERMATCH/src/pages/admin/datasources/DataSourcesPage.tsx))
- [x] Tích hợp thanh điều hướng quy trình chuẩn: `<DataPipelineWorkflowBar currentStep="sources" />`.
- [x] Hiển thị danh sách các kết nối: TikTok API, Instagram Graph API, YouTube Data API v3, Shopee Video.
- [x] Thẻ thông tin trạng thái từng nguồn: `Hoạt động` (Active), `Cảnh báo giới hạn tần suất` (Rate Limited), `Tạm dừng` (Paused).
- [x] Nút **"Kiểm tra kết nối" (Ping / Test Connection)**: kiểm tra API health và độ trễ phản hồi từng nguồn (hiển thị ms & 200 OK).
- [x] Modal xem và điều chỉnh giới hạn tần suất (Rate limit quota) đồng bộ dữ liệu.

---

### 8. Crawler Jobs Monitor (Theo dõi Tiến trình Cào Dữ liệu)
> **Luồng nghiệp vụ UI:** Data Manager vào màn hình theo dõi tiến trình crawl → xem trạng thái công việc thu thập dữ liệu → kiểm tra các tiến trình thành công hoặc thất bại.

#### A. Map API & Telemetry
- [x] Đồng bộ dữ liệu telemetry từ crawler engine về giao diện giám sát.
- [x] Quyền yêu cầu: `DATA_MANAGER` hoặc `ADMIN`.

#### B. Chỉnh sửa UI ([CollectionJobsPage.tsx](file:///d:/INFLUENCERMATCH/src/pages/admin/jobs/CollectionJobsPage.tsx))
- [x] Tích hợp thanh điều hướng quy trình chuẩn: `<DataPipelineWorkflowBar currentStep="jobs" />`.
- [x] Bảng công việc cào dữ liệu với các trường:
  - Mã Job (`Job ID`)
  - Loại tác vụ (Cào profile mới, Quét metrics, Lấy bài đăng gần đây)
  - Nguồn nền tảng (TikTok, Instagram, YouTube)
  - Trạng thái: `Đang chạy` (Running), `Thành công` (Done), `Thất bại` (Failed), `Đã hủy` (Cancelled)
  - Thời gian bắt đầu và thời lượng thực thi
- [x] Bộ lọc trạng thái (`running`, `done`, `failed`) và theo nền tảng.
- [x] Nút **"Xem Log"**: Mở Modal hiển thị console log quá trình cào, số lượng creator thu thập được, lỗi chi tiết nếu thất bại.
- [x] Nút **"Chạy lại (Retry)"** và **"Dừng (Cancel)"** các jobs.

---

### 9. Data Quality Review (Duyệt & Chuẩn hóa Chất lượng Dữ liệu)
> **Luồng nghiệp vụ UI:** Data Manager mở danh sách dữ liệu chờ duyệt → kiểm tra thông tin Creator → phê duyệt hoặc xử lý dữ liệu theo quyền và API được hỗ trợ.

#### A. Map API Backend
- [x] **Lấy danh sách bản ghi KOC có độ tin cậy thấp cần duyệt:**
  - `GET /admin/data-quality/pending?page=0&size=20`
  - Quyền: `REVIEW_CREATOR_CLASSIFICATION` (Role `DATA_MANAGER` hoặc `ADMIN`)
  - Response DTO `ApiResponsePageResponseQualityItem`:
    ```typescript
    export interface QualityItem {
      metricId: string;       // UUID bản ghi số liệu
      creatorId: string;      // UUID Creator
      platform: string;       // Nền tảng
      userName: string;
      displayName: string;
      profileUrl: string;
      niche: string;          // Ngách hiện tại do crawler phân loại
      contentSummary: string; // Tóm tắt nội dung cào được
      dataConfidence: number; // Điểm tin cậy (ví dụ: 0.58 < 0.70)
      collectedAt: string;    // Thời gian thu thập
    }
    ```
- [x] **Phê duyệt bản ghi:**
  - `PUT /admin/data-quality/{id}/approve` (Path param `id` là `metricId`)
  - Request DTO `ApproveRequest`:
    ```json
    {
      "niche": "Làm đẹp & Chăm sóc da"
    }
    ```
    *(Để trống string nếu giữ nguyên niche, hoặc truyền niche chuẩn mới)*
- [x] *(Bổ sung)* Hỗ trợ yêu cầu cào lại (Re-crawl queue) trực tiếp từ giao diện.

#### B. Chỉnh sửa UI
- [x] **Tạo file trang mới:** `src/pages/admin/quality/DataQualityPage.tsx`
- [x] **Khai báo route trong [App.tsx](file:///d:/INFLUENCERMATCH/src/App.tsx):**
  ```tsx
  <Route path="data-quality" element={<DataQualityPage />} />
  ```
- [x] **Thêm menu vào [AdminSidebar.tsx](file:///d:/INFLUENCERMATCH/src/components/admin/AdminSidebar.tsx):**
  - Key: `'data-quality'`, Icon: `<CheckCircleOutlined />`, Label: `'Kiểm định chất lượng'`.
- [x] Giao diện màn hình:
  - Bảng danh sách các KOC snapshot có `dataConfidence < 0.7`:
    - Avatar, Tên, Username, Link profile gốc.
    - Nền tảng (TikTok, Instagram, YouTube).
    - Tóm tắt nội dung clip (`contentSummary`).
    - Điểm tin cậy (`dataConfidence` hiển thị thanh Progress màu cam/đỏ).
    - Ngách dự đoán (`niche`).
  - Nút **"Chuẩn hóa & Duyệt"**: Mở Modal chuẩn hóa ngành hàng Niche Taxonomy và submit.
  - Nút **"Cào lại"**: Đẩy vào hàng đợi re-crawl.

---

## 💻 CODE MẪU SERVICE CHO AI RECOMMENDATION (`aiRecommendationService.ts`)

```typescript
import apiClient from '../apiClient';
import { ApiResponse } from '../../types/api/common.types';

export interface ScoreBreakdownDto {
  m1Score: number;
  m2Score: number;
  m4Score: number;
  followerScore: number;
  engagementScore: number;
  semanticMatchScore: number;
  nicheMatchScore: number;
  finalScore: number;
}

export interface ReasoningCardDto {
  summary: string;
  reasons: string[];
  explanationAvailable: boolean;
}

export interface CreatorRecommendationItemDto {
  creatorId: string;
  masterId: string;
  platform: string;
  displayName: string;
  userName: string;
  avatarUrl: string;
  followers: number;
  avgViews: number;
  avgLikes: number;
  engagementRate: number;
  niche: string;
  creatorType: string;
  finalScore: number;
  scoreBreakdown: ScoreBreakdownDto;
  reasoning: ReasoningCardDto;
  inShortlist: boolean;
}

export interface RecommendationResponseDto {
  recommendationRunId: string;
  campaignId: string;
  contextVersion: number;
  totalCandidates: number;
  recommendations: CreatorRecommendationItemDto[];
}

export interface RecommendationRun {
  id: string;
  contextVersion: number;
  status: string;
  candidatesCount: number;
  queryBrief: string;
  createdAt: string;
}

export interface RecommendationFeedbackRequest {
  creatorId: string;
  action: 'ACCEPT' | 'REJECT';
  reasonCode?: string;
  reasonNote?: string;
}

export interface RecommendationFeedbackResponse {
  campaignId: string;
  creatorId: string;
  action: string;
  reasonCode?: string;
  previousContextVersion: number;
  newContextVersion: number;
  totalExcludedCount: number;
  message: string;
}

export const aiRecommendationService = {
  /** Chạy đề xuất AI KOC với Four-Memory Framework */
  async runRecommendation(campaignId: string, limit = 10): Promise<RecommendationResponseDto> {
    const response = await apiClient.post<ApiResponse<RecommendationResponseDto>>(
      `/campaigns/${campaignId}/ai-recommendations`,
      null,
      { params: { limit } }
    );
    return response.data.data;
  },

  /** Lấy lịch sử các lần chạy đề xuất AI */
  async getRuns(campaignId: string): Promise<RecommendationRun[]> {
    const response = await apiClient.get<ApiResponse<RecommendationRun[]>>(
      `/campaigns/${campaignId}/ai-recommendations/runs`
    );
    return response.data.data;
  },

  /** Gửi phản hồi đánh giá KOC (Accept/Reject) để tiến hóa ngữ cảnh */
  async sendFeedback(
    campaignId: string,
    payload: RecommendationFeedbackRequest
  ): Promise<RecommendationFeedbackResponse> {
    const response = await apiClient.post<ApiResponse<RecommendationFeedbackResponse>>(
      `/campaigns/${campaignId}/ai-recommendations/feedback`,
      payload
    );
    return response.data.data;
  },
};
```

---

## ✅ TIÊU CHÍ HOÀN THÀNH (DEFINITION OF DONE - DoD)

1. [ ] Brand tạo chiến dịch thành công từ UI và bấm "Tiếp tục chạy đề xuất" chuyển trạng thái sang `READY_FOR_DISCOVERY` mượt mà.
2. [ ] Nhập Brief tự nhiên ➔ Gọi `/ai/campaign-autofill` ➔ Tự động điền đúng các trường trên Form và hiển thị giải thích AI.
3. [ ] Creator Discovery tải danh mục ngách động từ `/taxonomies/niches` và hỗ trợ cả Keyword Search lẫn Semantic AI Search.
4. [ ] Chạy đề xuất AI hiển thị được: Danh sách Creator kèm **Match Score**, **Reasoning Card** (lý do gợi ý) và **Score Breakdown** (điểm thành phần M1, M2, M4).
5. [ ] Xem được danh sách các lần chạy đề xuất trước đó từ API `/ai-recommendations/runs`.
6. [ ] Gửi feedback từ chối KOC (Reject) với lý do ➔ Context Version tăng lên và KOC bị loại trừ khỏi các lần sau.
7. [ ] Data Manager truy cập được các màn hình Data Sources, Crawler Jobs và trang Duyệt chất lượng dữ liệu (`/admin/data-quality`) để phê duyệt bản ghi `confidence < 0.7`.
