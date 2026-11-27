import ImageUploadButton from '../../../components/common/ImageUploadButton';
import CreatorAvatar from '../components/discovery/CreatorAvatar';
import { creatorService } from '../../../services/api/creatorService';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  Alert,
  Card,
  Row,
  Col,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Progress,
  Divider,
  Space,
  message,
  Popconfirm,
  Descriptions,
  Tooltip,
  Table,
} from 'antd';
import {
  SafetyCertificateOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleFilled,
  ThunderboltOutlined,
  CalendarOutlined,
  IdcardOutlined,
  RiseOutlined,
  CheckOutlined,
  StarFilled,
  GlobalOutlined,
  VideoCameraOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  creatorPortalService,
  type AggregatedReachResponse,
  CreatorIdentityVerification,
  CreatorRateCardPackage,
} from '../../../services/api/creatorPortalService';
import { authService } from '../../../services/api/authService';
import { getErrorMessage } from '../../../services/apiClient';
import { channelVerificationService, type LinkedChannel } from '../../../services/api/channelVerificationService';
import ChannelVerification from './ChannelVerification';
import './CreatorPortalPage.css';

import CreatorCooperationPage from './CreatorCooperationPage';

export default function CreatorPortalPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('verification')) return 'verification';
    if (path.includes('social')) return 'social';
    if (path.includes('rate-card')) return 'ratecard';
    if (path.includes('booking')) return 'bookings';
    return 'reach';
  };

  const [activeTab, setActiveTab] = useState<string>(getTabFromPath());

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    const routeMap: Record<string, string> = {
      reach: '/creator/dashboard',
      verification: '/creator/verification',
      social: '/creator/social-accounts',
      ratecard: '/creator/rate-card',
      bookings: '/creator/bookings',
    };
    if (routeMap[key]) {
      navigate(routeMap[key]);
    }
  };

  // State data
  const [verification, setVerification] = useState<CreatorIdentityVerification>(
    creatorPortalService.getVerification(),
  );
  const [linked, setLinked] = useState<LinkedChannel[] | null>(null);
  const [linkedError, setLinkedError] = useState('');
  const [rateCards, setRateCards] = useState<CreatorRateCardPackage[]>(creatorPortalService.getRateCards());
  const profileEtagRef = useRef<string | undefined>(undefined);
  const [reach, setReach] = useState<AggregatedReachResponse | null>(null);
  const user = authService.getCurrentUser();
  const activeCreator = user?.role === 'CREATOR' && user.status === 'ACTIVE';
  const canVerify = activeCreator && (user.permissions?.includes('CLAIM_CREATOR_PROFILE') ?? false);
  const canViewClaims = activeCreator && (user.permissions?.includes('VIEW_OWN_CREATOR_CLAIM') ?? false);
  const channels = linked ?? [];
  const isVerified = channels.some(channel => channel.verifiedByInfluencerMatch);

  const [avatarUploading, setAvatarUploading] = useState(false);
  async function changeAvatar(creatorId: string, file: File, signal: AbortSignal) {
    const stored = await creatorService.uploadAvatar(creatorId, file, signal);
    if (!signal.aborted) setLinked(previous => previous?.map(channel =>
      channel.id === creatorId ? { ...channel, avatarUrl: stored.url } : channel) ?? null);
  }

  // Modal Rate Card
  const [rateCardModalOpen, setRateCardModalOpen] = useState(false);
  const [editingRateCard, setEditingRateCard] = useState<CreatorRateCardPackage | null>(null);
  const [rateCardForm] = Form.useForm();

  // Modal Update Verification CCCD
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyForm] = Form.useForm();

  const reloadLinked = useCallback(async (signal?: AbortSignal) => {
    setLinkedError('');
    try {
      const items = await channelVerificationService.listLinked(signal);
      if (signal?.aborted) return null;
      setLinked(items);
      return items;
    } catch (error) {
      if (!signal?.aborted) {
        setLinked(null);
        setLinkedError(getErrorMessage(error, 'Không tải được kênh đã liên kết.'));
      }
      return null;
    }
  }, []);

  useEffect(() => {
    setLinked(null);
    setReach(null);
    if (!canVerify) return;
    const controller = new AbortController();
    void reloadLinked(controller.signal);
    void creatorPortalService.fetchAggregatedReach(controller.signal).then((data) => {
      if (!controller.signal.aborted) setReach(data);
    });
    void creatorPortalService.fetchProfileApi(controller.signal).then((res) => {
      if (controller.signal.aborted || !res) return;
      if (res.etag) profileEtagRef.current = res.etag;
      const savedCards = res.profile?.profile?.rateCards;
      if (Array.isArray(savedCards) && savedCards.length > 0) {
        setRateCards(savedCards);
      }
    });
    return () => controller.abort();
  }, [canVerify, user?.id, reloadLinked]);

  const handleOpenClaimModal = () => navigate('/creator/social-accounts?claim=new');

  // 1. Handlers cho Rate Card
  const handleOpenAddRateCard = () => {
    setEditingRateCard(null);
    rateCardForm.resetFields();
    rateCardForm.setFieldsValue({
      platform: 'TIKTOK',
      format: 'VIDEO',
      turnaroundDays: 3,
      usageRightsDays: 30,
      priceVnd: 15000000,
    });
    setRateCardModalOpen(true);
  };

  const handleOpenEditRateCard = (pkg: CreatorRateCardPackage) => {
    setEditingRateCard(pkg);
    rateCardForm.setFieldsValue({
      name: pkg.name,
      platform: pkg.platform,
      format: pkg.format,
      priceVnd: pkg.priceVnd,
      turnaroundDays: pkg.turnaroundDays,
      usageRightsDays: pkg.usageRightsDays,
      description: pkg.description,
      deliverablesText: pkg.deliverables.join('\n'),
    });
    setRateCardModalOpen(true);
  };

  const handleSaveRateCard = async () => {
    try {
      const values = await rateCardForm.validateFields();
      const deliverables = values.deliverablesText
        ? values.deliverablesText.split('\n').filter((d: string) => d.trim().length > 0)
        : ['1 Video chất lượng cao', 'Bàn giao file gốc'];

      const payload: CreatorRateCardPackage = {
        id: editingRateCard ? editingRateCard.id : 'rc_' + Date.now(),
        name: values.name,
        platform: values.platform,
        format: values.format,
        priceVnd: values.priceVnd,
        turnaroundDays: values.turnaroundDays,
        usageRightsDays: values.usageRightsDays,
        description: values.description || '',
        deliverables,
        isPopular: editingRateCard ? editingRateCard.isPopular : false,
      };

      const updated = creatorPortalService.upsertRateCard(payload);
      setRateCards(updated);
      const saved = await creatorPortalService.updateProfileApi({ rateCards: updated }, profileEtagRef.current);
      if (saved?.etag) profileEtagRef.current = saved.etag;
      message.success(editingRateCard ? 'Đã cập nhật gói báo giá thành công!' : 'Đã thêm gói báo giá mới vào Rate Card!');
      setRateCardModalOpen(false);
    } catch {}
  };

  const handleDeleteRateCard = async (id: string) => {
    const updated = creatorPortalService.deleteRateCard(id);
    setRateCards(updated);
    const saved = await creatorPortalService.updateProfileApi({ rateCards: updated }, profileEtagRef.current);
    if (saved?.etag) profileEtagRef.current = saved.etag;
    message.success('Đã xóa gói báo giá khỏi Rate Card.');
  };

  // 4. Handlers cho Xác minh CCCD
  const handleOpenVerifyModal = () => {
    verifyForm.setFieldsValue({
      fullName: verification.fullName,
      idNumber: verification.idNumber,
      dateOfBirth: verification.dateOfBirth,
      phone: verification.phone,
      email: verification.email,
    });
    setVerifyModalOpen(true);
  };

  const handleSubmitVerification = async () => {
    try {
      const values = await verifyForm.validateFields();
      const updated = creatorPortalService.saveVerification(values);
      setVerification(updated);
      message.success('Đã gửi hồ sơ định danh CCCD! Trạng thái chuyển sang "Chờ duyệt".');
      setVerifyModalOpen(false);
    } catch {}
  };

  const connectedChannelsCount = linked?.length;
  const avgRateCardPrice =
    rateCards.length > 0
      ? Math.round(rateCards.reduce((sum, r) => sum + r.priceVnd, 0) / rateCards.length)
      : 0;

  return (
    <div className="creator-studio-page">
      {/* ========================================================================= */}
      {/* VIEW 1: TỔNG QUAN CREATOR STUDIO (/creator/dashboard)                     */}
      {/* ========================================================================= */}
      {activeTab === 'reach' && (
        <div className="creator-studio-stack">
          {/* 1. Pastel Lavender Wave Hero Banner matching Admin Mockup 1:1 */}
          <header className="creator-hero-banner">
            <svg
              className="creator-hero-waves"
              viewBox="0 0 700 260"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M120 260 C 260 150, 360 220, 490 110 C 575 40, 645 65, 700 20 L 700 260 Z"
                fill="url(#creatorWave1)"
              />
              <path
                d="M240 260 C 370 180, 470 215, 580 125 C 635 80, 675 95, 700 65 L 700 260 Z"
                fill="url(#creatorWave2)"
              />
              <defs>
                <linearGradient id="creatorWave1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#DDD6FE" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.65" />
                </linearGradient>
                <linearGradient id="creatorWave2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.45" />
                </linearGradient>
              </defs>
            </svg>

            <div className="creator-hero-left">
              <div className="creator-avatar-ring-wrap">
                <CreatorAvatar size={78} src={channels[0]?.avatarUrl ?? undefined} name={channels[0]?.displayName || user?.fullName} />
                <span
                  className={`creator-status-dot ${isVerified ? 'verified' : 'unverified'}`}
                  title={isVerified ? 'Có kênh đã xác minh trên InfluencerMatch' : 'Chưa xác nhận được kênh đã xác minh'}
                />
              </div>

              <div className="creator-hero-info">
                <div className="creator-hero-status-row">
                  <span className="creator-live-pill">
                    <span className="creator-live-dot" />
                    {isVerified ? 'Có kênh đã xác minh' : 'Hồ sơ nhà sáng tạo'}
                  </span>
                  <span className="creator-lavender-pill">
                    <StarFilled style={{ fontSize: 11, color: '#6D28D9', marginRight: 5 }} />
                    Điểm uy tín AI: 98.5%
                  </span>
                </div>

                <h1 className="creator-editorial-title">
                  {user?.fullName || 'Nhà sáng tạo'} <span className="creator-editorial-italic">Creator Studio</span>
                </h1>

                <p className="creator-hero-bio">
                  Nhà sáng tạo nội dung Thời trang, Phong cách sống & Làm đẹp cao cấp • Hồ sơ hiển thị công khai trên Creator Catalog cho Doanh nghiệp.
                </p>

                <div className="creator-hero-chips">
                  <span className="creator-meta-chip">
                    <GlobalOutlined /> Thời trang & High Fashion
                  </span>
                  <span className="creator-meta-chip">
                    <strong>Kênh đã liên kết:</strong> {connectedChannelsCount ?? '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="creator-hero-actions">
              <Button
                icon={<CalendarOutlined />}
                onClick={() => handleTabChange('bookings')}
                className="creator-secondary-btn"
              >
                Hợp tác của tôi
              </Button>
              <Button
                icon={<DollarOutlined />}
                onClick={() => handleTabChange('ratecard')}
                className="creator-secondary-btn"
              >
                Bảng giá ({rateCards.length})
              </Button>
              <Button
                type="primary"
                icon={<SafetyCertificateOutlined />}
                onClick={handleOpenClaimModal}
                className="creator-primary-btn"
              >
                Nộp đơn Claim Tích Xanh
              </Button>
            </div>
          </header>

          {/* 2. 4 Core KPI Bento Cards (Real data from /creators/portal/analytics/reach) */}
          {(() => {
            const totalFollowers = reach?.totalFollowers ?? 0;
            const totalAvgViews = reach?.totalAvgViews ?? 0;
            const rawEr = reach?.averageEngagementRate ?? 0;
            const erPct = rawEr > 0 ? (rawEr <= 1 ? rawEr * 100 : rawEr) : 0;
            const channelTotal = reach?.channelCount ?? connectedChannelsCount ?? 0;
            const fmtCount = (n: number) =>
              n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
              : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K`
              : n.toLocaleString('vi-VN');
            const breakdown = reach?.platformBreakdown ?? [];
            const chartData = breakdown.map(item => ({
              name: item.userName ? `@${item.userName.replace(/^@+/, '')}` : item.platform,
              platform: item.platform,
              followers: Number(item.followers ?? 0),
              avgViews: Number(item.avgViews ?? 0),
            }));

            return <>
              <div className="creator-bento-grid-4">
                <section className="creator-bento-card">
                  <div className="creator-bento-row">
                    <div className="creator-bento-icon blue">
                      <EyeOutlined />
                    </div>
                    <div className="creator-bento-body">
                      <span className="creator-bento-label">Tổng người theo dõi</span>
                      <p className="creator-bento-value">{fmtCount(totalFollowers)}</p>
                      <div>
                        <span className="creator-bento-badge neutral">
                          Tổng hợp {channelTotal} kênh
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="creator-bento-card">
                  <div className="creator-bento-row">
                    <div className="creator-bento-icon amber">
                      <VideoCameraOutlined />
                    </div>
                    <div className="creator-bento-body">
                      <span className="creator-bento-label">Lượt xem TB / Video</span>
                      <p className="creator-bento-value">{fmtCount(totalAvgViews)}</p>
                      <div>
                        <span className="creator-bento-badge neutral">
                          Theo dữ liệu kênh đã duyệt
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="creator-bento-card">
                  <div className="creator-bento-row">
                    <div className="creator-bento-icon green">
                      <FireOutlined />
                    </div>
                    <div className="creator-bento-body">
                      <span className="creator-bento-label">Tỷ lệ tương tác (ER%)</span>
                      <p className="creator-bento-value">
                        {erPct > 0 ? `${erPct.toFixed(2)}%` : '—'}
                      </p>
                      <div>
                        <span className="creator-growth-pill">
                          {erPct > 0 ? 'Trung bình gia quyền' : 'Chưa có dữ liệu ER'}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="creator-bento-card">
                  <div className="creator-bento-row">
                    <div className="creator-bento-icon purple">
                      <GlobalOutlined />
                    </div>
                    <div className="creator-bento-body">
                      <span className="creator-bento-label">Kênh đã liên kết</span>
                      <p className="creator-bento-value">{channelTotal} kênh</p>
                      <div>
                        <span className="creator-bento-badge">
                          {reach?.platforms?.length ? reach.platforms.join(', ') : 'Chưa liên kết kênh'}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: '#FAF5FF',
                  border: '1px solid #E9D5FF',
                  fontSize: 13,
                  color: '#334155',
                  lineHeight: 1.55,
                  marginBottom: 18,
                }}
              >
                <strong style={{ color: '#6D28D9' }}>Cơ chế AI đề xuất kênh (4-Memory &amp; Post-Campaign Learning):</strong>{' '}
                Mỗi hợp tác hoàn tất đúng hạn, đạt KPI và nhận đánh giá tốt từ Thương hiệu sẽ trực tiếp cộng điểm vào{' '}
                <strong>M1 (Uy tín lịch sử)</strong> và <strong>M4 (Độ phù hợp thương hiệu)</strong>, giúp kênh của bạn được ưu tiên xếp hạng cao hơn trong các lượt Đề xuất AI tiếp theo.
              </div>

              {/* 3. Real Analytics Row: Channel Comparison BarChart + Linked Channel Breakdown */}
              <Row gutter={[18, 18]}>
                <Col xs={24} lg={14}>
                  <Card
                    variant="borderless"
                    className="creator-section-card"
                    title={
                      <div className="creator-card-header-inline">
                        <div>
                          <div className="creator-card-title">Hiệu suất theo Kênh đã liên kết</div>
                          <div className="creator-card-subtitle">So sánh lượng người theo dõi và lượt xem trung bình từ dữ liệu thực tế</div>
                        </div>
                        <Tag color="blue" style={{ borderRadius: 999, fontWeight: 600, margin: 0 }}>
                          Dữ liệu thực tế
                        </Tag>
                      </div>
                    }
                  >
                    {chartData.length ? (
                      <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                            <YAxis
                              tick={{ fontSize: 11.5, fill: '#64748B' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(val: number) => fmtCount(val)}
                            />
                            <RechartsTooltip
                              formatter={(val: unknown, name: unknown) => [
                                Number(val).toLocaleString('vi-VN'),
                                name === 'followers' ? 'Followers' : 'Lượt xem TB',
                              ]}
                              contentStyle={{ borderRadius: 10, borderColor: '#E2E8F0', fontSize: 12.5 }}
                            />
                            <Legend formatter={(value) => (value === 'followers' ? 'Followers' : 'Lượt xem TB')} />
                            <Bar dataKey="followers" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={42} />
                            <Bar dataKey="avgViews" fill="#7C3AED" radius={[6, 6, 0, 0]} maxBarSize={42} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B' }}>
                        <p style={{ marginBottom: 12 }}>Bạn chưa có kênh mạng xã hội nào được xác minh để tổng hợp số liệu.</p>
                        <Button type="primary" className="creator-primary-btn" onClick={handleOpenClaimModal}>
                          Liên kết & xác minh kênh ngay
                        </Button>
                      </div>
                    )}
                  </Card>
                </Col>

                <Col xs={24} lg={10}>
                  <Card
                    variant="borderless"
                    className="creator-section-card"
                    title={
                      <div>
                        <div className="creator-card-title">Chi tiết từng Kênh</div>
                        <div className="creator-card-subtitle">Số liệu đồng bộ cho từng kênh thuộc quyền quản lý của bạn</div>
                      </div>
                    }
                  >
                    {breakdown.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {breakdown.map((ch) => {
                          const chEr = ch.engagementRate != null
                            ? (ch.engagementRate <= 1 ? ch.engagementRate * 100 : ch.engagementRate)
                            : null;
                          return (
                            <div key={ch.channelId} className="creator-mini-row" style={{ background: '#F8FAFC', borderColor: '#E1E7F0' }}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>
                                  {ch.displayName || ch.userName || ch.platform}
                                </div>
                                <div style={{ fontSize: 12, color: '#64748B' }}>
                                  {ch.platform} · {ch.userName ? `@${ch.userName.replace(/^@+/, '')}` : '—'}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontWeight: 700, color: '#2563EB', fontSize: 13 }}>
                                  {fmtCount(Number(ch.followers ?? 0))} followers
                                </div>
                                <div style={{ fontSize: 12, color: '#64748B' }}>
                                  {fmtCount(Number(ch.avgViews ?? 0))} views · ER {chEr != null ? `${chEr.toFixed(2)}%` : '—'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B' }}>
                        Chưa có dữ liệu phân tích kênh.
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            </>;
          })()}

          {/* 4. Quick Workspace Overview: Linked Channels & Active Rate Cards */}
          <Row gutter={[18, 18]}>
            <Col xs={24} lg={12}>
              <Card
                bordered={false}
                className="creator-section-card"
                title={<span className="creator-card-title">Kênh mạng xã hội đang liên kết ({connectedChannelsCount ?? '—'})</span>}
                extra={
                  <Button type="link" size="small" onClick={() => handleTabChange('social')} style={{ fontWeight: 700, color: '#7C3AED', padding: 0 }}>
                    Quản lý kênh →
                  </Button>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {channels.slice(0, 3).map((ch) => (
                    <div key={ch.id} className="creator-mini-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CreatorAvatar size={40} src={ch.avatarUrl ?? undefined} name={ch.displayName || ch.userName || ch.externalId} />
                        <ImageUploadButton label="Đổi ảnh" disabled={!activeCreator || avatarUploading}
                          onBusyChange={setAvatarUploading}
                          upload={(file, signal) => changeAvatar(ch.id, file, signal)} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>{ch.displayName || ch.userName || ch.externalId}</span>
                            <Tag style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
                              {ch.platform}
                            </Tag>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>
                            {ch.userName || ch.externalId}
                          </div>
                        </div>
                      </div>
                      <Tag color={ch.verifiedByInfluencerMatch ? 'success' : 'default'} style={{ borderRadius: 999, fontWeight: 600, margin: 0 }}>
                        {ch.verifiedByInfluencerMatch ? 'Đã xác minh' : 'Đã liên kết'}
                      </Tag>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                bordered={false}
                className="creator-section-card"
                title={<span className="creator-card-title">Gói dịch vụ Rate Card nổi bật ({rateCards.length} gói)</span>}
                extra={
                  <Button type="link" size="small" onClick={() => handleTabChange('ratecard')} style={{ fontWeight: 700, color: '#7C3AED', padding: 0 }}>
                    Chỉnh sửa bảng giá →
                  </Button>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rateCards.slice(0, 3).map((pkg) => (
                    <div key={pkg.id} className="creator-mini-row">
                      <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
                        <div style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pkg.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>
                          {pkg.platform} • {pkg.format} • Bàn giao {pkg.turnaroundDays} ngày
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: '#6D28D9', fontSize: 14, whiteSpace: 'nowrap' }}>
                        {pkg.priceVnd.toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: BẢNG GIÁ RATE CARD (/creator/rate-card - Đồng bộ Admin Table UI)  */}
      {/* ========================================================================= */}
      {activeTab === 'ratecard' && (
        <div className="creator-admin-rate-page">
          <header className="creator-admin-rate-header">
            <div>
              <h1>Bảng giá dịch vụ (Rate Card)</h1>
              <p>Quản lý các gói sản xuất nội dung, mức giá niêm yết và điều khoản bàn giao cho Thương hiệu.</p>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAddRateCard}
              style={{ background: '#7C3AED', borderColor: '#7C3AED', fontWeight: 600, borderRadius: 8 }}
            >
              Thêm gói báo giá mới
            </Button>
          </header>

          <div className="creator-admin-rate-stats">
            <section>
              <span>Tổng số gói đang niêm yết</span>
              <strong>{rateCards.length} gói</strong>
              <small>Hiển thị công khai cho Brand tham khảo</small>
            </section>
            <section>
              <span>Mức báo giá trung bình</span>
              <strong>{avgRateCardPrice.toLocaleString('vi-VN')} ₫</strong>
              <small>Tính trung bình trên {rateCards.length} gói hiện có</small>
            </section>
            <section>
              <span>Trạng thái nhận Booking</span>
              <strong>Đang mở</strong>
              <small>Sẵn sàng nhận lời mời hợp tác từ Thương hiệu</small>
            </section>
          </div>

          <div className="creator-admin-rate-table">
            <Table<CreatorRateCardPackage>
              rowKey="id"
              dataSource={rateCards}
              pagination={false}
              scroll={{ x: 960 }}
              locale={{ emptyText: 'Chưa có gói báo giá nào. Bấm "Thêm gói báo giá mới" để tạo.' }}
              columns={[
                {
                  title: 'Gói dịch vụ',
                  key: 'name',
                  width: 280,
                  render: (_, pkg) => (
                    <div className="creator-rate-table-name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <strong>{pkg.name}</strong>
                        {pkg.isPopular && <Tag color="purple" style={{ margin: 0, fontSize: 11 }}>Phổ biến</Tag>}
                      </div>
                      <p title={pkg.description}>{pkg.description || 'Chưa có mô tả'}</p>
                    </div>
                  ),
                },
                {
                  title: 'Nền tảng / Định dạng',
                  key: 'platform',
                  width: 170,
                  render: (_, pkg) => (
                    <Tag color="geekblue" style={{ margin: 0, fontWeight: 600 }}>
                      {pkg.platform} · {pkg.format}
                    </Tag>
                  ),
                },
                {
                  title: 'Mức giá niêm yết',
                  key: 'price',
                  width: 170,
                  render: (_, pkg) => (
                    <div className="creator-rate-table-price">
                      <strong>{pkg.priceVnd.toLocaleString('vi-VN')} ₫</strong>
                      <span>Giao bài: {pkg.turnaroundDays} ngày</span>
                    </div>
                  ),
                },
                {
                  title: 'Bản quyền',
                  dataIndex: 'usageRightsDays',
                  key: 'usageRightsDays',
                  width: 100,
                  render: (days: number) => `${days} ngày`,
                },
                {
                  title: 'Hạng mục bàn giao',
                  key: 'deliverables',
                  render: (_, pkg) => (
                    <ul className="creator-rate-deliverables-mini">
                      {pkg.deliverables.map((d, idx) => (
                        <li key={idx}>{d}</li>
                      ))}
                    </ul>
                  ),
                },
                {
                  title: '',
                  key: 'actions',
                  width: 140,
                  align: 'right',
                  render: (_, pkg) => (
                    <Space size={6}>
                      <Button size="small" onClick={() => handleOpenEditRateCard(pkg)}>Chỉnh sửa</Button>
                      <Popconfirm title="Xóa gói báo giá này?" okText="Xóa" cancelText="Hủy" onConfirm={() => handleDeleteRateCard(pkg.id)}>
                        <Button size="small" danger>Xóa</Button>
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: KÊNH LIÊN KẾT & CLAIM TÍCH XANH (/creator/social-accounts)        */}
      {/* ========================================================================= */}
      {activeTab === 'social' && <ChannelVerification canVerify={canVerify} canViewClaims={canViewClaims}
        linked={linked} linkedError={linkedError} reloadLinked={reloadLinked} />}

      {/* ========================================================================= */}
      {/* VIEW 4: ĐỊNH DANH PHÁP LÝ eKYC (/creator/verification)                    */}
      {/* ========================================================================= */}
      {activeTab === 'verification' && <Card className="creator-section-card" title="Định danh pháp lý">
        <Alert type="info" showIcon title="Xác minh CCCD hiện chưa khả dụng"
          description="Để xác nhận quyền quản lý kênh, hãy xác minh qua nền tảng hoặc gửi bằng chứng thủ công tại Kênh liên kết." />
        <Button style={{ marginTop: 16 }} onClick={() => handleTabChange('social')}>Đến Kênh liên kết</Button>
      </Card>}

      {/* ========================================================================= */}
      {/* VIEW 5: QUẢN LÝ HỢP TÁC & BOOKING (/creator/bookings)                     */}
      {/* ========================================================================= */}
      {activeTab === 'bookings' && <CreatorCooperationPage />}

      {/* MODAL 1: ADD / EDIT RATE CARD */}
      <Modal
        centered
        className="rate-card-modal"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15.5, fontWeight: 700, color: '#0F172A' }}>
            <DollarOutlined style={{ color: '#7C3AED' }} />
            <span>{editingRateCard ? 'Chỉnh sửa Gói Báo giá' : 'Thêm Gói Báo giá Mới (Rate Card)'}</span>
          </div>
        }
        open={rateCardModalOpen}
        onCancel={() => setRateCardModalOpen(false)}
        onOk={() => void handleSaveRateCard()}
        okText="Lưu gói dịch vụ"
        cancelText="Hủy"
        width={600}
        destroyOnClose
      >
        <Form form={rateCardForm} layout="vertical" className="rate-card-modal-form">
          <Form.Item name="name" label="Tên gói dịch vụ" rules={[{ required: true, message: 'Vui lòng nhập tên gói!' }]}>
            <Input placeholder="VD: 1x Video TikTok Review Chuyên sâu (60s)" />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="platform" label="Nền tảng" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'TIKTOK', label: 'TikTok' },
                    { value: 'INSTAGRAM', label: 'Instagram' },
                    { value: 'YOUTUBE', label: 'YouTube' },
                    { value: 'MULTI_PLATFORM', label: 'Đa nền tảng (Combo)' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="format" label="Định dạng" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'VIDEO', label: 'Video ngắn (60s)' },
                    { value: 'REEL', label: 'Instagram Reel' },
                    { value: 'STORY', label: 'Story (24h)' },
                    { value: 'REVIEW', label: 'Video Dài / Review' },
                    { value: 'COMBO', label: 'Gói Combo' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="priceVnd" label="Mức giá niêm yết (VNĐ)" rules={[{ required: true, message: 'Nhập giá tiền!' }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(val) => val!.replace(/\$\s?|(,*)/g, '') as any}
                  addonAfter="₫"
                  min={1000000}
                  step={1000000}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name="turnaroundDays" label="Bàn giao (ngày)" rules={[{ required: true }]}>
                <InputNumber min={1} max={30} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name="usageRightsDays" label="Bản quyền (ngày)" rules={[{ required: true }]}>
                <InputNumber min={7} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả quyền lợi">
            <Input.TextArea rows={2} placeholder="Mô tả phong cách làm video, kịch bản, cam kết tương tác..." />
          </Form.Item>

          <Form.Item name="deliverablesText" label="Các hạng mục bàn giao (mỗi dòng một ý)" style={{ marginBottom: 0 }}>
            <Input.TextArea rows={2} placeholder="1 Video TikTok HD (60s)&#10;Gắn link bio 7 ngày&#10;Bàn giao file MP4 sạch" />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL 3: VERIFICATION CCCD */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800 }}>
            <IdcardOutlined style={{ color: '#7C3AED' }} />
            <span>Cập nhật Hồ sơ Căn Cước Công Dân (eKYC)</span>
          </div>
        }
        open={verifyModalOpen}
        onCancel={() => setVerifyModalOpen(false)}
        onOk={() => void handleSubmitVerification()}
        okText="Gửi hồ sơ thẩm định"
        cancelText="Hủy"
        width={520}
        destroyOnClose
      >
        <Form form={verifyForm} layout="vertical" style={{ marginTop: 14 }}>
          <Form.Item name="fullName" label="Họ và tên theo CCCD" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="idNumber" label="Số thẻ CCCD (12 số)" rules={[{ required: true }]}>
                <Input maxLength={12} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dateOfBirth" label="Ngày sinh (YYYY-MM-DD)" rules={[{ required: true }]}>
                <Input placeholder="1997-11-13" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="phone" label="Số điện thoại chính chủ" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email nhận thông báo" rules={[{ required: true, type: 'email' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
