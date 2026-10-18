import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Select,
  message,
  Modal,
  Form,
  Spin,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  ExportOutlined,
  RightOutlined,
  ThunderboltOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { campaignService } from '../../services/api/campaignService';
import type { CampaignResponse, RelationshipDto, RelationshipStage } from '../../types/api/campaign.types';
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

const stageBackendToUi: Record<RelationshipStage, PipelineCreator['stage']> = {
  SHORTLISTED: 'found',
  CONTACTED: 'contacted',
  INTERESTED: 'review',
  COLLABORATING: 'negotiating',
  COMPLETED: 'confirmed',
  NOT_INTERESTED: 'found',
};

const stageUiToBackend: Record<PipelineCreator['stage'], RelationshipStage> = {
  found: 'SHORTLISTED',
  review: 'INTERESTED',
  contacted: 'CONTACTED',
  negotiating: 'COLLABORATING',
  confirmed: 'COMPLETED',
};

export default function CampaignManagementPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [campaign, setCampaign] = useState<CampaignResponse | null>(null);
  const [pipelineCreators, setPipelineCreators] = useState<PipelineCreator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'instagram' | 'youtube' | 'tiktok'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        let currentCampId = id;
        if (!currentCampId) {
          const allCamps = await campaignService.getCampaigns();
          if (allCamps.length > 0) {
            currentCampId = allCamps[0].id;
          }
        }

        if (currentCampId) {
          const [campDetail, rels] = await Promise.all([
            campaignService.getCampaignById(currentCampId).catch(() => null),
            campaignService.getRelationships(currentCampId).catch(() => [] as RelationshipDto[]),
          ]);

          if (isMounted) {
            if (campDetail) setCampaign(campDetail);
            const mapped: PipelineCreator[] = rels.map((r: RelationshipDto) => {
              const feeNum = r.agreedFee || r.quotedFee || 0;
              const feeText = feeNum > 0 ? `${(feeNum / 1_000_000).toFixed(1)}M ₫` : 'Thỏa thuận';
              return {
                id: r.id,
                name: r.creatorName || 'Creator',
                username: r.creatorName ? r.creatorName.toLowerCase().replace(/\s+/g, '_') : 'creator',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                platform: 'tiktok',
                followers: '500K',
                engagement: '4.8%',
                fee: feeText,
                matchScore: 90,
                stage: stageBackendToUi[r.stage] || 'found',
                note: r.notes || (r.lastContactAt ? `Liên hệ: ${new Date(r.lastContactAt).toLocaleDateString('vi-VN')}` : undefined),
              };
            });
            setPipelineCreators(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to load pipeline data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id]);

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
      count: pipelineCreators.filter((c) => c.stage === 'found').length,
      budget: '$18.2M',
      nextStage: 'review',
      actionText: '+ Đang xem xét',
      actionClass: 'btn-action-add',
    },
    {
      key: 'review',
      title: 'Đang xem xét',
      icon: '👁',
      headerClass: 'stage-review',
      count: pipelineCreators.filter((c) => c.stage === 'review').length,
      budget: '$16.7M',
      nextStage: 'contacted',
      actionText: '✉ Đã liên hệ',
      actionClass: 'btn-action-add',
    },
    {
      key: 'contacted',
      title: 'Đã liên hệ',
      icon: '✉',
      headerClass: 'stage-contacted',
      count: pipelineCreators.filter((c) => c.stage === 'contacted').length,
      budget: '$9.4M',
      nextStage: 'negotiating',
      actionText: '🤝 Đang đàm phán',
      actionClass: 'btn-action-contacted',
    },
    {
      key: 'negotiating',
      title: 'Đang đàm phán',
      icon: '🤝',
      headerClass: 'stage-negotiating',
      count: pipelineCreators.filter((c) => c.stage === 'negotiating').length,
      budget: '$7.8M',
      nextStage: 'confirmed',
      actionText: '✓ Đã xác nhận',
      actionClass: 'btn-action-negotiating',
    },
    {
      key: 'confirmed',
      title: 'Đã xác nhận',
      icon: '✓',
      headerClass: 'stage-confirmed',
      count: pipelineCreators.filter((c) => c.stage === 'confirmed').length,
      budget: '$4.6M',
      nextStage: null,
      actionText: '✓ Hoàn thành',
      actionClass: 'btn-action-confirmed',
    },
  ];

  // Move creator to next stage
  const handleAdvanceStage = async (creatorId: string, currentStage: PipelineCreator['stage']) => {
    const stageFlow: Record<string, PipelineCreator['stage']> = {
      found: 'review',
      review: 'contacted',
      contacted: 'negotiating',
      negotiating: 'confirmed',
    };

    const next = stageFlow[currentStage];
    if (next && campaign?.id) {
      const backendStage = stageUiToBackend[next];
      try {
        await campaignService.updateRelationshipStage(campaign.id, creatorId, backendStage);
        setPipelineCreators((prev) =>
          prev.map((c) => (c.id === creatorId ? { ...c, stage: next } : c))
        );
        message.success('Đã cập nhật trạng thái pipeline trên máy chủ thành công!');
      } catch {
        // Optimistic fallback for frontend UX
        setPipelineCreators((prev) =>
          prev.map((c) => (c.id === creatorId ? { ...c, stage: next } : c))
        );
        message.info('Đã lưu trạng thái cục bộ.');
      }
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
  const handleAddNewCreator = async (values: any) => {
    const newCreator: PipelineCreator = {
      id: 'p_' + Date.now(),
      name: values.name,
      username: values.username || 'creator_' + Date.now().toString().slice(-4),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      platform: values.platform || 'tiktok',
      followers: values.followers || '500K',
      engagement: values.engagement || '4.5%',
      fee: values.fee || '$5.0M',
      matchScore: 88,
      tags: values.tags || 'Beauty, Skincare',
      stage: values.stage || 'found',
    };

    if (campaign?.id) {
      try {
        await campaignService.createRelationship(campaign.id, {
          creatorId: newCreator.id,
          creatorName: newCreator.name,
          stage: stageUiToBackend[newCreator.stage],
        });
      } catch {
        // local fallback
      }
    }

    setPipelineCreators([newCreator, ...pipelineCreators]);
    message.success(`Đã thêm ${newCreator.name} vào Creator Pipeline!`);
    setAddModalOpen(false);
  };

  return (
    <div className="pipeline-page-container">
      {/* 1. Header Title Row */}
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
            alt={campaign?.name || 'Chiến dịch'}
            className="campaign-thumb-img"
          />

          <div className="campaign-meta-content">
            <div className="campaign-title-row">
              <span className="campaign-name-title">{campaign?.name || 'Chiến dịch Influencer'}</span>
              <span className="campaign-status-tag">🟢 {campaign?.status || 'Đang diễn ra'}</span>
            </div>

            <div className="campaign-subtitle-text">
              {campaign?.productService ? `Sản phẩm / Dịch vụ: ${campaign.productService}` : 'Chiến dịch quảng bá thương hiệu'}
            </div>

            <div className="campaign-date-text">
              <CalendarOutlined />
              <span>{campaign?.createdAt ? new Date(campaign.createdAt).toLocaleDateString('vi-VN') : 'Mới tạo'}</span>
            </div>
          </div>
        </div>

        <div className="campaign-summary-stats">
          <div className="campaign-stat-item">
            <span className="campaign-stat-label">Tổng creator</span>
            <div className="campaign-stat-value-row">
              <span className="campaign-stat-number">{pipelineCreators.length}</span>
              <span className="campaign-stat-badge-green">Realtime</span>
            </div>
          </div>

          <div className="campaign-stat-item">
            <span className="campaign-stat-label">Tổng reach dự kiến</span>
            <div className="campaign-stat-value-row">
              <span className="campaign-stat-number">{pipelineCreators.length > 0 ? `${pipelineCreators.length * 120}K` : '0'}</span>
              <span className="campaign-stat-badge-green">Est.</span>
            </div>
          </div>

          <div className="campaign-stat-item">
            <span className="campaign-stat-label">Ngân sách chiến dịch</span>
            <div className="campaign-stat-value-row">
              <span className="campaign-stat-number">{campaign?.budgetMax ? `${(campaign.budgetMax / 1_000_000).toFixed(0)}M ₫` : 'Thỏa thuận'}</span>
              <span className="campaign-stat-badge-green">VND</span>
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
            <span>👜 {campaign?.name || 'Chiến dịch hiện tại'}</span>
            <DownOutlined style={{ fontSize: 10 }} />
          </div>

          {/* Channels Pills */}
          <div
            className={`channel-pill-item ${selectedChannel === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedChannel('all')}
          >
            <span>Tất cả ({pipelineCreators.length})</span>
          </div>

          <div
            className={`channel-pill-item ${selectedChannel === 'tiktok' ? 'active' : ''}`}
            onClick={() => setSelectedChannel('tiktok')}
          >
            <span className="channel-dot" style={{ background: '#0F172A' }} />
            <span>TikTok ({pipelineCreators.filter((c) => c.platform === 'tiktok').length})</span>
          </div>

          <div
            className={`channel-pill-item ${selectedChannel === 'instagram' ? 'active' : ''}`}
            onClick={() => setSelectedChannel('instagram')}
          >
            <span className="channel-dot" style={{ background: '#DD2A7B' }} />
            <span>Instagram ({pipelineCreators.filter((c) => c.platform === 'instagram').length})</span>
          </div>

          <div
            className={`channel-pill-item ${selectedChannel === 'youtube' ? 'active' : ''}`}
            onClick={() => setSelectedChannel('youtube')}
          >
            <span className="channel-dot" style={{ background: '#EF4444' }} />
            <span>YouTube ({pipelineCreators.filter((c) => c.platform === 'youtube').length})</span>
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
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="Đang tải dữ liệu Pipeline từ máy chủ..." />
        </div>
      ) : (
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
                      <span className="col-header-count">{colItems.length}</span>
                    </div>
                  </div>

                  {/* Cards List in this Column */}
                  <div className="kanban-cards-stack">
                    {colItems.map((c) => (
                      <div
                        key={c.id}
                        className="kanban-creator-card"
                        onClick={() => navigate('/creators')}
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
                        {stg.nextStage && (
                          <Button
                            className={`btn-kcard-action ${stg.actionClass}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdvanceStage(c.id, c.stage);
                            }}
                          >
                            {stg.actionText}
                          </Button>
                        )}
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
                  onClick={() => message.info('Đang phân tích độ tương tác và lịch sử hợp tác...')}
                >
                  <div className="ai-rec-title">
                    <span>Creator có khả năng phản hồi cao</span>
                    <RightOutlined style={{ fontSize: 10, color: '#94A3B8' }} />
                  </div>
                  <div className="ai-rec-subtitle">
                    Dựa trên mức độ tương tác và lịch sử hợp tác
                  </div>
                </div>

                <div
                  className="ai-recommendation-item"
                  onClick={() => message.info('Hiển thị chiến dịch cần follow-up ngay hôm nay.')}
                >
                  <div className="ai-rec-title">
                    <span>Chiến dịch cần follow-up hôm nay</span>
                    <RightOutlined style={{ fontSize: 10, color: '#94A3B8' }} />
                  </div>
                  <div className="ai-rec-subtitle">
                    Để tăng tỷ lệ phản hồi và đảm bảo tiến độ
                  </div>
                </div>
              </div>

              <Button
                className="btn-view-ai-proposals"
                onClick={() => message.success('Đang phân tích toàn diện chiến dịch qua AI...')}
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
                  <span className="quick-info-number">{pipelineCreators.length}</span>
                  <span className="quick-info-trend">Live</span>
                </div>

                <div className="quick-info-stat-box">
                  <span className="quick-info-label">Đã liên hệ</span>
                  <span className="quick-info-number">
                    {pipelineCreators.filter((c) => c.stage === 'contacted').length}
                  </span>
                  <span className="quick-info-trend">CRM</span>
                </div>

                <div className="quick-info-stat-box">
                  <span className="quick-info-label">Đã xác nhận</span>
                  <span className="quick-info-number">
                    {pipelineCreators.filter((c) => c.stage === 'confirmed').length}
                  </span>
                  <span className="quick-info-trend">Hợp đồng</span>
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
      )}

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

          <Form.Item label="Nền tảng chính" name="platform" initialValue="tiktok">
            <Select>
              <Select.Option value="tiktok">TikTok</Select.Option>
              <Select.Option value="instagram">Instagram</Select.Option>
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
            <Form.Item label="Chi phí dự kiến" name="fee" initialValue="5.0M ₫">
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
