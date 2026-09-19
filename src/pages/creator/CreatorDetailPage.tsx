import React, { useState } from 'react';
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
} from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import {
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
} from '@ant-design/icons';
import './CreatorDetailPage.css';

// Demographic & Stats Mock Data for Linh Nguyễn
const CREATOR_DATA = {
  id: 'c1',
  name: 'Linh Nguyễn',
  username: 'linhnguyen.official',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  isVerified: true,
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

export default function CreatorDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('performance');
  const [isSaved, setIsSaved] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [shortlistModalOpen, setShortlistModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedReel, setSelectedReel] = useState<(typeof CREATOR_DATA.recentReels)[0] | null>(null);
  const [sampleSizeFilter, setSampleSizeFilter] = useState('126.5k người theo dõi');

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
    setIsSaved(!isSaved);
    if (!isSaved) {
      message.success(`Đã thêm ${CREATOR_DATA.name} vào danh sách chiến dịch!`);
    } else {
      message.info(`Đã xóa ${CREATOR_DATA.name} khỏi danh sách.`);
    }
  };

  const handleSendInvite = (values: any) => {
    message.success(`Đã gửi lời mời hợp tác tới ${CREATOR_DATA.name}!`);
    setInviteModalOpen(false);
  };

  return (
    <div className="creator-detail-container">
      {/* 1. Breadcrumb & Back Button */}
      <div className="creator-detail-breadcrumb">
        <div className="breadcrumb-path">
          <span className="breadcrumb-link" onClick={() => navigate('/campaigns')}>
            Chiến dịch
          </span>
          <span>›</span>
          <span className="breadcrumb-link" onClick={() => navigate('/creators')}>
            Khám phá Creator
          </span>
          <span>›</span>
          <span className="breadcrumb-current">Hồ sơ Creator</span>
        </div>

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
                src={CREATOR_DATA.avatar}
                alt={CREATOR_DATA.name}
                className="creator-avatar-img"
              />
              <span className="creator-avatar-caption">LINH NGUYEN</span>
              <div className="creator-verified-badge">
                <CheckOutlined style={{ fontSize: 11, fontWeight: 900 }} />
              </div>
            </div>

            {/* Creator Info details */}
            <div className="creator-info-content">
              {/* Name & Handle */}
              <div className="creator-name-row">
                <h1 className="creator-display-name">{CREATOR_DATA.name}</h1>
                <CheckCircleFilled style={{ color: '#2563EB', fontSize: 17 }} />
                <span className="creator-handle-badge">@{CREATOR_DATA.username}</span>
              </div>

              {/* Social Platforms & Tags */}
              <div className="creator-tags-row">
                {/* TikTok */}
                <Tooltip title="Kênh TikTok: @linhnguyen.official (74K followers)">
                  <span className="social-icon-circle social-icon-tiktok">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.35 22a6.33 6.33 0 0 0 6.33-6.32V8.92a8.31 8.31 0 0 0 4.91 1.6V7.07a4.8 4.8 0 0 1-1-.38z" />
                    </svg>
                  </span>
                </Tooltip>

                {/* Instagram */}
                <Tooltip title="Kênh Instagram: @linhnguyen.official (52K followers)">
                  <span className="social-icon-circle social-icon-instagram">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </span>
                </Tooltip>

                {/* Verified tag */}
                <span className="tag-verified-creator">
                  <CheckCircleFilled style={{ fontSize: 11 }} />
                  Creator đã xác minh
                </span>

                {/* Category tags */}
                <span className="tag-category-active">{CREATOR_DATA.categories[0]}</span>
                <span className="tag-category-normal">{CREATOR_DATA.categories[1]}</span>
              </div>

              {/* Location & Status Meta */}
              <div className="creator-meta-row">
                <span className="creator-meta-item">
                  <EnvironmentOutlined style={{ color: '#64748B' }} />
                  {CREATOR_DATA.location}
                </span>
                <span className="creator-meta-item">
                  <WomanOutlined style={{ color: '#64748B' }} />
                  {CREATOR_DATA.gender}
                </span>
                <span className="creator-meta-item" style={{ color: '#10B981', fontWeight: 600 }}>
                  <span className="status-active-dot" />
                  {CREATOR_DATA.lastActive}
                </span>
              </div>

              {/* Bio description */}
              <p className="creator-bio-text">{CREATOR_DATA.bio}</p>
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
                  strokeDashoffset="10.5"
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
                <span className="match-score-number">{CREATOR_DATA.matchScore}</span>
                <span className="match-score-denominator">/100</span>
              </div>
            </div>

            {/* Match Label & Rank */}
            <div>
              <div className="match-title-row">
                <span className="match-title">Độ khớp AI</span>
                <span className="match-trust-tag">Độ tin cậy cao</span>
              </div>
              <div className="match-rank-text">{CREATOR_DATA.matchRank}</div>
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
                {CREATOR_DATA.priceMin} – {CREATOR_DATA.priceMax}
              </span>
              <span className="pricing-currency-unit">VND</span>
            </div>

            <div className="pricing-usd-equivalent">
              ~ {CREATOR_DATA.priceUSD} • 1 dedicated video / reel
            </div>
          </div>

          {/* Bottom Verification Badges */}
          <div className="match-badges-row">
            <span className="badge-verified-campaigns">
              <CheckCircleFilled style={{ color: '#2563EB' }} />
              Xác thực qua {CREATOR_DATA.verifiedCampaignsCount} chiến dịch
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
          <span>📊</span>
          Phân tích điểm số AI
        </div>
        <div
          className={`creator-tab-item ${activeTab === 'recent_content' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent_content')}
        >
          <span>🎬</span>
          Nội dung gần đây
        </div>
        <div
          className={`creator-tab-item ${activeTab === 'campaign_history' ? 'active' : ''}`}
          onClick={() => setActiveTab('campaign_history')}
        >
          <span>📋</span>
          Lịch sử chiến dịch thực tế
        </div>
        <div
          className={`creator-tab-item ${activeTab === 'algorithm' ? 'active' : ''}`}
          onClick={() => setActiveTab('algorithm')}
        >
          <span>✨</span>
          Giải thích thuật toán ghép nối
        </div>
      </div>

      {/* 4. 5 Metrics Cards Grid */}
      <div className="metrics-5-grid">
        {CREATOR_DATA.metrics.map((item) => (
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

            <Dropdown menu={{ items: sampleItems }} trigger={['click']}>
              <span className="demographics-sample-dropdown">
                Cỡ mẫu: {sampleSizeFilter} <DownOutlined style={{ fontSize: 10 }} />
              </span>
            </Dropdown>
          </div>

          {/* 3 Columns Breakdown */}
          <div className="demographics-columns-grid">
            {/* Col 1: Gender */}
            <div>
              <div className="demo-col-header">
                <WomanOutlined style={{ color: '#4F46E5' }} />
                PHÂN BỐ GIỚI TÍNH
              </div>
              {CREATOR_DATA.demographics.gender.map((g) => (
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
              {CREATOR_DATA.demographics.age.map((a) => (
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
              {CREATOR_DATA.demographics.locations.map((loc) => (
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
              {CREATOR_DATA.demographics.interests.map((interest) => (
                <span
                  key={interest.name}
                  className={`interest-tag-item ${interest.highlight ? 'highlight' : ''}`}
                >
                  {interest.name}
                </span>
              ))}
            </div>
          </div>
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
              <span className="ai-score-total-badge">94/100</span>
            </div>
            <div className="ai-score-subtitle">
              Đánh giá đa chiều dựa trên trọng số mô hình
            </div>

            <div className="ai-score-list">
              {CREATOR_DATA.aiScores.map((item) => (
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

      {/* 6. Recent Content Section (Nội dung gần đây) */}
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
            onClick={() => message.info('Hiển thị tất cả 48 video gần đây của creator')}
          >
            Xem tất cả ›
          </span>
        </div>

        {/* 5 Reels Video Cards */}
        <div className="recent-reels-grid">
          {CREATOR_DATA.recentReels.map((reel) => (
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
      </div>

      {/* Modal: Direct Collaboration Invite */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SendOutlined style={{ color: '#4F46E5' }} />
            <span>Gửi lời mời hợp tác trực tiếp tới {CREATOR_DATA.name}</span>
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
            initialValue={`Chào ${CREATOR_DATA.name}, chúng tôi rất ấn tượng với phong cách và tương tác tự nhiên của bạn trong ngành làm đẹp...`}
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

      {/* Modal: Quick Contact */}
      <Modal
        title="Liên hệ trực tiếp với Creator"
        open={contactModalOpen}
        onCancel={() => setContactModalOpen(false)}
        footer={null}
        width={450}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
          <div
            style={{
              padding: 14,
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MailOutlined style={{ fontSize: 18, color: '#2563EB' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>Email Quản Lý / Booking</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>contact.linhnguyen@influencermatch.vn</div>
              </div>
            </div>
            <Button
              size="small"
              onClick={() => {
                navigator.clipboard?.writeText('contact.linhnguyen@influencermatch.vn');
                message.success('Đã sao chép email!');
              }}
            >
              Sao chép
            </Button>
          </div>

          <div
            style={{
              padding: 14,
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <PhoneOutlined style={{ fontSize: 18, color: '#10B981' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>Hotline / Zalo Booking</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>+84 908 123 456 (Ms. Hằng - Manager)</div>
              </div>
            </div>
            <Button
              size="small"
              onClick={() => {
                navigator.clipboard?.writeText('+84908123456');
                message.success('Đã sao chép số điện thoại!');
              }}
            >
              Sao chép
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
    </div>
  );
}
