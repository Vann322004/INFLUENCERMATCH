import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Avatar,
  Badge,
  Tabs,
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
  LineChartOutlined,
  SafetyCertificateOutlined,
  ApiOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  LinkOutlined,
  CheckCircleFilled,
  SyncOutlined,
  ThunderboltOutlined,
  UserOutlined,
  IdcardOutlined,
  RiseOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  SendOutlined,
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
import './CreatorPortalPage.css';

import { CreatorCollaborations } from '../../collaboration/CollaborationPage';

export default function CreatorPortalPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Xác định active tab từ URL
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
    creatorPortalService.getVerification()
  );
  const [channels, setChannels] = useState<CreatorSocialChannel[]>(creatorPortalService.getChannels());
  const [rateCards, setRateCards] = useState<CreatorRateCardPackage[]>(creatorPortalService.getRateCards());
  const [metrics, setMetrics] = useState<CreatorReachMetrics>(creatorPortalService.getReachMetrics());
  const [claims, setClaims] = useState<CreatorClaimItem[]>(creatorPortalService.getClaims());

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

  // Tải dữ liệu từ Backend API khi khởi tạo
  useEffect(() => {
    let isMounted = true;
    const syncBackendData = async () => {
      try {
        const [profile, accounts, myClaims] = await Promise.allSettled([
          creatorPortalService.fetchProfileApi(),
          creatorPortalService.fetchLinkedAccountsApi(),
          creatorPortalService.fetchMyClaimsApi(),
        ]);

        if (!isMounted) return;

        if (profile.status === 'fulfilled' && profile.value?.profile) {
          // Đã kết nối Profile backend thành công
        }
        if (accounts.status === 'fulfilled' && Array.isArray(accounts.value) && accounts.value.length > 0) {
          // Đã đồng bộ danh sách kênh backend
        }
        if (myClaims.status === 'fulfilled' && Array.isArray(myClaims.value) && myClaims.value.length > 0) {
          // Đã đồng bộ danh sách claim backend
        }
      } catch {}
    };
    syncBackendData();
    return () => { isMounted = false; };
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

  // 4. Handlers cho Claim Kênh & Mã bảo mật Bio
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

      await creatorPortalService.submitClaimApi(values.creatorId || 'me', {
        evidenceUrls: values.evidenceUrl ? [values.evidenceUrl] : [],
        note: finalNote,
      }).catch(() => null);

      creatorPortalService.submitClaim({
        platform: values.platform,
        handle: formattedHandle,
        channelName: values.channelName,
        followers: values.followers || 50000,
        channelAvatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400',
        evidenceNote: finalNote,
        evidenceUrl: values.evidenceUrl,
      });

      setClaims(creatorPortalService.getClaims());
      message.success('Đã nộp đơn Claim Tích Xanh thành công! Quản trị viên sẽ đối soát mã bảo mật và cấp huy hiệu trong 24h.');
      setClaimModalOpen(false);
    } catch {}
  };

  // 5. Handlers cho Xác minh CCCD
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

  return (
    <div className="creator-portal-container" style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 40 }}>
      {/* 1. Header Profile Banner */}
      <Card
        bordered={false}
        style={{
          borderRadius: 14,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(15,23,42,0.12)',
        }}
        bodyStyle={{ padding: '24px 28px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Avatar
              size={72}
              src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80"
              style={{ border: '3px solid #10B981', flexShrink: 0 }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Châu Bùi (Chau Bui Official)
                </h1>
                <Tooltip title="Hồ sơ đã xác minh CCCD & Kênh chính chủ">
                  <CheckCircleFilled style={{ color: '#10B981', fontSize: 18 }} />
                </Tooltip>
                <Tag color="#059669" style={{ fontWeight: 700, borderRadius: 20, border: 'none', marginLeft: 4 }}>
                  TOP CREATOR
                </Tag>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#94A3B8', fontSize: 13, marginTop: 6, flexWrap: 'wrap' }}>
                <span>Ngành: <strong style={{ color: '#F8FAFC' }}>Thời trang & High Fashion</strong></span>
                <span>•</span>
                <span>TikTok: <strong style={{ color: '#F8FAFC' }}>@chaukikii (2.4M)</strong></span>
                <span>•</span>
                <span>Instagram: <strong style={{ color: '#F8FAFC' }}>@chaubui_ (3.2M)</strong></span>
                <span>•</span>
                <span style={{ color: '#10B981' }}>Độ tin cậy: <strong>98.5%</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <Space size={10} wrap className="creator-action-bar">
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => handleTabChange('ratecard')}
              style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)', borderColor: '#2563EB', fontWeight: 700, borderRadius: 8, height: 38 }}
            >
              Cập nhật Bảng giá
            </Button>
            <Button
              type="primary"
              icon={<SafetyCertificateOutlined />}
              onClick={handleOpenClaimModal}
              style={{ background: '#059669', borderColor: '#059669', color: '#FFFFFF', borderRadius: 8, fontWeight: 700, height: 38 }}
            >
              Nộp đơn Claim Tích Xanh
            </Button>
          </Space>
        </div>
      </Card>

      {/* 2. Main Navigation Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        type="card"
        style={{ marginBottom: 20 }}
        items={[
          {
            key: 'reach',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <LineChartOutlined />
                <span>Tổng quan</span>
              </span>
            ),
          },
          {
            key: 'ratecard',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <DollarOutlined />
                <span>Bảng giá Rate Card</span>
                <Badge count={rateCards.length} style={{ backgroundColor: '#2563EB' }} />
              </span>
            ),
          },
          {
            key: 'social',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <ApiOutlined />
                <span>Kênh liên kết & Claim Tích Xanh</span>
                <Badge count={channels.filter((c) => c.connected).length} style={{ backgroundColor: '#059669' }} />
              </span>
            ),
          },
          {
            key: 'bookings',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <CalendarOutlined />
                <span>Hợp tác</span>
              </span>
            ),
          },
        ]}
      />

      {/* ========================================================================= */}
      {/* TAB 1: THEO DÕI REACH & KHÁN GIẢ                                          */}
      {/* ========================================================================= */}
      {activeTab === 'reach' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top Stat Metrics */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Tổng lượt Reach (30 ngày)</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {(metrics.totalReach30d / 1000000).toFixed(2)}M
                </div>
                <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RiseOutlined /> +{metrics.reachGrowthMoM}% so với tháng trước
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Lượt hiển thị (Impressions)</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {(metrics.totalImpressions / 1000000).toFixed(2)}M
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>
                  Đa kênh: TikTok + Instagram + YT
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Tổng lượt xem Video</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#059669', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {(metrics.totalVideoViews / 1000000).toFixed(2)}M
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>
                  TB. {metrics.avgViewsPerPost.toLocaleString()} lượt xem/video
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Tỷ lệ tương tác (ER trung bình)</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#6366F1', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {metrics.avgEngagementRate}%
                </div>
                <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginTop: 6 }}>
                  Vượt 85% creator cùng ngành Thời trang
                </div>
              </Card>
            </Col>
          </Row>

          {/* Demographic & Monthly Trend */}
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={14}>
              <Card
                title={<span style={{ fontWeight: 800, fontSize: 15 }}>Tăng trưởng Lượt Reach & Lượt xem 6 tháng qua</span>}
                bordered={false}
                style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {metrics.monthlyReachTrend.map((item, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>Tháng {item.month}</span>
                        <span style={{ color: '#64748B' }}>
                          Reach: <strong>{(item.reach / 1000000).toFixed(2)}M</strong> • Views: <strong>{(item.views / 1000000).toFixed(2)}M</strong>
                        </span>
                      </div>
                      <Progress
                        percent={Math.round((item.reach / 9000000) * 100)}
                        strokeColor="linear-gradient(90deg, #10B981 0%, #059669 100%)"
                        showInfo={false}
                        size="small"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card
                title={<span style={{ fontWeight: 800, fontSize: 15 }}>Nhân khẩu học Người theo dõi (Audience)</span>}
                bordered={false}
                style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
              >
                {/* Gender Split */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                    Giới tính người xem:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: metrics.audienceDemographics.femalePct, background: '#EC4899', height: 18, borderRadius: '4px 0 0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                      Nữ {metrics.audienceDemographics.femalePct}%
                    </div>
                    <div style={{ flex: metrics.audienceDemographics.malePct, background: '#3B82F6', height: 18, borderRadius: '0 4px 4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                      Nam {metrics.audienceDemographics.malePct}%
                    </div>
                  </div>
                </div>

                {/* Age brackets */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                    Độ tuổi chủ đạo:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {metrics.audienceDemographics.ageGroups.map((g, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: '#475569', width: 60 }}>{g.age}</span>
                        <div style={{ flex: 1, margin: '0 10px' }}>
                          <Progress percent={g.pct} size="small" strokeColor="#6366F1" showInfo={false} />
                        </div>
                        <span style={{ fontWeight: 700, width: 35, textAlign: 'right' }}>{g.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Cities */}
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                    Khu vực địa lý hàng đầu:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {metrics.audienceDemographics.topCities.map((c, idx) => (
                      <Tag key={idx} color="blue" style={{ borderRadius: 6, padding: '2px 8px' }}>
                        {c.city}: <strong>{c.pct}%</strong>
                      </Tag>
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: XÁC MINH HỒ SƠ & CLAIM                                             */}
      {/* ========================================================================= */}
      {activeTab === 'verification' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Identity Verification Status Card */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IdcardOutlined style={{ color: '#10B981', fontSize: 18 }} />
                  <span style={{ fontWeight: 800, fontSize: 15 }}>Định danh Pháp lý & Căn Cước Công Dân (eKYC)</span>
                </div>
                {verification.status === 'VERIFIED' ? (
                  <Tag color="success" icon={<CheckCircleFilled />}>ĐÃ XÁC MINH PHÁP LÝ</Tag>
                ) : (
                  <Tag color="warning" icon={<ClockCircleOutlined />}>CHỜ XÉT DUYỆT</Tag>
                )}
              </div>
            }
            bordered={false}
            style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
            extra={<Button onClick={handleOpenVerifyModal} size="small">Cập nhật hồ sơ CCCD</Button>}
          >
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
              <Descriptions.Item label="Họ và tên">{verification.fullName}</Descriptions.Item>
              <Descriptions.Item label="Số CCCD/CMND">{verification.idNumber}</Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">{verification.dateOfBirth}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại liên hệ">{verification.phone}</Descriptions.Item>
              <Descriptions.Item label="Email chính chủ">{verification.email}</Descriptions.Item>
              <Descriptions.Item label="Nơi cấp">{verification.issuePlace}</Descriptions.Item>
              <Descriptions.Item label="Ảnh CCCD mặt trước">
                <Tag color="green">Đã tải lên hợp lệ</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ảnh CCCD mặt sau">
                <Tag color="green">Đã tải lên hợp lệ</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ảnh chân dung Selfie">
                <Tag color="green">Khuôn mặt khớp 97.4%</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Creator Claim Management */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SafetyCertificateOutlined style={{ color: '#2563EB', fontSize: 18 }} />
                  <span style={{ fontWeight: 800, fontSize: 15 }}>Trạng thái Claim Quyền Sở Hữu Kênh Mạng Xã Hội</span>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenClaimModal} style={{ background: '#2563EB' }}>
                  Gửi yêu cầu Claim kênh mới
                </Button>
              </div>
            }
            bordered={false}
            style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Avatar size={46} src={claim.channelAvatar} style={{ border: '2px solid #E2E8F0' }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: 14.5, color: '#0F172A' }}>{claim.channelName}</span>
                        <Tag color={claim.platform === 'TikTok' ? 'default' : claim.platform === 'Instagram' ? 'magenta' : 'red'}>
                          {claim.platform}
                        </Tag>
                        {claim.status === 'APPROVED' && (
                          <Tag color="success" icon={<CheckCircleFilled />}>Đã duyệt</Tag>
                        )}
                        {claim.status === 'PENDING' && (
                          <Tag color="warning" icon={<ClockCircleOutlined />}>Đang duyệt</Tag>
                        )}
                        {claim.status === 'REJECTED' && (
                          <Tag color="error" icon={<CloseCircleOutlined />}>Từ chối</Tag>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        Handle: <strong>{claim.handle}</strong> • {(claim.followers / 1000).toLocaleString()}K Followers
                      </div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 4, background: '#F8FAFC', padding: '4px 8px', borderRadius: 4 }}>
                        Bằng chứng: {claim.evidenceNote}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
                      Ngày gửi: {new Date(claim.submittedAt).toLocaleDateString('vi-VN')}
                    </div>
                    {claim.adminNote && (
                      <div style={{ fontSize: 11.5, color: claim.status === 'APPROVED' ? '#059669' : '#DC2626', marginTop: 4 }}>
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
      {/* TAB: KẾT NỐI TÀI KHOẢN MẠNG XÃ HỘI & CLAIM KÊNH                          */}
      {/* ========================================================================= */}
      {activeTab === 'social' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Kênh liên kết & Claim Tích Xanh</div>
              <div style={{ fontSize: 13, color: '#64748B' }}>
                Quản lý các kênh mạng xã hội chính chủ, kết nối OAuth hoặc nộp hồ sơ nhận kênh (Claim KOC)
              </div>
            </div>
            <Button
              type="primary"
              icon={<SafetyCertificateOutlined />}
              onClick={handleOpenClaimModal}
              style={{
                borderRadius: 8,
                background: '#2563EB',
                borderColor: '#2563EB',
                fontWeight: 700,
                height: 38,
              }}
            >
              Nộp đơn Claim Tích Xanh
            </Button>
          </div>

          <Alert
            message="Kết nối Mạng xã hội để tự động đồng bộ hóa Chỉ số Reach & Lượt xem"
            description="InfluencerMatch sử dụng giao thức chính thức của TikTok Creator API, Instagram Graph API và YouTube Data API để tự động cập nhật số lượng người theo dõi và tương tác hàng ngày của bạn."
            type="info"
            showIcon
            style={{ borderRadius: 10, border: '1px solid #BFDBFE' }}
          />

          <Row gutter={[16, 16]}>
            {channels.map((ch) => (
              <Col xs={24} sm={12} key={ch.id}>
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 12,
                    border: ch.connected ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                    background: ch.connected ? '#F0FDF4' : '#FFFFFF',
                  }}
                  bodyStyle={{ padding: '20px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar size={48} src={ch.avatarUrl} style={{ border: '2px solid #E2E8F0' }} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>{ch.displayName}</span>
                          {ch.connected && <CheckCircleFilled style={{ color: '#10B981' }} />}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{ch.handle}</div>
                      </div>
                    </div>

                    <Tag color={ch.platform === 'tiktok' ? 'default' : ch.platform === 'instagram' ? 'magenta' : ch.platform === 'youtube' ? 'red' : 'blue'} style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                      {ch.platform}
                    </Tag>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16 }}>
                    <Row gutter={8}>
                      <Col span={12}>
                        <div style={{ fontSize: 11, color: '#64748B' }}>Người theo dõi</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                          {(ch.followers / 1000).toLocaleString()}K
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ fontSize: 11, color: '#64748B' }}>Tỷ lệ tương tác</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#10B981' }}>
                          {(ch.engagementRate * 100).toFixed(1)}%
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11.5, color: ch.connected ? '#059669' : '#94A3B8' }}>
                      {ch.connected ? `Đã đồng bộ • ${ch.syncStatus}` : 'Chưa kết nối OAuth'}
                    </div>

                    <Button
                      type={ch.connected ? 'default' : 'primary'}
                      danger={ch.connected}
                      loading={syncingChannel === ch.id}
                      onClick={() => handleToggleChannel(ch)}
                      style={{ borderRadius: 6, fontWeight: 600 }}
                    >
                      {ch.connected ? 'Ngắt kết nối' : 'Kết nối kênh'}
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BẢNG GIÁ RATE CARD                                                */}
      {/* ========================================================================= */}
      {activeTab === 'ratecard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Bảng giá Dịch vụ & Hợp tác (Rate Card)
              </h2>
              <p style={{ color: '#64748B', fontSize: 13, margin: '2px 0 0' }}>
                Giá niêm yết sẽ được hiển thị minh bạch cho các Nhãn hàng (Brand) khi họ tìm kiếm hồ sơ của bạn trên Creator Catalog.
              </p>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddRateCard} style={{ background: '#2563EB', borderColor: '#2563EB', fontWeight: 700, borderRadius: 8, height: 38 }}>
              Thêm gói báo giá mới
            </Button>
          </div>

          <Row gutter={[16, 16]}>
            {rateCards.map((pkg) => (
              <Col xs={24} md={12} lg={8} key={pkg.id}>
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 12,
                    border: pkg.isPopular ? '2px solid #10B981' : '1px solid #E2E8F0',
                    boxShadow: pkg.isPopular ? '0 4px 16px rgba(16,185,129,0.1)' : 'none',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  bodyStyle={{ padding: '22px', flex: 1, display: 'flex', flexDirection: 'column' }}
                >
                  {pkg.isPopular && (
                    <div style={{ position: 'absolute', top: -11, right: 18, background: '#10B981', color: '#fff', fontSize: 10.5, fontWeight: 800, padding: '2px 10px', borderRadius: 20, textTransform: 'uppercase' }}>
                      Gói phổ biến nhất
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Tag color="blue" style={{ fontWeight: 700, borderRadius: 4 }}>
                      {pkg.platform} • {pkg.format}
                    </Tag>
                    <Space size={4}>
                      <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenEditRateCard(pkg)} />
                      <Popconfirm title="Xóa gói này?" onConfirm={() => handleDeleteRateCard(pkg.id)}>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A', lineHeight: 1.35, marginBottom: 8 }}>
                    {pkg.name}
                  </div>

                  <div style={{ fontSize: 24, fontWeight: 900, color: '#059669', fontVariantNumeric: 'tabular-nums', marginBottom: 12 }}>
                    {pkg.priceVnd.toLocaleString('vi-VN')} ₫
                  </div>

                  <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.45, marginBottom: 16 }}>
                    {pkg.description}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', marginBottom: 6 }}>
                      Hạng mục bàn giao:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#475569' }}>
                      {pkg.deliverables.map((d, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  <Divider style={{ margin: '14px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748B' }}>
                    <span>Thời hạn bàn giao: <strong>{pkg.turnaroundDays} ngày</strong></span>
                    <span>Bản quyền: <strong>{pkg.usageRightsDays} ngày</strong></span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TRẠNG THÁI BOOKING & HỢP TÁC                                       */}
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
        onOk={handleSaveRateCard}
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
            <SafetyCertificateOutlined style={{ color: '#2563EB' }} />
            <span>Nộp Đơn Claim Kênh & Nhận Tích Xanh KOC</span>
          </div>
        }
        open={claimModalOpen}
        onCancel={() => setClaimModalOpen(false)}
        onOk={handleSubmitClaim}
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
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              Chọn phương thức xác thực quyền sở hữu:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Option 1: Mã bảo mật trong Bio */}
              <div
                className={`claim-method-option ${claimMethod === 'BIO_CODE' ? 'selected' : ''}`}
                onClick={() => setClaimMethod('BIO_CODE')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ThunderboltOutlined style={{ color: '#2563EB', fontSize: 16 }} />
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>
                      Mã bảo mật trong Tiểu sử (Bio Code)
                    </span>
                  </div>
                  <Tag color="blue" style={{ fontWeight: 700, borderRadius: 12 }}>Tự động • Khuyên dùng</Tag>
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  Chèn mã xác thực vào Bio kênh trong 24h. Robot InfluencerMatch sẽ quét tự động và duyệt tích xanh.
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
                        style={{ background: '#2563EB', borderRadius: 6, fontSize: 11, fontWeight: 700 }}
                      >
                        Sao chép mã
                      </Button>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#475569' }}>
                      👉 Dán mã <strong>{generatedBioCode}</strong> vào phần Bio TikTok/IG của bạn, sau đó bấm <em>"Gửi đơn Claim Tích Xanh"</em> bên dưới.
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2: OAuth Trực tiếp */}
              <div
                className={`claim-method-option ${claimMethod === 'OAUTH' ? 'selected' : ''}`}
                onClick={() => setClaimMethod('OAUTH')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ApiOutlined style={{ color: '#059669', fontSize: 16 }} />
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>
                      Ủy quyền trực tiếp qua OAuth (Fast-track)
                    </span>
                  </div>
                  <Tag color="green" style={{ fontWeight: 700, borderRadius: 12 }}>30 giây</Tag>
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  Đăng nhập tài khoản mạng xã hội chính thức để cấp quyền phân tích số liệu tự động.
                </div>

                {claimMethod === 'OAUTH' && (
                  <div style={{ marginTop: 10 }}>
                    <Button
                      type="default"
                      icon={<LinkOutlined />}
                      block
                      style={{ borderRadius: 8, height: 36, fontWeight: 600, borderColor: '#059669', color: '#059669' }}
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

              {/* Option 3: Minh chứng hình ảnh / Quản trị viên */}
              <div
                className={`claim-method-option ${claimMethod === 'SCREENSHOT' ? 'selected' : ''}`}
                onClick={() => setClaimMethod('SCREENSHOT')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SafetyCertificateOutlined style={{ color: '#D97706', fontSize: 16 }} />
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>
                    Minh chứng ảnh chụp màn hình quyền Quản trị (Admin Evidence)
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
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

          <Form.Item
            name="evidenceNote"
            label="Ghi chú minh chứng bổ sung (tùy chọn)"
          >
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
            <IdcardOutlined style={{ color: '#10B981' }} />
            <span>Cập nhật Hồ sơ Căn Cước Công Dân (eKYC)</span>
          </div>
        }
        open={verifyModalOpen}
        onCancel={() => setVerifyModalOpen(false)}
        onOk={handleSubmitVerification}
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
