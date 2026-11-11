export interface QualityItem {
  metricId: string;
  creatorId: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'facebook' | string;
  userName: string;
  displayName: string;
  avatarUrl?: string;
  profileUrl: string;
  niche: string;
  contentSummary: string;
  dataConfidence: number; // 0.0 -> 1.0
  collectedAt: string;
}

export interface ConflictProfile {
  id: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'facebook' | string;
  userName: string;
  displayName: string;
  avatarUrl: string;
  followers: number;
  engagementRate: number;
  niche: string;
  bioContact?: string;
  profileUrl: string;
  bioSummary: string;
}

export interface IdentityConflictItem {
  id: string;
  matchScore: number;
  conflictType: 'CROSS_PLATFORM_DUPLICATE' | 'SIMILAR_HANDLE_SAME_NICHE' | 'CONTACT_INFO_OVERLAP' | string;
  conflictLabel: string;
  detectedReason: string;
  evidenceTags: string[];
  profileA: ConflictProfile;
  profileB: ConflictProfile;
  status: 'PENDING' | 'MERGED' | 'RESOLVED_SEPARATE';
  detectedAt: string;
}

export interface QualityOverview {
  pendingCount: number;
  accuracyRate: number;
  standardizedTodayCount: number;
}

export const STANDARD_NICHES = [
  'Làm đẹp & Mỹ phẩm',
  'Chăm sóc da & Skincare',
  'Thời trang & Phụ kiện',
  'Công nghệ & Điện thoại / PC',
  'Ẩm thực & Nhà hàng',
  'Sức khỏe & Thể hình',
  'Du lịch & Trải nghiệm',
  'Mẹ & Bé',
  'Đời sống, Sức khỏe & Gia đình',
  'Truyền thông & Giải trí',
  'Tài chính & Đầu tư',
  'Sản phẩm tiêu dùng',
];

export const PLATFORM_COLOR_MAP: Record<string, string> = {
  tiktok: 'default',
  facebook: 'blue',
  instagram: 'magenta',
  youtube: 'red',
};

