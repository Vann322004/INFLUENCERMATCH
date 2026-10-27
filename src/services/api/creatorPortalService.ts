// ========================================================
// CREATOR PORTAL SERVICE - InfluencerMatch
// Quản lý nghiệp vụ Actor Creator:
// 1. Xác minh danh tính (Profile Verification)
// 2. Kết nối tài khoản mạng xã hội (Social Accounts)
// 3. Quản lý bảng giá niêm yết (Rate Card)
// 4. Đo lường & phân tích Reach (Reach Analytics)
// 5. Quản lý trạng thái Booking & Claim (Bookings & Claims)
// ========================================================

import apiClient from '../apiClient';

export interface CreatorIdentityVerification {
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  issueDate: string;
  issuePlace: string;
  phone: string;
  email: string;
  frontPhotoUrl?: string;
  backPhotoUrl?: string;
  selfieUrl?: string;
  status: 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: string;
  rejectReason?: string;
}

export interface CreatorSocialChannel {
  id: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'facebook';
  handle: string;
  displayName: string;
  profileUrl: string;
  avatarUrl: string;
  followers: number;
  engagementRate: number;
  connected: boolean;
  connectedAt?: string;
  syncStatus: 'SYNCED' | 'SYNCING' | 'EXPIRED';
}

export interface CreatorRateCardPackage {
  id: string;
  platform: 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE' | 'MULTI_PLATFORM';
  format: 'VIDEO' | 'REEL' | 'STORY' | 'REVIEW' | 'COMBO';
  name: string;
  description: string;
  priceVnd: number;
  turnaroundDays: number;
  usageRightsDays: number;
  deliverables: string[];
  isPopular?: boolean;
}

export interface CreatorReachMetrics {
  totalReach30d: number;
  reachGrowthMoM: number;
  totalImpressions: number;
  totalVideoViews: number;
  avgEngagementRate: number;
  avgViewsPerPost: number;
  audienceDemographics: {
    femalePct: number;
    malePct: number;
    ageGroups: { age: string; pct: number }[];
    topCities: { city: string; pct: number }[];
  };
  monthlyReachTrend: { month: string; reach: number; views: number }[];
}

export interface CreatorBookingItem {
  id: string;
  campaignId: string;
  campaignName: string;
  brandName: string;
  brandLogo: string;
  proposedBudget: number;
  deliverableType: string;
  platform: 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE';
  deadline: string;
  briefSummary: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'IN_PRODUCTION' | 'COMPLETED';
  receivedAt: string;
  brandContactEmail: string;
}

export interface CreatorClaimItem {
  id: string;
  platform: 'TikTok' | 'Instagram' | 'YouTube';
  handle: string;
  channelName: string;
  followers: number;
  channelAvatar: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  evidenceNote: string;
  evidenceUrl?: string;
  adminNote?: string;
}

// Dữ liệu mẫu khởi tạo cho Châu Bùi (Demo Creator)
const STORAGE_PREFIX = 'im_creator_portal_';

const DEFAULT_VERIFICATION: CreatorIdentityVerification = {
  fullName: 'Bùi Thái Bảo Châu',
  idNumber: '001197028491',
  dateOfBirth: '1997-11-13',
  issueDate: '2022-05-20',
  issuePlace: 'Cục Cảnh sát QLHC về TTXH',
  phone: '0988 776 655',
  email: 'creator@influencermatch.vn',
  frontPhotoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
  backPhotoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
  selfieUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400',
  status: 'VERIFIED',
  verifiedAt: '2026-10-15T14:30:00Z',
};

const DEFAULT_CHANNELS: CreatorSocialChannel[] = [
  {
    id: 'ch_1',
    platform: 'instagram',
    handle: '@chaubui_',
    displayName: 'Châu Bùi',
    profileUrl: 'https://instagram.com/chaubui_',
    avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400',
    followers: 3200000,
    engagementRate: 0.052,
    connected: true,
    connectedAt: '2026-10-01T08:00:00Z',
    syncStatus: 'SYNCED',
  },
  {
    id: 'ch_2',
    platform: 'tiktok',
    handle: '@chaukikii',
    displayName: 'Châu Bùi Official',
    profileUrl: 'https://tiktok.com/@chaukikii',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    followers: 2450000,
    engagementRate: 0.078,
    connected: true,
    connectedAt: '2026-10-05T10:30:00Z',
    syncStatus: 'SYNCED',
  },
  {
    id: 'ch_3',
    platform: 'youtube',
    handle: '@ChauBuiOfficial',
    displayName: 'Châu Bùi Official',
    profileUrl: 'https://youtube.com/@ChauBuiOfficial',
    avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400',
    followers: 685000,
    engagementRate: 0.064,
    connected: true,
    connectedAt: '2026-10-12T16:00:00Z',
    syncStatus: 'SYNCED',
  },
  {
    id: 'ch_4',
    platform: 'facebook',
    handle: 'chaubuiofficial',
    displayName: 'Châu Bùi (Fanpage)',
    profileUrl: 'https://facebook.com/chaubuiofficial',
    avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400',
    followers: 1120000,
    engagementRate: 0.041,
    connected: false,
    syncStatus: 'EXPIRED',
  },
];

const DEFAULT_RATE_CARDS: CreatorRateCardPackage[] = [
  {
    id: 'rc_1',
    platform: 'TIKTOK',
    format: 'VIDEO',
    name: '1x Video TikTok Độc quyền (Dedicated 60s)',
    description: 'Video chuyên sâu trải nghiệm sản phẩm, lồng ghép cốt truyện sáng tạo, gắn hashtag & link Bio.',
    priceVnd: 18000000,
    turnaroundDays: 3,
    usageRightsDays: 30,
    deliverables: ['1 Video TikTok HD (60s)', 'Gắn link bio 7 ngày', 'Bàn giao file MP4 sạch'],
    isPopular: true,
  },
  {
    id: 'rc_2',
    platform: 'INSTAGRAM',
    format: 'REEL',
    name: '1x Instagram Reel OOTD / Review',
    description: 'Video Reel thời thượng phong cách High Fashion, tối ưu reach qua âm nhạc trending.',
    priceVnd: 15000000,
    turnaroundDays: 2,
    usageRightsDays: 30,
    deliverables: ['1 Instagram Reel 9:16', 'Tag nhãn hàng @brand', 'Cho phép nhãn hàng Collab post'],
    isPopular: true,
  },
  {
    id: 'rc_3',
    platform: 'INSTAGRAM',
    format: 'STORY',
    name: 'Gói Story Instagram 3 Khung hình (Swipe-up/Link)',
    description: 'Bộ 3 tin Story tương tác: Teasing, Unboxing & Call-to-action vuốt mua hàng.',
    priceVnd: 6000000,
    turnaroundDays: 1,
    usageRightsDays: 7,
    deliverables: ['3 Stories kèm Sticker Link', 'Báo cáo chụp số lượt xem sau 24h'],
  },
  {
    id: 'rc_4',
    platform: 'YOUTUBE',
    format: 'REVIEW',
    name: '1x Video YouTube In-depth Vlog & Review',
    description: 'Thời lượng 10-15 phút, lồng ghép sản phẩm tự nhiên trong Vlog phong cách sống hoặc Get Ready With Me.',
    priceVnd: 32000000,
    turnaroundDays: 7,
    usageRightsDays: 90,
    deliverables: ['Video 4K thời lượng 10-15p', 'Pin comment link mua hàng', 'Thumbnail thiết kế riêng'],
  },
  {
    id: 'rc_5',
    platform: 'MULTI_PLATFORM',
    format: 'COMBO',
    name: 'Gói Phủ sóng Toàn diện (TikTok + Reel + Story)',
    description: 'Tối ưu độ phủ đa kênh: 1 TikTok Video + 1 Instagram Reel + 1 Story 3 frames.',
    priceVnd: 35000000,
    turnaroundDays: 4,
    usageRightsDays: 60,
    deliverables: ['1 TikTok Video 60s', '1 Instagram Reel Collab', 'Bộ 3 Instagram Stories', 'Tặng 1 post Facebook'],
    isPopular: true,
  },
];

const DEFAULT_METRICS: CreatorReachMetrics = {
  totalReach30d: 8420000,
  reachGrowthMoM: 14.8,
  totalImpressions: 12650000,
  totalVideoViews: 5890000,
  avgEngagementRate: 5.8,
  avgViewsPerPost: 285000,
  audienceDemographics: {
    femalePct: 68,
    malePct: 32,
    ageGroups: [
      { age: '18 - 24', pct: 54 },
      { age: '25 - 34', pct: 33 },
      { age: '35 - 44', pct: 9 },
      { age: 'Khác', pct: 4 },
    ],
    topCities: [
      { city: 'TP. Hồ Chí Minh', pct: 46 },
      { city: 'Hà Nội', pct: 38 },
      { city: 'Đà Nẵng', pct: 8 },
      { city: 'Các tỉnh khác', pct: 8 },
    ],
  },
  monthlyReachTrend: [
    { month: 'T5', reach: 6200000, views: 4100000 },
    { month: 'T6', reach: 6800000, views: 4500000 },
    { month: 'T7', reach: 7100000, views: 4900000 },
    { month: 'T8', reach: 7600000, views: 5200000 },
    { month: 'T9', reach: 7900000, views: 5400000 },
    { month: 'T10', reach: 8420000, views: 5890000 },
  ],
};

const DEFAULT_BOOKINGS: CreatorBookingItem[] = [
  {
    id: 'bk_001',
    campaignId: 'cp_101',
    campaignName: 'Chiến dịch Kem Chống Nắng Phục Hồi Mùa Hè 2026',
    brandName: "L'Oréal Paris Vietnam",
    brandLogo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100',
    proposedBudget: 35000000,
    deliverableType: '1x TikTok Video + 1x Instagram Reel',
    platform: 'TIKTOK',
    deadline: '2026-11-15',
    briefSummary: 'Review trải nghiệm lớp finish mỏng nhẹ của kem chống nắng kiềm dầu, quay thực tế khi dạo phố.',
    status: 'PENDING',
    receivedAt: '2026-10-26T14:30:00Z',
    brandContactEmail: 'campaign.loreal@agency.vn',
  },
  {
    id: 'bk_002',
    campaignId: 'cp_102',
    campaignName: 'Ra mắt Serum Cấp Ẩm Phục Hồi B5 Ultra',
    brandName: 'La Roche-Posay',
    brandLogo: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100',
    proposedBudget: 28000000,
    deliverableType: '1x Instagram Reel + 3 Stories',
    platform: 'INSTAGRAM',
    deadline: '2026-11-05',
    briefSummary: 'Chia sẻ routine dưỡng ẩm tối giản cho da nhạy cảm sau peel hoặc dùng treatment.',
    status: 'ACCEPTED',
    receivedAt: '2026-10-22T09:15:00Z',
    brandContactEmail: 'booking@larocheposay.vn',
  },
  {
    id: 'bk_003',
    campaignId: 'cp_103',
    campaignName: 'Bộ Sưu Tập Thu Đông Casual Streetwear 2026',
    brandName: 'Coolmate Vietnam',
    brandLogo: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=100',
    proposedBudget: 22000000,
    deliverableType: '1x TikTok Video OOTD Mix & Match',
    platform: 'TIKTOK',
    deadline: '2026-10-30',
    briefSummary: 'Biến hóa 3 phong cách phối đồ năng động với áo khoác bomber và quần jeans ống suông.',
    status: 'COMPLETED',
    receivedAt: '2026-10-10T11:00:00Z',
    brandContactEmail: 'partner@coolmate.me',
  },
];

const DEFAULT_CLAIMS: CreatorClaimItem[] = [
  {
    id: 'clm_c_01',
    platform: 'Instagram',
    handle: '@chaubui_',
    channelName: 'Châu Bùi (Official Instagram)',
    followers: 3200000,
    channelAvatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400',
    status: 'APPROVED',
    submittedAt: '2026-10-01T09:30:00Z',
    evidenceNote: 'Xác minh tài khoản Instagram có tích xanh chính chủ qua Instagram Graph API token.',
    adminNote: 'Đã xác minh đối chiếu giấy tờ tùy thân CCCD trùng khớp. Cấp huy hiệu Verified Creator.',
  },
  {
    id: 'clm_c_02',
    platform: 'TikTok',
    handle: '@chaukikii',
    channelName: 'Châu Bùi TikTok',
    followers: 2450000,
    channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    status: 'PENDING',
    submittedAt: '2026-10-25T16:20:00Z',
    evidenceNote: 'Đính kèm ảnh chụp màn hình TikTok Studio Creator Center và mã xác minh số điện thoại chính chủ.',
    adminNote: 'Đang trong hàng đợi kiểm định của Data Manager.',
  },
];

export const creatorPortalService = {
  /** 1. Lấy thông tin xác minh hồ sơ */
  getVerification(): CreatorIdentityVerification {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'verification');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_VERIFICATION;
  },

  /** 1b. Gửi hồ sơ xác minh CCCD */
  saveVerification(data: Partial<CreatorIdentityVerification>): CreatorIdentityVerification {
    const current = this.getVerification();
    const updated: CreatorIdentityVerification = {
      ...current,
      ...data,
      status: 'PENDING_REVIEW',
    };
    try {
      localStorage.setItem(STORAGE_PREFIX + 'verification', JSON.stringify(updated));
    } catch {}
    return updated;
  },

  /** 2. Lấy danh sách kênh mạng xã hội */
  getChannels(): CreatorSocialChannel[] {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'channels');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CHANNELS;
  },

  /** 2b. Kết nối hoặc ngắt kết nối kênh */
  toggleChannelConnection(channelId: string, connect: boolean): CreatorSocialChannel[] {
    const list = this.getChannels().map((ch) =>
      ch.id === channelId
        ? {
            ...ch,
            connected: connect,
            connectedAt: connect ? new Date().toISOString() : undefined,
            syncStatus: connect ? ('SYNCED' as const) : ('EXPIRED' as const),
          }
        : ch
    );
    try {
      localStorage.setItem(STORAGE_PREFIX + 'channels', JSON.stringify(list));
    } catch {}
    return list;
  },

  /** 3. Lấy bảng giá Rate Card */
  getRateCards(): CreatorRateCardPackage[] {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'rate_cards');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_RATE_CARDS;
  },

  /** 3b. Lưu toàn bộ bảng giá Rate Card */
  saveRateCards(packages: CreatorRateCardPackage[]): CreatorRateCardPackage[] {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'rate_cards', JSON.stringify(packages));
    } catch {}
    return packages;
  },

  /** 3c. Thêm hoặc cập nhật gói Rate Card */
  upsertRateCard(pkg: CreatorRateCardPackage): CreatorRateCardPackage[] {
    const current = this.getRateCards();
    const index = current.findIndex((p) => p.id === pkg.id);
    let updated: CreatorRateCardPackage[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = pkg;
    } else {
      updated = [pkg, ...current];
    }
    return this.saveRateCards(updated);
  },

  /** 3d. Xóa gói Rate Card */
  deleteRateCard(id: string): CreatorRateCardPackage[] {
    const updated = this.getRateCards().filter((p) => p.id !== id);
    return this.saveRateCards(updated);
  },

  /** 4. Lấy chỉ số đo lường Reach & Audience */
  getReachMetrics(): CreatorReachMetrics {
    return DEFAULT_METRICS;
  },

  /** 5. Lấy danh sách Booking hợp tác */
  getBookings(): CreatorBookingItem[] {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'bookings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_BOOKINGS;
  },

  /** 5b. Phản hồi Booking (Đồng ý hoặc Từ chối) */
  respondBooking(bookingId: string, status: 'ACCEPTED' | 'DECLINED'): CreatorBookingItem[] {
    const current = this.getBookings();
    const updated = current.map((b) => (b.id === bookingId ? { ...b, status } : b));
    try {
      localStorage.setItem(STORAGE_PREFIX + 'bookings', JSON.stringify(updated));
    } catch {}
    return updated;
  },

  /** 6. Lấy danh sách Claim kênh KOC */
  getClaims(): CreatorClaimItem[] {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'claims');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CLAIMS;
  },

  /** 6b. Nộp yêu cầu Claim kênh mới */
  submitClaim(payload: Omit<CreatorClaimItem, 'id' | 'status' | 'submittedAt'>): CreatorClaimItem {
    const current = this.getClaims();
    const newClaim: CreatorClaimItem = {
      ...payload,
      id: 'clm_c_' + Date.now(),
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };
    const updated = [newClaim, ...current];
    try {
      localStorage.setItem(STORAGE_PREFIX + 'claims', JSON.stringify(updated));
    } catch {}
    return newClaim;
  },
};
