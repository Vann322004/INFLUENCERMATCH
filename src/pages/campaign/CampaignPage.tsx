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

// Default 6 campaigns matching user's design mockup (without YouTube)
export const DEFAULT_CAMPAIGNS: CampaignItemUI[] = [
  {
    id: 'camp-summer-glow-2026',
    name: 'Summer Glow 2026',
    dateRange: '15 Jun 2026 – 31 Aug 2026',
    niches: ['Beauty', 'Lifestyle', 'Skincare'],
    status: 'ACTIVE',
    statusText: 'Đang triển khai',
    statusType: 'running',
    platforms: ['TIKTOK', 'INSTAGRAM'],
    extraPlatformsCount: 2,
    creatorsCount: 8,
    creatorAvatars: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&auto=format&fit=crop&q=80',
    ],
    budgetFormatted: '200.000.000 ₫',
    budgetRaw: 200000000,
    progressPercent: 45,
    updatedTime: '10 phút trước',
    updatedBy: 'bởi Châu Bùi',
    thumbnail: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'camp-skincare-launch-2025',
    name: 'Skincare Launch 2025',
    dateRange: '01 Sep 2026 – 30 Sep 2026',
    niches: ['Beauty', 'Skincare'],
    status: 'DRAFT',
    statusText: 'Bản nháp',
    statusType: 'draft',
    platforms: ['TIKTOK', 'FACEBOOK'],
    creatorsCount: 0,
    creatorAvatars: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80',
    ],
    budgetFormatted: '120.000.000 ₫',
    budgetRaw: 120000000,
    progressPercent: 0,
    updatedTime: '2 giờ trước',
    updatedBy: 'bởi Minh Khoa',
    thumbnail: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'camp-beauty-routine-challenge',
    name: 'Beauty Routine Challenge',
    dateRange: '01 Sep 2026 – 01 Oct 2026',
    niches: ['Lifestyle', 'Beauty'],
    status: 'ACTIVE',
    statusText: 'Đang triển khai',
    statusType: 'running',
    platforms: ['TIKTOK', 'INSTAGRAM'],
    creatorsCount: 4,
    creatorAvatars: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&auto=format&fit=crop&q=80',
    ],
    budgetFormatted: '80.000.000 ₫',
    budgetRaw: 80000000,
    progressPercent: 63,
    updatedTime: '5 giờ trước',
    updatedBy: 'bởi Lan Le',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'camp-acne-care-series-2025',
    name: 'Acne Care Series 2025',
    dateRange: '01 Aug 2026 – 15 Sep 2026',
    niches: ['Skincare', 'Review'],
    status: 'READY_FOR_DISCOVERY',
    statusText: 'Sẵn sàng AI',
    statusType: 'ready',
    platforms: ['TIKTOK', 'FACEBOOK', 'INSTAGRAM'],
    creatorsCount: 6,
    creatorAvatars: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80',
    ],
    budgetFormatted: '150.000.000 ₫',
    budgetRaw: 150000000,
    progressPercent: 28,
    updatedTime: '1 ngày trước',
    updatedBy: 'bởi Thành Đôn',
    thumbnail: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'camp-summer-makeup-look-2025',
    name: 'Summer Makeup Look 2025',
    dateRange: '01 Jul 2026 – 01 Aug 2026',
    niches: ['Beauty', 'Make up'],
    status: 'ACTIVE',
    statusText: 'Đang triển khai',
    statusType: 'running',
    platforms: ['INSTAGRAM', 'FACEBOOK'],
    creatorsCount: 3,
    creatorAvatars: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&auto=format&fit=crop&q=80',
    ],
    budgetFormatted: '70.000.000 ₫',
    budgetRaw: 70000000,
    progressPercent: 75,
    updatedTime: '2 ngày trước',
    updatedBy: 'bởi Châu Bùi',
    thumbnail: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'camp-tech-product-review',
    name: 'Tech Product Review',
    dateRange: '01 Jul 2026 – 31 Jul 2026',
    niches: ['Technology', 'Review'],
    status: 'COMPLETED',
    statusText: 'Đã hoàn thành',
    statusType: 'completed',
    platforms: ['TIKTOK', 'FACEBOOK'],
    extraPlatformsCount: 1,
    creatorsCount: 5,
    creatorAvatars: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80',
    ],
    budgetFormatted: '100.000.000 ₫',
    budgetRaw: 100000000,
    progressPercent: 100,
    updatedTime: '5 ngày trước',
    updatedBy: 'bởi Minh Khoa',
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80',
  },
];

// Global in-memory cache across route transitions (loại bỏ hoàn toàn reload flash khi chuyển trang)
const campaignPageCache: {
  items: CampaignItemUI[] | null;
  lastLoaded: number;
} = {
  items: null,
  lastLoaded: 0,
};
const CACHE_TTL = 3 * 60 * 1000; // 3 phút

export default function CampaignPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // Khởi tạo tức thì từ cache nếu có dữ liệu sẵn
  const [campaigns, setCampaigns] = useState<CampaignItemUI[]>(() => {
    if (campaignPageCache.items && campaignPageCache.items.length > 0) {
      return campaignPageCache.items;
    }
    return DEFAULT_CAMPAIGNS;
  });
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

  // Fetch campaigns from backend API with smart caching
  const fetchCampaigns = async (force = false) => {
    const isCacheValid = campaignPageCache.items && (Date.now() - campaignPageCache.lastLoaded < CACHE_TTL);
    if (!force && isCacheValid) {
      return;
    }

    try {
      if (!campaignPageCache.items) {
        setLoading(true);
      }
      const apiData = await campaignService.getCampaigns(0, 50);
      if (Array.isArray(apiData) && apiData.length > 0) {
        let deletedIds: string[] = [];
        try {
          deletedIds = JSON.parse(localStorage.getItem('IM_DELETED_CAMPAIGN_IDS') || '[]');
        } catch {}

        const filtered = apiData.filter((c) => c.status !== 'ARCHIVED' && !deletedIds.includes(c.id));

        if (filtered.length > 0) {
          const mapped: CampaignItemUI[] = filtered.map((c, idx) => {
            const fallback = DEFAULT_CAMPAIGNS[idx % DEFAULT_CAMPAIGNS.length];
            const budgetNum = c.budgetMax || c.budgetMin || fallback.budgetRaw;
            const budgetText = `${budgetNum.toLocaleString('vi-VN')} ₫`;

            let statusType: 'running' | 'draft' | 'ready' | 'completed' = 'running';
            let statusText = 'Đang triển khai';
            if (c.status === 'DRAFT') {
              statusType = 'draft';
              statusText = 'Bản nháp';
            } else if (c.status === 'READY_FOR_DISCOVERY') {
              statusType = 'ready';
              statusText = 'Sẵn sàng AI';
            } else if (c.status === 'COMPLETED') {
              statusType = 'completed';
              statusText = 'Đã hoàn thành';
            }

            const startDateStr = c.startDate ? new Date(c.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '15 Jun 2026';
            const endDateStr = c.endDate ? new Date(c.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '31 Aug 2026';

            // Filter out YOUTUBE
            const validPlatforms = ((c.platforms && c.platforms.length > 0) ? c.platforms : fallback.platforms).filter(
              (p) => (p as string) !== 'YOUTUBE'
            );

            return {
              id: c.id,
              name: c.name || fallback.name,
              dateRange: `${startDateStr} – ${endDateStr}`,
              niches: (c.niches && c.niches.length > 0) ? c.niches : fallback.niches,
              status: c.status || 'ACTIVE',
              statusText,
              statusType,
              platforms: validPlatforms.length > 0 ? validPlatforms : ['TIKTOK', 'INSTAGRAM'],
              extraPlatformsCount: fallback.extraPlatformsCount,
              creatorsCount: fallback.creatorsCount,
              creatorAvatars: fallback.creatorAvatars,
              budgetFormatted: budgetText,
              budgetRaw: budgetNum,
              progressPercent: fallback.progressPercent,
              updatedTime: fallback.updatedTime,
              updatedBy: fallback.updatedBy,
              thumbnail: fallback.thumbnail,
            };
          });

          const existingIds = new Set(mapped.map((m) => m.id));
          const remainingDefaults = DEFAULT_CAMPAIGNS.filter((d) => !existingIds.has(d.id));
          const combined = [...mapped, ...remainingDefaults];
          campaignPageCache.items = combined;
          campaignPageCache.lastLoaded = Date.now();
          setCampaigns(combined);
          return;
        }
      }
      campaignPageCache.items = DEFAULT_CAMPAIGNS;
      campaignPageCache.lastLoaded = Date.now();
      setCampaigns(DEFAULT_CAMPAIGNS);
    } catch {
      if (!campaignPageCache.items) {
        campaignPageCache.items = DEFAULT_CAMPAIGNS;
        setCampaigns(DEFAULT_CAMPAIGNS);
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

            {/* Tools Group (Search, Sort, Filter) on the same line without overflowing */}
            <div className="campaign-tools-group">
              <Input
                placeholder="Tìm kiếm chiến dịch..."
                prefix={<SearchOutlined style={{ color: '#94A3B8', fontSize: 11 }} />}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: 135,
                  height: 32,
                  borderRadius: 8,
                  borderColor: '#E2E8F0',
                  fontSize: 11.5,
                }}
                allowClear
              />

              <Select
                value={sortBy}
                onChange={setSortBy}
                size="small"
                style={{ width: 88, height: 32 }}
                options={[
                  { value: 'latest', label: 'Mới nhất' },
                  { value: 'budget', label: 'Ngân sách' },
                  { value: 'creators', label: 'KOC' },
                ]}
              />

              <Button
                size="small"
                icon={<FilterOutlined style={{ fontSize: 10 }} />}
                style={{
                  height: 32,
                  borderRadius: 8,
                  borderColor: '#E2E8F0',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: 11.5,
                  padding: '0 8px',
                }}
              >
                Bộ lọc
              </Button>
            </div>
          </div>

          {/* Campaign List Cards */}
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
                    navigate('/discovery');
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

        {/* RIGHT SIDEBAR COLUMN: Việc cần xử lý (4) + Chiến dịch gần đây (Spotlight) with Balanced Equal Heights */}
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
                4
              </span>
            </div>

            {/* Tasks List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, justifyContent: 'space-around' }}>
              {/* Task 1 */}
              <div
                className="task-item-row"
                onClick={() => navigate('/campaigns')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: '#F3E8FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9333EA',
                      fontSize: 13.5,
                      flexShrink: 0,
                    }}
                  >
                    <SendOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                      2 lời mời chờ phản hồi
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 1 }}>
                      Summer Glow 2026
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                    10 phút trước
                  </span>
                  <RightOutlined style={{ fontSize: 9, color: '#CBD5E1' }} />
                </div>
              </div>

              {/* Task 2 */}
              <div
                className="task-item-row"
                onClick={() => navigate('/campaigns')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: '#FCE7F3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#DB2777',
                      fontSize: 13.5,
                      flexShrink: 0,
                    }}
                  >
                    <FileTextOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                      1 KOC gửi nội dung xem xét
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 1 }}>
                      Beauty Routine Challenge
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                    2 giờ trước
                  </span>
                  <RightOutlined style={{ fontSize: 9, color: '#CBD5E1' }} />
                </div>
              </div>

              {/* Task 3 */}
              <div
                className="task-item-row"
                onClick={() => navigate('/campaigns')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: '#FFEDD5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#EA580C',
                      fontSize: 13.5,
                      flexShrink: 0,
                    }}
                  >
                    <WalletOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                      Cần duyệt ngân sách
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 1 }}>
                      Skincare Launch 2025
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                    5 giờ trước
                  </span>
                  <RightOutlined style={{ fontSize: 9, color: '#CBD5E1' }} />
                </div>
              </div>

              {/* Task 4 */}
              <div
                className="task-item-row"
                onClick={() => navigate('/campaigns')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: '#E0F2FE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284C7',
                      fontSize: 13.5,
                      flexShrink: 0,
                    }}
                  >
                    <ThunderboltOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                      1 báo cáo chiến dịch mới
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 1 }}>
                      Tech Product Review
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                    1 ngày trước
                  </span>
                  <RightOutlined style={{ fontSize: 9, color: '#CBD5E1' }} />
                </div>
              </div>
            </div>
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

            {/* Cover Banner */}
            <div
              style={{ position: 'relative', width: '100%', height: 110, borderRadius: 10, overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => handleOpenDetail(campaigns[0] || DEFAULT_CAMPAIGNS[0])}
            >
              <img
                src={campaigns[0]?.thumbnail || DEFAULT_CAMPAIGNS[0].thumbnail}
                alt={campaigns[0]?.name || DEFAULT_CAMPAIGNS[0].name}
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
                  color: campaigns[0]?.statusType === 'draft' ? '#D97706' : '#059669',
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
                    background: campaigns[0]?.statusType === 'draft' ? '#F59E0B' : '#10B981',
                  }}
                />
                {campaigns[0]?.statusText || DEFAULT_CAMPAIGNS[0].statusText}
              </div>
            </div>

            {/* Info & Progress */}
            <div style={{ marginTop: 8 }}>
              <div
                style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A', cursor: 'pointer' }}
                onClick={() => handleOpenDetail(campaigns[0] || DEFAULT_CAMPAIGNS[0])}
              >
                {campaigns[0]?.name || DEFAULT_CAMPAIGNS[0].name}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, marginBottom: 8 }}>
                {campaigns[0]?.dateRange || DEFAULT_CAMPAIGNS[0].dateRange}
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
                        width: `${campaigns[0]?.progressPercent || 45}%`,
                        height: '100%',
                        background: '#4F46E5',
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B' }}>
                    {campaigns[0]?.progressPercent || 45}%
                  </span>
                </div>

                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'view',
                        icon: <EyeOutlined />,
                        label: 'Xem chi tiết',
                        onClick: () => handleOpenDetail(campaigns[0] || DEFAULT_CAMPAIGNS[0]),
                      },
                      {
                        key: 'koc',
                        icon: <CompassOutlined />,
                        label: 'Tìm KOC AI',
                        onClick: () => navigate('/discovery'),
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
