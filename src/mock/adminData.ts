// =============================================
// ADMIN MOCK DATA - InfluencerMatch Admin Panel
// =============================================

import { authService } from '../services/api/authService';
import { setAuthSession } from '../services/apiClient';

// ── Auth ──────────────────────────────────────
export const ADMIN_USER = {
  id: 'admin_001',
  name: 'Trần Minh Khoa',
  email: 'admin@influencermatch.vn',
  password: 'admin123',
  role: 'ADMIN' as const,
  roleLabel: 'Super Admin',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
};

export const MANAGER_USER = {
  id: 'manager_001',
  name: 'Nguyễn Hoàng Long',
  email: 'manager@influencermatch.vn',
  password: 'manager123',
  role: 'DATA_MANAGER' as const,
  roleLabel: 'Manager (Quản lý)',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
};

export const adminAuthService = {
  login: async (email: string, password: string) => {
    try {
      const loginData = await authService.login({ email, password });
      return { success: true, user: loginData.user };
    } catch {
      // Local demo fallback if backend DB doesn't have seed accounts yet
      if (email === ADMIN_USER.email && password === ADMIN_USER.password) {
        const mockUser = {
          id: ADMIN_USER.id,
          email: ADMIN_USER.email,
          fullName: ADMIN_USER.name,
          role: ADMIN_USER.role,
          status: 'ACTIVE' as const,
        };
        setAuthSession('mock_admin_token', undefined, mockUser);
        return { success: true, user: mockUser };
      }
      if (email === MANAGER_USER.email && password === MANAGER_USER.password) {
        const mockUser = {
          id: MANAGER_USER.id,
          email: MANAGER_USER.email,
          fullName: MANAGER_USER.name,
          role: MANAGER_USER.role,
          status: 'ACTIVE' as const,
        };
        setAuthSession('mock_manager_token', undefined, mockUser);
        return { success: true, user: mockUser };
      }
      return { success: false, message: 'Sai thông tin đăng nhập hoặc không có quyền truy cập.' };
    }
  },
  logout: () => authService.logout(),
  isAuthenticated: () => {
    return authService.hasManagementAccess();
  },
  getCurrentUser: () => {
    return authService.getCurrentUser();
  },
};

// ── Fallback Admin Accounts ───────────────────
import type { AdminUser, AuditLogItem } from '../types/api/admin.types';

export const DEFAULT_ADMIN_ACCOUNTS: AdminUser[] = [
  { id: 'usr_001', name: 'Trần Minh Khoa', email: 'admin@influencermatch.vn', role: 'super_admin', roleLabel: 'Super Admin', status: 'active', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop', lastLogin: '2026-10-22 08:30', joinedAt: '2024-01-15', ip: '113.161.77.10' },
  { id: 'usr_008', name: 'Nguyễn Hoàng Long', email: 'manager@influencermatch.vn', role: 'manager', roleLabel: 'Manager (Quản lý)', status: 'active', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop', lastLogin: '2026-10-22 09:10', joinedAt: '2024-03-01', ip: '113.161.88.25' },
  { id: 'usr_002', name: 'Nguyễn Thị Mai', email: 'mai.nguyen@brand.vn', role: 'brand', roleLabel: 'Brand', status: 'active', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop', lastLogin: '2026-10-22 07:15', joinedAt: '2024-02-20', ip: '118.69.182.44' },
  { id: 'usr_003', name: 'Phạm Quốc Hùng', email: 'hungpq@gmail.com', role: 'creator', roleLabel: 'Creator', status: 'active', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&auto=format&fit=crop', lastLogin: '2026-10-21 22:00', joinedAt: '2024-03-10', ip: '171.244.33.12' },
  { id: 'usr_004', name: 'Lê Văn Dũng', email: 'dungadmin@influencermatch.vn', role: 'admin', roleLabel: 'Admin', status: 'active', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop', lastLogin: '2026-10-22 06:45', joinedAt: '2024-01-20', ip: '14.161.22.8' },
  { id: 'usr_005', name: 'Trần Thị Hoa', email: 'hoatran@beauty.com', role: 'brand', roleLabel: 'Brand', status: 'locked', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&auto=format&fit=crop', lastLogin: '2026-10-18 11:30', joinedAt: '2024-05-01', ip: '210.245.34.55' },
  { id: 'usr_006', name: 'Võ Minh Tuấn', email: 'tuanvo.creator@tiktok.vn', role: 'creator', roleLabel: 'Creator', status: 'inactive', avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=80&auto=format&fit=crop', lastLogin: '2026-09-12 08:00', joinedAt: '2024-06-12', ip: '103.48.194.22' },
  { id: 'usr_007', name: 'Nguyễn Lan Anh', email: 'lananh@fashion.co', role: 'brand', roleLabel: 'Brand', status: 'pending', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop', lastLogin: '—', joinedAt: '2026-10-20', ip: '—' },
];

export const DEFAULT_AUDIT_LOGS: AuditLogItem[] = [
  { id: 'al_1', timestamp: '2026-10-22 08:30:14', actor: 'Trần Minh Khoa', actorEmail: 'admin@influencermatch.vn', action: 'LOGIN', resource: 'Auth', resourceId: 'admin_001', ip: '113.161.77.10' },
  { id: 'al_2', timestamp: '2026-10-21 14:00:32', actor: 'Trần Minh Khoa', actorEmail: 'admin@influencermatch.vn', action: 'UPDATE', resource: 'ScoringConfig', resourceId: 'sv_3', ip: '113.161.77.10', oldValue: { version: 'v2.3', engagementRate: 30 }, newValue: { version: 'v2.4', engagementRate: 35 } },
  { id: 'al_3', timestamp: '2026-10-21 13:00:01', actor: 'Lê Văn Dũng', actorEmail: 'dungadmin@influencermatch.vn', action: 'UPDATE', resource: 'Account', resourceId: 'usr_005', ip: '14.161.22.8', oldValue: { status: 'active' }, newValue: { status: 'locked', reason: 'Phát hiện đăng nhập bất thường' } },
  { id: 'al_4', timestamp: '2026-10-20 11:20:05', actor: 'Trần Minh Khoa', actorEmail: 'admin@influencermatch.vn', action: 'CREATE', resource: 'SubscriptionPlan', resourceId: 'plan_enterprise', ip: '113.161.77.10', newValue: { name: 'Enterprise', priceMonth: 9990000 } },
  { id: 'al_5', timestamp: '2026-10-19 16:10:44', actor: 'Lê Văn Dũng', actorEmail: 'dungadmin@influencermatch.vn', action: 'DELETE', resource: 'Creator', resourceId: 'cr_099', ip: '14.161.22.8', oldValue: { handle: '@spamcreator', reason: 'Tài khoản mạo danh' } },
  { id: 'al_6', timestamp: '2026-10-18 09:00:00', actor: 'Trần Minh Khoa', actorEmail: 'admin@influencermatch.vn', action: 'UPDATE', resource: 'DataConnector', resourceId: 'conn_3', ip: '113.161.77.10', oldValue: { status: 'active' }, newValue: { status: 'paused' } },
];

export const SECURITY_ACTIVITY = [
  { id: 'sa_1', event: 'Đăng nhập thành công', ip: '113.161.77.10', device: 'Chrome 125 / Windows', time: '2026-10-22 08:30' },
  { id: 'sa_2', event: 'Đăng nhập thất bại (sai mật khẩu)', ip: '113.161.77.10', device: 'Chrome 125 / Windows', time: '2026-10-22 08:28' },
  { id: 'sa_3', event: 'Đổi mật khẩu tài khoản', ip: '113.161.77.10', device: 'Chrome 125 / Windows', time: '2026-10-21 14:00' },
  { id: 'sa_4', event: 'Đăng nhập thành công', ip: '210.245.88.12', device: 'Edge / Windows 11', time: '2026-10-20 09:30' },
];

// ── Creators ──────────────────────────────────
export type CreatorStatus = 'active' | 'hidden' | 'inactive' | 'pending';

export interface AdminCreator {
  id: string;
  handle: string;
  name: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  followers: number;
  er: number;
  category: string;
  status: CreatorStatus;
  avatar: string;
  lastVerified?: string;
  avgViews?: number;
  score?: number;
  country?: string;
  profileUrl?: string;
}


export const MOCK_EXTERNAL_DISCOVERED = [
  { id: 'ext_001', handle: '@banh.mi.review', source: 'TikTok Crawl', platform: 'tiktok', followers: 780_000, discoveredAt: '2026-10-06', status: 'pending' as const },
  { id: 'ext_002', handle: '@saigon.street', source: 'Instagram API', platform: 'instagram', followers: 310_000, discoveredAt: '2026-10-05', status: 'approved' as const },
  { id: 'ext_003', handle: '@techreview.vn', source: 'YouTube API', platform: 'youtube', followers: 92_000, discoveredAt: '2026-10-04', status: 'rejected' as const },
];

export const MOCK_REFRESH_REQUESTS = [
  { id: 'ref_001', creatorHandle: '@linh.beauty', requestedBy: 'Nguyễn Thị Mai', requestedAt: '2026-10-07 07:10', status: 'done' as const },
  { id: 'ref_002', creatorHandle: '@hungfood', requestedBy: 'System', requestedAt: '2026-10-07 06:00', status: 'processing' as const },
  { id: 'ref_003', creatorHandle: '@tuantech', requestedBy: 'Trần Minh Khoa', requestedAt: '2026-10-06 22:00', status: 'failed' as const },
  { id: 'ref_004', creatorHandle: '@anhthu.fashion', requestedBy: 'Lê Văn Dũng', requestedAt: '2026-10-06 18:30', status: 'pending' as const },
];

// ── Data Sources ──────────────────────────────
export type ConnectorStatus = 'active' | 'paused' | 'error';

export interface DataConnector {
  id: string;
  name: string;
  platform: string;
  status: ConnectorStatus;
  lastSync: string;
  successCount: number;
  failCount: number;
  rateLimit: number;
  priority: number;
}

export const MOCK_CONNECTORS: DataConnector[] = [
  { id: 'conn_1', name: 'TikTok API', platform: 'TikTok', status: 'active', lastSync: '2026-10-07 07:00', successCount: 14823, failCount: 42, rateLimit: 100, priority: 1 },
  { id: 'conn_2', name: 'Instagram Graph API', platform: 'Instagram', status: 'active', lastSync: '2026-10-07 07:05', successCount: 9241, failCount: 18, rateLimit: 80, priority: 2 },
  { id: 'conn_3', name: 'YouTube Data API v3', platform: 'YouTube', status: 'paused', lastSync: '2026-10-06 23:00', successCount: 6710, failCount: 5, rateLimit: 60, priority: 3 },
  { id: 'conn_4', name: 'Twitter/X API v2', platform: 'Twitter/X', status: 'error', lastSync: '2026-10-05 14:00', successCount: 1204, failCount: 391, rateLimit: 50, priority: 4 },
];

// ── Collection Jobs ────────────────────────────
export type JobStatus = 'running' | 'done' | 'failed' | 'cancelled' | 'pending';

export interface CollectionJob {
  id: string;
  type: string;
  source: string;
  status: JobStatus;
  startedAt: string;
  duration: string;
  target: string;
  errorMsg?: string;
  logs: string[];
}

export const MOCK_JOBS: CollectionJob[] = [
  { id: 'J-4825', type: 'Profile Sync', source: 'TikTok', status: 'running', startedAt: '2026-10-07 07:30', duration: '12m 34s', target: 'All active creators', logs: ['[07:30:00] Job started', '[07:35:12] Fetching batch 1/10...', '[07:42:18] Batch 3/10 completed'] },
  { id: 'J-4824', type: 'Engagement Crawl', source: 'Instagram', status: 'done', startedAt: '2026-10-07 06:00', duration: '45m 12s', target: '890 creators', logs: ['[06:00:00] Job started', '[06:44:00] All batches completed', '[06:45:12] Job finished successfully'] },
  { id: 'J-4823', type: 'New Discovery', source: 'TikTok', status: 'done', startedAt: '2026-10-07 05:00', duration: '28m 09s', target: 'Category: Làm đẹp', logs: ['[05:00:00] Job started', '[05:28:09] Discovered 142 new creators'] },
  { id: 'J-4822', type: 'Video Stats', source: 'YouTube', status: 'failed', startedAt: '2026-10-07 04:00', duration: '8m 03s', target: '420 creators', errorMsg: 'Rate limit exceeded: YouTube quota 10,000 units/day reached. Retry after 00:00 UTC.', logs: ['[04:00:00] Job started', '[04:08:03] ERROR: QuotaExceeded - daily limit reached'] },
  { id: 'J-4821', type: 'Follower Count', source: 'TikTok', status: 'cancelled', startedAt: '2026-10-06 22:00', duration: '2m 11s', target: 'All creators', logs: ['[22:00:00] Job started', '[22:02:11] Manually cancelled by admin'] },
  { id: 'J-4820', type: 'Profile Sync', source: 'Instagram', status: 'pending', startedAt: '—', duration: '—', target: 'New signups', logs: [] },
];

// ── Scoring Config ────────────────────────────
export interface ScoringVersion {
  id: string;
  version: string;
  savedAt: string;
  savedBy: string;
  notes: string;
  isCurrent: boolean;
  weights: Record<string, number>;
}

export const CURRENT_WEIGHTS = {
  engagementRate: 35,
  followerCount: 20,
  growthRate: 15,
  contentQuality: 15,
  consistency: 10,
  brandSafety: 5,
};

export const SCORING_VERSIONS: ScoringVersion[] = [
  { id: 'sv_3', version: 'v2.4', savedAt: '2026-10-06 14:00', savedBy: 'Trần Minh Khoa', notes: 'Tăng trọng số Engagement Rate, giảm Follower Count', isCurrent: true, weights: { engagementRate: 35, followerCount: 20, growthRate: 15, contentQuality: 15, consistency: 10, brandSafety: 5 } },
  { id: 'sv_2', version: 'v2.3', savedAt: '2026-09-15 10:00', savedBy: 'Lê Văn Dũng', notes: 'Bổ sung Brand Safety factor', isCurrent: false, weights: { engagementRate: 30, followerCount: 25, growthRate: 15, contentQuality: 15, consistency: 10, brandSafety: 5 } },
  { id: 'sv_1', version: 'v2.2', savedAt: '2026-08-01 09:00', savedBy: 'Trần Minh Khoa', notes: 'Cấu hình ban đầu', isCurrent: false, weights: { engagementRate: 30, followerCount: 30, growthRate: 15, contentQuality: 15, consistency: 10, brandSafety: 0 } },
];

export const SCORING_PREVIEW_CREATORS = [
  { id: 'cr_001', handle: '@linh.beauty', er: 8.4, followers: 2400000, growth: 12.1, quality: 88, consistency: 92, brandSafety: 95 },
  { id: 'cr_005', handle: '@minhhuy.travel', er: 9.2, followers: 3100000, growth: 18.5, quality: 91, consistency: 88, brandSafety: 97 },
  { id: 'cr_002', handle: '@hungfood', er: 5.2, followers: 890000, growth: 7.3, quality: 79, consistency: 80, brandSafety: 90 },
];

// ── Subscription Plans ────────────────────────
export type PlanStatus = 'active' | 'inactive';

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonth: number;
  priceYear: number;
  description: string;
  features: string[];
  quotaSearch: number;
  quotaCreators: number;
  quotaCampaigns: number;
  status: PlanStatus;
  activeUsers: number;
}

export const MOCK_PLANS: SubscriptionPlan[] = [
  { id: 'plan_free', name: 'Free', priceMonth: 0, priceYear: 0, description: 'Trải nghiệm cơ bản', features: ['5 lượt tìm kiếm/tháng', '10 creator/tìm kiếm', '1 chiến dịch đồng thời'], quotaSearch: 5, quotaCreators: 10, quotaCampaigns: 1, status: 'active', activeUsers: 489 },
  { id: 'plan_starter', name: 'Starter', priceMonth: 990000, priceYear: 9900000, description: 'Phù hợp SMB & Brand nhỏ', features: ['50 lượt tìm kiếm/tháng', '50 creator/tìm kiếm', '3 chiến dịch đồng thời', 'Export CSV', 'Email support'], quotaSearch: 50, quotaCreators: 50, quotaCampaigns: 3, status: 'active', activeUsers: 310 },
  { id: 'plan_pro', name: 'Pro', priceMonth: 2990000, priceYear: 29900000, description: 'Dành cho Brand tăng trưởng', features: ['Không giới hạn tìm kiếm', '200 creator/tìm kiếm', '10 chiến dịch đồng thời', 'AI Brief Assistant', 'CRM nâng cao', 'Priority support'], quotaSearch: 999, quotaCreators: 200, quotaCampaigns: 10, status: 'active', activeUsers: 187 },
  { id: 'plan_enterprise', name: 'Enterprise', priceMonth: 9990000, priceYear: 99900000, description: 'Giải pháp toàn diện doanh nghiệp', features: ['Tất cả tính năng Pro', 'Unlimited campaigns', 'API access', 'Custom scoring', 'Dedicated CSM', 'SLA 99.9%'], quotaSearch: 999, quotaCreators: 999, quotaCampaigns: 999, status: 'active', activeUsers: 42 },
];

// ── Payments ──────────────────────────────────
export type TxnStatus = 'paid' | 'pending' | 'refunded' | 'failed';

export interface Transaction {
  id: string;
  ref: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: string;
  amount: number;
  gateway: string;
  status: TxnStatus;
  createdAt: string;
  paidAt: string;
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'txn_1', ref: 'TXN-2610001', userId: 'usr_002', userName: 'Nguyễn Thị Mai', userEmail: 'mai.nguyen@brand.vn', plan: 'Pro', amount: 2990000, gateway: 'VNPAY', status: 'paid', createdAt: '2026-10-01 10:00', paidAt: '2026-10-01 10:02' },
  { id: 'txn_2', ref: 'TXN-2610002', userId: 'usr_007', userName: 'Nguyễn Lan Anh', userEmail: 'lananh@fashion.co', plan: 'Starter', amount: 990000, gateway: 'MoMo', status: 'pending', createdAt: '2026-10-07 07:30', paidAt: '—' },
  { id: 'txn_3', ref: 'TXN-2609091', userId: 'usr_005', userName: 'Trần Thị Hoa', userEmail: 'hoatran@beauty.com', plan: 'Pro', amount: 2990000, gateway: 'Bank Transfer', status: 'refunded', createdAt: '2026-09-09 09:00', paidAt: '2026-09-09 09:15' },
  { id: 'txn_4', ref: 'TXN-2610003', userId: 'usr_003', userName: 'Phạm Quốc Hùng', userEmail: 'hungpq@gmail.com', plan: 'Starter', amount: 990000, gateway: 'VNPAY', status: 'failed', createdAt: '2026-10-06 20:00', paidAt: '—' },
  { id: 'txn_5', ref: 'TXN-2609080', userId: 'usr_004', userName: 'Lê Văn Dũng', userEmail: 'dungadmin@influencermatch.vn', plan: 'Enterprise', amount: 9990000, gateway: 'Bank Transfer', status: 'paid', createdAt: '2026-09-08 14:00', paidAt: '2026-09-08 15:30' },
];

// NOTE: AuditLog types and MOCK_AUDIT_LOGS removed - real data from GET /admin/audit-logs
// ── Notifications ─────────────────────────────
export const ADMIN_NOTIFICATIONS = [
  { id: 'notif_1', type: 'error', title: 'Job thu thập thất bại', body: 'J-4822: YouTube quota exceeded', time: '4 giờ trước', read: false },
  { id: 'notif_2', type: 'warning', title: 'Twitter/X connector lỗi', body: '391 requests thất bại trong 24h qua', time: '6 giờ trước', read: false },
  { id: 'notif_3', type: 'info', title: 'Yêu cầu hoàn tiền', body: 'TXN-2609091 cần xử lý hoàn tiền', time: '1 ngày trước', read: true },
  { id: 'notif_4', type: 'success', title: 'Import creator thành công', body: '120 creator đã được thêm vào catalog', time: '2 ngày trước', read: true },
];
