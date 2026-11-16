import ShortlistQuickPicker from './ShortlistQuickPicker';
import { getErrorMessage } from '../../services/apiClient';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, App, Avatar, Button, Drawer, Dropdown, Empty, Form, Input, Modal, Select, Skeleton, Space, Tabs, Tag } from 'antd';
import {
  MoreOutlined,
  EyeOutlined,
  LikeOutlined,
  DislikeOutlined,
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
import { useNavigate, useLocation } from 'react-router-dom';
import '../../pages/creator/CreatorDiscoveryPage.css';
import '../../pages/creator/CreatorShortlistPage.css';
import '../layout/CampaignWorkflow.css';

const formatNumber = (value?: number | null) => typeof value === 'number' && Number.isFinite(value)
  ? value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : 'Chưa có dữ liệu';
const formatScore = (value?: number | null) => typeof value === 'number' && Number.isFinite(value)
  ? value.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' / 100' : 'Chưa có điểm';
const formatEngagement = (value?: number | null) => typeof value === 'number' && Number.isFinite(value)
  ? (value * 100).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%' : 'Chưa có dữ liệu';

const formatPrice = (status?: PriceStatus | null) => {
  if (!status) return 'Chưa có dữ liệu';
  switch (status) {
    case 'CONFIRMED_WITHIN_BUDGET': return 'Trong ngân sách';
    case 'DECLARED_ESTIMATE': return 'Ước tính';
    case 'ESTIMATED_OVER_BUDGET': return 'Vượt dự toán';
    case 'CONFIRMED_OVER_BUDGET': return 'Vượt ngân sách';
    case 'PRICE_UNKNOWN': return 'Chưa có báo giá';
    default: return 'Chưa có dữ liệu';
  }
};

export default function AiRecommendationTab({
  campaign: providedCampaign,
  initialSelectedCreatorIds = [],
  invalidSelection = false,
  autoRunToken = null,
  onAutoRunConsumed,
  onAddedToShortlist,
  onCampaignUpdated,
}: {
  campaign: CampaignResponse | null;
  initialCandidateSource?: CandidateSource;
  initialSelectedCreatorIds?: string[];
  invalidSelection?: boolean;
  autoRunToken?: string | null;
  onAutoRunConsumed?: () => void;
  availableCampaigns?: CampaignResponse[];
  onSelectCampaign?: (id: string) => void;
  onAddedToShortlist?: (id: string) => void;
  onCampaignUpdated?: (campaign: CampaignResponse) => void;
}) {
  const { message } = App.useApp();
  const sessionId = useSyncExternalStore(subscribeAuthSession, getAuthSessionId);
  const [serverCampaign, setServerCampaign] = useState<CampaignResponse | null>(null);
  const campaign = serverCampaign?.id === providedCampaign?.id ? serverCampaign : providedCampaign;
  const navigate = useNavigate();
  const location = useLocation();
  const [quickOpen, setQuickOpen] = useState(false);
  const permissions = getStoredUser()?.permissions ?? [];
  const canView = permissions.includes('VIEW_OWN_RECOMMENDATION');
  const canRun = permissions.includes('RUN_RECOMMENDATION') && !!campaign && campaign.status !== 'ARCHIVED';
  const canSave = permissions.includes('MANAGE_OWN_SHORTLIST');
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<string[]>(initialSelectedCreatorIds);
  const [mode, setMode] = useState<DisplayMode>('BEST_MATCH');
  const [tab, setTab] = useState('history');
  const [running, setRunning] = useState(false);
  const runningLock = useRef(false);
  const consumedAutoRun = useRef<string | null>(null);
  const activeRun = useRef<AbortController | null>(null);
  const savedRequest = useRef<{ fingerprint: string; key: string } | null>(null);
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'running'>('idle');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [statusWarning, setStatusWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResponseDto | null>(null);
  const [viewedRun, setViewedRun] = useState<RecommendationRun | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<CreatorRecommendationItemDto | null>(null);
  const [reject, setReject] = useState<CreatorRecommendationItemDto | null>(null);

  const initialSelectionKey = JSON.stringify(initialSelectedCreatorIds);
  useEffect(() => { setSelectedCreatorIds(JSON.parse(initialSelectionKey)); }, [initialSelectionKey]);

  const campaignId = providedCampaign?.id ?? '';
  const selectedKey = JSON.stringify(initialSelectedCreatorIds);
  useEffect(() => {
    setRunning(false); setDetail(null); setPhase('idle'); setResult(null); setViewedRun(null); setError(null); setMissingFields([]); setServerCampaign(null); setStatusWarning(null);
    return () => { activeRun.current?.abort(); activeRun.current = null; runningLock.current = false; savedRequest.current = null; };
  }, [campaignId, sessionId, selectedKey]);
  const historyQuery = useCallback(() => aiRecommendationService.getRecommendationRuns(campaignId), [campaignId]);
  const history = useAsyncResource(historyQuery, canView && !!campaign);
  const reloadHistory = history.reload;

  const run = useCallback(async () => {
    if (!campaign || !canRun || invalidSelection || runningLock.current) return;
    runningLock.current = true;
    const controller = new AbortController(); activeRun.current = controller;
    const fingerprint = JSON.stringify([sessionId, campaign.id, mode, selectedCreatorIds]);
    if (savedRequest.current?.fingerprint !== fingerprint) savedRequest.current = { fingerprint, key: crypto.randomUUID() };
    const request = { limit: 50, displayMode: mode, creatorIds: [...selectedCreatorIds], idempotencyKey: savedRequest.current.key };
    setRunning(true); setDetail(null); setTab('results'); setPhase('preparing'); setError(null); setMissingFields([]); setStatusWarning(null);
    try {
      const data = await aiRecommendationService.runWhenReady(campaign.id, request, controller.signal, (next, snapshot, warning) => {
        if (controller.signal.aborted) return;
        setPhase(next); if (snapshot) { setServerCampaign(snapshot); onCampaignUpdated?.(snapshot); } if (warning) setStatusWarning(warning);
      });
      if (controller.signal.aborted) return;
      savedRequest.current = null; setResult(data); setViewedRun(null); setTab('results'); await reloadHistory();
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
  }, [campaign, canRun, invalidSelection, sessionId, mode, selectedCreatorIds, onCampaignUpdated, reloadHistory]);

  useEffect(() => {
    if (!autoRunToken || !campaign || !canRun || invalidSelection || consumedAutoRun.current === autoRunToken) return;
    // Deferring lets StrictMode finish its setup/cleanup cycle before starting a request.
    const timer = window.setTimeout(() => {
      if (consumedAutoRun.current === autoRunToken || runningLock.current) return;
      consumedAutoRun.current = autoRunToken;
      void run();
      onAutoRunConsumed?.();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [autoRunToken, campaign, canRun, invalidSelection, run, onAutoRunConsumed]);

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
  const updateSelection = (creatorIds: string[]) => {
    setSelectedCreatorIds(creatorIds);
    const next = new URLSearchParams(location.search); next.delete('campaignId'); next.delete('creatorIds'); next.delete('candidateSource');
    navigate({ pathname: location.pathname, search: next.toString() }, { replace: true, state: {
      ...location.state, recommendationRunIntent: undefined, recommendationContext: { sessionId, campaignId: campaign.id, creatorIds },
    } });
  };
  const openShortlist = () => navigate('/creators/shortlist', { state: { shortlistContext: { sessionId, campaignId: campaign.id } } });
  const renderCandidate = (item: CreatorRecommendationItemDto, detailed = false) => {
    const categories = [...new Set([item.niche, item.category].flatMap(value => value?.split(/[,;]/).map(text => text.trim()).filter(Boolean) ?? []))];
    const isSaved = item.inShortlist === true || ['SAVED', 'READY_TO_CONTACT', 'CONTACTED'].includes(item.shortlistStatus ?? '');
    const provisional = item.isProvisional === true || result?.provisionalRecommendations?.some(candidate => candidate.creatorId === item.creatorId) === true;
    const scoreReady = item.isScoreReady !== false;
    const warnings = [...new Set(item.reasoning?.evidenceWarnings?.filter(Boolean) ?? [])];
    const scoreRows = [
      ['Lịch sử hợp tác', item.scoreBreakdown?.m1Score],
      ['Hiệu quả kênh', item.scoreBreakdown?.m2Score],
      ['Phù hợp nội dung', item.scoreBreakdown?.m3Score],
      ['Mức độ ưu tiên của thương hiệu', item.scoreBreakdown?.m4Score],
    ] as const;
    const detailRows = [
      ['Quy mô người theo dõi', item.scoreBreakdown?.followerScore],
      ['Tương tác', item.scoreBreakdown?.engagementScore],
      ['Tương đồng nội dung', item.scoreBreakdown?.semanticMatchScore],
      ['Phù hợp ngành hàng', item.scoreBreakdown?.nicheMatchScore],
    ] as const;
    return (
      <article className={detailed ? 'rec-creator-card rec-card-detail' : 'rec-creator-card rec-card-compact'} key={item.creatorId}>
        <header className="rec-identity">
          <Avatar size={48} src={item.avatarUrl || undefined}>{item.displayName?.charAt(0)}</Avatar>
          <div className="rec-author">
            <h3><button type="button" onClick={() => detailed ? navigate(campaignPath('/creators/' + item.creatorId, campaign.id)) : setDetail(item)}>{item.displayName || 'Kênh chưa có tên'}</button></h3>
            <p>{item.userName ? '@' + item.userName.replace(/^@+/, '') : 'Chưa có tên tài khoản'}</p>
          </div>
          {detailed && <Dropdown trigger={['click']} menu={{
            items: [
              { key: 'view', label: 'Xem hồ sơ', icon: <EyeOutlined /> },
              { key: 'save', label: isSaved ? 'Đã trong danh sách chọn' : 'Lưu vào danh sách', icon: <SaveOutlined />, disabled: isSaved || !canSave || !!busy },
              { key: 'accept', label: 'Đánh giá phù hợp', icon: <LikeOutlined />, disabled: !permissions.includes('RUN_RECOMMENDATION') || !!busy },
              { key: 'reject', label: 'Đánh giá không phù hợp', icon: <DislikeOutlined />, disabled: !permissions.includes('RUN_RECOMMENDATION') || !!busy },
            ],
            onClick: ({ key }) => {
              if (key === 'view') navigate(campaignPath('/creators/' + item.creatorId, campaign.id));
              else if (key === 'save') void save(item);
              else if (key === 'accept') void accept(item);
              else if (key === 'reject') setReject(item);
            },
          }}><Button type="text" icon={<MoreOutlined />} aria-label={'Thao tác với ' + item.displayName} /></Dropdown>}
        </header>
        <div className="rec-statuses">
          {item.platform && <Tag>{item.platform}</Tag>}
          {item.creatorType && <Tag>{item.creatorType}</Tag>}
          {detailed && typeof item.claimed === 'boolean' && <Tag>{item.claimed ? 'Đã nhận sở hữu kênh' : 'Chưa nhận sở hữu kênh'}</Tag>}
          {provisional && <Tag>Kết quả tạm thời</Tag>}
        </div>
        {categories.length > 0 && <div className="rec-niches">{(detailed ? categories : categories.slice(0, 3)).map(category => <span key={category}>{category}</span>)}</div>}
        <div className="rec-score">
          <span>Điểm phù hợp</span>
          <strong>{scoreReady ? formatScore(item.finalScore) : 'Chưa sẵn sàng'}</strong>
        </div>
        <dl className="rec-metrics">
          <div><dt>Người theo dõi</dt><dd>{formatNumber(item.followers)}</dd></div>
          <div><dt>Tỷ lệ tương tác</dt><dd>{formatEngagement(item.engagementRate)}</dd></div>
          {detailed && <div><dt>Lượt xem trung bình</dt><dd>{formatNumber(item.avgViews)}</dd></div>}
          {detailed && <div><dt>Lượt thích trung bình</dt><dd>{formatNumber(item.avgLikes)}</dd></div>}
        </dl>
        <div className="rec-price"><span>Trạng thái báo giá</span><strong>{formatPrice(item.priceStatus)}</strong></div>
        {detailed && <div className="rec-reason-summary"><h4>Vì sao được gợi ý?</h4><p>{item.reasoning?.summary || 'Chưa có phần giải thích cho kết quả này.'}</p></div>}
        {detailed && <details className="rec-details" open>
          <summary>Lý do và điểm chi tiết</summary>
          {item.reasoning?.reasons?.length ? <ul>{item.reasoning.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul> : <p>Chưa có lý do chi tiết.</p>}
          <h4>Điểm thành phần</h4>
          <dl className="rec-breakdown">{scoreRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{scoreReady ? formatScore(value) : 'Chưa sẵn sàng'}</dd></div>)}</dl>
          {detailRows.some(([, value]) => value != null) && <dl className="rec-breakdown rec-sub-scores">{detailRows.filter(([, value]) => value != null).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{scoreReady ? formatScore(value) : 'Chưa sẵn sàng'}</dd></div>)}</dl>}
          {item.reasoning?.explanationAvailable === false && <p>Phần giải thích đầy đủ chưa có sẵn.</p>}
        </details>}
        {detailed && warnings.length > 0 && <aside className="rec-evidence"><h4>Lưu ý về dữ liệu</h4><ul>{warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></aside>}
        {detailed ? <footer className="rec-card-footer">
          <div className="rec-card-actions"><Button onClick={() => navigate(campaignPath('/creators/' + item.creatorId, campaign.id))}>Xem hồ sơ</Button><Button type="primary" disabled={isSaved || !canSave || !!busy} loading={busy === item.creatorId} onClick={() => void save(item)}>{isSaved ? 'Đã trong danh sách chọn' : 'Lưu vào danh sách'}</Button></div>
          <div className="rec-feedback"><span>Đánh giá kết quả</span><Space size={4}><Button size="small" type="text" icon={<LikeOutlined />} disabled={!permissions.includes('RUN_RECOMMENDATION') || !!busy} onClick={() => void accept(item)}>Phù hợp</Button><Button size="small" type="text" icon={<DislikeOutlined />} disabled={!permissions.includes('RUN_RECOMMENDATION') || !!busy} onClick={() => setReject(item)}>Không phù hợp</Button></Space></div>
        </footer> : <footer className="rec-compact-footer">
          <span>{isSaved ? 'Đã trong danh sách chọn' : 'Chưa lưu vào danh sách'}{warnings.length > 0 ? ' · Có lưu ý dữ liệu' : ''}</span>
          <Button onClick={() => setDetail(item)}>Xem chi tiết</Button>
        </footer>}
      </article>
    );

  };


  return (
    <div className="workflow-page recommendation-page">
      <header className="rec-page-heading">
        <div><h1>Gợi ý nhà sáng tạo</h1><p>{campaign.name}</p></div>
        <Button disabled={running} onClick={openShortlist}>Danh sách đã chọn</Button>
      </header>
      <section className="workflow-panel rec-run-panel" aria-label="Thiết lập gợi ý">
        <div className="rec-run-toolbar">
          <div className="rec-run-scope">
            <span className="rec-control-label">Phạm vi đánh giá</span>
            <strong>{selectedCreatorIds.length ? selectedCreatorIds.length + ' kênh đã chọn' : 'Toàn bộ danh sách đã lưu'}</strong>
            <div className="rec-scope-actions">
              <Button size="small" disabled={running} onClick={() => setQuickOpen(true)}>{selectedCreatorIds.length ? 'Đổi lựa chọn' : 'Chọn kênh'}</Button>
              {selectedCreatorIds.length > 0 && <Button size="small" type="text" disabled={running} onClick={() => {
                updateSelection([]);
              }}>Dùng toàn bộ danh sách</Button>}
            </div>
          </div>
          <div className="rec-run-actions">
            <label className="rec-mode-field"><span className="rec-control-label">Cách sắp xếp</span><Select
              disabled={running} aria-label="Cách sắp xếp" value={mode} onChange={setMode}
              options={[
                { value: 'BEST_MATCH', label: 'Phù hợp nhất' },
                { value: 'BUDGET_READY_FIRST', label: 'Ưu tiên thông tin chi phí' },
                { value: 'DIVERSIFIED_MATCH', label: 'Đa dạng kênh' },
              ]}
            /></label>
            <Button className="rec-run-button" type="primary" disabled={!canRun || invalidSelection || running} loading={running} onClick={() => void run()}>
              {running ? phase === 'preparing' ? 'Đang chuẩn bị dữ liệu' : 'Đang chạy gợi ý' : error ? 'Thử lại yêu cầu' : 'Chạy gợi ý mới'}
            </Button>
          </div>
        </div>
        <p className="rec-run-note">Xem lịch sử hoặc tải lại trang không tạo thêm lượt gợi ý.</p>
        {invalidSelection && <Alert type="error" title="Danh sách kênh trên liên kết không hợp lệ. Vui lòng chọn lại." />}
        {running && <Alert type="info" showIcon title={phase === 'preparing' ? 'Đang chuẩn bị dữ liệu' : 'Đang chạy gợi ý'} description="Giữ nguyên chiến dịch và các kênh đã chọn. Hệ thống sẽ tự tiếp tục một lần khi dữ liệu sẵn sàng." />}
        {campaign.status === 'DRAFT' && !running && !result && <Alert type="info" title="Chiến dịch đang là bản nháp" description="Bấm Chạy để kiểm tra thông tin và chuẩn bị dữ liệu. Nếu brief chưa đủ, hệ thống sẽ báo rõ và dừng." />}
        {!canRun && <p className="ad-note">Cần quyền chạy gợi ý và chiến dịch chưa bị lưu trữ.</p>}
      </section>

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
              <div className="workflow-table rec-history-table">
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
                        <td data-label="Thời gian">{shortlistDate(run.createdAt)}</td>
                        <td data-label="Số ứng viên">{formatNumber(run.candidatesCount)}</td>
                        <td data-label="Trạng thái">{run.status === 'COMPLETED' ? 'Đã hoàn tất' : run.status === 'FAILED' ? 'Chưa hoàn tất' : 'Đang xử lý'}</td>
                        <td>
                          <Button
                            onClick={() => {
                              setDetail(null); setViewedRun(run);
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
              <section className="rec-results" aria-label="Kết quả gợi ý">
                <header className="rec-results-heading">
                  <div><h2>Kết quả gợi ý</h2><p>{campaign.name}</p></div>
                  <div className="rec-result-counts">
                    {result && <span>Ứng viên được đánh giá <strong>{formatNumber(result.totalCandidates)}</strong></span>}
                    <span>Kết quả hiển thị <strong>{formatNumber(candidates.length)}</strong></span>
                  </div>
                </header>
                <div className="rec-cards-grid">
                  {candidates.map(item => renderCandidate(item))}
                </div>
              </section>
            ),
          },
        ]}
      />

      {!running && !error && !invalidSelection && tab === 'results' && candidates != null && (
        <section className="rec-next-action" aria-label="Tiếp tục sau khi xem kết quả">
          <div>
            <h2>{candidates.length ? 'Tiếp tục với kênh phù hợp' : 'Khám phá thêm kênh'}</h2>
            <p>{candidates.length
              ? 'Chọn kênh trong danh sách đã lưu để kiểm tra khả năng liên hệ và chuẩn bị hồ sơ tiếp cận. Bước này chưa gửi lời mời hợp tác.'
              : 'Bạn có thể bổ sung kênh vào danh sách đã chọn rồi chạy một lượt gợi ý khác.'}</p>
            <small>Kết quả lượt này đã được lưu trong lịch sử. Bạn có thể rời trang và xem lại sau.</small>
          </div>
          <div className="rec-next-buttons">
            <Button onClick={() => navigate('/campaigns/' + campaign.id)}>Về chiến dịch</Button>
            <Button type="primary" disabled={!permissions.includes('MANAGE_OWN_SHORTLIST')} onClick={() => candidates.length ? openShortlist() : navigate(campaignPath('/creators', campaign.id))}>
              {candidates.length ? 'Chọn kênh để liên hệ' : 'Khám phá kênh'}
            </Button>
          </div>
        </section>
      )}

      <Drawer title="Chi tiết kết quả gợi ý" rootClassName="rec-detail-drawer" size="min(640px, 100vw)" open={!!detail} onClose={() => setDetail(null)} destroyOnHidden>
        {detail && renderCandidate(detail, true)}
      </Drawer>

      {quickOpen && (
        <ShortlistQuickPicker
          open={quickOpen}
          campaignId={campaign.id}
          selectedIds={selectedCreatorIds}
          onClose={() => setQuickOpen(false)}
          onApply={ids => {
            setQuickOpen(false);
            updateSelection(ids);
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
