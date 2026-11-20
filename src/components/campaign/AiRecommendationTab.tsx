import ShortlistQuickPicker from './ShortlistQuickPicker';
import { getErrorMessage } from '../../services/apiClient';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, App, Button, Drawer, Dropdown, Empty, Form, Input, Modal, Select, Skeleton, Space, Tabs, Tag, Tooltip } from 'antd';
import CreatorAvatar from '../../pages/creator/components/discovery/CreatorAvatar';
import {
  MoreOutlined,
  EyeOutlined,
  LikeOutlined,
  DislikeOutlined,
  SaveOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { aiRecommendationService } from '../../services/api/aiRecommendationService';
import { creatorService } from '../../services/api/creatorService';
import { getStoredUser, getAuthSessionId, subscribeAuthSession } from '../../services/authSession';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import type { CampaignResponse } from '../../types/api/campaign.types';
import type { CandidateSource, CreatorRecommendationItemDto, DisplayMode, PriceStatus, RecommendationResponseDto, RecommendationRun } from '../../types/api/aiRecommendation.types';
import { campaignPath, campaignEditor } from '../../services/campaignContext';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../pages/creator/CreatorDiscoveryPage.css';
import '../../pages/creator/CreatorShortlistPage.css';
import '../layout/CampaignWorkflow.css';

const formatNumber = (value?: number | null) => typeof value === 'number' && Number.isFinite(value)
  ? value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : 'Chưa có dữ liệu';
const formatRecommendationDate = (value?: string | null) => {
  if (!value) return 'Chưa có dữ liệu';
  // Legacy LocalDateTime responses omit the offset; the backend is configured for UTC.
  // Preserve explicit offsets instead of adding seven hours twice.
  const normalized = value.trim().replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1');
  const zoned = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized) ? normalized : normalized + 'Z';
  const date = new Date(zoned);
  if (Number.isNaN(date.getTime())) return 'Thời gian không hợp lệ';
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(date) + ' (UTC+7)';
};
const formatScore = (value?: number | null) => typeof value === 'number' && Number.isFinite(value)
  ? value.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' / 100' : 'Chưa có điểm';
const formatEngagement = (value?: number | null) => typeof value === 'number' && Number.isFinite(value)
  ? (value * 100).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%' : 'Chưa có dữ liệu';
const displayModes: Record<DisplayMode, { label: string; description: string }> = {
  BEST_MATCH: { label: 'Phù hợp nhất', description: 'Điểm TOPSIS giảm dần. Khi bằng điểm, ưu tiên M3, rồi M2; cuối cùng dùng mã kênh để giữ thứ tự ổn định.' },
  BUDGET_READY_FIRST: { label: 'Ưu tiên thông tin chi phí', description: 'Ưu tiên giá đã xác nhận trong ngân sách → phí ước tính → chưa có giá → ước tính vượt ngân sách → giá xác nhận vượt ngân sách. Trong từng nhóm, sắp theo điểm phù hợp giảm dần.' },
  DIVERSIFIED_MATCH: { label: 'Đa dạng kênh', description: 'Nhóm đề xuất chính dùng MMR để cân bằng độ phù hợp và đa dạng, nên điểm không nhất thiết giảm dần. Nhóm tham khảo giữ thứ tự theo điểm nội bộ, không dùng MMR.' },
};

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

const confidenceLabel = (value?: string | null) => ({ HIGH: 'Cao', MEDIUM: 'Trung bình', LOW: 'Thấp' }[value ?? ''] ?? 'Chưa có dữ liệu');
const tierLabel = (item: CreatorRecommendationItemDto) => {
  switch (item.recommendationTier) {
    case 'HISTORY_SUPPORTED': return 'Có bằng chứng lịch sử hỗ trợ';
    case 'LIMITED_HISTORY': return 'Chưa đủ bằng chứng lịch sử';
    case 'LIMITED_STABILITY': return 'Dữ liệu ổn định còn hạn chế';
    default: return item.isProvisional === true ? 'Kết quả tham khảo' : 'Chưa có phân loại bằng chứng';
  }
};
const m4SourceLabel = (value?: string | null) => ({
  DIRECT_BRAND_CREATOR: 'Lịch sử hợp tác trực tiếp của bạn với nhà sáng tạo',
  COHORT_PLATFORM_NICHE: 'Lịch sử hợp tác của bạn cùng nền tảng và ngành hàng',
  COHORT_PLATFORM_ONLY: 'Lịch sử hợp tác của bạn trên cùng nền tảng',
  EXPLICIT_FALLBACK: 'Tiêu chí hiện tại; chưa đủ bằng chứng lịch sử phù hợp',
}[value ?? ''] ?? 'Chưa có nguồn đánh giá');

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
  const { message, modal } = App.useApp();
  const sessionId = useSyncExternalStore(subscribeAuthSession, getAuthSessionId);
  const [serverCampaign, setServerCampaign] = useState<CampaignResponse | null>(null);
  const campaign = serverCampaign?.id === providedCampaign?.id ? serverCampaign : providedCampaign;
  const navigate = useNavigate();
  const location = useLocation();
  const [quickOpen, setQuickOpen] = useState(false);
  const permissions = getStoredUser()?.permissions ?? [];
  const canView = permissions.includes('VIEW_OWN_RECOMMENDATION');
  const canRun = permissions.includes('RUN_RECOMMENDATION') && !!campaign && !['ARCHIVED', 'COMPLETED'].includes(campaign.status);
  const canSave = permissions.includes('MANAGE_OWN_SHORTLIST');
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<string[]>(initialSelectedCreatorIds);
  const [mode, setMode] = useState<DisplayMode>('BEST_MATCH');
  const [tab, setTab] = useState('main');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [resultScope, setResultScope] = useState<string | null>(null);
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
  const [resultMode, setResultMode] = useState<DisplayMode | null>(null);
  const [viewedRun, setViewedRun] = useState<RecommendationRun | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<CreatorRecommendationItemDto | null>(null);
  const [reject, setReject] = useState<CreatorRecommendationItemDto | null>(null);

  const initialSelectionKey = JSON.stringify(initialSelectedCreatorIds);
  useEffect(() => { setSelectedCreatorIds(JSON.parse(initialSelectionKey)); }, [initialSelectionKey]);

  const campaignId = providedCampaign?.id ?? '';
  const selectedKey = JSON.stringify(initialSelectedCreatorIds);
  useEffect(() => {
    setRunning(false); setDetail(null); setPhase('idle'); setResult(null); setResultMode(null); setViewedRun(null); setError(null); setMissingFields([]); setServerCampaign(null); setStatusWarning(null); setResultScope(null); setHistoryOpen(false); setTab('main');
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
    setRunning(true); setDetail(null); setPhase('preparing'); setError(null); setMissingFields([]); setStatusWarning(null);
    try {
      if (campaign.status === 'DRAFT') {
        const confirmed = await modal.confirm({
          title: 'Chốt yêu cầu và chạy đánh giá?',
          content: 'Sau khi tiếp tục, bạn vẫn có thể thay đổi danh sách kênh, nhưng không thể sửa yêu cầu chiến dịch. Hãy kiểm tra nội dung trước khi chạy.',
          okText: 'Chốt và chạy đánh giá',
          cancelText: 'Kiểm tra yêu cầu',
          onCancel: () => {
            if (controller.signal.aborted) return;
            const target = campaignEditor(campaign.id);
            navigate(target.path, { state: target.state });
          },
        });
        if (!confirmed || controller.signal.aborted) return;
      }
      const data = await aiRecommendationService.runWhenReady(campaign.id, request, controller.signal, (next, snapshot, warning) => {
        if (controller.signal.aborted) return;
        setPhase(next); if (snapshot) { setServerCampaign(snapshot); onCampaignUpdated?.(snapshot); } if (warning) setStatusWarning(warning);
      });
      if (controller.signal.aborted) return;
      savedRequest.current = null; setResult(data); setResultMode(request.displayMode); setViewedRun(null);
      setResultScope(request.creatorIds.length ? `${request.creatorIds.length} kênh đã chọn trong yêu cầu` : 'Toàn bộ danh sách đã lưu tại lúc gửi yêu cầu');
      setTab(data.recommendations.length ? 'main' : data.provisionalRecommendations?.length ? 'reference' : data.excludedCandidates?.length ? 'excluded' : 'main');
      await reloadHistory();
    } catch (cause: any) {
      if (controller.signal.aborted) return;
      const fields = cause?.response?.data?.fieldErrors;
      const labels: Record<string, string> = { name: 'Tên chiến dịch', productService: 'Sản phẩm/dịch vụ', brief: 'Yêu cầu sáng tạo', objective: 'Mục tiêu', platforms: 'Nền tảng', startDate: 'Ngày bắt đầu', endDate: 'Ngày kết thúc', totalBudget: 'Ngân sách', creatorMode: 'Hình thức tuyển nhà sáng tạo', targetCreatorCount: 'Số nhà sáng tạo', deliverables: 'Ấn phẩm yêu cầu' };
      const missing = fields && typeof fields === 'object' ? Object.keys(fields).map(field => field === 'niches' ? 'Ngành hàng' : labels[field] || field) : [];
      setMissingFields(missing);
      setError(missing.length ? 'Chiến dịch chưa đủ thông tin. Bổ sung các trường bên dưới rồi thử lại.' : getErrorMessage(cause, 'Chưa chạy được gợi ý. Vui lòng thử lại.'));
    } finally {
      if (activeRun.current === controller) { activeRun.current = null; runningLock.current = false; setRunning(false); setPhase('idle'); }
    }
  }, [campaign, canRun, invalidSelection, sessionId, mode, selectedCreatorIds, onCampaignUpdated, reloadHistory, modal, navigate]);

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
  const reference = viewedRun ? (candidates ?? []).filter(item => item.isProvisional === true || ['LIMITED_HISTORY', 'LIMITED_STABILITY'].includes(item.recommendationTier ?? '')) : result?.provisionalRecommendations ?? [];
  const main = viewedRun ? (candidates ?? []).filter(item => !reference.includes(item)) : result?.recommendations ?? [];
  const excluded = viewedRun ? viewedRun.excludedCandidates : result?.excludedCandidates;
  const metadata = viewedRun ? viewedRun.runMetadata : result?.runMetadata;
  const displayedMode = metadata?.rankingMode ?? (viewedRun ? null : resultMode);
  const displayedOrder = displayedMode && Object.prototype.hasOwnProperty.call(displayModes, displayedMode) ? displayModes[displayedMode as DisplayMode] : null;
  if (!campaign) return <div className="workflow-page recommendation-page"><header className="rec-page-heading"><h1>Gợi ý nhà sáng tạo</h1></header>
    <div className="rec-empty-results"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chọn chiến dịch để xem gợi ý" /><Button onClick={() => navigate('/campaigns')}>Về danh sách chiến dịch</Button></div>
  </div>;
  const updateSelection = (creatorIds: string[]) => {
    setSelectedCreatorIds(creatorIds);
    const next = new URLSearchParams(location.search); next.delete('campaignId'); next.delete('creatorIds'); next.delete('candidateSource');
    navigate({ pathname: location.pathname, search: next.toString() }, { replace: true, state: {
      ...location.state, recommendationRunIntent: undefined, recommendationContext: { sessionId, campaignId: campaign.id, creatorIds },
    } });
  };
  const openShortlist = () => navigate('/creators/shortlist', { state: { shortlistContext: { sessionId, campaignId: campaign.id } } });
  const renderRunMetadata = () => (
    <details className="rec-details rec-run-metadata">
      <summary>Thông tin lượt đánh giá</summary>
      <dl className="rec-breakdown">
        <div><dt>Thời điểm đánh giá</dt><dd>{metadata?.scoringAsOf ? formatRecommendationDate(metadata.scoringAsOf) : 'Chưa được lưu'}</dd></div>
        <div><dt>Mốc bắt đầu lịch sử</dt><dd>{metadata?.historyCutoff ? formatRecommendationDate(metadata.historyCutoff) : 'Chưa được lưu'}</dd></div>
        <div><dt>Chế độ trọng số</dt><dd>{metadata?.weightingMode === 'DYNAMIC_BLENDED' ? 'Kết hợp trọng số dữ liệu và mục tiêu' : metadata?.weightingMode === 'FALLBACK_PRIOR' ? 'Trọng số theo mục tiêu chiến dịch' : 'Chưa được lưu'}</dd></div>
        <div><dt>Chế độ kết quả</dt><dd>{displayedOrder?.label ?? 'Chưa được lưu'}</dd></div>
        <div><dt>Hệ số kết hợp trọng số</dt><dd>{formatNumber(metadata?.lambdaUsed)}</dd></div>
        {viewedRun?.scoringPolicyVersion && <div><dt>Chính sách đánh giá</dt><dd>{viewedRun.scoringPolicyVersion}</dd></div>}
      </dl>
      {metadata?.effectiveWeights?.length === 4 && metadata.effectiveWeights.every(Number.isFinite) && <dl className="rec-breakdown">{metadata.effectiveWeights.map((weight, index) => <div key={index}><dt>Trọng số M{index + 1}</dt><dd>{formatNumber(weight * 100)}%</dd></div>)}</dl>}
      <h4>Thứ tự kết quả</h4><p>{displayedOrder?.description ?? 'Lượt này chưa lưu chế độ sắp xếp.'}</p>
      <p>Hai nhóm được sắp xếp riêng theo thứ tự máy chủ trả về. Mức ưu tiên trong danh sách chọn không quyết định thứ hạng đánh giá.</p>
      <p>Thông tin thuộc lượt đang xem, không lấy từ cấu hình hoặc danh sách hiện tại.</p>
    </details>
  );
  const renderCandidate = (item: CreatorRecommendationItemDto, detailed = false, position?: number) => {
    const categories = [...new Set([item.niche, item.category].flatMap(value => value?.split(/[,;]/).map(text => text.trim()).filter(Boolean) ?? []))];
    const isSaved = item.inShortlist === true || ['SAVED', 'READY_TO_CONTACT', 'CONTACTED'].includes(item.shortlistStatus ?? '');
    const provisional = item.isProvisional === true || reference.some(candidate => candidate.creatorId === item.creatorId);
    const scoreReady = item.isScoreReady === true || (item.isScoreReady == null && !provisional);
    const breakdown = item.scoreBreakdown;
    const warnings = [...new Set(item.reasoning?.evidenceWarnings?.filter(Boolean) ?? [])];
    const scoreRows = [
      ['M1 · Lịch sử hợp tác', breakdown?.m1Availability === 'AVAILABLE' ? formatScore(breakdown.m1Score) : breakdown?.m1Availability === 'UNAVAILABLE' ? 'Chưa đủ bằng chứng lịch sử' : 'Chưa có trạng thái bằng chứng'],
      ['M2 · Hiệu quả công khai', formatScore(breakdown?.m2Score)],
      ['M3 · Phù hợp nội dung', formatScore(breakdown?.m3Score)],
      ['M4 · Phù hợp với thương hiệu', formatScore(breakdown?.m4EffectiveScore ?? breakdown?.m4Score)],
    ];
    return (
      <article className={detailed ? 'rec-creator-card rec-card-detail' : 'rec-creator-card rec-card-compact'} key={item.creatorId}>
        <header className="rec-identity">
          <CreatorAvatar size={44} src={item.avatarUrl || undefined} name={item.displayName || item.userName} />
          <div className="rec-author">
            <h3><button type="button" onClick={() => detailed ? navigate(campaignPath('/creators/' + item.creatorId, campaign.id)) : setDetail(item)}>{item.displayName || 'Kênh chưa có tên'}</button></h3>
            <p>{item.userName ? '@' + item.userName.replace(/^@+/, '') : 'Chưa có tên tài khoản'}</p>
          </div>
          {!detailed && position != null && <span className="rec-card-position" aria-label={`Vị trí ${position} trong nhóm`}>{String(position).padStart(2, '0')}</span>}
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
          {!detailed && <Tag>Độ tin cậy: {confidenceLabel(breakdown?.confidenceTier ?? item.reasoning?.confidenceTier)}</Tag>}
          {detailed && typeof item.claimed === 'boolean' && <Tag>{item.claimed ? 'Đã liên kết hồ sơ nhà sáng tạo' : 'Chưa liên kết hồ sơ nhà sáng tạo'}</Tag>}
          {detailed && <Tag>{tierLabel(item)}</Tag>}
        </div>
        {categories.length > 0 && <div className="rec-niches">{(detailed ? categories : categories.slice(0, 3)).map(category => <span key={category}>{category}</span>)}</div>}
        <div className={`rec-score${!scoreReady || typeof item.finalScore !== 'number' || !Number.isFinite(item.finalScore) ? ' rec-score-unavailable' : ''}`}>
          <span>{provisional ? 'Điểm tham khảo' : 'Điểm phù hợp'}</span>
          <strong>{scoreReady ? formatScore(item.finalScore) : 'Chưa đủ dữ liệu'}</strong>
        </div>
        {detailed && <div className="rec-price"><span>Độ tin cậy dữ liệu</span><strong>{confidenceLabel(breakdown?.confidenceTier ?? item.reasoning?.confidenceTier)}</strong></div>}
        <dl className="rec-metrics">
          <div><dt>Người theo dõi</dt><dd>{formatNumber(item.followers)}</dd></div>
          <div><dt>Tỷ lệ tương tác</dt><dd>{formatEngagement(item.engagementRate)}</dd></div>
          {detailed && <div><dt>Lượt xem trung bình</dt><dd>{formatNumber(item.avgViews)}</dd></div>}
          {detailed && <div><dt>Lượt thích trung bình</dt><dd>{formatNumber(item.avgLikes)}</dd></div>}
        </dl>
        <div className="rec-price"><span>Trạng thái báo giá</span><strong>{formatPrice(item.priceStatus)}</strong></div>
        {!detailed && item.reasoning?.summary && <details className="rec-card-summary"><summary>Tóm tắt đánh giá</summary><p>{item.reasoning.summary}</p></details>}
        {detailed && <div className="rec-reason-summary"><h4>Vì sao được gợi ý?</h4><p>{item.reasoning?.summary || 'Chưa có phần giải thích cho kết quả này.'}</p></div>}
        {detailed && warnings.length > 0 && <aside className="rec-evidence"><h4>Giới hạn dữ liệu</h4><ul>{warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></aside>}
        {detailed && <details className="rec-details" open>
          <summary>Giải thích điểm đánh giá</summary>
          {item.reasoning?.reasons?.length ? <ul>{item.reasoning.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul> : <p>Chưa có lý do chi tiết.</p>}
          <h4>Điểm thành phần</h4>
          <dl className="rec-breakdown">{scoreRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <p>{tierLabel(item)}. Điểm phù hợp và mức hỗ trợ dữ liệu không phải xác suất thành công của chiến dịch.</p>
          <h4>Bằng chứng lịch sử M1</h4>
          <dl className="rec-breakdown">
            <div><dt>Hợp tác đủ điều kiện</dt><dd>{formatNumber(breakdown?.eligibleEvaluatedCollaborations)}</dd></div>
            <div><dt>Thương hiệu đóng góp</dt><dd>{formatNumber(breakdown?.distinctBrandCount)}</dd></div>
            {breakdown?.maxBrandShare != null && <div><dt>Tỷ trọng lớn nhất từ một thương hiệu</dt><dd>{formatNumber(breakdown.maxBrandShare)}%</dd></div>}
            {([['Điểm đánh giá hợp tác', breakdown?.rScore], ['Điểm đúng hạn', breakdown?.tScore], ['Điểm thực hiện KPI', breakdown?.kScore]] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{formatScore(value)}</dd></div>)}
          </dl>
          <h4>Nguồn đánh giá M4</h4><p>{m4SourceLabel(breakdown?.m4Source)}</p>
          <dl className="rec-breakdown">
            <div><dt>Điểm từ lịch sử</dt><dd>{formatScore(breakdown?.m4LearnedScore)}</dd></div>
            <div><dt>Điểm từ tiêu chí hiện tại</dt><dd>{formatScore(breakdown?.m4ExplicitScore)}</dd></div>
            <div><dt>Điểm được sử dụng</dt><dd>{formatScore(breakdown?.m4EffectiveScore ?? breakdown?.m4Score)}</dd></div>
            <div><dt>Mức hỗ trợ dữ liệu</dt><dd>{confidenceLabel(breakdown?.confidenceTier ?? item.reasoning?.confidenceTier)}</dd></div>
            <div><dt>Điểm hỗ trợ dữ liệu</dt><dd>{formatScore(breakdown?.confidenceScore ?? item.reasoning?.confidenceScore)}</dd></div>
          </dl>
          {item.reasoning?.explanationAvailable === false && <p>Phần giải thích đầy đủ chưa có sẵn.</p>}
        </details>}
        {detailed && renderRunMetadata()}
        {detailed ? <footer className="rec-card-footer">
          <div className="rec-card-actions"><Button onClick={() => navigate(campaignPath('/creators/' + item.creatorId, campaign.id))}>Xem hồ sơ</Button><Button type="primary" disabled={isSaved || !canSave || !!busy} loading={busy === item.creatorId} onClick={() => void save(item)}>{isSaved ? 'Đã trong danh sách chọn' : 'Lưu vào danh sách'}</Button></div>
          <div className="rec-feedback"><span>Đánh giá kết quả</span><Space size={4}><Button size="small" type="text" icon={<LikeOutlined />} disabled={!permissions.includes('RUN_RECOMMENDATION') || !!busy} onClick={() => void accept(item)}>Phù hợp</Button><Button size="small" type="text" icon={<DislikeOutlined />} disabled={!permissions.includes('RUN_RECOMMENDATION') || !!busy} onClick={() => setReject(item)}>Không phù hợp</Button></Space></div>
        </footer> : <footer className="rec-compact-footer">
          <span>{isSaved ? 'Đã trong danh sách chọn' : 'Chưa lưu vào danh sách'}{warnings.length > 0 ? ' · Có lưu ý dữ liệu' : ''}</span>
          <Button onClick={() => setDetail(item)}>Xem phân tích</Button>
        </footer>}
      </article>
    );

  };


  return (
    <div className="workflow-page recommendation-page">
      <header className="rec-page-heading">
        <div><h1>Gợi ý nhà sáng tạo</h1></div>
        <Button disabled={running} onClick={openShortlist}>Danh sách đã chọn</Button>
      </header>
      <section className="rec-campaign-context"><span>Chiến dịch hiện tại</span><h2>{campaign.name}</h2></section>
      <section className="workflow-panel rec-run-panel" aria-label="Thiết lập gợi ý">
        <div className="rec-run-toolbar">
          <div className="rec-run-scope">
              <Button disabled={running} aria-expanded={quickOpen} onClick={() => setQuickOpen(value => !value)}>{selectedCreatorIds.length ? selectedCreatorIds.length + ' kênh đã chọn' : 'Toàn bộ danh sách'} <DownOutlined /></Button>
              {selectedCreatorIds.length > 0 && <Button type="text" disabled={running} onClick={() => {
                updateSelection([]);
              }}>Dùng tất cả</Button>}
          </div>
          <div className="rec-run-actions">
            <Tooltip title="Áp dụng cho lượt chạy mới, không sắp lại kết quả đang xem."><div className="rec-mode-field"><Select
              disabled={running} aria-label="Cách sắp xếp" value={mode} onChange={setMode}
              options={Object.entries(displayModes).map(([value, option]) => ({ value, label: option.label }))}
            /></div></Tooltip>
            <Button className="rec-run-button" type="primary" disabled={!canRun || invalidSelection || running} loading={running} onClick={() => void run()}>
              {running ? phase === 'preparing' ? 'Đang chuẩn bị dữ liệu' : 'Đang chạy gợi ý' : error ? 'Thử lại yêu cầu' : 'Chạy gợi ý mới'}
            </Button>
          </div>
        </div>
      {quickOpen && (
        <ShortlistQuickPicker
          inline
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

        {invalidSelection && <Alert type="error" title="Danh sách kênh trên liên kết không hợp lệ. Vui lòng chọn lại." />}
        {running && <Alert type="info" showIcon title={phase === 'preparing' ? 'Đang chuẩn bị dữ liệu' : 'Đang chạy gợi ý'} description="Giữ nguyên chiến dịch và các kênh đã chọn. Hệ thống sẽ tự tiếp tục một lần khi dữ liệu sẵn sàng." />}
        {campaign.status === 'DRAFT' && !running && !result && <Alert type="info" title="Bạn có thể chỉnh sửa yêu cầu trước khi chạy đánh giá" description="Sau khi chốt, yêu cầu sẽ được khóa; bạn vẫn có thể thay đổi danh sách kênh." action={<Button onClick={() => { const target = campaignEditor(campaign.id); navigate(target.path, { state: target.state }); }}>Kiểm tra yêu cầu</Button>} />}
        {!canRun && <p className="ad-note">{['COMPLETED', 'ARCHIVED'].includes(campaign.status) ? 'Chiến dịch đã kết thúc. Bạn có thể xem lại các lượt đánh giá trong lịch sử.' : 'Bạn chưa có quyền chạy đánh giá.'}</p>}
      </section>

      {statusWarning && <Alert type="warning" title={statusWarning} />}
      {error && <Alert type="error" title={error} description={missingFields.length ? <><ul>{missingFields.map(field => <li key={field}>{field}</li>)}</ul>{campaign.status === 'DRAFT' ? <Button onClick={() => { const target = campaignEditor(campaign.id); navigate(target.path, { state: target.state }); }}>Bổ sung thông tin</Button> : <Button onClick={() => navigate('/campaigns/create')}>Tạo chiến dịch mới</Button>}</> : undefined} />}

      <section className="rec-results" aria-label="Kết quả đánh giá">
        <header className="rec-results-heading">
          <div><h2>{viewedRun ? 'Kết quả đã lưu' : 'Kết quả đánh giá'}</h2>
            <p>{viewedRun ? `Đã lưu lúc ${formatRecommendationDate(viewedRun.createdAt)}` : resultScope ?? 'Chọn một lượt trong lịch sử hoặc chủ động chạy mới.'}</p>
          </div>
          <div className="rec-result-tools">{candidates != null && <Tooltip title={displayedOrder?.description || 'Máy chủ chưa lưu chế độ của lượt này.'}><Tag>Thứ tự: {displayedOrder?.label ?? 'Chưa có thông tin'}</Tag></Tooltip>}<Button disabled={running} onClick={() => setHistoryOpen(true)}>Lịch sử đánh giá</Button></div>
        </header>
        {running ? <Skeleton active /> : candidates == null ? <div className="rec-empty-results"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có kết quả đánh giá" /><Button onClick={() => setHistoryOpen(true)}>Xem lịch sử đã lưu</Button></div> : <Tabs activeKey={tab} onChange={setTab} items={[
          { key: 'main', label: `Đề xuất chính · ${main.length}`, children: <>
            {main.length ? <div className="rec-cards-grid">{main.map((item, index) => renderCandidate(item, false, index + 1))}</div> : <Empty description={candidates == null ? 'Chưa có kết quả. Mở lịch sử hoặc chủ động chạy mới.' : 'Lượt này không có đề xuất chính'} />}
          </> },
          { key: 'reference', label: `Tham khảo · ${reference.length}`, children: <>
            <p className="rec-pool-note">Đánh giá tham khảo; chưa thuộc nhóm xếp hạng chính.</p>
            {reference.length ? <div className="rec-cards-grid">{reference.map((item, index) => renderCandidate(item, false, index + 1))}</div> : <Empty description="Không có kênh tham khảo trong dữ liệu lượt này" />}
          </> },
          { key: 'excluded', label: `Không đủ điều kiện${excluded ? ' · ' + excluded.length : viewedRun && metadata?.excludedCount != null ? ' · ' + metadata.excludedCount : ''}`, children: <>
            <p>Chỉ gồm những kênh hệ thống ghi nhận lý do loại. Kênh không xuất hiện do giới hạn kết quả hoặc gộp hồ sơ không mặc nhiên thuộc nhóm này.</p>
            {excluded ? excluded.length ? <div className="rec-cards-grid">{excluded.map(item => <article className="rec-creator-card rec-card-compact" key={item.creatorId}>
              <header className="rec-identity"><CreatorAvatar size={44} src={item.avatarUrl} name={item.displayName || item.userName} /><div className="rec-author"><h3>{item.displayName || item.userName || 'Kênh chưa có tên'}</h3><p>{item.userName ? '@' + item.userName.replace(/^@+/, '') : 'Chưa có tên tài khoản'}</p></div></header>
              {item.platform && <div className="rec-statuses"><Tag>{item.platform}</Tag></div>}
              <div className="rec-reason-summary"><h4>Lý do không đủ điều kiện</h4><p>{item.message || 'Máy chủ chưa cung cấp mô tả lý do.'}</p></div>
              {!!item.reasons?.length && <details className="rec-details"><summary>Xem lý do đã ghi nhận</summary><ul>{item.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul></details>}
            </article>)}</div> : <Empty description="Không có kênh bị loại được ghi nhận" /> : <Empty description={viewedRun ? 'Lịch sử không cung cấp danh sách và lý do loại. Không thể dựng lại từ dữ liệu hiện tại.' : 'Chưa có dữ liệu loại từ lượt đánh giá'} />}
          </> },
        ]} />}
      </section>

      <Drawer title="Lịch sử đánh giá" open={historyOpen} onClose={() => setHistoryOpen(false)} size="min(720px, 100vw)" rootClassName="rec-detail-drawer">
        {!canView ? <Alert title="Bạn chưa có quyền xem lịch sử gợi ý." /> : history.status === 'loading' ? <Skeleton active /> : history.status === 'error' ? <Alert type="error" title="Không thể tải lịch sử" action={<Button onClick={() => void history.reload()}>Thử lại</Button>} /> : !history.data?.length ? <Empty description="Chưa có lượt đánh giá đã lưu" /> : <div className="workflow-table rec-history-table"><table>
          <thead><tr><th>Thời gian</th><th>Kết quả đã lưu</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>{history.data.map(run => <tr key={run.id}>
            <td>{formatRecommendationDate(run.createdAt)}</td><td>{formatNumber(run.candidatesCount)}</td>
            <td>{run.status === 'COMPLETED' ? 'Đã hoàn tất' : run.status === 'FAILED' ? 'Chưa hoàn tất' : 'Đang xử lý'}</td>
            <td><Button onClick={() => {
              setDetail(null); setViewedRun(run); setResult(null); setHistoryOpen(false);
              const saved = run.scoringSnapshot ?? [];
              setTab(saved.some(item => item.isProvisional !== true && !['LIMITED_HISTORY', 'LIMITED_STABILITY'].includes(item.recommendationTier ?? '')) ? 'main' : saved.length ? 'reference' : 'main');
            }}>Xem kết quả</Button></td>
          </tr>)}</tbody>
        </table></div>}
      </Drawer>
      {!running && !error && !invalidSelection && (
        <section className="rec-next-action" aria-label="Tiếp tục sau khi xem kết quả">
          <div>
            <h2>{candidates == null ? 'Chưa có kết quả đánh giá' : `${candidates.length} kênh trong kết quả`}</h2>
          </div>
          <div className="rec-next-buttons">
            <Button onClick={() => navigate('/campaigns/detail', { state: { campaignId: campaign.id } })}>Về chiến dịch</Button>
            <Button type="primary" disabled={!permissions.includes('MANAGE_OWN_SHORTLIST')} onClick={() => candidates != null && !candidates.length ? navigate('/creators', { state: { campaignId: campaign.id } }) : openShortlist()}>
              {candidates == null ? 'Danh sách đã chọn' : candidates.length ? 'Chọn kênh để liên hệ' : 'Khám phá kênh'}
            </Button>
          </div>
        </section>
      )}

      <Drawer title="Chi tiết kết quả gợi ý" rootClassName="rec-detail-drawer" size="min(640px, 100vw)" open={!!detail} onClose={() => setDetail(null)} destroyOnHidden>
        {detail && renderCandidate(detail, true)}
      </Drawer>


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
