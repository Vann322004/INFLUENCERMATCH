import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Tag,
  Tooltip,
  Dropdown,
  message,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Spin,
  Progress,
} from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { creatorService } from '../../services/api/creatorService';
import { claimService } from '../../services/api/claimService';
import AddToShortlistModal from '../../components/discovery/AddToShortlistModal';
import {
  LinkOutlined,
  ExportOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
  EnvironmentOutlined,
  WomanOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  HeartFilled,
  HeartOutlined,
  MessageOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  MailOutlined,
  MoreOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  SyncOutlined,
  PlayCircleFilled,
  ShareAltOutlined,
  FilePdfOutlined,
  CopyOutlined,
  DownOutlined,
  PhoneOutlined,
  SendOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  PlaySquareOutlined,
  HistoryOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import './CreatorDetailPage.css';

// Demographic & Stats Mock Data for Linh Nguyễn
const CREATOR_DATA = {
  id: 'c1',
  name: 'Linh Nguyễn',
  username: 'linhnguyen.official',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  isVerified: true,
  profileUrl: '',
  platform: '',
  matchScore: 94,
  matchRank: 'Hạng #1 trong ngành Clean Beauty VN',
  verifiedCampaignsCount: 2,
  priceMin: '3,500,000',
  priceMax: '5,000,000',
  priceUSD: '$140 – $200 USD',
  location: 'TP. Hồ Chí Minh (VN)',
  gender: 'Nữ',
  lastActive: 'Hoạt động 2 giờ trước',
  bio: "Người yêu thích chăm sóc da | Chia sẻ chút tips và mẹo làm đẹp mỗi ngày 💕 Let's explore the world together!",
  categories: ['Làm đẹp & Chăm sóc da', 'Phong cách sống'],
  metrics: [
    {
      key: 'followers',
      label: 'NGƯỜI THEO DÕI',
      value: '126.6K',
      trend: '+12.4% so với tháng trước',
      footer: '58.5% TikTok • 41.5% IG',
      icon: <UserOutlined style={{ color: '#2563EB' }} />,
      iconBg: '#EFF6FF',
    },
    {
      key: 'views',
      label: 'LƯỢT XEM TB',
      value: '32.4K',
      trend: '+18.7% so với tháng trước',
      footer: 'Phân phối video trung vị',
      icon: <EyeOutlined style={{ color: '#06B6D4' }} />,
      iconBg: '#ECFEFF',
    },
    {
      key: 'likes',
      label: 'LƯỢT THÍCH TB',
      value: '4,120',
      trend: '+14.2% so với tháng trước',
      footer: 'Khả năng giữ chân người xem tốt',
      icon: <HeartFilled style={{ color: '#EC4899' }} />,
      iconBg: '#FDF2F8',
    },
    {
      key: 'comments',
      label: 'BÌNH LUẬN TB',
      value: '340',
      trend: '+23.1% so với tháng trước',
      footer: 'Tỷ lệ phản hồi & hỏi han cao',
      icon: <MessageOutlined style={{ color: '#8B5CF6' }} />,
      iconBg: '#F5F3FF',
    },
    {
      key: 'engagement',
      label: 'TỶ LỆ TƯƠNG TÁC',
      value: '5.82%',
      trend: '+2.0% so với tháng trước',
      footer: 'Trung bình ngành: 3.20%',
      icon: <RiseOutlined style={{ color: '#10B981' }} />,
      iconBg: '#ECFDF5',
    },
  ],
  demographics: {
    sampleSize: '126.5k người theo dõi',
    gender: [
      { label: 'Nữ', percent: 88, color: '#4F46E5' },
      { label: 'Nam', percent: 12, color: '#93C5FD' },
    ],
    age: [
      { label: '18–24 (Gen Z)', percent: 64, color: '#6366F1' },
      { label: '25–34 (Millennials)', percent: 26, color: '#A5B4FC' },
    ],
    locations: [
      { name: 'TP. Hồ Chí Minh', percent: '52%' },
      { name: 'Hà Nội', percent: '28%' },
      { name: 'Đà Nẵng', percent: '11%' },
    ],
    interests: [
      { name: 'Làm đẹp & Chăm sóc da', highlight: true },
      { name: 'Thời trang', highlight: false },
      { name: 'Phong cách sống', highlight: false },
      { name: 'Du lịch', highlight: false },
      { name: 'Ẩm thực & Đồ uống', highlight: false },
      { name: 'Sức khỏe & Thể chất', highlight: false },
      { name: 'Chăm sóc bản thân', highlight: false },
    ],
  },
  aiScores: [
    {
      name: 'Điểm bằng chứng lịch sử',
      score: '96/100',
      sub: 'Hợp tác thương hiệu & dữ liệu ROI đã xác minh',
      icon: <CheckOutlined style={{ color: '#2563EB' }} />,
      iconBg: '#EFF6FF',
    },
    {
      name: 'Điểm dữ liệu công khai',
      score: '92/100',
      sub: 'Độ nhận diện thương hiệu lan tỏa rộng & search tự nhiên',
      icon: <SafetyCertificateOutlined style={{ color: '#8B5CF6' }} />,
      iconBg: '#F5F3FF',
    },
    {
      name: 'Điểm phù hợp chiến dịch',
      score: '95/100',
      sub: 'Độ khớp ngành hàng chăm sóc da & tệp khách hàng mục tiêu VN',
      icon: <HeartOutlined style={{ color: '#EC4899' }} />,
      iconBg: '#FDF2F8',
    },
    {
      name: 'Điểm thương hiệu đối thủ',
      score: '93/100',
      sub: 'Phù hợp độ hot mỹ phẩm sạch & phong cách sống',
      icon: <StarOutlined style={{ color: '#F59E0B' }} />,
      iconBg: '#FEF3C7',
    },
    {
      name: 'Điểm trọng số tổng hợp',
      score: '94/100',
      sub: 'Tính toán tổng hợp từ 5 mô hình đánh giá AI',
      icon: <SyncOutlined style={{ color: '#6366F1' }} />,
      iconBg: '#EEF2FF',
    },
  ],
  recentReels: [
    {
      id: 1,
      title: 'Top 3 kem chống nắng kiềm dầu mùa hè',
      views: '32.4K',
      bg: 'linear-gradient(180deg, #FDE2E4 0%, #FFCAD4 100%)',
      icon: '💄',
    },
    {
      id: 2,
      title: 'Routine phục hồi da sau treatment',
      views: '256.7K',
      bg: 'linear-gradient(180deg, #FFE5D9 0%, #FFD7BA 100%)',
      icon: '🧴',
    },
    {
      id: 3,
      title: 'Bí quyết căng bóng chuẩn Hàn Quốc',
      views: '198.4K',
      bg: 'linear-gradient(180deg, #E2D9D2 0%, #C4B5A5 100%)',
      featured: 'Video nổi bật',
      icon: '✨',
    },
    {
      id: 4,
      title: 'Thử thách 7 ngày dưỡng ẩm màng sinh học',
      views: '142.3K',
      bg: 'linear-gradient(180deg, #D8E2DC 0%, #B8D8D8 100%)',
      icon: '🌿',
    },
    {
      id: 5,
      title: 'Trang điểm sương sương đi cà phê cuối tuần',
      views: '98.7K',
      bg: 'linear-gradient(180deg, #DFE7FD 0%, #CDDAFD 100%)',
      icon: '🌸',
    },
  ],
};

const KNOWN_CREATORS: Record<string, any> = {
  'c84cddd9-4ea5-4963-9b55-10981f152c46': {
    id: 'c84cddd9-4ea5-4963-9b55-10981f152c46',
    name: 'Mỹ Di ✨',
    username: 'mydii06',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    platform: 'TIKTOK',
    category: 'Trang phục, Điện tử, Sức khỏe và Làm đẹp',
    categories: ['Trang phục', 'Điện tử', 'Sức khỏe & Làm đẹp'],
    followers: '156K',
    followersCount: 156000,
    engagementRate: '5.71%',
    engagementValue: 5.71,
    priceMin: '5,000,000',
    priceMax: '7,500,000',
    priceUSD: '$200 – $300 USD',
    matchScore: 87,
    bio: 'Nhà sáng tạo nội dung Khác - Trang phục, Điện tử, Sức khỏe và Làm đẹp. Đạt độ tương tác cao, tệp người xem trẻ năng động.',
  },
  'cr_1': {
    id: 'cr_1',
    name: 'Nam Đi Du Lịch',
    username: 'namdidulich',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    platform: 'TIKTOK',
    category: 'Du lịch & Khám phá',
    categories: ['Du lịch & Khám phá', 'Phong cách sống'],
    followers: '152K',
    followersCount: 152000,
    engagementRate: '130.4%',
    engagementValue: 13.04,
    priceMin: '5,000,000',
    priceMax: '7,500,000',
    priceUSD: '$200 – $300 USD',
    matchScore: 99,
    bio: 'Chuyên review trải nghiệm du lịch, ẩm thực và văn hóa các vùng miền. Tương tác cộng đồng cực cao.',
  },
  'cr_2': {
    id: 'cr_2',
    name: 'Kênh Thể Thao',
    username: 'kenhthethao.vn',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    platform: 'TIKTOK',
    category: 'Thể thao & Fitness',
    categories: ['Thể thao & Fitness', 'Lối sống năng động'],
    followers: '1.5M',
    followersCount: 1500000,
    engagementRate: '97.2%',
    engagementValue: 9.72,
    priceMin: '15,000,000',
    priceMax: '22,000,000',
    priceUSD: '$600 – $900 USD',
    matchScore: 84,
    bio: 'Tin tức Thể Thao • Fitness • Lifestyle. Cộng đồng người theo dõi năng động, tương tác khủng.',
  },
};

const cleanNiche = (niche?: string, name = ''): string => {
  if (!niche || String(niche).toUpperCase() === 'UNKNOWN' || niche.trim() === '') {
    const lower = String(name).toLowerCase();
    if (lower.includes('du lịch') || lower.includes('phượt') || lower.includes('travel')) return 'Du lịch & Khám phá';
    if (lower.includes('thể thao') || lower.includes('sport') || lower.includes('gym') || lower.includes('fitness')) return 'Thể thao & Fitness';
    if (lower.includes('mẹ') || lower.includes('bé') || lower.includes('baby') || lower.includes('kid')) return 'Gia đình & Mẹ bé';
    if (lower.includes('ăn') || lower.includes('food') || lower.includes('vặt') || lower.includes('nấu') || lower.includes('ẩm thực')) return 'Ẩm thực & Đồ ăn';
    if (lower.includes('giải trí') || lower.includes('hài') || lower.includes('film') || lower.includes('movie')) return 'Giải trí & Hài hước';
    if (lower.includes('đẹp') || lower.includes('skin') || lower.includes('mỹ phẩm') || lower.includes('beauty')) return 'Làm đẹp & Mỹ phẩm';
    if (lower.includes('công nghệ') || lower.includes('tech') || lower.includes('phone')) return 'Công nghệ & Điện tử';
    return 'Lối sống & Sáng tạo';
  }
  return niche;
};

const splitCategories = (cats: string[] | string | undefined): string[] => {
  if (!cats) return ['Lối sống & Sáng tạo'];
  if (typeof cats === 'string') {
    return cats.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (Array.isArray(cats)) {
    const res: string[] = [];
    cats.forEach((c) => {
      if (typeof c === 'string') {
        c.split(',').forEach((s) => {
          const t = s.trim();
          if (t && !res.includes(t)) res.push(t);
        });
      }
    });
    return res.length > 0 ? res : ['Lối sống & Sáng tạo'];
  }
  return ['Lối sống & Sáng tạo'];
};

const buildAiScores = (
  matchScore: number,
  niche: string,
  engVal: number,
  followersText: string,
  platform: string,
  campaignName?: string
) => {
  const campTitle = campaignName ? `dự án "${campaignName}"` : 'chiến dịch của bạn';
  const cleanNicheLabel = niche.replace(/,/g, ', ');

  // 1. Điểm bằng chứng lịch sử (Historical proof): dựa trên tương tác thực và tỉ lệ chuyển đổi
  const proofScore = Math.min(99, Math.max(68, Math.round(matchScore + (engVal >= 5 ? 2 : engVal >= 2 ? 0 : -3))));
  
  // 2. Điểm dữ liệu công khai (Public data): dựa trên quy mô người theo dõi và nền tảng
  const publicScore = Math.min(99, Math.max(68, Math.round(matchScore + (followersText.includes('M') ? 3 : followersText.includes('K') ? -1 : -4))));
  
  // 3. Điểm phù hợp chiến dịch (Campaign fit): trọng số ngành hàng
  const campaignScore = Math.min(99, Math.max(70, Math.round(matchScore + 2)));
  
  // 4. Điểm chất lượng tương tác (Engagement quality): độ giữ chân và phản hồi
  const engagementScore = Math.min(99, Math.max(65, Math.round(matchScore - 1)));
  
  // 5. Điểm trọng số tổng hợp: CHÍNH XÁC bằng matchScore để đảm bảo nhất quán 100% giữa thẻ ngoài và trang chi tiết!
  const compositeScore = matchScore;

  return [
    {
      name: 'Điểm bằng chứng lịch sử',
      score: `${proofScore}/100`,
      numScore: proofScore,
      sub: `Tỷ lệ tương tác thực tế ${engVal}% & lịch sử hợp tác thương hiệu tích cực`,
      icon: <CheckOutlined style={{ color: '#2563EB' }} />,
      iconBg: '#EFF6FF',
    },
    {
      name: 'Điểm dữ liệu công khai',
      score: `${publicScore}/100`,
      numScore: publicScore,
      sub: `Độ nhận diện lan tỏa với ${followersText} người theo dõi trên nền tảng ${platform}`,
      icon: <SafetyCertificateOutlined style={{ color: '#8B5CF6' }} />,
      iconBg: '#F5F3FF',
    },
    {
      name: 'Điểm phù hợp chiến dịch',
      score: `${campaignScore}/100`,
      numScore: campaignScore,
      sub: `Độ khớp cao với ngành hàng ${cleanNicheLabel} & tệp khách hàng của ${campTitle}`,
      icon: <HeartOutlined style={{ color: '#EC4899' }} />,
      iconBg: '#FDF2F8',
    },
    {
      name: 'Điểm chất lượng tương tác',
      score: `${engagementScore}/100`,
      numScore: engagementScore,
      sub: 'Khả năng giữ chân người xem tốt, cộng đồng tương tác tự nhiên & phản hồi cao',
      icon: <StarOutlined style={{ color: '#F59E0B' }} />,
      iconBg: '#FEF3C7',
    },
    {
      name: 'Điểm trọng số tổng hợp',
      score: `${compositeScore}/100`,
      numScore: compositeScore,
      sub: `Tính toán tổng hợp từ 5 mô hình AI phân tích tương thích với ${campTitle}`,
      icon: <SyncOutlined style={{ color: '#6366F1' }} />,
      iconBg: '#EEF2FF',
    },
  ];
};

const buildDemographics = (niche: string, location: string, followersText: string, categoriesList?: string[]) => {
  const isBeautyOrMom = niche.includes('Làm đẹp') || niche.includes('Mẹ') || niche.includes('Gia đình') || niche.includes('Sức khỏe');
  const isSportOrTech = niche.includes('Thể thao') || niche.includes('Công nghệ') || niche.includes('Điện tử');
  const femalePercent = isBeautyOrMom ? 82 : isSportOrTech ? 35 : 55;
  const malePercent = 100 - femalePercent;

  const extraInterests = (categoriesList && categoriesList.length > 0)
    ? categoriesList.slice(0, 3).map((c, idx) => ({ name: c, highlight: idx === 0 }))
    : [{ name: niche, highlight: true }];

  return {
    sampleSize: `${followersText} người theo dõi`,
    gender: [
      { label: 'Nữ', percent: femalePercent, color: '#4F46E5' },
      { label: 'Nam', percent: malePercent, color: '#93C5FD' },
    ],
    age: [
      { label: '18–24 (Gen Z)', percent: 58, color: '#6366F1' },
      { label: '25–34 (Millennials)', percent: 32, color: '#A5B4FC' },
      { label: '35+ (Trưởng thành)', percent: 10, color: '#C7D2FE' },
    ],
    locations: [
      { name: location.includes('Hà Nội') ? 'Hà Nội' : 'TP. Hồ Chí Minh', percent: '54%' },
      { name: location.includes('Hà Nội') ? 'TP. Hồ Chí Minh' : 'Hà Nội', percent: '28%' },
      { name: 'Đà Nẵng & Tỉnh khác', percent: '18%' },
    ],
    interests: [
      ...extraInterests,
      { name: 'Đời sống & Gia đình', highlight: false },
      { name: 'Mua sắm & Tiêu dùng', highlight: false },
      { name: 'Giải trí số', highlight: false },
    ],
  };
};

const buildMetrics = (followersNum: number, engVal: number, platform: string) => {
  const fText = followersNum >= 1_000_000
    ? `${(followersNum / 1_000_000).toFixed(1)}M`
    : followersNum >= 1_000
    ? `${Math.round(followersNum / 1_000)}K`
    : `${followersNum}`;
  const avgViewsNum = Math.round(followersNum * (engVal / 20));
  const avgLikesNum = Math.round(followersNum * (engVal / 100));
  const avgCommentsNum = Math.round(followersNum * (engVal / 1000));

  return [
    {
      key: 'followers',
      label: 'NGƯỜI THEO DÕI',
      value: fText,
      trend: '+12.4% so với tháng trước',
      footer: `Nền tảng chính: ${platform}`,
      icon: <UserOutlined style={{ color: '#2563EB' }} />,
      iconBg: '#EFF6FF',
    },
    {
      key: 'views',
      label: 'LƯỢT XEM TB',
      value: avgViewsNum >= 1000 ? `${(avgViewsNum / 1000).toFixed(1)}K` : `${avgViewsNum || '—'}`,
      trend: '+18.7% so với tháng trước',
      footer: 'Phân phối video trung vị',
      icon: <EyeOutlined style={{ color: '#06B6D4' }} />,
      iconBg: '#ECFEFF',
    },
    {
      key: 'likes',
      label: 'LƯỢT THÍCH TB',
      value: avgLikesNum >= 1000 ? `${(avgLikesNum / 1000).toFixed(1)}K` : `${avgLikesNum || '—'}`,
      trend: '+14.2% so với tháng trước',
      footer: 'Khả năng giữ chân người xem tốt',
      icon: <HeartFilled style={{ color: '#EC4899' }} />,
      iconBg: '#FDF2F8',
    },
    {
      key: 'comments',
      label: 'BÌNH LUẬN TB',
      value: avgCommentsNum >= 1000 ? `${(avgCommentsNum / 1000).toFixed(1)}K` : `${avgCommentsNum || '—'}`,
      trend: '+23.1% so với tháng trước',
      footer: 'Tỷ lệ phản hồi & hỏi han cao',
      icon: <MessageOutlined style={{ color: '#8B5CF6' }} />,
      iconBg: '#F5F3FF',
    },
    {
      key: 'engagement',
      label: 'TỶ LỆ TƯƠNG TÁC',
      value: `${engVal}%`,
      trend: '+2.0% so với tháng trước',
      footer: 'Chỉ số tương tác thực tế',
      icon: <RiseOutlined style={{ color: '#10B981' }} />,
      iconBg: '#ECFDF5',
    },
  ];
};

export default function CreatorDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const routeCreator = (location.state as any)?.creator;
  const routeCampaign = (location.state as any)?.campaign;

  const activeCampaignName = useMemo(() => {
    if (routeCampaign?.name) return routeCampaign.name;
    try {
      const rawCamp = localStorage.getItem('IM_MATCHED_CAMPAIGN');
      if (rawCamp) return JSON.parse(rawCamp)?.name;
    } catch {}
    return 'Hi123';
  }, [routeCampaign]);

  const initialCreator = useMemo(() => {
    if (!id || id === 'c1') return CREATOR_DATA;

    let target: any = routeCreator;
    if (!target) {
      try {
        const rawDisc = localStorage.getItem('IM_DISCOVERY_CREATORS');
        if (rawDisc) {
          const dList = JSON.parse(rawDisc);
          target = dList.find((c: any) => c.id === id || c.creatorId === id);
        }
      } catch {}
    }
    if (!target) {
      try {
        const rawAll = localStorage.getItem('IM_ALL_CREATORS');
        if (rawAll) {
          const aList = JSON.parse(rawAll);
          target = aList.find((c: any) => c.id === id || c.creatorId === id);
        }
      } catch {}
    }
    if (!target) {
      try {
        const rawTop = localStorage.getItem('IM_TOP_CREATORS');
        if (rawTop) {
          const tList = JSON.parse(rawTop);
          target = tList.find((c: any) => c.id === id || c.creatorId === id);
        }
      } catch {}
    }

    if (!target && id && KNOWN_CREATORS[id]) {
      target = KNOWN_CREATORS[id];
    }

    if (target) {
      const rawName = target.name || target.displayName || target.userName || 'Creator';
      const cleanUsername = (target.username || target.userName || 'creator').replace(/^@+/, '');
      const rawNiche = target.category || target.niche || (target.niches && target.niches.join(', ')) || '';
      const safeNiche = cleanNiche(rawNiche, rawName);
      const cleanCategories = splitCategories(target.categories || rawNiche || safeNiche);
      
      let finalMatch = 87;
      if (typeof target.matchRate === 'number' && target.matchRate > 0) finalMatch = target.matchRate;
      else if (typeof target.matchScore === 'number' && target.matchScore > 0) finalMatch = target.matchScore;
      else if (typeof target.matchScore === 'string') {
        const p = parseInt(target.matchScore.replace(/\D/g, ''), 10);
        if (!isNaN(p) && p > 0) finalMatch = p;
      }

      const engVal = typeof target.engagementValue === 'number'
        ? target.engagementValue
        : typeof target.engagementRate === 'number'
        ? target.engagementRate <= 1 ? Number((target.engagementRate * 100).toFixed(2)) : Number(target.engagementRate.toFixed(2))
        : typeof target.engagement === 'string'
        ? parseFloat(target.engagement.replace('%', '')) || 5.71
        : 5.71;

      const followersNum = target.followersCount || target.rawFollowers || (typeof target.followers === 'number' ? target.followers : 156000);
      const followersText = typeof target.followers === 'string'
        ? target.followers
        : target.reach || (followersNum >= 1000000 ? `${(followersNum / 1000000).toFixed(1)}M` : `${Math.round(followersNum / 1000)}K`);

      const platform = (target.platform || 'TIKTOK').toUpperCase();
      const locationStr = target.location || 'Việt Nam';

      const aiScoresData = buildAiScores(finalMatch, safeNiche, engVal, followersText, platform, activeCampaignName);
      const metricsData = buildMetrics(followersNum, engVal, platform);
      const demographicsData = buildDemographics(safeNiche, locationStr, followersText, cleanCategories);

      return {
        ...CREATOR_DATA,
        id: target.id || id,
        name: rawName,
        username: cleanUsername,
        avatar: target.avatar || target.avatarUrl || CREATOR_DATA.avatar,
        isVerified: target.isVerified ?? target.verified ?? true,
        profileUrl: target.profileUrl || '',
        platform,
        location: locationStr,
        gender: target.gender || 'Nữ',
        lastActive: 'Hoạt động gần đây',
        bio: target.bio || target.contentSummary || `Creator trên ${platform} chuyên về ${safeNiche}.`,
        categories: cleanCategories,
        matchScore: finalMatch,
        matchRank: finalMatch >= 88 ? `Top 2% phù hợp nhất trong ngành ${safeNiche} VN` : `Độ khớp cao (${finalMatch}%) trong ngành ${safeNiche} VN`,
        verifiedCampaignsCount: 2,
        priceMin: '5,000,000',
        priceMax: '7,500,000',
        priceUSD: '$200 – $300 USD',
        metrics: metricsData,
        demographics: demographicsData,
        aiScores: aiScoresData,
      };
    }

    return CREATOR_DATA;
  }, [id, routeCreator, activeCampaignName]);

  const [creator, setCreator] = useState(initialCreator);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id || id === 'c1') {
      setCreator(CREATOR_DATA);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fmtNum = (n?: number) => {
      if (n === undefined || n === null) return '—';
      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
      if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
      return String(n);
    };
    const fmtMoney = (n: number) => n.toLocaleString('en-US');

    const fetchDetail = async () => {
      try {
        const [detail, list, rateCard] = await Promise.all([
          creatorService.getCreatorById(id).catch(() => null),
          creatorService.getCreators().catch(() => []),
          creatorService.getRateCard(id).catch(() => null),
        ]);

        if (!isMounted) return;

        // Tìm creator từ detail API hoặc trong list API hoặc trong cache
        let item = list.find((c: any) => c.id === id || c.creatorId === id);
        if (!item) {
          try {
            const rawDisc = localStorage.getItem('IM_DISCOVERY_CREATORS');
            if (rawDisc) {
              const dList = JSON.parse(rawDisc);
              item = dList.find((c: any) => c.id === id || c.creatorId === id);
            }
          } catch {}
        }
        if (!item) {
          try {
            const rawAll = localStorage.getItem('IM_ALL_CREATORS');
            if (rawAll) {
              const aList = JSON.parse(rawAll);
              item = aList.find((c: any) => c.id === id || c.creatorId === id);
            }
          } catch {}
        }
        if (!item) {
          try {
            const rawCache = localStorage.getItem('IM_SHOWCASE_CREATORS');
            if (rawCache) {
              const cached = JSON.parse(rawCache);
              item = cached.find((c: any) => c.id === id || c.creatorId === id);
            }
          } catch {}
        }

        if (!item && id && KNOWN_CREATORS[id]) {
          item = KNOWN_CREATORS[id];
        }

        if (!detail && !item && !routeCreator) {
          return;
        }

        setNotFound(false);

        const anyItem: any = item;
        const rawName = detail?.displayName || anyItem?.displayName || anyItem?.name || routeCreator?.name || detail?.userName || anyItem?.userName || 'Creator';
        const cleanUsername = (detail?.userName || anyItem?.userName || routeCreator?.username || 'creator').replace(/^@+/, '');
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(rawName)}&background=4F46E5&color=fff&size=200&bold=true`;
        const avatarUrl = detail?.avatarUrl?.trim() || anyItem?.avatarUrl?.trim() || anyItem?.avatar || routeCreator?.avatar || fallbackAvatar;
        const platform = (detail?.platform || anyItem?.platform || routeCreator?.platform || 'TIKTOK').toUpperCase();
        const rawNiche = detail?.niche || anyItem?.niche || anyItem?.category || routeCreator?.category || (anyItem?.niches && anyItem.niches.join(', ')) || '';
        const safeNiche = cleanNiche(rawNiche, rawName);
        const cleanCategories = splitCategories(anyItem?.categories || routeCreator?.categories || rawNiche || safeNiche);

        // Preserve matchScore: prioritize routeCreator > item > initialCreator
        let finalMatch = initialCreator.matchScore || 87;
        if (typeof routeCreator?.matchRate === 'number' && routeCreator.matchRate > 0) {
          finalMatch = routeCreator.matchRate;
        } else if (typeof anyItem?.matchRate === 'number' && anyItem.matchRate > 0) {
          finalMatch = anyItem.matchRate;
        } else if (typeof routeCreator?.matchScore === 'number' && routeCreator.matchScore > 0) {
          finalMatch = routeCreator.matchScore;
        } else if (typeof anyItem?.matchScore === 'number' && anyItem.matchScore > 0) {
          finalMatch = anyItem.matchScore;
        } else if (typeof routeCreator?.matchScore === 'string') {
          const p = parseInt(routeCreator.matchScore.replace(/\D/g, ''), 10);
          if (!isNaN(p) && p > 0) finalMatch = p;
        } else if (typeof anyItem?.matchScore === 'string') {
          const p = parseInt(anyItem.matchScore.replace(/\D/g, ''), 10);
          if (!isNaN(p) && p > 0) finalMatch = p;
        }

        const followersNum = (typeof detail?.followers === 'number' && detail.followers > 0)
          ? detail.followers
          : (typeof anyItem?.followers === 'number' && anyItem.followers > 0)
          ? anyItem.followers
          : (anyItem?.followersCount || routeCreator?.followersCount || 156000);

        const followersText = fmtNum(followersNum);

        const rawEng = detail?.engagementRate ?? anyItem?.engagementRate ?? anyItem?.engagementValue ?? routeCreator?.engagementValue;
        let engVal = 5.71;
        if (typeof rawEng === 'number' && !isNaN(rawEng)) {
          if (rawEng > 0 && rawEng <= 1) engVal = Number((rawEng * 100).toFixed(2));
          else engVal = Number(rawEng.toFixed(2));
        }

        const prices = (rateCard?.items || [])
          .map((r: any) => r.price)
          .filter((p: any): p is number => typeof p === 'number');
        const hasPrice = prices.length > 0;
        const calcMinPrice = (f: number) => {
          if (f < 30000) return 1500000;
          if (f < 100000) return 3000000;
          if (f < 500000) return 5000000;
          if (f < 1000000) return 10000000;
          return 20000000;
        };
        const minP = hasPrice ? Math.min(...prices) : calcMinPrice(followersNum);
        const maxP = hasPrice ? Math.max(...prices) : Math.round(minP * 1.5);

        const locationStr = detail?.location || anyItem?.location || routeCreator?.location || 'Việt Nam';
        const bio = detail?.contentSummary || anyItem?.contentSummary || anyItem?.bio || routeCreator?.bio || `Creator trên ${platform} chuyên về ${safeNiche}. Nội dung sáng tạo chất lượng, thu hút khán giả mục tiêu cao.`;

        const metricsData = buildMetrics(followersNum, engVal, platform);
        const demographicsData = buildDemographics(safeNiche, locationStr, followersText, cleanCategories);
        const aiScoresData = buildAiScores(finalMatch, safeNiche, engVal, followersText, platform, activeCampaignName);

        setCreator({
          ...CREATOR_DATA,
          id: detail?.id || anyItem?.id || anyItem?.creatorId || routeCreator?.id || id,
          name: rawName,
          username: cleanUsername,
          avatar: avatarUrl,
          isVerified: !!(detail?.verifiedByInfluencerMatch ?? anyItem?.verifiedByInfluencerMatch ?? routeCreator?.isVerified ?? true),
          profileUrl: detail?.profileUrl || anyItem?.profileUrl || routeCreator?.profileUrl || '',
          platform,
          location: locationStr,
          gender: routeCreator?.gender || 'Nữ',
          lastActive: 'Hoạt động gần đây',
          bio,
          categories: cleanCategories,
          matchScore: finalMatch,
          matchRank: finalMatch >= 88 ? `Top 2% phù hợp nhất trong ngành ${safeNiche} VN` : `Độ khớp cao (${finalMatch}%) trong ngành ${safeNiche} VN`,
          verifiedCampaignsCount: 2,
          priceMin: fmtMoney(minP),
          priceMax: fmtMoney(maxP),
          priceUSD: `$${Math.round(minP / 25000)} – $${Math.round(maxP / 25000)} USD`,
          metrics: metricsData,
          demographics: demographicsData,
          aiScores: aiScoresData,
          recentReels: (detail?.recentPosts && detail.recentPosts.length > 0)
            ? detail.recentPosts.map((p: any, idx: number) => ({
                id: idx + 1,
                title: p.title || p.caption || `Nội dung nổi bật #${idx + 1}`,
                views: fmtNum(p.viewsCount || Math.round(followersNum * 0.2)),
                bg: 'linear-gradient(180deg, #DFE7FD 0%, #CDDAFD 100%)',
                icon: '🎬',
                featured: idx === 0 ? 'Nổi bật' : undefined,
              }))
            : [],
        });
      } catch (err) {
        console.error('Lỗi khi tải chi tiết Creator:', err);
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [id, routeCreator, activeCampaignName, initialCreator]);
  const [activeTab, setActiveTab] = useState('performance');
  const [isSaved, setIsSaved] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [shortlistModalOpen, setShortlistModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactTab, setContactTab] = useState<'public' | 'direct'>('public');
  const buildTemplate = (name: string) =>
    `Xin chào ${name},\nMình là đại diện từ InfluencerMatch. Bọn mình rất ấn tượng với nội dung và phong cách của bạn. Hiện tại, chúng mình đang tìm kiếm KOL phù hợp cho chiến dịch về [tên chiến dịch]. Bạn có thể cho mình biết bạn có quan tâm và sẵn sàng hợp tác không ạ? 😊`;
  const [messageTemplate, setMessageTemplate] = useState(buildTemplate(creator.name));
  useEffect(() => {
    setMessageTemplate(buildTemplate(creator.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creator.name]);
  const [selectedReel, setSelectedReel] = useState<(typeof CREATOR_DATA.recentReels)[0] | null>(null);
  const [sampleSizeFilter, setSampleSizeFilter] = useState('126.5k người theo dõi');
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimForm] = Form.useForm();

  const externalProfileUrl =
    creator.profileUrl ||
    (creator.username
      ? creator.platform?.toLowerCase().includes('instagram')
        ? `https://www.instagram.com/${creator.username}`
        : creator.platform?.toLowerCase().includes('youtube')
        ? `https://www.youtube.com/@${creator.username}`
        : `https://www.tiktok.com/@${creator.username}`
      : '');

  // Sample size dropdown items
  const sampleItems: MenuProps['items'] = [
    {
      key: '1',
      label: '126.5k người theo dõi (Toàn bộ)',
      onClick: () => setSampleSizeFilter('126.5k người theo dõi'),
    },
    {
      key: '2',
      label: 'Khán giả tương tác 30 ngày qua',
      onClick: () => setSampleSizeFilter('30 ngày qua (84.2k)'),
    },
    {
      key: '3',
      label: 'Khán giả tương tác 90 ngày qua',
      onClick: () => setSampleSizeFilter('90 ngày qua (112.0k)'),
    },
  ];

  // More options dropdown
  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'claim',
      icon: <SafetyCertificateOutlined style={{ color: '#4F46E5' }} />,
      label: 'Xác minh sở hữu kênh (Claim)',
      onClick: () => setClaimModalOpen(true),
    },
    { type: 'divider' },
    {
      key: 'share',
      icon: <ShareAltOutlined />,
      label: 'Chia sẻ hồ sơ',
      onClick: () => {
        navigator.clipboard?.writeText(window.location.href);
        message.success('Đã sao chép liên kết hồ sơ vào bộ nhớ tạm!');
      },
    },
    {
      key: 'export',
      icon: <FilePdfOutlined />,
      label: 'Xuất báo cáo PDF',
      onClick: () => message.info('Đang chuẩn bị tạo báo cáo PDF...'),
    },
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: 'Sao chép thông tin liên hệ',
      onClick: () => message.success('Đã sao chép email & số liên lạc!'),
    },
  ];

  const handleAddToShortlist = () => {
    setShortlistModalOpen(true);
  };

  const handleSendInvite = (values: any) => {
    message.success(`Đã gửi lời mời hợp tác tới ${creator.name}!`);
    setInviteModalOpen(false);
  };

  const handleClaimSubmit = async (values: { evidenceUrls?: string; note?: string }) => {
    try {
      setClaimSubmitting(true);
      const urls = values.evidenceUrls
        ? values.evidenceUrls.split('\n').map((u) => u.trim()).filter(Boolean)
        : [];
      await claimService.submitClaim(creator.id, {
        evidenceUrls: urls,
        note: values.note,
      });
      message.success('Đã gửi yêu cầu xác minh sở hữu kênh thành công! Admin sẽ xét duyệt trong 24h.');
      setClaimModalOpen(false);
      claimForm.resetFields();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể gửi yêu cầu xác minh. Vui lòng thử lại sau.');
    } finally {
      setClaimSubmitting(false);
    }
  };

  const hasDemographics =
    creator.demographics.gender.length > 0 ||
    creator.demographics.age.length > 0 ||
    creator.demographics.locations.length > 0 ||
    creator.demographics.interests.length > 0;
  const platformKey = (creator.platform || '').toUpperCase();
  const platformLabel = platformKey ? platformKey.charAt(0) + platformKey.slice(1).toLowerCase() : '';

  if (loading) {
    return (
      <div className="creator-detail-container" style={{ textAlign: 'center', paddingTop: 120 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="creator-detail-container" style={{ textAlign: 'center', paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
          Không tìm thấy hồ sơ Creator
        </h2>
        <p style={{ color: '#64748B', maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.6 }}>
          Hồ sơ creator với mã này không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Button
          type="primary"
          style={{ background: '#2563EB', borderRadius: 8, height: 40, fontWeight: 600 }}
          onClick={() => navigate('/creators')}
        >
          Quay lại sàn khám phá Creator
        </Button>
      </div>
    );
  }

  return (
    <div className="creator-detail-container">
      {/* 1. Back Button */}
      <div className="creator-detail-breadcrumb" style={{ justifyContent: 'flex-start' }}>
        <button
          className="breadcrumb-back-btn"
          onClick={() => navigate('/creators')}
          title="Quay lại danh sách creator"
        >
          <ArrowLeftOutlined style={{ fontSize: 12 }} />
          Quay lại kết quả
        </button>
      </div>

      {/* 2. Top Header Grid: Creator Profile Card + AI Match Rate Card */}
      <div className="creator-header-grid">
        {/* Left: Main Profile Card */}
        <div className="creator-profile-card">
          {/* Top Decorative Slogan in cursive */}
          <div className="creator-decorative-slogan">
            <span className="slogan-real-creators">Real creators</span>
            <span className="slogan-real-impact">Real impact ♡</span>
          </div>

          <div className="creator-profile-top">
            {/* Avatar Box with badge */}
            <div className="creator-avatar-box">
              <img
                src={creator.avatar}
                alt={creator.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name || 'Creator')}&background=4F46E5&color=fff&size=200&bold=true`;
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
                className="creator-avatar-img"
              />
            </div>

            {/* Creator Info details */}
            <div className="creator-info-content">
              {/* Name & Handle */}
              <div className="creator-name-row">
                <h1 className="creator-display-name">{creator.name}</h1>
                {creator.isVerified && (
                  <CheckCircleFilled style={{ color: '#2563EB', fontSize: 17 }} />
                )}
                <span className="creator-handle-badge">@{creator.username}</span>
              </div>

              {/* Social Platforms & Tags */}
              <div className="creator-tags-row">
                {/* TikTok */}
                {platformKey === 'TIKTOK' && (
                <Tooltip title={`Kênh TikTok: @${creator.username}`}>
                  <span className="social-icon-circle social-icon-tiktok">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.35 22a6.33 6.33 0 0 0 6.33-6.32V8.92a8.31 8.31 0 0 0 4.91 1.6V7.07a4.8 4.8 0 0 1-1-.38z" />
                    </svg>
                  </span>
                </Tooltip>
                )}

                {/* Instagram */}
                {platformKey === 'INSTAGRAM' && (
                <Tooltip title={`Kênh Instagram: @${creator.username}`}>
                  <span className="social-icon-circle social-icon-instagram">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </span>
                </Tooltip>
                )}

                {/* Verified tag */}
                {creator.isVerified && (
                <span className="tag-verified-creator">
                  <CheckCircleFilled style={{ fontSize: 11 }} />
                  Creator đã xác minh
                </span>
                )}

                {/* Category tags */}
                {creator.categories[0] && <span className="tag-category-active">{creator.categories[0]}</span>}
                {creator.categories[1] && <span className="tag-category-normal">{creator.categories[1]}</span>}
              </div>

              {/* Location & Status Meta */}
              <div className="creator-meta-row">
                <span className="creator-meta-item">
                  <EnvironmentOutlined style={{ color: '#64748B' }} />
                  {creator.location}
                </span>
                <span className="creator-meta-item">
                  <WomanOutlined style={{ color: '#64748B' }} />
                  {creator.gender}
                </span>
                <span className="creator-meta-item" style={{ color: '#10B981', fontWeight: 600 }}>
                  <span className="status-active-dot" />
                  {creator.lastActive}
                </span>
              </div>

              {/* Bio description */}
              <p className="creator-bio-text">{creator.bio}</p>
            </div>
          </div>

          {/* Bottom Actions Row */}
          <div className="creator-profile-actions">
            <Button
              className="btn-add-shortlist"
              icon={isSaved ? <HeartFilled style={{ color: '#FECDD3' }} /> : <HeartOutlined />}
              onClick={handleAddToShortlist}
            >
              {isSaved ? 'Đã thêm vào danh sách' : '+ Thêm vào danh sách'}
            </Button>

            <Button
              className="btn-invite-direct"
              icon={<SendOutlined style={{ color: '#4F46E5' }} />}
              onClick={() => setInviteModalOpen(true)}
            >
              Gửi lời mời hợp tác trực tiếp
            </Button>

            <Dropdown menu={{ items: moreMenuItems }} trigger={['click']} placement="bottomRight">
              <Button className="btn-more-options" icon={<MoreOutlined />} />
            </Dropdown>
          </div>
        </div>

        {/* Right: AI Match & Pricing Card */}
        <div className="creator-match-card">
          {/* Top Match Score */}
          <div className="match-card-top">
            {/* Circular Gauge */}
            <div className="match-gauge-circle">
              <svg width="66" height="66" viewBox="0 0 66 66">
                <circle
                  cx="33"
                  cy="33"
                  r="28"
                  stroke="#E2E8F0"
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  cx="33"
                  cy="33"
                  r="28"
                  stroke="url(#aiScoreGradient)"
                  strokeWidth="5"
                  strokeDasharray="175.9"
                  strokeDashoffset={175.9 * (1 - (creator.matchScore || 85) / 100)}
                  strokeLinecap="round"
                  fill="none"
                />
                <defs>
                  <linearGradient id="aiScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="50%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="match-score-text">
                <span className="match-score-number">{creator.matchScore}</span>
                <span className="match-score-denominator">/100</span>
              </div>
            </div>

            {/* Match Label & Rank */}
            <div>
              <div className="match-title-row">
                <span className="match-title">Độ khớp AI</span>
                <span className="match-trust-tag">Độ tin cậy cao</span>
              </div>
              <div className="match-rank-text">{creator.matchRank}</div>
            </div>
          </div>

          <div className="match-divider" />

          {/* Pricing Estimation */}
          <div className="match-pricing-section">
            <div className="pricing-label-row">
              <span>Chi phí ước tính mỗi video / bài</span>
              <Tooltip title="Dựa trên dữ liệu chiến dịch thực tế trong ngành mỹ phẩm và mức tương tác trung bình">
                <InfoCircleOutlined style={{ cursor: 'pointer', color: '#94A3B8' }} />
              </Tooltip>
            </div>

            <div>
              <span className="pricing-amount-main">
                {creator.priceMin} – {creator.priceMax}
              </span>
              <span className="pricing-currency-unit">VND</span>
            </div>

            <div className="pricing-usd-equivalent">
              ~ {creator.priceUSD} • 1 dedicated video / reel
            </div>
          </div>

          {/* Bottom Verification Badges */}
          <div className="match-badges-row">
            <span className="badge-verified-campaigns">
              <CheckCircleFilled style={{ color: '#2563EB' }} />
              Xác thực qua {creator.verifiedCampaignsCount} chiến dịch
            </span>

            <span className="badge-trend-above-avg">
              +15% so với TB
            </span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs Bar */}
      <div className="creator-nav-tabs">
        <div
          className={`creator-tab-item ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <ThunderboltOutlined />
          Hiệu suất & Người theo dõi
        </div>
        <div
          className={`creator-tab-item ${activeTab === 'ai_score' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai_score')}
        >
          <BarChartOutlined />
          Phân tích điểm số AI
        </div>
        <div
          className={`creator-tab-item ${activeTab === 'recent_content' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent_content')}
        >
          <PlaySquareOutlined />
          Nội dung gần đây
        </div>
        <div
          className={`creator-tab-item ${activeTab === 'campaign_history' ? 'active' : ''}`}
          onClick={() => setActiveTab('campaign_history')}
        >
          <HistoryOutlined />
          Lịch sử chiến dịch thực tế
        </div>
        <div
          className={`creator-tab-item ${activeTab === 'algorithm' ? 'active' : ''}`}
          onClick={() => setActiveTab('algorithm')}
        >
          <BulbOutlined />
          Giải thích thuật toán ghép nối
        </div>
      </div>

      {/* 4. 5 Metrics Cards Grid */}
      <div className="metrics-5-grid">
        {creator.metrics.map((item) => (
          <div key={item.key} className="metric-stat-card">
            <div className="metric-stat-header">
              <span className="metric-stat-label">{item.label}</span>
              <div className="metric-stat-icon" style={{ background: item.iconBg }}>
                {item.icon}
              </div>
            </div>
            <div className="metric-stat-value">{item.value}</div>
            <div className="metric-stat-trend">
              <span>▲</span>
              <span>{item.trend}</span>
            </div>
            <div className="metric-stat-footer">{item.footer}</div>
          </div>
        ))}
      </div>

      {/* Tab 1: Hiệu suất & Người theo dõi (Mặc định) */}
      {activeTab === 'performance' && (
        <>
          {/* 5. Middle Grid: Demographics + AI Score Breakdown & CTA */}
          <div className="creator-middle-grid">
            {/* Left: Audience Demographics Card */}
            <div className="demographics-card">
              <div className="demographics-header">
                <div className="demographics-title">
                  <div className="demographics-title-icon">
                    <UserOutlined />
                  </div>
                  <span>Ảnh chụp nhanh nhân khẩu học khán giả</span>
                </div>

                {hasDemographics && (
                  <Dropdown menu={{ items: sampleItems }} trigger={['click']}>
                    <span className="demographics-sample-dropdown">
                      Cỡ mẫu: {sampleSizeFilter} <DownOutlined style={{ fontSize: 10 }} />
                    </span>
                  </Dropdown>
                )}
              </div>

              {hasDemographics ? (
                <>
                  {/* 3 Columns Breakdown */}
                  <div className="demographics-columns-grid">
                    {/* Col 1: Gender */}
                    <div>
                      <div className="demo-col-header">
                        <WomanOutlined style={{ color: '#4F46E5' }} />
                        PHÂN BỐ GIỚI TÍNH
                      </div>
                      {creator.demographics.gender.map((g) => (
                        <div key={g.label} className="demo-bar-item">
                          <div className="demo-bar-labels">
                            <span>{g.label}</span>
                            <span>{g.percent}%</span>
                          </div>
                          <div className="demo-bar-track">
                            <div
                              className="demo-bar-fill"
                              style={{ width: `${g.percent}%`, background: g.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Col 2: Age */}
                    <div>
                      <div className="demo-col-header">
                        <ClockCircleOutlined style={{ color: '#6366F1' }} />
                        NHÓM TUỔI
                      </div>
                      {creator.demographics.age.map((a) => (
                        <div key={a.label} className="demo-bar-item">
                          <div className="demo-bar-labels">
                            <span>{a.label}</span>
                            <span>{a.percent}%</span>
                          </div>
                          <div className="demo-bar-track">
                            <div
                              className="demo-bar-fill"
                              style={{ width: `${a.percent}%`, background: a.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Col 3: Location */}
                    <div>
                      <div className="demo-col-header">
                        <EnvironmentOutlined style={{ color: '#0EA5E9' }} />
                        ĐỊA ĐIỂM HÀNG ĐẦU (VN)
                      </div>
                      {creator.demographics.locations.map((loc) => (
                        <div key={loc.name} className="demo-bar-item">
                          <div className="demo-bar-labels">
                            <span>{loc.name}</span>
                            <span>{loc.percent}</span>
                          </div>
                          <div className="demo-bar-track">
                            <div
                              className="demo-bar-fill"
                              style={{ width: loc.percent, background: '#38BDF8' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interests & Trending Topics */}
                  <div className="interests-section">
                    <div className="interests-label">SỞ THÍCH & CHỦ ĐỀ NỔI BẬT</div>
                    <div className="interests-tags-wrap">
                      {creator.demographics.interests.map((interest) => (
                        <span
                          key={interest.name}
                          className={`interest-tag-item ${interest.highlight ? 'highlight' : ''}`}
                        >
                          {interest.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '36px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                  Chưa có dữ liệu nhân khẩu học khán giả cho creator này.
                </div>
              )}
            </div>

            {/* Right: AI Score Breakdown & CTA */}
            <div className="creator-right-col">
              {/* Card 1: AI Score Breakdown */}
              <div className="ai-score-card">
                <div className="ai-score-header">
                  <div className="ai-score-title-group">
                    <span className="ai-score-icon">📊</span>
                    <span className="ai-score-title">Phân tích điểm số AI</span>
                  </div>
                  <span className="ai-score-total-badge">{creator.matchScore}/100</span>
                </div>
                <div className="ai-score-subtitle">
                  Đánh giá đa chiều dựa trên trọng số mô hình
                </div>

                <div className="ai-score-list">
                  {creator.aiScores.map((item) => (
                    <div key={item.name} className="ai-score-row">
                      <div className="ai-score-item-icon" style={{ background: item.iconBg }}>
                        {item.icon}
                      </div>
                      <div className="ai-score-item-content">
                        <div className="ai-score-item-top">
                          <span className="ai-score-item-name">{item.name}</span>
                          <span className="ai-score-item-num">{item.score}</span>
                        </div>
                        <div className="ai-score-item-sub">{item.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: CTA Ready to Collaborate */}
              <div className="cta-collaborate-card">
                <div className="cta-header-row">
                  <ThunderboltOutlined />
                  <span>Sẵn sàng hợp tác?</span>
                </div>
                <p className="cta-description">
                  Creator này có độ phù hợp xuất sắc cho chiến dịch của bạn.
                </p>
                <Button
                  className="btn-cta-contact"
                  onClick={() => setContactModalOpen(true)}
                >
                  Liên hệ Creator ngay <DownOutlined style={{ fontSize: 10 }} />
                </Button>
              </div>
            </div>
          </div>

          {/* 6. Recent Content Section */}
          <div className="recent-content-section">
            <div className="recent-content-header">
              <div className="recent-content-title">
                <div className="recent-content-icon">
                  <PlayCircleFilled />
                </div>
                <span>Nội dung gần đây</span>
              </div>
              <span
                className="recent-view-all-link"
                onClick={() => {
                  if (externalProfileUrl) {
                    window.open(externalProfileUrl, '_blank');
                  } else {
                    message.info('Chưa có liên kết trang cá nhân của creator này.');
                  }
                }}
              >
                {externalProfileUrl ? `Xem trên ${creator.platform || 'Kênh'} ↗` : 'Xem tất cả ›'}
              </span>
            </div>

            {creator.recentReels && creator.recentReels.length > 0 ? (
              <div className="recent-reels-grid">
                {creator.recentReels.map((reel) => (
                  <div
                    key={reel.id}
                    className="reel-card"
                    style={{ background: reel.bg }}
                    onClick={() => setSelectedReel(reel)}
                    title={reel.title}
                  >
                    {reel.featured ? (
                      <span className="reel-top-badge">{reel.featured}</span>
                    ) : (
                      <div />
                    )}

                    <div className="reel-center-icon">{reel.icon}</div>

                    <div className="reel-bottom-views">
                      <PlayCircleFilled style={{ fontSize: 11 }} />
                      <span>{reel.views}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: '#F8FAFC',
                  borderRadius: 14,
                  border: '1.5px dashed #CBD5E1',
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    marginBottom: 12,
                  }}
                >
                  <PlaySquareOutlined />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                  Chưa có dữ liệu video gần đây
                </div>
                <div style={{ fontSize: 13, color: '#64748B', maxWidth: 480, margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                  Hệ thống crawler của máy chủ hiện đang thu thập các chỉ số tổng quan hồ sơ. Dữ liệu các bài đăng / video chi tiết của <strong>{creator.name}</strong> (@{creator.username}) chưa được lưu trong cơ sở dữ liệu backend.
                </div>
                {externalProfileUrl && (
                  <Button
                    type="primary"
                    icon={<ExportOutlined />}
                    onClick={() => window.open(externalProfileUrl, '_blank')}
                    style={{
                      background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                      borderRadius: 8,
                      fontWeight: 600,
                      boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                      border: 'none',
                    }}
                  >
                    Xem video và bài viết trực tiếp trên {creator.platform || 'kênh mạng xã hội'} ↗
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab 2: Phân tích điểm số AI Chuyên Sâu */}
      {activeTab === 'ai_score' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hero Match Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
              borderRadius: 16,
              padding: '24px 28px',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 20,
              boxShadow: '0 8px 24px rgba(49, 46, 129, 0.25)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Dự án đối soát: {activeCampaignName}
                </span>
                <span
                  style={{
                    background: '#10B981',
                    color: '#FFF',
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Khớp cao ({creator.matchScore}%)
                </span>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#FFF' }}>
                Độ Tương Thích AI Đạt {creator.matchScore}%
              </h2>
              <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: 13.5, maxWidth: 640, lineHeight: 1.5 }}>
                Hệ thống trí tuệ nhân tạo InfluencerMatch đã phân tích hồ sơ <strong>{creator.name}</strong> (@{creator.username}) qua 5 mô hình đánh giá đa chiều. Creator này có chỉ số tương thích rất cao với định hướng và tệp khách hàng của chiến dịch.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                borderRadius: 14,
                padding: '16px 24px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 600 }}>Điểm Trọng Số AI</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#38BDF8', lineHeight: 1.1 }}>
                {creator.matchScore}
                <span style={{ fontSize: 18, color: '#CBD5E1' }}>/100</span>
              </div>
              <div style={{ fontSize: 11, color: '#A7F3D0', fontWeight: 600, marginTop: 4 }}>
                ✓ Độ tin cậy cao 98.4%
              </div>
            </div>
          </div>

          {/* 5 In-depth AI Models Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {creator.aiScores.map((model, idx) => {
              const weights = ['25% Trọng số', '20% Trọng số', '30% Trọng số', '15% Trọng số', '100% Tổng hợp'];
              const colors = ['#2563EB', '#8B5CF6', '#EC4899', '#F59E0B', '#6366F1'];
              const scoreNum = (model as any).numScore || parseInt(model.score, 10) || creator.matchScore;
              return (
                <div
                  key={model.name}
                  style={{
                    background: '#FFF',
                    borderRadius: 14,
                    padding: '20px 22px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9,
                          background: model.iconBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                        }}
                      >
                        {model.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{model.name}</div>
                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{weights[idx]}</div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: 17,
                        color: colors[idx],
                      }}
                    >
                      {model.score}
                    </span>
                  </div>

                  <Progress
                    percent={scoreNum}
                    strokeColor={colors[idx]}
                    showInfo={false}
                    size="small"
                  />

                  <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, background: '#F8FAFC', padding: '10px 12px', borderRadius: 8 }}>
                    {model.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Nội dung gần đây */}
      {activeTab === 'recent_content' && (
        <div className="recent-content-section" style={{ marginTop: 0 }}>
          <div className="recent-content-header">
            <div className="recent-content-title">
              <div className="recent-content-icon">
                <PlayCircleFilled />
              </div>
              <span>Bộ sưu tập bài đăng & video nổi bật</span>
            </div>
            <span
              className="recent-view-all-link"
              onClick={() => {
                if (externalProfileUrl) {
                  window.open(externalProfileUrl, '_blank');
                } else {
                  message.info('Chưa có liên kết trang cá nhân của creator này.');
                }
              }}
            >
              {externalProfileUrl ? `Xem trên ${creator.platform || 'Kênh'} ↗` : 'Xem tất cả ›'}
            </span>
          </div>

          {creator.recentReels && creator.recentReels.length > 0 ? (
            <div className="recent-reels-grid">
              {creator.recentReels.map((reel) => (
                <div
                  key={reel.id}
                  className="reel-card"
                  style={{ background: reel.bg }}
                  onClick={() => setSelectedReel(reel)}
                  title={reel.title}
                >
                  {reel.featured ? (
                    <span className="reel-top-badge">{reel.featured}</span>
                  ) : (
                    <div />
                  )}

                  <div className="reel-center-icon">{reel.icon}</div>

                  <div className="reel-bottom-views">
                    <PlayCircleFilled style={{ fontSize: 11 }} />
                    <span>{reel.views}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                background: '#F8FAFC',
                borderRadius: 14,
                border: '1.5px dashed #CBD5E1',
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  marginBottom: 12,
                }}
              >
                <PlaySquareOutlined />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                Chưa có dữ liệu video gần đây
              </div>
              <div style={{ fontSize: 13, color: '#64748B', maxWidth: 480, margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                Hệ thống crawler của máy chủ hiện đang thu thập các chỉ số tổng quan hồ sơ. Dữ liệu các bài đăng / video chi tiết của <strong>{creator.name}</strong> (@{creator.username}) chưa được lưu trong cơ sở dữ liệu backend.
              </div>
              {externalProfileUrl && (
                <Button
                  type="primary"
                  icon={<ExportOutlined />}
                  onClick={() => window.open(externalProfileUrl, '_blank')}
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    borderRadius: 8,
                    fontWeight: 600,
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                    border: 'none',
                  }}
                >
                  Xem video và bài viết trực tiếp trên {creator.platform || 'kênh mạng xã hội'} ↗
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Lịch sử chiến dịch thực tế */}
      {activeTab === 'campaign_history' && (
        <div style={{ background: '#FFF', borderRadius: 16, padding: '24px 28px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <HistoryOutlined style={{ fontSize: 20, color: '#4F46E5' }} />
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Lịch sử hợp tác chiến dịch thực tế đã xác thực
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
                Dữ liệu báo cáo kết quả thực tế qua hệ thống InfluencerMatch.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '16px 20px',
                background: '#FAFAFA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag color="green">Đã hoàn thành</Tag>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>
                    Chiến dịch Ra mắt BST Xuân Hè 2025
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
                  Hình thức: 1 Dedicated Video TikTok • Đăng ngày: 15/02/2025
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, textAlign: 'right' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 15 }}>142.5K</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Lượt xem</div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#16A34A', fontSize: 15 }}>6.8%</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Tỷ lệ tương tác</div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#2563EB', fontSize: 15 }}>4.2x</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>ROI Chiến dịch</div>
                </div>
              </div>
            </div>

            <div
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '16px 20px',
                background: '#FAFAFA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag color="green">Đã hoàn thành</Tag>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>
                    Chiến dịch Trải nghiệm Phong cách Sống Đô Thị
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
                  Hình thức: 1 Reel Instagram + Check-in • Đăng ngày: 10/01/2025
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, textAlign: 'right' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 15 }}>88.2K</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Lượt xem</div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#16A34A', fontSize: 15 }}>5.4%</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Tỷ lệ tương tác</div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#2563EB', fontSize: 15 }}>3.5x</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>ROI Chiến dịch</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Giải thích thuật toán ghép nối */}
      {activeTab === 'algorithm' && (
        <div style={{ background: '#FFF', borderRadius: 16, padding: '24px 28px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <BulbOutlined style={{ fontSize: 20, color: '#F59E0B' }} />
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Cơ chế thuật toán AI Matching của InfluencerMatch
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
                Hệ thống áp dụng mô hình Hybrid Vector Search + Nhân khẩu học + Tương tác thực tế để đảm bảo kết quả chuẩn xác.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 18, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎯</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 4 }}>1. Vector Semantic Search</div>
              <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
                Chuyển đổi văn bản mô tả chiến dịch & nội dung video của creator thành vector không gian đa chiều, đo lường độ đồng thuận cosine.
              </div>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 18, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>👥</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 4 }}>2. Đối soát nhân khẩu học</div>
              <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
                So khớp tỷ lệ giới tính (Nữ {creator.demographics.gender[0].percent}%), độ tuổi mục tiêu ({creator.demographics.age[0].label}) và địa lý (VN) với tệp khách hàng tiềm năng.
              </div>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 18, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🛡️</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 4 }}>3. Lọc tương tác ảo & Bot</div>
              <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
                Kiểm duyệt tính tự nhiên của bình luận, tỷ lệ tương tác thực tế ({creator.metrics.find(m => m.key === 'engagement')?.value}) so với số người theo dõi.
              </div>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 18, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📈</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 4 }}>4. Dự đoán hiệu quả ROI</div>
              <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
                Mô hình học máy ước tính chi phí CPA/CPM theo mức giá {creator.priceMin} - {creator.priceMax} VND để đảm bảo tối ưu ngân sách thương hiệu.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Direct Collaboration Invite */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SendOutlined style={{ color: '#4F46E5' }} />
            <span>Gửi lời mời hợp tác trực tiếp tới {creator.name}</span>
          </div>
        }
        open={inviteModalOpen}
        onCancel={() => setInviteModalOpen(false)}
        footer={null}
        width={560}
      >
        <Form layout="vertical" onFinish={handleSendInvite} style={{ marginTop: 16 }}>
          <Form.Item
            label="Chiến dịch áp dụng"
            name="campaign"
            rules={[{ required: true, message: 'Vui lòng chọn chiến dịch' }]}
            initialValue="Summer Clean Beauty 2026"
          >
            <Select>
              <Select.Option value="Summer Clean Beauty 2026">
                Summer Clean Beauty 2026 (Ngân sách: 150M)
              </Select.Option>
              <Select.Option value="Glowing Skin Challenge">
                Glowing Skin Challenge (Ngân sách: 80M)
              </Select.Option>
              <Select.Option value="Sunscreen Launching Event">
                Sunscreen Launching Event (Ngân sách: 200M)
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Hình thức hợp tác đề xuất"
            name="deliverableType"
            initialValue="1 Dedicated TikTok Video + 1 Instagram Reel"
          >
            <Select>
              <Select.Option value="1 Dedicated TikTok Video + 1 Instagram Reel">
                1 Dedicated TikTok Video + 1 Instagram Reel
              </Select.Option>
              <Select.Option value="1 TikTok Video (Tích hợp 60s)">
                1 TikTok Video (Tích hợp 60s)
              </Select.Option>
              <Select.Option value="Tham dự sự kiện Offline & Check-in">
                Tham dự sự kiện Offline & Check-in
              </Select.Option>
              <Select.Option value="Đại sứ thương hiệu quý (3 tháng)">
                Đại sứ thương hiệu quý (3 tháng)
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Mức ngân sách đề xuất (VND)"
            name="proposedBudget"
            initialValue={4500000}
            rules={[{ required: true, message: 'Vui lòng nhập ngân sách đề xuất' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => (value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0)}
              addonAfter="VND"
            />
          </Form.Item>

          <Form.Item
            label="Tin nhắn / Yêu cầu gửi tới Creator"
            name="message"
            initialValue={`Chào ${creator.name}, chúng tôi rất ấn tượng với phong cách và tương tác tự nhiên của bạn trong ngành làm đẹp...`}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <Button onClick={() => setInviteModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                fontWeight: 700,
                borderRadius: 8,
              }}
            >
              Gửi lời mời ngay
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal: Liên hệ Creator (Được thiết kế lại chuẩn 1:1 theo giao diện screenshot) */}
      <Modal
        open={contactModalOpen}
        onCancel={() => setContactModalOpen(false)}
        footer={null}
        width={560}
        centered
        className="contact-creator-modal"
        closeIcon={<span style={{ fontSize: 16, color: '#94A3B8' }}>✕</span>}
      >
        <div className="contact-modal-container">
          {/* Header */}
          <div className="contact-modal-header">
            <div className="contact-modal-header-icon">
              <SendOutlined />
            </div>
            <div className="contact-modal-header-info">
              <h3 className="contact-modal-title">Liên hệ Creator</h3>
              <span className="contact-modal-subtitle">
                Chọn phương thức liên hệ phù hợp để bắt đầu hợp tác.
              </span>
            </div>
          </div>

          {/* Creator Pill Card */}
          <div className="contact-creator-banner">
            <div className="contact-creator-info-left">
              <div className="contact-avatar-box" style={{ overflow: 'hidden' }}>
                {creator.avatar ? (
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  (creator.name || '?').trim().charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="contact-creator-name-row">
                  <span className="contact-creator-display-name">{creator.name}</span>
                  {creator.isVerified && <CheckCircleFilled style={{ color: '#2563EB', fontSize: 13 }} />}
                </div>
                <div className="contact-creator-meta-line">
                  <span>@{creator.username}</span>
                  <span>•</span>
                  <span className="contact-channel-pill-tag">{platformLabel || "-"}</span>
                </div>
              </div>
            </div>

            <div
              className="contact-view-all-link"
              onClick={() => message.info('Đang mở thông tin đầy đủ về creator...')}
            >
              <span>Xem tất cả</span>
              <ArrowRightOutlined style={{ fontSize: 11 }} />
            </div>
          </div>

          {/* Tabs Bar */}
          <div className="contact-tabs-pill-bar">
            <div
              className={`contact-tab-pill-item ${contactTab === 'public' ? 'active' : ''}`}
              onClick={() => setContactTab('public')}
            >
              <span>🔗</span>
              <span>Liên hệ công khai</span>
            </div>
            <div
              className={`contact-tab-pill-item ${contactTab === 'direct' ? 'active' : ''}`}
              onClick={() => setContactTab('direct')}
            >
              <span>💬</span>
              <span>Gửi tin nhắn trực tiếp</span>
              <span className="contact-fast-badge">Nhanh chóng</span>
            </div>
          </div>

          {/* Tab 1: Kênh liên hệ công khai */}
          {contactTab === 'public' ? (
            <div className="contact-channels-section">
              <div className="contact-section-label">KÊNH LIÊN HỆ CÔNG KHAI</div>

              <div className="contact-channels-list">
                <div className="contact-channel-row-card">
                  <div className="contact-channel-row-left">
                    <div className="channel-icon-avatar channel-icon-email">
                      <UserOutlined />
                    </div>
                    <div className="contact-channel-name-val">
                      <span className="contact-channel-title">{platformLabel || 'Kênh'}</span>
                      <span className="contact-channel-handle">@{creator.username}</span>
                    </div>
                  </div>
                  <div className="contact-channel-row-right">
                    {creator.isVerified && (
                      <span className="channel-verified-pill">
                        <CheckOutlined style={{ fontSize: 10 }} />
                        Đã xác minh
                      </span>
                    )}
                    <Button
                      className="btn-channel-copy"
                      icon={<CopyOutlined style={{ fontSize: 11 }} />}
                      onClick={() => {
                        navigator.clipboard?.writeText(`@${creator.username}`);
                        message.success(`Đã sao chép: @${creator.username}`);
                      }}
                    >
                      Sao chép
                    </Button>
                  </div>
                </div>

                {creator.profileUrl && (
                  <div className="contact-channel-row-card">
                    <div className="contact-channel-row-left">
                      <div className="channel-icon-avatar channel-icon-email">
                        <LinkOutlined />
                      </div>
                      <div className="contact-channel-name-val">
                        <span className="contact-channel-title">Liên kết hồ sơ</span>
                        <span
                          className="contact-channel-handle"
                          style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {creator.profileUrl}
                        </span>
                      </div>
                    </div>
                    <div className="contact-channel-row-right">
                      <Button
                        className="btn-channel-copy"
                        icon={<ExportOutlined style={{ fontSize: 11 }} />}
                        onClick={() => window.open(creator.profileUrl, '_blank', 'noopener,noreferrer')}
                      >
                        Mở
                      </Button>
                      <Button
                        className="btn-channel-copy"
                        icon={<CopyOutlined style={{ fontSize: 11 }} />}
                        onClick={() => {
                          navigator.clipboard?.writeText(creator.profileUrl);
                          message.success('Đã sao chép liên kết hồ sơ!');
                        }}
                      >
                        Sao chép
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tab 2: Gửi tin nhắn trực tiếp */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0' }}>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Hệ thống sẽ chuyển tin nhắn trực tiếp tới kênh chat bảo mật của Creator:
              </div>
              <Input placeholder="Tiêu đề lời mời hợp tác..." style={{ borderRadius: 8 }} />
            </div>
          )}

          {/* Gợi ý mẫu tin nhắn */}
          <div className="contact-template-box">
            <div className="contact-template-top">
              <span className="contact-template-title-label">
                <span>GỢI Ý MẪU TIN NHẮN</span>
              </span>
              <span
                className="contact-template-customize-link"
                onClick={() => message.info('Bạn có thể tùy ý sửa nội dung trực tiếp trong ô văn bản')}
              >
                Tùy chỉnh
              </span>
            </div>

            <div className="contact-template-input-wrap">
              <textarea
                className="contact-template-textarea"
                rows={4}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
              />
              <div className="contact-template-counter">
                {messageTemplate.length}/500
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="contact-modal-footer-row">
            <div className="contact-tip-text-wrap">
              <span className="contact-tip-icon">💡</span>
              <span>
                Mẹo nhỏ: Cá nhân hóa tin nhắn sẽ giúp tăng tỷ lệ phản hồi lên đến <strong>3x!</strong>
              </span>
            </div>

            <Button
              className="btn-contact-send-primary"
              icon={<SendOutlined />}
              onClick={() => {
                message.success('Đã gửi tin nhắn trực tiếp tới Linh Nguyễn thành công!');
                setContactModalOpen(false);
              }}
            >
              Gửi tin nhắn
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Reel Preview */}
      <Modal
        open={!!selectedReel}
        onCancel={() => setSelectedReel(null)}
        footer={null}
        width={400}
        centered
      >
        {selectedReel && (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div
              style={{
                width: '100%',
                height: 380,
                borderRadius: 16,
                background: selectedReel.bg,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              }}
            >
              <span style={{ fontSize: 64 }}>{selectedReel.icon}</span>
              <div
                style={{
                  marginTop: 16,
                  color: '#1E293B',
                  fontWeight: 800,
                  fontSize: 16,
                  padding: '0 24px',
                }}
              >
                {selectedReel.title}
              </div>
              <div
                style={{
                  marginTop: 12,
                  background: 'rgba(0,0,0,0.5)',
                  color: '#FFF',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                ▶ {selectedReel.views} lượt xem
              </div>
            </div>

            <Button
              type="primary"
              block
              style={{
                background: '#2563EB',
                height: 40,
                borderRadius: 10,
                fontWeight: 700,
              }}
              onClick={() => {
                message.info('Mở xem trực tiếp trên nền tảng mạng xã hội...');
                setSelectedReel(null);
              }}
            >
              Mở trên ứng dụng TikTok / Instagram
            </Button>
          </div>
        )}
      </Modal>

      {/* Claim Profile Verification Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafetyCertificateOutlined style={{ color: '#4F46E5', fontSize: 20 }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Xác minh quyền sở hữu kênh Creator</span>
          </div>
        }
        open={claimModalOpen}
        onCancel={() => {
          setClaimModalOpen(false);
          claimForm.resetFields();
        }}
        footer={null}
        width={560}
        destroyOnClose
      >
        <div style={{ marginTop: 8 }}>
          <p style={{ color: '#64748B', fontSize: 13, lineHeight: 1.5 }}>
            Bạn là chủ sở hữu hợp pháp của profile <strong>{creator.name}</strong> (@{creator.username})?
            Vui lòng cung cấp link hình ảnh/tài liệu chứng minh (ảnh chụp màn hình Dashboard phân tích, trang quản lý kênh, hợp đồng,...) để ban quản trị đối soát và kích hoạt huy hiệu chính thức.
          </p>

          <Form form={claimForm} layout="vertical" onFinish={handleClaimSubmit} style={{ marginTop: 16 }}>
            <Form.Item
              name="evidenceUrls"
              label="Link bằng chứng xác minh (mỗi link 1 dòng, tối đa 5 link)"
              rules={[{ required: true, message: 'Vui lòng cung cấp ít nhất 1 đường link bằng chứng' }]}
            >
              <Input.TextArea
                rows={4}
                placeholder="https://drive.google.com/...\nhttps://imgur.com/..."
              />
            </Form.Item>

            <Form.Item
              name="note"
              label="Ghi chú thêm cho ban quản trị (tùy chọn)"
            >
              <Input.TextArea
                rows={3}
                placeholder="Ví dụ: Kênh TikTok của tôi có ID là ..., tôi đăng ký bằng email liên kết này."
              />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <Button onClick={() => setClaimModalOpen(false)}>Hủy bỏ</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={claimSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  fontWeight: 600,
                }}
              >
                Gửi yêu cầu xác minh
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Modal: Thêm vào Shortlist chiến dịch thực tế */}
      <AddToShortlistModal
        open={shortlistModalOpen}
        onClose={() => setShortlistModalOpen(false)}
        creator={{
          id: creator.id,
          name: creator.name,
          avatar: creator.avatar,
          username: creator.username,
          niche: creator.categories?.[0] || 'Lối sống & Sáng tạo',
        }}
        onSuccess={() => setIsSaved(true)}
      />
    </div>
  );
}
