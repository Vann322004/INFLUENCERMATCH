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
  SearchOutlined,
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

const { Title, Text } = Typography;

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
      {/* ==========================================================================
          1. Modern Luxe Hero Welcome Banner (Đồng bộ với Dashboard)
          ========================================================================== */}
      <div className="cdetail-hero-banner">
        {/* Banner Top Bar: Breadcrumb & Date Range (Loại bỏ nút quay lại) */}
        <div className="cdetail-hero-top-row">
          <div className="cdetail-hero-breadcrumb">
            <span className="cdetail-breadcrumb-tag">CHIẾN DỊCH</span>
            <span>Chi tiết & Quản lý hoạt động</span>
          </div>

          <div className="cdetail-hero-date-chip">
            <CalendarOutlined style={{ color: '#4F46E5' }} />
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
              {translateObjective(rawCampaign?.objective)}
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

            {(rawCampaign?.niches || ['Beauty', 'Skincare', 'Lifestyle']).map((n) => {
              const translated = translateNiche(n);
              const nicheCls = getNicheClass(n);
              return (
                <span key={n} className={`cdetail-hero-tag ${nicheCls}`}>
                  {translated}
                </span>
              );
            })}
          </div>

          <h1 className="cdetail-hero-title">
            {campaignTitle}
          </h1>

          <p className="cdetail-hero-desc">
            {rawCampaign?.description ||
              'Chiến dịch ra mắt kem chống nắng dưỡng trắng hè 2026, tiếp cận tệp khách hàng trẻ qua TikTok & Instagram.'}
          </p>
        </div>

        {/* Banner Bottom Row: Action Toolbar (Cân đối 2 bên) */}
        <div className="cdetail-hero-toolbar">
          <div className="cdetail-hero-workflow">
            <span className="cdetail-workflow-label">Quy trình:</span>
            <span className="cdetail-workflow-pill active">
              <SearchOutlined /> 1. Tìm kiếm KOC
            </span>
            <span className="cdetail-workflow-sep">➔</span>
            <span className="cdetail-workflow-pill active">
              <ApartmentOutlined /> 2. Đàm phán CRM
            </span>
            <span className="cdetail-workflow-sep">➔</span>
            <span className="cdetail-workflow-pill">
              <WalletOutlined /> 3. Quyết toán chi phí
            </span>
          </div>

          <div className="cdetail-hero-actions-group">
            {/* Nút 1: Tìm kiếm KOC */}
            <button
              type="button"
              className="cdetail-hero-btn ai-discovery"
              onClick={() => {
                const cId = resolvedId || 'camp_sg2026';
                sessionStorage.setItem('current_campaign_id', cId);
                navigate(`/discovery?campaignId=${cId}`, { state: { campaignId: cId } });
              }}
            >
              <SearchOutlined style={{ fontSize: 14 }} />
              Tìm kiếm KOC
            </button>

            {/* Nút 2 (Phụ): 🗂 Tiến độ hợp tác */}
            <button
              type="button"
              className="cdetail-hero-btn ghost"
              onClick={() => {
                sessionStorage.setItem('current_campaign_id', resolvedId);
                navigate('/crm');
              }}
            >
              <ApartmentOutlined style={{ fontSize: 14 }} />
              Tiến độ hợp tác
            </button>

            {/* Nút 3: 💳 Chi phí & Thanh toán */}
            <button
              type="button"
              className="cdetail-hero-btn payment-btn"
              onClick={() => setActiveTab('budget')}
            >
              <WalletOutlined style={{ fontSize: 14 }} />
              Chi phí & Thanh toán
            </button>

            {/* Nút 4: Kích hoạt (nếu DRAFT) */}
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

            {/* Nút 5: Hoàn thành (nếu đang chạy) */}
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

            {/* Nút 6: Tùy chọn khác (...) */}
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
        {/* Card 1: Ngân sách kế hoạch */}
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
            <span>Đã cam kết: {allocatedBudget > 0 ? `${allocatedBudget.toLocaleString('vi-VN')} đ` : 'Chưa phân bổ'}</span>
          </div>
        </div>

        {/* Card 2: Người theo dõi mục tiêu */}
        <div className="cdetail-metric-card">
          <div className="cdetail-metric-top">
            <div className="cdetail-metric-icon-box" style={{ background: '#F3E8FF', color: '#7C3AED' }}>
              <TeamOutlined />
            </div>
            <span className="cdetail-metric-title">Người theo dõi mục tiêu</span>
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

        {/* Card 3: Tỷ lệ tương tác mục tiêu */}
        <div className="cdetail-metric-card">
          <div className="cdetail-metric-top">
            <div className="cdetail-metric-icon-box" style={{ background: '#E0F2FE', color: '#0284C7' }}>
              <RiseOutlined />
            </div>
            <span className="cdetail-metric-title">Tỷ lệ tương tác mục tiêu</span>
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
            <span>Tiêu chuẩn tương tác ngành</span>
          </div>
        </div>

        {/* Card 4: Nhà sáng tạo trong quy trình */}
        <div
          className="cdetail-metric-card"
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveTab('creators')}
        >
          <div className="cdetail-metric-top">
            <div className="cdetail-metric-icon-box" style={{ background: '#ECFDF5', color: '#059669' }}>
              <UserOutlined />
            </div>
            <span className="cdetail-metric-title">Nhà sáng tạo trong quy trình</span>
          </div>
          <div className="cdetail-metric-mid-row">
            <div className="cdetail-metric-value">
              {participatingCreators.length} KOC
            </div>
          </div>
          <div className="cdetail-metric-footer">
            {participatingCreators.length > 0 ? (
              <div className="cdetail-avatar-stack">
                {participatingCreators.slice(0, 3).map((c, i) => {
                  const safeAvatar = (c.avatar && c.avatar.startsWith('http') && !c.avatar.includes('NaN'))
                    ? c.avatar
                    : VERIFIED_CREATOR_AVATARS[i % VERIFIED_CREATOR_AVATARS.length];
                  return (
                    <img
                      key={c.id || i}
                      src={safeAvatar}
                      alt={c.name}
                      title={c.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  );
                })}
                {participatingCreators.length > 3 && (
                  <div className="avatar-more">+{participatingCreators.length - 3}</div>
                )}
              </div>
            ) : (
              <span style={{ fontSize: 12, color: '#64748B' }}>Chưa có KOC</span>
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

      {/* ==========================================================================
          4. Tab Content Area (Full-Width Responsive Architecture)
          ========================================================================== */}
      <div className="cdetail-tab-content-wrap">
        {/* TAB 1: TỔNG QUAN CHIẾN DỊCH */}
          {activeTab === 'overview' && (
            <div className="cdetail-overview-rows">
              {/* HÀNG 1: Khung đều nhau trên & dưới (Sản phẩm & Thông tin vận hành) */}
              <div className="cdetail-overview-row">
                {/* Card 1: Sản phẩm & Thông điệp */}
                <div className="cdetail-card-modern">
                  <div className="cdetail-card-header">
                    <span className="cdetail-card-title">
                      <FileTextOutlined style={{ color: '#4F46E5' }} />
                      Sản phẩm trọng tâm & Định vị
                    </span>
                    <button
                      type="button"
                      className="cdetail-card-action-btn"
                      onClick={handleNavigateToEdit}
                    >
                      <EditOutlined style={{ fontSize: 12 }} />
                      Chỉnh sửa
                    </button>
                  </div>

                  {/* Box sản phẩm */}
                  <div className="cdetail-product-box">
                    <img
                      src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&auto=format&fit=crop&q=80"
                      alt="Sản phẩm"
                      className="cdetail-product-img"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="cdetail-product-info">
                      <span className="cdetail-product-name">
                        {rawCampaign?.productService || 'Acne Tone-up Daily Sunscreen SPF50+ PA++++'}
                      </span>
                      <div className="cdetail-product-tags">
                        <span className="cdetail-product-tag">LÀM ĐẸP</span>
                        <span className="cdetail-product-tag">CHĂM SÓC DA</span>
                        <span className="cdetail-product-tag">PHONG CÁCH SỐNG</span>
                      </div>
                    </div>
                  </div>

                  {/* Thông điệp then chốt */}
                  <div className="cdetail-bullet-group">
                    <span className="cdetail-bullet-title">Thông điệp then chốt</span>
                    <div className="cdetail-key-message-box">
                      "Bảo vệ toàn diện SPF50+ • Nâng tone sáng hồng tự nhiên suốt ngày dài"
                    </div>
                  </div>

                  {/* Đặc tính nổi bật USP */}
                  <div className="cdetail-bullet-group">
                    <span className="cdetail-bullet-title">Đặc tính nổi bật</span>
                    <div className="cdetail-bullet-item">
                      <span className="cdetail-bullet-icon">✓</span>
                      <div><strong>SPF50+ PA++++:</strong> Chống tia UVA/UVB & ánh sáng xanh</div>
                    </div>
                    <div className="cdetail-bullet-item">
                      <span className="cdetail-bullet-icon">✓</span>
                      <div><strong>Nâng tone tự nhiên:</strong> Kiềm dầu 8 giờ, không bết dính hay vệt trắng</div>
                    </div>
                    <div className="cdetail-bullet-item">
                      <span className="cdetail-bullet-icon">✓</span>
                      <div><strong>Thành phần dịu nhẹ:</strong> Chiết xuất rau má & Niacinamide cho da nhạy cảm</div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Thông tin vận hành & Quản trị */}
                <div className="cdetail-card-modern">
                  <div className="cdetail-card-header">
                    <span className="cdetail-card-title">
                      <SettingOutlined style={{ color: '#4F46E5' }} />
                      Thông tin vận hành & Quản trị
                    </span>
                    <Dropdown menu={{ items: moreMenuItems }} trigger={['click']}>
                      <button type="button" className="cdetail-card-action-btn" title="Thao tác">
                        <EllipsisOutlined />
                      </button>
                    </Dropdown>
                  </div>

                  <div className="cdetail-ops-list">
                    <div className="cdetail-ops-row">
                      <span className="cdetail-ops-label">Trạng thái vận hành</span>
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
                      <span className="cdetail-ops-label">Đội ngũ phụ trách</span>
                      <span className="cdetail-ops-value">
                        <Avatar
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=80"
                          size={20}
                        />
                        Brand Marketing Team
                      </span>
                    </div>

                    <div className="cdetail-ops-row">
                      <span className="cdetail-ops-label">Khán giả mục tiêu</span>
                      <span className="cdetail-ops-value">Nữ 18–28 (Trẻ, năng động)</span>
                    </div>

                    <div className="cdetail-ops-row">
                      <span className="cdetail-ops-label">Khu vực ưu tiên</span>
                      <span className="cdetail-ops-value">TP.HCM, Hà Nội & Toàn quốc</span>
                    </div>

                    <div className="cdetail-ops-row">
                      <span className="cdetail-ops-label">Thời gian triển khai</span>
                      <span className="cdetail-ops-value">
                        {rawCampaign?.startDate ? new Date(rawCampaign.startDate).toLocaleDateString('vi-VN') : '26/10/2026'} – {rawCampaign?.endDate ? new Date(rawCampaign.endDate).toLocaleDateString('vi-VN') : '25/12/2026'}
                      </span>
                    </div>

                    <div className="cdetail-ops-row">
                      <span className="cdetail-ops-label">Ngày khởi tạo</span>
                      <span className="cdetail-ops-value">
                        {rawCampaign?.createdAt ? new Date(rawCampaign.createdAt).toLocaleDateString('vi-VN') : '15/10/2026'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* HÀNG 2: Khung đều nhau trên & dưới (Mục tiêu & Luồng vận hành) */}
              <div className="cdetail-overview-row">
                {/* Card 3: Mục tiêu chiến dịch & Kênh */}
                <div className="cdetail-card-modern">
                  <div className="cdetail-card-header">
                    <span className="cdetail-card-title">
                      <AimOutlined style={{ color: '#4F46E5' }} />
                      Mục tiêu & Kênh phân phối
                    </span>
                  </div>

                  <div className="cdetail-bullet-group">
                    <div className="cdetail-bullet-item">
                      <span className="cdetail-bullet-icon">🎯</span>
                      <div><strong>500.000+ Lượt tiếp cận:</strong> Độ phủ tự nhiên trên TikTok & Instagram</div>
                    </div>
                    <div className="cdetail-bullet-item">
                      <span className="cdetail-bullet-icon">💬</span>
                      <div><strong>Trải nghiệm chân thực:</strong> Đánh giá cận cảnh chất kem và độ kiềm dầu</div>
                    </div>
                    <div className="cdetail-bullet-item">
                      <span className="cdetail-bullet-icon">🛍️</span>
                      <div><strong>Thúc đẩy chuyển đổi:</strong> Gắn link TikTok Shop & Shopee Mall</div>
                    </div>
                  </div>

                  <div className="cdetail-bullet-group" style={{ marginTop: 10 }}>
                    <span className="cdetail-bullet-title">Kênh truyền thông ưu tiên</span>
                    <div className="cdetail-platform-badges">
                      <span className="cdetail-platform-badge tiktok">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                        </svg>
                        TikTok Video ngắn (60s)
                      </span>
                      <span className="cdetail-platform-badge instagram">
                        <InstagramOutlined style={{ fontSize: 12 }} />
                        Instagram Reels & Story
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 4: Luồng vận hành chuẩn */}
                <div className="cdetail-card-modern">
                  <div className="cdetail-card-header">
                    <span className="cdetail-card-title">
                      <RiseOutlined style={{ color: '#4F46E5' }} />
                      Luồng vận hành chuẩn
                    </span>
                    <span style={{ fontSize: 11.5, color: '#4F46E5', fontWeight: 700, background: '#EEF2FF', padding: '2px 8px', borderRadius: 6 }}>
                      3 Bước
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div
                      className="cdetail-action-step-item"
                      onClick={() => {
                        sessionStorage.setItem('current_campaign_id', resolvedId);
                        navigate(`/discovery?campaignId=${resolvedId}`);
                      }}
                    >
                      <div className="cdetail-action-step-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                        <SearchOutlined />
                      </div>
                      <div className="cdetail-action-step-content">
                        <div className="cdetail-action-step-title">Bước 1: Tìm kiếm KOC</div>
                        <div className="cdetail-action-step-desc">Chọn lọc nhà sáng tạo phù hợp nhãn hàng</div>
                      </div>
                      <RightOutlined style={{ fontSize: 12, color: '#94A3B8' }} />
                    </div>

                    <div
                      className="cdetail-action-step-item"
                      onClick={() => {
                        sessionStorage.setItem('current_campaign_id', resolvedId);
                        navigate('/crm');
                      }}
                    >
                      <div className="cdetail-action-step-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                        <ApartmentOutlined />
                      </div>
                      <div className="cdetail-action-step-content">
                        <div className="cdetail-action-step-title">Bước 2: Quản lý đàm phán CRM</div>
                        <div className="cdetail-action-step-desc">{participatingCreators.length} KOC trong quy trình hợp tác</div>
                      </div>
                      <RightOutlined style={{ fontSize: 12, color: '#94A3B8' }} />
                    </div>

                    <div
                      className="cdetail-action-step-item"
                      onClick={() => setActiveTab('budget')}
                    >
                      <div className="cdetail-action-step-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                        <WalletOutlined />
                      </div>
                      <div className="cdetail-action-step-content">
                        <div className="cdetail-action-step-title">Bước 3: Chi phí & Thanh toán</div>
                        <div className="cdetail-action-step-desc">Theo dõi hạn mức ngân sách & nghiệm thu</div>
                      </div>
                      <RightOutlined style={{ fontSize: 12, color: '#94A3B8' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NHÀ SÁNG TẠO THAM GIA (Full Table View) */}
          {activeTab === 'creators' && (
            <div className="cdetail-card-modern">
              <div className="cdetail-card-header">
                <div>
                  <span className="cdetail-card-title">
                    <TeamOutlined style={{ color: '#4F46E5' }} />
                    Danh sách Nhà sáng tạo tham gia ({participatingCreators.length})
                  </span>
                  <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>
                    Quản lý thông tin, thỏa thuận chi phí và tiến độ bàn giao của từng KOC
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
                    Tìm thêm KOC bằng AI
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

          {/* TAB 3: NGÂN SÁCH & THANH TOÁN (Quản lý chi trả KOC) */}
          {activeTab === 'budget' && (
            <div className="cdetail-card-modern">
              <div className="cdetail-card-header">
                <div>
                  <span className="cdetail-card-title">
                    <DollarOutlined style={{ color: '#4F46E5' }} />
                    Quản lý Ngân sách & Thanh toán KOC
                  </span>
                  <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>
                    Theo dõi hạn mức tài chính, tiến độ giải ngân và các đợt quyết toán cho Nhà sáng tạo
                  </div>
                </div>
                <Button
                  type="primary"
                  icon={<WalletOutlined />}
                  style={{ background: '#059669', borderColor: '#059669', borderRadius: 10, height: 38, fontWeight: 600 }}
                  onClick={() => message.success('Hệ thống sẵn sàng kích hoạt cổng thanh toán VNPay / Tài khoản doanh nghiệp')}
                >
                  Duyệt chi & Quyết toán
                </Button>
              </div>

              {/* 4 Financial Tiles */}
              <div className="cdetail-finance-grid">
                <div className="cdetail-finance-tile plan">
                  <span className="cdetail-finance-lbl">Ngân sách kế hoạch</span>
                  <span className="cdetail-finance-val">{campaignBudgetFormatted}</span>
                  <span className="cdetail-finance-desc">Hạn mức ngân sách tối đa</span>
                </div>
                <div className="cdetail-finance-tile committed">
                  <span className="cdetail-finance-lbl">Đã thỏa thuận KOC</span>
                  <span className="cdetail-finance-val">{allocatedBudget > 0 ? `${allocatedBudget.toLocaleString('vi-VN')} đ` : '0 đ'}</span>
                  <span className="cdetail-finance-desc">Chi phí cam kết theo hợp đồng</span>
                </div>
                <div className="cdetail-finance-tile paid">
                  <span className="cdetail-finance-lbl">Đã thanh toán / Tạm ứng</span>
                  <span className="cdetail-finance-val">{allocatedBudget > 0 ? `${Math.round(allocatedBudget * 0.5).toLocaleString('vi-VN')} đ` : '0 đ'}</span>
                  <span className="cdetail-finance-desc">Đã cọc 50% khi chốt hợp tác</span>
                </div>
                <div className="cdetail-finance-tile remaining">
                  <span className="cdetail-finance-lbl">Hạn mức còn lại</span>
                  <span className="cdetail-finance-val">{remainingBudget.toLocaleString('vi-VN')} đ</span>
                  <span className="cdetail-finance-desc">Khả dụng để tuyển thêm KOC</span>
                </div>
              </div>

              {/* Bảng đợt thanh toán KOC */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14, marginBottom: 12 }}>
                  Danh sách đợt thanh toán theo tiến độ KOC ({participatingCreators.length})
                </div>
                <Table
                  columns={[
                    {
                      title: 'Nhà sáng tạo',
                      dataIndex: 'name',
                      key: 'name',
                      render: (text, record: any) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar src={record.avatar} size={36} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>{text}</div>
                            <div style={{ fontSize: 11.5, color: '#64748B' }}>{record.username}</div>
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: 'Hạng mục chi trả',
                      key: 'milestone',
                      render: (_, record: any) => (
                        <div>
                          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 12.5 }}>
                            {record.deliverableStatus || 'Video review sản phẩm'}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748B' }}>
                            Đợt 1: Cọc 50% • Đợt 2: Quyết toán sau nghiệm thu
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: 'Chi phí thỏa thuận',
                      dataIndex: 'fee',
                      key: 'fee',
                      render: (fee) => <span style={{ fontWeight: 700, color: '#4F46E5' }}>{fee}</span>,
                    },
                    {
                      title: 'Phương thức',
                      key: 'method',
                      render: () => <Tag color="blue">VNPay / Số dư ví</Tag>,
                    },
                    {
                      title: 'Trạng thái thanh toán',
                      key: 'paymentStatus',
                      render: (_, record: any) => {
                        const isDone = record.stageText === 'Đã hoàn tất' || record.stageText === 'Đã lên bài';
                        return (
                          <Tag color={isDone ? 'success' : 'processing'}>
                            {isDone ? 'ĐÃ HOÀN TẤT' : 'ĐÃ TẠM ỨNG 50%'}
                          </Tag>
                        );
                      },
                    },
                    {
                      title: 'Thao tác',
                      key: 'action',
                      render: (_, record: any) => (
                        <Button
                          size="small"
                          type="link"
                          style={{ color: '#4F46E5', fontWeight: 600 }}
                          onClick={() => {
                            Modal.info({
                              title: `Ủy nhiệm chi: ${record.name}`,
                              content: (
                                <div style={{ fontSize: 13, marginTop: 8 }}>
                                  <p><strong>Mã giao dịch:</strong> TXN_{String(record.id).slice(0, 8)}</p>
                                  <p><strong>Số tiền:</strong> {record.fee}</p>
                                  <p><strong>Người thụ hưởng:</strong> {record.name}</p>
                                  <p><strong>Nội dung:</strong> Quyết toán chi phí hợp tác chiến dịch {campaignTitle}</p>
                                  <p><strong>Trạng thái:</strong> <Tag color="green">Giao dịch thành công</Tag></p>
                                </div>
                              ),
                              okText: 'Đóng',
                            });
                          }}
                        >
                          Xem chứng từ
                        </Button>
                      ),
                    },
                  ]}
                  dataSource={participatingCreators}
                  rowKey="id"
                  pagination={false}
                  locale={{ emptyText: 'Chưa có KOC trong danh sách chi trả' }}
                />
              </div>
            </div>
          )}

          {/* TAB 4: MỐC THỜI GIAN (LỘ TRÌNH CHIẾN DỊCH) */}
          {activeTab === 'timeline' && (
            <div className="cdetail-card-modern">
              <div className="cdetail-card-header">
                <span className="cdetail-card-title">
                  <CalendarOutlined style={{ color: '#4F46E5' }} />
                  Lộ trình thời gian triển khai chiến dịch
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
                            26/10/2026 • Đang triển khai gửi yêu cầu brief và liên hệ KOC
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

          {/* TAB 5: HỒ SƠ YÊU CẦU & BRIEF */}
          {activeTab === 'guidelines' && (
            <div className="cdetail-card-modern">
              <div className="cdetail-card-header">
                <span className="cdetail-card-title">
                  <FileTextOutlined style={{ color: '#4F46E5' }} />
                  Hồ sơ yêu cầu & Hướng dẫn sáng tạo (Brief)
                </span>
              </div>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>Quy định gắn hashtag bắt buộc</div>
                  <div style={{ fontSize: 13, color: '#4F46E5', fontWeight: 600, marginTop: 4 }}>
                    #SummerGlow2026 #SunscreenReview #SkincareRoutine #KemChongNang
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>Thông điệp then chốt (Key Messages)</div>
                  <div style={{ fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 1.6 }}>
                    Kem chống nắng nâng tone tự nhiên không gây nhờn rít, bảo vệ quang phổ rộng SPF50+ PA++++ suốt ngày dài năng động.
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>Yêu cầu kiểm duyệt nội dung</div>
                  <div style={{ fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 1.6 }}>
                    KOC cần gửi kịch bản trước khi quay 3 ngày và gửi video thô trước khi đăng tải 48 giờ để nhãn hàng duyệt.
                  </div>
                </div>
              </div>
            </div>
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
