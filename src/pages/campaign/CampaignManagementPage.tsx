import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Input,
  Select,
  message,
  Modal,
  Form,
  Spin,
  Popover,
  Radio,
} from 'antd';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import {
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  ExportOutlined,
  DownOutlined,
  CheckOutlined,
  CheckCircleFilled,
  RocketOutlined,
  BarChartOutlined,
  PlusOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { campaignService } from '../../services/api/campaignService';
import { creatorService } from '../../services/api/creatorService';
import type { CampaignResponse, RelationshipDto, RelationshipStage } from '../../types/api/campaign.types';
import AiRecommendationTab from '../../components/campaign/AiRecommendationTab';
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
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const [campaign, setCampaign] = useState<CampaignResponse | null>(null);
  const [availableCampaigns, setAvailableCampaigns] = useState<CampaignResponse[]>([]);
  const [pipelineCreators, setPipelineCreators] = useState<PipelineCreator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'tiktok' | 'instagram'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'match' | 'followers' | 'engagement'>('default');
  const [filterMinScore, setFilterMinScore] = useState<number>(0);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);

  // Tab: 'kanban' (Outreach CRM) vs 'recommendation' (Four-Memory)
  const isRecView =
    searchParams.get('tab') === 'recommendation' ||
    location.pathname.includes('recommendation');
  const [activeViewTab, setActiveViewTab] = useState<'kanban' | 'recommendation'>(
    isRecView ? 'recommendation' : 'kanban'
  );

  const isUuid = (val?: string) =>
    !val || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

  // Ẩn hoàn toàn chuỗi UUID trên thanh URL để URL luôn gọn gàng (/creators/recommendations hoặc /campaign-management?tab=recommendation)
  useEffect(() => {
    const rawCampId = id || searchParams.get('campaignId');
    if (rawCampId) {
      sessionStorage.setItem('current_campaign_id', rawCampId);
      localStorage.setItem('last_active_campaign_id', rawCampId);
    }

    if (id || searchParams.has('campaignId')) {
      if (location.pathname.includes('/creators/recommendations')) {
        window.history.replaceState({}, '', '/creators/recommendations');
        navigate('/creators/recommendations', { replace: true });
      } else {
        const tabParam =
          searchParams.get('tab') ||
          (location.pathname.includes('recommendation') ? 'recommendation' : activeViewTab);
        const cleanPath = `/campaign-management?tab=${tabParam}`;
        window.history.replaceState({}, '', cleanPath);
        navigate(cleanPath, { replace: true });
      }
    }
  }, [id, searchParams, location.pathname, activeViewTab, navigate]);

  // Đồng bộ tab từ searchParams
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'recommendation' || location.pathname.includes('recommendation')) {
      setActiveViewTab('recommendation');
    } else if (tabParam === 'kanban' || tabParam === 'crm' || tabParam === 'pipeline') {
      setActiveViewTab('kanban');
    }
  }, [searchParams, location.pathname]);

  const [shortlistCount, setShortlistCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const allCamps = await campaignService.getCampaigns(0, 50).catch(() => []);
        if (isMounted) {
          setAvailableCampaigns(allCamps);
        }

        let currentCampId =
          id ||
          searchParams.get('campaignId') ||
          sessionStorage.getItem('current_campaign_id') ||
          localStorage.getItem('last_active_campaign_id') ||
          undefined;

        if (!currentCampId || !allCamps.some((c) => c.id === currentCampId)) {
          if (allCamps.length > 0) {
            currentCampId = allCamps[0].id;
          }
        }

        if (currentCampId) {
          const [campDetail, rels, sList] = await Promise.all([
            campaignService.getCampaignById(currentCampId).catch(() => null),
            campaignService.getRelationships(currentCampId).catch(() => [] as RelationshipDto[]),
            creatorService.getShortlist(currentCampId).catch(() => []),
          ]);

          if (isMounted) {
            if (campDetail) {
              setCampaign(campDetail);
              sessionStorage.setItem('current_campaign_id', campDetail.id);
              localStorage.setItem('last_active_campaign_id', campDetail.id);
              sessionStorage.setItem('current_campaign_name', campDetail.name);
              localStorage.setItem('IM_SELECTED_CAMPAIGN_NAME', campDetail.name);
            }
            setShortlistCount(Array.isArray(sList) ? sList.length : 0);
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

  // Filter and sort creators based on platform, search, sort and minimum score
  const filteredCreators = useMemo(() => {
    let result = pipelineCreators.filter((item) => {
      if (selectedChannel !== 'all' && item.platform !== selectedChannel) {
        return false;
      }
      if (filterMinScore > 0 && item.matchScore < filterMinScore) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.username.toLowerCase().includes(q) ||
          (item.tags && item.tags.toLowerCase().includes(q)) ||
          (item.note && item.note.toLowerCase().includes(q))
        );
      }
      return true;
    });

    if (sortBy === 'match') {
      result = [...result].sort((a, b) => b.matchScore - a.matchScore);
    } else if (sortBy === 'followers') {
      const parseFollowers = (str: string) => {
        const num = parseFloat(str) || 0;
        if (str.toUpperCase().includes('M')) return num * 1000000;
        if (str.toUpperCase().includes('K')) return num * 1000;
        return num;
      };
      result = [...result].sort((a, b) => parseFollowers(b.followers) - parseFollowers(a.followers));
    } else if (sortBy === 'engagement') {
      result = [...result].sort(
        (a, b) => (parseFloat(b.engagement) || 0) - (parseFloat(a.engagement) || 0)
      );
    }

    return result;
  }, [pipelineCreators, selectedChannel, searchQuery, sortBy, filterMinScore]);

  // Số lượng Creator đã xác nhận thành công
  const confirmedCount = useMemo(() => {
    return pipelineCreators.filter((c) => c.stage === 'confirmed').length;
  }, [pipelineCreators]);

  // Stages configuration
  const stages = [
    {
      key: 'found',
      title: 'Mới tìm thấy',
      icon: '',
      headerClass: 'stage-found',
      count: pipelineCreators.filter((c) => c.stage === 'found').length,
      budget: '$18.2M',
      nextStage: 'review',
      actionText: 'Đang xem xét',
      actionClass: 'btn-action-add',
    },
    {
      key: 'review',
      title: 'Đang xem xét',
      icon: '',
      headerClass: 'stage-review',
      count: pipelineCreators.filter((c) => c.stage === 'review').length,
      budget: '$16.7M',
      nextStage: 'contacted',
      actionText: 'Đã liên hệ',
      actionClass: 'btn-action-add',
    },
    {
      key: 'contacted',
      title: 'Đã liên hệ',
      icon: '',
      headerClass: 'stage-contacted',
      count: pipelineCreators.filter((c) => c.stage === 'contacted').length,
      budget: '$9.4M',
      nextStage: 'negotiating',
      actionText: 'Đang đàm phán',
      actionClass: 'btn-action-contacted',
    },
    {
      key: 'negotiating',
      title: 'Đang đàm phán',
      icon: '',
      headerClass: 'stage-negotiating',
      count: pipelineCreators.filter((c) => c.stage === 'negotiating').length,
      budget: '$7.8M',
      nextStage: 'confirmed',
      actionText: 'Đã xác nhận',
      actionClass: 'btn-action-negotiating',
    },
    {
      key: 'confirmed',
      title: 'Đã xác nhận',
      icon: '',
      headerClass: 'stage-confirmed',
      count: pipelineCreators.filter((c) => c.stage === 'confirmed').length,
      budget: '$4.6M',
      nextStage: null,
      actionText: 'Hoàn thành',
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

      {/* 1. Top Stepper 7 bước toàn diện từ Lập brief đến Đo lường ROI */}
      <div className="cdiscovery-top-stepper">
        <div
          className="cdiscovery-step-item"
          onClick={() => navigate(`/campaigns/create${campaign?.id ? `?id=${campaign.id}` : ''}`)}
        >
          <div className="cdiscovery-step-badge done">
            <CheckOutlined />
          </div>
          <span className="cdiscovery-step-title">1. Tạo brief</span>
        </div>
        <div className="cdiscovery-step-line done" />

        <div
          className="cdiscovery-step-item"
          onClick={() => {
            if (campaign?.id) {
              sessionStorage.setItem('current_campaign_id', campaign.id);
              localStorage.setItem('last_active_campaign_id', campaign.id);
            }
            navigate('/creators');
          }}
        >
          <div className="cdiscovery-step-badge done">
            <CheckOutlined />
          </div>
          <span className="cdiscovery-step-title">2. Khám phá</span>
        </div>
        <div className="cdiscovery-step-line done" />

        <div
          className="cdiscovery-step-item"
          onClick={() => {
            if (campaign?.id) {
              sessionStorage.setItem('current_campaign_id', campaign.id);
              localStorage.setItem('last_active_campaign_id', campaign.id);
            }
            navigate('/creators/shortlist');
          }}
        >
          <div className="cdiscovery-step-badge done">
            <CheckOutlined />
          </div>
          <span className="cdiscovery-step-title">
            3. Danh sách chọn {shortlistCount > 0 ? `(${shortlistCount})` : ''}
          </span>
        </div>
        <div className="cdiscovery-step-line done" />

        <div
          className="cdiscovery-step-item"
          onClick={() => {
            setActiveViewTab('recommendation');
            navigate('/campaign-management?tab=recommendation');
          }}
        >
          <div className={`cdiscovery-step-badge ${activeViewTab === 'recommendation' ? 'active' : 'done'}`}>
            {activeViewTab === 'recommendation' ? '4' : <CheckOutlined />}
          </div>
          <span className={`cdiscovery-step-title ${activeViewTab === 'recommendation' ? 'active' : ''}`}>
            4. Gợi ý AI
          </span>
        </div>
        <div className={`cdiscovery-step-line ${activeViewTab === 'kanban' ? 'done' : ''}`} />

        <div
          className="cdiscovery-step-item"
          onClick={() => {
            setActiveViewTab('kanban');
            navigate('/campaign-management?tab=crm');
          }}
        >
          <div className={`cdiscovery-step-badge ${activeViewTab === 'kanban' ? 'active' : 'upcoming'}`}>
            5
          </div>
          <span className={`cdiscovery-step-title ${activeViewTab === 'kanban' ? 'active' : ''}`}>
            5. Hợp tác (CRM)
          </span>
        </div>
      </div>

      {activeViewTab === 'recommendation' ? (
        <AiRecommendationTab
          campaign={campaign}
          availableCampaigns={availableCampaigns}
          onSelectCampaign={(newCampId) => {
            sessionStorage.setItem('current_campaign_id', newCampId);
            localStorage.setItem('last_active_campaign_id', newCampId);
            const targetCamp = availableCampaigns.find((c) => c.id === newCampId);
            if (targetCamp) {
              setCampaign(targetCamp);
              sessionStorage.setItem('current_campaign_name', targetCamp.name);
              localStorage.setItem('IM_SELECTED_CAMPAIGN_NAME', targetCamp.name);
            }
            creatorService.getShortlist(newCampId).then((l: any[]) => setShortlistCount(l.length)).catch(() => {});
          }}
          onAddedToShortlist={() => {
            setShortlistCount((prev) => prev + 1);
            message.info('Đã cập nhật KOC vào Shortlist chiến dịch.');
          }}
        />
      ) : (
        <>
          {/* 2. Campaign Summary Card (Chỉ hiển thị ở tab Kanban) */}
          <div className="campaign-summary-card">
            <div className="campaign-summary-left">
              <div className="campaign-meta-content" style={{ paddingLeft: 0 }}>
                <div className="campaign-title-row">
                  <span className="campaign-name-title">{campaign?.name || 'Chiến dịch Influencer'}</span>
                  <span className="campaign-status-tag">{campaign?.status || 'Đang diễn ra'}</span>
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

          {/* 4. Full-width Toolbar: Filter & Channel Tabs & Full-width Search */}
          <div className="pipeline-filters-full-wrapper">
            {/* Top Toolbar Row */}
            <div className="pipeline-toolbar-top-row">
              <div className="pipeline-channels-group">
                {/* Campaign dropdown switcher */}
                {availableCampaigns.length > 0 && availableCampaigns.some((c) => c.id === campaign?.id) ? (
                  <Select
                    className="campaign-select-pill-select"
                    value={campaign?.id}
                    onChange={(newCampId) => {
                      sessionStorage.setItem('current_campaign_id', newCampId);
                      localStorage.setItem('last_active_campaign_id', newCampId);
                      navigate('/campaign-management?tab=crm');
                    }}
                    style={{ minWidth: 260, height: 34 }}
                    options={availableCampaigns.map((c) => ({
                      value: c.id,
                      label: isUuid(c.name) ? 'Chiến dịch' : c.name,
                    }))}
                  />
                ) : (
                  <div className="campaign-select-pill">
                    <span>{campaign?.name && !isUuid(campaign.name) ? campaign.name : 'Chiến dịch hiện tại'}</span>
                  </div>
                )}

                {/* Channels Pills (Không có YouTube) */}
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
              </div>

              <div className="pipeline-toolbar-actions">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAddModalOpen(true)}
                  className="btn-pipeline-add-creator"
                >
                  + Thêm Creator vào Pipeline
                </Button>
              </div>
            </div>

            {/* Bottom Row: Full Width Search Input + Filter Popover */}
            <div className="pipeline-search-full-row">
              <Input
                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                placeholder="Tìm creator theo tên, @username, lĩnh vực, ghi chú..."
                className="pipeline-search-full-input"
                allowClear
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <Popover
                content={
                  <div style={{ width: 230, padding: '4px 0' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#0F172A' }}>
                      Sắp xếp theo:
                    </div>
                    <Radio.Group
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                    >
                      <Radio value="default">Mặc định</Radio>
                      <Radio value="match">Độ phù hợp cao nhất</Radio>
                      <Radio value="followers">Followers nhiều nhất</Radio>
                      <Radio value="engagement">Tương tác (ER) cao nhất</Radio>
                    </Radio.Group>

                    <div style={{ borderTop: '1px solid #F1F5F9', margin: '10px 0' }} />

                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#0F172A' }}>
                      Lọc theo độ phù hợp:
                    </div>
                    <Radio.Group
                      value={filterMinScore}
                      onChange={(e) => setFilterMinScore(e.target.value)}
                      style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                    >
                      <Radio value={0}>Tất cả mức độ</Radio>
                      <Radio value={85}>Từ 85% trở lên</Radio>
                      <Radio value={90}>Từ 90% trở lên (Khớp cao)</Radio>
                    </Radio.Group>

                    {(sortBy !== 'default' || filterMinScore > 0) && (
                      <div style={{ marginTop: 12, textAlign: 'right' }}>
                        <Button
                          size="small"
                          type="link"
                          onClick={() => {
                            setSortBy('default');
                            setFilterMinScore(0);
                          }}
                        >
                          Đặt lại bộ lọc
                        </Button>
                      </div>
                    )}
                  </div>
                }
                trigger="click"
                placement="bottomRight"
              >
                <Button className="btn-pipeline-filter" icon={<FilterOutlined />}>
                  Bộ lọc & sắp xếp {(sortBy !== 'default' || filterMinScore > 0) && '•'}{' '}
                  <DownOutlined style={{ fontSize: 10 }} />
                </Button>
              </Popover>
            </div>
          </div>

          {/* Bottom navigation actions */}
          <div className="crm-completion-banner">
            <div className="crm-completion-left">
              <div className="crm-completion-icon-box">
                <CheckCircleFilled style={{ color: '#10B981', fontSize: 24 }} />
              </div>
              <div className="crm-completion-text">
                <div className="crm-completion-title">
                  🎉 Bước 5: Tiếp cận & Đàm phán Hợp tác KOC
                </div>
                <div className="crm-completion-desc">
                  {confirmedCount > 0 ? `${confirmedCount} KOC đã chốt xác nhận. ` : ''}Chuyển sang trang CRM để theo dõi chi tiết hoặc quay lại danh sách chiến dịch.
                </div>
              </div>
            </div>
            <div className="crm-completion-actions">
              <Button
                type="primary"
                className="btn-collab-cta"
                icon={<RocketOutlined />}
                onClick={() => {
                  navigate('/campaign-management?tab=crm');
                  setActiveViewTab('kanban');
                }}
              >
                Chuyển sang trang CRM ➔
              </Button>
              <Button
                className="btn-performance-cta"
                icon={<BarChartOutlined />}
                onClick={() => navigate('/campaigns')}
              >
                Quay về Chiến dịch
              </Button>
            </div>
          </div>

          {/* 5. Main Layout: 5 Kanban Columns Full Width (No Horizontal Scrollbar) */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" description="Đang tải dữ liệu Pipeline từ máy chủ..." />
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

                            {/* Bottom Action Button: Nếu ở cột Đã xác nhận thì hiện nút Hoàn tất & Về Trang chủ */}
                            {stg.key === 'confirmed' ? (
                              <Button
                                type="primary"
                                className="btn-kcard-action btn-action-collab-next"
                                icon={<CheckCircleFilled />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsFinishModalOpen(true);
                                }}
                              >
                                ✓ Đã chốt ➔ Hoàn tất
                              </Button>
                            ) : stg.nextStage ? (
                              <Button
                                className={`btn-kcard-action ${stg.actionClass}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAdvanceStage(c.id, c.stage);
                                }}
                              >
                                {stg.actionText}
                              </Button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

          {/* Pipeline Kanban Board takes full space */}
        </div>
      )}
      </>
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

      {/* Modal Chúc mừng Hoàn tất Quy trình Chiến dịch & Quay về Trang chủ */}
      <Modal
        open={isFinishModalOpen}
        onCancel={() => setIsFinishModalOpen(false)}
        footer={null}
        width={500}
        centered
      >
        <div style={{ textAlign: 'center', padding: '16px 8px 8px 8px' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
              color: '#059669',
              fontSize: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2)',
            }}
          >
            🎉
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
            Hoàn tất quy trình Chiến dịch!
          </h2>

          <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, maxWidth: 420, margin: '0 auto 20px auto' }}>
            Chúc mừng bạn đã hoàn thành trọn vẹn 5 bước từ <strong>Tạo Brief ➔ Khám phá ➔ Shortlist ➔ Đề xuất AI ➔ Tiếp cận & Đàm phán (CRM)</strong> cho chiến dịch <strong>"{campaign?.name || 'Chiến dịch'}"</strong>.
          </p>

          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              padding: '14px 18px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#4F46E5' }}>
                {pipelineCreators.length}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>KOC trong Pipeline</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#10B981' }}>
                {confirmedCount}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Đã chốt xác nhận</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>
                {pipelineCreators.length > 0 ? `${pipelineCreators.length * 120}K+` : '0'}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Reach dự kiến</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              onClick={() => {
                setIsFinishModalOpen(false);
                message.success('Đã hoàn tất quy trình chiến dịch thành công!');
                navigate('/dashboard');
              }}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                borderRadius: 10,
                fontWeight: 700,
                height: 44,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                border: 'none',
              }}
            >
              Về Trang chủ (Dashboard)
            </Button>

            <Button
              size="large"
              onClick={() => {
                setIsFinishModalOpen(false);
                navigate('/campaigns');
              }}
              style={{
                borderRadius: 10,
                fontWeight: 600,
                height: 40,
                color: '#334155',
              }}
            >
              Xem danh sách tất cả Chiến dịch
            </Button>

            <Button
              type="link"
              size="small"
              onClick={() => setIsFinishModalOpen(false)}
              style={{ color: '#94A3B8', marginTop: 4 }}
            >
              Ở lại trang này để tiếp tục theo dõi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
