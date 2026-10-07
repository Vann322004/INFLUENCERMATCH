import React, { useState, useMemo } from 'react';
import {
  Button,
  Input,
  Select,
  Tag,
  Tabs,
  Progress,
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
import { CAMPAIGNS_DATA, STAT_CARDS_DATA } from '../../data/mockData';
import type { Campaign } from '../../data/mockData';
import './CampaignListPage.css';

// Extended mock data for 8 campaigns (add 2 more to CAMPAIGNS_DATA)
const ALL_CAMPAIGNS: Campaign[] = [
  ...CAMPAIGNS_DATA,
  {
    id: 'c-7',
    title: 'Chiến Dịch Nước Hoa Cao Cấp Luxury',
    tags: ['Lifestyle', 'Instagram + YouTube'],
    thumbnail: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=100&auto=format&fit=crop&q=80',
    status: 'draft',
    statusText: 'Bản nháp',
    creatorsCount: 8,
    reach: '320K',
    reachNumber: 320000,
    engagement: '4.2%',
    engagementNumber: 4.2,
    spent: '$3.8K',
    spentNumber: 3800,
    date: '05 thg 5, 2025',
  },
  {
    id: 'c-8',
    title: 'Thực Phẩm Chức Năng Wellness 2025',
    tags: ['Sức khỏe & Sắc đẹp', 'TikTok'],
    thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=100&auto=format&fit=crop&q=80',
    status: 'running',
    statusText: 'Đang chạy',
    creatorsCount: 14,
    reach: '630K',
    reachNumber: 630000,
    engagement: '5.9%',
    engagementNumber: 5.9,
    spent: '$6.4K',
    spentNumber: 6400,
    date: '12 thg 5, 2025',
  },
];

function getStatusConfig(status: Campaign['status']) {
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
  // Mock: budget = spent * ~1.4
  const budget = spent * 1.4;
  return Math.min(Math.round((spent / budget) * 100), 100);
}

export default function CampaignListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  const filteredCampaigns = useMemo(() => {
    let list = [...ALL_CAMPAIGNS];

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
  }, [activeTab, searchText, sortBy]);

  const tabItems = [
    { key: 'all', label: `Tất cả (${ALL_CAMPAIGNS.length})` },
    { key: 'running', label: `Đang chạy (${ALL_CAMPAIGNS.filter(c => c.status === 'running').length})` },
    { key: 'draft', label: `Bản nháp (${ALL_CAMPAIGNS.filter(c => c.status === 'draft').length})` },
    { key: 'completed', label: `Hoàn thành (${ALL_CAMPAIGNS.filter(c => c.status === 'completed').length})` },
  ];

  // Summary stats
  const totalCreators = ALL_CAMPAIGNS.reduce((s, c) => s + c.creatorsCount, 0);
  const totalSpent = ALL_CAMPAIGNS.reduce((s, c) => s + c.spentNumber, 0);
  const runningCount = ALL_CAMPAIGNS.filter(c => c.status === 'running').length;

  return (
    <div className="clist-page">
      {/* ── Header ── */}
      <div className="clist-header">
        <div>
          <h1 className="clist-title">Quản lý Chiến dịch</h1>
          <p className="clist-subtitle">
            Theo dõi và quản lý toàn bộ chiến dịch influencer của thương hiệu bạn.
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
          <div className="clist-stat-trend up">+14%</div>
        </div>

        <div className="clist-stat-card">
          <div className="clist-stat-icon" style={{ background: '#E0F2FE', color: '#0EA5E9' }}>
            <TeamOutlined />
          </div>
          <div>
            <div className="clist-stat-num">{totalCreators}</div>
            <div className="clist-stat-label">Tổng Creator</div>
          </div>
          <div className="clist-stat-trend up">+32%</div>
        </div>

        <div className="clist-stat-card">
          <div className="clist-stat-icon" style={{ background: '#FFE4E6', color: '#F43F5E' }}>
            <EyeOutlined />
          </div>
          <div>
            <div className="clist-stat-num">5.7M</div>
            <div className="clist-stat-label">Tổng Tiếp cận</div>
          </div>
          <div className="clist-stat-trend up">+21%</div>
        </div>

        <div className="clist-stat-card">
          <div className="clist-stat-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
            <CalendarOutlined />
          </div>
          <div>
            <div className="clist-stat-num">${(totalSpent / 1000).toFixed(1)}K</div>
            <div className="clist-stat-label">Tổng Chi phí</div>
          </div>
          <div className="clist-stat-trend up">+18%</div>
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
                  trailColor="#F1F5F9"
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
          <div className="clist-empty-title">Không tìm thấy chiến dịch</div>
          <div className="clist-empty-sub">Thử thay đổi bộ lọc hoặc tạo chiến dịch mới</div>
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
    </div>
  );
}
