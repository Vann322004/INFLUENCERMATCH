import ShortlistQuickPicker from './ShortlistQuickPicker';
import { getErrorMessage } from '../../services/apiClient';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, Avatar, Button, Dropdown, Empty, Form, Input, Modal, Select, Skeleton, Space, Tabs, Tag, message } from 'antd';
import {
  MoreOutlined,
  EyeOutlined,
  CheckCircleFilled,
  UsergroupAddOutlined,
  LikeOutlined,
  DislikeOutlined,
  ThunderboltOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { aiRecommendationService } from '../../services/api/aiRecommendationService';
import { creatorService } from '../../services/api/creatorService';
import { getStoredUser, getAuthSessionId, subscribeAuthSession } from '../../services/authSession';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import type { CampaignResponse } from '../../types/api/campaign.types';
import type { CandidateSource, CreatorRecommendationItemDto, DisplayMode, PriceStatus, RecommendationResponseDto, RecommendationRun } from '../../types/api/aiRecommendation.types';
import { shortlistDate } from '../../pages/creator/components/shortlistDisplay';
import { campaignPath } from '../../services/campaignContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../../pages/creator/CreatorDiscoveryPage.css';
import '../../pages/creator/CreatorShortlistPage.css';

const formatFollowers = (followers?: number | null) => {
  if (followers == null || isNaN(followers)) return '0';
  if (followers >= 1_000_000) return `${(followers / 1_000_000).toFixed(1)}M`;
  if (followers >= 1_000) return `${Math.round(followers / 1_000)}K`;
  return followers.toLocaleString('vi-VN');
};

const formatEngagement = (er?: number | null) => {
  if (er == null || isNaN(er)) return 'Chưa có';
  if (er > 0 && er <= 1) return `${(er * 100).toFixed(2)}%`;
  return `${Number(er).toFixed(2)}%`;
};

const formatPrice = (status?: PriceStatus | null) => {
  if (!status) return 'Chưa có';
  switch (status) {
    case 'CONFIRMED_WITHIN_BUDGET': return 'Trong ngân sách';
    case 'DECLARED_ESTIMATE': return 'Ước tính';
    case 'ESTIMATED_OVER_BUDGET': return 'Vượt dự toán';
    case 'CONFIRMED_OVER_BUDGET': return 'Vượt ngân sách';
    case 'PRICE_UNKNOWN':
    default: return 'Chưa có';
  }
};

export default function AiRecommendationTab({
  campaign: providedCampaign,
  initialSelectedCreatorIds = [],
  invalidSelection = false,
  onAddedToShortlist,
  onCampaignUpdated,
}: {
  campaign: CampaignResponse | null;
  initialCandidateSource?: CandidateSource;
  initialSelectedCreatorIds?: string[];
  invalidSelection?: boolean;
  availableCampaigns?: CampaignResponse[];
  onSelectCampaign?: (id: string) => void;
  onAddedToShortlist?: (id: string) => void;
  onCampaignUpdated?: (campaign: CampaignResponse) => void;
}) {
  const sessionId = useSyncExternalStore(subscribeAuthSession, getAuthSessionId);
  const [serverCampaign, setServerCampaign] = useState<CampaignResponse | null>(null);
  const campaign = serverCampaign?.id === providedCampaign?.id ? serverCampaign : providedCampaign;
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const [quickOpen, setQuickOpen] = useState(false);
  const permissions = getStoredUser()?.permissions ?? [];
  const canView = permissions.includes('VIEW_OWN_RECOMMENDATION');
  const canRun = permissions.includes('RUN_RECOMMENDATION') && !!campaign && campaign.status !== 'ARCHIVED';
  const canSave = permissions.includes('MANAGE_OWN_SHORTLIST');
  const [source, setSource] = useState<CandidateSource>('SHORTLIST');
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<string[]>(initialSelectedCreatorIds);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [mode, setMode] = useState<DisplayMode>('BEST_MATCH');
  const [tab, setTab] = useState('history');
  const [running, setRunning] = useState(false);
  const runningLock = useRef(false);
  const activeRun = useRef<AbortController | null>(null);
  const savedRequest = useRef<{ fingerprint: string; key: string } | null>(null);
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'running'>('idle');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [statusWarning, setStatusWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResponseDto | null>(null);
  const [viewedRun, setViewedRun] = useState<RecommendationRun | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reject, setReject] = useState<CreatorRecommendationItemDto | null>(null);

  const initialSelectionKey = JSON.stringify(initialSelectedCreatorIds);
  useEffect(() => { setSelectedCreatorIds(JSON.parse(initialSelectionKey)); }, [initialSelectionKey]);

  const campaignId = providedCampaign?.id ?? '';
  const selectedKey = JSON.stringify(initialSelectedCreatorIds);
  useEffect(() => {
    setRunning(false); setPhase('idle'); setResult(null); setViewedRun(null); setError(null); setMissingFields([]); setServerCampaign(null); setStatusWarning(null);
    return () => { activeRun.current?.abort(); activeRun.current = null; runningLock.current = false; savedRequest.current = null; };
  }, [campaignId, sessionId, selectedKey]);
  const historyQuery = useCallback(() => aiRecommendationService.getRecommendationRuns(campaignId), [campaignId]);
  const history = useAsyncResource(historyQuery, canView && !!campaign);

  const run = async () => {
    if (!campaign || !canRun || invalidSelection || runningLock.current) return;
    runningLock.current = true;
    const controller = new AbortController(); activeRun.current = controller;
    const fingerprint = JSON.stringify([sessionId, campaign.id, mode, selectedCreatorIds]);
    if (savedRequest.current?.fingerprint !== fingerprint) savedRequest.current = { fingerprint, key: crypto.randomUUID() };
    const request = { limit: 50, displayMode: mode, creatorIds: [...selectedCreatorIds], idempotencyKey: savedRequest.current.key };
    setRunning(true); setPhase('preparing'); setError(null); setMissingFields([]); setStatusWarning(null);
    try {
      const data = await aiRecommendationService.runWhenReady(campaign.id, request, controller.signal, (next, snapshot, warning) => {
        if (controller.signal.aborted) return;
        setPhase(next); if (snapshot) { setServerCampaign(snapshot); onCampaignUpdated?.(snapshot); } if (warning) setStatusWarning(warning);
      });
      if (controller.signal.aborted) return;
      savedRequest.current = null; setResult(data); setViewedRun(null); setTab('results'); await history.reload();
    } catch (cause: any) {
      if (controller.signal.aborted) return;
      const fields = cause?.response?.data?.fieldErrors;
      const labels: Record<string, string> = { name: 'Tên chiến dịch', productService: 'Sản phẩm/dịch vụ', brief: 'Yêu cầu sáng tạo', objective: 'Mục tiêu', platforms: 'Nền tảng', startDate: 'Ngày bắt đầu', endDate: 'Ngày kết thúc', totalBudget: 'Ngân sách', creatorMode: 'Hình thức tuyển nhà sáng tạo', targetCreatorCount: 'Số nhà sáng tạo', deliverables: 'Ấn phẩm yêu cầu' };
      const missing = fields && typeof fields === 'object' ? Object.keys(fields).map(field => labels[field] || field) : [];
      setMissingFields(missing);
      setError(missing.length ? 'Chiến dịch chưa đủ thông tin. Bổ sung các trường bên dưới rồi thử lại.' : getErrorMessage(cause, 'Chưa chạy được gợi ý. Vui lòng thử lại.'));
    } finally {
      if (activeRun.current === controller) { activeRun.current = null; runningLock.current = false; setRunning(false); setPhase('idle'); }
    }
  };

  const save = async (item: CreatorRecommendationItemDto) => {
    if (!campaign || !canSave) return;
    setBusy(item.creatorId);
    try {
      const saved = await creatorService.addToShortlist(campaign.id, { creatorId: item.creatorId, priority: 'MEDIUM' });
      message.info(saved.action === 'ALREADY_EXISTS' ? 'Kênh đã có trong danh sách.' : saved.action === 'RESTORED' ? 'Đã khôi phục kênh.' : 'Đã lưu kênh.');
      onAddedToShortlist?.(item.creatorId);
    } catch {
      message.error('Chưa lưu được kênh. Vui lòng thử lại.');
    } finally {
      setBusy(null);
    }
  };

  const rejectCandidate = async (values: { reasonCode: string; reasonNote?: string }) => {
    if (!campaign || !reject) return;
    setBusy(reject.creatorId);
    try {
      await aiRecommendationService.submitFeedback(campaign.id, { creatorId: reject.creatorId, action: 'REJECT', ...values });
      setReject(null);
      message.success('Đã ghi nhận phản hồi. Kết quả đã lưu không bị viết lại.');
    } catch {
      message.error('Chưa ghi nhận được phản hồi.');
    } finally {
      setBusy(null);
    }
  };

  const accept = async (item: CreatorRecommendationItemDto) => {
    if (!campaign || busy || !permissions.includes('RUN_RECOMMENDATION')) return;
    setBusy(item.creatorId);
    try {
      await aiRecommendationService.submitFeedback(campaign.id, { creatorId: item.creatorId, action: 'ACCEPT' });
      message.success('Đã ghi nhận đánh giá phù hợp.');
    } catch {
      message.error('Chưa ghi nhận được đánh giá. Vui lòng thử lại.');
    } finally {
      setBusy(null);
    }
  };

  const candidates = viewedRun ? viewedRun.scoringSnapshot : result ? [...result.recommendations, ...(result.provisionalRecommendations ?? [])] : null;
  if (!campaign) return null;

  return (
    <div className="workflow-page">
      <div className="workflow-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <Space wrap>
            <Select
              disabled={running} aria-label="Nguồn gợi ý"
              value={source}
              onChange={value => {
                setSource(value);
                setParams(previous => {
                  const next = new URLSearchParams(previous);
                  next.set('candidateSource', value);
                  if (value !== 'SHORTLIST') next.delete('creatorIds');
                  return next;
                }, { replace: true });
              }}
              options={[
                { value: 'SHORTLIST', label: 'Danh sách đã chọn (Shortlist)' },
              ]}
            />
            <Select
              disabled={running} aria-label="Cách hiển thị"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'BEST_MATCH', label: 'Phù hợp nhất' },
                { value: 'BUDGET_READY_FIRST', label: 'Ưu tiên thông tin chi phí' },
                { value: 'DIVERSIFIED_MATCH', label: 'Đa dạng kênh' },
              ]}
            />
            <Button
              type={source === 'SHORTLIST' && selectedCreatorIds.length > 0 ? 'primary' : 'default'}
              disabled={running} icon={<UsergroupAddOutlined />}
              onClick={() => {
                if (source !== 'SHORTLIST') setSource('SHORTLIST');
                setQuickOpen(true);
              }}
            >
              {source === 'SHORTLIST' && selectedCreatorIds.length > 0
                ? `Chọn nhanh creator từ Shortlist (${selectedCreatorIds.length} đã chọn)`
                : 'Chọn nhanh creator từ Shortlist'}
            </Button>
            <Button
              type="primary"
              disabled={!canRun || invalidSelection || running}
              loading={running}
              icon={<ThunderboltOutlined />}
              onClick={() => void run()}
            >
              {running ? phase === 'preparing' ? 'Đang chuẩn bị dữ liệu' : 'Đang chạy gợi ý' : error ? 'Thử lại yêu cầu' : 'Chạy gợi ý mới'}
            </Button>
          </Space>

          <Space wrap>
            <Button onClick={() => navigate(campaignPath('/creators/shortlist', campaign.id))}>
              Danh sách đã chọn
            </Button>
            <Button onClick={() => navigate(campaignPath('/crm', campaign.id))}>
              Tiếp cận và thỏa thuận
            </Button>
          </Space>
        </div>

        {source === 'SHORTLIST' && (
          <div
            style={{
              padding: '10px 14px',
              background: selectedCreatorIds.length > 0 ? '#EEF2FF' : '#F8FAFC',
              border: selectedCreatorIds.length > 0 ? '1px solid #C7D2FE' : '1px solid #E2E8F0',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 13 }}>
              {selectedCreatorIds.length > 0 ? (
                <span style={{ color: '#3730A3', fontWeight: 500 }}>
                  🎯 Đang chọn <strong>{selectedCreatorIds.length}</strong> creator từ Shortlist để chạy gợi ý. Kết quả gợi ý sẽ chỉ đánh giá các creator này.
                </span>
              ) : (
                <span style={{ color: '#475569' }}>
                  📋 <strong>Chưa chọn riêng creator:</strong> Gợi ý mới sẽ tự động đánh giá <strong>toàn bộ creator</strong> đã có sẵn trong Shortlist của chiến dịch.
                </span>
              )}
            </div>
            <Space size="small">
              <Button disabled={running} size="small" onClick={() => setQuickOpen(true)}>
                {selectedCreatorIds.length > 0 ? 'Thay đổi danh sách' : 'Chọn creator cụ thể'}
              </Button>
              {selectedCreatorIds.length > 0 && (
                <Button
                  size="small"
                  disabled={running}
                  onClick={() => {
                    setSelectedCreatorIds([]);
                    setParams(previous => {
                      const next = new URLSearchParams(previous);
                      next.delete('creatorIds');
                      return next;
                    }, { replace: true });
                  }}
                >
                  Dùng toàn bộ Shortlist
                </Button>
              )}
            </Space>
          </div>
        )}

        <p className="ad-note">
          Chỉ chạy mới khi bạn bấm nút. Xem lịch sử và tải lại trang không tạo lượt gợi ý hay sử dụng hạn mức chạy.
        </p>
        {invalidSelection && <Alert type="error" title="Danh sách kênh trên liên kết không hợp lệ. Vui lòng chọn lại." />}
        {running && <Alert type="info" showIcon title={phase === 'preparing' ? 'Đang chuẩn bị dữ liệu' : 'Đang chạy gợi ý'} description="Giữ nguyên chiến dịch và các kênh đã chọn. Hệ thống sẽ tự tiếp tục một lần khi dữ liệu sẵn sàng." />}
        {campaign.status === 'DRAFT' && !running && !result && <Alert type="info" title="Chiến dịch đang là bản nháp" description="Bấm Chạy để kiểm tra thông tin và chuẩn bị dữ liệu. Nếu brief chưa đủ, hệ thống sẽ báo rõ và dừng." />}
        {!canRun && <p className="ad-note">Cần quyền chạy gợi ý và chiến dịch chưa bị lưu trữ.</p>}
      </div>

      {statusWarning && <Alert type="warning" title={statusWarning} />}
      {error && <Alert type="error" title={error} description={missingFields.length ? <><ul>{missingFields.map(field => <li key={field}>{field}</li>)}</ul><Button onClick={() => navigate('/campaigns/' + campaign.id + '/edit')}>Bổ sung thông tin</Button></> : undefined} />}

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'history',
            label: 'Lịch sử đã lưu',
            children: !canView ? (
              <Alert title="Bạn chưa có quyền xem lịch sử gợi ý." />
            ) : history.status === 'loading' ? (
              <Skeleton active />
            ) : history.status === 'error' ? (
              <Alert type="error" title="Không thể tải lịch sử." action={<Button onClick={() => void history.reload()}>Thử lại</Button>} />
            ) : !history.data?.length ? (
              <Empty description="Chưa có lượt gợi ý đã lưu" />
            ) : (
              <div className="workflow-table">
                <table>
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Số ứng viên</th>
                      <th>Trạng thái</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {history.data.map(run => (
                      <tr key={run.id}>
                        <td>{shortlistDate(run.createdAt)}</td>
                        <td>{formatFollowers(run.candidatesCount)}</td>
                        <td>{run.status === 'COMPLETED' ? 'Đã hoàn tất' : run.status === 'FAILED' ? 'Chưa hoàn tất' : 'Đang xử lý'}</td>
                        <td>
                          <Button
                            onClick={() => {
                              setViewedRun(run);
                              setResult(null);
                              setTab('results');
                            }}
                          >
                            Xem kết quả đã lưu
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ),
          },
          {
            key: 'results',
            label: 'Kết quả',
            children: running ? (
              <Skeleton active />
            ) : candidates == null ? (
              <Empty description="Chưa có dữ liệu chi tiết. Chọn một lượt đã lưu hoặc chủ động chạy mới." />
            ) : !candidates.length ? (
              <Empty description="Lượt này không có ứng viên phù hợp" />
            ) : (
              <div>
                {selectedCards.length > 0 && (
                  <div style={{ marginBottom: 16, padding: '10px 16px', background: '#F1F5F9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span>Đã chọn <strong>{selectedCards.length}</strong> creator</span>
                    <Space>
                      <Button
                        type="primary"
                        disabled={!canSave}
                        onClick={async () => {
                          for (const cid of selectedCards) {
                            const cand = candidates.find(c => c.creatorId === cid);
                            if (cand) await save(cand);
                          }
                          setSelectedCards([]);
                        }}
                      >
                        Lưu {selectedCards.length} creator vào danh sách
                      </Button>
                      <Button onClick={() => setSelectedCards([])}>Bỏ chọn</Button>
                    </Space>
                  </div>
                )}
                <div className="cdiscovery-cards-grid">
                  {candidates.map(item => {
                    const categories = [...new Set([item.niche, item.category].flatMap(val => val?.split(/[,;]/).map(s => s.trim()).filter(Boolean) ?? []))];
                    const displayTags = categories.length ? categories.slice(0, 3) : ['Lối sống & Sáng tạo'];
                    const isSaved = item.inShortlist || item.shortlistStatus === 'SAVED';
                    const isSelected = selectedCards.includes(item.creatorId);
                    const bioText = item.reasoning?.summary || (item as any).contentSummary || 'Kênh sáng tạo nội dung đa dạng, phù hợp với tiêu chí và ngành hàng của chiến dịch.';

                    return (
                      <article className={`cdiscovery-card${isSelected ? ' is-selected' : ''}`} key={item.creatorId}>
                        {/* Hàng 1: Checkbox + Avatar + Tên + Tag platform/match + Menu ⋮ */}
                        <div className="cdiscovery-card-top-row">
                          <div className="cdiscovery-card-left-group">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => {
                                const checked = e.target.checked;
                                setSelectedCards(prev => checked ? [...prev, item.creatorId] : prev.filter(id => id !== item.creatorId));
                              }}
                              className="cdiscovery-checkbox"
                            />
                            <div
                              className="cdiscovery-card-avatar-wrap"
                              onClick={() => navigate(campaignPath(`/creators/${item.creatorId}`, campaign.id))}
                            >
                              <Avatar size={44} src={item.avatarUrl}>{item.displayName?.charAt(0) || 'C'}</Avatar>
                            </div>
                            <div
                              className="cdiscovery-card-author-meta"
                              onClick={() => navigate(campaignPath(`/creators/${item.creatorId}`, campaign.id))}
                            >
                              <div className="cdiscovery-card-name-title">
                                <span>{item.displayName || item.userName || 'Kênh chưa có tên'}</span>
                                {(item as any).isVerified && (
                                  <CheckCircleFilled style={{ color: '#3B82F6', fontSize: 13 }} />
                                )}
                              </div>
                              <div className="cdiscovery-card-username-text">
                                @{item.userName ? item.userName.replace(/^@+/, '') : 'creator'}
                              </div>
                            </div>
                          </div>

                          <div className="cdiscovery-card-right-group">
                            <Tag
                              style={{
                                borderRadius: 12,
                                margin: 0,
                                fontWeight: 500,
                                fontSize: 11,
                                border: '1px solid #E2E8F0',
                                background: '#F8FAFC',
                                color: '#64748B',
                                textTransform: 'uppercase',
                              }}
                            >
                              {item.platform || 'TIKTOK'}
                            </Tag>
                            <Dropdown
                              menu={{
                                items: [
                                  { key: 'view', label: 'Xem hồ sơ chi tiết', icon: <EyeOutlined /> },
                                  { key: 'save', label: isSaved ? 'Đã lưu trong danh sách' : 'Lưu vào danh sách', icon: <SaveOutlined />, disabled: !canSave || !!busy },
                                  { type: 'divider' },
                                  { key: 'accept', label: 'Đánh giá: Phù hợp', icon: <LikeOutlined />, disabled: !permissions.includes('RUN_RECOMMENDATION') || !!busy },
                                  { key: 'reject', label: 'Đánh giá: Không phù hợp', icon: <DislikeOutlined />, disabled: !permissions.includes('RUN_RECOMMENDATION') || !!busy, danger: true },
                                ],
                                onClick: ({ key }) => {
                                  if (key === 'view') navigate(campaignPath(`/creators/${item.creatorId}`, campaign.id));
                                  else if (key === 'save') void save(item);
                                  else if (key === 'accept') void accept(item);
                                  else if (key === 'reject') setReject(item);
                                },
                              }}
                              trigger={['click']}
                            >
                              <button className="cdiscovery-card-dots-btn" type="button" aria-label="Thao tác khác">
                                <MoreOutlined />
                              </button>
                            </Dropdown>
                          </div>
                        </div>

                        {/* Hàng 2: Tags Niche / Category pastel */}
                        <div className="cdiscovery-card-tags-row">
                          {displayTags.map(tag => (
                            <span key={tag} className="cdiscovery-niche-pill">
                              {tag}
                            </span>
                          ))}
                          {item.finalScore != null && (
                            <span className="cdiscovery-match-tag-pill" style={{ marginLeft: 'auto' }}>
                              ✦ {Math.round(item.finalScore * 100)}% Phù hợp
                            </span>
                          )}
                        </div>

                        {/* Hàng 3: Box 3 Metrics chia cột */}
                        <div className="cdiscovery-card-metrics-box">
                          <div className="cdiscovery-metric-col">
                            <span className="cdiscovery-metric-number">{formatFollowers(item.followers)}</span>
                            <span className="cdiscovery-metric-caption">Người theo dõi</span>
                          </div>
                          <div className="cdiscovery-metric-col">
                            <span className="cdiscovery-metric-number">{formatEngagement(item.engagementRate)}</span>
                            <span className="cdiscovery-metric-caption">Tương tác</span>
                          </div>
                          <div className="cdiscovery-metric-col">
                            <span className="cdiscovery-metric-number">{formatPrice(item.priceStatus)}</span>
                            <span className="cdiscovery-metric-caption">Báo giá tham khảo</span>
                          </div>
                        </div>

                        {/* Hàng 4: Bio ngắn (clamped 2 lines) */}
                        <div className="cdiscovery-card-bio-text" title={bioText}>
                          {bioText}
                        </div>

                        {/* Hàng 5: 2 Nút hành động ở chân thẻ */}
                        <div className="cdiscovery-card-actions-row">
                          <Button
                            className="cdiscovery-btn-profile-card"
                            onClick={() => navigate(campaignPath(`/creators/${item.creatorId}`, campaign.id))}
                          >
                            Xem hồ sơ
                          </Button>
                          <Button
                            type="primary"
                            className={`cdiscovery-btn-shortlist-card ${isSaved ? 'saved' : ''}`}
                            disabled={!canSave || busy === item.creatorId}
                            loading={busy === item.creatorId}
                            onClick={() => void save(item)}
                          >
                            {isSaved ? '✓ Đã lưu danh sách' : '+ Lưu vào danh sách'}
                          </Button>
                        </div>

                        {/* Hàng 6: Phản hồi AI (Four-Memory) */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, marginTop: 4, borderTop: '1px dashed #F1F5F9', fontSize: 11 }}>
                          <span style={{ color: '#94A3B8' }}>Phản hồi AI:</span>
                          <Space size="small">
                            <Button size="small" type="text" icon={<LikeOutlined style={{ color: '#16A34A' }} />} disabled={!permissions.includes('RUN_RECOMMENDATION') || !!busy} onClick={() => void accept(item)}>
                              Phù hợp
                            </Button>
                            <Button size="small" type="text" danger icon={<DislikeOutlined />} disabled={!permissions.includes('RUN_RECOMMENDATION') || !!busy} onClick={() => setReject(item)}>
                              Không phù hợp
                            </Button>
                          </Space>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ),
          },
        ]}
      />

      {quickOpen && (
        <ShortlistQuickPicker
          open={quickOpen}
          campaignId={campaign.id}
          selectedIds={selectedCreatorIds}
          onClose={() => setQuickOpen(false)}
          onApply={ids => {
            setQuickOpen(false);
            setSelectedCreatorIds(ids);
            setParams(previous => {
              const next = new URLSearchParams(previous);
              next.set('candidateSource', 'SHORTLIST');
              next.set('campaignId', campaign.id);
              if (ids.length) next.set('creatorIds', ids.join(','));
              else next.delete('creatorIds');
              return next;
            }, { replace: true });
          }}
        />
      )}

      <Modal
        title="Phản hồi ứng viên"
        open={!!reject}
        onCancel={() => {
          if (!busy) setReject(null);
        }}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={rejectCandidate}>
          <Form.Item name="reasonCode" label="Lý do" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'PRICE_TOO_HIGH', label: 'Chi phí quá cao' },
                { value: 'NOT_TARGET_NICHE', label: 'Không phù hợp ngành hàng' },
                { value: 'POOR_ENGAGEMENT', label: 'Tương tác chưa phù hợp' },
                { value: 'BRAND_CONFLICT', label: 'Xung đột thương hiệu' },
                { value: 'OTHER', label: 'Lý do khác' },
              ]}
            />
          </Form.Item>
          <Form.Item name="reasonNote" label="Ghi chú">
            <Input.TextArea maxLength={2000} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={!!busy}>
            Gửi phản hồi
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
