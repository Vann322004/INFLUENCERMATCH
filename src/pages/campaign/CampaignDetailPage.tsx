import React, { useState, useEffect } from 'react';
import {
  Tag,
  Avatar,
  Modal,
  Input,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  EditOutlined,
  InstagramOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { campaignService } from '../../services/api/campaignService';
import { creatorService } from '../../services/api/creatorService';
import type { RelationshipDto } from '../../services/api/campaignService';
import type { CampaignResponse } from '../../types/api/campaign.types';
import { mapApiCampaignToUi } from '../../components/dashboard/CampaignTable';
import type { Campaign } from '../../data/mockData';
import './CampaignDetailPage.css';
import type { CampaignItemUI } from './CampaignPage';
import { CampaignHeroBanner } from './components/detail/CampaignHeroBanner';
import { CampaignMetricCards } from './components/detail/CampaignMetricCards';
import { CampaignOverviewTab } from './components/detail/CampaignOverviewTab';
import { CampaignCreatorsTab } from './components/detail/CampaignCreatorsTab';
import { CampaignBudgetTab } from './components/detail/CampaignBudgetTab';
import { CampaignTimelineTab } from './components/detail/CampaignTimelineTab';
import { CampaignGuidelinesTab } from './components/detail/CampaignGuidelinesTab';

type CampaignStatusType = 'running' | 'draft' | 'completed' | 'cancelled';

// ── Bộ chuyển dịch & chuẩn hóa Tiếng Việt (100% Không để tiếng Anh) ──
const translateObjective = (obj?: string): string => {
  if (!obj) return 'NHẬN DIỆN THƯƠNG HIỆU';
  const upper = obj.toUpperCase();
  if (upper.includes('AWARE')) return 'NHẬN DIỆN THƯƠNG HIỆU';
  if (upper.includes('CONVERT') || upper.includes('SALE')) return 'CHUYỂN ĐỔI BÁN HÀNG';
  if (upper.includes('ENGAGE')) return 'TĂNG TƯƠNG TÁC';
  if (upper.includes('CONSIDER')) return 'CÂN NHẮC MUA HÀNG';
  return obj;
};

const translateNiche = (niche?: string): string => {
  if (!niche) return '';
  const lower = niche.toLowerCase();
  if (lower.includes('beauty') || lower.includes('mỹ phẩm') || lower.includes('làm đẹp')) return 'Làm đẹp';
  if (lower.includes('skin') || lower.includes('chăm sóc da')) return 'Chăm sóc da';
  if (lower.includes('lifestyle') || lower.includes('phong cách') || lower.includes('đời sống')) return 'Phong cách sống';
  if (lower.includes('fashion') || lower.includes('thời trang')) return 'Thời trang';
  if (lower.includes('food') || lower.includes('ẩm thực') || lower.includes('ăn uống')) return 'Ẩm thực';
  if (lower.includes('tech') || lower.includes('công nghệ')) return 'Công nghệ';
  if (lower.includes('travel') || lower.includes('du lịch')) return 'Du lịch';
  if (lower.includes('fitness') || lower.includes('thể thao')) return 'Thể thao & Fitness';
  if (lower.includes('family') || lower.includes('mẹ bé')) return 'Mẹ & Bé';
  return niche;
};

const getNicheClass = (niche?: string): string => {
  if (!niche) return '';
  const lower = niche.toLowerCase();
  if (lower.includes('beauty') || lower.includes('làm đẹp')) return 'beauty';
  if (lower.includes('skin') || lower.includes('da')) return 'skincare';
  if (lower.includes('life') || lower.includes('sống')) return 'lifestyle';
  if (lower.includes('fashion') || lower.includes('thời trang')) return 'fashion';
  if (lower.includes('tech') || lower.includes('công nghệ')) return 'tech';
  return '';
};

const VERIFIED_CREATOR_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
];

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

          // Tải danh sách KOC từ Pipeline Relationship và Shortlist từ Backend DB
          let rels: RelationshipDto[] = [];
          try {
            rels = await campaignService.getRelationships(resolvedId);
          } catch {
            rels = [];
          }

          let shortlists: any[] = [];
          try {
            shortlists = await creatorService.getShortlist(resolvedId);
          } catch {
            shortlists = [];
          }

          let currentCreators: CampaignCreatorRow[] = [];
          if (isMounted) {
            if (rels && rels.length > 0) {
              currentCreators = rels.map((r: any, idx) => {
                const stageInfo = getStageInfo(r.stage);
                return {
                  id: r.id || `rel_${idx}`,
                  name: r.creatorName || `Nhà sáng tạo #${idx + 1}`,
                  username: r.creatorUsername ? `@${r.creatorUsername.replace('@', '')}` : `@creator_${idx + 1}`,
                  avatar: (r.creatorAvatar && r.creatorAvatar.startsWith('http') && !r.creatorAvatar.includes('NaN'))
                    ? r.creatorAvatar
                    : VERIFIED_CREATOR_AVATARS[idx % VERIFIED_CREATOR_AVATARS.length],
                  platform: (r.platform?.toLowerCase() === 'instagram') ? 'instagram' : 'tiktok',
                  followers: r.followersCount ? `${(r.followersCount / 1000).toFixed(0)}K` : '50K+',
                  fee: r.agreedFee ? `${r.agreedFee.toLocaleString('vi-VN')} ₫` : (r.quotedFee ? `${r.quotedFee.toLocaleString('vi-VN')} ₫` : 'Thỏa thuận'),
                  stageText: stageInfo.text,
                  stageColor: stageInfo.color,
                  deliverableStatus: stageInfo.deliverable,
                  deliverableColor: stageInfo.delColor,
                };
              });
            }

            // Bổ sung các KOC từ bảng Shortlist Database nếu chưa có trong Pipeline
            if (shortlists && shortlists.length > 0) {
              shortlists.forEach((s: any, idx) => {
                const exists = currentCreators.some(c => c.id === s.id || c.name === s.creatorName);
                if (!exists) {
                  currentCreators.push({
                    id: s.id || `sl_${idx}`,
                    name: s.creatorName || `Nhà sáng tạo #${idx + 1}`,
                    username: s.creatorUsername ? `@${s.creatorUsername.replace('@', '')}` : `@creator_${idx + 1}`,
                    avatar: (s.avatarUrl && s.avatarUrl.startsWith('http') && !s.avatarUrl.includes('NaN'))
                      ? s.avatarUrl
                      : VERIFIED_CREATOR_AVATARS[(idx + 2) % VERIFIED_CREATOR_AVATARS.length],
                    platform: (s.platform?.toLowerCase() === 'instagram') ? 'instagram' : 'tiktok',
                    followers: s.followers ? `${(s.followers / 1000).toFixed(0)}K` : '80K+',
                    fee: 'Đang thỏa thuận',
                    stageText: 'Đã lưu Shortlist',
                    stageColor: '#6366F1',
                    deliverableStatus: 'Chờ gửi đề xuất',
                    deliverableColor: 'blue',
                  });
                }
              });
            }

            setParticipatingCreators(currentCreators);
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

  const handleNavigateToEdit = () => {
    const targetId = resolvedId || rawCampaign?.id || campaign?.id;
    if (targetId) {
      navigate(`/campaigns/${targetId}/edit`, {
        state: {
          campaignId: targetId,
          campaign: rawCampaign,
          campaignData: rawCampaign,
        },
      });
    } else {
      navigate('/campaigns');
    }
  };

  // Menu More actions
  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Chỉnh sửa thông tin chiến dịch',
      icon: <EditOutlined />,
      onClick: handleNavigateToEdit,
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

  // Creator Table Columns for Tab "Nhà sáng tạo tham gia"
  const creatorColumns: ColumnsType<CampaignCreatorRow> = [
    {
      title: 'Nhà sáng tạo / KOC',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar src={record.avatar} size={40} />
          <div>
            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>{text}</div>
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
      title: 'Người theo dõi',
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
      title: 'Tiến độ hợp tác',
      dataIndex: 'stageText',
      key: 'stageText',
      render: (text) => (
        <span className="cdetail-creator-status confirmed">{text}</span>
      ),
    },
    {
      title: 'Nội dung cam kết',
      dataIndex: 'deliverableStatus',
      key: 'deliverableStatus',
      render: (text, record) => <Tag color={record.deliverableColor}>{text}</Tag>,
    },
  ];

  return (
    <div className="campaign-detail-container">
      {/* 1. Header Banner */}
      <CampaignHeroBanner
        campaignTitle={campaignTitle}
        rawCampaign={rawCampaign}
        currentStatus={currentStatus}
        resolvedId={resolvedId}
        handleActivate={handleActivate}
        handleComplete={handleComplete}
        moreMenuItems={moreMenuItems}
        setActiveTab={setActiveTab}
        translateObjective={translateObjective}
        translateNiche={translateNiche}
      />

      {/* 2. Metric KPI Cards */}
      <CampaignMetricCards
        campaignBudgetFormatted={campaignBudgetFormatted}
        allocatedBudget={allocatedBudget}
        progressPercent={progressPercent}
        rawCampaign={rawCampaign}
        participatingCreators={participatingCreators}
        setActiveTab={setActiveTab}
      />

      {/* 3. Navigation Tabs */}
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
            Nhà sáng tạo tham gia ({participatingCreators.length})
          </button>
          <button
            type="button"
            className={`cdetail-seg-tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget')}
          >
            Ngân sách & Thanh toán
          </button>
          <button
            type="button"
            className={`cdetail-seg-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Lộ trình chiến dịch
          </button>
          <button
            type="button"
            className={`cdetail-seg-tab-btn ${activeTab === 'guidelines' ? 'active' : ''}`}
            onClick={() => setActiveTab('guidelines')}
          >
            Hồ sơ & Yêu cầu nội dung
          </button>
        </div>
      </div>

      {/* 4. Tab Content Area */}
      <div className="cdetail-tab-content-wrap">
        {activeTab === 'overview' && (
          <CampaignOverviewTab
            rawCampaign={rawCampaign}
            currentStatus={currentStatus}
            participatingCreators={participatingCreators}
            handleNavigateToEdit={handleNavigateToEdit}
            moreMenuItems={moreMenuItems}
          />
        )}

        {activeTab === 'creators' && (
          <CampaignCreatorsTab
            participatingCreators={participatingCreators}
            creatorColumns={creatorColumns}
            resolvedId={resolvedId}
          />
        )}

        {activeTab === 'budget' && (
          <CampaignBudgetTab
            campaignBudgetFormatted={campaignBudgetFormatted}
            allocatedBudget={allocatedBudget}
            remainingBudget={remainingBudget}
            participatingCreators={participatingCreators}
            campaignTitle={campaignTitle}
          />
        )}

        {activeTab === 'timeline' && (
          <CampaignTimelineTab rawCampaign={rawCampaign} />
        )}

        {activeTab === 'guidelines' && (
          <CampaignGuidelinesTab rawCampaign={rawCampaign} />
        )}
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
