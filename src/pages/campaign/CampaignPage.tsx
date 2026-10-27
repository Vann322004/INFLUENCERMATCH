import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Button,
  Row,
  Col,
  Input,
  Select,
  Tag,
  Avatar,
  Dropdown,
  Pagination,
  Modal,
  InputNumber,
  message,
  Card,
  Space,
  Tooltip,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
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
  CheckCircleOutlined,
  WalletOutlined,
  ThunderboltOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { campaignService } from '../../services/api/campaignService';
import type { CampaignResponse, CampaignStatus, CampaignObjective, CampaignPlatform } from '../../types/api/campaign.types';
import './CampaignPage.css';

const { Title, Text, Paragraph } = Typography;

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

// Default 6 campaigns matching user's design mockup
const DEFAULT_CAMPAIGNS: CampaignItemUI[] = [
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

export default function CampaignPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignItemUI[]>(DEFAULT_CAMPAIGNS);
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

  // Fetch campaigns from backend API
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
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

            return {
              id: c.id,
              name: c.name || fallback.name,
              dateRange: `${startDateStr} – ${endDateStr}`,
              niches: (c.niches && c.niches.length > 0) ? c.niches : fallback.niches,
              status: c.status || 'ACTIVE',
              statusText,
              statusType,
              platforms: (c.platforms && c.platforms.length > 0) ? c.platforms : fallback.platforms,
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

          // Check if any default campaigns should also be present if user has only 1 or 2
          const existingIds = new Set(mapped.map((m) => m.id));
          const remainingDefaults = DEFAULT_CAMPAIGNS.filter((d) => !existingIds.has(d.id));
          setCampaigns([...mapped, ...remainingDefaults]);
          return;
        }
      }
      setCampaigns(DEFAULT_CAMPAIGNS);
    } catch (err) {
      console.warn('Sử dụng dữ liệu chiến dịch chuẩn thiết kế:', err);
      setCampaigns(DEFAULT_CAMPAIGNS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Filter & Search Logic
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((item) => {
      // Tab filter
      if (activeTab === 'running') {
        if (item.statusType !== 'running' && item.statusType !== 'ready') return false;
      } else if (activeTab === 'draft') {
        if (item.statusType !== 'draft') return false;
      } else if (activeTab === 'completed') {
        if (item.statusType !== 'completed') return false;
      }

      // Search query
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
      return 0; // 'latest' maintains default order
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
    navigate('/campaigns/detail', { state: { id: item.id } });
  };

  const handleOpenEdit = (item: CampaignItemUI) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      budget: item.budgetRaw,
      status: item.status,
      objective: 'AWARENESS',
      platforms: item.platforms,
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

      // Call API
      await campaignService.updateCampaign(editingItem.id, {
        name: editForm.name.trim(),
        budgetMax: editForm.budget,
        platforms: editForm.platforms,
      }).catch(() => {});

      if (editForm.status) {
        await campaignService.updateStatus(editingItem.id, editForm.status).catch(() => {});
      }

      let statusType: 'running' | 'draft' | 'ready' | 'completed' = 'running';
      let statusText = 'Đang triển khai';
      if (editForm.status === 'DRAFT') {
        statusType = 'draft';
        statusText = 'Bản nháp';
      } else if (editForm.status === 'READY_FOR_DISCOVERY') {
        statusType = 'ready';
        statusText = 'Sẵn sàng AI';
      } else if (editForm.status === 'COMPLETED') {
        statusType = 'completed';
        statusText = 'Đã hoàn thành';
      }

      setCampaigns((prev) =>
        prev.map((c) => {
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
        })
      );

      message.success({ content: 'Đã cập nhật chiến dịch thành công!', key: 'camp_save' });
      setEditModalVisible(false);
      setEditingItem(null);
    } catch {
      message.error({ content: 'Không thể cập nhật chiến dịch.', key: 'camp_save' });
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
          setCampaigns((prev) => prev.filter((c) => c.id !== item.id));
          message.success({ content: 'Đã xóa chiến dịch!', key: 'del_camp' });
        } catch {
          message.error({ content: 'Không thể xóa chiến dịch.', key: 'del_camp' });
        }
      },
    });
  };

  // Render Platform Badges
  const renderPlatformIcon = (platform: CampaignPlatform) => {
    switch (platform) {
      case 'TIKTOK':
        return (
          <Tooltip title="TikTok" key="tiktok">
            <span className="platform-mini-icon tiktok">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
              </svg>
            </span>
          </Tooltip>
        );
      case 'INSTAGRAM':
        return (
          <Tooltip title="Instagram" key="insta">
            <span className="platform-mini-icon instagram">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              <span style={{ fontWeight: 800, fontSize: 11, lineHeight: 1 }}>f</span>
            </span>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  return (
    <div className="campaign-page-wrapper">
      {/* 1. Breadcrumbs */}
      <div>
        <div className="campaign-breadcrumb">
          <span className="crumb-link" onClick={() => navigate('/dashboard')}>
            Trang chủ
          </span>
          <span>›</span>
          <span className="crumb-current">Chiến dịch</span>
        </div>

        {/* Header Title + Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 16,
            marginTop: 4,
          }}
        >
          <div>
            <Title
              level={2}
              style={{
                fontWeight: 800,
                fontSize: 28,
                color: '#0F172A',
                margin: 0,
                letterSpacing: -0.5,
              }}
            >
              Chiến dịch
            </Title>
            <Paragraph
              style={{
                color: '#64748B',
                fontSize: 13.5,
                lineHeight: 1.5,
                margin: '4px 0 0 0',
              }}
            >
              Quản lý và theo dõi các chiến dịch influencer của bạn.
            </Paragraph>
          </div>

          <Space size={12} wrap>
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={() => {
                fetchCampaigns();
                message.success('Đã làm mới danh sách chiến dịch');
              }}
              style={{
                borderRadius: 10,
                height: 40,
                fontWeight: 600,
                color: '#334155',
                borderColor: '#E2E8F0',
              }}
            >
              Làm mới dữ liệu
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/campaigns/create')}
              style={{
                background: '#4F46E5',
                borderRadius: 10,
                height: 40,
                fontWeight: 700,
                padding: '0 20px',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
              }}
            >
              Tạo chiến dịch mới
            </Button>
          </Space>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <Row gutter={[24, 24]}>
        {/* LEFT COLUMN: 3 Stat Cards + Filter Tabs & Search + Campaign Card List */}
        <Col xs={24} xl={16} xxl={17}>
          {/* 3 Metric Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            {/* Card 1: Tổng chiến dịch */}
            <Col xs={24} sm={8}>
              <div className="campaign-stat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#EEF2FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6366F1',
                      fontSize: 20,
                    }}
                  >
                    <FolderOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#64748B', marginBottom: 2 }}>
                      Tổng chiến dịch
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                      {countAll < 10 ? `0${countAll}` : countAll}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#10B981', marginTop: 4 }}>
                      ↑ 2 so với tháng trước
                    </div>
                  </div>
                </div>

                {/* Purple Sparkline SVG */}
                <div style={{ width: 75, height: 34 }}>
                  <svg width="75" height="34" viewBox="0 0 75 34" fill="none">
                    <defs>
                      <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818CF8" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#818CF8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 26 C 15 26, 25 22, 40 20 C 52 18, 62 10, 75 8"
                      fill="none"
                      stroke="#6366F1"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0 26 C 15 26, 25 22, 40 20 C 52 18, 62 10, 75 8 L 75 34 L 0 34 Z"
                      fill="url(#purpleAreaGrad)"
                    />
                  </svg>
                </div>
              </div>
            </Col>

            {/* Card 2: Đang triển khai */}
            <Col xs={24} sm={8}>
              <div className="campaign-stat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#ECFDF5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10B981',
                      fontSize: 18,
                    }}
                  >
                    <CaretRightOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#64748B', marginBottom: 2 }}>
                      Đang triển khai
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                      {countRunning < 10 ? `0${countRunning}` : countRunning}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#10B981', marginTop: 4 }}>
                      ↑ 1 so với tháng trước
                    </div>
                  </div>
                </div>

                {/* Green Sparkline SVG */}
                <div style={{ width: 75, height: 34 }}>
                  <svg width="75" height="34" viewBox="0 0 75 34" fill="none">
                    <defs>
                      <linearGradient id="greenAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34D399" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#34D399" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 28 C 18 26, 28 22, 42 16 C 56 10, 65 6, 75 4"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0 28 C 18 26, 28 22, 42 16 C 56 10, 65 6, 75 4 L 75 34 L 0 34 Z"
                      fill="url(#greenAreaGrad)"
                    />
                  </svg>
                </div>
              </div>
            </Col>

            {/* Card 3: Lời mời chờ phản hồi */}
            <Col xs={24} sm={8}>
              <div className="campaign-stat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#FFF7ED',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#F97316',
                      fontSize: 19,
                    }}
                  >
                    <TeamOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#64748B', marginBottom: 2 }}>
                      Lời mời chờ phản hồi
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                      04
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#EF4444', marginTop: 4 }}>
                      ↓ 2 so với tháng trước
                    </div>
                  </div>
                </div>

                {/* Orange/Red Sparkline SVG */}
                <div style={{ width: 75, height: 34 }}>
                  <svg width="75" height="34" viewBox="0 0 75 34" fill="none">
                    <defs>
                      <linearGradient id="orangeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FB923C" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#FB923C" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 8 C 18 12, 32 16, 46 24 C 58 30, 68 26, 75 28"
                      fill="none"
                      stroke="#F97316"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0 8 C 18 12, 32 16, 46 24 C 58 30, 68 26, 75 28 L 75 34 L 0 34 Z"
                      fill="url(#orangeAreaGrad)"
                    />
                  </svg>
                </div>
              </div>
            </Col>
          </Row>

          {/* Filter Toolbar: Tabs on Left, Search + Sort + Filter on Right */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {/* Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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

            {/* Search & Sort Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Input
                placeholder="Tìm kiếm chiến dịch..."
                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: 200,
                  height: 38,
                  borderRadius: 10,
                  borderColor: '#E2E8F0',
                  fontSize: 13,
                }}
                allowClear
              />

              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 120, height: 38 }}
                options={[
                  { value: 'latest', label: 'Mới nhất' },
                  { value: 'budget', label: 'Ngân sách cao' },
                  { value: 'creators', label: 'Nhiều KOC' },
                ]}
              />

              <Button
                icon={<FilterOutlined />}
                style={{
                  height: 38,
                  borderRadius: 10,
                  borderColor: '#E2E8F0',
                  color: '#475569',
                  fontWeight: 500,
                }}
              >
                Bộ lọc
              </Button>
            </div>
          </div>

          {/* Campaign List Cards */}
          <div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 260, flex: 2 }}>
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      style={{
                        width: 68,
                        height: 68,
                        borderRadius: 12,
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />

                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 15,
                          color: '#0F172A',
                          lineHeight: 1.3,
                          marginBottom: 3,
                        }}
                      >
                        {item.name}
                      </div>

                      <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>
                        {item.dateRange}
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {item.niches.map((niche) => (
                          <span
                            key={niche}
                            style={{
                              background: '#F8FAFC',
                              border: '1px solid #F1F5F9',
                              color: '#64748B',
                              fontSize: 11,
                              borderRadius: 6,
                              padding: '2px 8px',
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 120 }}>
                    <span className={`status-pill ${item.statusType}`}>
                      <span className="status-pill-dot" />
                      {item.statusText}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {item.platforms.map((p) => renderPlatformIcon(p))}
                      {item.extraPlatformsCount && (
                        <span className="platform-mini-icon more-pill">
                          +{item.extraPlatformsCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Influencers Avatars */}
                  <div style={{ display: 'flex', alignItems: 'center', minWidth: 80 }}>
                    <div style={{ display: 'flex', marginRight: 6 }}>
                      {item.creatorAvatars.slice(0, 3).map((av, idx) => (
                        <img
                          key={idx}
                          src={av}
                          alt="creator"
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #FFFFFF',
                            marginLeft: idx === 0 ? 0 : -8,
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                      {item.creatorsCount}
                    </span>
                  </div>

                  {/* Column 4: Budget & Progress */}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 140, flex: 1.2 }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>
                      Ngân sách dự kiến
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                      {item.budgetFormatted}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 5,
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
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>
                        {item.progressPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Column 5: Last Updated */}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 110 }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>
                      Cập nhật
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                      {item.updatedTime}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>
                      {item.updatedBy}
                    </div>
                  </div>

                  {/* Column 6: Actions */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
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
                        icon={<RightOutlined style={{ fontSize: 13, color: '#94A3B8' }} />}
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
              paddingTop: 16,
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 13, color: '#64748B' }}>
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
        </Col>

        {/* RIGHT COLUMN: Việc cần xử lý (4) + Chiến dịch gần đây (Spotlight) */}
        <Col xs={24} xl={8} xxl={7}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Card 1: Việc cần xử lý */}
            <Card
              bordered
              style={{
                borderRadius: 16,
                borderColor: '#EEF0F6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
              bodyStyle={{ padding: '20px' }}
            >
              {/* Card Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                  Việc cần xử lý
                </span>
                <span
                  style={{
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  4
                </span>
              </div>

              {/* Tasks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Task 1 */}
                <div
                  className="task-item-row"
                  onClick={() => navigate('/campaigns')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: '#F3E8FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9333EA',
                        fontSize: 16,
                      }}
                    >
                      <SendOutlined />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
                        2 lời mời chờ phản hồi
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                        Summer Glow 2026
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      10 phút trước
                    </span>
                    <RightOutlined style={{ fontSize: 11, color: '#CBD5E1' }} />
                  </div>
                </div>

                {/* Task 2 */}
                <div
                  className="task-item-row"
                  onClick={() => navigate('/campaigns')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: '#FCE7F3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#DB2777',
                        fontSize: 16,
                      }}
                    >
                      <FileTextOutlined />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
                        1 KOC gửi nội dung xem xét
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                        Beauty Routine Challenge
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      2 giờ trước
                    </span>
                    <RightOutlined style={{ fontSize: 11, color: '#CBD5E1' }} />
                  </div>
                </div>

                {/* Task 3 */}
                <div
                  className="task-item-row"
                  onClick={() => navigate('/campaigns')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: '#FFEDD5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#EA580C',
                        fontSize: 16,
                      }}
                    >
                      <WalletOutlined />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
                        Cần duyệt ngân sách
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                        Skincare Launch 2025
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      5 giờ trước
                    </span>
                    <RightOutlined style={{ fontSize: 11, color: '#CBD5E1' }} />
                  </div>
                </div>

                {/* Task 4 */}
                <div
                  className="task-item-row"
                  onClick={() => navigate('/campaigns')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: '#E0F2FE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0284C7',
                        fontSize: 16,
                      }}
                    >
                      <ThunderboltOutlined />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
                        1 báo cáo chiến dịch mới
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                        Tech Product Review
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      1 ngày trước
                    </span>
                    <RightOutlined style={{ fontSize: 11, color: '#CBD5E1' }} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 2: Chiến dịch gần đây */}
            <Card
              bordered
              style={{
                borderRadius: 16,
                borderColor: '#EEF0F6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                  Chiến dịch gần đây
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
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
              <div style={{ position: 'relative', width: '100%', height: 140, borderRadius: 12, overflow: 'hidden' }}>
                <img
                  src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80"
                  alt="Summer Glow 2026"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Overlaid Status Pill */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 10,
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(4px)',
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#10B981',
                    }}
                  />
                  Đang triển khai
                </div>
              </div>

              {/* Info & Progress */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>
                  Summer Glow 2026
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, marginBottom: 12 }}>
                  15 Jun 2026 – 31 Aug 2026
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <div
                      style={{
                        flex: 1,
                        height: 5,
                        background: '#E2E8F0',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: '45%',
                          height: '100%',
                          background: '#4F46E5',
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>
                      45%
                    </span>
                  </div>

                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'view',
                          icon: <EyeOutlined />,
                          label: 'Xem chi tiết',
                          onClick: () => navigate('/campaigns/detail', { state: { id: 'camp-summer-glow-2026' } }),
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
                      icon={<EllipsisOutlined style={{ fontSize: 16, color: '#94A3B8' }} />}
                    />
                  </Dropdown>
                </div>
              </div>
            </Card>
          </div>
        </Col>
      </Row>

      {/* 3. Edit Campaign Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700 }}>
            <EditOutlined style={{ color: '#4F46E5' }} />
            <span>Chỉnh sửa thông tin chiến dịch</span>
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
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 12 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#334155' }}>
              Tên chiến dịch <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <Input
              size="large"
              placeholder="Nhập tên chiến dịch..."
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              style={{ borderRadius: 8 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                  { value: 'ACTIVE', label: '🟢 Đang triển khai' },
                  { value: 'READY_FOR_DISCOVERY', label: '⚡ Sẵn sàng AI' },
                  { value: 'DRAFT', label: '📝 Bản nháp' },
                  { value: 'COMPLETED', label: '🏁 Đã hoàn thành' },
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
                  { value: 'AWARENESS', label: '📢 Tăng nhận diện' },
                  { value: 'CONVERSION', label: '🛒 Thúc đẩy doanh số' },
                  { value: 'ENGAGEMENT', label: '💬 Tương tác cộng đồng' },
                  { value: 'TRAFFIC', label: '🚀 Kéo Traffic website' },
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
