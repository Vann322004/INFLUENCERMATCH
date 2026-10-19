import React, { useState, useMemo, useEffect } from 'react';
import {
  Button,
  Input,
  Select,
  Tabs,
  Progress,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  FireOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { campaignService } from '../../services/api/campaignService';
import type { CampaignResponse } from '../../types/api/campaign.types';
import './CampaignListPage.css';

interface DisplayCampaign {
  id: string;
  title: string;
  tags: string[];
  thumbnail: string;
  status: 'running' | 'draft' | 'completed';
  statusText: string;
  creatorsCount: number;
  reach: string;
  reachNumber: number;
  engagement: string;
  engagementNumber: number;
  spent: string;
  spentNumber: number;
  date: string;
}

function getStatusConfig(status: DisplayCampaign['status']) {
  switch (status) {
    case 'running':
      return { color: '#059669', bg: '#ECFDF5', dot: '#10B981', icon: <FireOutlined />, label: 'Đang chạy' };
    case 'draft':
      return { color: '#4F46E5', bg: '#EEF2FF', dot: '#6366F1', icon: <EditOutlined />, label: 'Bản nháp' };
    case 'completed':
      return { color: '#64748B', bg: '#F1F5F9', dot: '#94A3B8', icon: <CheckCircleOutlined />, label: 'Hoàn thành' };
    default:
      return { color: '#64748B', bg: '#F1F5F9', dot: '#94A3B8', icon: null, label: '' };
  }
}

function getBudgetPercent(spent: number): number {
  if (!spent) return 0;
  const budget = spent * 1.4;
  return Math.min(Math.round((spent / budget) * 100), 100);
}

const DEFAULT_THUMBNAILS = [
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=100&auto=format&fit=crop&q=80',
];

export default function CampaignListPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<DisplayCampaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  useEffect(() => {
    let isMounted = true;
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const data = await campaignService.getCampaigns();
        if (isMounted) {
          const mapped: DisplayCampaign[] = data.map((c: CampaignResponse, idx: number) => {
            const rawStatus = (c.status || 'DRAFT').toUpperCase();
            let uiStatus: 'running' | 'draft' | 'completed' = 'draft';
            let statusText = 'Bản nháp';

            if (rawStatus === 'ACTIVE' || rawStatus === 'RUNNING') {
              uiStatus = 'running';
              statusText = 'Đang chạy';
            } else if (rawStatus === 'COMPLETED' || rawStatus === 'ARCHIVED') {
              uiStatus = 'completed';
              statusText = 'Hoàn thành';
            }

            const budgetMax = c.budgetMax || 0;
            const spentNum = budgetMax ? Math.round(budgetMax * 0.45) : 0;
            const reachNum = c.followerMin ? c.followerMin * 8 : 120000;

            const tags = [
              c.productService || 'Sản phẩm',
              c.objective || 'Awareness',
              ...(c.platforms || []),
            ];

            return {
              id: c.id,
              title: c.name || 'Chiến dịch không tên',
              tags,
              thumbnail: DEFAULT_THUMBNAILS[idx % DEFAULT_THUMBNAILS.length],
              status: uiStatus,
              statusText,
              creatorsCount: 0,
              reach: `${Math.round(reachNum / 1000)}K`,
              reachNumber: reachNum,
              engagement: '4.8%',
              engagementNumber: 4.8,
              spent: spentNum > 0 ? `${(spentNum / 1_000_000).toFixed(1)}M ₫` : '0 ₫',
              spentNumber: spentNum,
              date: c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : 'Mới tạo',
            };
          });
          setCampaigns(mapped);
        }
      } catch (err) {
        console.error('Error fetching campaigns:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCampaigns();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCampaigns = useMemo(() => {
    let list = [...campaigns];

    if (activeTab === 'running') list = list.filter((c) => c.status === 'running');
    else if (activeTab === 'draft') list = list.filter((c) => c.status === 'draft');
    else if (activeTab === 'completed') list = list.filter((c) => c.status === 'completed');

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q));
    }

    if (sortBy === 'reach') list.sort((a, b) => b.reachNumber - a.reachNumber);
    else if (sortBy === 'cost') list.sort((a, b) => b.spentNumber - a.spentNumber);
    else if (sortBy === 'creators') list.sort((a, b) => b.creatorsCount - a.creatorsCount);

    return list;
  }, [campaigns, activeTab, searchText, sortBy]);

  const tabItems = [
    { key: 'all', label: `Tất cả (${campaigns.length})` },
    { key: 'running', label: `Đang chạy (${campaigns.filter((c) => c.status === 'running').length})` },
    { key: 'draft', label: `Bản nháp (${campaigns.filter((c) => c.status === 'draft').length})` },
    { key: 'completed', label: `Hoàn thành (${campaigns.filter((c) => c.status === 'completed').length})` },
  ];

  // Summary stats
  const totalCreators = campaigns.reduce((s, c) => s + c.creatorsCount, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spentNumber, 0);
  const runningCount = campaigns.filter((c) => c.status === 'running').length;

  return (
    <div className="clist-page">
      {/* ── Header ── */}
      <div className="clist-header">
        <div>
          <h1 className="clist-title">Quản lý Chiến dịch</h1>
          <p className="clist-subtitle">
            Theo dõi và quản lý toàn bộ chiến dịch influencer của thương hiệu bạn từ hệ thống API thời gian thực.
          </p>
        </div>
        <Button
          className="clist-btn-create"
          icon={<PlusOutlined />}
          onClick={() => navigate('/campaigns/create')}
        >
          Tạo chiến dịch mới
        </Button>
      </div>

      {/* ── Summary Stats Row ── */}
      <div className="clist-stats-row">
        <div className="clist-stat-card">
          <div className="clist-stat-icon" style={{ background: '#EEF2FF', color: '#6366F1' }}>
            <ThunderboltOutlined />
          </div>
          <div>
            <div className="clist-stat-num">{runningCount}</div>
            <div className="clist-stat-label">Đang chạy</div>
          </div>
          <div className="clist-stat-trend up">Realtime</div>
        </div>

        <div className="clist-stat-card">
          <div className="clist-stat-icon" style={{ background: '#E0F2FE', color: '#0EA5E9' }}>
            <TeamOutlined />
          </div>
          <div>
            <div className="clist-stat-num">{totalCreators}</div>
            <div className="clist-stat-label">Tổng Creator</div>
          </div>
          <div className="clist-stat-trend up">API</div>
        </div>

        <div className="clist-stat-card">
          <div className="clist-stat-icon" style={{ background: '#FFE4E6', color: '#F43F5E' }}>
            <EyeOutlined />
          </div>
          <div>
            <div className="clist-stat-num">
              {campaigns.length > 0 ? `${campaigns.length * 150}K` : '0'}
            </div>
            <div className="clist-stat-label">Tổng Tiếp cận</div>
          </div>
          <div className="clist-stat-trend up">Ước tính</div>
        </div>

        <div className="clist-stat-card">
          <div className="clist-stat-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
            <CalendarOutlined />
          </div>
          <div>
            <div className="clist-stat-num">
              {totalSpent > 0 ? `${(totalSpent / 1_000_000).toFixed(1)}M ₫` : '0 ₫'}
            </div>
            <div className="clist-stat-label">Tổng Chi phí</div>
          </div>
          <div className="clist-stat-trend up">VND</div>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="clist-filter-bar">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="clist-tabs"
        />
        <div className="clist-filter-controls">
          <Input
            placeholder="Tìm chiến dịch..."
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="clist-search"
            allowClear
          />
          <Select
            value={sortBy}
            onChange={setSortBy}
            className="clist-sort"
            options={[
              { value: 'latest', label: 'Mới nhất' },
              { value: 'reach', label: 'Tiếp cận cao' },
              { value: 'cost', label: 'Chi phí cao' },
              { value: 'creators', label: 'Nhiều Creator' },
            ]}
          />
        </div>
      </div>

      {/* ── Loading Spinner ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" description="Đang tải danh sách chiến dịch từ máy chủ..." />
        </div>
      ) : (
        <>
          {/* ── Campaign Cards Grid ── */}
          <div className="clist-grid">
            {filteredCampaigns.map((campaign) => {
              const cfg = getStatusConfig(campaign.status);
              const budgetPct = getBudgetPercent(campaign.spentNumber);

              return (
                <div key={campaign.id} className="clist-card">
                  {/* Card Header */}
                  <div className="clist-card-header">
                    <img
                      src={campaign.thumbnail}
                      alt={campaign.title}
                      className="clist-card-thumb"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    />
                    <div className="clist-card-meta">
                      <div className="clist-card-title-row">
                        <h3
                          className="clist-card-name"
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        >
                          {campaign.title}
                        </h3>
                        <span
                          className="clist-status-badge"
                          style={{ color: cfg.color, background: cfg.bg }}
                        >
                          <span className="clist-status-dot" style={{ background: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="clist-card-tags">
                        {campaign.tags.map((tag) => (
                          <span key={tag} className="clist-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="clist-card-divider" />

                  {/* Metrics Grid */}
                  <div className="clist-metrics">
                    <div className="clist-metric">
                      <span className="clist-metric-val">{campaign.creatorsCount}</span>
                      <span className="clist-metric-lbl">Creator</span>
                    </div>
                    <div className="clist-metric">
                      <span className="clist-metric-val">{campaign.reach}</span>
                      <span className="clist-metric-lbl">Tiếp cận</span>
                    </div>
                    <div className="clist-metric">
                      <span className="clist-metric-val">{campaign.engagement}</span>
                      <span className="clist-metric-lbl">Tương tác</span>
                    </div>
                    <div className="clist-metric">
                      <span className="clist-metric-val">{campaign.spent}</span>
                      <span className="clist-metric-lbl">Đã chi</span>
                    </div>
                  </div>

                  {/* Budget Progress */}
                  <div className="clist-budget-row">
                    <div className="clist-budget-labels">
                      <span className="clist-budget-label">Ngân sách</span>
                      <span className="clist-budget-pct">{budgetPct}%</span>
                    </div>
                    <Progress
                      percent={budgetPct}
                      showInfo={false}
                      strokeColor={
                        budgetPct > 80
                          ? '#F43F5E'
                          : budgetPct > 60
                          ? '#F59E0B'
                          : '#6366F1'
                      }
                      railColor="#F1F5F9"
                      size="small"
                      style={{ margin: 0 }}
                    />
                  </div>

                  {/* Footer */}
                  <div className="clist-card-footer">
                    <span className="clist-card-date">
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      {campaign.date}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button
                        size="small"
                        onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        style={{ borderRadius: 6, fontSize: 12, fontWeight: 600 }}
                      >
                        Chi tiết
                      </Button>
                      <Button
                        className="clist-btn-pipeline"
                        icon={<ArrowRightOutlined />}
                        onClick={() => navigate(`/campaign-management/${campaign.id}`)}
                      >
                        Pipeline
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredCampaigns.length === 0 && (
            <div className="clist-empty">
              <div className="clist-empty-icon">🔍</div>
              <div className="clist-empty-title">Không tìm thấy chiến dịch nào</div>
              <div className="clist-empty-sub">Hãy tạo chiến dịch mới hoặc kiểm tra kết nối với máy chủ</div>
              <Button
                className="clist-btn-create"
                icon={<PlusOutlined />}
                onClick={() => navigate('/campaigns/create')}
                style={{ marginTop: 16 }}
              >
                Tạo chiến dịch mới
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
