import React, { useState, useEffect } from 'react';
import {
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
  EditOutlined,
  PlusOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignService } from '../../services/api/campaignService';
import type { RelationshipDto } from '../../services/api/campaignService';
import type { CampaignResponse } from '../../types/api/campaign.types';
import { mapApiCampaignToUi } from '../../components/dashboard/CampaignTable';
import type { Campaign } from '../../data/mockData';
import './CampaignDetailPage.css';

const { Title, Text } = Typography;

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

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [rawCampaign, setRawCampaign] = useState<CampaignResponse | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [participatingCreators, setParticipatingCreators] = useState<CampaignCreatorRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [currentStatus, setCurrentStatus] = useState<CampaignStatusType>('draft');
  const [activeTab, setActiveTab] = useState('overview');

  // Cancel Modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadCampaign = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [data, rels] = await Promise.all([
          campaignService.getCampaignById(id),
          campaignService.getRelationships(id).catch(() => []),
        ]);
        if (isMounted && data) {
          setRawCampaign(data);
          setCampaign(mapApiCampaignToUi(data));
          const isRunning = data.status === 'ACTIVE' || data.status === 'READY_FOR_DISCOVERY';
          setCurrentStatus((isRunning ? 'running' : data.status === 'COMPLETED' ? 'completed' : 'draft') as CampaignStatusType);

          if (Array.isArray(rels) && rels.length > 0) {
            const mappedCreators: CampaignCreatorRow[] = rels.map((r: RelationshipDto) => {
              const feeNum = r.agreedFee || r.quotedFee || 0;
              const feeText = feeNum > 0 ? `${feeNum.toLocaleString('vi-VN')} ₫` : 'Thỏa thuận';
              return {
                id: r.id,
                name: r.creatorName || 'Creator',
                username: r.creatorName ? r.creatorName.toLowerCase().replace(/\s+/g, '_') : 'creator',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                platform: 'tiktok',
                followers: '500K',
                fee: feeText,
                stageText: r.stage || 'Đang kết nối',
                stageColor: (r.stage === 'COLLABORATING' || r.stage === 'COMPLETED') ? 'success' : 'processing',
                deliverableStatus: r.notes || 'Chưa cập nhật',
                deliverableColor: 'default',
              };
            });
            setParticipatingCreators(mappedCreators);
          } else {
            setParticipatingCreators([]);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải chi tiết chiến dịch:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadCampaign();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const campaignData: Campaign = campaign || {
    id: id || 'camp-1',
    title: rawCampaign?.name || 'Chiến dịch',
    tags: rawCampaign?.niches || ['Chiến dịch tiếp thị'],
    thumbnail: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&auto=format&fit=crop&q=80',
    status: 'draft',
    statusText: 'Bản nháp',
    creatorsCount: participatingCreators.length,
    reach: '0',
    reachNumber: 0,
    engagement: '0%',
    engagementNumber: 0,
    spent: rawCampaign?.budgetMax ? `${(rawCampaign.budgetMax / 1_000_000).toFixed(0)}M ₫` : '0 ₫',
    spentNumber: rawCampaign?.budgetMax || 0,
    date: rawCampaign?.startDate ? new Date(rawCampaign.startDate).toLocaleDateString('vi-VN') : 'Mới tạo',
  };

  // Handle Lifecycle actions
  const handleActivate = () => {
    Modal.confirm({
      title: 'Kích hoạt chiến dịch ngay?',
      content: 'Chiến dịch sẽ được kích hoạt trên hệ thống và chuyển sang trạng thái sẵn sàng để liên hệ, đàm phán với Creator.',
      okText: 'Kích hoạt ngay',
      cancelText: 'Hủy',
      okButtonProps: { style: { background: '#10B981', borderColor: '#10B981' } },
      onOk: async () => {
        try {
          message.loading({ content: 'Đang kích hoạt chiến dịch trên hệ thống...', key: 'act_camp' });
          if (id) {
            const updated = await campaignService.activateCampaign(id);
            if (updated) {
              setRawCampaign(updated);
              setCampaign(mapApiCampaignToUi(updated));
            }
          }
          setCurrentStatus('running');
          message.success({ content: 'Chiến dịch đã được kích hoạt thành công!', key: 'act_camp' });
        } catch (error: any) {
          console.error('Lỗi khi kích hoạt chiến dịch:', error);
          const errMsg = error?.response?.data?.detail || error?.response?.data?.message || 'Không thể kích hoạt chiến dịch';
          message.error({ content: errMsg, key: 'act_camp' });
        }
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
      onOk: async () => {
        try {
          message.loading({ content: 'Đang đánh dấu hoàn thành chiến dịch...', key: 'comp_camp' });
          if (id) {
            const updated = await campaignService.updateStatus(id, 'COMPLETED');
            if (updated) {
              setRawCampaign(updated);
              setCampaign(mapApiCampaignToUi(updated));
            }
          }
          setCurrentStatus('completed');
          message.success({ content: 'Chiến dịch đã được đánh dấu hoàn thành xuất sắc!', key: 'comp_camp' });
        } catch (error: any) {
          console.error('Lỗi khi cập nhật trạng thái:', error);
          const errMsg = error?.response?.data?.detail || error?.response?.data?.message || 'Không thể cập nhật trạng thái';
          message.error({ content: errMsg, key: 'comp_camp' });
        }
      },
    });
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      message.warning('Vui lòng nhập lý do hủy chiến dịch!');
      return;
    }
    if (id) {
      await campaignService.archiveCampaign(id).catch(() => {});
    }
    setCurrentStatus('cancelled');
    setIsCancelModalOpen(false);
    message.error('Chiến dịch đã được hủy và lưu trữ.');
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'running':
        return (
          <Tag color="success" icon={<PlayCircleFilled />} style={{ padding: '3px 10px', fontWeight: 700, borderRadius: 999 }}>
            ĐANG CHẠY
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
          <Tag color="purple" icon={<CheckCircleFilled />} style={{ padding: '3px 10px', fontWeight: 700, borderRadius: 999 }}>
            ĐÃ HOÀN THÀNH
          </Tag>
        );
      case 'cancelled':
        return (
          <Tag color="error" icon={<StopOutlined />} style={{ padding: '3px 10px', fontWeight: 700, borderRadius: 999 }}>
            ĐÃ HỦY
          </Tag>
        );
      default:
        return (
          <Tag color="processing" icon={<ClockCircleOutlined />} style={{ padding: '3px 10px', fontWeight: 700, borderRadius: 999 }}>
            BẢN NHÁP
          </Tag>
        );
    }
  };

  const creatorColumns: ColumnsType<CampaignCreatorRow> = [
    {
      title: 'Creator',
      key: 'creator',
      render: (_, r) => (
        <Space size={10}>
          <Avatar src={r.avatar} size={36} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{r.name}</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>@{r.username}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Kênh & Follower',
      key: 'platform',
      render: (_, r) => (
        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
          {r.followers}
        </span>
      ),
    },
    {
      title: 'Thù lao',
      dataIndex: 'fee',
      key: 'fee',
      render: (fee) => <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>{fee}</span>,
    },
    {
      title: 'Trạng thái Pipeline',
      key: 'stage',
      render: (_, r) => (
        <Tag color={r.stageColor} style={{ borderRadius: 6, fontWeight: 600 }}>
          {r.stageText}
        </Tag>
      ),
    },
    {
      title: 'Ghi chú vận hành',
      key: 'deliverable',
      render: (_, r) => (
        <span style={{ fontSize: 12, color: '#64748B' }}>{r.deliverableStatus}</span>
      ),
    },
  ];

  return (
    <div className="campaign-detail-container">
      {/* 1. Breadcrumb & Top Bar */}
      <div className="cdetail-top-bar">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/campaigns')}
          style={{ fontWeight: 600, color: '#475569', padding: '0 8px' }}
        >
          Quay lại danh sách
        </Button>
      </div>

      {/* 2. Header Hero Card */}
      <div className="cdetail-header-card">
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              {getStatusBadge()}
              <span style={{ color: '#64748B', fontSize: 12 }}>
                <CalendarOutlined style={{ marginRight: 4 }} />
                {campaignData.date}
              </span>
            </div>

            <Title level={2} style={{ margin: '0 0 8px 0', fontSize: 24, fontWeight: 800, color: '#0F172A' }}>
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
          <Col xs={24} md={10} style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
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
              <span>Ngân sách chiến dịch</span>
              <DollarOutlined style={{ color: '#6366F1', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '8px 0 4px 0' }}>
              {campaignData.spent}
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Ngân sách dự kiến tối đa</div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="cdetail-stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 12.5, fontWeight: 600 }}>
              <span>Follower mục tiêu</span>
              <RiseOutlined style={{ color: '#0EA5E9', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '8px 0 4px 0' }}>
              {rawCampaign?.followerMin ? `${(rawCampaign.followerMin / 1000).toFixed(0)}K+` : 'Đang cập nhật'}
            </div>
            <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>Yêu cầu tệp khán giả tối thiểu</div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="cdetail-stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 12.5, fontWeight: 600 }}>
              <span>Mục tiêu tương tác</span>
              <ThunderboltFilled style={{ color: '#F59E0B', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '8px 0 4px 0' }}>
              4.5% - 8.0%
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Tiêu chuẩn lọc ghép nối AI</div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="cdetail-stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 12.5, fontWeight: 600 }}>
              <span>Creator tham gia</span>
              <TeamOutlined style={{ color: '#10B981', fontSize: 16 }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '8px 0 4px 0' }}>
              {participatingCreators.length}
              <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500, marginLeft: 4 }}>Creators</span>
            </div>
            <div style={{ fontSize: 12, color: '#6366F1', fontWeight: 600 }}>
              {participatingCreators.length > 0 ? `${participatingCreators.length} người trong pipeline` : 'Chưa thêm creator'}
            </div>
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
                          Tóm tắt Creator Brief (Nội dung yêu cầu)
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <div className="brief-item-title">Mô tả & Thông điệp chiến dịch:</div>
                          <div style={{ color: '#1E293B', fontSize: 13.5, lineHeight: 1.5 }}>
                            {rawCampaign?.description || 'Chưa có thông điệp mô tả chi tiết cho chiến dịch này.'}
                          </div>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <div className="brief-item-title">Sản phẩm / Dịch vụ trọng tâm:</div>
                          <Tag color="blue" style={{ fontSize: 12, padding: '2px 8px' }}>
                            {rawCampaign?.productService || 'Sản phẩm nhãn hàng'}
                          </Tag>
                          {rawCampaign?.niches?.map((n) => (
                            <Tag key={n} color="cyan" style={{ fontSize: 12, padding: '2px 8px' }}>
                              {n}
                            </Tag>
                          ))}
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <div className="brief-item-title">Mục tiêu chiến dịch (Objectives):</div>
                          <div style={{ color: '#334155', fontSize: 13 }}>
                            • <strong>{rawCampaign?.objective || 'Mục tiêu truyền thông chung'}</strong>
                          </div>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <div className="brief-item-title">Nền tảng ưu tiên:</div>
                          <Space size={6} wrap>
                            {rawCampaign?.platforms && rawCampaign.platforms.length > 0 ? (
                              rawCampaign.platforms.map((p) => (
                                <Tag key={p} color="purple" style={{ borderRadius: 6, fontWeight: 600 }}>
                                  {p}
                                </Tag>
                              ))
                            ) : (
                              <Tag color="default">Tất cả nền tảng</Tag>
                            )}
                          </Space>
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} lg={10}>
                      <div className="brief-box">
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A', marginBottom: 16 }}>
                          Thông tin vận hành chiến dịch
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Mục tiêu chính:</span>
                            <span style={{ fontWeight: 700, color: '#0F172A' }}>{rawCampaign?.objective || 'Tiếp cận & Nhận diện'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Ngành hàng:</span>
                            <span style={{ fontWeight: 600 }}>{rawCampaign?.niches?.join(', ') || 'Chưa định rõ'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Đối tượng khán giả:</span>
                            <span style={{ fontWeight: 600 }}>{rawCampaign?.targetAudiences?.join(', ') || 'Đại chúng'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Khoảng Follower:</span>
                            <span style={{ fontWeight: 600 }}>
                              {rawCampaign?.followerMin ? `${(rawCampaign.followerMin / 1000).toFixed(0)}K – ${(rawCampaign.followerMax || 0) / 1000}K` : 'Không giới hạn'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Thời gian diễn ra:</span>
                            <span style={{ fontWeight: 600 }}>
                              {rawCampaign?.startDate ? new Date(rawCampaign.startDate).toLocaleDateString('vi-VN') : 'Mới tạo'}
                              {rawCampaign?.endDate ? ` – ${new Date(rawCampaign.endDate).toLocaleDateString('vi-VN')}` : ''}
                            </span>
                          </div>
                        </div>

                        <Divider style={{ margin: '16px 0' }} />

                        <Button
                          block
                          icon={<EditOutlined />}
                          onClick={() => navigate('/campaigns/create')}
                        >
                          Chỉnh sửa chiến dịch
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'creators',
              label: <span style={{ fontWeight: 600 }}>Creator tham gia ({participatingCreators.length})</span>,
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
                        onClick={() => navigate(`/creators?campaignId=${id}`)}
                      >
                        Tìm thêm Creator bằng AI
                      </Button>
                    </Space>
                  </div>

                  {participatingCreators.length > 0 ? (
                    <Table
                      columns={creatorColumns}
                      dataSource={participatingCreators}
                      rowKey="id"
                      pagination={false}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F8FAFC', borderRadius: 12, border: '1px dashed #CBD5E1' }}>
                      <TeamOutlined style={{ fontSize: 36, color: '#94A3B8', marginBottom: 10 }} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        Chưa có Creator nào tham gia chiến dịch này
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
                        Sử dụng công cụ Ghép nối AI để khám phá và thêm các Creator phù hợp vào chiến dịch.
                      </div>
                      <Button
                        type="primary"
                        onClick={() => navigate(`/creators?campaignId=${id}`)}
                        style={{ background: '#5B5BF0', borderRadius: 8 }}
                      >
                        Khám phá Creator ngay
                      </Button>
                    </div>
                  )}
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
                        <div style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>Tổng ngân sách tối đa</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                          {rawCampaign?.budgetMax ? `${(rawCampaign.budgetMax / 1_000_000).toFixed(0)}M ₫` : 'Thỏa thuận'}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                          {rawCampaign?.budgetMax ? `${rawCampaign.budgetMax.toLocaleString('vi-VN')} VND` : 'Chưa định mức ngân sách'}
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} md={8}>
                      <div className="brief-box" style={{ textAlign: 'center', padding: '24px 16px' }}>
                        <div style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>Ngân sách tối thiểu</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#6366F1', marginTop: 4 }}>
                          {rawCampaign?.budgetMin ? `${(rawCampaign.budgetMin / 1_000_000).toFixed(0)}M ₫` : '0 ₫'}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                          Mức phân bổ sàn
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} md={8}>
                      <div className="brief-box" style={{ textAlign: 'center', padding: '24px 16px' }}>
                        <div style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>Trạng thái tài chính</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#10B981', marginTop: 4 }}>
                          Sẵn sàng
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                          Đã phân bổ hạn mức
                        </div>
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
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>Khởi tạo chiến dịch</div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>
                              {rawCampaign?.createdAt ? new Date(rawCampaign.createdAt).toLocaleDateString('vi-VN') : 'Mới tạo'} • Đã tạo trên hệ thống
                            </div>
                          </div>
                        ),
                      },
                      {
                        color: currentStatus === 'running' || currentStatus === 'completed' ? 'green' : 'blue',
                        children: (
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>Kích hoạt & Ghép nối Creator AI</div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>
                              {currentStatus === 'running' || currentStatus === 'completed' ? 'Đã kích hoạt hoạt động' : 'Đang ở trạng thái Bản nháp'}
                            </div>
                          </div>
                        ),
                      },
                      {
                        color: currentStatus === 'completed' ? 'green' : 'gray',
                        children: (
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>Hoàn tất & Nghiệm thu KPI</div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>
                              {rawCampaign?.endDate ? `Dự kiến kết thúc: ${new Date(rawCampaign.endDate).toLocaleDateString('vi-VN')}` : 'Theo dõi thời gian thực'}
                            </div>
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
        title={<span style={{ fontWeight: 700, color: '#EF4444' }}>Xác nhận hủy chiến dịch</span>}
        open={isCancelModalOpen}
        onOk={handleConfirmCancel}
        onCancel={() => setIsCancelModalOpen(false)}
        okText="Xác nhận hủy"
        cancelText="Đóng"
        okButtonProps={{ danger: true }}
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: '#475569', fontSize: 13 }}>
            Bạn có chắc chắn muốn hủy chiến dịch <strong>{campaignData.title}</strong>? Thao tác này sẽ đóng băng mọi hoạt động hợp tác và lưu trữ chiến dịch.
          </p>
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A', display: 'block', marginBottom: 4 }}>
              Lý do hủy chiến dịch:
            </span>
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do hủy chiến dịch..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
