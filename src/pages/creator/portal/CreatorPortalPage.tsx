import React, { useState, useEffect } from 'react';
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
  Alert,
  Tooltip,
} from 'antd';
import {
  SafetyCertificateOutlined,
  ApiOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  LinkOutlined,
  CheckCircleFilled,
  ThunderboltOutlined,
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
  creatorPortalService,
  CreatorIdentityVerification,
  CreatorSocialChannel,
  CreatorRateCardPackage,
  CreatorReachMetrics,
  CreatorClaimItem,
} from '../../../services/api/creatorPortalService';
import { authService } from '../../../services/api/authService';
import { creatorService } from '../../../services/api/creatorService';
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
  const [channels, setChannels] = useState<CreatorSocialChannel[]>(creatorPortalService.getChannels());
  const [rateCards, setRateCards] = useState<CreatorRateCardPackage[]>(creatorPortalService.getRateCards());
  const [metrics] = useState<CreatorReachMetrics>(creatorPortalService.getReachMetrics());
  const [claims, setClaims] = useState<CreatorClaimItem[]>(creatorPortalService.getClaims());
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState(false);
  const [profileCreatorId, setProfileCreatorId] = useState<string>('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const isVerified = claims.some((c) => c.status === 'APPROVED');

  // Modal Rate Card
  const [rateCardModalOpen, setRateCardModalOpen] = useState(false);
  const [editingRateCard, setEditingRateCard] = useState<CreatorRateCardPackage | null>(null);
  const [rateCardForm] = Form.useForm();

  // Modal Claim Kênh & Phương thức xác thực
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimForm] = Form.useForm();
  const [claimMethod, setClaimMethod] = useState<'BIO_CODE' | 'OAUTH' | 'SCREENSHOT'>('BIO_CODE');
  const [generatedBioCode, setGeneratedBioCode] = useState<string>('IM-CHAU-849201');

  // Modal Update Verification CCCD
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyForm] = Form.useForm();

  // Syncing status
  const [syncingChannel, setSyncingChannel] = useState<string | null>(null);

  const reloadMyClaims = async () => {
    setClaimsLoading(true);
    const items = await creatorPortalService.fetchMyClaimsApi();
    if (items === null) {
      setClaimsError(true);
    } else {
      setClaimsError(false);
      setClaims(items);
    }
    setClaimsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    const syncBackendData = async () => {
      try {
        const [profile, accounts] = await Promise.allSettled([
          creatorPortalService.fetchProfileApi(),
          creatorPortalService.fetchLinkedAccountsApi(),
        ]);

        if (!isMounted) return;

        if (profile.status === 'fulfilled' && profile.value) {
          const pv: any = profile.value;
          const id = pv?.profile?.id ?? pv?.profile?.creatorId ?? pv?.creatorId ?? pv?.id;
          if (id) setProfileCreatorId(String(id));
        }
        if (accounts.status === 'fulfilled' && Array.isArray(accounts.value) && accounts.value.length > 0) {
          // Đã đồng bộ danh sách kênh backend
        }
      } catch {}
      if (isMounted) await reloadMyClaims();
    };
    void syncBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

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

  // 2. Handlers cho Kênh Mạng Xã Hội
  const handleToggleChannel = async (channel: CreatorSocialChannel) => {
    setSyncingChannel(channel.id);
    await new Promise((r) => setTimeout(r, 600));
    const nextState = !channel.connected;
    const updated = creatorPortalService.toggleChannelConnection(channel.id, nextState);
    setChannels(updated);
    setSyncingChannel(null);
    if (nextState) {
      message.success(`Đã kết nối tài khoản ${channel.platform.toUpperCase()} (${channel.handle}) và đồng bộ số liệu thành công!`);
    } else {
      message.info(`Đã ngắt kết nối tài khoản ${channel.handle}.`);
    }
  };

  // 3. Handlers cho Claim Kênh & Mã bảo mật Bio
  const handleOpenClaimModal = () => {
    claimForm.resetFields();
    const defaultHandle = '@chaukikii';
    claimForm.setFieldsValue({
      platform: 'TikTok',
      handle: defaultHandle,
      channelName: 'Châu Bùi Official',
      followers: 2450000,
    });
    setGeneratedBioCode(creatorPortalService.generateBioVerificationCode(defaultHandle));
    setClaimMethod('BIO_CODE');
    setClaimModalOpen(true);
  };

  const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && val.length > 1) {
      setGeneratedBioCode(creatorPortalService.generateBioVerificationCode(val));
    }
  };

  const handleSubmitClaim = async () => {
    try {
      const values = await claimForm.validateFields();
      const formattedHandle = values.handle.startsWith('@') ? values.handle : '@' + values.handle;
      const methodLabel =
        claimMethod === 'BIO_CODE'
          ? `Mã bảo mật trong Bio (${generatedBioCode})`
          : claimMethod === 'OAUTH'
          ? 'Xác thực nhanh qua OAuth'
          : 'Minh chứng ảnh chụp / Quản trị viên';

      const finalNote = `[Xác thực: ${methodLabel}] ${values.evidenceNote || ''}`;
      const currentUser = authService.getCurrentUser();

      setSubmittingClaim(true);
      let backendClaimId: string | undefined;
      let targetCreatorId = values.creatorId || profileCreatorId;

      try {
        if (!targetCreatorId) {
          const allCreators = await creatorService.getCreators().catch(() => []);
          const cleanH = formattedHandle.replace('@', '').toLowerCase();
          const matched = allCreators.find(
            (c: any) =>
              (c.username && String(c.username).replace('@', '').toLowerCase() === cleanH) ||
              (c.displayName && String(c.displayName).toLowerCase() === String(values.channelName || '').toLowerCase()),
          );
          targetCreatorId = matched?.id || allCreators[0]?.id || '';
        }

        if (targetCreatorId) {
          const res = await creatorPortalService.submitClaimApi(targetCreatorId, {
            evidenceUrls: values.evidenceUrl ? [values.evidenceUrl] : [],
            note: finalNote,
          });
          if (res?.id) backendClaimId = String(res.id);
        }
      } catch (err) {
        console.warn('[CreatorPortalPage.handleSubmitClaim] Backend submit fallback to synced storage:', err);
      } finally {
        setSubmittingClaim(false);
      }

      creatorPortalService.submitClaim({
        id: backendClaimId,
        creatorId: targetCreatorId || undefined,
        platform: values.platform,
        handle: formattedHandle,
        channelName: values.channelName,
        followers: values.followers || 2450000,
        channelAvatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400',
        claimantName: currentUser?.fullName || values.channelName || 'Châu Bùi (Nhà sáng tạo)',
        claimantEmail: currentUser?.email || 'chaubui.official@influencermatch.vn',
        evidenceType: methodLabel,
        evidenceNote: finalNote,
        evidenceUrl: values.evidenceUrl,
      });

      await reloadMyClaims();
      message.success('Đã gửi đơn Claim Tích Xanh! Đơn đã chuyển vào hàng đợi Kiểm duyệt nhận kênh.');
      setClaimModalOpen(false);
    } catch {}
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

  const connectedChannelsCount = channels.filter((c) => c.connected).length;
  const totalFollowersCount = channels.reduce((sum, c) => sum + (c.followers || 0), 0);
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
                <Avatar
                  size={78}
                  src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80"
                  className="creator-hero-avatar"
                />
                <span
                  className={`creator-status-dot ${isVerified ? 'verified' : 'unverified'}`}
                  title={isVerified ? 'Đã xác minh Tích Xanh' : 'Chưa xác minh Tích Xanh'}
                />
              </div>

              <div className="creator-hero-info">
                <div className="creator-hero-status-row">
                  <span className="creator-live-pill">
                    <span className="creator-live-dot" />
                    {isVerified ? 'Đã cấp Tích Xanh' : 'Đang hoạt động'}
                  </span>
                  <span className="creator-lavender-pill">
                    <StarFilled style={{ fontSize: 11, color: '#6D28D9', marginRight: 5 }} />
                    Điểm uy tín AI: 98.5%
                  </span>
                </div>

                <h1 className="creator-editorial-title">
                  Châu Bùi <span className="creator-editorial-italic">Creator Studio</span>
                </h1>

                <p className="creator-hero-bio">
                  Nhà sáng tạo nội dung Thời trang, Phong cách sống & Làm đẹp cao cấp • Hồ sơ hiển thị công khai trên Creator Catalog cho Doanh nghiệp.
                </p>

                <div className="creator-hero-chips">
                  <span className="creator-meta-chip">
                    <GlobalOutlined /> Thời trang & High Fashion
                  </span>
                  <span className="creator-meta-chip">
                    <strong>TikTok:</strong> @chaukikii (2.45M)
                  </span>
                  <span className="creator-meta-chip">
                    <strong>Instagram:</strong> @chaubui_ (3.2M)
                  </span>
                  <span className="creator-meta-chip">
                    <strong>Kênh đã nối:</strong> {connectedChannelsCount}/{channels.length} nền tảng
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

          {/* 2. 4 Core KPI Bento Cards (Left-Icon Layout matching Admin Mockup 1:1) */}
          <div className="creator-bento-grid-4">
            <section className="creator-bento-card">
              <div className="creator-bento-row">
                <div className="creator-bento-icon purple">
                  <EyeOutlined />
                </div>
                <div className="creator-bento-body">
                  <span className="creator-bento-label">Tổng Reach (30 ngày)</span>
                  <p className="creator-bento-value">
                    {(metrics.totalReach30d / 1000000).toFixed(2)}M
                  </p>
                  <div>
                    <span className="creator-growth-pill">
                      ↗ +{metrics.reachGrowthMoM}% tháng này
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
                  <span className="creator-bento-label">Lượt hiển thị (Impressions)</span>
                  <p className="creator-bento-value">
                    {(metrics.totalImpressions / 1000000).toFixed(2)}M
                  </p>
                  <div>
                    <span className="creator-bento-badge">
                      {connectedChannelsCount} kênh đang đồng bộ
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
                  <span className="creator-bento-label">Tổng lượt xem Video</span>
                  <p className="creator-bento-value">
                    {(metrics.totalVideoViews / 1000000).toFixed(2)}M
                  </p>
                  <div>
                    <span className="creator-bento-badge">
                      TB {metrics.avgViewsPerPost.toLocaleString('vi-VN')} views/video
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="creator-bento-card">
              <div className="creator-bento-row">
                <div className="creator-bento-icon purple">
                  <FireOutlined />
                </div>
                <div className="creator-bento-body">
                  <span className="creator-bento-label">Tỷ lệ tương tác (ER%)</span>
                  <p className="creator-bento-value">
                    {metrics.avgEngagementRate}%
                  </p>
                  <div>
                    <span className="creator-growth-pill">
                      Top 15% Nhà sáng tạo
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 3. Analytics Row: 6-Month Growth + Audience Demographics */}
          <Row gutter={[18, 18]}>
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
                    <Tag color="purple" style={{ borderRadius: 999, fontWeight: 700, margin: 0 }}>
                      Cập nhật hôm nay
                    </Tag>
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
                              Reach: <strong style={{ color: '#1E1B4B' }}>{(item.reach / 1000000).toFixed(2)}M</strong>
                            </span>
                            <span>
                              Views: <strong style={{ color: '#7C3AED' }}>{(item.views / 1000000).toFixed(2)}M</strong>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: '#1E1B4B', marginBottom: 6 }}>
                    <span>Phân bổ giới tính</span>
                    <span style={{ color: '#6B7280', fontWeight: 600 }}>
                      Nữ {metrics.audienceDemographics.femalePct}% • Nam {metrics.audienceDemographics.malePct}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden', gap: 3 }}>
                    <div
                      style={{
                        flex: metrics.audienceDemographics.femalePct,
                        background: 'linear-gradient(90deg, #6D28D9 0%, #8B5CF6 100%)',
                      }}
                    />
                    <div
                      style={{
                        flex: metrics.audienceDemographics.malePct,
                        background: '#D8B4FE',
                      }}
                    />
                  </div>
                </div>

                {/* Age brackets */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E1B4B', marginBottom: 8 }}>
                    Độ tuổi chủ đạo
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {metrics.audienceDemographics.ageGroups.map((g, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
                        <span style={{ color: '#4B5563', fontWeight: 600, width: 54 }}>{g.age}</span>
                        <div style={{ flex: 1 }}>
                          <Progress
                            percent={g.pct}
                            size="small"
                            strokeColor="#7C3AED"
                            railColor="#F3E8FF"
                            showInfo={false}
                          />
                        </div>
                        <span style={{ fontWeight: 700, color: '#1E1B4B', width: 38, textAlign: 'right' }}>
                          {g.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Cities */}
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E1B4B', marginBottom: 8 }}>
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
          <Row gutter={[18, 18]}>
            <Col xs={24} lg={12}>
              <Card
                bordered={false}
                className="creator-section-card"
                title={<span className="creator-card-title">Kênh mạng xã hội đang liên kết ({connectedChannelsCount}/{channels.length})</span>}
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
                        <Avatar size={40} src={ch.avatarUrl} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 13.5 }}>{ch.displayName}</span>
                            <Tag color="purple" style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
                              {ch.platform}
                            </Tag>
                          </div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>
                            {ch.handle} • <strong>{(ch.followers / 1000).toLocaleString('vi-VN')}K</strong> followers
                          </div>
                        </div>
                      </div>
                      <Tag color={ch.connected ? 'success' : 'default'} style={{ borderRadius: 999, fontWeight: 600, margin: 0 }}>
                        {ch.connected ? 'Đã đồng bộ' : 'Chưa kết nối'}
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
          <div className="creator-bento-grid-3">
            <section className="creator-bento-card">
              <div className="creator-bento-row">
                <div className="creator-bento-icon purple">
                  <DollarOutlined />
                </div>
                <div className="creator-bento-body">
                  <span className="creator-bento-label">Tổng số gói đang niêm yết</span>
                  <p className="creator-bento-value">{rateCards.length} gói</p>
                  <div>
                    <span className="creator-bento-badge">Trên Creator Catalog</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="creator-bento-card">
              <div className="creator-bento-row">
                <div className="creator-bento-icon amber">
                  <StarFilled />
                </div>
                <div className="creator-bento-body">
                  <span className="creator-bento-label">Mức báo giá trung bình</span>
                  <p className="creator-bento-value" style={{ fontSize: 24 }}>
                    {avgRateCardPrice.toLocaleString('vi-VN')} ₫
                  </p>
                  <div>
                    <span className="creator-bento-badge">Giá niêm yết công khai</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="creator-bento-card">
              <div className="creator-bento-row">
                <div className="creator-bento-icon purple">
                  <CheckCircleFilled />
                </div>
                <div className="creator-bento-body">
                  <span className="creator-bento-label">Trạng thái hiển thị</span>
                  <p className="creator-bento-value" style={{ fontSize: 22 }}>
                    Công khai
                  </p>
                  <div>
                    <span className="creator-growth-pill">● Sẵn sàng nhận Booking</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Rate Cards Grid */}
          <Row gutter={[18, 18]} className="rate-card-grid">
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
                    <Tag color="purple" style={{ fontWeight: 700, borderRadius: 6, padding: '2px 10px', margin: 0 }}>
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

                  <div style={{ fontWeight: 800, fontSize: 16, color: '#1E1B4B', lineHeight: 1.35, marginBottom: 8 }}>
                    {pkg.name}
                  </div>

                  <div style={{ fontSize: 26, fontWeight: 900, color: '#6D28D9', fontVariantNumeric: 'tabular-nums', marginBottom: 12 }}>
                    {pkg.priceVnd.toLocaleString('vi-VN')} <span style={{ fontSize: 14, fontWeight: 700, color: '#6B7280' }}>VNĐ</span>
                  </div>

                  <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, marginBottom: 16 }}>
                    {pkg.description}
                  </div>

                  <div style={{ flex: 1, background: '#FAF7FF', borderRadius: 12, padding: '12px 14px', border: '1px solid #EDE9FE' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#4C1D95', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.02em' }}>
                      Hạng mục bàn giao
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {pkg.deliverables.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#374151' }}>
                          <CheckOutlined style={{ color: '#7C3AED', fontSize: 12, marginTop: 3, flexShrink: 0 }} />
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Divider style={{ margin: '14px 0 12px', borderColor: '#F3E8FF' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280' }}>
                    <span>Thời gian giao: <strong style={{ color: '#1E1B4B' }}>{pkg.turnaroundDays} ngày</strong></span>
                    <span>Bản quyền hình ảnh: <strong style={{ color: '#1E1B4B' }}>{pkg.usageRightsDays} ngày</strong></span>
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
      {activeTab === 'social' && (
        <div className="creator-studio-stack">
          <div className="creator-page-header-row">
            <div>
              <h1 className="creator-page-title">Kênh liên kết & Xác minh Tích Xanh</h1>
              <p className="creator-page-subtitle">
                Kết nối các tài khoản mạng xã hội chính chủ để tự động đồng bộ Reach/Views và nộp hồ sơ nhận huy hiệu Tích Xanh Nhà sáng tạo
              </p>
            </div>
            <Space wrap>
              <Button
                icon={<IdcardOutlined />}
                onClick={handleOpenVerifyModal}
                className="creator-secondary-btn"
              >
                Cập nhật CCCD (eKYC)
              </Button>
              <Button
                type="primary"
                icon={<SafetyCertificateOutlined />}
                onClick={handleOpenClaimModal}
                className="creator-primary-btn"
              >
                Nộp đơn Claim Tích Xanh
              </Button>
            </Space>
          </div>

          {/* Summary KPI Strip */}
          <div className="creator-bento-grid-3">
            <section className="creator-bento-card">
              <div className="creator-bento-row">
                <div className="creator-bento-icon purple">
                  <ApiOutlined />
                </div>
                <div className="creator-bento-body">
                  <span className="creator-bento-label">Kênh mạng xã hội đã kết nối</span>
                  <p className="creator-bento-value">{connectedChannelsCount} / {channels.length}</p>
                  <div>
                    <span className="creator-bento-badge">Đồng bộ OAuth tự động</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="creator-bento-card">
              <div className="creator-bento-row">
                <div className="creator-bento-icon amber">
                  <GlobalOutlined />
                </div>
                <div className="creator-bento-body">
                  <span className="creator-bento-label">Tổng người theo dõi đa kênh</span>
                  <p className="creator-bento-value">{(totalFollowersCount / 1000000).toFixed(2)}M</p>
                  <div>
                    <span className="creator-bento-badge">Followers chính chủ</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="creator-bento-card">
              <div className="creator-bento-row">
                <div className="creator-bento-icon purple">
                  <SafetyCertificateOutlined />
                </div>
                <div className="creator-bento-body">
                  <span className="creator-bento-label">Đơn xác minh quyền sở hữu</span>
                  <p className="creator-bento-value">{claims.length} đơn</p>
                  <div>
                    <span className="creator-growth-pill">
                      {claims.filter((c) => c.status === 'PENDING').length} đơn đang chờ duyệt
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Connected Channels Grid */}
          <Row gutter={[18, 18]}>
            {channels.map((ch) => (
              <Col xs={24} sm={12} key={ch.id}>
                <Card
                  bordered={false}
                  className="creator-channel-card"
                  style={{
                    border: ch.connected ? '1.5px solid #C4B5FD' : '1px solid #E9D5FF',
                  }}
                  bodyStyle={{ padding: '22px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar size={48} src={ch.avatarUrl} style={{ border: '2px solid #E9D5FF' }} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: '#1E1B4B' }}>{ch.displayName}</span>
                          {ch.connected && <CheckCircleFilled style={{ color: '#7C3AED' }} />}
                        </div>
                        <div style={{ fontSize: 12.5, color: '#6B7280' }}>{ch.handle}</div>
                      </div>
                    </div>

                    <Tag
                      color={ch.connected ? 'purple' : 'default'}
                      style={{ textTransform: 'uppercase', fontWeight: 700, borderRadius: 6, margin: 0 }}
                    >
                      {ch.platform}
                    </Tag>
                  </div>

                  <div style={{ background: '#FAF7FF', padding: '12px 14px', borderRadius: 12, border: '1px solid #EDE9FE', marginBottom: 16 }}>
                    <Row gutter={12}>
                      <Col span={12}>
                        <div style={{ fontSize: 11.5, color: '#6B7280' }}>Người theo dõi</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: '#1E1B4B', marginTop: 2 }}>
                          {(ch.followers / 1000).toLocaleString('vi-VN')}K
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ fontSize: 11.5, color: '#6B7280' }}>Tỷ lệ tương tác (ER%)</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: '#6D28D9', marginTop: 2 }}>
                          {(ch.engagementRate * 100).toFixed(1)}%
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 12, color: ch.connected ? '#15803D' : '#9CA3AF', fontWeight: 600 }}>
                      {ch.connected ? `● Đã đồng bộ • ${ch.syncStatus}` : '○ Chưa kết nối OAuth'}
                    </div>

                    <Button
                      type={ch.connected ? 'default' : 'primary'}
                      danger={ch.connected}
                      loading={syncingChannel === ch.id}
                      onClick={() => handleToggleChannel(ch)}
                      style={{ borderRadius: 10, fontWeight: 600 }}
                    >
                      {ch.connected ? 'Ngắt kết nối' : 'Kết nối kênh'}
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Claim History */}
          <Card
            bordered={false}
            className="creator-section-card"
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SafetyCertificateOutlined style={{ color: '#7C3AED', fontSize: 18 }} />
                  <span className="creator-card-title">Lịch sử & Trạng thái Đơn Claim Tích Xanh ({claims.length})</span>
                </div>
                <Button size="small" onClick={() => void reloadMyClaims()} loading={claimsLoading}>
                  Làm mới trạng thái
                </Button>
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {claimsError && (
                <Alert
                  type="error"
                  showIcon
                  message="Không tải được danh sách đơn claim từ máy chủ"
                  description="Vui lòng kiểm tra đăng nhập/kết nối rồi thử lại."
                  action={<Button size="small" onClick={() => void reloadMyClaims()}>Thử lại</Button>}
                />
              )}
              {!claimsError && !claimsLoading && claims.length === 0 && (
                <Alert
                  type="info"
                  showIcon
                  message="Bạn chưa gửi đơn Claim nào"
                  description="Bấm 'Nộp đơn Claim Tích Xanh' ở góc phải phía trên để xác minh quyền sở hữu kênh của bạn."
                />
              )}
              {claims.map((claim) => (
                <div key={claim.id} className="creator-claim-item-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Avatar size={46} src={claim.channelAvatar} style={{ border: '2px solid #E9D5FF', flexShrink: 0 }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: 14.5, color: '#1E1B4B' }}>{claim.channelName}</span>
                        <Tag color="purple" style={{ margin: 0, fontWeight: 600 }}>{claim.platform}</Tag>
                        {claim.status === 'APPROVED' && (
                          <Tag color="success" icon={<CheckCircleFilled />} style={{ margin: 0, fontWeight: 700 }}>Đã duyệt</Tag>
                        )}
                        {claim.status === 'PENDING' && (
                          <Tag color="warning" icon={<ClockCircleOutlined />} style={{ margin: 0, fontWeight: 700 }}>Đang chờ duyệt</Tag>
                        )}
                        {claim.status === 'REJECTED' && (
                          <Tag color="error" icon={<CloseCircleOutlined />} style={{ margin: 0, fontWeight: 700 }}>Từ chối</Tag>
                        )}
                        {claim.status === 'REVOKED' && (
                          <Tag color="default" icon={<CloseCircleOutlined />} style={{ margin: 0 }}>Đã thu hồi</Tag>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>
                        Handle: <strong>{claim.handle}</strong> • {(claim.followers / 1000).toLocaleString('vi-VN')}K Followers
                      </div>
                      <div style={{ fontSize: 12, color: '#4B5563', marginTop: 4, background: '#FFFFFF', padding: '4px 10px', borderRadius: 6, border: '1px solid #EDE9FE' }}>
                        Minh chứng: {claim.evidenceNote}
                      </div>
                    </div>
                  </div>

                  <div className="creator-claim-item-right" style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11.5, color: '#6B7280', fontWeight: 600 }}>
                      Ngày gửi: {new Date(claim.submittedAt).toLocaleDateString('vi-VN')}
                    </div>
                    {claim.adminNote && (
                      <div style={{ fontSize: 11.5, color: claim.status === 'APPROVED' ? '#15803D' : '#DC2626', marginTop: 4 }}>
                        {claim.adminNote}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

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
              <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={handleOpenClaimModal} className="creator-primary-btn">
                Nộp đơn Claim Kênh
              </Button>
            </Space>
          </div>

          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IdcardOutlined style={{ color: '#7C3AED', fontSize: 18 }} />
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
                <Tag color="purple">Khớp sinh trắc học 97.4%</Tag>
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
            <DollarOutlined style={{ color: '#7C3AED' }} />
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

      {/* MODAL 2: CLAIM CHANNEL & CẤP TÍCH XANH CHÍNH CHỦ */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800 }}>
            <SafetyCertificateOutlined style={{ color: '#7C3AED' }} />
            <span>Nộp Đơn Claim Kênh & Nhận Tích Xanh Nhà sáng tạo</span>
          </div>
        }
        open={claimModalOpen}
        onCancel={() => setClaimModalOpen(false)}
        onOk={() => void handleSubmitClaim()}
        okButtonProps={{ loading: submittingClaim }}
        okText="Gửi đơn Claim Tích Xanh"
        cancelText="Hủy"
        width={560}
        destroyOnClose
        className="claim-verification-modal"
      >
        <Form form={claimForm} layout="vertical" style={{ marginTop: 14 }}>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="platform" label="Nền tảng mạng xã hội" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'TikTok', label: 'TikTok' },
                    { value: 'Instagram', label: 'Instagram' },
                    { value: 'YouTube', label: 'YouTube' },
                    { value: 'Facebook', label: 'Facebook Page' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="handle" label="Handle / Username của kênh" rules={[{ required: true, message: 'Nhập @username!' }]}>
                <Input placeholder="VD: @chaukikii" onChange={handleHandleChange} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} sm={14}>
              <Form.Item name="channelName" label="Tên hiển thị kênh" rules={[{ required: true, message: 'Nhập tên kênh!' }]}>
                <Input placeholder="VD: Châu Bùi Official" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={10}>
              <Form.Item name="followers" label="Followers hiện tại">
                <InputNumber style={{ width: '100%' }} min={1000} step={1000} />
              </Form.Item>
            </Col>
          </Row>

          {/* Phương thức Xác thực Claim */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', marginBottom: 8 }}>
              Chọn phương thức xác thực quyền sở hữu:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                className={`claim-method-option ${claimMethod === 'BIO_CODE' ? 'selected' : ''}`}
                onClick={() => setClaimMethod('BIO_CODE')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ThunderboltOutlined style={{ color: '#7C3AED', fontSize: 16 }} />
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: '#1E1B4B' }}>
                      Mã bảo mật trong Tiểu sử (Bio Code)
                    </span>
                  </div>
                  <Tag color="purple" style={{ fontWeight: 700, borderRadius: 12 }}>Tự động • Khuyên dùng</Tag>
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                  Chèn mã xác thực vào Bio kênh trong 24h. Hệ thống sẽ quét tự động và đối chiếu khi duyệt tích xanh.
                </div>

                {claimMethod === 'BIO_CODE' && (
                  <div style={{ marginTop: 10 }}>
                    <div className="bio-code-box">
                      <span>{generatedBioCode}</span>
                      <Button
                        size="small"
                        type="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(generatedBioCode);
                          message.success('Đã sao chép mã bảo mật: ' + generatedBioCode);
                        }}
                        style={{ background: '#7C3AED', borderRadius: 6, fontSize: 11, fontWeight: 700 }}
                      >
                        Sao chép mã
                      </Button>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#4B5563' }}>
                      Dán mã <strong>{generatedBioCode}</strong> vào phần Bio TikTok/IG của bạn, sau đó bấm <em>"Gửi đơn Claim Tích Xanh"</em> bên dưới.
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`claim-method-option ${claimMethod === 'OAUTH' ? 'selected' : ''}`}
                onClick={() => setClaimMethod('OAUTH')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ApiOutlined style={{ color: '#7C3AED', fontSize: 16 }} />
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: '#1E1B4B' }}>
                      Ủy quyền trực tiếp qua OAuth (Fast-track)
                    </span>
                  </div>
                  <Tag color="green" style={{ fontWeight: 700, borderRadius: 12 }}>30 giây</Tag>
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                  Đăng nhập tài khoản mạng xã hội chính thức để cấp quyền phân tích số liệu tự động.
                </div>

                {claimMethod === 'OAUTH' && (
                  <div style={{ marginTop: 10 }}>
                    <Button
                      type="default"
                      icon={<LinkOutlined />}
                      block
                      style={{ borderRadius: 8, height: 36, fontWeight: 600, borderColor: '#7C3AED', color: '#7C3AED' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        message.info('Đang mở cổng ủy quyền OAuth...');
                      }}
                    >
                      Bắt đầu ủy quyền tài khoản mạng xã hội
                    </Button>
                  </div>
                )}
              </div>

              <div
                className={`claim-method-option ${claimMethod === 'SCREENSHOT' ? 'selected' : ''}`}
                onClick={() => setClaimMethod('SCREENSHOT')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SafetyCertificateOutlined style={{ color: '#D97706', fontSize: 16 }} />
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: '#1E1B4B' }}>
                    Minh chứng ảnh chụp màn hình quyền Quản trị (Admin Evidence)
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                  Nộp ảnh chụp màn hình trang Creator Center / Meta Business Suite chứng minh quyền quản trị.
                </div>

                {claimMethod === 'SCREENSHOT' && (
                  <div style={{ marginTop: 10 }}>
                    <Form.Item name="evidenceUrl" label="Link hình ảnh bằng chứng (URL ảnh chụp)" style={{ marginBottom: 8 }}>
                      <Input placeholder="https://drive.google.com/... hoặc link ảnh màn hình quản trị" />
                    </Form.Item>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Form.Item name="evidenceNote" label="Ghi chú minh chứng bổ sung (tùy chọn)">
            <Input.TextArea
              rows={2}
              placeholder="Ghi chú thêm về thông tin liên hệ chính chủ hoặc hợp đồng độc quyền (nếu có)..."
            />
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
