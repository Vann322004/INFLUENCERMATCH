import ShortlistQuickPicker from './ShortlistQuickPicker';
import CampaignImage from '../common/CampaignImage';
import { getErrorMessage } from '../../services/apiClient';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, App, Button, Checkbox, Drawer, Dropdown, Empty, Form, Input, Modal, Select, Skeleton, Space, Tabs, Tag, Tooltip } from 'antd';
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
import { campaignService } from '../../services/api/campaignService';
import { creatorService } from '../../services/api/creatorService';
import { getStoredUser, getAuthSessionId, subscribeAuthSession } from '../../services/authSession';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import type { CampaignResponse } from '../../types/api/campaign.types';
import type { CandidateSource, CreatorRecommendationItemDto, DisplayMode, PriceStatus, RecommendationResponseDto, RecommendationRun } from '../../types/api/aiRecommendation.types';
import { campaignPath, campaignEditor } from '../../services/campaignContext';
import { assessmentItems, contactContext } from '../../services/contactContext';
import { completedRuns, orderedRuns } from '../../services/recommendationHistory';
import { subscriptionService } from '../../services/api/subscriptionService';
import { shortlistService } from '../../services/api/shortlistService';
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

function formatExcludedReason(reason: string): string {
  const upper = reason.toUpperCase();
  if (upper.includes('EXTREME_OUTLIER_ER') || upper.includes('ENGAGEMENTRATE EXCEEDS')) {
    return 'Tỷ lệ tương tác (ER) vượt ngưỡng bất thường, hệ thống tạm loại để tránh sai lệch xếp hạng.';
  }
  if (upper.includes('EXTREME_OUTLIER_VR') || upper.includes('VIEW')) {
    return 'Lượt xem trung bình có dấu hiệu bất thường so với ngưỡng chuẩn.';
  }
  if (upper.includes('STALE') || upper.includes('FRESHNESS') || upper.includes('OUTDATED')) {
    return 'Dữ liệu kênh đã cũ, cần làm mới trước khi AI đánh giá.';
  }
  if (upper.includes('EMBEDDING')) {
    return 'Hồ sơ kênh chưa có dữ liệu phân tích ngữ nghĩa (AI Embedding).';
  }
  if (upper.includes('POST') && (upper.includes('INSUFFICIENT') || upper.includes('MIN') || upper.includes('NO_POST'))) {
    return 'Số lượng bài đăng gần đây chưa đủ để AI đánh giá độ ổn định.';
  }
  if (upper.includes('PLATFORM')) {
    return 'Nền tảng hoạt động của kênh chưa khớp với chiến dịch.';
  }
  if (upper.includes('NICHE') || upper.includes('CATEGORY')) {
    return 'Lĩnh vực nội dung chưa khớp với ngành hàng của chiến dịch.';
  }
  if (upper.includes('FOLLOWER')) {
    return 'Lượng người theo dõi nằm ngoài phạm vi mục tiêu chiến dịch.';
  }
  if (upper.includes('DATA_QUALITY_ERROR')) {
    return 'Chỉ số dữ liệu của kênh chưa đạt chuẩn kiểm định chất lượng.';
  }
  return reason;
}

function renderExcludedReasons(reasons: string[]) {
  const formatted = [...new Set(reasons.map(formatExcludedReason))];
  return <ul>{formatted.map((reason, index) => <li key={index}>{reason}</li>)}</ul>;
}
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
  const canRun = permissions.includes('RUN_RECOMMENDATION') && !!campaign && !['ARCHIVED', 'COMPLETED', 'CLOSED'].includes(campaign.status);
  const canSave = permissions.includes('MANAGE_OWN_SHORTLIST');
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<string[]>(initialSelectedCreatorIds);
  const [mode, setMode] = useState<DisplayMode>('BEST_MATCH');
  const [tab, setTab] = useState('main');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [resultScope, setResultScope] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const runningLock = useRef(false);
  const [retryingEmbedding, setRetryingEmbedding] = useState(false);
  const retryEmbeddingLock = useRef(false);
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
  const [contactSelection, setContactSelection] = useState<string[]>([]);
  useEffect(() => { setContactSelection([]); }, [result, viewedRun, sessionId, providedCampaign?.id]);
  const [busy, setBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<CreatorRecommendationItemDto | null>(null);
  const [reject, setReject] = useState<CreatorRecommendationItemDto | null>(null);
  const [feedbackMarks, setFeedbackMarks] = useState<Record<string, 'ACCEPT' | 'REJECT'>>({});

  const initialSelectionKey = JSON.stringify(initialSelectedCreatorIds);
  useEffect(() => { setSelectedCreatorIds(JSON.parse(initialSelectionKey)); }, [initialSelectionKey]);

  const campaignId = providedCampaign?.id ?? '';
  useEffect(() => {
    setRunning(false); setDetail(null); setPhase('idle'); setResult(null); setResultMode(null); setViewedRun(null); setError(null); setMissingFields([]); setServerCampaign(null); setStatusWarning(null); setResultScope(null); setHistoryOpen(false); setTab('main'); setFeedbackMarks({});
    return () => { activeRun.current?.abort(); activeRun.current = null; runningLock.current = false; savedRequest.current = null; };
  }, [campaignId, sessionId]);
  const historyQuery = useCallback(() => aiRecommendationService.getRecommendationRuns(campaignId), [campaignId]);
  const history = useAsyncResource(historyQuery, canView && !!campaign);
  const membershipQuery = useCallback(() => shortlistService.all(campaignId), [campaignId]);
  const membership = useAsyncResource(membershipQuery, canSave && !!campaignId);
  const activeCreatorIds = membership.data?.filter(item => item.status !== 'REMOVED').map(item => item.creatorId) ?? [];
  const quotaQuery = useCallback(() => subscriptionService.getBrandSubscriptions(providedCampaign?.brandId ?? '', true), [providedCampaign?.brandId]);
  const quota = useAsyncResource(quotaQuery, !!providedCampaign?.brandId && permissions.includes('MANAGE_OWN_SUBSCRIPTION'));
  const reloadQuota = quota.reload;
  const currentSubscription = quota.data?.find(item => item.status === 'ACTIVE');
  const quotaDescription = currentSubscription ? `Còn ${Math.max(0, currentSubscription.plan.recommendationQuota - currentSubscription.usedRecommendationQuota)} lượt đến ${new Date(currentSubscription.expirationDate).toLocaleDateString('vi-VN')}.` : '';
  const openedSavedRun = useRef<string | null>(null);
  const requestedSavedRunId = location.state?.recommendationContext?.sessionId === sessionId
    && location.state?.recommendationContext?.campaignId === campaignId
    ? location.state?.recommendationViewRunId : null;
  useEffect(() => {
    if (!history.data || running || result || autoRunToken) return;
    const saved = typeof requestedSavedRunId === 'string' ? history.data.find(run => run.id === requestedSavedRunId && run.status === 'COMPLETED') : completedRuns(history.data, campaignId)[0];
    if (!saved) return;
    const key = sessionId + ':' + campaignId + ':' + saved.id;
    if (openedSavedRun.current === key) return;
    openedSavedRun.current = key;
    setViewedRun(saved);
    setTab(saved.scoringSnapshot?.some(item => item.isProvisional !== true && !['LIMITED_HISTORY', 'LIMITED_STABILITY'].includes(item.recommendationTier ?? '')) ? 'main' : saved.scoringSnapshot?.length ? 'reference' : 'main');
  }, [requestedSavedRunId, history.data, running, result, sessionId, campaignId, autoRunToken]);
  const reloadHistory = history.reload;

  const canRetryEmbedding = permissions.includes('UPDATE_CAMPAIGN');
  const handleRetryEmbedding = useCallback(async () => {
    if (!campaign || !canRetryEmbedding || running || retryingEmbedding || retryEmbeddingLock.current) return;
    retryEmbeddingLock.current = true;
    setRetryingEmbedding(true);
    try {
      const updated = await campaignService.retryEmbedding(campaign.id);
      setServerCampaign(updated);
      onCampaignUpdated?.(updated);
      setError(null);
      message.success('Đã gửi yêu cầu chuẩn bị lại dữ liệu ngữ nghĩa (M3). Bạn có thể chạy Đánh giá AI.');
    } catch (cause) {
      message.error(getErrorMessage(cause, 'Không thể thử lại chuẩn bị dữ liệu. Vui lòng thử lại.'));
    } finally {
      retryEmbeddingLock.current = false;
      setRetryingEmbedding(false);
    }
  }, [campaign, canRetryEmbedding, running, retryingEmbedding, onCampaignUpdated, message]);

  const run = useCallback(async () => {
    if (!campaign || !canRun || invalidSelection || runningLock.current) return;
    runningLock.current = true;
    const controller = new AbortController(); activeRun.current = controller;
    const fingerprint = JSON.stringify([sessionId, campaign.id, mode, selectedCreatorIds]);
    if (savedRequest.current?.fingerprint !== fingerprint) savedRequest.current = { fingerprint, key: crypto.randomUUID() };
    const request = { limit: 50, displayMode: mode, creatorIds: [...selectedCreatorIds], idempotencyKey: savedRequest.current.key };
    setRunning(true); setDetail(null); setPhase('preparing'); setError(null); setMissingFields([]); setStatusWarning(null);
    try {
      {
        const confirmed = await modal.confirm({
          title: 'Chạy một lượt đánh giá mới?',
          content: <><p>{selectedCreatorIds.length ? `${selectedCreatorIds.length} kênh đã chọn` : 'Toàn bộ kênh đang lưu trong Shortlist'}. Lượt mới sử dụng 1 lượt AI trong hạn mức gói. {quotaDescription}</p><p>Điểm và thứ hạng thuộc riêng tập kênh của lượt này.</p>{campaign.status === 'DRAFT' && <p>Yêu cầu chiến dịch sẽ được chốt và không thể chỉnh sửa sau bước chuẩn bị, kể cả khi AI chưa hoàn tất.</p>}</>,
          okText: 'Đánh giá AI', cancelText: 'Để sau',
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
      void reloadQuota();
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
  }, [campaign, canRun, invalidSelection, sessionId, mode, selectedCreatorIds, onCampaignUpdated, reloadHistory, modal, quotaDescription, reloadQuota]);

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
      void membership.reload();
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
      setFeedbackMarks(prev => ({ ...prev, [reject.creatorId]: 'REJECT' }));
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
      setFeedbackMarks(prev => ({ ...prev, [item.creatorId]: 'ACCEPT' }));
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
  const orderedHistory = orderedRuns(history.data ?? [], campaignId);
  const latestAttempt = orderedHistory[0];
  const newerIncompleteAttempt = viewedRun && latestAttempt && latestAttempt.status !== 'COMPLETED' && orderedHistory.findIndex(run => run.id === viewedRun.id) > 0;
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
        {metadata?.m1PolicyVersion && <div><dt>Chính sách M1</dt><dd>{metadata.m1PolicyVersion}{metadata.m1Weights?.length === 3 ? ` · R/T/K ${metadata.m1Weights.map(weight => `${Math.round(weight * 100)}%`).join('/')}` : ''}</dd></div>}
        {metadata?.evidencePolicyVersion && <div><dt>Schema bằng chứng</dt><dd>{metadata.evidencePolicyVersion}</dd></div>}
        {metadata?.historySelectionPolicyVersion && <div><dt>Chính sách chọn lịch sử</dt><dd>{metadata.historySelectionPolicyVersion}</dd></div>}
        {metadata?.m4PolicyVersion && <div><dt>Chính sách M4</dt><dd>{metadata.m4PolicyVersion}</dd></div>}
        {metadata?.m4HistoryReadStatus && <div><dt>Đọc lịch sử M4</dt><dd>{metadata.m4HistoryReadStatus === 'AVAILABLE' ? 'Có lịch sử đánh giá' : metadata.m4HistoryReadStatus === 'EMPTY' ? metadata.m4HistorySelectionPolicyVersion ? 'Chưa có đánh giá trong phạm vi lịch sử' : 'Chưa có lịch sử đánh giá' : 'Tạm lỗi · dùng fallback theo tiêu chí hiện tại'}</dd></div>}
        <div><dt>Chế độ trọng số</dt><dd>{metadata?.weightingMode === 'DYNAMIC_BLENDED' ? 'Kết hợp trọng số dữ liệu và mục tiêu' : metadata?.weightingMode === 'FALLBACK_PRIOR' ? 'Trọng số theo mục tiêu chiến dịch' : 'Chưa được lưu'}</dd></div>
        <div><dt>Chế độ kết quả</dt><dd>{displayedOrder?.label ?? 'Chưa được lưu'}</dd></div>
        <div><dt>Hệ số kết hợp trọng số</dt><dd>{formatNumber(metadata?.lambdaUsed)}</dd></div>
        {viewedRun?.scoringPolicyVersion && <div><dt>Chính sách đánh giá</dt><dd>{viewedRun.scoringPolicyVersion}</dd></div>}
      </dl>
      {metadata?.effectiveWeights?.length === 4 && metadata.effectiveWeights.every(Number.isFinite) && <dl className="rec-breakdown">{metadata.effectiveWeights.map((weight, index) => <div key={index}><dt>Trọng số M{index + 1}</dt><dd>{formatNumber(weight * 100)}%</dd></div>)}</dl>}
      {metadata?.m4HistoryReadStatus === 'READ_FAILED' && <Alert type="warning" title="Không đọc được lịch sử đánh giá M4. Lượt này dùng fallback theo tiêu chí hiện tại; kết quả không được hiểu là Brand chưa có lịch sử." />}
      <h4>Thứ tự kết quả</h4><p>{displayedOrder?.description ?? 'Lượt này chưa lưu chế độ sắp xếp.'}</p>
      <p>Hai nhóm được sắp xếp riêng theo thứ tự máy chủ trả về. Mức ưu tiên trong danh sách chọn không quyết định thứ hạng đánh giá.</p>
      <p>Thông tin thuộc lượt đang xem, không lấy từ cấu hình hoặc danh sách hiện tại.</p>
    </details>
  );
  const renderDetailActions = (item: CreatorRecommendationItemDto) => {
    const isSaved = membership.status === 'success' ? activeCreatorIds.includes(item.creatorId) : item.inShortlist === true || ['SAVED', 'READY_TO_CONTACT', 'CONTACTED'].includes(item.shortlistStatus ?? '');
    const feedback = feedbackMarks[item.creatorId];
    return <footer className="rec-card-footer">
          <div className="rec-card-actions"><Button onClick={() => navigate(campaignPath('/creators/' + item.creatorId, campaign.id))}>Xem hồ sơ</Button><Button type="primary" disabled={isSaved || !canSave || !!busy} loading={busy === item.creatorId} onClick={() => void save(item)}>{isSaved ? 'Đã trong danh sách chọn' : 'Lưu vào danh sách'}</Button></div>
          <div className="rec-feedback"><span>Đánh giá kết quả</span><Space size={6}>
            <Button size="small" type={feedback === 'ACCEPT' ? 'default' : 'text'} icon={<LikeOutlined />}
              style={feedback === 'ACCEPT' ? { color: '#059669', borderColor: '#A7F3D0', background: '#ECFDF5', fontWeight: 600 } : undefined}
              disabled={!permissions.includes('RUN_RECOMMENDATION') || !!busy || feedback === 'ACCEPT'}
              onClick={() => void accept(item)}>{feedback === 'ACCEPT' ? 'Đã chọn Phù hợp' : 'Phù hợp'}</Button>
            <Button size="small" type={feedback === 'REJECT' ? 'default' : 'text'} icon={<DislikeOutlined />}
              style={feedback === 'REJECT' ? { color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2', fontWeight: 600 } : undefined}
              disabled={!permissions.includes('RUN_RECOMMENDATION') || !!busy || feedback === 'REJECT'}
              onClick={() => setReject(item)}>{feedback === 'REJECT' ? 'Đã chọn Không phù hợp' : 'Không phù hợp'}</Button>
          </Space></div>
        </footer>;
  };
  const renderCandidate = (item: CreatorRecommendationItemDto, detailed = false, position?: number) => {
    const categories = [...new Set([item.niche, item.category].flatMap(value => value?.split(/[,;]/).map(text => text.trim()).filter(Boolean) ?? []))];
    const isSaved = membership.status === 'success' ? activeCreatorIds.includes(item.creatorId) : item.inShortlist === true || ['SAVED', 'READY_TO_CONTACT', 'CONTACTED'].includes(item.shortlistStatus ?? '');
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
    if (detailed) {
      return (
        <article className="rec-creator-card rec-card-detail rec-modal-two-col" key={item.creatorId}>
          <div className="rec-modal-col-left">
            <header className="rec-identity">
              <CreatorAvatar size={48} src={item.avatarUrl || undefined} name={item.displayName || item.userName} />
              <div className="rec-author">
                <h3><button type="button" onClick={() => navigate(campaignPath('/creators/' + item.creatorId, campaign.id))}>{item.displayName || 'Kênh chưa có tên'}</button></h3>
                <p>{item.userName ? '@' + item.userName.replace(/^@+/, '') : 'Chưa có tên tài khoản'}</p>
              </div>
              <Dropdown trigger={['click']} menu={{
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
              }}><Button type="text" icon={<MoreOutlined />} aria-label={'Thao tác với ' + item.displayName} /></Dropdown>
            </header>
            <div className="rec-statuses">
              {item.platform && <Tag>{item.platform}</Tag>}
              {item.creatorType && <Tag>{item.creatorType}</Tag>}
            </div>
            <section className="rec-conclusion">
              <div className={`rec-score${!scoreReady || typeof item.finalScore !== 'number' || !Number.isFinite(item.finalScore) ? ' rec-score-unavailable' : ''}`}>
                <span>{provisional ? 'Điểm tham khảo' : 'Điểm phù hợp'}</span>
                <strong>{scoreReady ? formatScore(item.finalScore) : 'Chưa công bố điểm chính thức'}</strong>
              </div>
              <div className="rec-price"><span>Độ tin cậy dữ liệu</span><strong>{confidenceLabel(breakdown?.confidenceTier ?? item.reasoning?.confidenceTier)}</strong></div>
              <p className="rec-conclusion-tier">{tierLabel(item)}</p>
            </section>
            <div className="rec-reason-summary"><h4>{provisional ? 'Nhận xét về kênh' : 'Vì sao được gợi ý?'}</h4><p>{item.reasoning?.summary || 'Chưa có phần giải thích cho kết quả này.'}</p>
              {!!item.reasoning?.reasons?.length && <details className="rec-details"><summary>Các lý do đã ghi nhận</summary><ul>{item.reasoning.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul></details>}
            </div>
            {warnings.length > 0 && <aside className="rec-evidence"><h4>Giới hạn dữ liệu</h4><ul>{warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></aside>}
            <dl className="rec-metrics">
              <div><dt>Người theo dõi</dt><dd>{formatNumber(item.followers)}</dd></div>
              <div><dt>Tỷ lệ tương tác</dt><dd>{formatEngagement(item.engagementRate)}</dd></div>
              <div><dt>Lượt xem trung bình</dt><dd>{formatNumber(item.avgViews)}</dd></div>
              <div><dt>Lượt thích trung bình</dt><dd>{formatNumber(item.avgLikes)}</dd></div>
            </dl>
            <div className="rec-price"><span>Trạng thái báo giá</span><strong>{formatPrice(item.priceStatus)}</strong></div>
          </div>
          <div className="rec-modal-col-right">
            <section className="rec-modal-card">
              <h4 className="rec-modal-card-title">Điểm thành phần M1–M4</h4>
              <div className="rec-score-bars">
                {[
                  {
                    label: 'M1 · Lịch sử hợp tác',
                    score: breakdown?.m1Availability === 'AVAILABLE' ? breakdown.m1Score : null,
                    fallback: breakdown?.m1Availability === 'UNAVAILABLE' ? 'Chưa đủ lịch sử' : 'Chưa có dữ liệu',
                    color: '#7C3AED',
                  },
                  {
                    label: 'M2 · Hiệu quả công khai',
                    score: breakdown?.m2Score ?? null,
                    fallback: 'Chưa có điểm',
                    color: '#059669',
                  },
                  {
                    label: 'M3 · Phù hợp nội dung',
                    score: breakdown?.m3Score ?? null,
                    fallback: 'Chưa có điểm',
                    color: '#0284C7',
                  },
                  {
                    label: 'M4 · Phù hợp với thương hiệu',
                    score: breakdown?.m4EffectiveScore ?? breakdown?.m4Score ?? null,
                    fallback: 'Chưa có điểm',
                    color: '#D97706',
                  },
                ].map((row) => {
                  const hasScore = typeof row.score === 'number' && Number.isFinite(row.score);
                  const pct = hasScore ? Math.max(0, Math.min(100, row.score!)) : 0;
                  return (
                    <div className="rec-score-bar-row" key={row.label}>
                      <div className="rec-score-bar-head">
                        <span>{row.label}</span>
                        <strong style={{ color: hasScore ? '#0F172A' : '#64748B' }}>
                          {hasScore ? formatScore(row.score) : row.fallback}
                        </strong>
                      </div>
                      <div className="rec-score-bar-track">
                        <div className="rec-score-bar-fill" style={{ width: `${pct}%`, background: hasScore ? row.color : '#E2E8F0' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="rec-modal-card-note">{tierLabel(item)}. Điểm phù hợp phản ánh mức hỗ trợ dữ liệu, không phải cam kết doanh số.</p>
            </section>

            <details className="rec-details rec-memory-details">
              <summary>Chi tiết bằng chứng lịch sử (M1 & M4)</summary>
              <h4>Bằng chứng lịch sử M1</h4>
              <dl className="rec-breakdown">
                <div><dt>Hợp tác đủ điều kiện</dt><dd>{formatNumber(breakdown?.eligibleEvaluatedCollaborations)}</dd></div>
                <div><dt>Thương hiệu đóng góp</dt><dd>{formatNumber(breakdown?.distinctBrandCount)}</dd></div>
                {breakdown?.maxBrandShare != null && <div><dt>Tỷ trọng lớn nhất từ một thương hiệu</dt><dd>{formatNumber(breakdown.maxBrandShare)}%</dd></div>}
                <div><dt>Điểm đánh giá hợp tác</dt><dd>{breakdown?.rAvailability === 'AVAILABLE' ? formatScore(breakdown.rScore) : 'Chưa có đánh giá hoàn tất'}</dd></div>
                <div><dt>Điểm đúng hạn</dt><dd>{breakdown?.tAvailability === 'AVAILABLE' ? formatScore(breakdown.tScore) : 'Chưa có dữ liệu mốc thời gian & hạn'}</dd></div>
                <div><dt>Điểm thực hiện KPI</dt><dd>{breakdown?.kAvailability === 'AVAILABLE' ? formatScore(breakdown.kScore) : breakdown?.kAvailability === 'NOT_APPLICABLE' ? 'Không áp dụng · giữ nguyên trọng số chuẩn' : 'Chưa có dữ liệu KPI hợp lệ'}</dd></div>
                {breakdown?.m1Availability === 'UNAVAILABLE' && <div><dt>Cách tính M1 trong lượt này</dt><dd>Chưa có lịch sử hợp tác đủ điều kiện; hệ thống dùng mức trung tính (50/100) thay thế.</dd></div>}
              </dl>
              <h4>Nguồn đánh giá M4</h4><p>{metadata?.m4HistoryReadStatus === 'READ_FAILED' ? 'Lịch sử đọc lỗi; điểm này dùng fallback theo tiêu chí hiện tại.' : m4SourceLabel(breakdown?.m4Source)}</p>
              <dl className="rec-breakdown">
                {metadata?.m4HistoryWindowMonths != null && <div><dt>Phạm vi lịch sử M4</dt><dd>{metadata.m4HistoryWindowMonths} tháng trước thời điểm đánh giá; không gồm chiến dịch này.</dd></div>}
                {metadata?.m4ReviewEvidenceCount != null && <div><dt>Đánh giá trong phạm vi lịch sử</dt><dd>{formatNumber(metadata.m4ReviewEvidenceCount)}</dd></div>}
                <div><dt>Điểm từ lịch sử</dt><dd>{formatScore(breakdown?.m4LearnedScore)}</dd></div>
                <div><dt>Điểm từ tiêu chí hiện tại</dt><dd>{formatScore(breakdown?.m4ExplicitScore)}</dd></div>
                <div><dt>Điểm được sử dụng</dt><dd>{formatScore(breakdown?.m4EffectiveScore ?? breakdown?.m4Score)}</dd></div>
                <div><dt>Mức hỗ trợ dữ liệu</dt><dd>{confidenceLabel(breakdown?.confidenceTier ?? item.reasoning?.confidenceTier)}</dd></div>
                <div><dt>Điểm hỗ trợ dữ liệu</dt><dd>{formatScore(breakdown?.confidenceScore ?? item.reasoning?.confidenceScore)}</dd></div>
              </dl>
              {item.reasoning?.explanationAvailable === false && <p>Phần giải thích đầy đủ chưa có sẵn.</p>}
            </details>
            <details className="rec-details rec-extra-info"><summary>Thông tin kênh bổ sung</summary>
              {typeof item.claimed === 'boolean' && <p>{item.claimed ? 'Đã liên kết hồ sơ nhà sáng tạo.' : 'Chưa liên kết hồ sơ nhà sáng tạo.'}</p>}
              {categories.length > 0 && <div className="rec-niches">{categories.map(category => <span key={category}>{category}</span>)}</div>}
            </details>
            {renderRunMetadata()}
          </div>
        </article>
      );
    }
    return (
      <article className={detailed ? 'rec-creator-card rec-card-detail' : 'rec-creator-card rec-card-compact'} key={item.creatorId}>
        <header className="rec-identity">
          {!detailed && <Checkbox aria-label={'Chọn liên hệ ' + (item.displayName || item.userName || 'kênh')} checked={contactSelection.includes(item.creatorId)}
            disabled={running || !canSave || (!contactSelection.includes(item.creatorId) && (contactSelection.length >= 100 || membership.status !== 'success' || !activeCreatorIds.includes(item.creatorId)))}
            onChange={event => setContactSelection(previous => event.target.checked ? [...new Set([...previous, item.creatorId])] : previous.filter(id => id !== item.creatorId))} />}
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
          {!detailed && breakdown?.m1Availability === 'AVAILABLE' && <Tag color="purple">Đã có lịch sử M1</Tag>}
          {!detailed && breakdown?.m4LearnedScore != null && <Tag color="gold">AI đã học gu Brand (M4)</Tag>}
        </div>
        {!detailed && categories.length > 0 && <div className="rec-niches">{categories.slice(0, 3).map(category => <span key={category}>{category}</span>)}</div>}
        <section className={detailed ? 'rec-conclusion' : 'rec-score-summary'}>
        <div className={`rec-score${!scoreReady || typeof item.finalScore !== 'number' || !Number.isFinite(item.finalScore) ? ' rec-score-unavailable' : ''}`}>
          <span>{provisional ? 'Điểm tham khảo' : 'Điểm phù hợp'}</span>
          <strong>{scoreReady ? formatScore(item.finalScore) : 'Chưa công bố điểm chính thức'}</strong>
        </div>
        {detailed && <div className="rec-price"><span>Độ tin cậy dữ liệu</span><strong>{confidenceLabel(breakdown?.confidenceTier ?? item.reasoning?.confidenceTier)}</strong></div>}
        {detailed && <p className="rec-conclusion-tier">{tierLabel(item)}</p>}
        </section>
        {!detailed && breakdown && (
          <div className="rec-card-memories" aria-label="Điểm 4 chiều M1 đến M4">
            {[
              { code: 'M1', title: 'Lịch sử', val: breakdown.m1Availability === 'AVAILABLE' ? breakdown.m1Score : null, color: '#7C3AED' },
              { code: 'M2', title: 'Công khai', val: breakdown.m2Score ?? null, color: '#059669' },
              { code: 'M3', title: 'Nội dung', val: breakdown.m3Score ?? null, color: '#0284C7' },
              { code: 'M4', title: 'Thương hiệu', val: breakdown.m4EffectiveScore ?? breakdown.m4Score ?? null, color: '#D97706' },
            ].map(mem => {
              const hasVal = typeof mem.val === 'number' && Number.isFinite(mem.val);
              const pct = hasVal ? Math.max(0, Math.min(100, mem.val!)) : 0;
              return (
                <div key={mem.code} className="rec-mini-mem">
                  <div className="rec-mini-mem-head">
                    <span>{mem.code} · {mem.title}</span>
                    <strong>{hasVal ? formatScore(mem.val) : '—'}</strong>
                  </div>
                  <div className="rec-mini-mem-track">
                    <div className="rec-mini-mem-fill" style={{ width: `${pct}%`, background: hasVal ? mem.color : '#E2E8F0' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {detailed && <div className="rec-reason-summary"><h4>{provisional ? 'Nhận xét về kênh' : 'Vì sao được gợi ý?'}</h4><p>{item.reasoning?.summary || 'Chưa có phần giải thích cho kết quả này.'}</p>
          {!!item.reasoning?.reasons?.length && <details className="rec-details"><summary>Các lý do đã ghi nhận</summary><ul>{item.reasoning.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul></details>}
        </div>}
        {detailed && warnings.length > 0 && <aside className="rec-evidence"><h4>Giới hạn dữ liệu</h4><ul>{warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></aside>}
        <dl className="rec-metrics">
          <div><dt>Người theo dõi</dt><dd>{formatNumber(item.followers)}</dd></div>
          <div><dt>Tỷ lệ tương tác</dt><dd>{formatEngagement(item.engagementRate)}</dd></div>
          {detailed && <div><dt>Lượt xem trung bình</dt><dd>{formatNumber(item.avgViews)}</dd></div>}
          {detailed && <div><dt>Lượt thích trung bình</dt><dd>{formatNumber(item.avgLikes)}</dd></div>}
        </dl>
        <div className="rec-price"><span>Trạng thái báo giá</span><strong>{formatPrice(item.priceStatus)}</strong></div>
        {!detailed && item.reasoning?.summary && <details className="rec-card-summary"><summary>Tóm tắt đánh giá</summary><p>{item.reasoning.summary}</p></details>}
        {detailed && <details className="rec-details rec-memory-details">
          <summary>Điểm thành phần M1–M4</summary>
          <dl className="rec-breakdown">{scoreRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <p>{tierLabel(item)}. Điểm phù hợp và mức hỗ trợ dữ liệu không phải xác suất thành công của chiến dịch.</p>
          <h4>Bằng chứng lịch sử M1</h4>
          <dl className="rec-breakdown">
            <div><dt>Hợp tác đủ điều kiện</dt><dd>{formatNumber(breakdown?.eligibleEvaluatedCollaborations)}</dd></div>
            <div><dt>Thương hiệu đóng góp</dt><dd>{formatNumber(breakdown?.distinctBrandCount)}</dd></div>
            {breakdown?.maxBrandShare != null && <div><dt>Tỷ trọng lớn nhất từ một thương hiệu</dt><dd>{formatNumber(breakdown.maxBrandShare)}%</dd></div>}
            <div><dt>Điểm đánh giá hợp tác</dt><dd>{breakdown?.rAvailability === 'AVAILABLE' ? formatScore(breakdown.rScore) : 'Chưa có Final Review'}</dd></div>
            <div><dt>Điểm đúng hạn</dt><dd>{breakdown?.tAvailability === 'AVAILABLE' ? formatScore(breakdown.tScore) : 'Unavailable · cần timestamp Portal và deadline'}</dd></div>
            <div><dt>Điểm thực hiện KPI</dt><dd>{breakdown?.kAvailability === 'AVAILABLE' ? formatScore(breakdown.kScore) : breakdown?.kAvailability === 'NOT_APPLICABLE' ? 'Không áp dụng · không tự phân bổ lại trọng số' : 'Unavailable · thiếu KPI actual hợp lệ'}</dd></div>
            {breakdown?.m1Availability === 'UNAVAILABLE' && <div><dt>Cách dùng M1 trong lượt này</dt><dd>Composite M1 unavailable; TOPSIS dùng prior trung tính 0.50, không phải điểm đã học.</dd></div>}
          </dl>
          <h4>Nguồn đánh giá M4</h4><p>{metadata?.m4HistoryReadStatus === 'READ_FAILED' ? 'Lịch sử đọc lỗi; điểm này dùng fallback theo tiêu chí hiện tại.' : m4SourceLabel(breakdown?.m4Source)}</p>
          <p>Số lượng hợp tác giúp đáp ứng điều kiện bằng chứng, không bảo đảm điểm phù hợp tăng.</p>
          <dl className="rec-breakdown">
            {metadata?.m4HistoryWindowMonths != null && <div><dt>Phạm vi lịch sử M4</dt><dd>{metadata.m4HistoryWindowMonths} tháng trước thời điểm đánh giá; không gồm chiến dịch này.</dd></div>}
            {metadata?.m4ReviewEvidenceCount != null && <div><dt>Đánh giá trong phạm vi lịch sử</dt><dd>{formatNumber(metadata.m4ReviewEvidenceCount)}</dd></div>}
            <div><dt>Điểm từ lịch sử</dt><dd>{formatScore(breakdown?.m4LearnedScore)}</dd></div>
            <div><dt>Điểm từ tiêu chí hiện tại</dt><dd>{formatScore(breakdown?.m4ExplicitScore)}</dd></div>
            <div><dt>Điểm được sử dụng</dt><dd>{formatScore(breakdown?.m4EffectiveScore ?? breakdown?.m4Score)}</dd></div>
            <div><dt>Mức hỗ trợ dữ liệu</dt><dd>{confidenceLabel(breakdown?.confidenceTier ?? item.reasoning?.confidenceTier)}</dd></div>
            <div><dt>Điểm hỗ trợ dữ liệu</dt><dd>{formatScore(breakdown?.confidenceScore ?? item.reasoning?.confidenceScore)}</dd></div>
          </dl>
          {item.reasoning?.explanationAvailable === false && <p>Phần giải thích đầy đủ chưa có sẵn.</p>}
        </details>}
        {detailed && <details className="rec-details rec-extra-info"><summary>Thông tin kênh bổ sung</summary>
          {typeof item.claimed === 'boolean' && <p>{item.claimed ? 'Đã liên kết hồ sơ nhà sáng tạo.' : 'Chưa liên kết hồ sơ nhà sáng tạo.'}</p>}
          {categories.length > 0 && <div className="rec-niches">{categories.map(category => <span key={category}>{category}</span>)}</div>}
        </details>}
        {detailed && renderRunMetadata()}
        {detailed ? null : <footer className="rec-compact-footer">
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
      <section className="rec-campaign-context">
        <div className="rec-campaign-context-main">
          <CampaignImage src={campaign.imageUrl} className="rec-campaign-thumb" />
          <div>
            <span>CHIẾN DỊCH HIỆN TẠI</span>
            <h2>{campaign.name}</h2>
          </div>
        </div>
      </section>
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
              {running ? phase === 'preparing' ? 'Đang chuẩn bị dữ liệu' : 'Đang chạy gợi ý' : error ? 'Thử lại yêu cầu' : result || viewedRun ? 'Đánh giá lượt mới' : 'Đánh giá AI'}
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
        {!canRun && <p className="ad-note">{['COMPLETED', 'ARCHIVED', 'CLOSED'].includes(campaign.status) ? 'Chiến dịch đã kết thúc. Bạn có thể xem lại các lượt đánh giá trong lịch sử.' : 'Bạn chưa có quyền chạy đánh giá.'}</p>}
      </section>

      {statusWarning && <Alert type="warning" title={statusWarning} />}
      {campaign.embeddingStatus === 'FAILED' && !running && (
        <Alert
          type="error"
          showIcon
          title="Chuẩn bị dữ liệu ngữ nghĩa (M3) thất bại"
          description={canRetryEmbedding
            ? 'Cần thử lại chuẩn bị dữ liệu trước khi chạy gợi ý AI.'
            : 'Bạn chưa có quyền cập nhật chiến dịch để thử lại chuẩn bị dữ liệu.'}
          action={canRetryEmbedding ? (
            <Button
              type="primary"
              loading={retryingEmbedding}
              disabled={retryingEmbedding || running}
              onClick={() => void handleRetryEmbedding()}
            >
              Thử lại chuẩn bị dữ liệu
            </Button>
          ) : undefined}
        />
      )}
      {error && <Alert type="error" title={error} description={missingFields.length ? <><ul>{missingFields.map(field => <li key={field}>{field}</li>)}</ul>{campaign.status === 'DRAFT' ? <Button onClick={() => { const target = campaignEditor(campaign.id); navigate(target.path, { state: target.state }); }}>Bổ sung thông tin</Button> : <Button onClick={() => navigate('/campaigns/create')}>Tạo chiến dịch mới</Button>}</> : undefined} />}

      <section className="rec-results rec-workspace-card" aria-label="Kết quả đánh giá">
        {newerIncompleteAttempt && <Alert type="warning" showIcon title="Lần đánh giá mới nhất chưa hoàn tất. Bạn đang xem kết quả đã lưu trước đó." />}
        {membership.status === 'error' && <Alert type="warning" title="Chưa kiểm tra được các kênh đang lưu. Tải lại trước khi chọn liên hệ." action={<Button onClick={() => void membership.reload()}>Thử lại</Button>} />}
        <header className="rec-results-heading">
          <div><h2>{viewedRun ? 'Kết quả đã lưu' : 'Kết quả đánh giá'}</h2>
            <p>{viewedRun ? `Đã lưu lúc ${formatRecommendationDate(viewedRun.createdAt)}` : resultScope ?? 'Chọn một lượt trong lịch sử hoặc chủ động chạy mới.'}</p>
          </div>
          <div className="rec-result-tools">{candidates != null && <Tooltip title={displayedOrder?.description || 'Máy chủ chưa lưu chế độ của lượt này.'}><Tag>Thứ tự: {displayedOrder?.label ?? 'Chưa có thông tin'}</Tag></Tooltip>}<Button disabled={running} onClick={() => setHistoryOpen(true)}>Lịch sử đánh giá</Button></div>
        </header>
        <div className="rec-workspace-body">
        <details className="rec-architecture-explainer">
          <summary>Cơ chế AI 4-Memory &amp; Post-Campaign Learning (TOPSIS / MMR)</summary>
          <div className="rec-arch-grid">
            <div><strong>M1 · Lịch sử hợp tác (Bayesian R·T·K):</strong> Tự học từ đánh giá cuối (R), đúng hạn (T) và đạt KPI (K) của các chiến dịch đã nghiệm thu.</div>
            <div><strong>M2 · Hiệu suất công khai:</strong> Đo tốc độ tăng trưởng và độ ổn định tương tác của kênh.</div>
            <div><strong>M3 · Phù hợp nội dung (Embedding):</strong> So khớp ngữ nghĩa mô tả chiến dịch với nội dung Creator bằng Vector Cosine Similarity.</div>
            <div><strong>M4 · Gu thương hiệu (m4-evidence-v1):</strong> Tổng hợp từ lịch sử hợp tác của riêng Brand để cá nhân hóa xếp hạng TOPSIS / đa dạng hóa MMR.</div>
          </div>
        </details>
        {running ? <Skeleton active /> : candidates == null ? <div className="rec-empty-results"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có kết quả đánh giá" /><Button onClick={() => setHistoryOpen(true)}>Xem lịch sử đã lưu</Button></div> : <Tabs activeKey={tab} onChange={setTab} items={[
          { key: 'main', label: `Đề xuất chính · ${main.length}`, children: <>
            {main.length ? <div className="rec-cards-grid">{main.map((item, index) => renderCandidate(item, false, index + 1))}</div> : <Empty description={candidates == null ? 'Chưa có kết quả. Mở lịch sử hoặc chủ động chạy mới.' : 'Lượt này không có đề xuất chính'} />}
          </> },
          { key: 'reference', label: `Tham khảo · ${reference.length}`, children: <>
            <p className="rec-pool-note">Đánh giá tham khảo; chưa thuộc nhóm xếp hạng chính.</p>
            {reference.length ? <div className="rec-cards-grid">{reference.map((item, index) => renderCandidate(item, false, index + 1))}</div> : <Empty description="Không có kênh tham khảo trong dữ liệu lượt này" />}
          </> },
          { key: 'excluded', label: `Chưa phù hợp${excluded ? ' · ' + excluded.length : viewedRun && metadata?.excludedCount != null ? ' · ' + metadata.excludedCount : ''}`, children: <>
            <p className="rec-pool-note">Các kênh dưới đây tạm thời chưa được đưa vào bảng xếp hạng do lệch tiêu chí chiến dịch hoặc chỉ số dữ liệu cần kiểm định lại.</p>
            {excluded ? excluded.length ? <div className="rec-cards-grid">{excluded.map(item => <article className="rec-creator-card rec-card-compact" key={item.creatorId}>
              <header className="rec-identity"><CreatorAvatar size={44} src={item.avatarUrl} name={item.displayName || item.userName} /><div className="rec-author"><h3>{item.displayName || item.userName || 'Kênh chưa có tên'}</h3><p>{item.userName ? '@' + item.userName.replace(/^@+/, '') : 'Chưa có tên tài khoản'}</p></div></header>
              {item.platform && <div className="rec-statuses"><Tag>{item.platform}</Tag></div>}
              <div className="rec-reason-summary"><h4>Lý do chưa đề xuất</h4><p>{item.message || 'Dữ liệu kênh chưa đáp ứng tiêu chí đánh giá của lượt này.'}</p></div>
              {!!item.reasons?.length && <details className="rec-details"><summary>Xem chi tiết lý do</summary>{renderExcludedReasons(item.reasons)}</details>}
            </article>)}</div> : <Empty description="Không có kênh nào bị loại trong lượt này" /> : <Empty description={viewedRun ? 'Lịch sử không cung cấp danh sách và lý do chi tiết.' : 'Chưa có dữ liệu từ lượt đánh giá'} />}
          </> },
        ]} />}
        </div>
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
      {!running && !invalidSelection && (
        <section className={contactSelection.length > 0 ? 'rec-next-action is-floating' : 'rec-next-action'} aria-label="Tiếp tục sau khi xem kết quả">
          <div>
            <h2>{candidates == null ? 'Chưa có kết quả đánh giá' : contactSelection.length ? `Đã chọn ${contactSelection.length} kênh để liên hệ` : 'Chọn kênh để tiếp tục liên hệ'}</h2>
          </div>
          <div className="rec-next-buttons">
            <Button onClick={() => navigate('/campaigns/detail', { state: { campaignId: campaign.id } })}>Về chiến dịch</Button>
            {candidates?.length ? <Button type="primary" disabled={!contactSelection.length || membership.status !== 'success' || contactSelection.some(id => !activeCreatorIds.includes(id)) || !permissions.includes('MANAGE_OWN_RELATIONSHIP') || !permissions.includes('MANAGE_OWN_SHORTLIST')}
              onClick={() => navigate('/outreach', { state: contactContext(campaign.id, contactSelection, { runId: viewedRun?.id ?? result?.recommendationRunId, items: assessmentItems(main, reference) }) })}>
              Mời hợp tác{contactSelection.length ? ` · ${contactSelection.length} kênh` : ''}
            </Button> : <Button onClick={openShortlist}>Danh sách đã chọn</Button>}
          </div>
        </section>
      )}

      <Modal
        title="Chi tiết kết quả gợi ý"
        rootClassName="rec-analysis-modal"
        centered
        width={1020}
        open={!!detail}
        onCancel={() => setDetail(null)}
        destroyOnHidden
        footer={detail ? renderDetailActions(detail) : null}
      >
        {detail && renderCandidate(detail, true)}
      </Modal>


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
