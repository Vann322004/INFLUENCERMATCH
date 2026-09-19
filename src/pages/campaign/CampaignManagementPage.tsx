import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Dropdown,
  message,
  Modal,
  Form,
  Tag,
  Tooltip,
} from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  ExportOutlined,
  CheckCircleFilled,
  RightOutlined,
  ThunderboltOutlined,
  MailOutlined,
  DownOutlined,
  ArrowRightOutlined,
  SendOutlined,
  MoreOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import './CampaignManagementPage.css';

export interface PipelineCreator {
  id: string;
  name: string;
  username: string;
  avatar: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  followers: string;
  engagement: string;
  fee: string;
  matchScore: number;
  tags?: string;
  stage: 'found' | 'review' | 'contacted' | 'negotiating' | 'confirmed';
  note?: string;
}

const INITIAL_PIPELINE_CREATORS: PipelineCreator[] = [
  // 1. Mới tìm thấy (stage: found)
  {
    id: 'p1',
    name: 'Mai Trần',
    username: 'maitran.glow',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    platform: 'instagram',
    followers: '650K',
    engagement: '1.8%',
    fee: '$5.3M',
    matchScore: 92,
    tags: 'Skincare, Beauty',
    stage: 'found',
  },
  {
    id: 'p2',
    name: 'Thảo Lê Skincare',
    username: 'thaole_derma',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    platform: 'tiktok',
    followers: '415K',
    engagement: '3.2%',
    fee: '$4.5M',
    matchScore: 88,
    tags: 'Skincare, Review',
    stage: 'found',
  },
  {
    id: 'p3',
    name: 'Huyền Phạm',
    username: 'huyen.beauty',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80',
    platform: 'tiktok',
    followers: '320K',
    engagement: '2.7%',
    fee: '$3.8M',
    matchScore: 85,
    tags: 'Beauty, Lifestyle',
    stage: 'found',
  },

  // 2. Đang xem xét (stage: review)
  {
    id: 'p4',
    name: 'Ngọc Anh Beauty',
    username: 'ngocanh.beauty',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    platform: 'instagram',
    followers: '720K',
    engagement: '2.9%',
    fee: '$6.5M',
    matchScore: 90,
    tags: 'Skincare, Makeup',
    stage: 'review',
  },
  {
    id: 'p5',
    name: 'Minh Tâm',
    username: 'minhtam.official',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    platform: 'youtube',
    followers: '1.2M',
    engagement: '1.5%',
    fee: '$7.2M',
    matchScore: 87,
    tags: 'Lifestyle, Review',
    stage: 'review',
  },
  {
    id: 'p6',
    name: 'Lan Anh',
    username: 'lananhdaily',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    platform: 'tiktok',
    followers: '540K',
    engagement: '3.0%',
    fee: '$5.1M',
    matchScore: 84,
    tags: 'Vlog, Daily',
    stage: 'review',
  },

  // 3. Đã liên hệ (stage: contacted)
  {
    id: 'p7',
    name: 'Bảo Ngọc',
    username: 'baongoc.official',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&auto=format&fit=crop&q=80',
    platform: 'instagram',
    followers: '2.3M',
    engagement: '1.7%',
    fee: '$10.2M',
    matchScore: 86,
    note: '* Đã gửi email 2 ngày trước',
    stage: 'contacted',
  },
  {
    id: 'p8',
    name: 'Hoàng Nam',
    username: 'hoangnam_vlog',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    platform: 'youtube',
    followers: '1.8M',
    engagement: '2.1%',
    fee: '$8.6M',
    matchScore: 82,
    note: '* Đã gửi email 1 ngày trước',
    stage: 'contacted',
  },
  {
    id: 'p9',
    name: 'Lan Nhi',
    username: 'lannhi.official',
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&auto=format&fit=crop&q=80',
    platform: 'instagram',
    followers: '950K',
    engagement: '2.4%',
    fee: '$5.8M',
    matchScore: 83,
    note: '* Đã gửi tin nhắn IG',
    stage: 'contacted',
  },

  // 4. Đang đàm phán (stage: negotiating)
  {
    id: 'p10',
    name: 'Gia Hân',
    username: 'giahan.beauty',
    avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&auto=format&fit=crop&q=80',
    platform: 'instagram',
    followers: '2.1M',
    engagement: '2.3%',
    fee: '$7.1M',
    matchScore: 81,
    note: '* Đang thương lượng giá',
    stage: 'negotiating',
  },
  {
    id: 'p11',
    name: 'Đức Mạnh',
    username: 'ducmanh.food',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80',
    platform: 'tiktok',
    followers: '980K',
    engagement: '2.8%',
    fee: '$4.9M',
    matchScore: 76,
    note: '* Đang trao đổi nội dung',
    stage: 'negotiating',
  },
  {
    id: 'p12',
    name: 'Thảo Nguyên',
    username: 'thaonguyen.official',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    platform: 'instagram',
    followers: '1.4M',
    engagement: '2.5%',
    fee: '$6.2M',
    matchScore: 79,
    note: '* Đợi duyệt bản brief',
    stage: 'negotiating',
  },

  // 5. Đã xác nhận (stage: confirmed)
  {
    id: 'p13',
    name: 'Hoài An',
    username: 'hoaian.official',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    platform: 'instagram',
    followers: '2.8M',
    engagement: '3.1%',
    fee: '$12.5M',
    matchScore: 95,
    note: 'Đã ký hợp đồng ✓',
    stage: 'confirmed',
  },
  {
    id: 'p14',
    name: 'Thu Trang',
    username: 'thutrang_beauty',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    platform: 'youtube',
    followers: '1.5M',
    engagement: '2.7%',
    fee: '$8.4M',
    matchScore: 91,
    note: 'Đã ký hợp đồng ✓',
    stage: 'confirmed',
  },
  {
    id: 'p15',
    name: 'Kim Chi',
    username: 'kimchi.makeup',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80',
    platform: 'youtube',
    followers: '1.1M',
    engagement: '2.4%',
    fee: '$6.7M',
    matchScore: 89,
    note: 'Đã ký hợp đồng ✓',
    stage: 'confirmed',
  },
];

export default function CampaignManagementPage() {
  const navigate = useNavigate();
  const [pipelineCreators, setPipelineCreators] = useState<PipelineCreator[]>(INITIAL_PIPELINE_CREATORS);
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'instagram' | 'youtube' | 'tiktok'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedCreatorForMove, setSelectedCreatorForMove] = useState<PipelineCreator | null>(null);

  // Filter creators based on platform & search
  const filteredCreators = pipelineCreators.filter((item) => {
    if (selectedChannel !== 'all' && item.platform !== selectedChannel) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q) ||
        (item.tags && item.tags.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Stages configuration
  const stages = [
    {
      key: 'found',
      title: 'Mới tìm thấy',
      icon: '✦',
      headerClass: 'stage-found',
      count: 14,
      budget: '$18.2M',
      nextStage: 'review',
      actionText: '+ Thêm vào danh sách',
      actionClass: 'btn-action-add',
    },
    {
      key: 'review',
      title: 'Đang xem xét',
      icon: '👁',
      headerClass: 'stage-review',
      count: 11,
      budget: '$16.7M',
      nextStage: 'contacted',
      actionText: '+ Thêm vào danh sách',
      actionClass: 'btn-action-add',
    },
    {
      key: 'contacted',
      title: 'Đã liên hệ',
      icon: '✉',
      headerClass: 'stage-contacted',
      count: 7,
      budget: '$9.4M',
      nextStage: 'negotiating',
      actionText: '✉ Đã liên hệ',
      actionClass: 'btn-action-contacted',
    },
    {
      key: 'negotiating',
      title: 'Đang đàm phán',
      icon: '🤝',
      headerClass: 'stage-negotiating',
      count: 5,
      budget: '$7.8M',
      nextStage: 'confirmed',
      actionText: '🤝 Đang đàm phán',
      actionClass: 'btn-action-negotiating',
    },
    {
      key: 'confirmed',
      title: 'Đã xác nhận',
      icon: '✓',
      headerClass: 'stage-confirmed',
      count: 3,
      budget: '$4.6M',
      nextStage: null,
      actionText: '✓ Đã xác nhận',
      actionClass: 'btn-action-confirmed',
    },
  ];

  // Move creator to next stage
  const handleAdvanceStage = (creatorId: string, currentStage: string) => {
    const stageFlow: Record<string, PipelineCreator['stage']> = {
      found: 'review',
      review: 'contacted',
      contacted: 'negotiating',
      negotiating: 'confirmed',
    };

    const next = stageFlow[currentStage];
    if (next) {
      setPipelineCreators((prev) =>
        prev.map((c) => (c.id === creatorId ? { ...c, stage: next } : c))
      );
      message.success('Đã chuyển trạng thái creator thành công!');
    }
  };

  const renderPlatformBadge = (platform: PipelineCreator['platform']) => {
    switch (platform) {
      case 'instagram':
        return <span className="kcard-platform-pill kcard-platform-instagram">Instagram</span>;
      case 'tiktok':
        return <span className="kcard-platform-pill kcard-platform-tiktok">TikTok</span>;
      case 'youtube':
        return <span className="kcard-platform-pill kcard-platform-youtube">YouTube</span>;
      default:
        return null;
    }
  };

  // Add new creator submit
  const handleAddNewCreator = (values: any) => {
    const newCreator: PipelineCreator = {
      id: 'p_' + Date.now(),
      name: values.name,
      username: values.username || 'creator_' + Date.now().toString().slice(-4),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      platform: values.platform || 'instagram',
      followers: values.followers || '500K',
      engagement: values.engagement || '2.5%',
      fee: values.fee || '$5.0M',
      matchScore: 88,
      tags: values.tags || 'Beauty, Skincare',
      stage: values.stage || 'found',
    };

    setPipelineCreators([newCreator, ...pipelineCreators]);
    message.success(`Đã thêm ${newCreator.name} vào Creator Pipeline!`);
    setAddModalOpen(false);
  };

  return (
    <div className="pipeline-page-container">
      {/* 1. Breadcrumb */}
      <div className="pipeline-breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/campaigns')}>
          Chiến dịch
        </span>
        <span>›</span>
        <span className="breadcrumb-current">Chiến dịch Summer Glow 2025</span>
      </div>

      {/* 2. Header Title Row */}
      <div className="pipeline-header-row">
        <div>
          <h1 className="pipeline-main-title">Creator Pipeline</h1>
          <div className="pipeline-description">
            Quản lý và theo dõi toàn bộ quá trình làm việc với các influencer cho chiến dịch của bạn.
          </div>
        </div>

        <Button
          className="btn-add-creator-gradient"
          icon={<PlusOutlined />}
          onClick={() => setAddModalOpen(true)}
        >
          Thêm Creator
        </Button>
      </div>

      {/* 3. Campaign Summary Card */}
      <div className="campaign-summary-card">
        <div className="campaign-summary-left">
          <img
            src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=120&auto=format&fit=crop&q=80"
            alt="Summer Glow Clean Serum"
            className="campaign-thumb-img"
          />

          <div className="campaign-meta-content">
            <div className="campaign-title-row">
              <span className="campaign-name-title">Summer Glow Clean Serum</span>
              <span className="campaign-status-tag">🟢 Đang diễn ra</span>
            </div>

            <div className="campaign-subtitle-text">
              Chiến dịch quảng bá sản phẩm chăm sóc da
            </div>

            <div className="campaign-date-text">
              <CalendarOutlined />
              <span>01/05/2025 – 30/06/2025</span>
            </div>
          </div>
        </div>

        <div className="campaign-summary-stats">
          <div className="campaign-stat-item">
            <span className="campaign-stat-label">Tổng creator</span>
            <div className="campaign-stat-value-row">
              <span className="campaign-stat-number">28</span>
              <span className="campaign-stat-badge-green">↑ 4 tuần trước</span>
            </div>
          </div>

          <div className="campaign-stat-item">
            <span className="campaign-stat-label">Tổng reach dự kiến</span>
            <div className="campaign-stat-value-row">
              <span className="campaign-stat-number">1.2 M</span>
              <span className="campaign-stat-badge-green">+18%</span>
            </div>
          </div>

          <div className="campaign-stat-item">
            <span className="campaign-stat-label">Ngân sách chiến dịch</span>
            <div className="campaign-stat-value-row">
              <span className="campaign-stat-number">$ 55.0M</span>
              <span className="campaign-stat-badge-green">+12%</span>
            </div>
          </div>

          <Button
            className="btn-export-report"
            icon={<ExportOutlined />}
            onClick={() => {
              message.loading('Đang chuẩn bị file xuất báo cáo pipeline...');
              setTimeout(() => {
                message.success('Đã xuất báo cáo chiến dịch thành công (PDF/Excel)!');
              }, 800);
            }}
          >
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* 4. Filter & Channel Tabs Bar */}
      <div className="pipeline-filters-bar">
        <div className="pipeline-channels-group">
          {/* Campaign dropdown */}
          <div className="campaign-select-pill">
            <span>👜 Summer Glow Clean Serum</span>
            <DownOutlined style={{ fontSize: 10 }} />
          </div>

          {/* Channels Pills */}
          <div
            className={`channel-pill-item ${selectedChannel === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedChannel('all')}
          >
            <span>Tất cả (14)</span>
          </div>

          <div
            className={`channel-pill-item ${selectedChannel === 'instagram' ? 'active' : ''}`}
            onClick={() => setSelectedChannel('instagram')}
          >
            <span className="channel-dot" style={{ background: '#DD2A7B' }} />
            <span>Instagram (11)</span>
          </div>

          <div
            className={`channel-pill-item ${selectedChannel === 'youtube' ? 'active' : ''}`}
            onClick={() => setSelectedChannel('youtube')}
          >
            <span className="channel-dot" style={{ background: '#EF4444' }} />
            <span>YouTube (3)</span>
          </div>

          <div
            className={`channel-pill-item ${selectedChannel === 'tiktok' ? 'active' : ''}`}
            onClick={() => setSelectedChannel('tiktok')}
          >
            <span className="channel-dot" style={{ background: '#0F172A' }} />
            <span>TikTok (0)</span>
          </div>
        </div>

        <div className="pipeline-search-controls">
          <Input
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            placeholder="Tìm creator hoặc tên kênh..."
            className="pipeline-search-input"
            allowClear
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Button className="btn-pipeline-filter" icon={<FilterOutlined />}>
            Bộ lọc & sắp xếp <DownOutlined style={{ fontSize: 10 }} />
          </Button>
        </div>
      </div>

      {/* 5. Main Layout: 5 Kanban Columns + Right Sidebar Panel */}
      <div className="pipeline-layout-grid">
        {/* Kanban 5 Columns */}
        <div className="kanban-board-container">
          {stages.map((stg) => {
            const colItems = filteredCreators.filter((c) => c.stage === stg.key);
            return (
              <div key={stg.key} className="kanban-col">
                {/* Column Header */}
                <div className={`kanban-col-header ${stg.headerClass}`}>
                  <div className="col-header-title">
                    <span>{stg.icon}</span>
                    <span>{stg.title}</span>
                    <span className="col-header-count">{stg.count}</span>
                  </div>
                  <span className="col-header-budget">{stg.budget}</span>
                </div>

                {/* Cards List in this Column */}
                <div className="kanban-cards-stack">
                  {colItems.map((c) => (
                    <div
                      key={c.id}
                      className="kanban-creator-card"
                      onClick={() => navigate('/creators/c1')}
                    >
                      {/* Top Creator row */}
                      <div className="kcard-top-row">
                        <img src={c.avatar} alt={c.name} className="kcard-avatar" />
                        <div className="kcard-identity">
                          <span className="kcard-name">{c.name}</span>
                          <span className="kcard-username">@{c.username}</span>
                          {renderPlatformBadge(c.platform)}
                        </div>
                      </div>

                      {/* 3 Metrics Mini Grid */}
                      <div className="kcard-metrics-grid">
                        <div className="kcard-metric-col">
                          <span className="kcard-metric-num">{c.followers}</span>
                          <span className="kcard-metric-label">Followers</span>
                        </div>
                        <div className="kcard-metric-col">
                          <span className="kcard-metric-num">{c.engagement}</span>
                          <span className="kcard-metric-label">Engagement</span>
                        </div>
                        <div className="kcard-metric-col">
                          <span className="kcard-metric-num">{c.fee}</span>
                          <span className="kcard-metric-label">Est. Fee</span>
                        </div>
                      </div>

                      {/* Match rate */}
                      <div className="kcard-match-row">
                        <span className="kcard-match-label">Độ phù hợp:</span>
                        <span className="kcard-match-score">{c.matchScore}%</span>
                      </div>

                      {/* Suitable tags or Note */}
                      {c.tags && (
                        <div className="kcard-suitable-row">
                          <span>Thích hợp cho: </span>
                          <strong>{c.tags}</strong>
                        </div>
                      )}

                      {c.note && (
                        <div className={`kcard-action-note ${c.stage}`}>
                          {c.note}
                        </div>
                      )}

                      {/* Bottom Action Button */}
                      <Button
                        className={`btn-kcard-action ${stg.actionClass}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdvanceStage(c.id, c.stage);
                        }}
                      >
                        {stg.actionText}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Sidebar Widgets */}
        <div className="pipeline-right-sidebar">
          {/* Widget 1: Trợ lý AI (Beta) */}
          <div className="widget-ai-assistant">
            <div className="widget-ai-header">
              <div className="widget-ai-title-row">
                <ThunderboltOutlined style={{ color: '#4F46E5' }} />
                <span>Trợ lý AI</span>
              </div>
              <span className="widget-beta-tag">Beta</span>
            </div>

            <p className="widget-ai-description">
              Gợi ý creator phù hợp và hỗ trợ bạn tối ưu chiến dịch hiệu quả hơn.
            </p>

            <div className="widget-ai-recommendations-list">
              <div
                className="ai-recommendation-item"
                onClick={() => message.info('Đang lọc 3 creator có tỷ lệ phản hồi cao...')}
              >
                <div className="ai-rec-title">
                  <span>3 creator có khả năng phản hồi cao</span>
                  <RightOutlined style={{ fontSize: 10, color: '#94A3B8' }} />
                </div>
                <div className="ai-rec-subtitle">
                  Dựa trên mức độ tương tác và lịch sử hợp tác
                </div>
              </div>

              <div
                className="ai-recommendation-item"
                onClick={() => message.info('Hiển thị 2 chiến dịch cần follow-up ngay hôm nay.')}
              >
                <div className="ai-rec-title">
                  <span>2 chiến dịch cần follow-up hôm nay</span>
                  <RightOutlined style={{ fontSize: 10, color: '#94A3B8' }} />
                </div>
                <div className="ai-rec-subtitle">
                  Để tăng tỷ lệ phản hồi và đảm bảo tiến độ
                </div>
              </div>

              <div
                className="ai-recommendation-item"
                onClick={() => message.info('Mở phân tích ngân sách và đề xuất tối ưu ROI.')}
              >
                <div className="ai-rec-title">
                  <span>Ngân sách tháng này đang thấp hơn dự kiến 12%</span>
                  <RightOutlined style={{ fontSize: 10, color: '#94A3B8' }} />
                </div>
                <div className="ai-rec-subtitle">
                  Cân nhắc chỉnh để đạt hiệu quả tốt nhất
                </div>
              </div>
            </div>

            <Button
              className="btn-view-ai-proposals"
              onClick={() => message.success('Đang tổng hợp đề xuất AI toàn diện...')}
            >
              ✦ Xem đề xuất AI →
            </Button>
          </div>

          {/* Widget 2: Thông tin nhanh */}
          <div className="widget-quick-info">
            <div className="widget-quick-info-title">✦ Thông tin nhanh</div>

            <div className="widget-quick-info-grid">
              <div className="quick-info-stat-box">
                <span className="quick-info-label">Tổng creator</span>
                <span className="quick-info-number">28</span>
                <span className="quick-info-trend">+4%</span>
              </div>

              <div className="quick-info-stat-box">
                <span className="quick-info-label">Đã liên hệ</span>
                <span className="quick-info-number">7</span>
                <span className="quick-info-trend">+2%</span>
              </div>

              <div className="quick-info-stat-box">
                <span className="quick-info-label">Đã xác nhận</span>
                <span className="quick-info-number">3</span>
                <span className="quick-info-trend">+1%</span>
              </div>
            </div>
          </div>

          {/* Widget 3: Banner Tạo chiến dịch mới với AI */}
          <div className="widget-create-campaign-banner">
            <h4 className="banner-create-title">
              Tạo chiến dịch mới với AI chỉ trong 1 phút
            </h4>

            <Button
              className="btn-banner-create-action"
              onClick={() => navigate('/campaigns/create')}
            >
              Tạo chiến dịch ngay →
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Thêm Creator vào Pipeline */}
      <Modal
        title="Thêm Creator vào Pipeline Chiến Dịch"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        footer={null}
        width={480}
      >
        <Form layout="vertical" onFinish={handleAddNewCreator} style={{ marginTop: 14 }}>
          <Form.Item
            label="Tên Creator"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên Creator' }]}
          >
            <Input placeholder="Ví dụ: Hoàng Yến Beauty" />
          </Form.Item>

          <Form.Item label="Username" name="username">
            <Input placeholder="Ví dụ: hoangyen.beauty" />
          </Form.Item>

          <Form.Item label="Nền tảng chính" name="platform" initialValue="instagram">
            <Select>
              <Select.Option value="instagram">Instagram</Select.Option>
              <Select.Option value="tiktok">TikTok</Select.Option>
              <Select.Option value="youtube">YouTube</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Giai đoạn Pipeline" name="stage" initialValue="found">
            <Select>
              <Select.Option value="found">Mới tìm thấy</Select.Option>
              <Select.Option value="review">Đang xem xét</Select.Option>
              <Select.Option value="contacted">Đã liên hệ</Select.Option>
              <Select.Option value="negotiating">Đang đàm phán</Select.Option>
              <Select.Option value="confirmed">Đã xác nhận</Select.Option>
            </Select>
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item label="Followers" name="followers" initialValue="600K">
              <Input />
            </Form.Item>
            <Form.Item label="Chi phí dự kiến" name="fee" initialValue="$5.0M">
              <Input />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button onClick={() => setAddModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                fontWeight: 700,
              }}
            >
              Lưu vào Pipeline
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
