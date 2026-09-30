export interface Campaign {
  id: string;
  title: string;
  tags: string[];
  thumbnail: string;
  status: 'running' | 'draft' | 'completed';
  statusText: string;
  creatorsCount: number;
  reach: string;
  reachNumber: number;
  engagement: string;
  engagementNumber: number;
  spent: string;
  spentNumber: number;
  date: string;
}

export interface StatItem {
  id: string;
  title: string;
  value: string;
  trend: string;
  isIncrease: boolean;
  color: string;
  iconBg: string;
  sparklineData: number[];
}

export interface ChartDataPoint {
  date: string;
  reach: number;       // Tiếp cận
  engagement: number;  // Tương tác
  conversion: number;  // Chuyển đổi
  cost: number;        // Chi phí
}

export const CURRENT_USER = {
  name: 'Nguyễn Thị Vân',
  role: 'Quản lý thương hiệu',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

export const STAT_CARDS_DATA: StatItem[] = [
  {
    id: 'running-campaigns',
    title: 'Chiến dịch đang chạy',
    value: '8',
    trend: '+14% so với tháng trước',
    isIncrease: true,
    color: '#6366F1',
    iconBg: '#EEF2FF',
    sparklineData: [4, 5, 5, 6, 6, 7, 7, 8],
  },
  {
    id: 'participating-creators',
    title: 'Creator tham gia',
    value: '124',
    trend: '+32% so với tháng trước',
    isIncrease: true,
    color: '#0EA5E9',
    iconBg: '#E0F2FE',
    sparklineData: [80, 88, 92, 98, 105, 112, 118, 124],
  },
  {
    id: 'total-campaign-cost',
    title: 'Tổng chi phí chiến dịch',
    value: '$48.6K',
    trend: '+21% so với tháng trước',
    isIncrease: true,
    color: '#F43F5E',
    iconBg: '#FFE4E6',
    sparklineData: [32, 35, 38, 40, 42, 45, 46, 48.6],
  },
  {
    id: 'average-roi',
    title: 'ROI chiến dịch TB',
    value: '4.8x',
    trend: '+18% so với tháng trước',
    isIncrease: true,
    color: '#10B981',
    iconBg: '#ECFDF5',
    sparklineData: [3.6, 3.8, 4.0, 4.2, 4.3, 4.5, 4.6, 4.8],
  },
];

export const FEATURED_CAMPAIGN = {
  title: 'Ra mắt Skincare Summer Glow',
  status: 'running' as const,
  statusText: 'Đang chạy',
  subtitle: 'Làm đẹp & Sức khỏe • TikTok + Instagram',
  thumbnail: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=160&auto=format&fit=crop&q=80',
  reach: '1.2M',
  reachGrowth: '+56%',
  engagement: '8.7%',
  engagementGrowth: '+42%',
  cost: '$12.4K',
  costGrowth: '+28%',
};

export const PERFORMANCE_CHART_DATA: ChartDataPoint[] = [
  { date: '15 thg 4', reach: 98, engagement: 70, conversion: 48, cost: 28 },
  { date: '18 thg 4', reach: 104, engagement: 74, conversion: 52, cost: 30 },
  { date: '21 thg 4', reach: 108, engagement: 76, conversion: 54, cost: 32 },
  { date: '24 thg 4', reach: 106, engagement: 74, conversion: 53, cost: 31 },
  { date: '27 thg 4', reach: 102, engagement: 72, conversion: 50, cost: 30 },
  { date: '30 thg 4', reach: 105, engagement: 75, conversion: 53, cost: 33 },
  { date: '3 thg 5',  reach: 110, engagement: 79, conversion: 56, cost: 35 },
  { date: '6 thg 5',  reach: 122, engagement: 85, conversion: 60, cost: 38 },
  { date: '9 thg 5',  reach: 145, engagement: 98, conversion: 68, cost: 42 },
  { date: '12 thg 5', reach: 158, engagement: 108, conversion: 75, cost: 45 },
  { date: '15 thg 5', reach: 152, engagement: 102, conversion: 71, cost: 44 },
];

export const CAMPAIGNS_DATA: Campaign[] = [
  {
    id: 'c-1',
    title: 'Ra mắt Skincare Summer Glow 2025',
    tags: ['Làm đẹp & Sức khỏe', 'TikTok + Instagram'],
    thumbnail: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&auto=format&fit=crop&q=80',
    status: 'running',
    statusText: 'Đang chạy',
    creatorsCount: 24,
    reach: '1.2M',
    reachNumber: 1200000,
    engagement: '8.7%',
    engagementNumber: 8.7,
    spent: '$12.4K',
    spentNumber: 12400,
    date: '01 thg 5, 2025',
  },
  {
    id: 'c-2',
    title: 'Đẩy mạnh Viral Serum Cấp Ẩm',
    tags: ['Chăm sóc da & Làm đẹp', 'TikTok + Instagram'],
    thumbnail: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=100&auto=format&fit=crop&q=80',
    status: 'running',
    statusText: 'Đang chạy',
    creatorsCount: 18,
    reach: '856K',
    reachNumber: 856000,
    engagement: '6.2%',
    engagementNumber: 6.2,
    spent: '$8.7K',
    spentNumber: 8700,
    date: '28 thg 4, 2025',
  },
  {
    id: 'c-3',
    title: 'Nhận diện Chăm Sóc Tóc Mùa Mưa',
    tags: ['Chăm sóc cá nhân', 'Instagram + Facebook'],
    thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&auto=format&fit=crop&q=80',
    status: 'draft',
    statusText: 'Bản nháp',
    creatorsCount: 12,
    reach: '412K',
    reachNumber: 412000,
    engagement: '4.9%',
    engagementNumber: 4.9,
    spent: '$5.2K',
    spentNumber: 5200,
    date: '18 thg 4, 2025',
  },
  {
    id: 'c-4',
    title: 'Khuyến Mãi Đón Xuân Mới',
    tags: ['Đa phân khúc', 'Khuyến mãi mùa vụ'],
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&auto=format&fit=crop&q=80',
    status: 'completed',
    statusText: 'Đã hoàn thành',
    creatorsCount: 32,
    reach: '2.3M',
    reachNumber: 2300000,
    engagement: '11.5%',
    engagementNumber: 11.5,
    spent: '$18.7K',
    spentNumber: 18700,
    date: '10 thg 3, 2025',
  },
  {
    id: 'c-5',
    title: 'Chiến Dịch Son Lì TikTok Blitz',
    tags: ['Micro Influencer', 'Mỹ phẩm'],
    thumbnail: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=100&auto=format&fit=crop&q=80',
    status: 'running',
    statusText: 'Đang chạy',
    creatorsCount: 16,
    reach: '720K',
    reachNumber: 720000,
    engagement: '7.8%',
    engagementNumber: 7.8,
    spent: '$9.6K',
    spentNumber: 9600,
    date: '22 thg 2, 2025',
  },
  {
    id: 'c-6',
    title: 'Trải Nghiệm Làm Sáng Chống Lão Hóa UGC',
    tags: ['Bác sĩ Da liễu & Chuyên gia', 'Minh chứng lâm sàng'],
    thumbnail: 'https://images.unsplash.com/photo-1512290900672-1f41d08e5c30?w=100&auto=format&fit=crop&q=80',
    status: 'running',
    statusText: 'Đang chạy',
    creatorsCount: 10,
    reach: '584K',
    reachNumber: 584000,
    engagement: '5.6%',
    engagementNumber: 5.6,
    spent: '$7.9K',
    spentNumber: 7900,
    date: '15 thg 1, 2025',
  },
];

// ==================== SUBSCRIPTION & BILLING DATA ====================

export interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  badge?: string;
  subtitle: string;
  priceMonthly: number;
  priceYearly: number;
  popular?: boolean;
  isCurrent?: boolean;
  features: PlanFeature[];
}

export interface QuotaMetric {
  id: string;
  title: string;
  used: number;
  total: number;
  unit: string;
  description: string;
  color: string;
  bgLight: string;
}

export interface PaymentInvoice {
  id: string;
  code: string;
  date: string;
  planName: string;
  billingPeriod: string;
  amount: number;
  currency: string;
  method: string;
  status: 'success' | 'pending' | 'failed';
  statusText: string;
  invoiceUrl?: string;
}

export const CURRENT_SUBSCRIPTION_INFO = {
  currentPlanId: 'plan-pro',
  currentPlanName: 'Professional',
  billingCycle: 'monthly',
  renewalDate: '18 thg 10, 2026',
  daysRemaining: 18,
  autoRenew: true,
  cardLast4: '4289',
  cardBrand: 'Visa',
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-starter',
    name: 'Starter',
    subtitle: 'Lựa chọn hoàn hảo cho thương hiệu mới bắt đầu khám phá Creator',
    priceMonthly: 1490000,
    priceYearly: 14300000, // Tiết kiệm 20%
    isCurrent: false,
    popular: false,
    features: [
      { text: 'Tối đa 3 chiến dịch hoạt động cùng lúc', included: true },
      { text: 'Khám phá 50 Creator / tháng', included: true },
      { text: 'Làm mới số liệu (Refresh) 15 Creator / tháng', included: true },
      { text: 'Bộ lọc cơ bản theo ngành hàng & nền tảng', included: true },
      { text: 'So sánh tối đa 3 Creator cùng lúc', included: true },
      { text: 'AI Brief Assistant phân tích tự động', included: false },
      { text: 'Khám phá kênh ngoài (External Discovery)', included: false },
      { text: 'Xuất báo cáo PDF & hỗ trợ ưu tiên', included: false },
    ],
  },
  {
    id: 'plan-pro',
    name: 'Professional',
    badge: 'Khuyên Dùng • Phổ Biến Nhất',
    subtitle: 'Dành cho nhãn hàng đang mở rộng quy mô chiến dịch Influencer đa kênh',
    priceMonthly: 3890000,
    priceYearly: 37340000, // Tiết kiệm 20%
    isCurrent: true,
    popular: true,
    features: [
      { text: 'Tối đa 15 chiến dịch hoạt động cùng lúc', included: true },
      { text: 'Khám phá 300 Creator / tháng', included: true },
      { text: 'Làm mới số liệu (Refresh) 50 Creator / tháng', included: true },
      { text: 'AI Brief Assistant (Phân tích ngôn ngữ tự nhiên)', included: true, highlight: true },
      { text: 'Gợi ý AI Match Score & Explanation chi tiết', included: true, highlight: true },
      { text: 'Khám phá kênh ngoài (External Discovery)', included: true },
      { text: 'So sánh 5 Creator cùng lúc & Bảng Shortlist chuyên sâu', included: true },
      { text: 'Quy trình duyệt bài (Deliverable Review) & Đo lường KPI', included: true },
      { text: 'Hỗ trợ khách hàng ưu tiên 24/7', included: true },
    ],
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    badge: 'Tập Đoàn & Agency',
    subtitle: 'Giải pháp toàn diện không giới hạn cho các tập đoàn & agency lớn',
    priceMonthly: 8990000,
    priceYearly: 86300000, // Tiết kiệm 20%
    isCurrent: false,
    popular: false,
    features: [
      { text: 'Không giới hạn số lượng chiến dịch cùng lúc', included: true },
      { text: 'Không giới hạn lượt khám phá & tìm kiếm Creator', included: true },
      { text: 'Làm mới số liệu không giới hạn', included: true },
      { text: 'AI Custom Tuning theo dữ liệu lịch sử thương hiệu', included: true, highlight: true },
      { text: 'Phân quyền đa thành viên (Multi-seat Workspace)', included: true },
      { text: 'Tích hợp API & Webhook tùy biến', included: true },
      { text: 'Báo cáo ROI/ROAS độc quyền theo yêu cầu', included: true },
      { text: 'Chuyên viên tư vấn tài khoản chuyên trách (Account Manager)', included: true },
    ],
  },
];

export const QUOTA_METRICS_DATA: QuotaMetric[] = [
  {
    id: 'q-campaigns',
    title: 'Chiến dịch đang hoạt động',
    used: 8,
    total: 15,
    unit: 'chiến dịch',
    description: 'Bao gồm chiến dịch đang chạy và bản nháp đang hoàn thiện',
    color: '#6366F1',
    bgLight: '#EEF2FF',
  },
  {
    id: 'q-discovery',
    title: 'Lượt khám phá AI Discovery',
    used: 182,
    total: 300,
    unit: 'lượt',
    description: 'Số lượt tìm kiếm thông minh và phân tích hồ sơ Creator trong tháng',
    color: '#0EA5E9',
    bgLight: '#E0F2FE',
  },
  {
    id: 'q-refresh',
    title: 'Làm mới hồ sơ (Request Refresh)',
    used: 34,
    total: 50,
    unit: 'lượt',
    description: 'Cập nhật chỉ số tương tác và follower mới nhất từ mạng xã hội',
    color: '#10B981',
    bgLight: '#ECFDF5',
  },
  {
    id: 'q-outreach',
    title: 'Creator tiếp cận qua CRM',
    used: 65,
    total: 100,
    unit: 'creator',
    description: 'Số lượng Creator được gửi lời mời hoặc quản lý trong quy trình tuyển chọn',
    color: '#F59E0B',
    bgLight: '#FEF3C7',
  },
];

export const PAYMENT_INVOICES_DATA: PaymentInvoice[] = [
  {
    id: 'inv-001',
    code: 'INV-2026-0918',
    date: '18/09/2026',
    planName: 'Gói Professional (1 Tháng)',
    billingPeriod: '18/09/2026 – 18/10/2026',
    amount: 3890000,
    currency: 'VND',
    method: 'Visa •••• 4289',
    status: 'success',
    statusText: 'Đã thanh toán',
  },
  {
    id: 'inv-002',
    code: 'INV-2026-0818',
    date: '18/08/2026',
    planName: 'Gói Professional (1 Tháng)',
    billingPeriod: '18/08/2026 – 18/09/2026',
    amount: 3890000,
    currency: 'VND',
    method: 'Visa •••• 4289',
    status: 'success',
    statusText: 'Đã thanh toán',
  },
  {
    id: 'inv-003',
    code: 'INV-2026-0718',
    date: '18/07/2026',
    planName: 'Gói Starter (Nâng cấp Pro)',
    billingPeriod: '18/07/2026 – 18/08/2026',
    amount: 2400000,
    currency: 'VND',
    method: 'Chuyển khoản VNPAY-QR',
    status: 'success',
    statusText: 'Đã thanh toán',
  },
  {
    id: 'inv-004',
    code: 'INV-2026-0618',
    date: '18/06/2026',
    planName: 'Gói Starter (1 Tháng)',
    billingPeriod: '18/06/2026 – 18/07/2026',
    amount: 1490000,
    currency: 'VND',
    method: 'Ví điện tử MoMo',
    status: 'success',
    statusText: 'Đã thanh toán',
  },
];

// ==================== BRAND PROFILE & NOTIFICATIONS DATA ====================

export interface BrandProfileData {
  brandName: string;
  tagline: string;
  logo: string;
  coverImage: string;
  legalName: string;
  taxCode: string;
  website: string;
  contactEmail: string;
  phone: string;
  headquarters: string;
  companySize: string;
  industry: string;
  subCategories: string[];
  priceSegment: string;
  targetGender: { female: number; male: number };
  targetAgeRange: string[];
  targetLocations: string[];
  customerInterests: string[];
  toneOfVoice: string[];
  usps: string[];
  guidelinesSummary: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    shopee?: string;
  };
}

export const INITIAL_BRAND_PROFILE: BrandProfileData = {
  brandName: 'GlowBeauty Vietnam',
  tagline: 'Mỹ phẩm thuần chay lành tính cho làn da châu Á',
  logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&auto=format&fit=crop&q=80',
  coverImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
  legalName: 'Công ty Cổ phần Thương mại GlowBeauty Việt Nam',
  taxCode: '0317899881',
  website: 'https://glowbeauty.vn',
  contactEmail: 'contact@glowbeauty.vn',
  phone: '(+84) 28 3910 8899',
  headquarters: 'Tòa nhà TechHub, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  companySize: '50 - 200 nhân viên',
  industry: 'Mỹ phẩm & Chăm sóc cá nhân',
  subCategories: ['Chăm sóc da (Skincare)', 'Thuần chay (Vegan)', 'Dược mỹ phẩm', 'Chống lão hóa'],
  priceSegment: 'Tầm trung - Cận cao cấp (300.000 ₫ - 800.000 ₫)',
  targetGender: { female: 75, male: 25 },
  targetAgeRange: ['18 - 24 tuổi', '25 - 34 tuổi'],
  targetLocations: ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ'],
  customerInterests: [
    'Chăm sóc da khoa học',
    'Thành phần thiên nhiên',
    'Trang điểm tự nhiên',
    'Phong cách sống lành mạnh',
  ],
  toneOfVoice: ['Thân thiện & Tận tâm', 'Khoa học & Đáng tin cậy', 'Trẻ trung, Hiện đại'],
  usps: [
    '100% Thuần chay được chứng nhận ECOCERT',
    'Chiết xuất rau má lên men độc quyền',
    'Không cồn, không hương liệu nhân tạo',
  ],
  guidelinesSummary:
    'Video review tự nhiên, nhấn mạnh cảm nhận chân thật sau 7 ngày sử dụng. Tránh nói quá công dụng tức thì. Bắt buộc có hashtag #GlowBeautyVN #GlowYourSkin.',
  socialLinks: {
    facebook: 'https://facebook.com/glowbeauty.vn',
    instagram: 'https://instagram.com/glowbeauty.official',
    tiktok: 'https://tiktok.com/@glowbeauty_vietnam',
    shopee: 'https://shopee.vn/glowbeauty_official',
  },
};

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: 'deliverable' | 'invitation' | 'quota' | 'payment' | 'system';
  timeAgo: string;
  read: boolean;
  avatar?: string;
  linkText?: string;
  linkUrl?: string;
}

export const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif-1',
    title: 'Bản video demo mới cần duyệt',
    message: 'Linh Nguyễn đã nộp bản nháp video TikTok cho chiến dịch "Ra mắt Skincare Summer Glow".',
    type: 'deliverable',
    timeAgo: '10 phút trước',
    read: false,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    linkText: 'Duyệt bài ngay',
    linkUrl: '/campaigns',
  },
  {
    id: 'notif-2',
    title: 'Lời mời hợp tác được chấp thuận',
    message: 'Creator Thu Trang đã đồng ý tham gia chiến dịch với mức thù lao thỏa thuận 8.4M.',
    type: 'invitation',
    timeAgo: '2 giờ trước',
    read: false,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    linkText: 'Xem tiến độ',
    linkUrl: '/campaign-management',
  },
  {
    id: 'notif-3',
    title: 'Cảnh báo hạn mức tìm kiếm',
    message: 'Bạn đã sử dụng 182 / 300 lượt AI Discovery trong chu kỳ này (đạt 60% hạn mức).',
    type: 'quota',
    timeAgo: '1 ngày trước',
    read: false,
    linkText: 'Xem Quota',
    linkUrl: '/subscription',
  },
  {
    id: 'notif-4',
    title: 'Thanh toán thành công',
    message: 'Hóa đơn INV-2026-0918 gói Professional (3.890.000 ₫) đã được thanh toán thành công.',
    type: 'payment',
    timeAgo: '2 ngày trước',
    read: true,
    linkText: 'Xem hóa đơn',
    linkUrl: '/subscription',
  },
  {
    id: 'notif-5',
    title: 'Hệ thống AI Discovery nâng cấp',
    message: 'Mô hình AI Match Score v2.4 đã sẵn sàng với độ chuẩn xác phân tích tương tác tăng 25%.',
    type: 'system',
    timeAgo: '4 ngày trước',
    read: true,
    linkText: 'Khám phá ngay',
    linkUrl: '/creators',
  },
];

export interface EmailAlertSettings {
  deliverableReview: boolean;
  creatorAccepted: boolean;
  quotaWarning: boolean;
  weeklyPerformanceReport: boolean;
  invoiceBilling: boolean;
  marketingUpdates: boolean;
}

export const INITIAL_EMAIL_ALERTS: EmailAlertSettings = {
  deliverableReview: true,
  creatorAccepted: true,
  quotaWarning: true,
  weeklyPerformanceReport: true,
  invoiceBilling: true,
  marketingUpdates: false,
};


