import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Avatar,
  Table,
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
import type { TableColumnsType } from 'antd';
import {
  LineChartOutlined,
  SafetyCertificateOutlined,
  ApiOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
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
  CreatorBookingItem,
  CreatorClaimItem,
} from '../../../services/api/creatorPortalService';

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
  const [bookings, setBookings] = useState<CreatorBookingItem[]>(creatorPortalService.getBookings());
  const [claims, setClaims] = useState<CreatorClaimItem[]>(creatorPortalService.getClaims());

  // Modal Rate Card
  const [rateCardModalOpen, setRateCardModalOpen] = useState(false);
  const [editingRateCard, setEditingRateCard] = useState<CreatorRateCardPackage | null>(null);
  const [rateCardForm] = Form.useForm();

  // Modal Claim Kênh
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimForm] = Form.useForm();

  // Modal Update Verification CCCD
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyForm] = Form.useForm();

  // Syncing status
  const [syncingChannel, setSyncingChannel] = useState<string | null>(null);

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
      message.success(editingRateCard ? 'Đã cập nhật gói báo giá thành công!' : 'Đã thêm gói báo giá mới vào Rate Card!');
      setRateCardModalOpen(false);
    } catch {}
  };

  const handleDeleteRateCard = (id: string) => {
    const updated = creatorPortalService.deleteRateCard(id);
    setRateCards(updated);
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

  // 3. Handlers cho Booking
  const handleRespondBooking = (bookingId: string, status: 'ACCEPTED' | 'DECLINED') => {
    const updated = creatorPortalService.respondBooking(bookingId, status);
    setBookings(updated);
    if (status === 'ACCEPTED') {
      message.success('Đã chấp nhận lời mời hợp tác! Nhãn hàng đã được thông báo để bắt đầu gửi sản phẩm.');
    } else {
      message.info('Đã từ chối lời mời hợp tác.');
    }
  };

  // 4. Handlers cho Claim Kênh
  const handleOpenClaimModal = () => {
    claimForm.resetFields();
    claimForm.setFieldsValue({ platform: 'TikTok' });
    setClaimModalOpen(true);
  };

  const handleSubmitClaim = async () => {
    try {
      const values = await claimForm.validateFields();
      const newClaim = creatorPortalService.submitClaim({
        platform: values.platform,
        handle: values.handle.startsWith('@') ? values.handle : '@' + values.handle,
        channelName: values.channelName,
        followers: values.followers || 50000,
        channelAvatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400',
        evidenceNote: values.evidenceNote,
      });
      setClaims(creatorPortalService.getClaims());
      message.success('Đã gửi yêu cầu Claim quyền sở hữu kênh! Quản trị viên sẽ kiểm định và phản hồi trong 24h.');
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

  // Columns cho Bảng Booking
  const columnsBookings: TableColumnsType<CreatorBookingItem> = [
    {
      title: 'Chiến dịch & Nhãn hàng',
      key: 'campaign',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar src={r.brandLogo} size={42} style={{ border: '1px solid #E2E8F0', flexShrink: 0 }}>
            {r.brandName.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>{r.campaignName}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              Nhãn hàng: <strong>{r.brandName}</strong>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Nền tảng & Hạng mục',
      key: 'deliverables',
      width: 220,
      render: (_, r) => (
        <div>
          <Tag color={r.platform === 'TIKTOK' ? 'default' : r.platform === 'INSTAGRAM' ? 'magenta' : 'red'}>
            {r.platform}
          </Tag>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{r.deliverableType}</div>
        </div>
      ),
    },
    {
      title: 'Ngân sách đề xuất',
      key: 'budget',
      width: 170,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 800, fontSize: 14.5, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
            {r.proposedBudget.toLocaleString('vi-VN')} ₫
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>Hạn chót: {new Date(r.deadline).toLocaleDateString('vi-VN')}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 150,
      render: (_, r) => {
        if (r.status === 'PENDING') return <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ phản hồi</Tag>;
        if (r.status === 'ACCEPTED') return <Tag color="processing" icon={<CheckCircleOutlined />}>Đã nhận job</Tag>;
        if (r.status === 'COMPLETED') return <Tag color="success" icon={<CheckCircleFilled />}>Hoàn thành</Tag>;
        return <Tag color="default">Đã từ chối</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 190,
      align: 'right',
      render: (_, r) => {
        if (r.status === 'PENDING') {
          return (
            <Space size={8}>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleRespondBooking(r.id, 'ACCEPTED')}
                style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 600 }}
              >
                Nhận job
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleRespondBooking(r.id, 'DECLINED')}
              >
                Từ chối
              </Button>
            </Space>
          );
        }
        return (
          <span style={{ fontSize: 12, color: '#94A3B8' }}>
            {r.status === 'ACCEPTED' ? 'Đang triển khai video' : r.status === 'COMPLETED' ? 'Đã tất toán' : 'Đã đóng'}
          </span>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 40 }}>
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
          <Space size={10} wrap>
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => handleTabChange('ratecard')}
              style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 700, borderRadius: 8 }}
            >
              Cập nhật Bảng giá
            </Button>
            <Button
              icon={<SendOutlined />}
              onClick={handleOpenClaimModal}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)', borderRadius: 8 }}
            >
              Claim Kênh Mới
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
                <span>1. Theo dõi Reach & Khán giả</span>
              </span>
            ),
          },
          {
            key: 'verification',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <SafetyCertificateOutlined />
                <span>2. Xác minh Hồ sơ & Claim</span>
                {verification.status === 'VERIFIED' ? (
                  <Badge status="success" />
                ) : (
                  <Badge count="Cần duyệt" style={{ backgroundColor: '#F59E0B' }} />
                )}
              </span>
            ),
          },
          {
            key: 'social',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <ApiOutlined />
                <span>3. Kênh Mạng Xã Hội</span>
                <Badge count={channels.filter((c) => c.connected).length} style={{ backgroundColor: '#059669' }} />
              </span>
            ),
          },
          {
            key: 'ratecard',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <DollarOutlined />
                <span>4. Bảng giá Rate Card</span>
                <Badge count={rateCards.length} style={{ backgroundColor: '#6366F1' }} />
              </span>
            ),
          },
          {
            key: 'bookings',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <CalendarOutlined />
                <span>5. Trạng thái Booking & Job</span>
                <Badge count={bookings.filter((b) => b.status === 'PENDING').length} overflowCount={9} style={{ backgroundColor: '#EF4444' }} />
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
      {/* TAB 3: KẾT NỐI TÀI KHOẢN MẠNG XÃ HỘI                                     */}
      {/* ========================================================================= */}
      {activeTab === 'social' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddRateCard} style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 700 }}>
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
      {activeTab === 'bookings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Yêu cầu Hợp tác & Booking từ Nhãn hàng
              </h2>
              <p style={{ color: '#64748B', fontSize: 13, margin: '2px 0 0' }}>
                Quản lý lời mời chiến dịch, ngân sách đề xuất và phản hồi trực tiếp cho Brand.
              </p>
            </div>
            <Tag color="red" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, fontWeight: 700 }}>
              {bookings.filter((b) => b.status === 'PENDING').length} Booking chờ bạn phản hồi
            </Tag>
          </div>

          <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: 0 }}>
            <Table
              dataSource={bookings}
              columns={columnsBookings}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT RATE CARD */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800 }}>
            <DollarOutlined style={{ color: '#10B981' }} />
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

      {/* MODAL 2: CLAIM CHANNEL */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800 }}>
            <SafetyCertificateOutlined style={{ color: '#2563EB' }} />
            <span>Gửi Yêu cầu Claim Quyền Sở Hữu Kênh KOC</span>
          </div>
        }
        open={claimModalOpen}
        onCancel={() => setClaimModalOpen(false)}
        onOk={handleSubmitClaim}
        okText="Gửi yêu cầu Claim"
        cancelText="Hủy"
        width={500}
        destroyOnClose
      >
        <Form form={claimForm} layout="vertical" style={{ marginTop: 14 }}>
          <Form.Item name="platform" label="Nền tảng mạng xã hội" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'TikTok', label: 'TikTok' },
                { value: 'Instagram', label: 'Instagram' },
                { value: 'YouTube', label: 'YouTube' },
              ]}
            />
          </Form.Item>

          <Form.Item name="handle" label="Handle / Username của kênh" rules={[{ required: true, message: 'Nhập @username!' }]}>
            <Input placeholder="VD: @chaukikii" />
          </Form.Item>

          <Form.Item name="channelName" label="Tên hiển thị kênh" rules={[{ required: true }]}>
            <Input placeholder="VD: Châu Bùi Official" />
          </Form.Item>

          <Form.Item name="followers" label="Số lượng Follower hiện tại">
            <InputNumber style={{ width: '100%' }} min={1000} step={1000} />
          </Form.Item>

          <Form.Item
            name="evidenceNote"
            label="Bằng chứng chứng minh quyền sở hữu"
            rules={[{ required: true, message: 'Nhập bằng chứng!' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="VD: Đính kèm ảnh chụp màn hình trang quản trị TikTok Studio hoặc mã xác minh gửi về email chính chủ của kênh..."
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
