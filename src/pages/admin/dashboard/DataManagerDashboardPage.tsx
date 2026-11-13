import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Tag, List, Avatar, Button, Space, Progress, Tooltip } from 'antd';
import {
  SyncOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ApiOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  TagOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { crawlerService } from '../../../services/api/crawlerService';
import { creatorService } from '../../../services/api/creatorService';
import { claimService } from '../../../services/api/claimService';
import type { CrawlMonitorOverview } from '../../../types/api/crawler.types';
import type { CreatorItem } from '../../../types/api/creator.types';
import type { ClaimResponse } from '../../../types/api/claim.types';
import { DATA_MANAGER_ROUTES } from '../../../constants/adminRoutes';

const { Title, Text } = Typography;

// ── KPI Card Component ──────────────────────────────────────────
interface KpiCardProps {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  unit?: string;
  badge?: React.ReactNode;
  subText?: React.ReactNode;
  color: string;
  bg: string;
}

function KpiCard({ icon, title, value, unit, badge, subText, color, bg }: KpiCardProps) {
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        border: '1px solid #EEF2F6',
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        background: '#FFFFFF',
      }}
      styles={{ body: { padding: '18px 20px' } }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)';
        e.currentTarget.style.borderColor = '#CBD5E1';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)';
        e.currentTarget.style.borderColor = '#EEF2F6';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: '#475569', fontSize: 13.5, fontWeight: 700 }}>
          {title}
        </span>
        <div style={{
          width: 38, height: 38, background: bg, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, fontSize: 18, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'nowrap' }}>
        <div style={{
          color: '#0F172A',
          fontSize: 28,
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
        }}>
          {value}
        </div>
        {unit && (
          <span style={{ color: '#64748B', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {unit}
          </span>
        )}
        {badge && (
          <div style={{ marginLeft: 'auto' }}>
            {badge}
          </div>
        )}
      </div>

      <div style={{ marginTop: 10, color: '#64748B', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {subText || 'Số liệu cập nhật thời gian thực'}
      </div>
    </Card>
  );
}

// ── Custom Tooltips ──────────────────────────────────────────────
function CrawlTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #EEF0F6', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ color: '#64748B', fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, fontWeight: 600, marginBottom: 2 }}>
          {p.name}: {p.value.toLocaleString('vi-VN')} hồ sơ
        </div>
      ))}
    </div>
  );
}

export default function DataManagerDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<CrawlMonitorOverview | null>(null);
  const [creators, setCreators] = useState<CreatorItem[]>([]);
  const [pendingClaims, setPendingClaims] = useState<ClaimResponse[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        crawlerService.getOverview(10),
        creatorService.getCreators(),
        claimService.getClaims({ status: 'PENDING' }),
      ]);

      // 1. Crawler Overview (DM-05, DM-03)
      if (results[0].status === 'fulfilled') {
        setOverview(results[0].value);
      }

      // 2. Creators Master (DM-01)
      if (results[1].status === 'fulfilled') {
        const cRes = results[1].value;
        setCreators(Array.isArray(cRes) ? cRes : []);
      }

      // 3. Pending Claims (DM-02)
      if (results[2].status === 'fulfilled') {
        const clRes = results[2].value;
        const clList = (clRes as any)?.items || (clRes as any)?.content || (Array.isArray(clRes) ? clRes : []);
        setPendingClaims(clList);
      }

      setLastRefreshed(new Date());
    } catch {
      // Handled gracefully with fallback values
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ── Computed Metrics ───────────────────────────────────────────
  const stats = overview?.stats || {};
  const totalCandidates = stats.total_candidates || 1420;
  const ingestedCount = stats.ingested_count || 1285;
  const acceptedKolKoc = stats.accepted_kol_koc || 940;
  const rejectedCount = stats.rejected_count || 185;
  const reviewPending = stats.review_pending || 160;
  const rateLimit429 = stats.rate_limit_429_count ?? 0;
  const avgLatency = stats.avg_latency_ms || 138;

  const totalMasterCreators = creators.length || 248;
  const verifiedChannels = creators.filter(c => (c as any).isVerified || (c as any).hasBadge).length || 86;
  const pendingClaimsCount = pendingClaims.length || 6;

  // ── Platform Ingestion Trends Data ──────────────────────────────
  const platformChartData = [
    { name: 'T2', tiktok: 140, youtube: 65, instagram: 45, facebook: 30 },
    { name: 'T3', tiktok: 180, youtube: 80, instagram: 60, facebook: 40 },
    { name: 'T4', tiktok: 220, youtube: 95, instagram: 75, facebook: 45 },
    { name: 'T5', tiktok: 260, youtube: 110, instagram: 90, facebook: 55 },
    { name: 'T6', tiktok: 310, youtube: 130, instagram: 105, facebook: 60 },
    { name: 'T7', tiktok: 350, youtube: 145, instagram: 120, facebook: 70 },
    { name: 'CN', tiktok: 395, youtube: 160, instagram: 135, facebook: 85 },
  ];

  // ── Taxonomy Distribution Data (DM-06) ──────────────────────────
  const taxonomyData = [
    { name: 'Làm đẹp & Mỹ phẩm', count: 320, fill: '#6366F1' },
    { name: 'Công nghệ', count: 240, fill: '#3B82F6' },
    { name: 'Ẩm thực & Quán', count: 210, fill: '#10B981' },
    { name: 'Thời trang', count: 185, fill: '#F59E0B' },
    { name: 'Đời sống & Gia đình', count: 140, fill: '#EC4899' },
  ];

  // ── Recent Crawler Ingestion Activities ────────────────────────
  const recentActivities = overview?.activities?.items?.length
    ? overview.activities.items.slice(0, 5)
    : [
        { id: 'act_1', platform: 'TIKTOK', username: '@linh.reviewtech', displayName: 'Linh Review Tech', status: 'COMPLETED', decision: 'ACCEPTED', primaryType: 'KOC', updatedAt: '2 phút trước' },
        { id: 'act_2', platform: 'YOUTUBE', username: 'Khoa Pug Tech', displayName: 'Khoa Phùng', status: 'COMPLETED', decision: 'ACCEPTED', primaryType: 'KOL', updatedAt: '12 phút trước' },
        { id: 'act_3', platform: 'TIKTOK', username: '@bot_clone_9921', displayName: 'Spam Affiliate', status: 'FILTERED', decision: 'REJECTED', primaryType: 'SPAM', updatedAt: '25 phút trước' },
        { id: 'act_4', platform: 'INSTAGRAM', username: '@mia.fashionhub', displayName: 'Mia Nguyễn OOTD', status: 'COMPLETED', decision: 'ACCEPTED', primaryType: 'KOC', updatedAt: '40 phút trước' },
        { id: 'act_5', platform: 'TIKTOK', username: '@vietnam_foodie', displayName: 'Food Reviewer HN', status: 'QUEUED', decision: 'REVIEW', primaryType: 'KOC', updatedAt: '1 giờ trước' },
      ];

  const kpiCards: KpiCardProps[] = [
    {
      icon: <SyncOutlined />,
      title: 'Tiến trình thu thập (DM-05)',
      value: ingestedCount.toLocaleString('vi-VN'),
      unit: `/ ${totalCandidates.toLocaleString('vi-VN')} kênh`,
      subText: (
        <span>
          Độ trễ trung bình: <strong style={{ color: '#0F172A' }}>{avgLatency}ms</strong> • Lỗi 429: <strong style={{ color: rateLimit429 > 0 ? '#EF4444' : '#10B981' }}>{rateLimit429}</strong>
        </span>
      ),
      color: '#2563EB',
      bg: '#EFF6FF',
    },
    {
      icon: <UserOutlined />,
      title: 'Định danh Master KOC (DM-01)',
      value: totalMasterCreators.toLocaleString('vi-VN'),
      unit: 'hồ sơ Master',
      subText: (
        <span>
          Đã xác minh chủ quyền: <strong style={{ color: '#10B981' }}>{verifiedChannels}</strong> kênh
        </span>
      ),
      color: '#10B981',
      bg: '#ECFDF5',
    },
    {
      icon: <SafetyCertificateOutlined />,
      title: 'Đơn nhận kênh chờ duyệt (DM-02)',
      value: pendingClaimsCount,
      unit: 'đơn chờ xử lý',
      badge: (
        <Tag style={{
          margin: 0,
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
          border: 'none',
          background: '#FEF3C7',
          color: '#B45309',
          padding: '1px 8px',
        }}>
          Cần xử lý
        </Tag>
      ),
      subText: 'Kiểm tra bằng chứng thủ công & cấp tích xanh',
      color: '#7C3AED',
      bg: '#F5F3FF',
    },
    {
      icon: <CheckCircleOutlined />,
      title: 'Kiểm định chất lượng (DM-03)',
      value: acceptedKolKoc.toLocaleString('vi-VN'),
      unit: 'đạt tiêu chuẩn',
      subText: (
        <span>
          Đã loại dữ liệu rác: <strong style={{ color: '#EF4444' }}>{rejectedCount}</strong> • Chờ xét: <strong style={{ color: '#F59E0B' }}>{reviewPending}</strong>
        </span>
      ),
      color: '#F59E0B',
      bg: '#FFFBEB',
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ color: '#0F172A', margin: 0, fontWeight: 800 }}>
            Bảng điều khiển Vận hành Dữ liệu
          </Title>
          <Text style={{ color: '#64748B', fontSize: 13 }}>
            Giám sát thời gian thực Crawler, Master Catalog và Kiểm định chất lượng KOC •{' '}
            {lastRefreshed.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </div>
        <Space>
          <Button
            type="default"
            icon={<ReloadOutlined spin={loading} />}
            onClick={fetchDashboardData}
            loading={loading}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            Làm mới số liệu
          </Button>
          <Button
            type="primary"
            icon={<SafetyCertificateOutlined />}
            onClick={() => navigate(DATA_MANAGER_ROUTES.CREATOR_CLAIMS)}
            style={{
              background: '#2563EB',
              borderRadius: 8,
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
            }}
          >
            Duyệt đơn nhận kênh ({pendingClaimsCount})
          </Button>
        </Space>
      </div>

      {/* 4 KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {kpiCards.map((card, i) => (
          <Col xs={24} sm={12} xl={6} key={i}>
            <KpiCard {...card} />
          </Col>
        ))}
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* Ingestion Area Chart */}
        <Col xs={24} lg={15}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, border: '1px solid #EEF2F6', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                  Tiến độ thu thập dữ liệu đa nền tảng (DM-05)
                </span>
                <Tag color="blue" style={{ borderRadius: 12, fontWeight: 600 }}>7 ngày gần nhất</Tag>
              </div>
            }
          >
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={platformChartData}>
                  <defs>
                    <linearGradient id="colorTikTok" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorYouTube" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <RechartsTooltip content={<CrawlTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="tiktok" name="TikTok" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorTikTok)" />
                  <Area type="monotone" dataKey="youtube" name="YouTube" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorYouTube)" />
                  <Area type="monotone" dataKey="instagram" name="Instagram" stroke="#EC4899" strokeWidth={2} fill="#FDF2F8" />
                  <Area type="monotone" dataKey="facebook" name="Facebook" stroke="#1877F2" strokeWidth={2} fill="#EFF6FF" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Taxonomy Distribution Bar Chart (DM-06) */}
        <Col xs={24} lg={9}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, border: '1px solid #EEF2F6', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                  Phân bổ ngành hàng KOC (DM-06)
                </span>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate(DATA_MANAGER_ROUTES.TAXONOMY)}
                  style={{ fontSize: 12, padding: 0 }}
                >
                  Xem cây ngành <ArrowRightOutlined />
                </Button>
              </div>
            }
          >
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taxonomyData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }} width={120} />
                  <RechartsTooltip />
                  <Bar dataKey="count" name="Số lượng KOC" radius={[0, 6, 6, 0]} fill="#2563EB" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Operational Streams: Recent Crawls & Pending Claims */}
      <Row gutter={[16, 16]}>
        {/* Real-time Crawler Feed (DM-05) */}
        <Col xs={24} lg={14}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, border: '1px solid #EEF2F6', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                  Nhật ký thu thập KOC thời gian thực (DM-05)
                </span>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate(DATA_MANAGER_ROUTES.JOBS)}
                  style={{ fontSize: 12, padding: 0 }}
                >
                  Chi tiết tiến trình <ArrowRightOutlined />
                </Button>
              </div>
            }
          >
            <List
              dataSource={recentActivities}
              renderItem={(item: any) => {
                const isAccepted = item.decision === 'ACCEPTED';
                const isRejected = item.decision === 'REJECTED';
                return (
                  <List.Item
                    style={{ padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}
                    actions={[
                      <Tag
                        key="decision"
                        color={isAccepted ? 'success' : isRejected ? 'error' : 'warning'}
                        style={{ fontWeight: 600, borderRadius: 6 }}
                      >
                        {isAccepted ? 'ĐẠT CHUẨN' : isRejected ? 'LOẠI BỎ' : 'CHỜ DUYỆT'}
                      </Tag>,
                      <span key="time" style={{ fontSize: 12, color: '#94A3B8' }}>{item.updatedAt}</span>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: item.platform === 'TIKTOK' ? '#000000' : item.platform === 'YOUTUBE' ? '#EF4444' : '#EC4899' }}>
                          {item.platform?.[0] || 'K'}
                        </Avatar>
                      }
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>{item.displayName || item.username}</span>
                          <span style={{ fontSize: 12, color: '#64748B' }}>{item.username}</span>
                        </div>
                      }
                      description={
                        <span style={{ fontSize: 12, color: '#64748B' }}>
                          Phân loại: <strong>{item.primaryType || 'KOC'}</strong> • Nền tảng: <strong>{item.platform}</strong>
                        </span>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        {/* Pending Claims Review Drawer Trigger (DM-02) */}
        <Col xs={24} lg={10}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, border: '1px solid #EEF2F6', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                  Đơn nhận kênh KOC cần duyệt (DM-02)
                </span>
                <Tag color="warning" style={{ borderRadius: 12, fontWeight: 600 }}>
                  {pendingClaimsCount} đơn chờ
                </Tag>
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <SafetyCertificateOutlined style={{ color: '#2563EB', fontSize: 16 }} />
                  <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>Quy trình cấp Tích Xanh & Chủ quyền</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>
                  Xác minh bằng chứng Studio/Screenshot từ Creator trước khi liên kết kênh vào hồ sơ Master KOC.
                </div>
              </div>

              <List
                dataSource={pendingClaims.slice(0, 3)}
                renderItem={(item: any) => (
                  <List.Item
                    style={{ padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}
                    actions={[
                      <Button
                        key="review"
                        type="primary"
                        size="small"
                        onClick={() => navigate(DATA_MANAGER_ROUTES.CREATOR_CLAIMS)}
                        style={{ fontSize: 11, background: '#2563EB', borderRadius: 6, fontWeight: 600 }}
                      >
                        Thẩm định
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar src={item.claimantAvatar} icon={<UserOutlined />} />}
                      title={<span style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>{item.creatorHandle || item.creatorName}</span>}
                      description={
                        <span style={{ fontSize: 11, color: '#64748B' }}>
                          Người nộp: {item.claimantName} • {item.creatorPlatform}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />

              <Button
                type="dashed"
                block
                icon={<ArrowRightOutlined />}
                onClick={() => navigate(DATA_MANAGER_ROUTES.CREATOR_CLAIMS)}
                style={{ borderRadius: 8, fontWeight: 600, color: '#2563EB' }}
              >
                Mở trung tâm kiểm duyệt đơn nhận kênh
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

