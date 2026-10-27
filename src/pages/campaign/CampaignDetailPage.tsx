import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Tag,
  Button,
  Tabs,
  Avatar,
  Table,
  Space,
  Modal,
  Input,
  message,
  Timeline,
  Dropdown,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  ArrowLeftOutlined,
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
  EllipsisOutlined,
  RightOutlined,
  CheckOutlined,
  UserOutlined,
  WalletOutlined,
  CopyOutlined,
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
        description: (passedItem as any).description || (passedItem as any).subtitle || 'Ra mắt kem chống nắng dưỡng trắng dành cho mùa hè 2026, tập trung nâng cao nhận thức thương hiệu và giới thiệu sản phẩm đến nhóm khách hàng mục tiêu thông qua các nhà sáng tạo nội dung trên TikTok và YouTube.',
        productService: (passedItem as any).productService || 'Acne Tone-up Daily Sunscreen SPF50+ PA++++',
        objective: ((passedItem as any).objective as any) || 'AWARENESS',
        budgetMin: passedItem.budgetRaw ? Math.round(passedItem.budgetRaw * 0.75) : 50000000,
        budgetMax: passedItem.budgetRaw || 80000000,
        platforms: passedItem.platforms || ['TIKTOK', 'YOUTUBE'],
        niches: passedItem.niches || ['Beauty', 'Skincare', 'Lifestyle'],
        targetAudiences: ['Nữ 18–28', 'Dân văn phòng', 'Học sinh sinh viên'],
        locations: ['Thành phố Hồ Chí Minh', 'Hà Nội'],
        followerMin: 50000,
        followerMax: 1000000,
        startDate: '2026-10-26',
        endDate: '2026-12-25',
        status: (passedItem.status as any) || 'ACTIVE',
        brandId: '',
        createdAt: '2026-10-15T08:00:00.000Z',
      };
    }
    return null;
  });

  const [campaign, setCampaign] = useState<Campaign | null>(() => {
    if (cached) return cached.campaign;
    if (passedItem) {
      return {
        id: passedItem.id || resolvedId,
        title: passedItem.name || 'Summer Glow 2026 - Kem Chống Nắng Dưỡng Trắng',
        tags: passedItem.niches || ['AWARENESS', 'TikTok', 'YouTube', 'Beauty', 'Skincare', 'Lifestyle'],
        thumbnail: passedItem.thumbnail || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
        status: passedItem.status === 'COMPLETED' ? 'completed' : (passedItem.status === 'DRAFT' ? 'draft' : 'running'),
        statusText: passedItem.statusText || 'Đang chạy',
        creatorsCount: passedItem.creatorsCount || 3,
        reach: '50K+',
        reachNumber: 50000,
        engagement: '4.5% – 8.0%',
        engagementNumber: 6.2,
        spent: passedItem.budgetFormatted || '80.000.000 đ',
        spentNumber: passedItem.budgetRaw || 80000000,
        date: passedItem.dateRange || '26/10/2026 – 25/12/2026',
      };
    }
    return null;
  });

  const [participatingCreators, setParticipatingCreators] = useState<CampaignCreatorRow[]>(() => {
    if (cached) return cached.participatingCreators;
    return [
      {
        id: 'creator_1',
        name: 'Châu Bùi',
        username: '@chaubui_',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        platform: 'tiktok',
        followers: '1.2M',
        fee: '20.000.000 đ',
        stageText: 'Đã xác nhận',
        stageColor: '#10B981',
        deliverableStatus: 'Đã ký HĐ',
        deliverableColor: 'green',
      },
      {
        id: 'creator_2',
        name: 'Minh Khoa',
        username: '@minhkhoaa',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
        platform: 'tiktok',
        followers: '680K',
        fee: '10.000.000 đ',
        stageText: 'Đã mời',
        stageColor: '#F59E0B',
        deliverableStatus: 'Chờ phản hồi',
        deliverableColor: 'gold',
      },
      {
        id: 'creator_3',
        name: 'Lan Le',
        username: '@lanle.official',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
        platform: 'instagram',
        followers: '950K',
        fee: '6.000.000 đ',
        stageText: 'Đang trao đổi',
        stageColor: '#3B82F6',
        deliverableStatus: 'Đàm phán phí',
        deliverableColor: 'blue',
      },
    ];
  });

  const [currentStatus, setCurrentStatus] = useState<CampaignStatusType>(() => {
    if (cached) return cached.currentStatus;
    if (passedItem?.status === 'COMPLETED') return 'completed';
    if (passedItem?.status === 'DRAFT') return 'draft';
    return 'running';
  });

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch dữ liệu từ API chạy nền để giữ view mượt mà
  useEffect(() => {
    if (!resolvedId) return;

    let isMounted = true;
    const loadCampaign = async () => {
      try {
        const data = await campaignService.getCampaignById(resolvedId);
        if (data && isMounted) {
          setRawCampaign(data);
          const mappedUi = mapApiCampaignToUi(data);
          setCampaign(mappedUi);

          let newStatus: CampaignStatusType = 'running';
          if (data.status === 'COMPLETED') newStatus = 'completed';
          else if (data.status === 'DRAFT') newStatus = 'draft';
          else if (data.status === 'ARCHIVED') newStatus = 'cancelled';
          setCurrentStatus(newStatus);

          // Tải danh sách KOC từ Pipeline Relationship
          let rels: RelationshipDto[] = [];
          try {
            rels = await campaignService.getRelationships(resolvedId);
          } catch {
            rels = [];
          }

          if (isMounted && rels && rels.length > 0) {
            const mappedCreators: CampaignCreatorRow[] = rels.map((r: any, idx) => ({
              id: r.id || `rel_${idx}`,
              name: r.creatorName || `Creator #${idx + 1}`,
              username: r.creatorUsername ? `@${r.creatorUsername.replace('@', '')}` : `@creator_${idx + 1}`,
              avatar: r.creatorAvatar || `https://images.unsplash.com/photo-${1534528741775 + idx * 100}?w=100&auto=format&fit=crop&q=80`,
              platform: (r.platform?.toLowerCase() as any) || 'tiktok',
              followers: r.followersCount ? `${(r.followersCount / 1000).toFixed(0)}K` : '50K+',
              fee: r.agreedFee ? `${r.agreedFee.toLocaleString('vi-VN')} ₫` : 'Thỏa thuận',
              stageText: r.stage || 'Đang kết nối',
              stageColor: (r.stage === 'CONFIRMED' || (r.stage as any) === 'COMPLETED') ? '#10B981' : '#6366F1',
              deliverableStatus: r.deliverableStatus || 'Đang thực hiện',
              deliverableColor: r.deliverableStatus === 'APPROVED' ? 'green' : 'blue',
            }));
            setParticipatingCreators(mappedCreators);
          }

          // Ghi vào memory cache
          campaignDetailCache.set(resolvedId, {
            rawCampaign: data,
            campaign: mappedUi,
            participatingCreators,
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

  const campaignTitle = rawCampaign?.name || passedItem?.name || 'Summer Glow 2026 - Kem Chống Nắng Dưỡng Trắng';
  const campaignBudgetFormatted = rawCampaign?.budgetMax ? `${rawCampaign.budgetMax.toLocaleString('vi-VN')} đ` : (passedItem?.budgetFormatted || '80.000.000 đ');

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
      okButtonProps: { style: { background: '#4F46E5', borderColor: '#4F46E5' } },
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

  // Menu More actions
  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Chỉnh sửa thông tin chiến dịch',
      icon: <EditOutlined />,
      onClick: () => navigate('/campaigns'),
    },
    {
      key: 'duplicate',
      label: 'Nhân bản chiến dịch',
      icon: <CopyOutlined />,
      onClick: () => message.info('Tính năng nhân bản đang được kích hoạt'),
    },
    {
      type: 'divider',
    },
    {
      key: 'archive',
      label: 'Lưu trữ chiến dịch',
      danger: true,
      onClick: () => setIsCancelModalOpen(true),
    },
  ];

  // Creator Table Columns for Tab "Creator tham gia"
  const creatorColumns: ColumnsType<CampaignCreatorRow> = [
    {
      title: 'Creator / KOC',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar src={record.avatar} size={40} />
          <div>
            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{record.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Nền tảng',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform) => {
        const isTikTok = platform === 'tiktok';
        return (
          <span className={`cdetail-platform-badge ${isTikTok ? 'tiktok' : ''}`}>
            {isTikTok ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
              </svg>
            ) : (
              <InstagramOutlined style={{ fontSize: 12, color: '#E1306C' }} />
            )}
            {platform.toUpperCase()}
          </span>
        );
      },
    },
    {
      title: 'Followers',
      dataIndex: 'followers',
      key: 'followers',
      render: (val) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{val}</span>,
    },
    {
      title: 'Chi phí thỏa thuận',
      dataIndex: 'fee',
      key: 'fee',
      render: (val) => <span style={{ fontWeight: 700, color: '#4F46E5' }}>{val}</span>,
    },
    {
      title: 'Giai đoạn Pipeline',
      dataIndex: 'stageText',
      key: 'stageText',
      render: (text) => (
        <span className="cdetail-creator-status confirmed">{text}</span>
      ),
    },
    {
      title: 'Nội dung Deliverables',
      dataIndex: 'deliverableStatus',
      key: 'deliverableStatus',
      render: (text, record) => <Tag color={record.deliverableColor}>{text}</Tag>,
    },
  ];

  return (
    <div className="campaign-detail-container">
      {/* ==========================================================================
          1. Luxury Travertine Hero Banner
          ========================================================================== */}
      <div className="cdetail-hero-banner">
        {/* Banner Top Row: Back button & Slogan */}
        <div className="cdetail-hero-top-row">
          <button
            type="button"
            className="cdetail-back-pill"
            onClick={() => navigate('/campaigns')}
          >
            <ArrowLeftOutlined style={{ fontSize: 12 }} />
            Quay lại danh sách
          </button>

          <div className="cdetail-hero-slogan">
            Glow Confidently Everyday
          </div>
        </div>

        {/* Banner Middle Content: Status, Title, Tags */}
        <div className="cdetail-hero-meta">
          <div className="cdetail-hero-badge-row">
            <span className={`cdetail-hero-status-tag ${currentStatus}`}>
              {currentStatus === 'running'
                ? 'ĐANG CHẠY'
                : currentStatus === 'paused'
                ? 'TẠM DỪNG'
                : currentStatus === 'completed'
                ? 'HOÀN THÀNH'
                : 'BẢN NHÁP'}
            </span>
            <span className="cdetail-hero-date">
              {rawCampaign?.startDate
                ? new Date(rawCampaign.startDate).toLocaleDateString('vi-VN')
                : '26/10/2026'}
            </span>
          </div>

          <h1 className="cdetail-hero-title">
            {campaignTitle}
          </h1>

          <div className="cdetail-hero-tags-row">
            <span className="cdetail-hero-tag highlight">
              {rawCampaign?.objective || 'AWARENESS'}
            </span>
            <span className="cdetail-hero-tag">TikTok</span>
            <span className="cdetail-hero-tag">YouTube</span>
            {(rawCampaign?.niches || ['Beauty', 'Skincare', 'Lifestyle']).map((n) => (
              <span key={n} className="cdetail-hero-tag">
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* Banner Bottom Row: Action Toolbar */}
        <div className="cdetail-hero-actions-row">
          {/* Dropdown More */}
          <Dropdown menu={{ items: moreMenuItems }} trigger={['click']} placement="bottomRight">
            <button type="button" className="cdetail-hero-btn icon-only" title="Tùy chọn khác">
              <EllipsisOutlined style={{ fontSize: 18 }} />
            </button>
          </Dropdown>

          {/* Pause / Resume button */}
          {currentStatus === 'running' && (
            <button
              type="button"
              className="cdetail-hero-btn"
              onClick={handlePause}
            >
              <PauseCircleOutlined style={{ fontSize: 14 }} />
              Tạm dừng
            </button>
          )}

          {currentStatus === 'paused' && (
            <button
              type="button"
              className="cdetail-hero-btn"
              onClick={handleResume}
            >
              <PlayCircleFilled style={{ fontSize: 14, color: '#10B981' }} />
              Tiếp tục
            </button>
          )}

          {currentStatus === 'draft' && (
            <button
              type="button"
              className="cdetail-hero-btn primary"
              onClick={handleActivate}
            >
              <PlayCircleFilled style={{ fontSize: 14 }} />
              Kích hoạt
            </button>
          )}

          {/* Complete button */}
          {currentStatus !== 'completed' && (
            <button
              type="button"
              className="cdetail-hero-btn primary"
              onClick={handleComplete}
            >
              <CheckOutlined style={{ fontSize: 14 }} />
              Hoàn thành
            </button>
          )}

          {/* Cancel button */}
          {currentStatus !== 'cancelled' && (
            <button
              type="button"
              className="cdetail-hero-btn danger-outline"
              onClick={() => setIsCancelModalOpen(true)}
            >
              <StopOutlined style={{ fontSize: 13 }} />
              Hủy chiến dịch
            </button>
          )}

          {/* AI Discovery Button */}
          <button
            type="button"
            className="cdetail-hero-btn ai-discovery"
            onClick={() => {
              const cId = resolvedId || 'camp_sg2026';
              sessionStorage.setItem('current_campaign_id', cId);
              navigate(`/discovery?campaignId=${cId}`, { state: { campaignId: cId } });
            }}
          >
            <CompassOutlined style={{ fontSize: 14 }} />
            Khám phá KOC AI
          </button>

          {/* Pipeline Kanban */}
          <button
            type="button"
            className="cdetail-hero-btn dark-outline"
            onClick={() => navigate(`/campaign-management/${resolvedId || 'default'}`)}
          >
            <ApartmentOutlined style={{ fontSize: 14 }} />
            Pipeline Kanban
          </button>
        </div>
      </div>

      {/* ==========================================================================
          2. 4 Metric KPI Cards Row
          ========================================================================== */}
      <div className="cdetail-metrics-grid">
        {/* Card 1: Ngân sách dự kiến */}
        <div className="cdetail-metric-card">
          <div className="cdetail-metric-top">
            <div className="cdetail-metric-icon-box" style={{ background: '#EEF2FF', color: '#6366F1' }}>
              <WalletOutlined />
            </div>
            <span className="cdetail-metric-title">Ngân sách dự kiến</span>
          </div>
          <div>
            <div className="cdetail-metric-value">{campaignBudgetFormatted}</div>
            <div className="cdetail-metric-progress-wrap">
              <div className="cdetail-metric-progress-bar">
                <div className="cdetail-metric-progress-fill" style={{ width: '45%' }} />
              </div>
              <span className="cdetail-metric-progress-label">45%</span>
            </div>
          </div>
          <div className="cdetail-metric-footer">
            <span>Đã phân bổ: 36.000.000 đ</span>
          </div>
        </div>

        {/* Card 2: Follower mục tiêu */}
        <div className="cdetail-metric-card">
          <div className="cdetail-metric-top">
            <div className="cdetail-metric-icon-box" style={{ background: '#F3E8FF', color: '#7C3AED' }}>
              <TeamOutlined />
            </div>
            <span className="cdetail-metric-title">Follower mục tiêu</span>
          </div>
          <div className="cdetail-metric-mid-row">
            <div className="cdetail-metric-value">
              {rawCampaign?.followerMin ? `${(rawCampaign.followerMin / 1000).toFixed(0)}K+` : '50K+'}
            </div>
            <div className="cdetail-sparkline-bars">
              <div className="cdetail-sparkline-bar" style={{ height: '35%' }} />
              <div className="cdetail-sparkline-bar" style={{ height: '50%' }} />
              <div className="cdetail-sparkline-bar" style={{ height: '65%' }} />
              <div className="cdetail-sparkline-bar" style={{ height: '85%' }} />
              <div className="cdetail-sparkline-bar" style={{ height: '100%' }} />
            </div>
          </div>
          <div className="cdetail-metric-footer">
            <span>Yêu cầu tệp khán giả chất lượng</span>
          </div>
        </div>

        {/* Card 3: Mục tiêu tương tác */}
        <div className="cdetail-metric-card">
          <div className="cdetail-metric-top">
            <div className="cdetail-metric-icon-box" style={{ background: '#E0F2FE', color: '#0284C7' }}>
              <RiseOutlined />
            </div>
            <span className="cdetail-metric-title">Mục tiêu tương tác</span>
          </div>
          <div className="cdetail-metric-mid-row">
            <div className="cdetail-metric-value">4.5% – 8.0%</div>
            <svg className="cdetail-wave-sparkline" viewBox="0 0 65 24" fill="none">
              <path
                d="M1 18 C12 18, 16 6, 26 12 C36 18, 42 4, 52 10 C58 14, 61 8, 64 6"
                stroke="#818CF8"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <div className="cdetail-metric-footer">
            <span>Tiêu chuẩn lọc ghép nối AI</span>
          </div>
        </div>

        {/* Card 4: Creator tham gia */}
        <div
          className="cdetail-metric-card"
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveTab('creators')}
        >
          <div className="cdetail-metric-top">
            <div className="cdetail-metric-icon-box" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
              <UserOutlined />
            </div>
            <span className="cdetail-metric-title">Creator tham gia</span>
          </div>
          <div className="cdetail-metric-mid-row">
            <div className="cdetail-metric-value">
              {participatingCreators.length} / ∞
            </div>
            <RightOutlined style={{ fontSize: 14, color: '#94A3B8' }} />
          </div>
          <div className="cdetail-metric-footer">
            <div className="cdetail-avatar-stack">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                alt="Châu Bùi"
              />
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&auto=format&fit=crop&q=80"
                alt="Minh Khoa"
              />
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80"
                alt="Lan Le"
              />
              <div className="avatar-more">+</div>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================================================
          3. Main 2-Column Section (70% Left / 30% Right)
          ========================================================================== */}
      <div className="cdetail-main-layout">
        {/* Left Column (70%) */}
        <div className="cdetail-left-col">
          {/* Underline Tabs Header */}
          <div className="cdetail-tabs-bar">
            <button
              type="button"
              className={`cdetail-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Tổng quan
            </button>
            <button
              type="button"
              className={`cdetail-tab-btn ${activeTab === 'creators' ? 'active' : ''}`}
              onClick={() => setActiveTab('creators')}
            >
              Creator tham gia ({participatingCreators.length})
            </button>
            <button
              type="button"
              className={`cdetail-tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
              onClick={() => setActiveTab('budget')}
            >
              Phân bổ ngân sách
            </button>
            <button
              type="button"
              className={`cdetail-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              Mốc thời gian (Timeline)
            </button>
            <button
              type="button"
              className={`cdetail-tab-btn ${activeTab === 'guidelines' ? 'active' : ''}`}
              onClick={() => setActiveTab('guidelines')}
            >
              Tệp yêu cầu & Hướng dẫn
            </button>
          </div>

          {/* TAB 1: TỔNG QUAN (Exact Match to Mockup Image 1) */}
          {activeTab === 'overview' && (
            <>
              {/* Row 1: Two-Card Grid */}
              <div className="cdetail-brief-grid">
                {/* Left Subcard: Tóm tắt chiến dịch */}
                <div className="cdetail-subcard">
                  <div className="cdetail-subcard-header">
                    <span className="cdetail-subcard-title">Tóm tắt chiến dịch</span>
                    <button
                      type="button"
                      className="cdetail-subcard-action-btn"
                      onClick={() => navigate('/campaigns')}
                    >
                      <EditOutlined style={{ fontSize: 12 }} />
                      Chỉnh sửa
                    </button>
                  </div>

                  <p className="cdetail-brief-desc">
                    {rawCampaign?.description ||
                      'Ra mắt kem chống nắng dưỡng trắng dành cho mùa hè 2026, tập trung nâng cao nhận thức thương hiệu và giới thiệu sản phẩm đến nhóm khách hàng mục tiêu thông qua các nhà sáng tạo nội dung trên TikTok và YouTube.'}
                  </p>

                  {/* Sản phẩm / dịch vụ trọng tâm */}
                  <div className="cdetail-bullet-group">
                    <span className="cdetail-bullet-title">Sản phẩm / Dịch vụ trọng tâm</span>
                    <div className="cdetail-product-box">
                      <img
                        src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&auto=format&fit=crop&q=80"
                        alt="Product"
                        className="cdetail-product-img"
                      />
                      <div className="cdetail-product-info">
                        <span className="cdetail-product-name">
                          {rawCampaign?.productService || 'Acne Tone-up Daily Sunscreen SPF50+ PA++++'}
                        </span>
                        <div className="cdetail-product-tags">
                          <span className="cdetail-product-tag">BEAUTY</span>
                          <span className="cdetail-product-tag">LIFESTYLE</span>
                          <span className="cdetail-product-tag">SKINCARE</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mục tiêu chiến dịch */}
                  <div className="cdetail-bullet-group">
                    <span className="cdetail-bullet-title">Mục tiêu chiến dịch</span>
                    <div className="cdetail-bullet-item">Tăng nhận diện thương hiệu</div>
                    <div className="cdetail-bullet-item">Giới thiệu sản phẩm mới</div>
                    <div className="cdetail-bullet-item">Thúc đẩy tìm hiểu & cân nhắc mua hàng</div>
                  </div>

                  {/* Nền tảng ưu tiên */}
                  <div className="cdetail-bullet-group">
                    <span className="cdetail-bullet-title">Nền tảng ưu tiên</span>
                    <div className="cdetail-platform-badges">
                      <span className="cdetail-platform-badge tiktok">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                        </svg>
                        TikTok
                      </span>
                      <span className="cdetail-platform-badge youtube">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                        YouTube
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Subcard: Thông tin vận hành */}
                <div className="cdetail-subcard">
                  <div className="cdetail-subcard-header">
                    <span className="cdetail-subcard-title">Thông tin vận hành</span>
                    <Dropdown menu={{ items: moreMenuItems }} trigger={['click']}>
                      <button type="button" className="cdetail-subcard-action-btn" title="Thao tác">
                        <EllipsisOutlined />
                      </button>
                    </Dropdown>
                  </div>

                  <div className="cdetail-ops-list">
                    <div className="cdetail-ops-row">
                      <span className="cdetail-ops-label">Trạng thái</span>
                      <span className="cdetail-ops-value">
                        <span className="cdetail-status-dot" />
                        Đang triển khai
                      </span>
                    </div>

                    <div className="cdetail-ops-row">
                      <span className="cdetail-ops-label">Ngành hàng</span>
                      <span className="cdetail-ops-value">
                        {(rawCampaign?.niches || ['Beauty', 'Lifestyle', 'Skincare']).join(', ')}
                      </span>
                    </div>

                    <div className="cdetail-ops-row">
                      <span className="cdetail-ops-label">Đối tượng khán giả</span>
                      <span className="cdetail-ops-value">
                        {(rawCampaign?.targetAudiences || ['Nữ 18–28', 'Dân văn phòng', 'Học sinh sinh viên']).join(', ')}
                      </span>
                    </div>

                    <div className="cdetail-ops-row">
                      <span className="cdetail-ops-label">Khoảng follower</span>
                      <span className="cdetail-ops-value">
                        {rawCampaign?.followerMin ? `${(rawCampaign.followerMin / 1000).toFixed(0)}K – ${(rawCampaign.followerMax || 1000000) / 1000}K` : '50K – 1000K'}
                      </span>
                    </div>

                    <div className="cdetail-ops-row">
                      <span className="cdetail-ops-label">Thời gian diễn ra</span>
                      <span className="cdetail-ops-value">
                        {rawCampaign?.startDate ? new Date(rawCampaign.startDate).toLocaleDateString('vi-VN') : '26/10/2026'} – {rawCampaign?.endDate ? new Date(rawCampaign.endDate).toLocaleDateString('vi-VN') : '25/12/2026'}
                      </span>
                    </div>

                    <div className="cdetail-ops-row">
                      <span className="cdetail-ops-label">Người phụ trách</span>
                      <span className="cdetail-ops-value">
                        <Avatar
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=80"
                          size={22}
                        />
                        Châu Bùi
                      </span>
                    </div>

                    <div className="cdetail-ops-row">
                      <span className="cdetail-ops-label">Ngày tạo</span>
                      <span className="cdetail-ops-value">
                        {rawCampaign?.createdAt ? new Date(rawCampaign.createdAt).toLocaleDateString('vi-VN') : '15/10/2026'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Lower Section - Creator tham gia (3) */}
              <div className="cdetail-creators-section">
                <div className="cdetail-creators-header">
                  <span className="cdetail-creators-title">Creator tham gia (3)</span>
                  <span
                    className="cdetail-creators-link"
                    onClick={() => setActiveTab('creators')}
                  >
                    Quản lý →
                  </span>
                </div>

                <div className="cdetail-creator-cards-grid">
                  {/* Creator Card 1: Châu Bùi */}
                  <div className="cdetail-creator-card">
                    <div className="cdetail-creator-top">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                        alt="Châu Bùi"
                        className="cdetail-creator-avatar"
                      />
                      <div className="cdetail-creator-meta">
                        <div className="cdetail-creator-name-row">
                          <span className="cdetail-creator-name">Châu Bùi</span>
                        </div>
                        <span className="cdetail-creator-handle">@chaubui_...</span>
                        <div className="cdetail-creator-platforms">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#000000">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                          </svg>
                          <InstagramOutlined style={{ fontSize: 13, color: '#E1306C' }} />
                        </div>
                      </div>
                      <span className="cdetail-creator-status confirmed">Đã xác nhận</span>
                      <EllipsisOutlined style={{ fontSize: 16, color: '#94A3B8', cursor: 'pointer' }} />
                    </div>

                    <div className="cdetail-creator-metrics-row">
                      <div className="cdetail-creator-metric-col">
                        <span className="cdetail-creator-metric-num">1.2M</span>
                        <span className="cdetail-creator-metric-lbl">Followers</span>
                      </div>
                      <div className="cdetail-creator-metric-col">
                        <span className="cdetail-creator-metric-num">4.8%</span>
                        <span className="cdetail-creator-metric-lbl">Engagement</span>
                      </div>
                      <div className="cdetail-creator-metric-col">
                        <span className="cdetail-creator-metric-num">120M</span>
                        <span className="cdetail-creator-metric-lbl">Lượt xem TB</span>
                      </div>
                    </div>
                  </div>

                  {/* Creator Card 2: Minh Khoa */}
                  <div className="cdetail-creator-card">
                    <div className="cdetail-creator-top">
                      <img
                        src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80"
                        alt="Minh Khoa"
                        className="cdetail-creator-avatar"
                      />
                      <div className="cdetail-creator-meta">
                        <div className="cdetail-creator-name-row">
                          <span className="cdetail-creator-name">Minh Khoa</span>
                        </div>
                        <span className="cdetail-creator-handle">@minhkhoaa</span>
                        <div className="cdetail-creator-platforms">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#000000">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                          </svg>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="#DC2626">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                        </div>
                      </div>
                      <span className="cdetail-creator-status invited">Đã mời</span>
                      <EllipsisOutlined style={{ fontSize: 16, color: '#94A3B8', cursor: 'pointer' }} />
                    </div>

                    <div className="cdetail-creator-metrics-row">
                      <div className="cdetail-creator-metric-col">
                        <span className="cdetail-creator-metric-num">680K</span>
                        <span className="cdetail-creator-metric-lbl">Followers</span>
                      </div>
                      <div className="cdetail-creator-metric-col">
                        <span className="cdetail-creator-metric-num">5.1%</span>
                        <span className="cdetail-creator-metric-lbl">Engagement</span>
                      </div>
                      <div className="cdetail-creator-metric-col">
                        <span className="cdetail-creator-metric-num">45M</span>
                        <span className="cdetail-creator-metric-lbl">Lượt xem TB</span>
                      </div>
                    </div>
                  </div>

                  {/* Creator Card 3: Lan Le */}
                  <div className="cdetail-creator-card">
                    <div className="cdetail-creator-top">
                      <img
                        src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80"
                        alt="Lan Le"
                        className="cdetail-creator-avatar"
                      />
                      <div className="cdetail-creator-meta">
                        <div className="cdetail-creator-name-row">
                          <span className="cdetail-creator-name">Lan Le</span>
                        </div>
                        <span className="cdetail-creator-handle">@lanle.official</span>
                        <div className="cdetail-creator-platforms">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#000000">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                          </svg>
                          <InstagramOutlined style={{ fontSize: 13, color: '#E1306C' }} />
                        </div>
                      </div>
                      <span className="cdetail-creator-status negotiating">Đang trao đổi</span>
                      <EllipsisOutlined style={{ fontSize: 16, color: '#94A3B8', cursor: 'pointer' }} />
                    </div>

                    <div className="cdetail-creator-metrics-row">
                      <div className="cdetail-creator-metric-col">
                        <span className="cdetail-creator-metric-num">950K</span>
                        <span className="cdetail-creator-metric-lbl">Followers</span>
                      </div>
                      <div className="cdetail-creator-metric-col">
                        <span className="cdetail-creator-metric-num">3.9%</span>
                        <span className="cdetail-creator-metric-lbl">Engagement</span>
                      </div>
                      <div className="cdetail-creator-metric-col">
                        <span className="cdetail-creator-metric-num">60M</span>
                        <span className="cdetail-creator-metric-lbl">Lượt xem TB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: CREATOR THAM GIA (Full Table View) */}
          {activeTab === 'creators' && (
            <div className="cdetail-subcard">
              <div className="cdetail-subcard-header">
                <div>
                  <span className="cdetail-subcard-title">Danh sách Creator tham gia</span>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Quản lý thông tin, hợp đồng và tiến độ deliverables của từng Influencer
                  </div>
                </div>
                <Space>
                  <Button
                    type="primary"
                    icon={<CompassOutlined />}
                    style={{ background: '#4F46E5', borderRadius: 8 }}
                    onClick={() => {
                      sessionStorage.setItem('current_campaign_id', resolvedId);
                      navigate(`/discovery?campaignId=${resolvedId}`);
                    }}
                  >
                    Tìm thêm Creator bằng AI
                  </Button>
                </Space>
              </div>

              <Table
                columns={creatorColumns}
                dataSource={participatingCreators}
                rowKey="id"
                pagination={false}
                style={{ marginTop: 12 }}
              />
            </div>
          )}

          {/* TAB 3: PHÂN BỔ NGÂN SÁCH */}
          {activeTab === 'budget' && (
            <div className="cdetail-subcard">
              <span className="cdetail-subcard-title">Phân bổ ngân sách chi tiết</span>
              <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                <Col xs={24} md={8}>
                  <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ color: '#64748B', fontSize: 12 }}>Ngân sách kế hoạch</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                      {campaignBudgetFormatted}
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ color: '#64748B', fontSize: 12 }}>Đã cam kết chi trả</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#4F46E5', marginTop: 4 }}>
                      36.000.000 đ
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ color: '#64748B', fontSize: 12 }}>Hạn mức còn lại</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 4 }}>
                      44.000.000 đ
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {/* TAB 4: MỐC THỜI GIAN (TIMELINE) */}
          {activeTab === 'timeline' && (
            <div className="cdetail-subcard">
              <span className="cdetail-subcard-title">Mốc thời gian (Timeline) chiến dịch</span>
              <div style={{ marginTop: 16, maxWidth: 640 }}>
                <Timeline
                  items={[
                    {
                      color: 'green',
                      children: (
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>Khởi tạo chiến dịch</div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>
                            15/10/2026 • Đã thiết lập thông số & tiêu chí ghép nối AI
                          </div>
                        </div>
                      ),
                    },
                    {
                      color: 'blue',
                      children: (
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>Kích hoạt & Gửi lời mời KOC</div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>
                            26/10/2026 • Đang triển khai gửi brief và liên hệ Creator
                          </div>
                        </div>
                      ),
                    },
                    {
                      color: 'gray',
                      children: (
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>Hoàn tất & Nghiệm thu KPI</div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>
                            25/12/2026 • Dự kiến đánh giá kết quả và tổng kết báo cáo
                          </div>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* TAB 5: TỆP YÊU CẦU & HƯỚNG DẪN */}
          {activeTab === 'guidelines' && (
            <div className="cdetail-subcard">
              <span className="cdetail-subcard-title">Tệp yêu cầu & Hướng dẫn (Creative Brief)</span>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>Quy định gắn hashtag bắt buộc</div>
                  <div style={{ fontSize: 12.5, color: '#4F46E5', fontWeight: 600, marginTop: 4 }}>
                    #SummerGlow2026 #SunscreenReview #SkincareRoutine #KemChongNang
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>Key Messages (Thông điệp chính)</div>
                  <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4 }}>
                    Kem chống nắng nâng tone tự nhiên không gây nhờn rít, bảo vệ quang phổ rộng SPF50+ PA++++ suốt ngày dài năng động.
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>Yêu cầu kiểm duyệt nội dung</div>
                  <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4 }}>
                    KOC cần gửi kịch bản trước khi quay 3 ngày và gửi video thô trước khi đăng tải 48 giờ để nhãn hàng duyệt.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (30%) */}
        <div className="cdetail-right-col">
          {/* Sidebar Card 1: Tiến độ tổng thể */}
          <div className="cdetail-sidebar-card">
            <div className="cdetail-sidebar-header">
              <span className="cdetail-sidebar-title">Tiến độ tổng thể</span>
            </div>

            <div className="cdetail-donut-wrap">
              <div className="cdetail-donut-chart">
                <svg width="130" height="130" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#EEF2FF"
                    strokeWidth="11"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#6366F1"
                    strokeWidth="11"
                    strokeDasharray={`${45 * 2.513} ${100 * 2.513}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <span className="cdetail-donut-center-text">45%</span>
              </div>

              <div className="cdetail-donut-legend">
                <div className="cdetail-donut-legend-item">
                  <span>
                    <span className="cdetail-donut-dot" style={{ background: '#6366F1' }} />
                    Đã phân bổ
                  </span>
                  <span className="cdetail-donut-legend-val">36.000.000 đ</span>
                </div>
                <div className="cdetail-donut-legend-item">
                  <span>
                    <span className="cdetail-donut-dot" style={{ background: '#EEF2FF', border: '1px solid #CBD5E1' }} />
                    Còn lại
                  </span>
                  <span className="cdetail-donut-legend-val">44.000.000 đ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Card 2: Việc cần xử lý (4) */}
          <div className="cdetail-sidebar-card">
            <div className="cdetail-sidebar-header">
              <div className="cdetail-sidebar-title">
                Việc cần xử lý
                <span className="cdetail-count-badge">4</span>
              </div>
              <span
                className="cdetail-sidebar-link"
                onClick={() => navigate('/crm')}
              >
                Xem tất cả →
              </span>
            </div>

            <div className="cdetail-tasks-list">
              {/* Task 1 */}
              <div
                className="cdetail-task-item"
                onClick={() => navigate('/crm')}
              >
                <div className="cdetail-task-icon-box" style={{ background: '#EEF2FF', color: '#6366F1' }}>
                  <FileTextOutlined />
                </div>
                <div className="cdetail-task-content">
                  <span className="cdetail-task-title">2 lời mời chờ phản hồi</span>
                  <span className="cdetail-task-sub">Summer Glow 2026</span>
                </div>
                <span className="cdetail-task-time">10 phút trước</span>
              </div>

              {/* Task 2 */}
              <div
                className="cdetail-task-item"
                onClick={() => navigate('/collaboration')}
              >
                <div className="cdetail-task-icon-box" style={{ background: '#FEE2E2', color: '#EF4444' }}>
                  <PlayCircleFilled />
                </div>
                <div className="cdetail-task-content">
                  <span className="cdetail-task-title">1 creator gửi nội dung xem xét</span>
                  <span className="cdetail-task-sub">Beauty Routine Challenge</span>
                </div>
                <span className="cdetail-task-time">2 giờ trước</span>
              </div>

              {/* Task 3 */}
              <div
                className="cdetail-task-item"
                onClick={() => setActiveTab('budget')}
              >
                <div className="cdetail-task-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
                  <CheckCircleFilled />
                </div>
                <div className="cdetail-task-content">
                  <span className="cdetail-task-title">Cần duyệt ngân sách</span>
                  <span className="cdetail-task-sub">Skincare Launch 2025</span>
                </div>
                <span className="cdetail-task-time">5 giờ trước</span>
              </div>

              {/* Task 4 */}
              <div
                className="cdetail-task-item"
                onClick={() => navigate('/performance')}
              >
                <div className="cdetail-task-icon-box" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                  <RiseOutlined />
                </div>
                <div className="cdetail-task-content">
                  <span className="cdetail-task-title">1 báo cáo chiến dịch mới</span>
                  <span className="cdetail-task-sub">Tech Product Review</span>
                </div>
                <span className="cdetail-task-time">1 ngày trước</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
            Bạn có chắc chắn muốn hủy chiến dịch <strong>{campaignTitle}</strong>? Thao tác này sẽ đóng băng mọi hoạt động hợp tác và lưu trữ chiến dịch.
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
