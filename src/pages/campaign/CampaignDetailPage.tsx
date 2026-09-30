import React, { useState } from 'react';
import {
  Breadcrumb,
  Typography,
  Card,
  Row,
  Col,
  Tag,
  Button,
  Tabs,
  Progress,
  Avatar,
  Table,
  Space,
  Modal,
  Input,
  message,
  Timeline,
  Divider,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  ThunderboltFilled,
  CalendarOutlined,
  CheckCircleFilled,
  PauseCircleOutlined,
  StopOutlined,
  PlayCircleFilled,
  CheckOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningFilled,
  ApartmentOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { CAMPAIGNS_DATA } from '../../data/mockData';
import type { Campaign } from '../../data/mockData';
import './CampaignDetailPage.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

type CampaignStatusType = 'running' | 'draft' | 'paused' | 'completed' | 'cancelled';

interface CampaignCreatorRow {
  id: string;
  name: string;
  username: string;
  avatar: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  followers: string;
  fee: string;
  stageText: string;
  stageColor: string;
  deliverableStatus: string;
  deliverableColor: string;
}

const MOCK_PARTICIPATING_CREATORS: CampaignCreatorRow[] = [
  {
    id: 'p1',
    name: 'Linh Nguyễn',
    username: 'linhnguyen.official',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    platform: 'tiktok',
    followers: '1.2M',
    fee: '5,000,000 ₫',
    stageText: 'Đã ký HĐ',
    stageColor: 'success',
    deliverableStatus: 'Đã nộp video demo',
    deliverableColor: 'processing',
  },
  {
    id: 'p2',
    name: 'Thu Trang',
    username: 'thutrang_beauty',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    platform: 'youtube',
    followers: '1.5M',
    fee: '8,400,000 ₫',
    stageText: 'Đã ký HĐ',
    stageColor: 'success',
    deliverableStatus: 'Đợi kịch bản',
    deliverableColor: 'warning',
  },
  {
    id: 'p3',
    name: 'Mai Trần',
    username: 'maitran.glow',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    platform: 'instagram',
    followers: '650K',
    fee: '4,500,000 ₫',
    stageText: 'Đang thương lượng',
    stageColor: 'purple',
    deliverableStatus: 'Chưa gửi brief',
    deliverableColor: 'default',
  },
  {
    id: 'p4',
    name: 'Kim Chi',
    username: 'kimchi.makeup',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80',
    platform: 'tiktok',
    followers: '1.1M',
    fee: '6,700,000 ₫',
    stageText: 'Đã ký HĐ',
    stageColor: 'success',
    deliverableStatus: 'Đã duyệt video',
    deliverableColor: 'success',
  },
];

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Find target campaign or fallback to first
  const campaignData: Campaign =
    CAMPAIGNS_DATA.find((c) => c.id === id) || CAMPAIGNS_DATA[0];

  const [currentStatus, setCurrentStatus] = useState<CampaignStatusType>(
    (campaignData.status as CampaignStatusType) || 'running'
  );
  const [activeTab, setActiveTab] = useState('overview');

  // Cancel Modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Handle Lifecycle actions
  const handleActivate = () => {
    Modal.confirm({
      title: 'Kích hoạt chiến dịch ngay?',
      content: 'Chiến dịch sẽ chuyển sang trạng thái Đang chạy. Hệ thống sẽ bắt đầu gửi thông báo và kích hoạt theo dõi tiến độ.',
      okText: 'Kích hoạt ngay',
      cancelText: 'Hủy',
      okButtonProps: { style: { background: '#10B981', borderColor: '#10B981' } },
      onOk: () => {
        setCurrentStatus('running');
        message.success('Chiến dịch đã được kích hoạt thành công!');
      },
    });
  };

  const handlePause = () => {
    Modal.confirm({
      title: 'Tạm dừng chiến dịch?',
      content: 'Tạm thời đóng băng các hoạt động mời creator mới. Các hợp đồng đã ký vẫn được tiếp tục.',
      okText: 'Tạm dừng',
      cancelText: 'Bỏ qua',
      okButtonProps: { style: { background: '#F59E0B', borderColor: '#F59E0B' } },
      onOk: () => {
        setCurrentStatus('paused');
        message.warning('Chiến dịch đã được tạm dừng.');
      },
    });
  };

  const handleResume = () => {
    setCurrentStatus('running');
    message.success('Chiến dịch đã tiếp tục hoạt động!');
  };

  const handleComplete = () => {
    Modal.confirm({
      title: 'Xác nhận hoàn thành chiến dịch?',
      content: 'Đóng chiến dịch và lưu trữ toàn bộ chỉ số KPI, chi phí thực tế vào Lịch sử chiến dịch.',
      okText: 'Hoàn thành chiến dịch',
      cancelText: 'Hủy',
      okButtonProps: { style: { background: '#6366F1' } },
      onOk: () => {
        setCurrentStatus('completed');
        message.success('Chiến dịch đã được đánh dấu hoàn thành xuất sắc!');
      },
    });
  };

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      message.warning('Vui lòng nhập lý do hủy chiến dịch!');
      return;
    }
    setCurrentStatus('cancelled');
    setIsCancelModalOpen(false);
    message.error('Chiến dịch đã được hủy.');
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'running':
        return (
          <Tag color="success" icon={<PlayCircleFilled />} style={{ padding: '3px 10px', fontWeight: 700, borderRadius: 999 }}>
            ĐANG CHẠY
          </Tag>
        );
      case 'draft':
        return (
          <Tag color="purple" icon={<EditOutlined />} style={{ padding: '3px 10px', fontWeight: 700, borderRadius: 999 }}>
            BẢN NHÁP
          </Tag>
        );
      case 'paused':
        return (
          <Tag color="warning" icon={<PauseCircleOutlined />} style={{ padding: '3px 10px', fontWeight: 700, borderRadius: 999 }}>
            TẠM DỪNG
          </Tag>
        );
      case 'completed':
        return (
          <Tag color="default" icon={<CheckCircleFilled />} style={{ padding: '3px 10px', fontWeight: 700, borderRadius: 999 }}>
            ĐÃ HOÀN THÀNH
          </Tag>
        );
      case 'cancelled':
        return (
          <Tag color="error" icon={<StopOutlined />} style={{ padding: '3px 10px', fontWeight: 700, borderRadius: 999 }}>
            ĐÃ HỦY
          </Tag>
        );
    }
  };

  const creatorColumns: ColumnsType<CampaignCreatorRow> = [
    {
      title: 'Creator',
      dataIndex: 'name',
      key: 'name',
      render: (_, r) => (
        <Space size={10} align="center">
          <Avatar src={r.avatar} size={36} />
          <div>
            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>{r.name}</div>
            <div style={{ fontSize: 11.5, color: '#64748B' }}>@{r.username}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Nền tảng',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => (
        <Tag color="geekblue" style={{ textTransform: 'capitalize', fontWeight: 600 }}>
          {platform}
        </Tag>
      ),
    },
    {
      title: 'Followers',
      dataIndex: 'followers',
      key: 'followers',
      render: (f: string) => <span style={{ fontWeight: 600 }}>{f}</span>,
    },
    {
      title: 'Thù lao',
      dataIndex: 'fee',
      key: 'fee',
      render: (fee: string) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{fee}</span>,
    },
    {
      title: 'Tiến độ CRM',
      dataIndex: 'stageText',
      key: 'stageText',
      render: (text: string, r) => (
        <Tag color={r.stageColor} style={{ fontWeight: 600, borderRadius: 999 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'Ấn phẩm bàn giao',
      dataIndex: 'deliverableStatus',
      key: 'deliverableStatus',
      render: (status: string, r) => (
        <Tag color={r.deliverableColor} style={{ fontWeight: 500 }}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right',
      render: (_, r) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/creators/${r.id}`)}
        >
          Hồ sơ
        </Button>
      ),
    },
  ];

  return (
    <div className="cdetail-container">
      {/* 1. Breadcrumb & Back button */}
      <div>
        <Breadcrumb
          separator="/"
          items={[
            { title: <span style={{ color: '#94A3B8', cursor: 'pointer' }} onClick={() => navigate('/campaigns')}>Chiến dịch</span> },
            { title: <span style={{ color: '#5B5BF0', fontWeight: 600 }}>{campaignData.title}</span> },
          ]}
          style={{ marginBottom: 8, fontSize: 12.5 }}
        />
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/campaigns')}
          style={{ padding: 0, height: 'auto', color: '#64748B', fontWeight: 600, fontSize: 13 }}
        >
          Quay lại danh sách chiến dịch
        </Button>
      </div>

      {/* 2. Campaign Header & Lifecycle Action Bar */}
      <div className="cdetail-header-card">
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} md={14}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              {getStatusBadge()}
              <span style={{ color: '#94A3B8', fontSize: 12 }}>• ID: {campaignData.id}</span>
              <span style={{ color: '#64748B', fontSize: 12 }}>
                <CalendarOutlined style={{ marginRight: 4 }} /> Khởi chạy: {campaignData.date}
              </span>
            </div>

            <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 800, color: '#0F172A', letterSpacing: -0.5 }}>
              {campaignData.title}
            </Title>

            <Space size={6} wrap>
              {campaignData.tags.map((t) => (
                <Tag key={t} style={{ background: '#F1F5F9', border: 'none', borderRadius: 6, fontWeight: 500 }}>
                  {t}
                </Tag>
              ))}
            </Space>
          </Col>

          {/* Action Toolbar */}
          <Col xs={24} md={10} style={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 8, flexWrap: 'wrap' }}>
            {currentStatus === 'draft' && (
              <Button
                type="primary"
                icon={<PlayCircleFilled />}
                onClick={handleActivate}
                style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 700, borderRadius: 8 }}
              >
                Kích hoạt chiến dịch
              </Button>
            )}

            {currentStatus === 'running' && (
              <>
                <Button
                  icon={<PauseCircleOutlined />}
                  onClick={handlePause}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                >
                  Tạm dừng
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleFilled />}
                  onClick={handleComplete}
                  style={{ background: '#6366F1', borderColor: '#6366F1', fontWeight: 700, borderRadius: 8 }}
                >
                  Hoàn thành
                </Button>
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() => setIsCancelModalOpen(true)}
                  style={{ borderRadius: 8 }}
                >
                  Hủy chiến dịch
                </Button>
              </>
            )}

            {currentStatus === 'paused' && (
              <>
                <Button
                  type="primary"
                  icon={<PlayCircleFilled />}
                  onClick={handleResume}
                  style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 700, borderRadius: 8 }}
                >
                  Tiếp tục chạy
                </Button>
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() => setIsCancelModalOpen(true)}
                  style={{ borderRadius: 8 }}
                >
                  Hủy chiến dịch
                </Button>
              </>
            )}

            {(currentStatus === 'completed' || currentStatus === 'cancelled') && (
              <Button
                type="primary"
                onClick={handleActivate}
                style={{ background: '#5B5BF0', borderRadius: 8, fontWeight: 600 }}
              >
                Mở lại chiến dịch
              </Button>
            )}

            <Button
              icon={<ApartmentOutlined />}
              onClick={() => navigate(`/campaign-management/${campaignData.id}`)}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Pipeline Kanban
            </Button>
          </Col>
        </Row>
      </div>

      {/* 3. 4 High-level Stat Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="cdetail-stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 12.5, fontWeight: 600 }}>
              <span>Ngân sách đã chi</span>
              <DollarOutlined style={{ color: '#6366F1', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '8px 0 4px 0' }}>
              {campaignData.spent}
              <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500, marginLeft: 4 }}>/ $15.0K</span>
            </div>
            <Progress percent={Math.round((campaignData.spentNumber / 15000) * 100)} size="small" strokeColor="#6366F1" showInfo={false} />
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="cdetail-stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 12.5, fontWeight: 600 }}>
              <span>Lượt tiếp cận (Reach)</span>
              <RiseOutlined style={{ color: '#0EA5E9', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '8px 0 4px 0' }}>
              {campaignData.reach}
            </div>
            <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>+42% so với mục tiêu ban đầu</div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="cdetail-stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 12.5, fontWeight: 600 }}>
              <span>Tương tác trung bình</span>
              <ThunderboltFilled style={{ color: '#F59E0B', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '8px 0 4px 0' }}>
              {campaignData.engagement}
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Tỷ lệ tương tác vượt chuẩn 2.1x</div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="cdetail-stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 12.5, fontWeight: 600 }}>
              <span>Creator tham gia</span>
              <TeamOutlined style={{ color: '#10B981', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '8px 0 4px 0' }}>
              {campaignData.creatorsCount}
              <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500, marginLeft: 4 }}>Creators</span>
            </div>
            <div style={{ fontSize: 12, color: '#6366F1', fontWeight: 600 }}>4 người đã nộp video demo</div>
          </div>
        </Col>
      </Row>

      {/* 4. Tab Navigation Content */}
      <Card className="cdetail-content-card" bodyStyle={{ padding: '12px 24px 24px 24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k)}
          size="large"
          items={[
            {
              key: 'overview',
              label: <span style={{ fontWeight: 600 }}>Tổng quan & Brief sáng tạo</span>,
              children: (
                <div style={{ marginTop: 12 }}>
                  <Row gutter={[24, 24]}>
                    <Col xs={24} lg={14}>
                      <div className="brief-box">
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A', marginBottom: 16 }}>
                          📋 Tóm tắt Creator Brief (Nội dung yêu cầu)
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <div className="brief-item-title">Thông điệp cốt lõi (Key Message):</div>
                          <div style={{ color: '#1E293B', fontSize: 13.5, lineHeight: 1.5 }}>
                            "Làn da ẩm mịn căng bóng chỉ sau 7 ngày với tinh chất thuần chay lành tính dịu nhẹ, an toàn tuyệt đối cho da nhạy cảm."
                          </div>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <div className="brief-item-title">Sản phẩm trọng tâm & Quà tặng:</div>
                          <Tag color="blue" style={{ fontSize: 12, padding: '2px 8px' }}>
                            Serum Glow C+ 30ml
                          </Tag>
                          <Tag color="cyan" style={{ fontSize: 12, padding: '2px 8px' }}>
                            Kem chống nắng thuần chay SPF50+
                          </Tag>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <div className="brief-item-title">Quy cách ấn phẩm (Deliverables):</div>
                          <div style={{ color: '#334155', fontSize: 13 }}>
                            • <strong>01 Video TikTok / Reels (60s)</strong>: Định dạng dọc 9:16, âm thanh bắt trend, trải nghiệm sản phẩm trực tiếp lên da mặt.<br />
                            • <strong>01 Story Instagram</strong> kèm link gắn giỏ hàng Shopee Mall.
                          </div>
                        </div>

                        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                          <Col span={12}>
                            <div style={{ background: '#ECFDF5', padding: 12, borderRadius: 8, border: '1px solid #A7F3D0' }}>
                              <div style={{ fontWeight: 700, color: '#065F46', fontSize: 12, marginBottom: 4 }}>
                                ✅ NÊN LÀM (DO'S):
                              </div>
                              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#047857' }}>
                                <li>Quay cận cảnh kết cấu tinh chất thấm nhanh</li>
                                <li>Chia sẻ cảm nhận chân thật sau 7 ngày</li>
                                <li>Hashtag: #GlowBeautyVN #GlowYourSkin</li>
                              </ul>
                            </div>
                          </Col>

                          <Col span={12}>
                            <div style={{ background: '#FEF2F2', padding: 12, borderRadius: 8, border: '1px solid #FECACA' }}>
                              <div style={{ fontWeight: 700, color: '#991B1B', fontSize: 12, marginBottom: 4 }}>
                                ❌ ĐIỀU CẤM KỴ (DON'TS):
                              </div>
                              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#B91C1C' }}>
                                <li>Không so sánh dìm hàng thương hiệu khác</li>
                                <li>Không cam kết khỏi mụn/trắng da 100% cấp tốc</li>
                                <li>Không chèn nhạc vi phạm bản quyền</li>
                              </ul>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </Col>

                    <Col xs={24} lg={10}>
                      <div className="brief-box">
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A', marginBottom: 16 }}>
                          🎯 Thông tin vận hành chiến dịch
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Mục tiêu chính:</span>
                            <span style={{ fontWeight: 700, color: '#0F172A' }}>Tăng nhận diện & Doanh số TikTok Shop</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Ngành hàng:</span>
                            <span style={{ fontWeight: 600 }}>Mỹ phẩm & Chăm sóc cá nhân</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Khu vực:</span>
                            <span style={{ fontWeight: 600 }}>Toàn quốc (Trọng điểm TP.HCM & Hà Nội)</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Độ tuổi khán giả:</span>
                            <span style={{ fontWeight: 600 }}>18 – 28 tuổi (Nữ 80%)</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Người phụ trách:</span>
                            <span style={{ fontWeight: 700, color: '#5B5BF0' }}>Nguyễn Thị Vân (Brand Manager)</span>
                          </div>
                        </div>

                        <Divider style={{ margin: '16px 0' }} />

                        <Button
                          block
                          icon={<EditOutlined />}
                          onClick={() => message.info('Mở form chỉnh sửa Brief chiến dịch')}
                        >
                          Chỉnh sửa nội dung Brief
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'creators',
              label: <span style={{ fontWeight: 600 }}>Creator tham gia ({MOCK_PARTICIPATING_CREATORS.length})</span>,
              children: (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Danh sách các Influencer/KOLs được phân bổ trong chiến dịch này.
                    </Text>
                    <Space>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        style={{ background: '#5B5BF0', borderRadius: 8 }}
                        onClick={() => navigate('/creators')}
                      >
                        Tìm thêm Creator bằng AI
                      </Button>
                    </Space>
                  </div>

                  <Table
                    columns={creatorColumns}
                    dataSource={MOCK_PARTICIPATING_CREATORS}
                    rowKey="id"
                    pagination={false}
                  />
                </div>
              ),
            },
            {
              key: 'budget',
              label: <span style={{ fontWeight: 600 }}>Phân bổ ngân sách</span>,
              children: (
                <div style={{ marginTop: 12 }}>
                  <Row gutter={[20, 20]}>
                    <Col xs={24} md={8}>
                      <div className="brief-box" style={{ textAlign: 'center', padding: '24px 16px' }}>
                        <div style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>Tổng ngân sách cấp phép</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                          $15,000 USD
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>~ 375,000,000 ₫</div>
                      </div>
                    </Col>

                    <Col xs={24} md={8}>
                      <div className="brief-box" style={{ textAlign: 'center', padding: '24px 16px' }}>
                        <div style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>Đã cam kết & Giải ngân</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#6366F1', marginTop: 4 }}>
                          {campaignData.spent}
                        </div>
                        <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginTop: 2 }}>
                          {Math.round((campaignData.spentNumber / 15000) * 100)}% ngân sách
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} md={8}>
                      <div className="brief-box" style={{ textAlign: 'center', padding: '24px 16px' }}>
                        <div style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>Ngân sách dự phòng còn lại</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#10B981', marginTop: 4 }}>
                          ${(15000 - campaignData.spentNumber).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Sẵn sàng cho Creator phát sinh</div>
                      </div>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'timeline',
              label: <span style={{ fontWeight: 600 }}>Mốc thời gian (Timeline)</span>,
              children: (
                <div style={{ marginTop: 16, maxWidth: 640 }}>
                  <Timeline
                    items={[
                      {
                        color: 'green',
                        children: (
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>Khởi tạo & Duyệt Brief chiến dịch</div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>01/05/2026 • Đã hoàn tất bởi Brand Manager</div>
                          </div>
                        ),
                      },
                      {
                        color: 'green',
                        children: (
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>Chốt danh sách & Ký kết thỏa thuận Creator</div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>10/05/2026 • 12 Creator đã xác nhận tham gia</div>
                          </div>
                        ),
                      },
                      {
                        color: 'green',
                        children: (
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>Gửi sản phẩm mẫu (Seeding Kits)</div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>15/05/2026 • Đơn vị vận chuyển đã giao toàn bộ kit mẫu</div>
                          </div>
                        ),
                      },
                      {
                        color: 'blue',
                        children: (
                          <div>
                            <div style={{ fontWeight: 700, color: '#5B5BF0' }}>Duyệt Video Demo & Chỉnh sửa ấn phẩm (Đang diễn ra)</div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>Hạn chót: 25/05/2026 • Đang chờ duyệt bản demo cuối cùng</div>
                          </div>
                        ),
                      },
                      {
                        color: 'gray',
                        children: (
                          <div>
                            <div style={{ fontWeight: 600, color: '#64748B' }}>Creator đồng loạt lên sóng (Go Live)</div>
                            <div style={{ fontSize: 12, color: '#94A3B8' }}>Dự kiến: 01/06/2026 – 05/06/2026</div>
                          </div>
                        ),
                      },
                      {
                        color: 'gray',
                        children: (
                          <div>
                            <div style={{ fontWeight: 600, color: '#64748B' }}>Tổng kết nghiệm thu & Đánh giá KPI</div>
                            <div style={{ fontSize: 12, color: '#94A3B8' }}>Dự kiến: 20/06/2026</div>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Cancel Campaign Confirmation Modal */}
      <Modal
        title={
          <span style={{ color: '#EF4444', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <WarningFilled /> Xác nhận hủy chiến dịch
          </span>
        }
        open={isCancelModalOpen}
        onCancel={() => setIsCancelModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setIsCancelModalOpen(false)}>
            Quay lại
          </Button>,
          <Button key="submit" type="primary" danger onClick={handleConfirmCancel}>
            Xác nhận hủy
          </Button>,
        ]}
      >
        <p style={{ color: '#475569', fontSize: 13 }}>
          Khi hủy chiến dịch, các lời mời chưa được chấp thuận sẽ tự động hủy. Bạn cần thanh toán các chi phí theo thỏa thuận cho các Creator đã ký hợp đồng.
        </p>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12.5 }}>Lý do hủy chiến dịch:</div>
          <TextArea
            rows={3}
            placeholder="Nhập lý do hủy (ví dụ: Thay đổi kế hoạch ra mắt sản phẩm...)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
