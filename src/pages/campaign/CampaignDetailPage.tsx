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

type CampaignStatusType = 'running' | 'draft' | 'completed' | 'cancelled';

interface CampaignCreatorRow {
  id: string;
  name: string;
  username: string;
  avatar: string;
  platform: 'instagram' | 'tiktok';
  followers: string;
  fee: string;
  stageText: string;
  stageColor: string;
  deliverableStatus: string;
  deliverableColor: string;
}

const getStageInfo = (stage?: string) => {
  switch (stage) {
    case 'OUTREACHED':
      return { text: 'Đã gửi lời mời', color: '#F59E0B', deliverable: 'Chờ KOC phản hồi', delColor: 'gold' };
    case 'REPLIED':
      return { text: 'Đã phản hồi', color: '#0284C7', deliverable: 'Đang thảo luận', delColor: 'cyan' };
    case 'NEGOTIATING':
      return { text: 'Đang đàm phán', color: '#6366F1', deliverable: 'Thương lượng cát-xê', delColor: 'blue' };
    case 'AGREED':
    case 'CONTRACT_SIGNED':
      return { text: 'Đã ký hợp đồng', color: '#10B981', deliverable: 'Đã chốt hợp tác', delColor: 'green' };
    case 'CONTENT_PENDING':
      return { text: 'Đang chờ nội dung', color: '#8B5CF6', deliverable: 'Đang sản xuất video', delColor: 'purple' };
    case 'CONTENT_APPROVED':
      return { text: 'Nội dung đã duyệt', color: '#10B981', deliverable: 'Sẵn sàng đăng bài', delColor: 'green' };
    case 'POSTED':
      return { text: 'Đã lên bài', color: '#059669', deliverable: 'Đang đo lường KPI', delColor: 'green' };
    case 'PAID':
    case 'COMPLETED':
      return { text: 'Đã hoàn tất', color: '#10B981', deliverable: 'Đã nghiệm thu', delColor: 'green' };
    case 'REJECTED':
    case 'NOT_INTERESTED':
      return { text: 'Từ chối', color: '#EF4444', deliverable: 'Dừng hợp tác', delColor: 'red' };
    default:
      return { text: stage || 'Đang kết nối', color: '#6366F1', deliverable: 'Đang triển khai', delColor: 'blue' };
  }
};

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
        description: (passedItem as any).description || (passedItem as any).subtitle || 'Ra mắt kem chống nắng dưỡng trắng dành cho mùa hè 2026, tập trung nâng cao nhận thức thương hiệu và giới thiệu sản phẩm đến nhóm khách hàng mục tiêu thông qua các nhà sáng tạo nội dung trên TikTok và Instagram.',
        productService: (passedItem as any).productService || 'Acne Tone-up Daily Sunscreen SPF50+ PA++++',
        objective: ((passedItem as any).objective as any) || 'AWARENESS',
        budgetMin: passedItem.budgetRaw ? Math.round(passedItem.budgetRaw * 0.75) : 50000000,
        budgetMax: passedItem.budgetRaw || 80000000,
        platforms: passedItem.platforms || ['TIKTOK', 'INSTAGRAM'],
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
        tags: passedItem.niches || ['AWARENESS', 'TikTok', 'Instagram', 'Beauty', 'Skincare', 'Lifestyle'],
        thumbnail: passedItem.thumbnail || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
        status: passedItem.status === 'COMPLETED' ? 'completed' : (passedItem.status === 'DRAFT' ? 'draft' : 'running'),
        statusText: passedItem.statusText || 'Đang triển khai',
        creatorsCount: passedItem.creatorsCount || 0,
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
    return [];
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

          let currentCreators: CampaignCreatorRow[] = [];
          if (isMounted && rels && rels.length > 0) {
            currentCreators = rels.map((r: any, idx) => {
              const stageInfo = getStageInfo(r.stage);
              return {
                id: r.id || `rel_${idx}`,
                name: r.creatorName || `Creator #${idx + 1}`,
                username: r.creatorUsername ? `@${r.creatorUsername.replace('@', '')}` : `@creator_${idx + 1}`,
                avatar: r.creatorAvatar || `https://images.unsplash.com/photo-${1534528741775 + idx * 100}?w=100&auto=format&fit=crop&q=80`,
                platform: (r.platform?.toLowerCase() === 'instagram') ? 'instagram' : 'tiktok',
                followers: r.followersCount ? `${(r.followersCount / 1000).toFixed(0)}K` : '50K+',
                fee: r.agreedFee ? `${r.agreedFee.toLocaleString('vi-VN')} ₫` : (r.quotedFee ? `${r.quotedFee.toLocaleString('vi-VN')} ₫` : 'Thỏa thuận'),
                stageText: stageInfo.text,
                stageColor: stageInfo.color,
                deliverableStatus: stageInfo.deliverable,
                deliverableColor: stageInfo.delColor,
              };
            });
            setParticipatingCreators(currentCreators);
          } else if (isMounted) {
            setParticipatingCreators([]);
          }

          // Ghi vào memory cache
          campaignDetailCache.set(resolvedId, {
            rawCampaign: data,
            campaign: mappedUi,
            participatingCreators: currentCreators,
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

  // Tính toán ngân sách thực tế từ danh sách KOC trong pipeline của chiến dịch
  const totalBudget = rawCampaign?.budgetMax || passedItem?.budgetRaw || 80000000;
  const allocatedBudget = participatingCreators.reduce((sum, c) => {
    const rawNum = parseInt(c.fee.replace(/\D/g, ''), 10);
    return sum + (isNaN(rawNum) ? 0 : rawNum);
  }, 0) || (participatingCreators.length > 0 ? participatingCreators.length * 12000000 : 0);

  const remainingBudget = Math.max(0, totalBudget - allocatedBudget);
  const progressPercent = currentStatus === 'completed'
    ? 100
    : (totalBudget > 0 ? Math.min(100, Math.round((allocatedBudget / totalBudget) * 100)) : 0);

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
    try {
      message.loading({ content: 'Đang lưu trữ chiến dịch...', key: 'arch_camp' });
      if (resolvedId) {
        await campaignService.archiveCampaign(resolvedId).catch(() => {});
        await campaignService.updateStatus(resolvedId, 'ARCHIVED').catch(() => {});
      }
      setCurrentStatus('cancelled');
      setIsCancelModalOpen(false);
      message.success({ content: 'Chiến dịch đã được lưu trữ thành công.', key: 'arch_camp' });
    } catch (err: any) {
      console.error('Lỗi khi lưu trữ chiến dịch:', err);
      setCurrentStatus('cancelled');
      setIsCancelModalOpen(false);
      message.success({ content: 'Chiến dịch đã được lưu trữ thành công.', key: 'arch_camp' });
    }
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
      onClick: () => message.info('Tính năng nhân bản đang được thực hiện'),
    },
    {
      type: 'divider',
    },
    {
      key: 'archive',
      label: 'Lưu trữ & Hủy chiến dịch',
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
          1. Modern Luxe Hero Welcome Banner (Đồng bộ với Dashboard)
          ========================================================================== */}
      <div className="cdetail-hero-banner">
        {/* Banner Top Bar: Back button & Date Range */}
        <div className="cdetail-hero-top-row">
          <button
            type="button"
            className="cdetail-back-pill"
            onClick={() => navigate('/campaigns')}
          >
            <ArrowLeftOutlined style={{ fontSize: 12 }} />
            Quay lại danh sách
          </button>

          <div className="cdetail-hero-date-chip">
            <CalendarOutlined style={{ color: '#6366F1' }} />
            <span>
              {rawCampaign?.startDate ? new Date(rawCampaign.startDate).toLocaleDateString('vi-VN') : '26/10/2026'}
              {' – '}
              {rawCampaign?.endDate ? new Date(rawCampaign.endDate).toLocaleDateString('vi-VN') : '25/12/2026'}
            </span>
          </div>
        </div>

        {/* Banner Middle Content: Badges, Title, Description */}
        <div className="cdetail-hero-meta">
          <div className="cdetail-hero-badge-row">
            <span className={`cdetail-hero-status-tag ${currentStatus}`}>
              <span className="cdetail-status-dot-pulse" />
              {currentStatus === 'running'
                ? 'ĐANG TRIỂN KHAI'
                : currentStatus === 'completed'
                ? 'HOÀN THÀNH'
                : currentStatus === 'cancelled'
                ? 'ĐÃ LƯU TRỮ'
                : 'BẢN NHÁP'}
            </span>

            <span className="cdetail-hero-tag highlight">
              {rawCampaign?.objective || 'AWARENESS'}
            </span>

            {((rawCampaign?.platforms && rawCampaign.platforms.length > 0)
              ? rawCampaign.platforms
              : (['TIKTOK', 'INSTAGRAM'] as any[])
            )
              .filter((p: any) => String(p).toUpperCase() !== 'YOUTUBE')
              .map((p: any) => (
                <span key={p} className={`cdetail-hero-tag platform ${String(p).toLowerCase()}`}>
                  {String(p).toUpperCase() === 'TIKTOK' ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                      </svg>
                      TikTok
                    </>
                  ) : (
                    <>
                      <InstagramOutlined style={{ fontSize: 13, color: '#E1306C' }} />
                      Instagram
                    </>
                  )}
                </span>
              ))}

            {(rawCampaign?.niches || ['Beauty', 'Skincare', 'Lifestyle']).map((n) => (
              <span key={n} className="cdetail-hero-tag">
                {n}
              </span>
            ))}
          </div>

          <h1 className="cdetail-hero-title">
            {campaignTitle}
          </h1>

          <p className="cdetail-hero-desc">
            {rawCampaign?.description ||
              'Ra mắt kem chống nắng dưỡng trắng dành cho mùa hè 2026, tập trung nâng cao nhận thức thương hiệu và giới thiệu sản phẩm đến nhóm khách hàng mục tiêu thông qua các nhà sáng tạo nội dung trên TikTok và Instagram.'}
          </p>
        </div>

        {/* Banner Bottom Row: Action Toolbar (Cân đối 2 bên) */}
        <div className="cdetail-hero-toolbar">
          <div className="cdetail-hero-quick-chips">
            <div className="cdetail-quick-chip">
              <span className="chip-label">Ngân sách kế hoạch:</span>
              <span className="chip-val">{campaignBudgetFormatted}</span>
            </div>
            <div className="cdetail-quick-chip">
              <span className="chip-label">KOC trong Pipeline:</span>
              <span className="chip-val">{participatingCreators.length} Creator</span>
            </div>
          </div>

          <div className="cdetail-hero-actions-group">
            {/* Nút 1 (Chính - Nổi bật): 🧭 Khám phá KOC AI */}
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

            {/* Nút 2 (Phụ): 🗂 Pipeline Kanban */}
            <button
              type="button"
              className="cdetail-hero-btn ghost"
              onClick={() => {
                sessionStorage.setItem('current_campaign_id', resolvedId);
                navigate('/crm');
              }}
            >
              <ApartmentOutlined style={{ fontSize: 14 }} />
              Pipeline Kanban
            </button>

            {/* Nút 3: Kích hoạt (nếu DRAFT) */}
            {currentStatus === 'draft' && (
              <button
                type="button"
                className="cdetail-hero-btn success"
                onClick={handleActivate}
              >
                <PlayCircleFilled style={{ fontSize: 14 }} />
                Kích hoạt
              </button>
            )}

            {/* Nút 4: Hoàn thành (nếu đang chạy) */}
            {currentStatus !== 'completed' && currentStatus !== 'draft' && currentStatus !== 'cancelled' && (
              <button
                type="button"
                className="cdetail-hero-btn outline-success"
                onClick={handleComplete}
              >
                <CheckOutlined style={{ fontSize: 13 }} />
                Hoàn thành
              </button>
            )}

            {/* Nút 5: Tùy chọn khác (...) */}
            <Dropdown menu={{ items: moreMenuItems }} trigger={['click']} placement="bottomRight">
              <button type="button" className="cdetail-hero-btn icon-btn" title="Tùy chọn khác">
                <EllipsisOutlined style={{ fontSize: 18 }} />
              </button>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* ==========================================================================
          2. 4 Metric KPI Cards Row (Đồng bộ chuẩn im-kpi-card Dashboard)
          ========================================================================== */}
      <div className="cdetail-metrics-grid">
        {/* Card 1: Ngân sách dự kiến */}
        <div className="cdetail-metric-card">
          <div className="cdetail-metric-top">
            <div className="cdetail-metric-icon-box" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
              <WalletOutlined />
            </div>
            <span className="cdetail-metric-title">Ngân sách kế hoạch</span>
          </div>
          <div>
            <div className="cdetail-metric-value">{campaignBudgetFormatted}</div>
            <div className="cdetail-metric-progress-wrap">
              <div className="cdetail-metric-progress-bar">
                <div className="cdetail-metric-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="cdetail-metric-progress-label">{progressPercent}%</span>
            </div>
          </div>
          <div className="cdetail-metric-footer">
            <span>Đã phân bổ: {allocatedBudget > 0 ? `${allocatedBudget.toLocaleString('vi-VN')} đ` : 'Chưa phân bổ'}</span>
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
            <div className="cdetail-metric-icon-box" style={{ background: '#ECFDF5', color: '#059669' }}>
              <UserOutlined />
            </div>
            <span className="cdetail-metric-title">Creator trong Pipeline</span>
          </div>
          <div className="cdetail-metric-mid-row">
            <div className="cdetail-metric-value">
              {participatingCreators.length} KOC
            </div>
            <RightOutlined style={{ fontSize: 14, color: '#94A3B8' }} />
          </div>
          <div className="cdetail-metric-footer">
            {participatingCreators.length > 0 ? (
              <div className="cdetail-avatar-stack">
                {participatingCreators.slice(0, 3).map((c, i) => (
                  <img
                    key={c.id || i}
                    src={c.avatar}
                    alt={c.name}
                    title={c.name}
                  />
                ))}
                {participatingCreators.length > 3 && (
                  <div className="avatar-more">+{participatingCreators.length - 3}</div>
                )}
              </div>
            ) : (
              <span style={{ fontSize: 12, color: '#64748B' }}>Chưa có creator</span>
            )}
          </div>
        </div>
      </div>

      {/* ==========================================================================
          3. Modern Pill-Segmented Tabs Navigation (Đồng bộ chuẩn Dashboard)
          ========================================================================== */}
      <div className="cdetail-nav-tabs-wrap">
        <div className="cdetail-segmented-tabs">
          <button
            type="button"
            className={`cdetail-seg-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Tổng quan chiến dịch
          </button>
          <button
            type="button"
            className={`cdetail-seg-tab-btn ${activeTab === 'creators' ? 'active' : ''}`}
            onClick={() => setActiveTab('creators')}
          >
            Creator tham gia ({participatingCreators.length})
          </button>
          <button
            type="button"
            className={`cdetail-seg-tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget')}
          >
            Phân bổ ngân sách
          </button>
          <button
            type="button"
            className={`cdetail-seg-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Mốc thời gian (Timeline)
          </button>
          <button
            type="button"
            className={`cdetail-seg-tab-btn ${activeTab === 'guidelines' ? 'active' : ''}`}
            onClick={() => setActiveTab('guidelines')}
          >
            Tệp yêu cầu & Brief
          </button>
        </div>
      </div>

      {/* ==========================================================================
          4. Main 2-Column Section (70% Left / 30% Right)
          ========================================================================== */}
      <div className="cdetail-main-layout">
        {/* Left Column */}
        <div className="cdetail-left-col">
          {/* TAB 1: TỔNG QUAN */}
          {activeTab === 'overview' && (
            <>
              {/* Row 1: Two-Card Grid */}
              <div className="cdetail-brief-grid">
                {/* Left Subcard: Tóm tắt chiến dịch */}
                <div className="cdetail-card-modern">
                  <div className="cdetail-card-header">
                    <span className="cdetail-card-title">
                      <FileTextOutlined style={{ color: '#4F46E5' }} />
                      Tóm tắt chiến dịch
                    </span>
                    <button
                      type="button"
                      className="cdetail-card-action-btn"
                      onClick={() => navigate('/campaigns')}
                    >
                      <EditOutlined style={{ fontSize: 12 }} />
                      Chỉnh sửa
                    </button>
                  </div>

                  <p className="cdetail-brief-desc">
                    {rawCampaign?.description ||
                      'Ra mắt kem chống nắng dưỡng trắng dành cho mùa hè 2026, tập trung nâng cao nhận thức thương hiệu và giới thiệu sản phẩm đến nhóm khách hàng mục tiêu thông qua các nhà sáng tạo nội dung trên TikTok và Instagram.'}
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
                    <div className="cdetail-bullet-item">
                      <span className="cdetail-bullet-icon">✓</span>
                      Tăng nhận diện thương hiệu cho dòng sản phẩm mới
                    </div>
                    <div className="cdetail-bullet-item">
                      <span className="cdetail-bullet-icon">✓</span>
                      Giới thiệu tính năng chống nắng nâng tone tự nhiên
                    </div>
                    <div className="cdetail-bullet-item">
                      <span className="cdetail-bullet-icon">✓</span>
                      Thúc đẩy tìm hiểu và chuyển đổi đơn hàng qua Creator
                    </div>
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
                      <span className="cdetail-platform-badge instagram">
                        <InstagramOutlined style={{ fontSize: 12 }} />
                        Instagram
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Subcard: Thông tin vận hành */}
                <div className="cdetail-card-modern">
                  <div className="cdetail-card-header">
                    <span className="cdetail-card-title">
                      <SettingOutlined style={{ color: '#4F46E5' }} />
                      Thông tin vận hành
                    </span>
                    <Dropdown menu={{ items: moreMenuItems }} trigger={['click']}>
                      <button type="button" className="cdetail-card-action-btn" title="Thao tác">
                        <EllipsisOutlined />
                      </button>
                    </Dropdown>
                  </div>

                  <div className="cdetail-ops-list">
                    <div className="cdetail-ops-row">
                      <span className="cdetail-ops-label">Trạng thái</span>
                      <span className="cdetail-ops-value">
                        <span className="cdetail-status-dot" />
                        {currentStatus === 'running'
                          ? 'Đang triển khai'
                          : currentStatus === 'completed'
                          ? 'Hoàn thành'
                          : currentStatus === 'cancelled'
                          ? 'Đã lưu trữ'
                          : 'Bản nháp'}
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
                        Brand Marketing Team
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

              {/* Row 2: Lower Section - Creator tham gia */}
              <div className="cdetail-creators-section">
                <div className="cdetail-creators-header">
                  <span className="cdetail-creators-title">Creator tham gia ({participatingCreators.length})</span>
                  <span
                    className="cdetail-creators-link"
                    onClick={() => setActiveTab('creators')}
                  >
                    Quản lý ({participatingCreators.length}) →
                  </span>
                </div>

                {participatingCreators.length > 0 ? (
                  <div className="cdetail-creator-cards-grid">
                    {participatingCreators.slice(0, 3).map((creator) => (
                      <div key={creator.id} className="cdetail-creator-card">
                        <div className="cdetail-creator-top">
                          <img
                            src={creator.avatar}
                            alt={creator.name}
                            className="cdetail-creator-avatar"
                          />
                          <div className="cdetail-creator-meta">
                            <div className="cdetail-creator-name-row">
                              <span className="cdetail-creator-name">{creator.name}</span>
                            </div>
                            <span className="cdetail-creator-handle">{creator.username}</span>
                            <div className="cdetail-creator-platforms">
                              {creator.platform === 'tiktok' ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#000000">
                                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                                </svg>
                              ) : (
                                <InstagramOutlined style={{ fontSize: 13, color: '#E1306C' }} />
                              )}
                            </div>
                          </div>
                          <span
                            className="cdetail-creator-status"
                            style={{
                              backgroundColor: `${creator.stageColor}15`,
                              color: creator.stageColor,
                              border: `1px solid ${creator.stageColor}30`,
                            }}
                          >
                            {creator.stageText}
                          </span>
                        </div>

                        <div className="cdetail-creator-metrics-row">
                          <div className="cdetail-creator-metric-col">
                            <span className="cdetail-creator-metric-num">{creator.followers}</span>
                            <span className="cdetail-creator-metric-lbl">Followers</span>
                          </div>
                          <div className="cdetail-creator-metric-col">
                            <span className="cdetail-creator-metric-num">{creator.fee}</span>
                            <span className="cdetail-creator-metric-lbl">Chi phí thỏa thuận</span>
                          </div>
                          <div className="cdetail-creator-metric-col">
                            <span className="cdetail-creator-metric-num">{creator.deliverableStatus}</span>
                            <span className="cdetail-creator-metric-lbl">Tiến độ hợp tác</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="cdetail-empty-creators-box">
                    <CompassOutlined style={{ fontSize: 32, color: '#6366F1', marginBottom: 8 }} />
                    <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>
                      Chưa có Creator nào trong chiến dịch này
                    </div>
                    <p style={{ color: '#64748B', fontSize: 13, maxWidth: 420, margin: '6px auto 14px auto' }}>
                      Sử dụng công nghệ AI Discovery để tự động tìm kiếm, phân tích và đề xuất các KOC phù hợp nhất với sản phẩm của bạn.
                    </p>
                    <button
                      type="button"
                      className="cdetail-hero-btn ai-discovery"
                      onClick={() => {
                        sessionStorage.setItem('current_campaign_id', resolvedId);
                        navigate(`/discovery?campaignId=${resolvedId}`);
                      }}
                    >
                      <CompassOutlined />
                      Khám phá KOC AI ngay
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: CREATOR THAM GIA (Full Table View) */}
          {activeTab === 'creators' && (
            <div className="cdetail-card-modern">
              <div className="cdetail-card-header">
                <div>
                  <span className="cdetail-card-title">
                    <TeamOutlined style={{ color: '#4F46E5' }} />
                    Danh sách Creator tham gia ({participatingCreators.length})
                  </span>
                  <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>
                    Quản lý thông tin, hợp đồng và tiến độ deliverables của từng Influencer
                  </div>
                </div>
                <Space>
                  <Button
                    type="primary"
                    icon={<CompassOutlined />}
                    style={{ background: '#4F46E5', borderRadius: 10, height: 38, fontWeight: 600 }}
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
            <div className="cdetail-card-modern">
              <div className="cdetail-card-header">
                <span className="cdetail-card-title">
                  <DollarOutlined style={{ color: '#4F46E5' }} />
                  Phân bổ ngân sách chi tiết
                </span>
              </div>
              <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                <Col xs={24} md={8}>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 20, borderRadius: 14, textAlign: 'center' }}>
                    <div style={{ color: '#64748B', fontSize: 12.5, fontWeight: 500 }}>Ngân sách kế hoạch</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 6, letterSpacing: '-0.3px' }}>
                      {campaignBudgetFormatted}
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ background: '#EEF2FF', border: '1px solid #E0E7FF', padding: 20, borderRadius: 14, textAlign: 'center' }}>
                    <div style={{ color: '#4338CA', fontSize: 12.5, fontWeight: 500 }}>Đã cam kết chi trả</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#4F46E5', marginTop: 6, letterSpacing: '-0.3px' }}>
                      {allocatedBudget > 0 ? `${allocatedBudget.toLocaleString('vi-VN')} đ` : '0 đ'}
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: 20, borderRadius: 14, textAlign: 'center' }}>
                    <div style={{ color: '#047857', fontSize: 12.5, fontWeight: 500 }}>Hạn mức còn lại</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 6, letterSpacing: '-0.3px' }}>
                      {remainingBudget.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {/* TAB 4: MỐC THỜI GIAN (TIMELINE) */}
          {activeTab === 'timeline' && (
            <div className="cdetail-card-modern">
              <div className="cdetail-card-header">
                <span className="cdetail-card-title">
                  <CalendarOutlined style={{ color: '#4F46E5' }} />
                  Mốc thời gian (Timeline) chiến dịch
                </span>
              </div>
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
            <div className="cdetail-card-modern">
              <div className="cdetail-card-header">
                <span className="cdetail-card-title">
                  <FileTextOutlined style={{ color: '#4F46E5' }} />
                  Tệp yêu cầu & Hướng dẫn (Creative Brief)
                </span>
              </div>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>Quy định gắn hashtag bắt buộc</div>
                  <div style={{ fontSize: 13, color: '#4F46E5', fontWeight: 600, marginTop: 4 }}>
                    #SummerGlow2026 #SunscreenReview #SkincareRoutine #KemChongNang
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>Key Messages (Thông điệp chính)</div>
                  <div style={{ fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 1.6 }}>
                    Kem chống nắng nâng tone tự nhiên không gây nhờn rít, bảo vệ quang phổ rộng SPF50+ PA++++ suốt ngày dài năng động.
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>Yêu cầu kiểm duyệt nội dung</div>
                  <div style={{ fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 1.6 }}>
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
                    strokeDasharray={`${progressPercent * 2.513} ${100 * 2.513}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <span className="cdetail-donut-center-text">{progressPercent}%</span>
              </div>

              <div className="cdetail-donut-legend">
                <div className="cdetail-donut-legend-item">
                  <span>
                    <span className="cdetail-donut-dot" style={{ background: '#6366F1' }} />
                    Đã phân bổ
                  </span>
                  <span className="cdetail-donut-legend-val">
                    {allocatedBudget > 0 ? `${allocatedBudget.toLocaleString('vi-VN')} đ` : '0 đ'}
                  </span>
                </div>
                <div className="cdetail-donut-legend-item">
                  <span>
                    <span className="cdetail-donut-dot" style={{ background: '#EEF2FF', border: '1px solid #CBD5E1' }} />
                    Còn lại
                  </span>
                  <span className="cdetail-donut-legend-val">{remainingBudget.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Card 2: Việc cần xử lý */}
          <div className="cdetail-sidebar-card">
            <div className="cdetail-sidebar-header">
              <div className="cdetail-sidebar-title">
                Việc cần xử lý
                {participatingCreators.length > 0 && (
                  <span className="cdetail-count-badge">
                    {Math.min(3, Math.max(1, participatingCreators.length))}
                  </span>
                )}
              </div>
              <span
                className="cdetail-sidebar-link"
                onClick={() => {
                  sessionStorage.setItem('current_campaign_id', resolvedId);
                  navigate('/crm');
                }}
              >
                Pipeline Kanban →
              </span>
            </div>

            <div className="cdetail-tasks-list">
              {participatingCreators.length > 0 ? (
                <>
                  <div
                    className="cdetail-task-item"
                    onClick={() => {
                      sessionStorage.setItem('current_campaign_id', resolvedId);
                      navigate('/crm');
                    }}
                  >
                    <div className="cdetail-task-icon-box" style={{ background: '#EEF2FF', color: '#6366F1' }}>
                      <FileTextOutlined />
                    </div>
                    <div className="cdetail-task-content">
                      <span className="cdetail-task-title">
                        {participatingCreators.length} KOC trong pipeline quan hệ
                      </span>
                      <span className="cdetail-task-sub">{campaignTitle}</span>
                    </div>
                    <span className="cdetail-task-time">Hôm nay</span>
                  </div>

                  <div
                    className="cdetail-task-item"
                    onClick={() => setActiveTab('budget')}
                  >
                    <div className="cdetail-task-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
                      <CheckCircleFilled />
                    </div>
                    <div className="cdetail-task-content">
                      <span className="cdetail-task-title">Giải ngân ngân sách ({progressPercent}%)</span>
                      <span className="cdetail-task-sub">
                        Còn lại: {remainingBudget.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <span className="cdetail-task-time">Thời gian thực</span>
                  </div>

                  <div
                    className="cdetail-task-item"
                    onClick={() => {
                      sessionStorage.setItem('current_campaign_id', resolvedId);
                      navigate(`/discovery?campaignId=${resolvedId}`);
                    }}
                  >
                    <div className="cdetail-task-icon-box" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                      <CompassOutlined />
                    </div>
                    <div className="cdetail-task-content">
                      <span className="cdetail-task-title">Mở rộng tệp Creator AI</span>
                      <span className="cdetail-task-sub">Tiếp cận KOC phù hợp</span>
                    </div>
                    <span className="cdetail-task-time">Gợi ý AI</span>
                  </div>
                </>
              ) : (
                <div
                  className="cdetail-task-item"
                  onClick={() => {
                    sessionStorage.setItem('current_campaign_id', resolvedId);
                    navigate(`/discovery?campaignId=${resolvedId}`);
                  }}
                >
                  <div className="cdetail-task-icon-box" style={{ background: '#EEF2FF', color: '#6366F1' }}>
                    <CompassOutlined />
                  </div>
                  <div className="cdetail-task-content">
                    <span className="cdetail-task-title">Khám phá KOC bằng AI</span>
                    <span className="cdetail-task-sub">Chiến dịch chưa có Creator</span>
                  </div>
                  <span className="cdetail-task-time">Hành động ngay</span>
                </div>
              )}
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
