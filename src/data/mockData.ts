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
