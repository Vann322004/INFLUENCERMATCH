import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Checkbox,
  Dropdown,
  message,
  Modal,
  Form,
  Tooltip,
} from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SaveOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  CheckCircleFilled,
  MoreOutlined,
  DownloadOutlined,
  DownOutlined,
  BookOutlined,
  UserOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  HeartFilled,
  MessageOutlined,
  ShareAltOutlined,
  EnvironmentOutlined,
  WomanOutlined,
  AimOutlined,
  BarChartOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  RightOutlined,
  FilePdfOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import './CreatorShortlistPage.css';

interface CreatorCompareItem {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isVerified: boolean;
  matchLevel: 'high' | 'med';
  matchText: string;
  platforms: string[];
  categories: string[];
  followers: string;
  followersPercent: number;
  views: string;
  viewsPercent: number;
  engagement: string;
  engagementPercent: number;
  likes: string;
  likesPercent: number;
  comments: string;
  commentsPercent: number;
  shares: string;
  sharesPercent: number;
  price: string;
  location: string;
  gender: {
    female: number;
    male: number;
  };
  interests: string[];
  note: string;
  noteType: 'high' | 'med' | 'neutral';
  selected: boolean;
}

const INITIAL_COMPARE_CREATORS: CreatorCompareItem[] = [
  {
    id: 'c1',
    name: 'Linh Nguyễn',
    username: 'linhnguyen.official',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchLevel: 'high',
    matchText: 'Khớp cao',
    platforms: ['tiktok', 'instagram'],
    categories: ['Làm đẹp & Chăm sóc da', 'Phong cách sống'],
    followers: '1.2M',
    followersPercent: 100,
    views: '32.4K',
    viewsPercent: 100,
    engagement: '8.7%',
    engagementPercent: 100,
    likes: '4.1K',
    likesPercent: 100,
    comments: '340',
    commentsPercent: 100,
    shares: '120',
    sharesPercent: 100,
    price: '$1.2K',
    location: 'Việt Nam (78%)',
    gender: { female: 78, male: 22 },
    interests: ['Chăm sóc da', 'Làm đẹp', 'Đời sống'],
    note: 'Phù hợp hoàn hảo với mục tiêu',
    noteType: 'high',
    selected: true,
  },
  {
    id: 'c2',
    name: 'Minh Hoàng',
    username: 'minhhoang.92',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchLevel: 'high',
    matchText: 'Khớp cao',
    platforms: ['tiktok', 'youtube'],
    categories: ['Thời trang', 'Phong cách sống'],
    followers: '856K',
    followersPercent: 71,
    views: '28.7K',
    viewsPercent: 88,
    engagement: '6.2%',
    engagementPercent: 71,
    likes: '3.2K',
    likesPercent: 78,
    comments: '210',
    commentsPercent: 62,
    shares: '87',
    sharesPercent: 72,
    price: '$980',
    location: 'Việt Nam (72%)',
    gender: { female: 72, male: 28 },
    interests: ['Thời trang', 'Đời sống', 'Du lịch'],
    note: 'Tệp khán giả & tương tác rất tốt',
    noteType: 'high',
    selected: true,
  },
  {
    id: 'c3',
    name: 'Thảo Vy',
    username: 'thaovy.official',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    matchLevel: 'med',
    matchText: 'Khớp TB',
    platforms: ['instagram', 'tiktok'],
    categories: ['Ẩm thực & Đồ uống', 'Phong cách sống'],
    followers: '542K',
    followersPercent: 45,
    views: '19.6K',
    viewsPercent: 60,
    engagement: '5.1%',
    engagementPercent: 58,
    likes: '2.1K',
    likesPercent: 51,
    comments: '150',
    commentsPercent: 44,
    shares: '62',
    sharesPercent: 51,
    price: '$750',
    location: 'Việt Nam (68%)',
    gender: { female: 68, male: 32 },
    interests: ['Ẩm thực', 'Đời sống', 'Nấu ăn'],
    note: 'Phù hợp, cân nhắc cho tệp ngách',
    noteType: 'med',
    selected: true,
  },
  {
    id: 'c4',
    name: 'Đức Anh',
    username: 'ducanh.travel',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isVerified: false,
    matchLevel: 'med',
    matchText: 'Khớp TB',
    platforms: ['tiktok', 'facebook'],
    categories: ['Du lịch', 'Phong cách sống'],
    followers: '421K',
    followersPercent: 35,
    views: '15.2K',
    viewsPercent: 47,
    engagement: '4.8%',
    engagementPercent: 55,
    likes: '1.8K',
    likesPercent: 44,
    comments: '120',
    commentsPercent: 35,
    shares: '45',
    sharesPercent: 37,
    price: '$620',
    location: 'Việt Nam (61%)',
    gender: { female: 61, male: 39 },
    interests: ['Du lịch', 'Trải nghiệm', 'Đời sống'],
    note: 'Nội dung du lịch mạnh, tiềm năng tốt',
    noteType: 'neutral',
    selected: false,
  },
];

export default function CreatorShortlistPage() {
  const navigate = useNavigate();
  const [creators, setCreators] = useState<CreatorCompareItem[]>(INITIAL_COMPARE_CREATORS);
  const [activeTab, setActiveTab] = useState('overview');
  const [metricFilter, setMetricFilter] = useState('engagement');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Toggle selection checkbox for comparison
  const handleToggleSelect = (id: string) => {
    setCreators((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  // Render social platform icons
  const renderPlatformIcon = (platform: string) => {
    if (platform === 'tiktok') {
      return (
        <span
          key={platform}
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#0F172A',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.35 22a6.33 6.33 0 0 0 6.33-6.32V8.92a8.31 8.31 0 0 0 4.91 1.6V7.07a4.8 4.8 0 0 1-1-.38z" />
          </svg>
        </span>
      );
    }
    if (platform === 'instagram') {
      return (
        <span
          key={platform}
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
          </svg>
        </span>
      );
    }
    if (platform === 'youtube') {
      return (
        <span
          key={platform}
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#EF4444',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 800,
          }}
        >
          ▶
        </span>
      );
    }
    if (platform === 'facebook') {
      return (
        <span
          key={platform}
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#2563EB',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 800,
          }}
        >
          f
        </span>
      );
    }
    return null;
  };

  // More menu for card
  const getCardMoreMenu = (creator: CreatorCompareItem): MenuProps['items'] => [
    {
      key: 'invite',
      label: 'Mời vào chiến dịch',
      icon: <ThunderboltOutlined />,
      onClick: () => navigate('/campaigns/create'),
    },
    {
      key: 'share',
      label: 'Chia sẻ hồ sơ',
      icon: <ShareAltOutlined />,
      onClick: () => {
        navigator.clipboard?.writeText(window.location.origin + '/creators/' + creator.id);
        message.success('Đã sao chép liên kết creator!');
      },
    },
    {
      key: 'remove',
      label: 'Xóa khỏi danh sách',
      danger: true,
      onClick: () => {
        setCreators((prev) => prev.filter((c) => c.id !== creator.id));
        message.info(`Đã xóa ${creator.name} khỏi danh sách so sánh`);
      },
    },
  ];

  return (
    <div className="shortlist-page-container">
      {/* 1. Breadcrumb */}
      <div className="shortlist-breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/campaigns')}>
          Chiến dịch
        </span>
        <span>›</span>
        <span className="breadcrumb-link" onClick={() => navigate('/creators')}>
          Khám phá Creator
        </span>
        <span>›</span>
        <span className="breadcrumb-current">Danh sách chọn</span>
      </div>

      {/* 2. Header & Title Bar */}
      <div className="shortlist-header-row">
        <div>
          <div className="shortlist-title-wrap">
            <h1 className="shortlist-main-title">Danh sách chọn & So sánh Creator</h1>
            <span className="shortlist-tagline-cursive">
              Creator chất lượng hơn. Tác động mạnh mẽ hơn ✨
            </span>
          </div>
          <div className="shortlist-description">
            So sánh các creator trong danh sách chọn và tìm kiếm ứng viên phù hợp nhất cho chiến dịch của bạn.
          </div>
        </div>

        <div className="shortlist-header-actions">
          <Button
            className="btn-save-shortlist"
            icon={<SaveOutlined />}
            onClick={() => message.success('Đã lưu danh sách chọn thành công!')}
          >
            Lưu danh sách
          </Button>

          <Button
            className="btn-add-creator-primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalOpen(true)}
          >
            Thêm Creator
          </Button>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="shortlist-filters-container">
        {/* Top Search & Actions */}
        <div className="filters-top-row">
          <div className="search-input-wrap">
            <Input
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              placeholder="Tìm kiếm creator theo tên, lĩnh vực hoặc từ khóa..."
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters-top-actions">
            <div className="sort-label-wrap">
              <span>Sắp xếp theo:</span>
              <Select
                defaultValue="match"
                size="small"
                style={{ width: 140 }}
                options={[
                  { value: 'match', label: 'Điểm tương thích' },
                  { value: 'followers', label: 'Lượng người theo dõi' },
                  { value: 'engagement', label: 'Tỷ lệ tương tác' },
                  { value: 'price', label: 'Chi phí ước tính' },
                ]}
              />
            </div>

            <button className="btn-filter-count">
              <FilterOutlined style={{ color: '#6366F1' }} />
              Bộ lọc (2)
            </button>

            <span
              className="link-clear-filters"
              onClick={() => {
                setSearchTerm('');
                message.info('Đã xóa tất cả bộ lọc');
              }}
            >
              Xóa tất cả
            </span>
          </div>
        </div>

        {/* Bottom Filter Chips */}
        <div className="filters-bottom-row">
          <div className="filter-chips-list">
            <div className="filter-chip-select">
              <span>Nền tảng:</span>
              <span style={{ color: '#2563EB' }}>TikTok, Instagram</span>
              <DownOutlined style={{ fontSize: 10 }} />
            </div>

            <div className="filter-chip-select">
              <span>Lĩnh vực:</span>
              <span style={{ color: '#2563EB' }}>Làm đẹp & Chăm sóc da</span>
              <DownOutlined style={{ fontSize: 10 }} />
            </div>

            <div className="filter-chip-select">
              <span>Địa điểm:</span>
              <span style={{ color: '#2563EB' }}>Việt Nam</span>
              <DownOutlined style={{ fontSize: 10 }} />
            </div>

            <div className="filter-chip-select">
              <span>Người theo dõi:</span>
              <span style={{ color: '#2563EB' }}>10K – 100K</span>
              <DownOutlined style={{ fontSize: 10 }} />
            </div>
          </div>

          <div
            className="link-save-filters"
            onClick={() => message.success('Đã lưu mẫu bộ lọc tùy chỉnh!')}
          >
            <BookOutlined />
            <span>Lưu bộ lọc</span>
          </div>
        </div>
      </div>

      {/* 4. Comparison Cards Row (4 Cards) */}
      <div className="comparison-cards-grid">
        {creators.map((c) => {
          const isHigh = c.matchLevel === 'high';
          return (
            <div
              key={c.id}
              className={`creator-compare-card ${c.selected ? 'selected' : ''}`}
            >
              {/* Card Top: Checkbox & Match badge */}
              <div className="card-top-controls">
                <Checkbox
                  checked={c.selected}
                  onChange={() => handleToggleSelect(c.id)}
                />

                <span
                  className={`match-badge-pill ${
                    isHigh ? 'match-badge-high' : 'match-badge-med'
                  }`}
                >
                  ✦ {c.matchText}
                </span>
              </div>

              {/* Card Center: Avatar & Names */}
              <div className="card-avatar-wrap">
                <img src={c.avatar} alt={c.name} className="creator-card-avatar" />
                <div className="creator-card-name-row">
                  <span className="creator-card-name">{c.name}</span>
                  {c.isVerified && (
                    <CheckCircleFilled style={{ color: '#2563EB', fontSize: 13 }} />
                  )}
                </div>
                <span className="creator-card-username">@{c.username}</span>

                {/* Social icons */}
                <div className="card-social-icons">
                  {c.platforms.map(renderPlatformIcon)}
                </div>

                {/* Category tags */}
                <div className="card-cat-tags">
                  <span className="cat-pill-tag primary-cat">{c.categories[0]}</span>
                  {c.categories[1] && (
                    <span className="cat-pill-tag">{c.categories[1]}</span>
                  )}
                </div>
              </div>

              {/* 3-Col Stats */}
              <div className="card-stats-grid">
                <div className="card-stat-col">
                  <span className="card-stat-num">{c.followers}</span>
                  <span className="card-stat-title">Người theo dõi</span>
                </div>
                <div className="card-stat-col">
                  <span className="card-stat-num">{c.engagement}</span>
                  <span className="card-stat-title">Tỷ lệ tương tác</span>
                </div>
                <div className="card-stat-col">
                  <span className="card-stat-num">{c.price}</span>
                  <span className="card-stat-title">Giá TB / bài viết</span>
                </div>
              </div>

              {/* Recommendation Note */}
              <div className={`card-recommendation-box ${c.noteType}`}>
                ✓ {c.note}
              </div>

              {/* Bottom Action Buttons */}
              <div className="card-actions-row">
                <Button
                  className="btn-card-view-profile"
                  onClick={() => navigate(`/creators/${c.id}`)}
                >
                  Xem hồ sơ
                </Button>

                <Dropdown menu={{ items: getCardMoreMenu(c) }} trigger={['click']} placement="bottomRight">
                  <Button className="btn-card-more" icon={<MoreOutlined />} />
                </Dropdown>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Tabs Navigation Bar */}
      <div className="shortlist-tabs-row">
        <div
          className={`shortlist-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChartOutlined />
          Tổng quan so sánh
        </div>

        <div
          className={`shortlist-tab-item ${activeTab === 'audience' ? 'active' : ''}`}
          onClick={() => setActiveTab('audience')}
        >
          <TeamOutlined />
          Khán giả
        </div>

        <div
          className={`shortlist-tab-item ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          <VideoCameraOutlined />
          Nội dung
        </div>

        <div
          className={`shortlist-tab-item ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <RiseOutlined />
          Hiệu suất
        </div>

        <div
          className={`shortlist-tab-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <ClockCircleOutlined />
          Dữ liệu lịch sử
        </div>
      </div>

      {/* 6. Comparison Table / Matrix */}
      <div className="comparison-matrix-card">
        {/* Table Header Controls */}
        <div className="matrix-header-row">
          <div>
            <h3 className="matrix-title">Tổng quan so sánh</h3>
            <div className="matrix-subtitle">
              So sánh các chỉ số chính giữa những creator đã chọn
            </div>
          </div>

          <div className="matrix-header-controls">
            <div className="matrix-metric-select-wrap">
              <span>Chỉ số:</span>
              <Select
                value={metricFilter}
                onChange={setMetricFilter}
                size="small"
                style={{ width: 140 }}
                options={[
                  { value: 'engagement', label: 'Tỷ lệ tương tác' },
                  { value: 'views', label: 'Lượt xem TB' },
                  { value: 'followers', label: 'Người theo dõi' },
                  { value: 'price', label: 'Giá dự kiến' },
                ]}
              />
            </div>

            <Button
              className="btn-download-report"
              icon={<DownloadOutlined />}
              onClick={() => {
                message.loading('Đang chuẩn bị file xuất báo cáo...');
                setTimeout(() => {
                  message.success('Đã tải xuống file so sánh Creator (PDF/Excel)!');
                }, 1000);
              }}
            >
              Tải báo cáo
            </Button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="matrix-table-wrap">
          <table className="matrix-table">
            <thead>
              <tr>
                <th className="matrix-col-indicator">CHỈ SỐ PHÂN TÍCH</th>
                {creators.map((c) => (
                  <th key={c.id} className="matrix-creator-col-header">
                    <div className="creator-header-cell">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="creator-header-avatar"
                      />
                      <div className="creator-header-info">
                        <span className="creator-header-name">{c.name}</span>
                        <span className="creator-header-user">@{c.username}</span>
                        <span
                          className={`creator-header-match-tag ${
                            c.matchLevel === 'high'
                              ? 'tag-match-high'
                              : c.selected
                              ? 'tag-match-med'
                              : 'tag-match-pending'
                          }`}
                        >
                          {c.selected ? c.matchText : 'Chờ duyệt'}
                        </span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Row 1: Người theo dõi */}
              <tr>
                <td>
                  <div className="indicator-row-name">
                    <UserOutlined style={{ color: '#4F46E5' }} />
                    <span>Người theo dõi</span>
                  </div>
                </td>
                {creators.map((c, idx) => (
                  <td key={c.id}>
                    <div className="metric-cell-value-wrap">
                      <span className="metric-cell-num">{c.followers}</span>
                      <div className="metric-cell-bar-track">
                        <div
                          className={`metric-cell-bar-fill ${
                            idx === 0 || idx === 1 ? 'bar-blue' : idx === 2 ? 'bar-orange' : 'bar-slate'
                          }`}
                          style={{ width: `${c.followersPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 2: Lượt xem TB */}
              <tr>
                <td>
                  <div className="indicator-row-name">
                    <EyeOutlined style={{ color: '#06B6D4' }} />
                    <span>Lượt xem TB</span>
                  </div>
                </td>
                {creators.map((c, idx) => (
                  <td key={c.id}>
                    <div className="metric-cell-value-wrap">
                      <span className="metric-cell-num">{c.views}</span>
                      <div className="metric-cell-bar-track">
                        <div
                          className={`metric-cell-bar-fill ${
                            idx === 0 || idx === 1 ? 'bar-blue' : idx === 2 ? 'bar-orange' : 'bar-slate'
                          }`}
                          style={{ width: `${c.viewsPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 3: Tỷ lệ tương tác */}
              <tr>
                <td>
                  <div className="indicator-row-name">
                    <ThunderboltOutlined style={{ color: '#EC4899' }} />
                    <span>Tỷ lệ tương tác</span>
                  </div>
                </td>
                {creators.map((c, idx) => (
                  <td key={c.id}>
                    <div className="metric-cell-value-wrap">
                      <span className="metric-cell-num">{c.engagement}</span>
                      <div className="metric-cell-bar-track">
                        <div
                          className={`metric-cell-bar-fill ${
                            idx === 0 || idx === 1 ? 'bar-blue' : idx === 2 ? 'bar-orange' : 'bar-slate'
                          }`}
                          style={{ width: `${c.engagementPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 4: Lượt thích TB */}
              <tr>
                <td>
                  <div className="indicator-row-name">
                    <HeartFilled style={{ color: '#EF4444' }} />
                    <span>Lượt thích TB</span>
                  </div>
                </td>
                {creators.map((c, idx) => (
                  <td key={c.id}>
                    <div className="metric-cell-value-wrap">
                      <span className="metric-cell-num">{c.likes}</span>
                      <div className="metric-cell-bar-track">
                        <div
                          className={`metric-cell-bar-fill ${
                            idx === 0 || idx === 1 ? 'bar-blue' : idx === 2 ? 'bar-orange' : 'bar-slate'
                          }`}
                          style={{ width: `${c.likesPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 5: Bình luận TB */}
              <tr>
                <td>
                  <div className="indicator-row-name">
                    <MessageOutlined style={{ color: '#8B5CF6' }} />
                    <span>Bình luận TB</span>
                  </div>
                </td>
                {creators.map((c, idx) => (
                  <td key={c.id}>
                    <div className="metric-cell-value-wrap">
                      <span className="metric-cell-num">{c.comments}</span>
                      <div className="metric-cell-bar-track">
                        <div
                          className={`metric-cell-bar-fill ${
                            idx === 0 || idx === 1 ? 'bar-blue' : idx === 2 ? 'bar-orange' : 'bar-slate'
                          }`}
                          style={{ width: `${c.commentsPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 6: Lượt chia sẻ TB */}
              <tr>
                <td>
                  <div className="indicator-row-name">
                    <ShareAltOutlined style={{ color: '#3B82F6' }} />
                    <span>Lượt chia sẻ TB</span>
                  </div>
                </td>
                {creators.map((c, idx) => (
                  <td key={c.id}>
                    <div className="metric-cell-value-wrap">
                      <span className="metric-cell-num">{c.shares}</span>
                      <div className="metric-cell-bar-track">
                        <div
                          className={`metric-cell-bar-fill ${
                            idx === 0 || idx === 1 ? 'bar-blue' : idx === 2 ? 'bar-orange' : 'bar-slate'
                          }`}
                          style={{ width: `${c.sharesPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 7: Địa điểm khán giả */}
              <tr>
                <td>
                  <div className="indicator-row-name">
                    <EnvironmentOutlined style={{ color: '#10B981' }} />
                    <span>Địa điểm khán giả</span>
                  </div>
                </td>
                {creators.map((c) => (
                  <td key={c.id}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                      {c.location}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row 8: Giới tính khán giả */}
              <tr>
                <td>
                  <div className="indicator-row-name">
                    <WomanOutlined style={{ color: '#8B5CF6' }} />
                    <span>Giới tính khán giả</span>
                  </div>
                </td>
                {creators.map((c, idx) => {
                  const color = idx === 0 || idx === 1 ? '#4F46E5' : idx === 2 ? '#F59E0B' : '#64748B';
                  const bg = idx === 0 || idx === 1 ? '#EEF2FF' : idx === 2 ? '#FEF3C7' : '#F1F5F9';
                  return (
                    <td key={c.id}>
                      <div className="demo-donut-cell">
                        <div className="demo-donut-chart">
                          <svg width="32" height="32" viewBox="0 0 36 36">
                            <circle
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke={bg}
                              strokeWidth="4"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke={color}
                              strokeWidth="4"
                              strokeDasharray={`${c.gender.female} ${100 - c.gender.female}`}
                              strokeDashoffset="25"
                            />
                          </svg>
                        </div>
                        <div className="demo-donut-text">
                          <span className="demo-text-female">Nữ: {c.gender.female}%</span>
                          <span className="demo-text-male">Nam: {c.gender.male}%</span>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 9: Mối quan tâm hàng đầu */}
              <tr>
                <td>
                  <div className="indicator-row-name">
                    <AimOutlined style={{ color: '#EC4899' }} />
                    <span>Mối quan tâm hàng đầu</span>
                  </div>
                </td>
                {creators.map((c) => (
                  <td key={c.id}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {c.interests.map((interest) => (
                        <span
                          key={interest}
                          style={{
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: 6,
                            padding: '2px 6px',
                            fontSize: 10.5,
                            color: '#475569',
                          }}
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Banner Callout */}
        <div className="matrix-bottom-banner">
          <div className="banner-left-group">
            <div className="banner-sparkle-icon">✦</div>
            <div>
              <div className="banner-title">So sánh chi tiết chuyên sâu</div>
              <div className="banner-subtitle">
                Xem phân tích sâu hơn về phong cách nội dung, nhân khẩu học và tỷ lệ ROI của từng creator.
              </div>
            </div>
          </div>

          <div
            className="banner-link-btn"
            onClick={() => message.info('Mở báo cáo so sánh đa chiều chuyên sâu')}
          >
            <span>Xem báo cáo chi tiết</span>
            <RightOutlined style={{ fontSize: 11 }} />
          </div>
        </div>
      </div>

      {/* Modal: Thêm Creator vào danh sách */}
      <Modal
        title="Thêm Creator vào danh sách chọn & so sánh"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        footer={null}
        width={520}
      >
        <div style={{ marginTop: 16 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tên hoặc username creator..."
            style={{ marginBottom: 16, borderRadius: 8 }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
            {[
              {
                id: 'c5',
                name: 'Hoàng Yến',
                user: 'hoangyen.beauty',
                followers: '680K',
                avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
              },
              {
                id: 'c6',
                name: 'Tuấn Khang',
                user: 'tuankhang.tech',
                followers: '510K',
                avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
              },
              {
                id: 'c7',
                name: 'Mai Lan',
                user: 'mailan.foodie',
                followers: '430K',
                avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80',
              },
            ].map((cand) => (
              <div
                key={cand.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={cand.avatar}
                    alt={cand.name}
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{cand.name}</div>
                    <div style={{ fontSize: 11.5, color: '#64748B' }}>@{cand.user} • {cand.followers} followers</div>
                  </div>
                </div>

                <Button
                  size="small"
                  type="primary"
                  style={{ background: '#4F46E5', borderRadius: 6 }}
                  onClick={() => {
                    message.success(`Đã thêm ${cand.name} vào danh sách so sánh!`);
                    setAddModalOpen(false);
                  }}
                >
                  Thêm vào
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
