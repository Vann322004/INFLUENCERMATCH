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
  ArrowLeftOutlined,
  CheckCircleFilled,
  EnvironmentOutlined,
  WomanOutlined,
  ManOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  HeartFilled,
  HeartOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  MoreOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  ShareAltOutlined,
  FilePdfOutlined,
  CopyOutlined,
  SendOutlined,
  DollarOutlined,
  PlayCircleOutlined,
  CheckOutlined,
  CalendarOutlined,
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
  platform: 'TIKTOK',
  matchScore: 94,
  matchRank: 'Hạng #1 trong ngành Clean Beauty VN',
  verifiedCampaignsCount: 2,
  priceMin: '3,500,000',
  priceMax: '5,000,000',
  priceUSD: '$140 – $200 USD',
  location: 'TP. Hồ Chí Minh (VN)',
  gender: 'Nữ',
  lastActive: 'Hoạt động 2 giờ trước',
  bio: 'Người yêu thích chăm sóc da và chia sẻ trải nghiệm thực tế mỗi ngày. Hướng đến phong cách sống lành mạnh và tự nhiên.',
  categories: ['Làm đẹp & Chăm sóc da', 'Phong cách sống'],
  rateCardItems: [
    {
      id: 1,
      deliverable: '1 Video ngắn TikTok / Reel (Review chi tiết)',
      price: 3500000,
      priceUSD: '$140 USD',
      timeline: '3 – 5 ngày',
      description: 'Video 60-90s kịch bản trải nghiệm thực tế, bao gồm 1 lần feedback chỉnh sửa.',
    },
    {
      id: 2,
      deliverable: '1 Bài đăng hình ảnh / Album trải nghiệm',
      price: 2500000,
      priceUSD: '$100 USD',
      timeline: '2 – 3 ngày',
      description: 'Bộ ảnh chất lượng cao kèm caption chuyên sâu, gắn thẻ thương hiệu và hashtag.',
    },
    {
      id: 3,
      deliverable: '1 Phiên Livestream tương tác & bán hàng (60 phút)',
      price: 5000000,
      priceUSD: '$200 USD',
      timeline: 'Theo lịch hẹn',
      description: 'Livestream trên kênh cá nhân, test sản phẩm trực tiếp và ghim giỏ hàng.',
    },
  ],
  metrics: [
    {
      key: 'followers',
      label: 'NGƯỜI THEO DÕI',
      value: '126.6K',
      trend: '+12.4% so với tháng trước',
      footer: '58.5% TikTok • 41.5% IG',
      icon: <UserOutlined style={{ color: '#4F46E5' }} />,
      iconBg: '#EEF2FF',
    },
    {
      key: 'views',
      label: 'LƯỢT XEM TB',
      value: '32.4K',
      trend: '+18.7% so với tháng trước',
      footer: 'Phân phối video trung vị',
      icon: <EyeOutlined style={{ color: '#0284C7' }} />,
      iconBg: '#E0F2FE',
    },
    {
      key: 'likes',
      label: 'LƯỢT THÍCH TB',
      value: '2.8K',
      trend: '+14.2% so với tháng trước',
      footer: 'Tương tác phản hồi tốt',
      icon: <HeartFilled style={{ color: '#DB2777' }} />,
      iconBg: '#FDF2F8',
    },
    {
      key: 'engagement',
      label: 'TỶ LỆ TƯƠNG TÁC',
      value: '5.71%',
      trend: '+2.0% so với tháng trước',
      footer: 'Độ tương tác thực tế',
      icon: <RiseOutlined style={{ color: '#059669' }} />,
      iconBg: '#ECFDF5',
    },
    {
      key: 'price',
      label: 'BÁO GIÁ THAM KHẢO',
      value: '3.5M – 5.0M ₫',
      trend: '~ $140 – $200 USD',
      footer: '1 video ngắn / bài đăng',
      icon: <DollarOutlined style={{ color: '#7C3AED' }} />,
      iconBg: '#F3E8FF',
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
    ],
  },
  aiScores: [
    {
      name: 'Điểm bằng chứng lịch sử',
      score: '96/100',
      sub: 'Hợp tác thương hiệu & dữ liệu ROI đã xác minh',
    },
    {
      name: 'Điểm dữ liệu công khai',
      score: '92/100',
      sub: 'Độ nhận diện thương hiệu lan tỏa rộng & search tự nhiên',
    },
    {
      name: 'Điểm phù hợp chiến dịch',
      score: '95/100',
      sub: 'Độ khớp ngành hàng & tệp khách hàng mục tiêu',
    },
    {
      name: 'Điểm thương hiệu đối thủ',
      score: '93/100',
      sub: 'Phù hợp độ hot phong cách sống và hành vi tiêu dùng',
    },
    {
      name: 'Điểm trọng số tổng hợp',
      score: '94/100',
      sub: 'Tính toán tổng hợp từ 5 mô hình đánh giá AI',
    },
  ],
  recentReels: [
    {
      id: 1,
      title: 'Top 3 kem chống nắng kiềm dầu mùa hè',
      views: '32.4K',
      featured: 'Nổi bật',
    },
    {
      id: 2,
      title: 'Routine phục hồi da sau treatment',
      views: '256.7K',
      featured: undefined,
    },
    {
      id: 3,
      title: 'Bí quyết dưỡng ẩm căng bóng mỗi ngày',
      views: '198.4K',
      featured: undefined,
    },
    {
      id: 4,
      title: 'Trải nghiệm 7 ngày chăm sóc da tối giản',
      views: '142.3K',
      featured: undefined,
    },
  ],
};

const KNOWN_CREATORS: Record<string, any> = {
  // Creator Sum từ ảnh người dùng cung cấp
  'cab8b11f-25e2-4c83-88f8-e5886c4878c8': {
    id: 'cab8b11f-25e2-4c83-88f8-e5886c4878c8',
    name: 'Sum',
    username: 'sumspace.vn',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    platform: 'TIKTOK',
    category: 'Mỹ phẩm, Sức khỏe và Làm đẹp',
    categories: ['Mỹ phẩm', 'Sức khỏe & Làm đẹp'],
    followers: '119K',
    followersCount: 119000,
    engagementRate: '9.5%',
    engagementValue: 9.5,
    priceMin: '15,000,000',
    priceMax: '22,000,000',
    priceUSD: '$850 USD',
    matchScore: 38,
    bio: 'KOC chuyên sáng tạo nội dung Mỹ phẩm, Sức khỏe và Làm đẹp, chia sẻ trải nghiệm thực tế và đánh giá chất lượng.',
  },
  'c84cddd9-4ea5-4963-9b55-10981f152c46': {
    id: 'c84cddd9-4ea5-4963-9b55-10981f152c46',
    name: 'Mỹ Di',
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
    bio: 'Nhà sáng tạo nội dung Trang phục, Điện tử, Sức khỏe và Làm đẹp. Đạt độ tương tác cao, tệp người xem trẻ năng động.',
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
    engagementRate: '13.04%',
    engagementValue: 13.04,
    priceMin: '5,000,000',
    priceMax: '7,500,000',
    priceUSD: '$200 – $300 USD',
    matchScore: 99,
    bio: 'Chuyên review trải nghiệm du lịch, ẩm thực và văn hóa các vùng miền. Tương tác cộng đồng cực cao.',
  },
};

const cleanNiche = (niche?: string, name = ''): string => {
  if (!niche || String(niche).toUpperCase() === 'UNKNOWN' || niche.trim() === '') {
    const lower = String(name).toLowerCase();
    if (lower.includes('du lịch') || lower.includes('phượt') || lower.includes('travel')) return 'Du lịch & Khám phá';
    if (lower.includes('thể thao') || lower.includes('sport') || lower.includes('gym')) return 'Thể thao & Fitness';
    if (lower.includes('mỹ phẩm') || lower.includes('làm đẹp') || lower.includes('skin')) return 'Làm đẹp & Mỹ phẩm';
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

export default function CreatorDetailPage() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const location = useLocation();
  const routeCreator = (location.state as any)?.creator;

  // Ẩn ID: Nhận diện ID từ URL, lưu vào session và clean URL thanh địa chỉ
  const [activeCreatorId, setActiveCreatorId] = useState<string>(() => {
    return paramId || sessionStorage.getItem('im_active_creator_id') || 'c1';
  });

  useEffect(() => {
    if (paramId) {
      setActiveCreatorId(paramId);
      sessionStorage.setItem('im_active_creator_id', paramId);
      // Tự động làm sạch thanh địa chỉ URL bar: ẩn chuỗi UUID dài ngoằng
      window.history.replaceState(null, '', '/creators/detail');
    }
  }, [paramId]);

  const [creator, setCreator] = useState(CREATOR_DATA);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ratecard' | 'reels' | 'ai'>('overview');
  const [isSaved, setIsSaved] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [shortlistModalOpen, setShortlistModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimForm] = Form.useForm();

  // Nạp dữ liệu Creator từ backend + cache
  useEffect(() => {
    const targetId = activeCreatorId;
    if (!targetId || targetId === 'c1') {
      setCreator(CREATOR_DATA);
      return;
    }

    let isMounted = true;
    const fetchCreatorData = async () => {
      setLoading(true);
      try {
        let found: any = routeCreator;

        // 1. Kiểm tra KNOWN_CREATORS
        if (!found && KNOWN_CREATORS[targetId]) {
          found = KNOWN_CREATORS[targetId];
        }

        // 2. Kiểm tra cache discovery
        if (!found) {
          try {
            const rawDisc = localStorage.getItem('IM_DISCOVERY_CREATORS');
            if (rawDisc) {
              const dList = JSON.parse(rawDisc);
              found = dList.find((c: any) => c.id === targetId || c.creatorId === targetId);
            }
          } catch {}
        }

        // 3. Gọi Backend API
        let apiDetail: any = null;
        try {
          apiDetail = await creatorService.getCreatorById(targetId);
        } catch {}

        if (!isMounted) return;

        const src = apiDetail || found || CREATOR_DATA;
        const displayName = src.name || src.displayName || src.userName || 'Creator';
        const cleanUser = (src.username || src.userName || displayName).replace(/^@+/, '');
        const nicheStr = cleanNiche(src.category || src.niche || (src.categories && src.categories[0]), displayName);
        const cats = splitCategories(src.categories || nicheStr);
        const followersCount = src.followersCount || (typeof src.followers === 'number' ? src.followers : 119000);
        const followersFmt = followersCount >= 1_000_000
          ? `${(followersCount / 1_000_000).toFixed(1)}M`
          : followersCount >= 1_000
          ? `${Math.round(followersCount / 1_000)}K`
          : `${followersCount}`;
        const engRate = src.engagementValue || (typeof src.engagementRate === 'number' ? src.engagementRate : 5.71);
        const matchVal = src.matchScore || src.matchRate || 92;

        setCreator({
          ...CREATOR_DATA,
          id: targetId,
          name: displayName,
          username: cleanUser,
          avatar: src.avatar || src.avatarUrl || CREATOR_DATA.avatar,
          platform: (src.platform || 'TIKTOK').toUpperCase(),
          categories: cats,
          bio: src.bio || src.contentSummary || `Nhà sáng tạo chuyên về ${nicheStr}, chia sẻ trải nghiệm thực tế và tương tác cao với khán giả trẻ.`,
          matchScore: matchVal,
          matchRank: matchVal >= 85 ? `Top 5% phù hợp nhất trong ngành ${nicheStr}` : `Độ phù hợp tiêu chuẩn cho ngành ${nicheStr}`,
          priceMin: src.priceMin || '5,000,000',
          priceMax: src.priceMax || '8,000,000',
          priceUSD: src.priceUSD || '$200 – $320 USD',
          metrics: [
            {
              key: 'followers',
              label: 'NGƯỜI THEO DÕI',
              value: followersFmt,
              trend: '+12.4% so với tháng trước',
              footer: `Nền tảng chính: ${(src.platform || 'TIKTOK').toUpperCase()}`,
              icon: <UserOutlined style={{ color: '#4F46E5' }} />,
              iconBg: '#EEF2FF',
            },
            {
              key: 'views',
              label: 'LƯỢT XEM TB',
              value: `${Math.round(followersCount * 0.25 / 1000)}K`,
              trend: '+18.7% so với tháng trước',
              footer: 'Phân phối video ổn định',
              icon: <EyeOutlined style={{ color: '#0284C7' }} />,
              iconBg: '#E0F2FE',
            },
            {
              key: 'likes',
              label: 'LƯỢT THÍCH TB',
              value: `${Math.round(followersCount * 0.03 / 1000)}K`,
              trend: '+14.2% so với tháng trước',
              footer: 'Tương tác phản hồi tốt',
              icon: <HeartFilled style={{ color: '#DB2777' }} />,
              iconBg: '#FDF2F8',
            },
            {
              key: 'engagement',
              label: 'TỶ LỆ TƯƠNG TÁC',
              value: `${engRate}%`,
              trend: '+2.0% so với tháng trước',
              footer: 'Độ tương tác thực tế',
              icon: <RiseOutlined style={{ color: '#059669' }} />,
              iconBg: '#ECFDF5',
            },
            {
              key: 'price',
              label: 'BÁO GIÁ THAM KHẢO',
              value: `${src.priceMin || '5.0M'} – ${src.priceMax || '8.0M'} ₫`,
              trend: `~ ${src.priceUSD || '$200 – $320 USD'}`,
              footer: '1 video ngắn / bài đăng',
              icon: <DollarOutlined style={{ color: '#7C3AED' }} />,
              iconBg: '#F3E8FF',
            },
          ],
        });
      } catch (err) {
        console.error('Lỗi khi tải thông tin Creator:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCreatorData();
    return () => {
      isMounted = false;
    };
  }, [activeCreatorId, routeCreator]);

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
        navigator.clipboard?.writeText(window.location.origin + '/creators/detail');
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
      onClick: () => message.success('Đã sao chép thông tin liên hệ của Creator!'),
    },
  ];

  if (loading) {
    return (
      <div className="creator-detail-container" style={{ textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="creator-detail-container">
      {/* ==========================================================================
          1. Modern Luxe Hero Welcome Banner (Đồng bộ 100% với Campaign Detail)
          ========================================================================== */}
      <div className="cdetail-hero-banner">
        {/* Banner Top Row: Breadcrumb Tag + Platform Chip */}
        <div className="cdetail-hero-top-row">
          <div className="cdetail-hero-breadcrumb">
            <span className="cdetail-breadcrumb-tag">HỒ SƠ NHÀ SÁNG TẠO</span>
            <span>Chi tiết & Đánh giá năng lực hợp tác</span>
          </div>

          <div className="cdetail-hero-date-chip">
            <CalendarOutlined style={{ color: '#4F46E5' }} />
            <span>{creator.lastActive}</span>
          </div>
        </div>

        {/* Banner Middle Content: Avatar, Name, Handle, Tags, Bio */}
        <div className="creator-hero-body">
          <div className="creator-hero-avatar-wrap">
            <img
              src={creator.avatar}
              alt={creator.name}
              className="creator-hero-avatar"
              onError={(e) => {
                const fb = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name || 'C')}&background=4F46E5&color=fff&size=200&bold=true`;
                if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
              }}
            />
            {creator.isVerified && (
              <div className="creator-hero-verified-dot" title="Đã xác minh bởi InfluencerMatch">
                <CheckCircleFilled />
              </div>
            )}
          </div>

          <div className="creator-hero-info">
            <div className="creator-hero-name-row">
              <h1 className="creator-hero-title">{creator.name}</h1>
              <span className="creator-hero-handle">@{creator.username}</span>
            </div>

            <div className="cdetail-hero-badge-row">
              {creator.isVerified && (
                <span className="cdetail-hero-tag verified">
                  <CheckOutlined style={{ fontSize: 10, marginRight: 4 }} />
                  ĐÃ XÁC MINH
                </span>
              )}

              <span className={`cdetail-hero-tag platform ${creator.platform.toLowerCase()}`}>
                {creator.platform}
              </span>

              {creator.categories.map((c) => (
                <span key={c} className="cdetail-hero-tag niche">
                  {c}
                </span>
              ))}

              <span className="cdetail-hero-tag">
                <EnvironmentOutlined style={{ marginRight: 4 }} />
                {creator.location}
              </span>
            </div>

            <p className="creator-hero-bio">{creator.bio}</p>
          </div>
        </div>

        {/* Banner Bottom Row: Action Toolbar (Cân đối 2 bên) */}
        <div className="cdetail-hero-toolbar">
          <div className="creator-hero-match-box">
            <span className="creator-match-score-pill">
              🎯 {creator.matchScore}% Phù hợp chiến dịch
            </span>
            <span className="creator-match-rank-label">{creator.matchRank}</span>
          </div>

          <div className="cdetail-hero-actions-group">
            <button
              type="button"
              className="cdetail-hero-btn primary-action"
              onClick={() => {
                setShortlistModalOpen(true);
                setIsSaved(true);
              }}
            >
              <HeartFilled style={{ fontSize: 13 }} />
              {isSaved ? 'Đã trong danh sách chọn' : '+ Lưu vào danh sách chọn'}
            </button>

            <button
              type="button"
              className="cdetail-hero-btn ghost"
              onClick={() => setInviteModalOpen(true)}
            >
              <SendOutlined style={{ fontSize: 13 }} />
              Gửi lời mời hợp tác
            </button>

            <Dropdown menu={{ items: moreMenuItems }} trigger={['click']} placement="bottomRight">
              <button type="button" className="cdetail-hero-btn icon-btn" title="Tùy chọn khác">
                <MoreOutlined style={{ fontSize: 16 }} />
              </button>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* ==========================================================================
          2. 5 Thẻ chỉ số KPI chính (Gom trên 1 hàng duy nhất: Hiệu suất & Báo giá)
          ========================================================================== */}
      <div className="creator-metrics-grid">
        {creator.metrics.map((item) => (
          <div key={item.key} className="creator-metric-card">
            <div className="creator-metric-top">
              <div className="creator-metric-icon-box" style={{ background: item.iconBg }}>
                {item.icon}
              </div>
              <span className="creator-metric-title">{item.label}</span>
            </div>
            <div className="creator-metric-value">{item.value}</div>
            <div className="creator-metric-footer">
              <span>{item.footer}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ==========================================================================
          4. Segmented Pill Tabs Navigation (Aligned with Campaign Detail)
          ========================================================================== */}
      <div className="cdetail-nav-tabs-wrap">
        <div className="cdetail-segmented-tabs">
          <button
            type="button"
            className={`cdetail-seg-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Hiệu suất & Khán giả
          </button>
          <button
            type="button"
            className={`cdetail-seg-tab-btn ${activeTab === 'ratecard' ? 'active' : ''}`}
            onClick={() => setActiveTab('ratecard')}
          >
            Bảng giá dịch vụ (Rate Card)
          </button>
          <button
            type="button"
            className={`cdetail-seg-tab-btn ${activeTab === 'reels' ? 'active' : ''}`}
            onClick={() => setActiveTab('reels')}
          >
            Nội dung nổi bật
          </button>
          <button
            type="button"
            className={`cdetail-seg-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            Đánh giá AI chuyên sâu
          </button>
        </div>
      </div>

      {/* ==========================================================================
          5. Tabs Content Body
          ========================================================================== */}
      {/* TAB 1: HIỆU SUẤT & KHÁN GIẢ */}
      {activeTab === 'overview' && (
        <div className="cdetail-content-card">
          <div className="cdetail-card-header">
            <h3 className="cdetail-card-title">Nhân khẩu học khán giả (Audience Demographics)</h3>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              Cỡ mẫu: {creator.demographics.sampleSize}
            </span>
          </div>

          <div className="creator-demographics-grid">
            {/* Box 1: Giới tính */}
            <div className="demo-box">
              <div className="demo-box-header">Phân bố giới tính</div>
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

            {/* Box 2: Độ tuổi */}
            <div className="demo-box">
              <div className="demo-box-header">Nhóm tuổi khán giả</div>
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

            {/* Box 3: Địa phương */}
            <div className="demo-box">
              <div className="demo-box-header">Địa bàn hàng đầu (Việt Nam)</div>
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

          {/* Interests */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
              Sở thích & Chủ đề quan tâm
            </div>
            <div className="creator-interests-wrap">
              {creator.demographics.interests.map((it) => (
                <span
                  key={it.name}
                  className={`creator-interest-pill ${it.highlight ? 'highlight' : ''}`}
                >
                  {it.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BẢNG GIÁ DỊCH VỤ (RATE CARD) */}
      {activeTab === 'ratecard' && (
        <div className="cdetail-content-card">
          <div className="cdetail-card-header">
            <div>
              <h3 className="cdetail-card-title">Bảng giá dịch vụ tiêu chuẩn (Rate Card)</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
                Chi phí ước tính niêm yết theo từng hạng mục sản xuất nội dung của {creator.name}
              </p>
            </div>
            <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600 }}>
              Đồng bộ dữ liệu Rate Card
            </Tag>
          </div>

          <div className="creator-ratecard-grid">
            {creator.rateCardItems.map((pkg) => (
              <div key={pkg.id} className="creator-ratecard-box">
                <div>
                  <div className="creator-ratecard-title-row">
                    <span className="creator-ratecard-name">{pkg.deliverable}</span>
                    <Tag color="blue" style={{ borderRadius: 4, margin: 0, fontSize: 11 }}>
                      {pkg.timeline}
                    </Tag>
                  </div>
                  <p className="creator-ratecard-desc">{pkg.description}</p>
                </div>

                <div className="creator-ratecard-footer">
                  <div>
                    <div className="creator-ratecard-price">
                      {pkg.price.toLocaleString('vi-VN')} ₫
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>~ {pkg.priceUSD}</div>
                  </div>

                  <Button
                    type="primary"
                    size="small"
                    style={{ background: '#4F46E5', borderRadius: 6, fontWeight: 600 }}
                    onClick={() => setShortlistModalOpen(true)}
                  >
                    Chọn gói này
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: NỘI DUNG NỔI BẬT */}
      {activeTab === 'reels' && (
        <div className="cdetail-content-card">
          <div className="cdetail-card-header">
            <h3 className="cdetail-card-title">Các nội dung và video tiêu biểu</h3>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              Cập nhật từ kênh {creator.platform}
            </span>
          </div>

          <div className="creator-content-grid">
            {creator.recentReels.map((reel) => (
              <div key={reel.id} className="creator-video-card">
                <div className="creator-video-thumb">
                  {reel.featured && <span className="creator-video-badge">{reel.featured}</span>}
                  <PlayCircleOutlined />
                </div>
                <div className="creator-video-body">
                  <div className="creator-video-title" title={reel.title}>
                    {reel.title}
                  </div>
                  <div className="creator-video-views">{reel.views} lượt xem</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ĐÁNH GIÁ AI CHUYÊN SÂU */}
      {activeTab === 'ai' && (
        <div className="cdetail-content-card">
          <div className="cdetail-card-header">
            <div>
              <h3 className="cdetail-card-title">Mô hình phân tích điểm số AI đa chiều</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
                Hệ thống AI đối soát 5 trọng số mô hình đối chiếu với chiến dịch
              </p>
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#4F46E5' }}>
              {creator.matchScore}/100
            </span>
          </div>

          <div className="creator-aiscore-list">
            {creator.aiScores.map((item) => (
              <div key={item.name} className="creator-aiscore-item">
                <div>
                  <div className="creator-aiscore-name">{item.name}</div>
                  <div className="creator-aiscore-sub">{item.sub}</div>
                </div>
                <div className="creator-aiscore-score">{item.score}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Bottom Navigation Bar: Nút quay lại sàn khám phá */}
      <div className="cdetail-bottom-footer-bar">
        <button
          type="button"
          className="cdetail-bottom-back-btn"
          onClick={() => navigate('/creators')}
          title="Quay lại sàn khám phá Nhà sáng tạo"
        >
          <ArrowLeftOutlined style={{ fontSize: 13 }} />
          Quay lại sàn khám phá
        </button>
      </div>

      {/* Modal: Thêm vào Danh sách chọn */}
      <AddToShortlistModal
        open={shortlistModalOpen}
        onClose={() => setShortlistModalOpen(false)}
        creator={{
          id: creator.id,
          name: creator.name,
          avatar: creator.avatar,
          username: creator.username,
          niche: creator.categories[0],
        }}
        onSuccess={() => setIsSaved(true)}
      />

      {/* Modal: Gửi lời mời hợp tác */}
      <Modal
        title={`Gửi lời mời hợp tác tới ${creator.name}`}
        open={inviteModalOpen}
        onCancel={() => setInviteModalOpen(false)}
        footer={null}
        width={520}
      >
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>
            Lời mời sẽ được gửi trực tiếp tới email và kênh đại diện của {creator.name}.
          </p>
          <Form
            layout="vertical"
            onFinish={() => {
              message.success(`Đã gửi lời mời hợp tác tới ${creator.name} thành công!`);
              setInviteModalOpen(false);
            }}
          >
            <Form.Item label="Email liên hệ của bạn" name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }]}>
              <Input placeholder="brand@example.com" />
            </Form.Item>
            <Form.Item label="Mức ngân sách đề xuất (VND)" name="fee">
              <Input placeholder="Ví dụ: 5.000.000" />
            </Form.Item>
            <Form.Item label="Lời nhắn đính kèm" name="message">
              <Input.TextArea
                rows={3}
                defaultValue={`Xin chào ${creator.name}, chúng tôi rất ấn tượng với nội dung của bạn và muốn mời bạn hợp tác trong chiến dịch sắp tới.`}
              />
            </Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button onClick={() => setInviteModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#4F46E5' }}>
                Gửi lời mời ngay
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Modal: Xác minh sở hữu kênh (Claim) */}
      <Modal
        title="Xác minh sở hữu hồ sơ (Claim Profile)"
        open={claimModalOpen}
        onCancel={() => setClaimModalOpen(false)}
        footer={null}
        width={500}
      >
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>
            Nếu bạn là chủ sở hữu hoặc quản lý của kênh @{creator.username}, vui lòng cung cấp bằng chứng để claim hồ sơ.
          </p>
          <Form
            form={claimForm}
            layout="vertical"
            onFinish={async (values) => {
              try {
                setClaimSubmitting(true);
                await claimService.submitClaim(creator.id, {
                  evidenceUrls: values.evidenceUrls ? values.evidenceUrls.split('\n').filter(Boolean) : [],
                  note: values.note,
                });
                message.success('Đã gửi yêu cầu xác minh sở hữu kênh thành công!');
                setClaimModalOpen(false);
              } catch (err: any) {
                message.error('Không thể gửi yêu cầu xác minh. Vui lòng thử lại sau.');
              } finally {
                setClaimSubmitting(false);
              }
            }}
          >
            <Form.Item label="Liên kết bằng chứng sở hữu" name="evidenceUrls" rules={[{ required: true, message: 'Vui lòng nhập link bằng chứng!' }]}>
              <Input.TextArea rows={3} placeholder="Link bài post xác nhận, ảnh chụp màn hình quản trị kênh..." />
            </Form.Item>
            <Form.Item label="Ghi chú thêm" name="note">
              <Input.TextArea rows={2} placeholder="Thông tin liên hệ bổ sung..." />
            </Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setClaimModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={claimSubmitting} style={{ background: '#4F46E5' }}>
                Gửi xác minh
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
