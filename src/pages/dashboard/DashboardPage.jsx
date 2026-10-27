import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Tag,
  Progress,
  Avatar,
  Space,
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
  PlusOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { campaignService } from '../../services/api/campaignService';
import { creatorService } from '../../services/api/creatorService';
import './Dashboard.css';

const fmtNum = (n) =>
  !n ? '0' : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'Vừa xong';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff) || diff < 0) return 'Vừa xong';
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return `${Math.floor(days / 30)} tháng trước`;
};

// Mini Sparkline Vertical Bar Chart Component
const MiniBarChart = ({ color = '#6366F1' }) => (
  <svg width="44" height="26" viewBox="0 0 44 26" fill="none" style={{ flexShrink: 0 }}>
    <rect x="2" y="15" width="4.5" height="11" rx="2.25" fill={color} fillOpacity="0.25" />
    <rect x="10" y="11" width="4.5" height="15" rx="2.25" fill={color} fillOpacity="0.4" />
    <rect x="18" y="7" width="4.5" height="19" rx="2.25" fill={color} fillOpacity="0.6" />
    <rect x="26" y="13" width="4.5" height="13" rx="2.25" fill={color} fillOpacity="0.45" />
    <rect x="34" y="5" width="4.5" height="21" rx="2.25" fill={color} fillOpacity="0.8" />
    <rect x="42" y="1" width="4.5" height="25" rx="2.25" fill={color} />
  </svg>
);

// Global In-Memory Cache (Eliminates Re-loading Flash when switching tabs)
const dashboardCache = {
  rawCampaigns: null,
  rawCreators: null,
  shortlistItems: null,
  shortlistCount: null,
  lastLoaded: 0,
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const u = authService.getCurrentUser();
      if (u) return u;
      const raw = localStorage.getItem('influencermatch_user') || localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // Tự động đồng bộ thông tin tài khoản người dùng thực tế
    authService.getMe?.()
      .then((profile) => {
        if (profile) setUserProfile(profile);
      })
      .catch(() => {});
  }, []);

  const userName =
    userProfile?.fullName?.trim() ||
    userProfile?.name?.trim() ||
    userProfile?.displayName?.trim() ||
    (userProfile?.email ? userProfile.email.split('@')[0] : '');

  // Instant render from memory cache if available (Prevents spinner reload flash)
  const hasCache = !!dashboardCache.rawCampaigns;
  const [loading, setLoading] = useState(!hasCache);
  const [rawCampaigns, setRawCampaigns] = useState(() => dashboardCache.rawCampaigns || []);
  const [rawCreators, setRawCreators] = useState(() => dashboardCache.rawCreators || []);
  const [shortlistItems, setShortlistItems] = useState(() => dashboardCache.shortlistItems || []);
  const [shortlistCount, setShortlistCount] = useState(() => dashboardCache.shortlistCount ?? 0);

  const [campaignTab, setCampaignTab] = useState('all');
  const [activityTab, setActivityTab] = useState('all');
  const [chartPeriod, setChartPeriod] = useState('30 ngày');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const loadDashboardData = useCallback(async () => {
    if (!dashboardCache.rawCampaigns) {
      setLoading(true);
    }

    try {
      const [cList, crList] = await Promise.all([
        campaignService.getCampaigns(0, 50).catch(() => []),
        creatorService.getCreators().catch(() => []),
      ]);

      const validCList = Array.isArray(cList) ? cList : [];
      const validCrList = Array.isArray(crList) ? crList : [];

      setRawCampaigns(validCList);
      setRawCreators(validCrList);
      dashboardCache.rawCampaigns = validCList;
      dashboardCache.rawCreators = validCrList;
      dashboardCache.lastLoaded = Date.now();

      // Compute Brand-specific shortlist items & count (Dành riêng cho Brand)
      try {
        const localList = creatorService.getLocalShortlist ? creatorService.getLocalShortlist('all') : [];
        let mergedShortlist = [...localList];

        if (validCList.length > 0) {
          const backendLists = await Promise.all(
            validCList.slice(0, 5).map((camp) => creatorService.getShortlist(camp.id).catch(() => []))
          );
          backendLists.forEach((list) => {
            if (Array.isArray(list)) mergedShortlist.push(...list);
          });
        }

        // Deduplicate shortlist by creatorId
        const uniqueShortlistMap = new Map();
        mergedShortlist.forEach((item) => {
          const key = item.creatorId || item.id;
          if (key && !uniqueShortlistMap.has(key)) {
            uniqueShortlistMap.set(key, item);
          }
        });

        const finalShortlist = Array.from(uniqueShortlistMap.values());
        setShortlistItems(finalShortlist);
        setShortlistCount(finalShortlist.length);
        dashboardCache.shortlistItems = finalShortlist;
        dashboardCache.shortlistCount = finalShortlist.length;
      } catch {
        // ignore storage error
      }
    } catch (err) {
      console.warn('Dashboard background refresh notice:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Stale-While-Revalidate: Only fetch if cache is absent or older than 90s
    const isStale = !dashboardCache.rawCampaigns || (Date.now() - dashboardCache.lastLoaded > 90000);
    if (isStale) {
      loadDashboardData();
    }
  }, [loadDashboardData]);

  // Dynamic statistics from brand campaigns
  const activeCampaigns = useMemo(
    () => rawCampaigns.filter((c) => c.status === 'ACTIVE' || c.status === 'RUNNING'),
    [rawCampaigns]
  );

  const totalReach = useMemo(() => {
    if (!rawCampaigns || rawCampaigns.length === 0) return 0;
    return rawCampaigns.reduce((sum, c) => {
      const reach = c.followerMax || (c.followerMin ? c.followerMin * 2 : 50000);
      return sum + reach;
    }, 0);
  }, [rawCampaigns]);

  // 3 Metric KPI Cards (Đúng nghiệp vụ Brand - KHÔNG lấy tổng creator toàn sàn)
  const kpiCards = [
    {
      id: 'kpi_shortlist',
      title: 'KOC trong Giỏ chọn lọc',
      value: String(shortlistCount),
      trend: shortlistCount > 0 ? `${shortlistCount} KOC sẵn sàng gửi lời mời` : 'Chưa có KOC trong giỏ',
      icon: <StarOutlined style={{ color: '#6366F1' }} />,
      iconBg: '#EEF2FF',
      chartColor: '#818CF8',
    },
    {
      id: 'kpi_campaigns',
      title: 'Chiến dịch đang chạy',
      value: String(activeCampaigns.length),
      trend: activeCampaigns.length > 0 ? `${activeCampaigns.length} chiến dịch hoạt động` : 'Chưa có chiến dịch chạy',
      icon: <RocketOutlined style={{ color: '#059669' }} />,
      iconBg: '#ECFDF5',
      chartColor: '#10B981',
    },
    {
      id: 'kpi_reach',
      title: 'Tổng lượt tiếp cận',
      value: fmtNum(totalReach),
      trend: totalReach > 0 ? 'Ước tính từ các chiến dịch' : 'Chưa có dữ liệu tiếp cận',
      icon: <BarChartOutlined style={{ color: '#0284C7' }} />,
      iconBg: '#F0F9FF',
      chartColor: '#38BDF8',
    },
  ];

  // Campaign sample photos for fallback
  const campaignThumbnails = [
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=160&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=160&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=160&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=160&auto=format&fit=crop&q=80',
  ];



  // Counts for Recent Campaign filter tabs
  const campaignCounts = useMemo(() => {
    const total = rawCampaigns.length;
    const running = rawCampaigns.filter((c) => c.status === 'ACTIVE' || c.status === 'RUNNING').length;
    const pending = rawCampaigns.filter((c) => c.status !== 'ACTIVE' && c.status !== 'RUNNING' && c.status !== 'COMPLETED').length;
    const completed = rawCampaigns.filter((c) => c.status === 'COMPLETED').length;
    return { total, running, pending, completed };
  }, [rawCampaigns]);

  // Recent Campaigns List (Được map động 100% từ rawCampaigns thực tế của Brand)
  const recentCampaignsList = useMemo(() => {
    if (!rawCampaigns || rawCampaigns.length === 0) return [];

    const mapped = rawCampaigns.map((c, idx) => {
      const isRunning = c.status === 'ACTIVE' || c.status === 'RUNNING';
      const isCompleted = c.status === 'COMPLETED';
      const status = isRunning ? 'running' : isCompleted ? 'completed' : 'pending';
      const statusText = isRunning ? 'Đang chạy' : isCompleted ? 'Hoàn thành' : 'Chờ duyệt';

      let progress = 20;
      if (isCompleted) progress = 100;
      else if (c.startDate && c.endDate) {
        const start = new Date(c.startDate).getTime();
        const end = new Date(c.endDate).getTime();
        const now = Date.now();
        if (now >= end) progress = 100;
        else if (now <= start) progress = 10;
        else progress = Math.min(95, Math.max(15, Math.round(((now - start) / (end - start)) * 100)));
      } else if (isRunning) {
        progress = 45;
      }

      return {
        id: c.id,
        title: c.name || `Chiến dịch #${idx + 1}`,
        subtitle: c.productService || c.description || 'Chiến dịch Influencer Marketing',
        date: c.startDate && c.endDate ? `${c.startDate} - ${c.endDate}` : 'Thời gian linh hoạt',
        status,
        statusText,
        progress,
        image: c.imageUrl || campaignThumbnails[idx % campaignThumbnails.length],
      };
    });

    if (campaignTab === 'running') return mapped.filter((c) => c.status === 'running');
    if (campaignTab === 'pending') return mapped.filter((c) => c.status === 'pending');
    if (campaignTab === 'completed') return mapped.filter((c) => c.status === 'completed');
    return mapped;
  }, [rawCampaigns, campaignTab]);



  // Recent Activities (Sinh động từ tương tác Shortlist & Campaign thực tế của Brand)
  const recentActivities = useMemo(() => {
    const acts = [];

    // Hoạt động từ giỏ chọn lọc
    shortlistItems.slice(0, 5).forEach((item, idx) => {
      acts.push({
        id: `act_sl_${item.id || item.creatorId || idx}`,
        type: 'shortlist',
        title: `${item.creatorName || 'KOC'} đã lưu vào Giỏ chọn lọc`,
        campaign: item.campaignName ? `Chiến dịch: ${item.campaignName}` : 'Sẵn sàng gửi lời mời hợp tác',
        time: item.addedAt ? formatRelativeTime(item.addedAt) : `${(idx + 1) * 20} phút trước`,
        avatar: item.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.creatorName || idx}`,
        icon: <StarFilled style={{ color: '#F59E0B' }} />,
        iconBg: '#FEF3C7',
        timestamp: item.addedAt ? new Date(item.addedAt).getTime() : Date.now() - idx * 3600000,
      });
    });

    // Hoạt động từ chiến dịch
    rawCampaigns.slice(0, 5).forEach((camp, idx) => {
      const isRunning = camp.status === 'ACTIVE' || camp.status === 'RUNNING';
      acts.push({
        id: `act_camp_${camp.id || idx}`,
        type: 'campaign',
        title: isRunning ? `Chiến dịch "${camp.name}" đang vận hành` : `Đã tạo chiến dịch "${camp.name}"`,
        campaign: camp.productService || 'Đang tìm kiếm & kết nối KOC',
        time: camp.createdAt ? formatRelativeTime(camp.createdAt) : `${idx + 1} giờ trước`,
        avatar: camp.imageUrl || campaignThumbnails[idx % campaignThumbnails.length],
        icon: isRunning ? <CheckCircleOutlined style={{ color: '#10B981' }} /> : <RocketOutlined style={{ color: '#6366F1' }} />,
        iconBg: isRunning ? '#ECFDF5' : '#EEF2FF',
        timestamp: camp.createdAt ? new Date(camp.createdAt).getTime() : Date.now() - (idx + 1) * 7200000,
      });
    });

    acts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return acts;
  }, [shortlistItems, rawCampaigns]);

  const activityCounts = useMemo(() => {
    const total = recentActivities.length;
    const shortlist = recentActivities.filter((a) => a.type === 'shortlist').length;
    const campaign = recentActivities.filter((a) => a.type === 'campaign').length;
    return { total, shortlist, campaign };
  }, [recentActivities]);

  const filteredActivities = useMemo(() => {
    if (activityTab === 'shortlist') return recentActivities.filter((a) => a.type === 'shortlist');
    if (activityTab === 'campaign') return recentActivities.filter((a) => a.type === 'campaign');
    return recentActivities;
  }, [recentActivities, activityTab]);

  // Top Creators Ranked (Được tính động từ rawCreators trong database)
  const topCreatorsList = useMemo(() => {
    if (!rawCreators || rawCreators.length === 0) return [];

    const sorted = [...rawCreators].sort((a, b) => {
      const folA = a.followers || 0;
      const folB = b.followers || 0;
      if (folB !== folA) return folB - folA;
      return (b.engagementRate || 0) - (a.engagementRate || 0);
    });

    return sorted.slice(0, 5).map((cr, idx) => {
      const followersNum = cr.followers || 0;
      const engRate = cr.engagementRate
        ? `${(cr.engagementRate * (cr.engagementRate < 1 ? 100 : 1)).toFixed(1)}%`
        : '4.2%';

      return {
        id: cr.id || cr.creatorId || `cr-${idx}`,
        rank: idx + 1,
        name: cr.displayName || cr.userName || `Nhà sáng tạo #${idx + 1}`,
        category: cr.niche || cr.category || 'Nội dung đa dạng',
        reach: fmtNum(followersNum),
        engagement: engRate,
        avatar: cr.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cr.displayName || idx}`,
      };
    });
  }, [rawCreators]);

  // Avatars for Welcome Hero Banner
  const showcaseAvatars = useMemo(() => {
    const validWithAvatars = rawCreators.filter((c) => c.avatarUrl && c.avatarUrl.startsWith('http'));
    return [
      validWithAvatars[0]?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      validWithAvatars[1]?.avatarUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      validWithAvatars[2]?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      validWithAvatars[3]?.avatarUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80',
    ];
  }, [rawCreators]);

  // Platform Breakdown for Donut Chart (Chỉ bao gồm TikTok, Instagram, Facebook - Không có YouTube)
  const platformStats = useMemo(() => {
    const counts = { TIKTOK: 0, INSTAGRAM: 0, FACEBOOK: 0 };
    let total = 0;
    rawCampaigns.forEach((c) => {
      if (Array.isArray(c.platforms) && c.platforms.length > 0) {
        c.platforms.forEach((p) => {
          const key = p.toUpperCase();
          if (counts[key] !== undefined) {
            counts[key] += 1;
            total += 1;
          }
        });
      }
    });

    if (total === 0) {
      return [
        { label: 'TikTok', percent: 55, color: '#2563EB' },
        { label: 'Instagram', percent: 30, color: '#06B6D4' },
        { label: 'Facebook', percent: 15, color: '#10B981' },
      ];
    }

    return [
      { label: 'TikTok', percent: Math.round(((counts.TIKTOK || 0) / total) * 100), color: '#2563EB' },
      { label: 'Instagram', percent: Math.round(((counts.INSTAGRAM || 0) / total) * 100), color: '#06B6D4' },
      { label: 'Facebook', percent: Math.round(((counts.FACEBOOK || 0) / total) * 100), color: '#10B981' },
    ];
  }, [rawCampaigns]);

  // Chart date labels based on selected period
  const chartDateLabels = useMemo(() => {
    const labels = [];
    const now = new Date();
    const count = 7;
    const stepDays = chartPeriod === '7 ngày' ? 1 : chartPeriod === '30 ngày' ? 5 : 15;
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * stepDays * 24 * 60 * 60 * 1000);
      labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
    }
    return labels;
  }, [chartPeriod]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24, boxSizing: 'border-box' }}>
      {/* ════════════════════════════════════════════════════════════════
          PHẦN 1: Banner Chào mừng Toàn cảnh & Bộ chỉ số KPI
          ════════════════════════════════════════════════════════════════ */}
      <div className="dashboard-scroll-section" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* ROW 1: Hero Welcome Banner (Full Width 100%) */}
        <div className="im-welcome-hero">
          <div className="im-welcome-text-col">
            <div className="im-welcome-tag">
              <span>CHÀO MỪNG TRỞ LẠI</span>
            </div>

            <h1 className="im-welcome-heading">
              {getGreeting()}{userName ? <>, <span className="im-welcome-heading-accent">{userName}!</span></> : '!'}
            </h1>

            <p className="im-welcome-desc">
              Khám phá các Nhà sáng tạo tiềm năng, quản lý tiến độ chiến dịch và đo lường hiệu quả truyền thông chuẩn xác — tất cả trong một nền tảng duy nhất.
            </p>

            <div className="im-welcome-actions">
              <button
                type="button"
                className="im-hero-btn-primary"
                onClick={() => navigate('/campaigns/create')}
              >
                <PlusOutlined style={{ fontSize: 13 }} />
                <span>Tạo chiến dịch</span>
              </button>

              <button
                type="button"
                className="im-hero-btn-ghost"
                onClick={() => navigate('/campaigns')}
              >
                <SearchOutlined style={{ fontSize: 13 }} />
                <span>Khám phá Nhà sáng tạo</span>
              </button>
            </div>
          </div>

          {/* Creator Cards Graphic with Social Stickers */}
          <div className="im-welcome-graphic-col">
            <div className="im-doodle-hint">
              <span>Tìm đúng KOC phù hợp</span>
              <span style={{ fontSize: 11 }}>⤴</span>
            </div>

            <div className="im-creator-card-stack">
              <div className="im-stacked-photo-card card-1">
                <img
                  src={showcaseAvatars[0]}
                  alt="Creator 1"
                  className="im-stacked-photo-img"
                />
                <div className="im-photo-sticker">
                  <span style={{ fontWeight: 800, fontSize: 9, color: '#0F172A' }}>♫</span>
                </div>
              </div>

              <div className="im-stacked-photo-card card-2">
                <img
                  src={showcaseAvatars[1]}
                  alt="Creator 2"
                  className="im-stacked-photo-img"
                />
                <div className="im-photo-sticker">
                  <span style={{ fontWeight: 800, fontSize: 9, color: '#E11D48' }}>▶</span>
                </div>
              </div>

              <div className="im-stacked-photo-card card-3">
                <img
                  src={showcaseAvatars[2]}
                  alt="Creator 3"
                  className="im-stacked-photo-img"
                />
                <div className="im-photo-sticker">
                  <span style={{ fontWeight: 800, fontSize: 9, color: '#9333EA' }}>📷</span>
                </div>
              </div>

              <div className="im-stacked-photo-card card-4">
                <img
                  src={showcaseAvatars[3]}
                  alt="Creator 4"
                  className="im-stacked-photo-img"
                />
                <div className="im-photo-sticker">
                  <span style={{ fontWeight: 800, fontSize: 9, color: '#059669' }}>🛍️</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: 3 KPI Metrics Cards (Full Width 3 Columns) */}
        <Row gutter={[16, 16]} align="stretch">
          {kpiCards.map((kpi) => (
            <Col xs={24} sm={8} key={kpi.id} style={{ display: 'flex', minWidth: 0 }}>
              <div className="im-kpi-card" style={{ flex: 1 }}>
                <div className="im-kpi-header">
                  <div className="im-kpi-icon-box" style={{ backgroundColor: kpi.iconBg }}>
                    {kpi.icon}
                  </div>
                  <span className="im-kpi-title">{kpi.title}</span>
                </div>

                <div className="im-kpi-body">
                  <div style={{ minWidth: 0 }}>
                    <div className="im-kpi-val">{kpi.value}</div>
                    <div className="im-kpi-trend">
                      <ArrowUpOutlined style={{ fontSize: 9 }} />
                      <span>{kpi.trend}</span>
                    </div>
                  </div>

                  <MiniBarChart color={kpi.chartColor} />
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          PHẦN 2: Chiến dịch gần đây & Hoạt động gần đây (50/50 Cân xứng, Không khoảng trắng)
          ════════════════════════════════════════════════════════════════ */}
      <div className="dashboard-scroll-section">
        <Row gutter={[16, 16]} align="stretch">
        {/* Left: Recent Campaigns */}
        <Col xs={24} lg={12} xl={12} style={{ display: 'flex', minWidth: 0 }}>
          <Card
            className="im-dashboard-card"
            style={{ flex: 1 }}
            title={
              <Space size={8}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4F46E5',
                    fontSize: 13,
                  }}
                >
                  <RocketOutlined />
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                  Chiến dịch gần đây
                </span>
              </Space>
            }
            extra={
              <Button
                type="link"
                onClick={() => navigate('/campaigns')}
                style={{ color: '#4F46E5', fontWeight: 700, fontSize: 12.5, padding: 0 }}
              >
                Xem tất cả <RightOutlined style={{ fontSize: 9, marginLeft: 2 }} />
              </Button>
            }
            bodyStyle={{ padding: '12px 16px 14px 16px', display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}
          >
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {[
                { key: 'all', label: `Tất cả (${campaignCounts.total})` },
                { key: 'running', label: `Đang chạy (${campaignCounts.running})` },
                { key: 'pending', label: `Chờ duyệt (${campaignCounts.pending})` },
                { key: 'completed', label: `Hoàn thành (${campaignCounts.completed})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setCampaignTab(tab.key)}
                  className={`im-campaign-filter-tab ${campaignTab === tab.key ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Campaign Rows */}
            {recentCampaignsList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentCampaignsList.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="im-campaign-row-item"
                    onClick={() => navigate(`/campaigns/${c.id}`)}
                  >
                    <img src={c.image} alt={c.title} className="im-campaign-thumb" />

                    <div style={{ flex: 1, minWidth: 100, overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.subtitle}
                      </div>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>
                        {c.date}
                      </div>
                    </div>

                    <div style={{ width: 85, textAlign: 'center', flexShrink: 0 }}>
                      <Tag
                        style={{
                          margin: 0,
                          borderRadius: 999,
                          fontWeight: 700,
                          fontSize: 10.5,
                          padding: '1px 7px',
                          border: 'none',
                          backgroundColor:
                            c.status === 'running'
                              ? '#ECFDF5'
                              : c.status === 'completed'
                              ? '#EFF6FF'
                              : '#FEF3C7',
                          color:
                            c.status === 'running'
                              ? '#059669'
                              : c.status === 'completed'
                              ? '#2563EB'
                              : '#D97706',
                        }}
                      >
                        ● {c.statusText}
                      </Tag>
                    </div>

                    <div style={{ width: 95, padding: '0 6px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>
                        <span>Tiến độ</span>
                        <span>{c.progress}%</span>
                      </div>
                      <Progress
                        percent={c.progress}
                        showInfo={false}
                        strokeColor={c.status === 'completed' ? '#2563EB' : c.status === 'pending' ? '#F59E0B' : '#6366F1'}
                        railColor="#F1F5F9"
                        size="small"
                        style={{ margin: 0 }}
                      />
                    </div>

                    <div style={{ width: 16, textAlign: 'right', flexShrink: 0 }}>
                      <RightOutlined style={{ fontSize: 9, color: '#CBD5E1' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 16px', gap: 10, flex: 1 }}>
                <RocketOutlined style={{ fontSize: 26, color: '#CBD5E1' }} />
                <span style={{ fontSize: 12.5, color: '#64748B' }}>
                  {rawCampaigns.length === 0
                    ? 'Chưa có chiến dịch nào được tạo.'
                    : 'Không có chiến dịch nào ở trạng thái này.'}
                </span>
                {rawCampaigns.length === 0 && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/campaigns/create')}
                    style={{ background: '#4F46E5', borderColor: '#4F46E5', borderRadius: 6, fontSize: 12, height: 32 }}
                  >
                    Tạo chiến dịch mới
                  </Button>
                )}
              </div>
            )}
          </Card>
        </Col>

        {/* Right: Recent Activities (Symmetric with Filter Tabs and 48px Card Rows) */}
        <Col xs={24} lg={12} xl={12} style={{ display: 'flex', minWidth: 0 }}>
          <Card
            className="im-dashboard-card"
            style={{ flex: 1 }}
            title={
              <Space size={8}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: '#F0F9FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284C7',
                    fontSize: 13,
                  }}
                >
                  <TeamOutlined />
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                  Hoạt động gần đây
                </span>
              </Space>
            }
            extra={
              <Button
                type="link"
                onClick={() => navigate('/crm')}
                style={{ color: '#4F46E5', fontWeight: 700, fontSize: 12.5, padding: 0 }}
              >
                Xem tất cả <RightOutlined style={{ fontSize: 9, marginLeft: 2 }} />
              </Button>
            }
            bodyStyle={{ padding: '12px 16px 14px 16px', display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}
          >
            {/* Symmetrical Filter Tabs matching Left Card */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {[
                { key: 'all', label: `Tất cả (${activityCounts.total})` },
                { key: 'shortlist', label: `Giỏ chọn lọc (${activityCounts.shortlist})` },
                { key: 'campaign', label: `Chiến dịch (${activityCounts.campaign})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActivityTab(tab.key)}
                  className={`im-campaign-filter-tab ${activityTab === tab.key ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {filteredActivities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredActivities.slice(0, 5).map((act) => (
                  <div key={act.id} className="im-activity-card-item">
                    <div className="im-activity-icon-badge" style={{ backgroundColor: act.iconBg }}>
                      {act.icon}
                    </div>

                    <Avatar size={30} src={act.avatar} style={{ flexShrink: 0 }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {act.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                        {act.campaign}
                      </div>
                    </div>

                    <div style={{ fontSize: 10.5, color: '#64748B', background: '#F8FAFC', padding: '2px 8px', borderRadius: 999, flexShrink: 0, fontWeight: 600 }}>
                      {act.time}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 16px', gap: 10, flex: 1 }}>
                <TeamOutlined style={{ fontSize: 26, color: '#CBD5E1' }} />
                <span style={{ fontSize: 12, color: '#64748B', textAlign: 'center' }}>
                  Chưa có hoạt động ở mục này.
                </span>
              </div>
            )}
          </Card>
        </Col>
      </Row>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          PHẦN 3: Hiệu quả chiến dịch & Top Creator Nổi bật
          ════════════════════════════════════════════════════════════════ */}
      <div className="dashboard-scroll-section">
        <Row gutter={[16, 16]} align="stretch">
        {/* Left: Campaign Performance */}
        <Col xs={24} lg={12} xl={12} style={{ display: 'flex', minWidth: 0 }}>
          <Card
            className="im-dashboard-card"
            style={{ flex: 1 }}
            title={
              <Space size={8}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: '#F0F9FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284C7',
                    fontSize: 13,
                  }}
                >
                  <BarChartOutlined />
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
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
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
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
            bodyStyle={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}
          >
            <Row gutter={[14, 14]} align="middle">
              {/* Spline Area Chart */}
              <Col xs={24} md={14} lg={13} xl={14}>
                <div style={{ display: 'flex', gap: 10, height: 165 }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      fontSize: 10,
                      color: '#94A3B8',
                      paddingBottom: 18,
                    }}
                  >
                    <span>{fmtNum(totalReach * 1.5 || 300000)}</span>
                    <span>{fmtNum(totalReach || 200000)}</span>
                    <span>{fmtNum(totalReach * 0.6 || 100000)}</span>
                    <span>{fmtNum(totalReach * 0.3 || 50000)}</span>
                    <span>0</span>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <svg viewBox="0 0 500 160" style={{ width: '100%', height: 140 }} preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaGradSmooth2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.4" />
                          <stop offset="60%" stopColor="#C084FC" stopOpacity="0.1" />
                          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="lineGradSmooth2" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#6366F1" />
                          <stop offset="50%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#A855F7" />
                        </linearGradient>
                      </defs>

                      <line x1="0" y1="15" x2="500" y2="15" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="50" x2="500" y2="50" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="85" x2="500" y2="85" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="120" x2="500" y2="120" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="150" x2="500" y2="150" stroke="#E2E8F0" strokeWidth="1" />

                      <path
                        d="M 0,120 C 50,115 70,90 120,95 C 170,100 190,85 240,65 C 280,50 330,45 380,42 C 420,40 460,50 500,45 L 500,150 L 0,150 Z"
                        fill="url(#areaGradSmooth2)"
                      />

                      <path
                        d="M 0,120 C 50,115 70,90 120,95 C 170,100 190,85 240,65 C 280,50 330,45 380,42 C 420,40 460,50 500,45"
                        fill="none"
                        stroke="url(#lineGradSmooth2)"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                      />

                      <circle cx="240" cy="65" r="4" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2" />
                      <circle cx="380" cy="42" r="4" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2" />
                    </svg>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', marginTop: 3 }}>
                      {chartDateLabels.map((lbl, idx) => (
                        <span key={idx}>{lbl}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Col>

              {/* Donut Chart with Platform Breakdown */}
              <Col xs={24} md={10} lg={11} xl={10}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    background: '#F8FAFC',
                    borderRadius: 14,
                    padding: '14px 10px',
                  }}
                >
                  <div style={{ position: 'relative', width: 95, height: 95, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 140 140" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <circle cx="70" cy="70" r="45" fill="transparent" stroke="#2563EB" strokeWidth="14" strokeDasharray="155.5 127.24" strokeDashoffset="0" strokeLinecap="round" />
                      <circle cx="70" cy="70" r="45" fill="transparent" stroke="#06B6D4" strokeWidth="14" strokeDasharray="84.82 197.92" strokeDashoffset="-159" strokeLinecap="round" />
                      <circle cx="70" cy="70" r="45" fill="transparent" stroke="#10B981" strokeWidth="14" strokeDasharray="42.41 240.33" strokeDashoffset="-247" strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{fmtNum(totalReach)}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: totalReach > 0 ? '#10B981' : '#94A3B8' }}>
                        {totalReach > 0 ? 'Mục tiêu' : '0'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', marginBottom: 1 }}>Kênh phân phối</div>
                    {platformStats.map((item) => (
                      <Space size={6} key={item.label}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, display: 'inline-block' }}></span>
                        <span style={{ fontSize: 11, color: '#475569' }}>{item.label}</span>
                        <span style={{ fontWeight: 800, fontSize: 11, color: '#0F172A' }}>{item.percent}%</span>
                      </Space>
                    ))}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right: Top Creators This Month */}
        <Col xs={24} lg={12} xl={12} style={{ display: 'flex', minWidth: 0 }}>
          <Card
            className="im-dashboard-card"
            style={{ flex: 1 }}
            title={
              <Space size={8}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D97706',
                    fontSize: 13,
                  }}
                >
                  <StarFilled />
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                  Top Nhà sáng tạo Nổi bật
                </span>
              </Space>
            }
            extra={
              <Button
                type="link"
                onClick={() => navigate('/campaigns')}
                style={{ color: '#4F46E5', fontWeight: 700, fontSize: 12.5, padding: 0 }}
              >
                Xem tất cả <RightOutlined style={{ fontSize: 9, marginLeft: 2 }} />
              </Button>
            }
            bodyStyle={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-start' }}
          >
            {topCreatorsList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topCreatorsList.map((cr) => (
                  <div
                    key={cr.rank}
                    className="im-creator-rank-row"
                    onClick={() => navigate('/campaigns')}
                  >
                    <div
                      className="im-rank-number"
                      style={{
                        color:
                          cr.rank === 1
                            ? '#D97706'
                            : cr.rank === 2
                            ? '#64748B'
                            : cr.rank === 3
                            ? '#B45309'
                            : '#94A3B8',
                      }}
                    >
                      {cr.rank}
                    </div>

                    <Avatar size={32} src={cr.avatar} style={{ marginRight: 8, flexShrink: 0 }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cr.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cr.category}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', paddingLeft: 6 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A' }}>{cr.reach}</div>
                      <div style={{ fontSize: 9.5, color: '#10B981', fontWeight: 700 }}>{cr.engagement}</div>
                    </div>

                    <RightOutlined style={{ fontSize: 9, color: '#CBD5E1', marginLeft: 6 }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 16px', gap: 10, flex: 1 }}>
                <StarFilled style={{ fontSize: 26, color: '#CBD5E1' }} />
                <span style={{ fontSize: 12, color: '#64748B', textAlign: 'center' }}>
                  Đang tải danh sách Creator nổi bật...
                </span>
              </div>
            )}
          </Card>
        </Col>
      </Row>
      </div>
    </div>
  );
}
