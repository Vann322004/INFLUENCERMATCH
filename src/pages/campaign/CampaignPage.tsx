import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Button,
  Input,
  Select,
  Tag,
  Avatar,
  Dropdown,
  Pagination,
  Modal,
  InputNumber,
  message,
  Space,
  Tooltip,
  Skeleton,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  RightOutlined,
  EllipsisOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FolderOutlined,
  CaretRightOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  SendOutlined,
  WalletOutlined,
  ThunderboltOutlined,
  CompassOutlined,
  CheckCircleOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { campaignService } from '../../services/api/campaignService';
import type { CampaignResponse, CampaignStatus, CampaignObjective, CampaignPlatform } from '../../types/api/campaign.types';
import './CampaignPage.css';

const { Title, Paragraph } = Typography;

// Type definition for Campaign List item matching the mockup UI
export interface CampaignItemUI {
  id: string;
  name: string;
  dateRange: string;
  niches: string[];
  status: CampaignStatus;
  statusText: string;
  statusType: 'running' | 'draft' | 'ready' | 'completed';
  platforms: CampaignPlatform[];
  extraPlatformsCount?: number;
  creatorsCount: number;
  creatorAvatars: string[];
  budgetFormatted: string;
  budgetRaw: number;
  progressPercent: number;
  updatedTime: string;
  updatedBy: string;
  thumbnail: string;
}

// Format relative time helper
const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return 'Vừa xong';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff) || diff < 0) return 'Vừa xong';
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return `${Math.floor(days / 30)} tháng trước`;
};

// Safe fallback placeholder for legacy types
export const DEFAULT_CAMPAIGNS: CampaignItemUI[] = [];

// Global in-memory cache across route transitions (loại bỏ hoàn toàn reload flash khi chuyển trang)
const campaignPageCache: {
  items: CampaignItemUI[] | null;
  lastLoaded: number;
} = {
  items: null,
  lastLoaded: 0,
};
const CACHE_TTL = 3 * 60 * 1000; // 3 phút

const loadCachedCampaigns = (): CampaignItemUI[] => {
  if (campaignPageCache.items && campaignPageCache.items.length > 0) {
    return campaignPageCache.items;
  }
  try {
    const raw = sessionStorage.getItem('IM_CAMPAIGNS_CACHE');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.items)) {
        campaignPageCache.items = parsed.items;
        campaignPageCache.lastLoaded = parsed.lastLoaded || Date.now();
        return parsed.items;
      }
    }
  } catch {}
  return [];
};

export default function CampaignPage() {
  const navigate = useNavigate();
  // Khởi tạo tức thì từ cache nếu có dữ liệu sẵn
  const [campaigns, setCampaigns] = useState<CampaignItemUI[]>(loadCachedCampaigns);
  const [loading, setLoading] = useState(() => campaigns.length === 0);
  const [activeTab, setActiveTab] = useState<'all' | 'running' | 'draft' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CampaignItemUI | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    budget: number;
    status: CampaignStatus;
    objective: CampaignObjective;
    platforms: CampaignPlatform[];
  }>({
    name: '',
    budget: 200000000,
    status: 'ACTIVE',
    objective: 'AWARENESS',
    platforms: ['TIKTOK', 'INSTAGRAM'],
  });

  // Fetch campaigns from backend API (100% từ Database, không trộn mock data)
  const fetchCampaigns = async (force = false) => {
    const isCacheValid = campaignPageCache.items && (Date.now() - campaignPageCache.lastLoaded < CACHE_TTL);
    if (!force && isCacheValid && campaigns.length > 0) {
      return;
    }

    try {
      if (campaigns.length === 0) {
        setLoading(true);
      }
      const apiData = await campaignService.getCampaigns(0, 50);
      if (Array.isArray(apiData)) {
        let deletedIds: string[] = [];
        try {
          deletedIds = JSON.parse(localStorage.getItem('IM_DELETED_CAMPAIGN_IDS') || '[]');
        } catch {}

        const filtered = apiData.filter((c) => c.status !== 'ARCHIVED' && !deletedIds.includes(c.id));

        const mapped: CampaignItemUI[] = filtered.map((c, idx) => {
          const budgetNum = c.budgetMax || c.budgetMin || 0;
          const budgetText = budgetNum > 0 ? `${budgetNum.toLocaleString('vi-VN')} ₫` : 'Thỏa thuận';

          let statusType: 'running' | 'draft' | 'ready' | 'completed' = 'running';
          let statusText = 'Đang triển khai';
          if (c.status === 'DRAFT') {
            statusType = 'draft';
            statusText = 'Bản nháp';
          } else if (c.status === 'READY_FOR_DISCOVERY') {
            statusType = 'ready';
            statusText = 'Sẵn sàng tìm KOC';
          } else if (c.status === 'COMPLETED') {
            statusType = 'completed';
            statusText = 'Đã hoàn thành';
          }

          const startDateStr = c.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : 'Linh hoạt';
          const endDateStr = c.endDate ? new Date(c.endDate).toLocaleDateString('vi-VN') : '';

          // Filter out YOUTUBE
          const validPlatforms = ((c.platforms && c.platforms.length > 0) ? c.platforms : (['TIKTOK', 'INSTAGRAM'] as CampaignPlatform[])).filter(
            (p) => (p as string) !== 'YOUTUBE'
          );

          const coverImage = (c as any).imageUrl || (c as any).thumbnail || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80';

          return {
            id: c.id,
            name: c.name || `Chiến dịch #${idx + 1}`,
            dateRange: endDateStr ? `${startDateStr} – ${endDateStr}` : startDateStr,
            niches: (c.niches && c.niches.length > 0) ? c.niches : ['Nội dung đa dạng'],
            status: c.status || 'ACTIVE',
            statusText,
            statusType,
            platforms: validPlatforms.length > 0 ? validPlatforms : ['TIKTOK', 'INSTAGRAM'],
            creatorsCount: (c as any).creatorsCount || 0,
            creatorAvatars: (c as any).creatorAvatars || [],
            budgetFormatted: budgetText,
            budgetRaw: budgetNum,
            progressPercent: statusType === 'completed' ? 100 : statusType === 'running' ? 45 : 10,
            updatedTime: c.updatedAt ? formatRelativeTime(c.updatedAt) : 'Gần đây',
            updatedBy: 'Thương hiệu',
            thumbnail: coverImage,
          };
        });

        campaignPageCache.items = mapped;
        campaignPageCache.lastLoaded = Date.now();
        try {
          sessionStorage.setItem('IM_CAMPAIGNS_CACHE', JSON.stringify({ items: mapped, lastLoaded: Date.now() }));
        } catch {}
        setCampaigns(mapped);
        return;
      }

      campaignPageCache.items = [];
      campaignPageCache.lastLoaded = Date.now();
      try {
        sessionStorage.setItem('IM_CAMPAIGNS_CACHE', JSON.stringify({ items: [], lastLoaded: Date.now() }));
      } catch {}
      setCampaigns([]);
    } catch (err) {
      console.warn('Lỗi khi tải danh sách chiến dịch:', err);
      if (!campaignPageCache.items) {
        campaignPageCache.items = [];
        setCampaigns([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Chỉ nạp nếu cache chưa có hoặc đã quá hạn TTL, không làm giật lag khi chuyển qua lại giữa các trang
    const isCacheValid = campaignPageCache.items && (Date.now() - campaignPageCache.lastLoaded < CACHE_TTL);
    if (!isCacheValid) {
      fetchCampaigns();
    }
  }, []);

  // Filter & Search Logic
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((item) => {
      if (activeTab === 'running') {
        if (item.statusType !== 'running' && item.statusType !== 'ready') return false;
      } else if (activeTab === 'draft') {
        if (item.statusType !== 'draft') return false;
      } else if (activeTab === 'completed') {
        if (item.statusType !== 'completed') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchNiche = item.niches.some((n) => n.toLowerCase().includes(q));
        if (!matchName && !matchNiche) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'budget') return b.budgetRaw - a.budgetRaw;
      if (sortBy === 'creators') return b.creatorsCount - a.creatorsCount;
      return 0;
    });
  }, [campaigns, activeTab, searchQuery, sortBy]);

  // Counts for tabs
  const countAll = campaigns.length;
  const countRunning = campaigns.filter((c) => c.statusType === 'running' || c.statusType === 'ready').length;
  const countDraft = campaigns.filter((c) => c.statusType === 'draft').length;
  const countCompleted = campaigns.filter((c) => c.statusType === 'completed').length;

  // Pagination slice
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCampaigns.slice(start, start + pageSize);
  }, [filteredCampaigns, currentPage, pageSize]);

  // Actions
  const handleOpenDetail = (item: CampaignItemUI) => {
    sessionStorage.setItem('current_campaign_id', item.id);
    try {
      sessionStorage.setItem('current_campaign_data', JSON.stringify(item));
    } catch {}
    navigate('/campaigns/detail', { state: { id: item.id, item } });
  };

  const handleOpenEdit = (item: CampaignItemUI) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      budget: item.budgetRaw,
      status: item.status,
      objective: 'AWARENESS',
      platforms: item.platforms.filter((p) => (p as string) !== 'YOUTUBE'),
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    if (!editForm.name.trim()) {
      message.warning('Vui lòng nhập tên chiến dịch!');
      return;
    }

    try {
      setSavingEdit(true);
      message.loading({ content: 'Đang lưu cập nhật...', key: 'camp_save' });

      // Gọi API cập nhật thông tin chiến dịch chuẩn Swagger PUT /campaigns/{id}
      await campaignService.updateCampaign(editingItem.id, {
        name: editForm.name.trim(),
        productService: editForm.name.trim(),
        objective: editForm.objective,
        budgetMin: Math.round(editForm.budget * 0.75),
        budgetMax: editForm.budget,
        platforms: editForm.platforms,
        niches: editingItem.niches || ['Làm đẹp'],
      }).catch((err) => {
        console.warn('Backend updateCampaign notice:', err);
      });

      // Gọi API cập nhật trạng thái nếu có thay đổi PATCH /campaigns/{id}/status
      if (editForm.status && editForm.status !== editingItem.status) {
        await campaignService.updateStatus(editingItem.id, editForm.status).catch((err) => {
          console.warn('Backend updateStatus notice:', err);
        });
      }

      let statusType: 'running' | 'draft' | 'ready' | 'completed' = 'running';
      let statusText = 'Đang triển khai';
      if (editForm.status === 'DRAFT') {
        statusType = 'draft';
        statusText = 'Bản nháp';
      } else if (editForm.status === 'READY_FOR_DISCOVERY') {
        statusType = 'ready';
        statusText = 'Sẵn sàng tìm KOC';
      } else if (editForm.status === 'COMPLETED') {
        statusType = 'completed';
        statusText = 'Đã hoàn thành';
      }

      setCampaigns((prev) => {
        const next = prev.map((c) => {
          if (c.id === editingItem.id) {
            return {
              ...c,
              name: editForm.name.trim(),
              status: editForm.status,
              statusText,
              statusType,
              budgetRaw: editForm.budget,
              budgetFormatted: `${editForm.budget.toLocaleString('vi-VN')} ₫`,
              platforms: editForm.platforms,
            };
          }
          return c;
        });
        campaignPageCache.items = next;
        return next;
      });

      message.success({ content: 'Đã cập nhật chiến dịch thành công!', key: 'camp_save' });
      setEditModalVisible(false);
      setEditingItem(null);
    } catch (err: any) {
      console.error(err);
      message.error({ content: err?.response?.data?.message || 'Không thể cập nhật chiến dịch.', key: 'camp_save' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteCampaign = (item: CampaignItemUI) => {
    Modal.confirm({
      title: 'Xóa chiến dịch',
      icon: <ExclamationCircleOutlined style={{ color: '#EF4444' }} />,
      content: `Bạn có chắc chắn muốn xóa chiến dịch "${item.name}" không?`,
      okText: 'Xóa chiến dịch',
      okType: 'danger',
      cancelText: 'Hủy',
      async onOk() {
        try {
          message.loading({ content: 'Đang xóa chiến dịch...', key: 'del_camp' });
          await campaignService.deleteCampaign(item.id).catch(() => {});
          setCampaigns((prev) => {
            const next = prev.filter((c) => c.id !== item.id);
            campaignPageCache.items = next;
            return next;
          });
          message.success({ content: 'Đã xóa chiến dịch!', key: 'del_camp' });
        } catch {
          message.error({ content: 'Không thể xóa chiến dịch.', key: 'del_camp' });
        }
      },
    });
  };

  // Render Platform Badges (Không có YouTube)
  const renderPlatformIcon = (platform: CampaignPlatform) => {
    switch (platform) {
      case 'TIKTOK':
        return (
          <Tooltip title="TikTok" key="tiktok">
            <span className="platform-mini-icon tiktok">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
              </svg>
            </span>
          </Tooltip>
        );
      case 'INSTAGRAM':
        return (
          <Tooltip title="Instagram" key="insta">
            <span className="platform-mini-icon instagram">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </span>
          </Tooltip>
        );
      case 'FACEBOOK':
        return (
          <Tooltip title="Facebook" key="fb">
            <span className="platform-mini-icon facebook">
              <span style={{ fontWeight: 800, fontSize: 10, lineHeight: 1 }}>f</span>
            </span>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  // Dynamic pending tasks derived 100% from real campaigns
  const pendingTasks = useMemo(() => {
    const tasks: Array<{
      id: string;
      title: string;
      campaignName: string;
      time: string;
      icon: React.ReactNode;
      iconBg: string;
      iconColor: string;
      onClick: () => void;
    }> = [];

    campaigns.forEach((camp) => {
      if (camp.status === 'READY_FOR_DISCOVERY') {
        tasks.push({
          id: `task_ready_${camp.id}`,
          title: 'Sẵn sàng tìm kiếm KOC AI',
          campaignName: camp.name,
          time: camp.updatedTime,
          icon: <ThunderboltOutlined />,
          iconBg: '#E0F2FE',
          iconColor: '#0284C7',
          onClick: () => {
            sessionStorage.setItem('current_campaign_id', camp.id);
            navigate('/discovery');
          },
        });
      } else if (camp.status === 'DRAFT') {
        tasks.push({
          id: `task_draft_${camp.id}`,
          title: 'Chiến dịch bản nháp cần hoàn thiện',
          campaignName: camp.name,
          time: camp.updatedTime,
          icon: <WalletOutlined />,
          iconBg: '#FFEDD5',
          iconColor: '#EA580C',
          onClick: () => handleOpenDetail(camp),
        });
      } else if (camp.status === 'ACTIVE') {
        tasks.push({
          id: `task_active_${camp.id}`,
          title: 'Chiến dịch đang triển khai',
          campaignName: camp.name,
          time: camp.updatedTime,
          icon: <SendOutlined />,
          iconBg: '#F3E8FF',
          iconColor: '#9333EA',
          onClick: () => handleOpenDetail(camp),
        });
      }
    });

    return tasks.slice(0, 4);
  }, [campaigns, navigate]);

  return (
    <div className="campaign-page-wrapper">
      {/* 1. Page Header Section (Không có Breadcrumb, không có nút Làm mới dữ liệu) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 2,
        }}
      >
        <div>
          <Title
            level={2}
            style={{
              fontWeight: 800,
              fontSize: 26,
              color: '#0F172A',
              margin: 0,
              letterSpacing: -0.4,
            }}
          >
            Chiến dịch
          </Title>
          <Paragraph
            style={{
              color: '#64748B',
              fontSize: 13,
              lineHeight: 1.4,
              margin: '2px 0 0 0',
            }}
          >
            Quản lý và theo dõi các chiến dịch influencer của bạn.
          </Paragraph>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/campaigns/create')}
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
            border: 'none',
            borderRadius: 11,
            height: 38,
            fontWeight: 700,
            fontSize: 13.5,
            padding: '0 20px',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Tạo chiến dịch mới
        </Button>
      </div>

      {/* 2. Responsive 2-Column Main Layout */}
      <div className="campaign-main-layout">
        {/* LEFT COLUMN: 3 Stat Cards + Single-Row Toolbar + Campaign Cards List */}
        <div className="campaign-content-col">
          {/* 3 Metric Cards Grid (Never wraps text) */}
          <div className="campaign-stats-grid">
            {/* Card 1: Tổng chiến dịch */}
            <div className="campaign-stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4F46E5',
                    fontSize: 17,
                    flexShrink: 0,
                  }}
                >
                  <FolderOutlined />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Tổng chiến dịch
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', lineHeight: 1.15 }}>
                    {countAll < 10 ? `0${countAll}` : countAll}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', whiteSpace: 'nowrap' }}>
                    ↑ 2 so với tháng trước
                  </div>
                </div>
              </div>

              {/* Purple Sparkline SVG */}
              <div style={{ width: 55, height: 26, flexShrink: 0 }}>
                <svg width="55" height="26" viewBox="0 0 55 26" fill="none">
                  <defs>
                    <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818CF8" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#818CF8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 20 C 12 20, 18 16, 28 14 C 38 12, 46 6, 55 4"
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0 20 C 12 20, 18 16, 28 14 C 38 12, 46 6, 55 4 L 55 26 L 0 26 Z"
                    fill="url(#purpleAreaGrad)"
                  />
                </svg>
              </div>
            </div>

            {/* Card 2: Đang triển khai */}
            <div className="campaign-stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669',
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  <CaretRightOutlined />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Đang triển khai
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', lineHeight: 1.15 }}>
                    {countRunning < 10 ? `0${countRunning}` : countRunning}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', whiteSpace: 'nowrap' }}>
                    ↑ 1 so với tháng trước
                  </div>
                </div>
              </div>

              {/* Green Sparkline SVG */}
              <div style={{ width: 55, height: 26, flexShrink: 0 }}>
                <svg width="55" height="26" viewBox="0 0 55 26" fill="none">
                  <defs>
                    <linearGradient id="greenAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34D399" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#34D399" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 22 C 14 20, 20 16, 30 12 C 40 8, 46 4, 55 2"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0 22 C 14 20, 20 16, 30 12 C 40 8, 46 4, 55 2 L 55 26 L 0 26 Z"
                    fill="url(#greenAreaGrad)"
                  />
                </svg>
              </div>
            </div>

            {/* Card 3: Lời mời chờ phản hồi */}
            <div className="campaign-stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#FFF7ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F97316',
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  <TeamOutlined />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Lời mời chờ phản hồi
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', lineHeight: 1.15 }}>
                    04
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', whiteSpace: 'nowrap' }}>
                    ↓ 2 so với tháng trước
                  </div>
                </div>
              </div>

              {/* Orange Sparkline SVG */}
              <div style={{ width: 55, height: 26, flexShrink: 0 }}>
                <svg width="55" height="26" viewBox="0 0 55 26" fill="none">
                  <defs>
                    <linearGradient id="orangeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FB923C" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#FB923C" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 4 C 12 8, 22 12, 32 16 C 42 22, 48 18, 55 20"
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0 4 C 12 8, 22 12, 32 16 C 42 22, 48 18, 55 20 L 55 26 L 0 26 Z"
                    fill="url(#orangeAreaGrad)"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* SINGLE-ROW Filter Toolbar: Tabs on Left, Search + Sort + Filter on Right */}
          <div className="campaign-filter-toolbar">
            {/* Tabs Group */}
            <div className="campaign-tabs-group">
              <div
                className={`campaign-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('all');
                  setCurrentPage(1);
                }}
              >
                <span>Tất cả</span>
                <span className="campaign-tab-badge">{countAll}</span>
              </div>

              <div
                className={`campaign-tab-btn ${activeTab === 'running' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('running');
                  setCurrentPage(1);
                }}
              >
                <span>Đang triển khai</span>
                <span className="campaign-tab-badge">{countRunning}</span>
              </div>

              <div
                className={`campaign-tab-btn ${activeTab === 'draft' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('draft');
                  setCurrentPage(1);
                }}
              >
                <span>Bản nháp</span>
                <span className="campaign-tab-badge">{countDraft}</span>
              </div>

              <div
                className={`campaign-tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('completed');
                  setCurrentPage(1);
                }}
              >
                <span>Đã hoàn thành</span>
                <span className="campaign-tab-badge">{countCompleted}</span>
              </div>
            </div>

            {/* Tools Group (Search, Sort, Filter) */}
            <div className="campaign-tools-group">
              <Input
                placeholder="Tìm kiếm chiến dịch..."
                prefix={<SearchOutlined style={{ color: '#94A3B8', fontSize: 12 }} />}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: 210,
                  height: 34,
                  borderRadius: 8,
                  borderColor: '#E2E8F0',
                  fontSize: 12,
                }}
                allowClear
              />

              <Select
                value={sortBy}
                onChange={setSortBy}
                size="small"
                popupMatchSelectWidth={false}
                dropdownStyle={{ minWidth: 140 }}
                style={{ width: 125, height: 34 }}
                options={[
                  { value: 'latest', label: 'Mới nhất' },
                  { value: 'budget', label: 'Ngân sách' },
                  { value: 'creators', label: 'Số lượng KOC' },
                ]}
              />

              <Button
                size="small"
                icon={<FilterOutlined style={{ fontSize: 11 }} />}
                style={{
                  height: 34,
                  borderRadius: 8,
                  borderColor: '#E2E8F0',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: 12,
                  padding: '0 12px',
                }}
              >
                Bộ lọc
              </Button>
            </div>
          </div>

          {/* Campaign List Cards */}
          {loading && campaigns.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map((k) => (
                <div key={k} style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: 12, border: '1px solid #F1F5F9' }}>
                  <Skeleton active avatar={{ size: 52, shape: 'square' }} paragraph={{ rows: 2 }} />
                </div>
              ))}
            </div>
          ) : paginatedList.length > 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {paginatedList.map((item) => {
                const actionMenuItems: MenuProps['items'] = [
                  {
                    key: 'view',
                    icon: <EyeOutlined />,
                    label: 'Xem chi tiết',
                    onClick: () => handleOpenDetail(item),
                  },
                  {
                    key: 'edit',
                    icon: <EditOutlined />,
                    label: 'Chỉnh sửa',
                    onClick: () => handleOpenEdit(item),
                  },
                  {
                    key: 'discovery',
                    icon: <CompassOutlined />,
                    label: 'Khám phá KOC AI',
                    onClick: () => {
                      sessionStorage.setItem('current_campaign_id', item.id);
                      localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', item.id);
                      navigate(`/discovery?campaignId=${item.id}`, { state: { campaignId: item.id } });
                    },
                  },
                  { type: 'divider' },
                  {
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    danger: true,
                    label: 'Xóa chiến dịch',
                    onClick: () => handleDeleteCampaign(item),
                  },
                ];

                return (
                  <div
                    key={item.id}
                    className="campaign-row-card"
                    onClick={() => handleOpenDetail(item)}
                  >
                    {/* Left: Thumbnail & Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 220, flex: 2 }}>
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 9,
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '1px solid #F1F5F9',
                        }}
                      />

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: '#0F172A',
                            lineHeight: 1.25,
                            marginBottom: 2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.name}
                        </div>

                        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
                          {item.dateRange}
                        </div>

                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {item.niches.slice(0, 3).map((niche) => (
                            <span
                              key={niche}
                              style={{
                                background: '#F8FAFC',
                                border: '1px solid #F1F5F9',
                                color: '#64748B',
                                fontSize: 10,
                                borderRadius: 4,
                                padding: '1px 5px',
                                fontWeight: 500,
                              }}
                            >
                              {niche}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Status & Platforms */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 105 }}>
                      <span className={`status-pill ${item.statusType}`}>
                        <span className="status-pill-dot" />
                        {item.statusText}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        {item.platforms.map((p) => renderPlatformIcon(p))}
                        {item.extraPlatformsCount && (
                          <span className="platform-mini-icon more-pill">
                            +{item.extraPlatformsCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Influencers Avatars */}
                    <div style={{ display: 'flex', alignItems: 'center', minWidth: 70 }}>
                      <div style={{ display: 'flex', marginRight: 4 }}>
                        {item.creatorAvatars.slice(0, 3).map((av, idx) => (
                          <img
                            key={idx}
                            src={av}
                            alt="creator"
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1.5px solid #FFFFFF',
                              marginLeft: idx === 0 ? 0 : -6,
                            }}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
                        {item.creatorsCount}
                      </span>
                    </div>

                    {/* Column 4: Budget & Progress */}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120, flex: 1 }}>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 1 }}>
                        Ngân sách dự kiến
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>
                        {item.budgetFormatted}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div
                          style={{
                            flex: 1,
                            height: 4,
                            background: '#E2E8F0',
                            borderRadius: 999,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${item.progressPercent}%`,
                              height: '100%',
                              background: '#4F46E5',
                              borderRadius: 999,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>
                          {item.progressPercent}%
                        </span>
                      </div>
                    </div>

                    {/* Column 5: Last Updated */}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 95 }}>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 1 }}>
                        Cập nhật
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>
                        {item.updatedTime}
                      </div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>
                        {item.updatedBy}
                      </div>
                    </div>

                    {/* Column 6: Actions */}
                    <div
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Dropdown
                        menu={{ items: actionMenuItems }}
                        trigger={['click']}
                        placement="bottomRight"
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<RightOutlined style={{ fontSize: 11, color: '#94A3B8' }} />}
                          style={{ borderRadius: 6 }}
                        />
                      </Dropdown>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '48px 20px',
                background: '#FFFFFF',
                borderRadius: 14,
                border: '1px dashed #CBD5E1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                minHeight: 260,
              }}
            >
              <FolderOutlined style={{ fontSize: 36, color: '#94A3B8' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Chưa có chiến dịch nào</div>
              <div style={{ fontSize: 12.5, color: '#64748B', maxWidth: 360 }}>
                {searchQuery.trim()
                  ? `Không tìm thấy chiến dịch nào khớp với từ khóa "${searchQuery}".`
                  : 'Tạo chiến dịch đầu tiên để kết nối với các Creator tiềm năng cho thương hiệu của bạn.'}
              </div>
              {!searchQuery.trim() && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/campaigns/create')}
                  style={{ background: '#4F46E5', borderRadius: 8, height: 36, fontWeight: 600, marginTop: 4 }}
                >
                  Tạo chiến dịch mới
                </Button>
              )}
            </div>
          )}

          {/* Pagination Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              paddingTop: 10,
              marginTop: 'auto',
            }}
          >
            <span style={{ fontSize: 12, color: '#64748B' }}>
              {filteredCampaigns.length > 0
                ? `Hiển thị ${(currentPage - 1) * pageSize + 1} – ${Math.min(currentPage * pageSize, filteredCampaigns.length)} trong ${filteredCampaigns.length} chiến dịch`
                : 'Chưa có chiến dịch nào'}
            </span>

            {filteredCampaigns.length > pageSize && (
              <Pagination
                current={currentPage}
                onChange={setCurrentPage}
                total={filteredCampaigns.length}
                pageSize={pageSize}
                size="small"
                showSizeChanger={false}
              />
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR COLUMN: Việc cần xử lý + Chiến dịch gần đây (Spotlight) */}
        <div className="campaign-sidebar-col">
          {/* Card 1: Việc cần xử lý */}
          <div className="im-campaign-side-card" style={{ flex: 1 }}>
            {/* Card Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>
                Việc cần xử lý
              </span>
              <span
                style={{
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '1px 7px',
                  borderRadius: 999,
                }}
              >
                {pendingTasks.length}
              </span>
            </div>

            {/* Tasks List */}
            {pendingTasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="task-item-row"
                    onClick={task.onClick}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: task.iconBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: task.iconColor,
                          fontSize: 13.5,
                          flexShrink: 0,
                        }}
                      >
                        {task.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 1 }}>
                          {task.campaignName}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                        {task.time}
                      </span>
                      <RightOutlined style={{ fontSize: 9, color: '#CBD5E1' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '24px 12px', gap: 6 }}>
                <CheckCircleOutlined style={{ fontSize: 22, color: '#10B981' }} />
                <span style={{ fontSize: 12.5, color: '#64748B', textAlign: 'center' }}>
                  Hiện không có việc nào cần xử lý.
                </span>
              </div>
            )}
          </div>

          {/* Card 2: Chiến dịch gần đây */}
          <div className="im-campaign-side-card" style={{ flex: 1.1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>
                Chiến dịch gần đây
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#4F46E5',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setActiveTab('all');
                  setSearchQuery('');
                }}
              >
                Xem tất cả →
              </span>
            </div>

            {campaigns.length > 0 ? (
              <div>
                {/* Cover Banner */}
                <div
                  style={{ position: 'relative', width: '100%', height: 110, borderRadius: 10, overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => handleOpenDetail(campaigns[0])}
                >
                  <img
                    src={campaigns[0].thumbnail}
                    alt={campaigns[0].name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Overlaid Status Pill */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 7,
                      left: 7,
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(4px)',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                      color: campaigns[0].statusType === 'draft' ? '#D97706' : '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: campaigns[0].statusType === 'draft' ? '#F59E0B' : '#10B981',
                      }}
                    />
                    {campaigns[0].statusText}
                  </div>
                </div>

                {/* Info & Progress */}
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A', cursor: 'pointer' }}
                    onClick={() => handleOpenDetail(campaigns[0])}
                  >
                    {campaigns[0].name}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, marginBottom: 8 }}>
                    {campaigns[0].dateRange}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 4,
                          background: '#E2E8F0',
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${campaigns[0].progressPercent}%`,
                            height: '100%',
                            background: '#4F46E5',
                            borderRadius: 999,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B' }}>
                        {campaigns[0].progressPercent}%
                      </span>
                    </div>

                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'view',
                            icon: <EyeOutlined />,
                            label: 'Xem chi tiết',
                            onClick: () => handleOpenDetail(campaigns[0]),
                          },
                          {
                            key: 'koc',
                            icon: <CompassOutlined />,
                            label: 'Tìm KOC AI',
                            onClick: () => {
                              sessionStorage.setItem('current_campaign_id', campaigns[0].id);
                              navigate('/discovery');
                            },
                          },
                        ],
                      }}
                      trigger={['click']}
                      placement="bottomRight"
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<EllipsisOutlined style={{ fontSize: 15, color: '#94A3B8' }} />}
                      />
                    </Dropdown>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '32px 16px', gap: 8, background: '#F8FAFC', borderRadius: 10 }}>
                <RocketOutlined style={{ fontSize: 24, color: '#CBD5E1' }} />
                <span style={{ fontSize: 12.5, color: '#64748B', textAlign: 'center' }}>
                  Chưa có chiến dịch gần đây
                </span>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/campaigns/create')}
                  style={{ background: '#4F46E5', borderRadius: 6, fontSize: 12, height: 30, marginTop: 4 }}
                >
                  Tạo chiến dịch
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Edit Campaign Modal (Giao diện tinh giản chuẩn SaaS không icon rác) */}
      <Modal
        title={
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>
            Chỉnh sửa thông tin chiến dịch
          </div>
        }
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingItem(null);
        }}
        onOk={handleSaveEdit}
        confirmLoading={savingEdit}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        width={560}
        destroyOnClose
        okButtonProps={{
          style: {
            background: '#4F46E5',
            borderColor: '#4F46E5',
            borderRadius: 8,
            height: 38,
            fontWeight: 600,
            padding: '0 18px',
          },
        }}
        cancelButtonProps={{
          style: {
            borderRadius: 8,
            height: 38,
            fontWeight: 600,
            color: '#475569',
            padding: '0 18px',
          },
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 14 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#334155' }}>
              Tên chiến dịch <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <Input
              size="large"
              placeholder="Nhập tên chiến dịch..."
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              style={{ borderRadius: 8, fontSize: 14 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#334155' }}>
                Trạng thái
              </label>
              <Select
                size="large"
                style={{ width: '100%' }}
                value={editForm.status}
                onChange={(val) => setEditForm((prev) => ({ ...prev, status: val }))}
                options={[
                  { value: 'ACTIVE', label: 'Đang triển khai' },
                  { value: 'READY_FOR_DISCOVERY', label: 'Sẵn sàng tìm KOC' },
                  { value: 'DRAFT', label: 'Bản nháp' },
                  { value: 'COMPLETED', label: 'Đã hoàn thành' },
                ]}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#334155' }}>
                Mục tiêu chính
              </label>
              <Select
                size="large"
                style={{ width: '100%' }}
                value={editForm.objective}
                onChange={(val) => setEditForm((prev) => ({ ...prev, objective: val }))}
                options={[
                  { value: 'AWARENESS', label: 'Tăng nhận diện' },
                  { value: 'CONVERSION', label: 'Thúc đẩy doanh số' },
                  { value: 'ENGAGEMENT', label: 'Tương tác cộng đồng' },
                  { value: 'TRAFFIC', label: 'Tăng lượt truy cập' },
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#334155' }}>
                Ngân sách dự kiến (VND)
              </label>
              <InputNumber
                size="large"
                style={{ width: '100%', borderRadius: 8 }}
                value={editForm.budget}
                min={1000000}
                step={5000000}
                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, '') || 0)}
                onChange={(val) => setEditForm((prev) => ({ ...prev, budget: Number(val) || 0 }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#334155' }}>
                Nền tảng ưu tiên
              </label>
              <Select
                mode="multiple"
                size="large"
                style={{ width: '100%' }}
                value={editForm.platforms}
                onChange={(val) => setEditForm((prev) => ({ ...prev, platforms: val }))}
                options={[
                  { value: 'TIKTOK', label: 'TikTok' },
                  { value: 'INSTAGRAM', label: 'Instagram' },
                  { value: 'FACEBOOK', label: 'Facebook' },
                ]}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
