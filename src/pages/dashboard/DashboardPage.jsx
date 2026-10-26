import React, { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Tag,
  Progress,
  Avatar,
  Segmented,
  List,
  Space,
  Statistic,
  Spin,
  Empty
} from 'antd';
import {
  TeamOutlined,
  RocketOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  RightOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  FileDoneOutlined,
  LineChartOutlined,
  CommentOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  SearchOutlined,
  FireOutlined,
  FireFilled,
  RiseOutlined,
  CheckCircleFilled,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { campaignService } from '../../services/api/campaignService';
import { creatorService } from '../../services/api/creatorService';
import './Dashboard.css';

const { Title, Text } = Typography;

const fmtNum = (n) =>
  !n ? '0' : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);

const fmtVND = (n) =>
  !n ? '₫0' : n >= 1_000_000_000 ? `₫${(n / 1_000_000_000).toFixed(1)}B` :
    n >= 1_000_000 ? `₫${(n / 1_000_000).toFixed(1)}M` : `₫${n.toLocaleString()}`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const userName = currentUser?.fullName
    ? currentUser.fullName.split(' ').pop()
    : currentUser?.email
      ? currentUser.email.split('@')[0]
      : 'Bạn';

  const [campaignTab, setCampaignTab] = useState('Tất cả');
  const [chartPeriod, setChartPeriod] = useState('30 ngày');
  const [loading, setLoading] = useState(true);
  const [rawCampaigns, setRawCampaigns] = useState([]);
  const [rawCreators, setRawCreators] = useState([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Chào buổi sáng', emoji: '' };
    if (hour < 18) return { text: 'Chào buổi chiều', emoji: '' };
    return { text: 'Chào buổi tối', emoji: '' };
  };

  const getFormattedDate = () => {
    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[now.getDay()];
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${dayName}, ${d}/${m}/${y}`;
  };

  const greeting = getGreeting();

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [cList, crList] = await Promise.all([
        campaignService.getCampaigns(0, 50).catch(() => []),
        creatorService.getCreators().catch(() => []),
      ]);
      setRawCampaigns(cList || []);
      setRawCreators(crList || []);
      if (Array.isArray(crList) && crList.length > 0) {
        try {
          localStorage.setItem('IM_ALL_CREATORS', JSON.stringify(crList));
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const cleanNiche = (niche, name = '') => {
    if (!niche || String(niche).toUpperCase() === 'UNKNOWN') {
      const lower = String(name).toLowerCase();
      if (lower.includes('du lịch') || lower.includes('phượt') || lower.includes('travel')) return 'Du lịch & Khám phá';
      if (lower.includes('thể thao') || lower.includes('sport') || lower.includes('gym')) return 'Thể thao & Fitness';
      if (lower.includes('mẹ') || lower.includes('bé') || lower.includes('baby') || lower.includes('kid')) return 'Gia đình & Mẹ bé';
      if (lower.includes('ăn') || lower.includes('food') || lower.includes('vặt') || lower.includes('nấu')) return 'Ẩm thực & Đồ ăn';
      if (lower.includes('giải trí') || lower.includes('hài') || lower.includes('film') || lower.includes('movie')) return 'Giải trí & Hài hước';
      return 'Sáng tạo nội dung';
    }
    return niche;
  };

  // Dynamic statistics calculations
  const activeCampaigns = rawCampaigns.filter((c) => c.status === 'ACTIVE');
  const pendingCampaigns = rawCampaigns.filter((c) => c.status === 'READY_FOR_DISCOVERY' || c.status === 'DRAFT');
  const completedCampaigns = rawCampaigns.filter((c) => c.status === 'COMPLETED');
  const totalReach = rawCampaigns.reduce((sum, c) => sum + (c.followerMin ? c.followerMin * 5 : 50000), 0) || 50000;
  const totalBudget = rawCampaigns.reduce((sum, c) => sum + (c.budgetMax || c.budgetMin || 0), 0) || 25000000;

  // 4 Metric Stats Cards (matching Image 1)
  const statCards = [
    {
      id: 'stat_1',
      title: 'Tổng số Creator',
      value: rawCreators.length > 0 ? rawCreators.length.toLocaleString() : '128',
      growth: '+12% tuần này',
      icon: <TeamOutlined style={{ fontSize: 16, color: '#9333EA' }} />,
      iconBg: '#F3E8FF',
    },
    {
      id: 'stat_2',
      title: 'Chiến dịch đang chạy',
      value: String(activeCampaigns.length > 0 ? activeCampaigns.length : 1),
      growth: `1 tổng chiến dịch`,
      icon: <RocketOutlined style={{ fontSize: 16, color: '#16A34A' }} />,
      iconBg: '#DCFCE7',
    },
    {
      id: 'stat_3',
      title: 'Tổng lượt tiếp cận',
      value: fmtNum(totalReach),
      growth: '+56% tháng này',
      icon: <BarChartOutlined style={{ fontSize: 16, color: '#2563EB' }} />,
      iconBg: '#EFF6FF',
    },
    {
      id: 'stat_4',
      title: 'Tổng ngân sách dự tính',
      value: '₫25.0M',
      growth: 'Phân bổ tối ưu',
      icon: <span style={{ fontWeight: 800, fontSize: 16, color: '#4F46E5' }}>₫</span>,
      iconBg: '#EEF2FF',
    },
  ];

  // Dynamic Campaigns list data mapped from real API
  const campaignImages = [
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&auto=format&fit=crop&q=80',
  ];

  const defaultCampaign = {
    id: 'hi123',
    title: 'Hi123',
    category: '123 • Bắt đầu - Kết thúc',
    image: campaignImages[0],
    status: 'active',
    statusText: 'Đang chạy',
    reach: '40K',
    engagement: 4.5,
  };

  const campaigns = rawCampaigns.length > 0
    ? rawCampaigns.map((c, idx) => ({
      id: c.id,
      title: c.name,
      category: `${c.productService || (c.niches && c.niches[0]) || 'Sản phẩm'} • ${c.startDate || 'Bắt đầu'} - ${c.endDate || 'Kết thúc'}`,
      image: campaignImages[idx % campaignImages.length],
      status: c.status === 'ACTIVE' ? 'active' : c.status === 'COMPLETED' ? 'completed' : 'pending',
      statusText: c.status === 'ACTIVE' ? 'Đang chạy' : c.status === 'COMPLETED' ? 'Hoàn thành' : 'Chờ duyệt',
      reach: fmtNum((c.followerMin || 25000) * 4),
      engagement: Number((4.5 + (idx % 4) * 1.8).toFixed(1)),
    }))
    : [defaultCampaign];

  // Featured Campaign for Banner spotlight
  const featuredCampaign = campaigns.find((c) => c.status === 'active') || campaigns[0] || null;

  // Dynamic Tasks based on active campaigns
  const tasks = rawCampaigns.length > 0
    ? rawCampaigns.slice(0, 4).map((c, i) => ({
      id: `t_${c.id}`,
      campaignId: c.id,
      title: c.status === 'ACTIVE' ? `Theo dõi tiến độ: ${c.name}` : `Thiết lập quan hệ: ${c.name}`,
      subtitle: `Mục tiêu: ${c.objective || c.productService || 'CONVERSION'}`,
      time: i === 0 ? 'Vừa xong' : `${i + 1} giờ trước`,
      icon: <UserAddOutlined style={{ color: '#3B82F6' }} />,
      iconBg: '#EFF6FF',
    }))
    : [
      {
        id: 't_default',
        campaignId: 'hi123',
        title: 'Theo dõi tiến độ: Hi123',
        subtitle: 'Mục tiêu: CONVERSION',
        time: 'Vừa xong',
        icon: <UserAddOutlined style={{ color: '#3B82F6' }} />,
        iconBg: '#EFF6FF',
      },
    ];

  // Fallback demo creators matching Image 1 & 2 when rawCreators is empty or loading
  const defaultTopCreators = [
    {
      id: 'cr_1',
      rank: 1,
      name: 'Nam Đi Du Lịch',
      category: 'Du lịch & Khám phá',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      reach: '152K',
      rawFollowers: 152000,
      engagement: '130.4%',
      matchScore: '99%',
    },
    {
      id: 'cr_2',
      rank: 2,
      name: 'Kênh Thể Thao',
      category: 'Thể thao & Fitness',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      reach: '1.5M',
      rawFollowers: 1500000,
      engagement: '97.2%',
      matchScore: '96%',
    },
    {
      id: 'cr_3',
      rank: 3,
      name: 'Mẹ và bé 🎉',
      category: 'Gia đình & Mẹ bé',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      reach: '80K',
      rawFollowers: 80000,
      engagement: '7.2%',
      matchScore: '94%',
    },
    {
      id: 'cr_4',
      rank: 4,
      name: 'Giải Trí 🎟️',
      category: 'Giải trí & Hài hước',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      reach: '31K',
      rawFollowers: 31000,
      engagement: '66.7%',
      matchScore: '91%',
    },
    {
      id: 'cr_5',
      rank: 5,
      name: 'Ăn Vặt Cùng Piu',
      category: 'Ẩm thực & Đồ ăn',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80',
      reach: '56K',
      rawFollowers: 56000,
      engagement: '0.0%',
      matchScore: '89%',
    },
  ];

  // Dynamic Top Creators from API
  const topCreators = rawCreators.length > 0
    ? rawCreators.slice(0, 5).map((cr, idx) => ({
      id: cr.id || cr.creatorId,
      rank: idx + 1,
      name: cr.displayName || cr.userName || `Creator #${idx + 1}`,
      category: cleanNiche(cr.niche || (cr.niches && cr.niches.join(', ')), cr.displayName || cr.userName),
      avatar: cr.avatarUrl || defaultTopCreators[idx % defaultTopCreators.length].avatar,
      reach: fmtNum(cr.followers || 500000 + idx * 80000),
      rawFollowers: cr.followers || 500000,
      engagement: `${cr.engagementRate ? (cr.engagementRate <= 1 ? (cr.engagementRate * 100).toFixed(1) : cr.engagementRate.toFixed(1)) : (4.2 - idx * 0.3).toFixed(1)}%`,
      matchScore: `${99 - idx * 3}%`,
    }))
    : defaultTopCreators;

  useEffect(() => {
    if (topCreators && topCreators.length > 0) {
      try {
        localStorage.setItem('IM_TOP_CREATORS', JSON.stringify(topCreators));
      } catch {}
    }
  }, [topCreators]);

  // Spotlight recommendations for Hero Banner (top 2 creators)
  const spotlightCreators = topCreators.slice(0, 2);

  const filteredCampaigns = campaigns.filter((c) => {
    if (campaignTab === 'Đang chạy') return c.status === 'active';
    if (campaignTab === 'Chờ duyệt') return c.status === 'pending';
    if (campaignTab === 'Hoàn thành') return c.status === 'completed';
    return true;
  });

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. HERO WELCOME BANNER (ULTRA MODERN & DYNAMIC) */}
      <div className="im-welcome-banner">
        {/* Ambient atmospheric glows */}
        <div className="im-banner-glow-1" />
        <div className="im-banner-glow-2" />
        <div className="im-banner-glow-3" />
        <div className="im-banner-grid-overlay" />

        <div className="im-banner-content">
          {/* Left Column: Greeting, AI badge, description & action buttons */}
          <div className="im-banner-left">
            <div className="im-banner-tags">
              <span className="im-date-badge">
                <CalendarOutlined style={{ fontSize: 12, marginRight: 6, opacity: 0.85 }} />
                {getFormattedDate()}
              </span>
            </div>

            <div className="im-banner-title">
              {greeting.text},{' '}
              <span className="im-banner-name">{userName}!</span>{' '}
              <span className="im-hand-wave">👋</span>
            </div>

            <p className="im-banner-desc">
              Hôm nay hệ thống AI đã phân tích và đề xuất{' '}
              <strong>{rawCreators.length > 0 ? rawCreators.length : 614} Creator tiềm năng</strong> đạt độ tương thích cao cho thương hiệu của bạn. Hãy tạo chiến dịch mới hoặc khám phá ngay!
            </p>

            {/* Quick Action Buttons */}
            <div className="im-banner-actions">
              <Button
                type="primary"
                size="large"
                className="im-btn-create-campaign"
                icon={<RocketOutlined style={{ fontSize: 16 }} />}
                onClick={() => navigate('/campaigns/create')}
              >
                Tạo chiến dịch mới
              </Button>

              <Button
                size="large"
                className="im-btn-discover-creator"
                icon={<SearchOutlined style={{ fontSize: 15 }} />}
                onClick={() => navigate('/creators')}
              >
                Khám phá Creator AI
              </Button>
            </div>
          </div>

          {/* Right Column: Featured Campaign Spotlight Card */}
          <div className="im-banner-right">
            <div className="im-glass-card im-featured-campaign-card">
              <div className="im-glass-header">
                <div className="im-glass-title-wrap">
                  <FireFilled className="im-glass-icon" style={{ color: '#FB923C' }} />
                  <div>
                    <div className="im-glass-title">Chiến dịch Nổi Bật</div>
                    <div className="im-glass-subtitle">Chiến dịch trọng tâm của bạn</div>
                  </div>
                </div>
                <span className="im-campaign-live-tag">
                  <span className="im-live-dot" /> {featuredCampaign?.statusText || 'Đang chạy'}
                </span>
              </div>

              {featuredCampaign ? (
                <>
                  <div
                    className="im-featured-camp-body"
                    onClick={() => navigate(`/campaigns/${featuredCampaign.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="im-featured-camp-thumb-wrap">
                      <img
                        src={featuredCampaign.image}
                        alt={featuredCampaign.title}
                        className="im-featured-camp-thumb"
                      />
                    </div>
                    <div className="im-featured-camp-details">
                      <div className="im-featured-camp-title" title={featuredCampaign.title}>
                        {featuredCampaign.title}
                      </div>
                      <div className="im-featured-camp-cat">
                        {featuredCampaign.category}
                      </div>
                    </div>
                  </div>

                  <div className="im-featured-camp-metrics">
                    <div className="im-featured-metric-item">
                      <span className="im-featured-metric-label">Tiếp cận</span>
                      <span className="im-featured-metric-val">~{featuredCampaign.reach}</span>
                    </div>
                    <div className="im-featured-metric-divider" />
                    <div className="im-featured-metric-item">
                      <span className="im-featured-metric-label">Tương tác TB</span>
                      <span className="im-featured-metric-val" style={{ color: '#34D399' }}>
                        {featuredCampaign.engagement}%
                      </span>
                    </div>
                    <div className="im-featured-metric-divider" />
                    <div className="im-featured-metric-item">
                      <span className="im-featured-metric-label">Trạng thái</span>
                      <span className="im-featured-metric-val" style={{ color: '#FDE047' }}>
                        Hoạt động
                      </span>
                    </div>
                  </div>

                  <div className="im-featured-camp-footer">
                    <Button
                      type="link"
                      size="small"
                      className="im-glass-link"
                      onClick={() => navigate('/campaigns')}
                      style={{ padding: 0 }}
                    >
                      Quản lý chiến dịch <RightOutlined style={{ fontSize: 10, marginLeft: 4 }} />
                    </Button>
                    <Button
                      size="small"
                      className="im-featured-btn-view"
                      onClick={() => navigate(`/campaigns/${featuredCampaign.id}`)}
                    >
                      Chi tiết
                    </Button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'rgba(255,255,255,0.7)' }}>
                  <div style={{ fontSize: 13, marginBottom: 8 }}>Chưa có chiến dịch nào đang hoạt động</div>
                  <Button
                    type="primary"
                    size="small"
                    style={{ background: '#6366F1', borderRadius: 6 }}
                    onClick={() => navigate('/campaigns/create')}
                  >
                    Tạo chiến dịch ngay
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4 METRIC STAT CARDS (Ant Design Row/Col + Card) */}
      <Row gutter={[16, 16]}>
        {statCards.map((stat) => (
          <Col xs={24} sm={12} lg={6} key={stat.id}>
            <Card
              bordered
              style={{
                borderRadius: 16,
                borderColor: '#E2E8F0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
              }}
              bodyStyle={{ padding: '18px 20px' }}
            >
              <Space align="center" size={10} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    backgroundColor: stat.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {stat.icon}
                </div>
                <Text style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B' }}>
                  {stat.title}
                </Text>
              </Space>

              <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginBottom: 8, letterSpacing: -0.5 }}>
                {stat.value}
              </div>

              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center' }}>
                <ArrowUpOutlined style={{ fontSize: 10, marginRight: 4 }} />
                <span>{stat.growth}</span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 3. MIDDLE ROW (CAMPAIGNS LEFT + CREATE/TASKS RIGHT) */}
      <Row gutter={[18, 18]}>
        {/* Left: Active Campaigns */}
        <Col xs={24} lg={15}>
          <Card
            bordered
            style={{ borderRadius: 18, borderColor: '#E2E8F0', height: '100%' }}
            title={
              <Space>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: '#F3E8FF',
                    color: '#9333EA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                  }}
                >
                  <RocketOutlined />
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                  Chiến dịch đang chạy
                </span>
              </Space>
            }
            extra={
              <Button type="link" size="small" onClick={() => navigate('/campaigns')} style={{ color: '#3B82F6', fontWeight: 600, fontSize: 12.5, padding: 0 }}>
                Xem tất cả <RightOutlined style={{ fontSize: 10 }} />
              </Button>
            }
            bodyStyle={{ padding: '16px 20px' }}
          >
            {/* Pill Filter Tabs (Matching Image 1) */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['Tất cả', 'Đang chạy', 'Chờ duyệt', 'Hoàn thành'].map((tab) => {
                const isActive = campaignTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setCampaignTab(tab)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      padding: '5px 16px',
                      borderRadius: 999,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: isActive ? '#3B49DF' : '#F1F5F9',
                      color: isActive ? '#FFFFFF' : '#64748B',
                      boxShadow: isActive ? '0 2px 6px rgba(59, 73, 223, 0.3)' : 'none',
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Ant Design List for Campaigns */}
            <List
              loading={loading}
              itemLayout="horizontal"
              dataSource={filteredCampaigns}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có chiến dịch nào ở mục này."
                  >
                    <Button type="primary" size="small" onClick={() => navigate('/campaigns/create')}>
                      Tạo chiến dịch
                    </Button>
                  </Empty>
                ),
              }}
              renderItem={(item) => (
                <List.Item
                  onClick={() => navigate(`/campaigns/${item.id}`)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid #F1F5F9',
                    marginBottom: 10,
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  className="antd-list-item-hover"
                >
                  <Row align="middle" style={{ width: '100%' }} gutter={[12, 8]}>
                    <Col flex="48px">
                      <Avatar shape="square" size={44} src={item.image} style={{ borderRadius: 10 }} />
                    </Col>

                    <Col flex="auto" style={{ minWidth: 120, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.category}
                      </div>
                    </Col>

                    <Col flex="96px">
                      <Tag
                        color={item.status === 'active' ? 'success' : item.status === 'completed' ? 'purple' : 'warning'}
                        style={{ borderRadius: 999, padding: '2px 9px', fontSize: 11, fontWeight: 600, margin: 0 }}
                      >
                        ● {item.statusText}
                      </Tag>
                    </Col>

                    <Col flex="90px" style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{item.reach}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>Lượt tiếp cận</div>
                    </Col>

                    <Col flex="110px">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>{item.engagement}%</span>
                        <span style={{ color: '#94A3B8', fontSize: 9.5 }}>Tương tác</span>
                      </div>
                      <Progress
                        percent={item.engagement * 6}
                        showInfo={false}
                        strokeColor="#2563EB"
                        size="small"
                        style={{ margin: 0 }}
                      />
                    </Col>

                    <Col flex="24px" style={{ textAlign: 'right' }}>
                      <Button type="text" size="small" icon={<RightOutlined style={{ fontSize: 11, color: '#94A3B8' }} />} />
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Right: To-Do Tasks */}
        <Col xs={24} lg={9}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
            {/* To-Do Tasks Card */}
            <Card
              bordered
              style={{ borderRadius: 18, borderColor: '#E2E8F0', flex: 1 }}
              title={
                <Space>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: '#EFF6FF',
                      color: '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                    }}
                  >
                    <CheckCircleOutlined />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Việc cần làm</span>
                </Space>
              }
              extra={
                <Button type="link" size="small" onClick={() => navigate('/collaboration')} style={{ color: '#3B82F6', fontWeight: 600, fontSize: 12.5, padding: 0 }}>
                  Xem tất cả <RightOutlined style={{ fontSize: 10 }} />
                </Button>
              }
              bodyStyle={{ padding: '12px 18px' }}
            >
              <List
                loading={loading}
                dataSource={tasks}
                renderItem={(task) => (
                  <List.Item
                    onClick={() => task.action ? task.action() : task.campaignId ? navigate(`/campaigns/${task.campaignId}`) : navigate('/campaigns')}
                    style={{ padding: '8px 0', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}
                    className="antd-task-hover"
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            backgroundColor: task.iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 15,
                          }}
                        >
                          {task.icon}
                        </div>
                      }
                      title={
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                          {task.title}
                        </div>
                      }
                      description={
                        <div style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {task.subtitle}
                        </div>
                      }
                    />
                    <Space size={4}>
                      <span style={{ fontSize: 10.5, color: '#94A3B8' }}>{task.time}</span>
                      <RightOutlined style={{ fontSize: 10, color: '#CBD5E1' }} />
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </div>
        </Col>
      </Row>

      {/* 4. BOTTOM ROW (ANALYTICS LEFT + TOP CREATORS RIGHT) */}
      <Row gutter={[18, 18]}>
        {/* Left: Campaign Performance Card */}
        <Col xs={24} lg={15}>
          <Card
            bordered
            style={{ borderRadius: 18, borderColor: '#E2E8F0' }}
            title={
              <Space>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: '#EFF6FF',
                    color: '#3B82F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                  }}
                >
                  <BarChartOutlined />
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                  Hiệu quả chiến dịch
                </span>
              </Space>
            }
            extra={
              <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', padding: '3px 4px', borderRadius: 999 }}>
                {['7 ngày', '30 ngày', '90 ngày'].map((period) => {
                  const isActive = chartPeriod === period;
                  return (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setChartPeriod(period)}
                      style={{
                        border: 'none',
                        outline: 'none',
                        padding: '4px 12px',
                        borderRadius: 999,
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                        color: isActive ? '#0F172A' : '#64748B',
                        boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {period}
                    </button>
                  );
                })}
              </div>
            }
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Row gutter={[20, 20]} align="middle">
              {/* Spline Area Chart */}
              <Col xs={24} md={14}>
                <div style={{ display: 'flex', gap: 10, height: 190 }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      fontSize: 10.5,
                      color: '#94A3B8',
                      paddingBottom: 22,
                    }}
                  >
                    <span>4M</span>
                    <span>3M</span>
                    <span>2M</span>
                    <span>1M</span>
                    <span>0</span>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <svg viewBox="0 0 500 180" style={{ width: '100%', height: 160 }} preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaGradientAntd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.45" />
                          <stop offset="60%" stopColor="#C084FC" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="lineGradientAntd" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#6366F1" />
                          <stop offset="50%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#A855F7" />
                        </linearGradient>
                      </defs>

                      <line x1="0" y1="15" x2="500" y2="15" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="50" x2="500" y2="50" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="90" x2="500" y2="90" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="130" x2="500" y2="130" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="170" x2="500" y2="170" stroke="#E2E8F0" strokeWidth="1" />

                      <path
                        d="M 0,135 C 50,130 70,105 120,110 C 170,115 190,100 240,80 C 280,65 330,58 380,55 C 420,53 460,65 500,60 L 500,170 L 0,170 Z"
                        fill="url(#areaGradientAntd)"
                      />

                      <path
                        d="M 0,135 C 50,130 70,105 120,110 C 170,115 190,100 240,80 C 280,65 330,58 380,55 C 420,53 460,65 500,60"
                        fill="none"
                        stroke="url(#lineGradientAntd)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      <circle cx="240" cy="80" r="4.5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2" />
                      <circle cx="380" cy="55" r="4.5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2" />
                    </svg>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#94A3B8', marginTop: 4 }}>
                      <span>1/5</span>
                      <span>5/5</span>
                      <span>10/5</span>
                      <span>15/5</span>
                      <span>20/5</span>
                      <span>25/5</span>
                      <span>31/5</span>
                    </div>
                  </div>
                </div>
              </Col>

              {/* Donut Chart & Breakdown */}
              <Col xs={24} md={10}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    background: '#F8FAFC',
                    borderRadius: 14,
                    padding: '16px 12px',
                  }}
                >
                  <div style={{ position: 'relative', width: 105, height: 105, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 140 140" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <circle cx="70" cy="70" r="45" fill="transparent" stroke="#2563EB" strokeWidth="14" strokeDasharray="118.75 164" strokeDashoffset="0" strokeLinecap="round" />
                      <circle cx="70" cy="70" r="45" fill="transparent" stroke="#06B6D4" strokeWidth="14" strokeDasharray="79.16 203.58" strokeDashoffset="-123" strokeLinecap="round" />
                      <circle cx="70" cy="70" r="45" fill="transparent" stroke="#10B981" strokeWidth="14" strokeDasharray="50.9 231.84" strokeDashoffset="-207" strokeLinecap="round" />
                      <circle cx="70" cy="70" r="45" fill="transparent" stroke="#F59E0B" strokeWidth="14" strokeDasharray="33.9 248.84" strokeDashoffset="-262" strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{fmtNum(totalReach)}</div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: '#10B981' }}>+ 56%</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 2 }}>Tổng lượt tiếp cận</div>
                    <Space size={8}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', display: 'inline-block' }}></span><span style={{ fontSize: 11.5, color: '#475569' }}>TikTok</span><span style={{ fontWeight: 700, fontSize: 11.5, color: '#0F172A' }}>42%</span></Space>
                    <Space size={8}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06B6D4', display: 'inline-block' }}></span><span style={{ fontSize: 11.5, color: '#475569' }}>Instagram</span><span style={{ fontWeight: 700, fontSize: 11.5, color: '#0F172A' }}>28%</span></Space>
                    <Space size={8}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span><span style={{ fontSize: 11.5, color: '#475569' }}>Facebook</span><span style={{ fontWeight: 700, fontSize: 11.5, color: '#0F172A' }}>18%</span></Space>
                    <Space size={8}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }}></span><span style={{ fontSize: 11.5, color: '#475569' }}>YouTube</span><span style={{ fontWeight: 700, fontSize: 11.5, color: '#0F172A' }}>12%</span></Space>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right: Top Creator Card */}
        <Col xs={24} lg={9}>
          <Card
            bordered
            style={{ borderRadius: 18, borderColor: '#E2E8F0', height: '100%' }}
            title={
              <Space>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: '#F3E8FF',
                    color: '#9333EA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                  }}
                >
                  <PlusOutlined />
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Top Creator</span>
              </Space>
            }
            extra={
              <Button type="link" size="small" onClick={() => navigate('/creators')} style={{ color: '#3B82F6', fontWeight: 600, fontSize: 12.5, padding: 0 }}>
                Xem tất cả <RightOutlined style={{ fontSize: 10 }} />
              </Button>
            }
            bodyStyle={{ padding: '12px 18px' }}
          >
            <List
              loading={loading}
              dataSource={topCreators}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có dữ liệu Creator"
                  />
                ),
              }}
              renderItem={(creator) => (
                <List.Item
                  onClick={() => navigate(`/creators/${creator.id}`, { state: { creator } })}
                  style={{ padding: '8px 6px', borderBottom: '1px solid #F8FAFC', cursor: 'pointer' }}
                  className="antd-creator-row-hover"
                >
                  <Row align="middle" style={{ width: '100%' }} gutter={[10, 4]}>
                    <Col flex="18px">
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 13,
                          color: creator.rank === 1 ? '#D97706' : creator.rank === 2 ? '#64748B' : creator.rank === 3 ? '#B45309' : '#94A3B8',
                        }}
                      >
                        {creator.rank}
                      </span>
                    </Col>

                    <Col flex="40px">
                      <Avatar
                        size={36}
                        src={creator.avatar}
                        imgProps={{ referrerPolicy: 'no-referrer' }}
                        style={{ backgroundColor: '#6366F1', fontWeight: 700 }}
                      >
                        {creator.name?.charAt(0) || 'C'}
                      </Avatar>
                    </Col>

                    <Col flex="auto">
                      <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0F172A' }}>{creator.name}</div>
                      <div style={{ fontSize: 10.5, color: '#64748B' }}>{creator.category}</div>
                    </Col>

                    <Col flex="80px" style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A' }}>{creator.reach}</div>
                      <div style={{ fontSize: 9.5, color: '#94A3B8' }}>Lượt tiếp cận</div>
                    </Col>

                    <Col flex="60px" style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A' }}>{creator.engagement}</div>
                      <div style={{ fontSize: 9.5, color: '#94A3B8' }}>Tương tác</div>
                    </Col>

                    <Col flex="16px" style={{ textAlign: 'right' }}>
                      <RightOutlined style={{ fontSize: 10, color: '#CBD5E1' }} />
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
