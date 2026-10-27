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
  CompassOutlined,
  FileTextOutlined,
  SettingOutlined,
  AimOutlined,
  TagsOutlined,
  InstagramOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { campaignService } from '../../services/api/campaignService';
import type { RelationshipDto } from '../../services/api/campaignService';
import type { CampaignResponse } from '../../types/api/campaign.types';
import { mapApiCampaignToUi } from '../../components/dashboard/CampaignTable';
import type { Campaign } from '../../data/mockData';
import './CampaignDetailPage.css';

import type { CampaignItemUI } from './CampaignPage';

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

// Global In-Memory Cache (loại bỏ hoàn toàn reload flash và giật lag khi chuyển trang qua lại)
interface CampaignDetailCacheEntry {
  rawCampaign: CampaignResponse;
  campaign: Campaign;
  participatingCreators: CampaignCreatorRow[];
  currentStatus: CampaignStatusType;
  timestamp: number;
}
const campaignDetailCache = new Map<string, CampaignDetailCacheEntry>();

export default function CampaignDetailPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận diện ID từ params, navigation state hoặc sessionStorage
  const resolvedId =
    paramId ||
    (location.state as any)?.id ||
    (location.state as any)?.campaignId ||
    sessionStorage.getItem('current_campaign_id') ||
    '';

  // Cập nhật sessionStorage khi có paramId mà không gây remount lặp
  useEffect(() => {
    if (paramId) {
      sessionStorage.setItem('current_campaign_id', paramId);
    }
  }, [paramId]);

  // Trích xuất campaign data đã được truyền từ trang danh sách hoặc sessionStorage
  const passedItem: CampaignItemUI | null = (() => {
    const fromState = (location.state as any)?.item || (location.state as any)?.campaignData;
    if (fromState) return fromState;
    try {
      const raw = sessionStorage.getItem('current_campaign_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.id === resolvedId || !resolvedId)) return parsed;
      }
    } catch {}
    return null;
  })();

  const cached = campaignDetailCache.get(resolvedId);

  // Khởi tạo state tức thì (0ms) từ Cache hoặc Passed Data để không bao giờ bị chớp màn hình rỗng
  const [rawCampaign, setRawCampaign] = useState<CampaignResponse | null>(() => {
    if (cached) return cached.rawCampaign;
    if (passedItem) {
      return {
        id: passedItem.id || resolvedId,
        name: passedItem.name,
        description: (passedItem as any).description || (passedItem as any).subtitle || 'Chiến dịch tiếp thị đa kênh kết nối Creator tiềm năng.',
        productService: (passedItem as any).productService || passedItem.name,
        objective: ((passedItem as any).objective as any) || 'AWARENESS',
        budgetMin: passedItem.budgetRaw ? Math.round(passedItem.budgetRaw * 0.75) : 50000000,
        budgetMax: passedItem.budgetRaw || 200000000,
        platforms: passedItem.platforms || ['TIKTOK', 'INSTAGRAM'],
        niches: passedItem.niches || ['Làm đẹp & Phong cách sống'],
        targetAudiences: ['18-24', '25-34'],
        locations: ['Thành phố Hồ Chí Minh', 'Hà Nội'],
        followerMin: 50000,
        followerMax: 1000000,
        startDate: '2026-06-15',
        endDate: '2026-08-31',
        status: (passedItem.status as any) || 'ACTIVE',
        brandId: '',
        createdAt: new Date().toISOString(),
      };
    }
    return null;
  });

  const [campaign, setCampaign] = useState<Campaign | null>(() => {
    if (cached) return cached.campaign;
    if (passedItem) {
      return {
        id: passedItem.id || resolvedId,
        title: passedItem.name || 'Chiến dịch',
        tags: passedItem.niches || ['Chiến dịch tiếp thị'],
        thumbnail: passedItem.thumbnail || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&auto=format&fit=crop&q=80',
        status: passedItem.status === 'COMPLETED' ? 'completed' : (passedItem.status === 'DRAFT' ? 'draft' : 'running'),
        statusText: passedItem.statusText || 'Đang triển khai',
        creatorsCount: passedItem.creatorsCount || 0,
        reach: '500K+',
        reachNumber: 500000,
        engagement: '5.2%',
        engagementNumber: 5.2,
        spent: passedItem.budgetFormatted || `${(passedItem.budgetRaw || 200000000).toLocaleString('vi-VN')} ₫`,
        spentNumber: passedItem.budgetRaw || 200000000,
        date: passedItem.dateRange || '15 Jun 2026 – 31 Aug 2026',
      };
    }
    return null;
  });

  const [participatingCreators, setParticipatingCreators] = useState<CampaignCreatorRow[]>(() => {
    return cached?.participatingCreators || [];
  });

  const [currentStatus, setCurrentStatus] = useState<CampaignStatusType>(() => {
    if (cached) return cached.currentStatus;
    if (passedItem?.status === 'COMPLETED') return 'completed';
    if (passedItem?.status === 'DRAFT') return 'draft';
    return 'running';
  });

  const [activeTab, setActiveTab] = useState('overview');

  // Cancel Modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Stale-While-Revalidate: Đồng bộ dữ liệu mới nhất từ Backend ngầm trong background
  useEffect(() => {
    let isMounted = true;
    const loadCampaign = async () => {
      if (!resolvedId) return;

      const cacheEntry = campaignDetailCache.get(resolvedId);
      const isFresh = cacheEntry && (Date.now() - cacheEntry.timestamp < 120000); // 2 phút
      if (isFresh) {
        return; // Đã có dữ liệu tươi, hiển thị ngay không reload
      }

      try {
        const [data, rels] = await Promise.all([
          campaignService.getCampaignById(resolvedId).catch(() => null),
          campaignService.getRelationships(resolvedId).catch(() => []),
        ]);

        if (isMounted && data) {
          setRawCampaign(data);
          const mappedUi = mapApiCampaignToUi(data);
          setCampaign(mappedUi);
          const isRunning = data.status === 'ACTIVE' || data.status === 'READY_FOR_DISCOVERY';
          const newStatus = (isRunning ? 'running' : data.status === 'COMPLETED' ? 'completed' : 'draft') as CampaignStatusType;
          setCurrentStatus(newStatus);

          let mappedCreators: CampaignCreatorRow[] = [];
          if (Array.isArray(rels) && rels.length > 0) {
            mappedCreators = rels.map((r: RelationshipDto) => {
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
          }

          // Ghi vào memory cache
          campaignDetailCache.set(resolvedId, {
            rawCampaign: data,
            campaign: mappedUi,
            participatingCreators: mappedCreators,
            currentStatus: newStatus,
            timestamp: Date.now(),
          });
        }
      } catch (err) {
        console.warn('Lỗi khi tải chi tiết chiến dịch:', err);
      }
    };

    loadCampaign();
    return () => {
      isMounted = false;
    };
  }, [resolvedId]);

  const campaignData: Campaign = campaign || {
    id: resolvedId || passedItem?.id || '',
    title: rawCampaign?.name || passedItem?.name || 'Chiến dịch',
    tags: rawCampaign?.niches || passedItem?.niches || ['Nội dung đa dạng'],
    thumbnail: passedItem?.thumbnail || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
    status: currentStatus,
    statusText: currentStatus === 'running' ? 'Đang triển khai' : currentStatus === 'completed' ? 'Đã hoàn thành' : 'Bản nháp',
    creatorsCount: participatingCreators.length || passedItem?.creatorsCount || 0,
    reach: '0',
    reachNumber: 0,
    engagement: '0%',
    engagementNumber: 0,
    spent: rawCampaign?.budgetMax ? `${(rawCampaign.budgetMax / 1_000_000).toFixed(0)}M ₫` : (passedItem?.budgetFormatted || '0 ₫'),
    spentNumber: rawCampaign?.budgetMax || passedItem?.budgetRaw || 0,
    date: rawCampaign?.startDate ? `${new Date(rawCampaign.startDate).toLocaleDateString('vi-VN')} – ${rawCampaign.endDate ? new Date(rawCampaign.endDate).toLocaleDateString('vi-VN') : ''}` : (passedItem?.dateRange || 'Thời gian linh hoạt'),
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
          if (resolvedId) {
            const updated = await campaignService.activateCampaign(resolvedId);
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
          if (resolvedId) {
            const updated = await campaignService.updateStatus(resolvedId, 'COMPLETED');
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
    if (resolvedId) {
      await campaignService.archiveCampaign(resolvedId).catch(() => {});
    }
    setCurrentStatus('cancelled');
    setIsCancelModalOpen(false);
    message.error('Chiến dịch đã được hủy và lưu trữ.');
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'running':
        return (
          <span className="cdetail-status-pill running">
            <span className="pulse-dot" />
            ĐANG TRIỂN KHAI
          </span>
        );
      case 'paused':
        return (
          <span className="cdetail-status-pill draft" style={{ color: '#D97706', borderColor: '#FDE68A', background: '#FEF3C7' }}>
            <PauseCircleOutlined style={{ fontSize: 11 }} />
            TẠM DỪNG
          </span>
        );
      case 'completed':
        return (
          <span className="cdetail-status-pill completed">
            <CheckCircleFilled style={{ fontSize: 11 }} />
            ĐÃ HOÀN THÀNH
          </span>
        );
      case 'cancelled':
        return (
          <span className="cdetail-status-pill draft" style={{ color: '#EF4444', borderColor: '#FECACA', background: '#FEF2F2' }}>
            <StopOutlined style={{ fontSize: 11 }} />
            ĐÃ HỦY
          </span>
        );
      default:
        return (
          <span className="cdetail-status-pill draft">
            <ClockCircleOutlined style={{ fontSize: 11 }} />
            BẢN NHÁP
          </span>
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
        <button
          type="button"
          className="cdetail-back-btn"
          onClick={() => navigate('/campaigns')}
        >
          <ArrowLeftOutlined style={{ fontSize: 11 }} />
          <span>Quay lại danh sách chiến dịch</span>
        </button>
      </div>

      {/* 2. Header Hero Card */}
      <div className="cdetail-header-card">
        <Row justify="space-between" align="middle" gutter={[20, 20]}>
          <Col xs={24} lg={15}>
            <div className="cdetail-title-badge-row">
              {getStatusBadge()}
              <span style={{ color: '#64748B', fontSize: 12.5, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <CalendarOutlined style={{ color: '#94A3B8' }} />
                {campaignData.date}
              </span>
            </div>

            <Title level={2} className="cdetail-main-title">
              {campaignData.title}
            </Title>

            <Space size={8} wrap>
              {/* Objective Tag */}
              {rawCampaign?.objective && (
                <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700, padding: '2px 9px', fontSize: 11.5 }}>
                  🎯 {rawCampaign.objective}
                </Tag>
              )}

              {/* Filtered Niches */}
              {(rawCampaign?.niches || []).map((n) => (
                <Tag key={n} style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 6, fontWeight: 600, color: '#475569', fontSize: 11.5 }}>
                  {n}
                </Tag>
              ))}

              {/* Platforms (Filtered - No YouTube) */}
              {(rawCampaign?.platforms || ['TIKTOK', 'INSTAGRAM'])
                .filter((p) => p.toUpperCase() !== 'YOUTUBE')
                .map((p) => {
                  const isTikTok = p.toUpperCase().includes('TIKTOK');
                  return (
                    <span key={p} className={`platform-chip ${isTikTok ? 'tiktok' : 'instagram'}`}>
                      {isTikTok ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                        </svg>
                      ) : (
                        <InstagramOutlined style={{ fontSize: 11 }} />
                      )}
                      {p}
                    </span>
                  );
                })}
            </Space>
          </Col>

          {/* Action Toolbar */}
          <Col xs={24} lg={9} className="cdetail-action-toolbar">
            <Button
              className="cdetail-action-btn"
              icon={<CompassOutlined style={{ color: '#6366F1' }} />}
              onClick={() => {
                sessionStorage.setItem('current_campaign_id', campaignData.id);
                navigate(`/discovery?campaignId=${campaignData.id}`, { state: { campaignId: campaignData.id } });
              }}
              style={{ borderColor: '#C7D2FE', background: '#EEF2FF', color: '#4F46E5' }}
            >
              Khám phá KOC AI
            </Button>

            <Button
              className="cdetail-action-btn"
              type="primary"
              icon={<ApartmentOutlined />}
              onClick={() => navigate(`/campaign-management/${campaignData.id}`)}
              style={{ background: '#4F46E5', borderColor: '#4F46E5', boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)' }}
            >
              Pipeline Kanban
            </Button>

            {currentStatus === 'draft' && (
              <Button
                className="cdetail-action-btn"
                type="primary"
                icon={<PlayCircleFilled />}
                onClick={handleActivate}
                style={{ background: '#10B981', borderColor: '#10B981' }}
              >
                Kích hoạt
              </Button>
            )}

            {currentStatus === 'running' && (
              <>
                <Button
                  className="cdetail-action-btn"
                  icon={<PauseCircleOutlined />}
                  onClick={handlePause}
                >
                  Tạm dừng
                </Button>
                <Button
                  className="cdetail-action-btn"
                  icon={<CheckCircleFilled />}
                  onClick={handleComplete}
                  style={{ background: '#F8FAFC', color: '#059669', borderColor: '#A7F3D0' }}
                >
                  Hoàn thành
                </Button>
                <Button
                  className="cdetail-action-btn"
                  danger
                  icon={<StopOutlined />}
                  onClick={() => setIsCancelModalOpen(true)}
                >
                  Hủy
                </Button>
              </>
            )}
          </Col>
        </Row>
      </div>

      {/* 3. 4 High-level Stat Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="cdetail-stat-card">
            <div className="cdetail-stat-top">
              <span className="cdetail-stat-label">Ngân sách chiến dịch</span>
              <div className="cdetail-stat-icon-wrap" style={{ background: '#EEF2FF', color: '#6366F1' }}>
                <DollarOutlined />
              </div>
            </div>
            <div>
              <div className="cdetail-stat-value">
                {campaignData.spent}
              </div>
              <Progress percent={45} showInfo={false} strokeColor="#6366F1" trailColor="#F1F5F9" size="small" style={{ margin: '4px 0 8px 0' }} />
            </div>
            <div className="cdetail-stat-footer">
              <span style={{ color: '#64748B' }}>Ngân sách dự kiến tối đa</span>
              <span style={{ color: '#6366F1', fontWeight: 600 }}>45%</span>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="cdetail-stat-card">
            <div className="cdetail-stat-top">
              <span className="cdetail-stat-label">Follower mục tiêu</span>
              <div className="cdetail-stat-icon-wrap" style={{ background: '#F0F9FF', color: '#0284C7' }}>
                <RiseOutlined />
              </div>
            </div>
            <div className="cdetail-stat-value">
              {rawCampaign?.followerMin ? `${(rawCampaign.followerMin / 1000).toFixed(0)}K+` : '50K+'}
            </div>
            <div className="cdetail-stat-footer">
              <span style={{ color: '#059669', fontWeight: 600 }}>Tệp khán giả tối thiểu</span>
              <Tag color="cyan" style={{ border: 'none', borderRadius: 4, margin: 0, fontSize: 11 }}>AI Matched</Tag>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="cdetail-stat-card">
            <div className="cdetail-stat-top">
              <span className="cdetail-stat-label">Mục tiêu tương tác</span>
              <div className="cdetail-stat-icon-wrap" style={{ background: '#FEF3C7', color: '#D97706' }}>
                <ThunderboltFilled />
              </div>
            </div>
            <div className="cdetail-stat-value">
              4.5% - 8.0%
            </div>
            <div className="cdetail-stat-footer">
              <span style={{ color: '#64748B' }}>Chuẩn lọc ghép nối AI</span>
              <Tag color="gold" style={{ border: 'none', borderRadius: 4, margin: 0, fontSize: 11 }}>Chất lượng cao</Tag>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div
            className="cdetail-stat-card clickable"
            onClick={() => setActiveTab('creators')}
            title="Bấm để xem danh sách Creator"
          >
            <div className="cdetail-stat-top">
              <span className="cdetail-stat-label">Creator tham gia</span>
              <div className="cdetail-stat-icon-wrap" style={{ background: '#ECFDF5', color: '#059669' }}>
                <TeamOutlined />
              </div>
            </div>
            <div className="cdetail-stat-value">
              {participatingCreators.length}
              <span className="cdetail-stat-value-unit">người</span>
            </div>
            <div className="cdetail-stat-footer">
              <span style={{ color: '#4F46E5', fontWeight: 600 }}>
                {participatingCreators.length > 0 ? `${participatingCreators.length} người trong pipeline` : 'Chưa thêm creator'}
              </span>
              <span style={{ color: '#94A3B8', fontSize: 12 }}>Xem danh sách →</span>
            </div>
          </div>
        </Col>
      </Row>

      {/* 4. Tab Navigation Content */}
      <Card className="cdetail-content-card" bodyStyle={{ padding: '16px 24px 28px 24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k)}
          size="middle"
          items={[
            {
              key: 'overview',
              label: <span style={{ fontWeight: 600, fontSize: 13.5 }}>Tổng quan & Brief sáng tạo</span>,
              children: (
                <div style={{ marginTop: 14 }}>
                  <Row gutter={[20, 20]}>
                    {/* Left: Tóm tắt Creator Brief */}
                    <Col xs={24} lg={14}>
                      <div className="brief-card">
                        <div className="brief-card-header">
                          <div className="brief-card-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                            <FileTextOutlined />
                          </div>
                          <div>
                            <div className="brief-card-title">Tóm tắt Creator Brief</div>
                            <div className="brief-card-subtitle">Thông tin định hướng và yêu cầu sáng tạo nội dung cho KOC</div>
                          </div>
                        </div>

                        <div className="brief-section-box">
                          <div className="brief-item-title">Mô tả & Thông điệp chiến dịch</div>
                          <div className="brief-quote-text">
                            {rawCampaign?.description || 'Chưa có thông điệp mô tả chi tiết cho chiến dịch này.'}
                          </div>
                        </div>

                        <div className="brief-section-box">
                          <div className="brief-item-title">Sản phẩm / Dịch vụ trọng tâm</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <Tag color="blue" style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, fontWeight: 700 }}>
                              📦 {rawCampaign?.productService || 'Sản phẩm nhãn hàng'}
                            </Tag>
                            {(rawCampaign?.niches || []).map((n) => (
                              <Tag key={n} color="cyan" style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                                {n}
                              </Tag>
                            ))}
                          </div>
                        </div>

                        <div className="brief-section-box">
                          <div className="brief-item-title">Mục tiêu chiến dịch (Objectives)</div>
                          <div style={{ color: '#0F172A', fontSize: 13, fontWeight: 600 }}>
                            🎯 {rawCampaign?.objective || 'Mục tiêu truyền thông đa kênh'}
                          </div>
                        </div>

                        <div className="brief-section-box" style={{ marginBottom: 0 }}>
                          <div className="brief-item-title">Nền tảng ưu tiên</div>
                          <Space size={8} wrap>
                            {(rawCampaign?.platforms || ['TIKTOK', 'INSTAGRAM'])
                              .filter((p) => p.toUpperCase() !== 'YOUTUBE')
                              .map((p) => {
                                const isTikTok = p.toUpperCase().includes('TIKTOK');
                                return (
                                  <span key={p} className={`platform-chip ${isTikTok ? 'tiktok' : 'instagram'}`}>
                                    {isTikTok ? (
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                                      </svg>
                                    ) : (
                                      <InstagramOutlined style={{ fontSize: 11 }} />
                                    )}
                                    {p}
                                  </span>
                                );
                              })}
                          </Space>
                        </div>
                      </div>
                    </Col>

                    {/* Right: Thông tin vận hành chiến dịch */}
                    <Col xs={24} lg={10}>
                      <div className="brief-card">
                        <div className="brief-card-header">
                          <div className="brief-card-icon" style={{ background: '#F0F9FF', color: '#0284C7' }}>
                            <SettingOutlined />
                          </div>
                          <div>
                            <div className="brief-card-title">Thông tin vận hành chiến dịch</div>
                            <div className="brief-card-subtitle">Chi tiết thông số, đối tượng và thời gian triển khai</div>
                          </div>
                        </div>

                        <div className="ops-specs-list">
                          <div className="ops-spec-row">
                            <span className="ops-spec-label">
                              <AimOutlined style={{ color: '#6366F1' }} />
                              Mục tiêu chính
                            </span>
                            <Tag color="purple" style={{ margin: 0, fontWeight: 700, borderRadius: 6 }}>
                              {rawCampaign?.objective || 'Nhận diện thương hiệu'}
                            </Tag>
                          </div>

                          <div className="ops-spec-row">
                            <span className="ops-spec-label">
                              <TagsOutlined style={{ color: '#0EA5E9' }} />
                              Ngành hàng
                            </span>
                            <span className="ops-spec-value">
                              {(rawCampaign?.niches || []).join(', ') || 'Chưa định rõ'}
                            </span>
                          </div>

                          <div className="ops-spec-row">
                            <span className="ops-spec-label">
                              <TeamOutlined style={{ color: '#10B981' }} />
                              Đối tượng khán giả
                            </span>
                            <span className="ops-spec-value">
                              {(rawCampaign?.targetAudiences || []).join(', ') || 'Nữ 18-28, Đại chúng'}
                            </span>
                          </div>

                          <div className="ops-spec-row">
                            <span className="ops-spec-label">
                              <RiseOutlined style={{ color: '#F59E0B' }} />
                              Khoảng Follower
                            </span>
                            <span className="ops-spec-value">
                              {rawCampaign?.followerMin ? `${(rawCampaign.followerMin / 1000).toFixed(0)}K – ${(rawCampaign.followerMax || 0) / 1000}K` : '50K – 1000K'}
                            </span>
                          </div>

                          <div className="ops-spec-row">
                            <span className="ops-spec-label">
                              <CalendarOutlined style={{ color: '#8B5CF6' }} />
                              Thời gian diễn ra
                            </span>
                            <span className="ops-spec-value">
                              {rawCampaign?.startDate ? new Date(rawCampaign.startDate).toLocaleDateString('vi-VN') : '26/10/2026'}
                              {rawCampaign?.endDate ? ` – ${new Date(rawCampaign.endDate).toLocaleDateString('vi-VN')}` : ' – 25/12/2026'}
                            </span>
                          </div>
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: 18 }}>
                          <Button
                            block
                            type="dashed"
                            icon={<EditOutlined />}
                            onClick={() => navigate('/campaigns')}
                            style={{
                              height: 40,
                              borderRadius: 10,
                              fontWeight: 600,
                              color: '#475569',
                              borderColor: '#CBD5E1',
                            }}
                          >
                            Chỉnh sửa chiến dịch
                          </Button>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'creators',
              label: (
                <span style={{ fontWeight: 600, fontSize: 13.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>Creator tham gia</span>
                  <Tag color="purple" style={{ margin: 0, borderRadius: 999, fontWeight: 700, padding: '0 7px', fontSize: 11 }}>
                    {participatingCreators.length}
                  </Tag>
                </span>
              ),
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
                        onClick={() => {
                          localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', resolvedId);
                          navigate('/creators', { state: { campaignId: resolvedId } });
                        }}
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
                        onClick={() => {
                          localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', resolvedId);
                          navigate('/creators', { state: { campaignId: resolvedId } });
                        }}
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
