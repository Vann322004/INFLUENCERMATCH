import React, { useCallback, useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Avatar,
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
} from 'antd';
import {
  LineChartOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleFilled,
  ThunderboltOutlined,
  IdcardOutlined,
  RiseOutlined,
  CheckOutlined,
  StarFilled,
  GlobalOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  creatorPortalService,
  CreatorIdentityVerification,
  CreatorRateCardPackage,
  CreatorReachMetrics,
} from '../../../services/api/creatorPortalService';
import { authService } from '../../../services/api/authService';
import { getErrorMessage } from '../../../services/apiClient';
import { channelVerificationService, type LinkedChannel } from '../../../services/api/channelVerificationService';
import ChannelVerification from './ChannelVerification';
import './CreatorPortalPage.css';

import { CreatorCollaborations } from '../../collaboration/CollaborationPage';

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
  const [linkedVersion, setLinkedVersion] = useState(0);
  const [rateCards, setRateCards] = useState<CreatorRateCardPackage[]>(creatorPortalService.getRateCards());
  const [metrics] = useState<CreatorReachMetrics>(creatorPortalService.getReachMetrics());
  const user = authService.getCurrentUser();
  const activeCreator = user?.role === 'CREATOR' && user.status === 'ACTIVE';
  const canVerify = activeCreator && (user.permissions?.includes('CLAIM_CREATOR_PROFILE') ?? false);
  const canViewClaims = activeCreator && (user.permissions?.includes('VIEW_OWN_CREATOR_CLAIM') ?? false);
  const reloadLinked = useCallback(() => setLinkedVersion(version => version + 1), []);
  const channels = linked ?? [];
  const isVerified = channels.some(channel => channel.verifiedByInfluencerMatch);

  // Modal Rate Card
  const [rateCardModalOpen, setRateCardModalOpen] = useState(false);
  const [editingRateCard, setEditingRateCard] = useState<CreatorRateCardPackage | null>(null);
  const [rateCardForm] = Form.useForm();

  // Modal Update Verification CCCD
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyForm] = Form.useForm();

  useEffect(() => {
    if (!canVerify) return;
    const controller = new AbortController();
    setLinkedError('');
    setLinked(null);
    channelVerificationService.listLinked(controller.signal)
      .then(items => { if (!controller.signal.aborted) setLinked(items); })
      .catch(error => {
        if (!controller.signal.aborted) setLinkedError(getErrorMessage(error, 'Không tải được kênh đã liên kết.'));
      });
    return () => controller.abort();
  }, [canVerify, linkedVersion]);

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
      creatorPortalService.updateProfileApi({ rateCards: updated }).catch(() => null);
      message.success(editingRateCard ? 'Đã cập nhật gói báo giá thành công!' : 'Đã thêm gói báo giá mới vào Rate Card!');
      setRateCardModalOpen(false);
    } catch {}
  };

  const handleDeleteRateCard = (id: string) => {
    const updated = creatorPortalService.deleteRateCard(id);
    setRateCards(updated);
    creatorPortalService.updateProfileApi({ rateCards: updated }).catch(() => null);
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
          {/* 1. Modern Creator Profile Studio Card */}
          <Card bordered={false} className="creator-hero-card">
            <div className="creator-hero-inner">
              <div className="creator-hero-left">
                <div className="creator-avatar-ring-wrap">
                  <Avatar
                    size={76}
                    src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80"
                    className="creator-hero-avatar"
                  />
                  <span
                    className={`creator-status-dot ${isVerified ? 'verified' : 'unverified'}`}
                    title={isVerified ? 'Đã xác minh Tích Xanh' : 'Chưa xác minh Tích Xanh'}
                  />
                </div>

                <div className="creator-hero-info">
                  <div className="creator-hero-name-row">
                    <h1 className="creator-hero-name">Châu Bùi (Chau Bui Official)</h1>
                    {isVerified ? (
                      <Tag color="success" icon={<CheckCircleFilled />} className="creator-badge-pill">
                        Đã cấp Tích Xanh
                      </Tag>
                    ) : (
                      <Tag color="processing" icon={<SafetyCertificateOutlined />} className="creator-badge-pill">
                        Chưa xác minh kênh
                      </Tag>
                    )}
                    <Tag color="blue" className="creator-badge-pill">
                      <StarFilled style={{ fontSize: 11, marginRight: 4 }} />
                      Điểm uy tín AI: 98.5%
                    </Tag>
                  </div>

                  <p className="creator-hero-bio">
                    Nhà sáng tạo nội dung Thời trang, Phong cách sống & Làm đẹp cao cấp • Hồ sơ hiển thị công khai trên Creator Catalog cho Doanh nghiệp.
                  </p>

                  <div className="creator-hero-chips">
                    <span className="creator-meta-chip">
                      <GlobalOutlined /> Thời trang & High Fashion
                    </span>
                    <span className="creator-meta-chip">
                      <strong>Kênh đã nối:</strong> {connectedChannelsCount ?? '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="creator-hero-actions">
                <Button
                  icon={<IdcardOutlined />}
                  onClick={() => handleTabChange('verification')}
                  className="creator-secondary-btn"
                >
                  Hồ sơ eKYC
                </Button>
                <Button
                  icon={<DollarOutlined />}
                  onClick={() => handleTabChange('ratecard')}
                  className="creator-secondary-btn"
                >
                  Bảng giá ({rateCards.length})
                </Button>
                {canVerify && <Button type="primary" icon={<SafetyCertificateOutlined />}
                  onClick={handleOpenClaimModal} className="creator-primary-btn">Gửi bằng chứng thủ công</Button>}
              </div>
            </div>
          </Card>

          {/* 2. 4 Core KPI Bento Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="creator-kpi-card">
                <div className="creator-kpi-top">
                  <span className="creator-kpi-label">Tổng Reach (30 ngày)</span>
                  <div className="creator-kpi-icon-box blue">
                    <EyeOutlined />
                  </div>
                </div>
                <div className="creator-kpi-value">
                  {(metrics.totalReach30d / 1000000).toFixed(2)}M
                </div>
                <div className="creator-kpi-foot positive">
                  <RiseOutlined /> +{metrics.reachGrowthMoM}% so với tháng trước
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="creator-kpi-card">
                <div className="creator-kpi-top">
                  <span className="creator-kpi-label">Lượt hiển thị (Impressions)</span>
                  <div className="creator-kpi-icon-box indigo">
                    <GlobalOutlined />
                  </div>
                </div>
                <div className="creator-kpi-value">
                  {(metrics.totalImpressions / 1000000).toFixed(2)}M
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="creator-kpi-card">
                <div className="creator-kpi-top">
                  <span className="creator-kpi-label">Tổng lượt xem Video</span>
                  <div className="creator-kpi-icon-box sky">
                    <VideoCameraOutlined />
                  </div>
                </div>
                <div className="creator-kpi-value accent">
                  {(metrics.totalVideoViews / 1000000).toFixed(2)}M
                </div>
                <div className="creator-kpi-foot">
                  Trung bình {metrics.avgViewsPerPost.toLocaleString('vi-VN')} views / video
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="creator-kpi-card">
                <div className="creator-kpi-top">
                  <span className="creator-kpi-label">Tỷ lệ tương tác (ER%)</span>
                  <div className="creator-kpi-icon-box emerald">
                    <FireOutlined />
                  </div>
                </div>
                <div className="creator-kpi-value accent">
                  {metrics.avgEngagementRate}%
                </div>
                <div className="creator-kpi-foot positive">
                  Top 15% Nhà sáng tạo ngành Thời trang
                </div>
              </Card>
            </Col>
          </Row>

          {/* 3. Analytics Row: 6-Month Growth + Audience Demographics */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card
                bordered={false}
                className="creator-section-card"
                title={
                  <div className="creator-card-header-inline">
                    <div>
                      <div className="creator-card-title">Biểu đồ Tăng trưởng Reach & Views (6 tháng)</div>
                      <div className="creator-card-subtitle">Số liệu tự động đồng bộ qua OAuth từ các kênh đã liên kết</div>
                    </div>
                    <Tag color="blue" style={{ borderRadius: 999, fontWeight: 600 }}>Cập nhật hôm nay</Tag>
                  </div>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {metrics.monthlyReachTrend.map((item, idx) => {
                    const reachPct = Math.min(100, Math.round((item.reach / 9000000) * 100));
                    const viewsPct = Math.min(100, Math.round((item.views / 15000000) * 100));
                    return (
                      <div key={idx} className="creator-trend-row">
                        <div className="creator-trend-meta">
                          <span className="creator-trend-month">Tháng {item.month}</span>
                          <div className="creator-trend-numbers">
                            <span>
                              Reach: <strong style={{ color: '#0F172A' }}>{(item.reach / 1000000).toFixed(2)}M</strong>
                            </span>
                            <span>
                              Views: <strong style={{ color: '#2563EB' }}>{(item.views / 1000000).toFixed(2)}M</strong>
                            </span>
                          </div>
                        </div>
                        <div className="creator-trend-bars">
                          <div className="creator-bar-track">
                            <div
                              className="creator-bar-fill primary"
                              style={{ width: `${reachPct}%` }}
                            />
                          </div>
                          <div className="creator-bar-track light">
                            <div
                              className="creator-bar-fill secondary"
                              style={{ width: `${viewsPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card
                bordered={false}
                className="creator-section-card"
                title={
                  <div>
                    <div className="creator-card-title">Nhân khẩu học Khán giả (Audience Insights)</div>
                    <div className="creator-card-subtitle">Cơ cấu người xem thực tế giúp Nhãn hàng đánh giá mức độ phù hợp</div>
                  </div>
                }
              >
                {/* Gender Split */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                    <span>Phân bổ giới tính</span>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>
                      Nữ {metrics.audienceDemographics.femalePct}% • Nam {metrics.audienceDemographics.malePct}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden', gap: 3 }}>
                    <div
                      style={{
                        flex: metrics.audienceDemographics.femalePct,
                        background: 'linear-gradient(90deg, #1E40AF 0%, #2563EB 100%)',
                      }}
                    />
                    <div
                      style={{
                        flex: metrics.audienceDemographics.malePct,
                        background: '#93C5FD',
                      }}
                    />
                  </div>
                </div>

                {/* Age brackets */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                    Độ tuổi chủ đạo
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {metrics.audienceDemographics.ageGroups.map((g, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
                        <span style={{ color: '#475569', fontWeight: 600, width: 54 }}>{g.age}</span>
                        <div style={{ flex: 1 }}>
                          <Progress percent={g.pct} size="small" strokeColor="#2563EB" showInfo={false} />
                        </div>
                        <span style={{ fontWeight: 700, color: '#0F172A', width: 38, textAlign: 'right' }}>
                          {g.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Cities */}
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                    Tỉnh / Thành phố tập trung người xem
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {metrics.audienceDemographics.topCities.map((c, idx) => (
                      <div key={idx} className="creator-city-pill">
                        <span>{c.city}</span>
                        <strong>{c.pct}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* 4. Quick Workspace Overview: Linked Channels & Active Rate Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                bordered={false}
                className="creator-section-card"
                title={<span className="creator-card-title">Kênh mạng xã hội đang liên kết ({connectedChannelsCount ?? '—'})</span>}
                extra={
                  <Button type="link" size="small" onClick={() => handleTabChange('social')} style={{ fontWeight: 700, padding: 0 }}>
                    Quản lý kênh →
                  </Button>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {channels.slice(0, 3).map((ch) => (
                    <div key={ch.id} className="creator-mini-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar size={40} src={ch.avatarUrl ?? undefined} />
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
                  <Button type="link" size="small" onClick={() => handleTabChange('ratecard')} style={{ fontWeight: 700, padding: 0 }}>
                    Chỉnh sửa bảng giá →
                  </Button>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rateCards.slice(0, 3).map((pkg) => (
                    <div key={pkg.id} className="creator-mini-row">
                      <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pkg.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          {pkg.platform} • {pkg.format} • Bàn giao {pkg.turnaroundDays} ngày
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: '#2563EB', fontSize: 14, whiteSpace: 'nowrap' }}>
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
      {/* VIEW 2: BẢNG GIÁ RATE CARD (/creator/rate-card)                           */}
      {/* ========================================================================= */}
      {activeTab === 'ratecard' && (
        <div className="creator-studio-stack">
          <div className="creator-page-header-row">
            <div>
              <h1 className="creator-page-title">Bảng giá Dịch vụ & Hợp tác (Rate Card)</h1>
              <p className="creator-page-subtitle">
                Thiết lập các gói sản xuất nội dung minh bạch để Thương hiệu (Brand) tham khảo và gửi lời mời Booking nhanh hơn
              </p>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAddRateCard}
              className="creator-primary-btn"
            >
              Thêm gói báo giá mới
            </Button>
          </div>

          {/* Summary Strip */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="creator-kpi-card compact">
                <div className="creator-kpi-label">Tổng số gói đang niêm yết</div>
                <div className="creator-kpi-value">{rateCards.length} gói dịch vụ</div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="creator-kpi-card compact">
                <div className="creator-kpi-label">Mức báo giá trung bình</div>
                <div className="creator-kpi-value accent">{avgRateCardPrice.toLocaleString('vi-VN')} ₫</div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="creator-kpi-card compact">
                <div className="creator-kpi-label">Trạng thái trên Creator Catalog</div>
                <div className="creator-kpi-value" style={{ fontSize: 18, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircleFilled /> Đang hiển thị công khai
                </div>
              </Card>
            </Col>
          </Row>

          {/* Rate Cards Grid */}
          <Row gutter={[16, 16]} className="rate-card-grid">
            {rateCards.map((pkg) => (
              <Col xs={24} md={12} lg={8} key={pkg.id}>
                <Card
                  bordered={false}
                  className={`rate-card-pkg-card ${pkg.isPopular ? 'popular' : ''}`}
                  bodyStyle={{ padding: '22px', flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  {pkg.isPopular && (
                    <div className="rate-card-popular-badge">
                      Gói phổ biến nhất
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Tag color="blue" style={{ fontWeight: 700, borderRadius: 6, padding: '2px 10px', margin: 0 }}>
                      {pkg.platform} • {pkg.format}
                    </Tag>
                    <Space size={4}>
                      <Tooltip title="Chỉnh sửa gói">
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenEditRateCard(pkg)} />
                      </Tooltip>
                      <Popconfirm title="Xóa gói báo giá này?" okText="Xóa" cancelText="Hủy" onConfirm={() => handleDeleteRateCard(pkg.id)}>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A', lineHeight: 1.35, marginBottom: 8 }}>
                    {pkg.name}
                  </div>

                  <div style={{ fontSize: 26, fontWeight: 900, color: '#2563EB', fontVariantNumeric: 'tabular-nums', marginBottom: 12 }}>
                    {pkg.priceVnd.toLocaleString('vi-VN')} <span style={{ fontSize: 14, fontWeight: 700, color: '#64748B' }}>VNĐ</span>
                  </div>

                  <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 16 }}>
                    {pkg.description}
                  </div>

                  <div style={{ flex: 1, background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', border: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.02em' }}>
                      Hạng mục bàn giao
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {pkg.deliverables.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#334155' }}>
                          <CheckOutlined style={{ color: '#2563EB', fontSize: 12, marginTop: 3, flexShrink: 0 }} />
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Divider style={{ margin: '14px 0 12px' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B' }}>
                    <span>Thời gian giao: <strong style={{ color: '#0F172A' }}>{pkg.turnaroundDays} ngày</strong></span>
                    <span>Bản quyền hình ảnh: <strong style={{ color: '#0F172A' }}>{pkg.usageRightsDays} ngày</strong></span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
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
      {activeTab === 'verification' && (
        <div className="creator-studio-stack">
          <div className="creator-page-header-row">
            <div>
              <h1 className="creator-page-title">Định danh Pháp lý & Hồ sơ Căn Cước Công Dân (eKYC)</h1>
              <p className="creator-page-subtitle">
                Xác thực danh tính pháp lý để ký kết hợp đồng điện tử và nhận thanh toán trực tiếp từ Nhãn hàng
              </p>
            </div>
            <Space>
              <Button icon={<EditOutlined />} onClick={handleOpenVerifyModal} className="creator-secondary-btn">
                Cập nhật hồ sơ CCCD
              </Button>
              {canVerify && <Button type="primary" icon={<SafetyCertificateOutlined />}
                onClick={handleOpenClaimModal} className="creator-primary-btn">Gửi bằng chứng thủ công</Button>}
            </Space>
          </div>

          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IdcardOutlined style={{ color: '#2563EB', fontSize: 18 }} />
                  <span className="creator-card-title">Thông tin Căn Cước Công Dân (eKYC)</span>
                </div>
                {verification.status === 'VERIFIED' ? (
                  <Tag color="success" icon={<CheckCircleFilled />} style={{ fontWeight: 700 }}>ĐÃ XÁC MINH PHÁP LÝ</Tag>
                ) : (
                  <Tag color="warning" icon={<ClockCircleOutlined />} style={{ fontWeight: 700 }}>CHỜ XÉT DUYỆT</Tag>
                )}
              </div>
            }
            bordered={false}
            className="creator-section-card"
          >
            <Descriptions bordered size="middle" column={{ xs: 1, sm: 2, md: 3 }}>
              <Descriptions.Item label="Họ và tên">{verification.fullName}</Descriptions.Item>
              <Descriptions.Item label="Số CCCD/CMND">{verification.idNumber}</Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">{verification.dateOfBirth}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{verification.phone}</Descriptions.Item>
              <Descriptions.Item label="Email chính chủ">{verification.email}</Descriptions.Item>
              <Descriptions.Item label="Nơi cấp">{verification.issuePlace}</Descriptions.Item>
              <Descriptions.Item label="Ảnh CCCD mặt trước">
                <Tag color="success">Đã tải lên hợp lệ</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ảnh CCCD mặt sau">
                <Tag color="success">Đã tải lên hợp lệ</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Xác thực khuôn mặt">
                <Tag color="blue">Khớp sinh trắc học 97.4%</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: QUẢN LÝ HỢP TÁC & BOOKING (/creator/bookings)                     */}
      {/* ========================================================================= */}
      {activeTab === 'bookings' && <CreatorCollaborations />}

      {/* MODAL 1: ADD / EDIT RATE CARD */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800 }}>
            <DollarOutlined style={{ color: '#2563EB' }} />
            <span>{editingRateCard ? 'Chỉnh sửa Gói Báo giá' : 'Thêm Gói Báo giá Mới (Rate Card)'}</span>
          </div>
        }
        open={rateCardModalOpen}
        onCancel={() => setRateCardModalOpen(false)}
        onOk={() => void handleSaveRateCard()}
        okText="Lưu gói dịch vụ"
        cancelText="Hủy"
        width={540}
        destroyOnClose
      >
        <Form form={rateCardForm} layout="vertical" style={{ marginTop: 14 }}>
          <Form.Item name="name" label="Tên gói dịch vụ" rules={[{ required: true, message: 'Vui lòng nhập tên gói!' }]}>
            <Input placeholder="VD: 1x Video TikTok Review Chuyên sâu (60s)" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
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
            <Col span={12}>
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

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="turnaroundDays" label="Thời gian bàn giao (ngày)" rules={[{ required: true }]}>
                <InputNumber min={1} max={30} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="usageRightsDays" label="Bản quyền sử dụng (ngày)" rules={[{ required: true }]}>
                <InputNumber min={7} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả quyền lợi">
            <Input.TextArea rows={2} placeholder="Mô tả phong cách làm video, kịch bản, cam kết tương tác..." />
          </Form.Item>

          <Form.Item name="deliverablesText" label="Các hạng mục bàn giao (mỗi dòng một ý)">
            <Input.TextArea rows={3} placeholder="1 Video TikTok HD (60s)&#10;Gắn link bio 7 ngày&#10;Bàn giao file MP4 sạch" />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL 3: VERIFICATION CCCD */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800 }}>
            <IdcardOutlined style={{ color: '#2563EB' }} />
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
