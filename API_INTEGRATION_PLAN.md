# 📌 KẾ HOẠCH TÍCH HỢP HỆ THỐNG API VÀO FRONTEND BẰNG AXIOS

## 1. Thông Tin Chung & Tài Liệu API

- **Swagger UI**: [http://221.121.3.226:8080/api/v1/swagger-ui/index.html](http://221.121.3.226:8080/api/v1/swagger-ui/index.html)
- **OpenAPI 3.0 Specs Endpoint**: `http://221.121.3.226:8080/api/v1/api-docs`
- **Base URL**: `http://221.121.3.226:8080/api/v1`
- **Công nghệ Frontend**: React 19 + TypeScript + Vite + Ant Design + Axios

---

## 2. Kiến Trúc & Cấu Trúc Thư Mục Đề Xuất

Tách lớp xử lý API theo mô hình **Service Layer** để đảm bảo code gọn gàng, dễ bảo trì, tái sử dụng và kiểm thử:

```
src/
├── config/
│   └── env.ts                      # Đọc và validate các biến môi trường
├── types/
│   └── api/                        # Định nghĩa TypeScript Interface cho Request/Response
│       ├── common.types.ts         # Response bọc, phân trang, filter params
│       ├── auth.types.ts           # Login, Register, User session
│       ├── creator.types.ts        # Creator, Rate card, Claim, Niches
│       ├── campaign.types.ts       # Campaign, Shortlist, Discovery, Relationships
│       ├── collaboration.types.ts  # Collaboration, Outcome, Review
│       ├── brand.types.ts          # Brand profile, Brand context
│       ├── subscription.types.ts   # Plans, Subscription, VNPay billing
│       └── admin.types.ts          # Users, Data quality approval, Audit logs
├── services/
│   ├── apiClient.ts                # Axios instance cấu hình sẵn interceptors
│   └── api/                        # Các API service modules tương ứng theo chức năng
│       ├── authService.ts
│       ├── creatorService.ts
│       ├── campaignService.ts
│       ├── collaborationService.ts
│       ├── brandService.ts
│       ├── subscriptionService.ts
│       └── adminService.ts
```

---

## 3. Các Bước Triển Khai Chi Tiết

### 🔹 Bước 1: Chuẩn Bị Môi Trường & Cấu Hình Axios Base

1. **Cài đặt thư viện**:
   ```bash
   npm install axios
   ```
2. **Cấu hình file môi trường `.env`**:
   ```env
   VITE_API_BASE_URL=http://221.121.3.226:8080/api/v1
   ```
3. **Xây dựng `src/services/apiClient.ts`**:
   - Khởi tạo Axios instance với `baseURL: import.meta.env.VITE_API_BASE_URL`.
   - **Request Interceptor**: Tự động đính kèm Token xác thực:
     ```typescript
     config.headers.Authorization = `Bearer ${token}`;
     ```
   - **Response Interceptor**:
     - Chuẩn hóa dữ liệu trả về `response.data`.
     - Bắt lỗi tập trung:
       - `401 Unauthorized`: Xử lý refresh token qua `/auth/refresh` hoặc xóa session và điều hướng về trang `/login`.
       - `403 Forbidden`: Cảnh báo không có quyền truy cập.
       - `400 / 422`: Trích xuất thông báo validation lỗi từ backend hiển thị qua Ant Design `message.error()`.
       - `500 Server Error`: Cảnh báo lỗi máy chủ.

---

### 🔹 Bước 2: Định Nghĩa TypeScript Models & DTOs

Dựa trên cấu trúc Swagger OpenAPI, định nghĩa các type chuẩn hóa trong `src/types/api/`:

| File | Nội dung chính |
| :--- | :--- |
| `common.types.ts` | `ApiResponse<T>`, `Pagination<T>`, `SortOrder`, `ApiErrorResponse` |
| `auth.types.ts` | `LoginPayload`, `RegisterPayload`, `AuthTokens`, `AuthUser` |
| `creator.types.ts` | `Creator`, `CreatorDetail`, `RateCard`, `CreatorClaim`, `NicheTaxonomy` |
| `campaign.types.ts` | `Campaign`, `CreateCampaignPayload`, `ShortlistItem`, `RelationshipItem`, `DiscoveryResult` |
| `collaboration.types.ts` | `Collaboration`, `CollaborationOutcome`, `CollaborationReview` |
| `brand.types.ts` | `BrandProfile`, `BrandUpdatePayload` |
| `subscription.types.ts` | `SubscriptionPlan`, `SubscribePayload`, `VNPayPaymentUrlResponse` |
| `admin.types.ts` | `AdminUser`, `UpdateRolePayload`, `PendingQualityClaim`, `AuditLogItem` |

---

### 🔹 Bước 3: Xây Dựng Các API Service Modules

Chi tiết các endpoints được phân bổ vào các service:

#### 1. `authService.ts`
- `POST /auth/login`: Đăng nhập bằng email/password
- `POST /auth/register`: Đăng ký tài khoản mới
- `POST /auth/refresh`: Cấp mới token truy cập
- `POST /auth/logout`: Đăng xuất, hủy session
- `GET /auth/me`: Lấy thông tin user hiện tại
- `GET /auth/google`, `POST /auth/google/exchange`, `GET /auth/google/creator`: Đăng nhập / liên kết tài khoản Google

#### 2. `creatorService.ts`
- `GET /creators`: Lấy danh sách creator (hỗ trợ lọc, phân trang)
- `GET /creators/{id}`: Chi tiết thông tin creator
- `POST /creators/search/semantic`: Tìm kiếm thông minh bằng ngữ nghĩa / AI
- `GET /creators/{id}/rate-card`: Bảng giá dịch vụ của creator
- `POST /creators/{id}/claim`: Gửi yêu cầu claim/nhận profile creator
- `GET /creator-claims/me`: Danh sách claim của user hiện tại
- `GET /taxonomies/niches`: Lấy danh sách danh mục/niche ngành hàng
- `POST /creators/ingest`: Nạp dữ liệu creator mới

#### 3. `campaignService.ts`
- `GET /campaigns`: Danh sách campaign
- `POST /campaigns`: Tạo chiến dịch mới
- `GET /campaigns/{id}`: Chi tiết chiến dịch
- `PUT /campaigns/{id}`: Cập nhật thông tin chiến dịch
- `PATCH /campaigns/{id}/status`: Cập nhật trạng thái chiến dịch
- `POST /campaigns/{id}/archive`: Lưu trữ (archive) chiến dịch
- `POST /campaigns/{id}/discover`: Chạy thuật toán tìm creator cho chiến dịch
- `GET /campaigns/{campaignId}/discovery`: Lấy kết quả discovery
- `GET /campaigns/{campaignId}/shortlist`: Lấy danh sách creator trong shortlist
- `POST /campaigns/{campaignId}/shortlist`: Thêm creator vào shortlist
- `DELETE /campaigns/{campaignId}/shortlist/{shortlistItemId}`: Xóa creator khỏi shortlist
- `POST /campaigns/{campaignId}/shortlist/compare`: So sánh các creator trong shortlist
- `GET /campaigns/{campaignId}/relationships`: Lấy danh sách quan hệ/pipeline CRM
- `POST /campaigns/{campaignId}/relationships`: Tạo quan hệ hợp tác mới
- `PATCH /campaigns/{campaignId}/relationships/{relationshipId}/stage`: Chuyển đổi giai đoạn CRM

#### 4. `collaborationService.ts`
- `GET /campaigns/{id}/collaborations`: Danh sách hợp tác của campaign
- `POST /collaborations/{id}/outcome`: Báo cáo kết quả hợp tác
- `POST /collaborations/{id}/review`: Đánh giá creator sau chiến dịch

#### 5. `brandService.ts`
- `GET /brands/me`: Lấy profile của thương hiệu hiện tại
- `GET /brands/{id}`: Lấy thông tin chi tiết thương hiệu
- `POST /brands`: Tạo profile thương hiệu
- `GET /brands/{brandId}/campaigns`: Lấy danh sách chiến dịch theo brand

#### 6. `subscriptionService.ts`
- `GET /plans`: Danh sách các gói cước dịch vụ
- `GET /plans/{id}`: Chi tiết gói cước
- `GET /subscriptions`: Danh sách subscription
- `GET /subscriptions/brand/{brandId}`: Subscription hiện tại của brand
- `POST /billing/subscribe`: Đăng ký gói dịch vụ
- `GET /billing/vnpay/return`: Xử lý callback thanh toán VNPay
- `POST /billing/vnpay/ipn`: Xử lý webhook IPN VNPay

#### 7. `adminService.ts`
- `GET /admin/users`: Danh sách toàn bộ tài khoản
- `GET /admin/users/{id}`: Chi tiết tài khoản
- `PATCH /admin/users/{id}/status`: Khóa / Mở khóa tài khoản
- `PATCH /admin/users/{id}/role`: Cập nhật vai trò (Role)
- `GET /admin/data-quality/pending`: Danh sách claims/dữ liệu chờ kiểm duyệt
- `POST /admin/data-quality/{id}/approve`: Duyệt dữ liệu creator
- `GET /data/creator-claims`: Danh sách yêu cầu claim creator
- `POST /data/creator-claims/{id}/review`: Review quyết định claim
- `POST /data/creator-claims/{id}/revoke`: Thu hồi quyền claim
- `GET /admin/subscriptions`: Quản lý danh sách subscription hệ thống
- `GET /admin/audit-logs`: Xem lịch sử kiểm toán / audit log hệ thống

---

## 4. Lộ Trình Tích Hợp Vào Giao Diện (Mapping UI Pages)

| Giai đoạn | Màn hình Frontend | API Service được áp dụng | Trạng thái hiện tại |
| :--- | :--- | :--- | :--- |
| **Giai đoạn 1** | `LoginPage.jsx`, `RegisterPage.jsx`, `AppHeader.tsx`, `AppSider.tsx` | `authService` | ✅ **Đã hoàn thành**: Đã kết nối API thật, xóa hoàn toàn `src/mock/authData.js` |
| **Giai đoạn 2** | `CreatorDiscoveryPage.tsx`, `CreatorShortlistPage.tsx`, `CreatorDetailPage.tsx` | `creatorService` | ✅ **Đã hoàn thành**: Đã kết nối API thật (`/creators`, `/creators/{id}`, `/taxonomies/niches`), xóa hơn 600 dòng data giả |
| **Giai đoạn 3** | `CampaignListPage.tsx`, `CampaignDetailPage.tsx`, `CampaignManagementPage.tsx`, `CreateCampaignPage.tsx`, `OutreachCrmPage.tsx` | `campaignService` | ✅ **Đã hoàn thành**: Đã kết nối API thật (`/campaigns`, `/campaigns/{id}`, `/campaigns/{id}/relationships`), xóa hơn 500 dòng mock data |
| **Giai đoạn 4** | `BrandProfilePage.tsx` | `brandService` | ✅ **Đã hoàn thành**: Đã kết nối API thật (`/brands/me`, `/brands`, `PUT /brands/{id}`), xóa mock `INITIAL_BRAND_PROFILE` |
| **Giai đoạn 5** | `SubscriptionPage.tsx`, `SubscriptionPlansPage.tsx` | `subscriptionService` | ✅ **Đã hoàn thành**: Đã kết nối API thật (`/plans`, `/billing/subscribe`, `/subscriptions/brand/{brandId}`), xóa mock `SUBSCRIPTION_PLANS` và tích hợp cổng thanh toán VNPAY Sandbox |
| **Giai đoạn 6** | `AccountManagementPage.tsx`, `AccountDetailPage.tsx`, `AuditLogPage.tsx` | `adminService` | ✅ **Đã hoàn thành**: Đã kết nối API thật (`/admin/users`, `/admin/users/{id}`, `PATCH /admin/users/{id}/status`, `/admin/audit-logs`), xóa `MOCK_ACCOUNTS`, `MOCK_AUDIT_LOGS`, `SECURITY_ACTIVITY` khỏi `adminData.ts` |
| **Giai đoạn 7** | `CreatorClaimReviewPage.tsx` (`/admin/creator-claims`), `CreatorDetailPage.tsx` | `claimService` | ✅ **Đã hoàn thành**: Xây mới toàn bộ trang Quản lý & Duyệt yêu cầu Claim quyền sở hữu Creator (`/data/creator-claims`, `PATCH /review`, `POST /revoke`), tích hợp modal gửi Claim trên Creator Detail (`POST /creators/{id}/claim`) |
| **Giai đoạn 8** | `CollaborationPage.tsx` | `collaborationService`, `campaignService` | ✅ **Đã hoàn thành**: Kết nối danh sách chiến dịch thật, quan hệ đối tác theo campaign, ghi nhận KPI/Outcome thực tế (`POST /collaborations/{id}/outcome`), đánh giá Creator sau hợp tác (`POST /collaborations/{id}/review`), xóa hoàn toàn dữ liệu cứng |
| **Giai đoạn 9** | `PerformancePage.tsx` | `campaignService`, `collaborationService` | ✅ **Đã hoàn thành**: Tải toàn bộ danh sách chiến dịch và đối tác thật, tính toán tỷ suất ROAS/ROI tự động, modal cập nhật số liệu tự khai báo (Self-reported), form gửi đánh giá Creator (`POST /collaborations/{id}/review`), xóa hoàn toàn `CAMPAIGNS` và `INIT_REVIEWS` |
| **Giai đoạn 10** | `CampaignHistoryPage.tsx` | `campaignService` | ✅ **Đã hoàn thành**: Xóa hoàn toàn `MOCK_HISTORY`, kết nối API chiến dịch thật (`/campaigns`) và danh sách đối tác (`/campaigns/{id}/relationships`), tính toán ROAS/ROI/chi phí thực, hỗ trợ lọc theo trạng thái (`COMPLETED`, `ARCHIVED`, `ALL`), xuất báo cáo tổng hợp CSV, xuất báo cáo PDF/Text và tái sử dụng brief |
| **Giai đoạn 11** | `DashboardPage.jsx` | `campaignService`, `creatorService`, `authService` | ✅ **Đã hoàn thành**: Xóa toàn bộ dữ liệu giả tĩnh (`statCards`, `campaigns`, `topCreators`, `tasks`), kết nối API chiến dịch thật (`/campaigns`) và danh sách creator thật (`/creators`), tính toán 4 chỉ số thống kê động, hiển thị Top Creator và Spotlight theo dữ liệu thực |
| **Giai đoạn 12** | `CreatorCatalogPage.tsx`, `CreatorListTab.tsx`, `CreatorDetailTab.tsx` | `creatorService` | ✅ **Đã hoàn thành**: Xóa hoàn toàn `MOCK_CREATORS` và `MOCK_DUPLICATES` trong `src/mock/adminData.ts`, kết nối API `/creators` và `/creators/{id}` để Admin xem, tìm kiếm, lọc theo platform/niche/trạng thái và xem chi tiết profile creator thật |
| **Giai đoạn 13** | `AdminDashboardPage.tsx` | `adminService`, `creatorService`, `campaignService`, `subscriptionService` | ✅ **Đã hoàn thành**: Xóa hoàn toàn `ADMIN_KPI`, `MONTHLY_USER_GROWTH`, `REVENUE_BY_PLAN`, `RECENT_ACTIVITY` khỏi `src/mock/adminData.ts`. Tính toán 4 chỉ số KPI thời gian thực, biểu đồ tăng trưởng người dùng Brand & Creator, phân bổ doanh thu theo gói cước và dòng nhật ký kiểm toán (Audit Logs) trực tiếp từ hệ thống API |

---

## 5. Danh Sách Kiểm Tra & Chuẩn Bị (Checklist)

- [x] Cài đặt `axios` bằng lệnh `npm install axios`
- [x] Tạo file `.env` và `.env.example` với biến `VITE_API_BASE_URL`
- [x] Tạo file cấu hình `src/services/apiClient.ts` kèm Interceptors tự gắn Bearer Token và Auto Refresh
- [x] Tạo các thư mục `src/types/api/` và viết các interface TypeScript (`common.types.ts`, `auth.types.ts`, `creator.types.ts`, `campaign.types.ts`, `brand.types.ts`, `subscription.types.ts`, `claim.types.ts`, `collaboration.types.ts`)
- [x] Tạo file service `src/services/api/authService.ts`
- [x] Chuyển đổi module xác thực Authentication (Login/Register/Logout/Session)
- [x] **Xóa hoàn toàn file mock data `src/mock/authData.js`**
- [x] Chuyển đổi module Creator Search & Shortlist (`creatorService.ts`)
- [x] Chuyển đổi module Campaign & CRM (`campaignService.ts`)
- [x] Chuyển đổi module Brand Profile (`brandService.ts`)
- [x] Chuyển đổi module Subscription & Billing VNPay (`subscriptionService.ts`)
- [x] Chuyển đổi module Admin Portal (Quản lý User, Duyệt claim, Audit logs)
- [x] Xây dựng UI & Service Duyệt Creator Claim (`claimService.ts`, `CreatorClaimReviewPage.tsx`)
- [x] Kết nối module Quản lý Hợp tác, Nghiệm thu KPI & Đánh giá Creator (`collaborationService.ts`, `CollaborationPage.tsx`)
- [x] Kết nối module Hiệu suất & Đo lường ROI (`campaignService.ts`, `PerformancePage.tsx`)
- [x] Chuyển đổi module Lịch sử Chiến dịch, xóa toàn bộ `MOCK_HISTORY` (`CampaignHistoryPage.tsx`)
- [x] Chuyển đổi module Trang Tổng quan Brand Dashboard, xóa dữ liệu giả (`DashboardPage.jsx`)
- [x] Chuyển đổi module Admin Creator Catalog, xóa hoàn toàn `MOCK_CREATORS` (`CreatorCatalogPage.tsx`, `CreatorListTab.tsx`, `CreatorDetailTab.tsx`)
- [x] Chuyển đổi module Admin Dashboard, xóa hoàn toàn `ADMIN_KPI`, `MONTHLY_USER_GROWTH`, `REVENUE_BY_PLAN`, `RECENT_ACTIVITY` (`AdminDashboardPage.tsx`)
- [x] Kiểm tra Typecheck & Build dự án (`npm run build` thành công 100%)



