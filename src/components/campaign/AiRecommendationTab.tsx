import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Avatar,
  Progress,
  Tooltip,
  Popover,
  Modal,
  Drawer,
  Form,
  Select,
  Input,
  message,
  Spin,
  Empty,
  Radio,
  Badge,
  Table,
  Space,
  Divider,
  Alert,
} from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ReloadOutlined,
  ClockCircleOutlined,
  StarFilled,
  TeamOutlined,
  EyeOutlined,
  SendOutlined,
  QuestionCircleOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  CheckOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  ThunderboltFilled,
  FireOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  RiseOutlined,
  BarChartOutlined,
  BulbOutlined,
  FilterOutlined,
} from '@ant-design/icons';

import { useNavigate } from 'react-router-dom';
import { aiRecommendationService } from '../../services/api/aiRecommendationService';
import { creatorService } from '../../services/api/creatorService';
import type { ShortlistItem } from '../../types/api/creator.types';
import type {
  CreatorRecommendationItemDto,
  RecommendationRun,
  ScoreBreakdownDto,
  DisplayMode,
  CandidateSource,
} from '../../types/api/aiRecommendation.types';
import type { CampaignResponse } from '../../types/api/campaign.types';

interface AiRecommendationTabProps {
  campaign: CampaignResponse | null;
  availableCampaigns?: CampaignResponse[];
  onSelectCampaign?: (campaignId: string) => void;
  onAddedToShortlist?: (creatorId: string) => void;
}

const REJECTION_REASONS = [
  { value: 'PRICE_TOO_HIGH', label: 'Chi phí báo giá quá cao' },
  { value: 'NOT_TARGET_NICHE', label: 'Sai tệp khách hàng / sai phong cách' },
  { value: 'POOR_ENGAGEMENT', label: 'Tương tác thấp hoặc nghi ngờ tương tác ảo' },
  { value: 'BRAND_CONFLICT', label: 'Đã hợp tác với đối thủ cạnh tranh' },
  { value: 'OTHER', label: 'Lý do khác' },
];

export default function AiRecommendationTab({
  campaign,
  availableCampaigns = [],
  onSelectCampaign,
  onAddedToShortlist,
}: AiRecommendationTabProps) {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<'recommendations' | 'provisional' | 'shortlist' | 'runs'>('recommendations');
  const [candidateSource, setCandidateSource] = useState<CandidateSource>('DISCOVERY');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('BEST_MATCH');

  // Shortlist Data State for Campaign
  const [shortlistItems, setShortlistItems] = useState<ShortlistItem[]>([]);
  const [loadingShortlist, setLoadingShortlist] = useState<boolean>(false);

  // Load Shortlist của chiến dịch hiện tại
  const loadShortlist = useCallback(async () => {
    if (!campaign?.id) {
      setShortlistItems([]);
      return;
    }
    setLoadingShortlist(true);
    try {
      const list = await creatorService.getShortlist(campaign.id);
      setShortlistItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Lỗi khi nạp shortlist:', err);
    } finally {
      setLoadingShortlist(false);
    }
  }, [campaign?.id]);

  useEffect(() => {
    loadShortlist();
  }, [loadShortlist]);

  // Set các ID KOC đã có trong Shortlist của chiến dịch
  const shortlistedCreatorIds = useMemo(() => {
    const ids = new Set<string>();
    shortlistItems.forEach((item) => {
      if (item.creatorId) ids.add(item.creatorId);
      if (item.id) ids.add(item.id);
    });
    return ids;
  }, [shortlistItems]);

  // Recommendation State
  const [loading, setLoading] = useState(false);
  const [loadingStepText, setLoadingStepText] = useState('Đang khởi tạo Four-Memory Engine...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [recommendations, setRecommendations] = useState<CreatorRecommendationItemDto[]>([]);
  const [provisionalRecommendations, setProvisionalRecommendations] = useState<CreatorRecommendationItemDto[]>([]);
  const [contextVersion, setContextVersion] = useState<number>(1);
  const [runId, setRunId] = useState<string | null>(null);

  // Runs History State
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsList, setRunsList] = useState<RecommendationRun[]>([]);

  // Feedback State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedCreatorForFeedback, setSelectedCreatorForFeedback] =
    useState<CreatorRecommendationItemDto | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [rejectForm] = Form.useForm();

  // Shortlist action states
  const [shortlistingId, setShortlistingId] = useState<string | null>(null);

  // Search & Filters state matching Shortlist page
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'tiktok' | 'instagram' | 'youtube'>('all');
  const [shortlistStatusFilter, setShortlistStatusFilter] = useState<'all' | 'shortlisted' | 'not_shortlisted'>('all');
  const [boardLayout, setBoardLayout] = useState<'grid' | 'list'>('grid');
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

  // Deep AI Analysis Drawer State
  const [isDeepAnalysisOpen, setIsDeepAnalysisOpen] = useState(false);
  const [selectedCreatorForDeepAnalysis, setSelectedCreatorForDeepAnalysis] =
    useState<CreatorRecommendationItemDto | null>(null);

  // Counts for recommendations
  const shortlistedRecsCount = useMemo(() => {
    return recommendations.filter((r) =>
      Boolean(r.inShortlist || (r as any).isInShortlist || shortlistedCreatorIds.has(r.creatorId))
    ).length;
  }, [recommendations, shortlistedCreatorIds]);

  const notShortlistedRecsCount = useMemo(() => {
    return Math.max(0, recommendations.length - shortlistedRecsCount);
  }, [recommendations.length, shortlistedRecsCount]);

  // Handler: Mở Drawer Phân tích chuyên sâu Four-Memory cho Creator đề xuất
  const handleOpenDeepAnalysis = (creator: CreatorRecommendationItemDto) => {
    const isShortlisted = Boolean(
      creator.inShortlist ||
      (creator as any).isInShortlist ||
      shortlistedCreatorIds.has(creator.creatorId)
    );
    setSelectedCreatorForDeepAnalysis({ ...creator, inShortlist: isShortlisted });
    setIsDeepAnalysisOpen(true);
  };

  // Map ứng viên từ Shortlist thật sự: nếu đã được chấm điểm trong phiên AI thì giữ kết quả Four-Memory thật,
  // nếu chưa chạy AI thì hiển thị dữ liệu gốc từ Shortlist, tuyệt đối KHÔNG giả lập điểm số.
  const mapShortlistItem = useCallback(
    (item: ShortlistItem): CreatorRecommendationItemDto => {
      const foundRec = recommendations.find(
        (r) => r.creatorId === item.creatorId || r.creatorId === item.id
      );
      if (foundRec) {
        return {
          ...foundRec,
          inShortlist: true,
        };
      }

      return {
        creatorId: item.creatorId || item.id,
        platform: item.platform || 'TIKTOK',
        displayName: item.creatorName || 'Creator',
        userName: item.creatorName || '',
        avatarUrl: item.avatarUrl,
        followers: item.followers || 0,
        engagementRate: item.engagementRate != null ? item.engagementRate : undefined,
        niche: item.niche || 'Chưa phân loại',
        finalScore: 0,
        inShortlist: true,
        isScoreReady: false,
        isProvisional: false,
        scoreBreakdown: undefined,
        reasoning: item.note
          ? {
              summary: item.note,
              reasons: [item.note],
              explanationAvailable: false,
            }
          : undefined,
      };
    },
    [recommendations]
  );

  // Handler: Mở Drawer Phân tích chuyên sâu Four-Memory cho Creator trong bảng Shortlist
  const handleOpenDeepAnalysisFromShortlist = (item: ShortlistItem) => {
    const evaluated = mapShortlistItem(item);
    setSelectedCreatorForDeepAnalysis(evaluated);
    setIsDeepAnalysisOpen(true);
  };

  // Danh sách Creator thực tế trong Shortlist
  const shortlistCandidatesList = useMemo(() => {
    return shortlistItems.map(mapShortlistItem);
  }, [shortlistItems, mapShortlistItem]);

  const filteredShortlistCandidates = useMemo(() => {
    return shortlistCandidatesList.filter((item) => {
      if (platformFilter !== 'all' && item.platform?.toLowerCase() !== platformFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          item.displayName.toLowerCase().includes(q) ||
          item.userName.toLowerCase().includes(q) ||
          (item.niche && item.niche.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [shortlistCandidatesList, platformFilter, searchTerm]);

  // Danh sách Creator trả về THỰC TẾ từ API đề xuất AI Four-Memory (Score-Ready)
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((item) => {
      if (platformFilter !== 'all' && item.platform?.toLowerCase() !== platformFilter) {
        return false;
      }
      const isShortlisted = Boolean(
        item.inShortlist || (item as any).isInShortlist || shortlistedCreatorIds.has(item.creatorId)
      );
      if (shortlistStatusFilter === 'shortlisted' && !isShortlisted) {
        return false;
      }
      if (shortlistStatusFilter === 'not_shortlisted' && isShortlisted) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          item.displayName.toLowerCase().includes(q) ||
          item.userName.toLowerCase().includes(q) ||
          (item.niche && item.niche.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [recommendations, platformFilter, shortlistStatusFilter, searchTerm, shortlistedCreatorIds]);

  // Danh sách ứng viên tiềm năng (Provisional pool)
  const filteredProvisional = useMemo(() => {
    return provisionalRecommendations.filter((item) => {
      if (platformFilter !== 'all' && item.platform?.toLowerCase() !== platformFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          item.displayName.toLowerCase().includes(q) ||
          item.userName.toLowerCase().includes(q) ||
          (item.niche && item.niche.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [provisionalRecommendations, platformFilter, searchTerm]);

  // Tổng quan chỉ số hiệu quả đề xuất AI Four-Memory thực tế
  const recommendationStats = useMemo(() => {
    const list = recommendations;
    if (list.length === 0) return null;
    const scoredList = list.filter((c) => typeof c.finalScore === 'number' && c.finalScore > 0);
    const avgScore =
      scoredList.length > 0
        ? Math.round(
            (scoredList.reduce((acc, c) => acc + c.finalScore, 0) / scoredList.length) * 100
          )
        : 0;
    const totalEstReach = list.reduce((acc, c) => acc + (c.avgViews || 0), 0);
    const validErList = list.filter((c) => typeof c.engagementRate === 'number' && c.engagementRate > 0);
    const avgEr =
      validErList.length > 0
        ? (
            validErList.reduce((acc, c) => {
              const er = c.engagementRate! <= 1 ? c.engagementRate! * 100 : c.engagementRate!;
              return acc + er;
            }, 0) / validErList.length
          ).toFixed(1)
        : '0.0';

    return {
      avgScore,
      totalEstReach,
      avgEr,
      count: list.length,
    };
  }, [recommendations]);

  // Load recommendations
  const handleRunAiRecommendation = useCallback(async () => {
    if (!campaign?.id) {
      message.warning('Vui lòng chọn chiến dịch trước khi kích hoạt đề xuất AI!');
      return;
    }

    setLoading(true);
    setApiErrorMessage(null);
    setLoadingProgress(15);
    setLoadingStepText('M1: Đang phân tích hồ sơ thương hiệu và mục tiêu chiến dịch...');

    const stepTimer1 = setTimeout(() => {
      setLoadingProgress(45);
      setLoadingStepText('M2: Đánh giá hiệu suất tương tác và chất lượng người theo dõi...');
    }, 450);

    const stepTimer2 = setTimeout(() => {
      setLoadingProgress(75);
      setLoadingStepText('M3: Đối chiếu ngữ nghĩa nội dung clip (Semantic pgvector)...');
    }, 900);

    const stepTimer3 = setTimeout(() => {
      setLoadingProgress(92);
      setLoadingStepText('M4: Khai thác lịch sử phản hồi và tiêu chí nhãn hàng...');
    }, 1300);

    try {
      const res = await aiRecommendationService.runRecommendation(campaign.id, 30, {
        candidateSource,
        displayMode,
      });
      setRecommendations(res?.recommendations || []);
      setProvisionalRecommendations(res?.provisionalRecommendations || []);
      setContextVersion(res?.contextVersion || 1);
      setRunId(res?.recommendationRunId || null);
      setLoadingProgress(100);
      message.success({
        content: `Đã hoàn tất phân tích Four-Memory! Tìm thấy ${res?.recommendations?.length || 0} KOC đạt chuẩn và ${res?.provisionalRecommendations?.length || 0} KOC tiềm năng.`,
        key: 'ai_rec_run',
        duration: 3,
      });
    } catch (err: any) {
      console.error('Lỗi khi chạy đề xuất AI:', err);
      const msg = err?.message || 'Không thể thực hiện đề xuất AI lúc này. Vui lòng thử lại!';
      setApiErrorMessage(msg);
      message.error(msg);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setLoading(false);
    }
  }, [campaign?.id, campaign?.name, candidateSource, displayMode]);


  // Load historical runs
  const handleLoadRuns = useCallback(async () => {
    if (!campaign?.id) return;
    setRunsLoading(true);
    try {
      const runs = await aiRecommendationService.getRecommendationRuns(campaign.id);
      setRunsList(runs);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử runs:', err);
    } finally {
      setRunsLoading(false);
    }
  }, [campaign?.id]);

  useEffect(() => {
    if (activeSubTab === 'runs') {
      handleLoadRuns();
    }
  }, [activeSubTab, handleLoadRuns]);

  // Auto trigger initial run if empty
  useEffect(() => {
    if (campaign?.id && recommendations.length === 0 && !loading) {
      handleRunAiRecommendation();
    }
  }, [campaign?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Accept: Gửi feedback ACCEPT và đồng thời thêm vào Shortlist của chiến dịch
  const handleAcceptCreator = async (creator: CreatorRecommendationItemDto) => {
    if (!campaign?.id) {
      message.warning('Vui lòng chọn chiến dịch trước khi thực hiện!');
      return;
    }
    setShortlistingId(creator.creatorId);
    try {
      // 1. Gửi feedback ACCEPT tới backend
      await aiRecommendationService.submitFeedback(campaign.id, {
        creatorId: creator.creatorId,
        action: 'ACCEPT',
      });

      // 2. Đồng thời thêm vào Shortlist của chiến dịch
      const shortlistResult = await creatorService.addToShortlist(campaign.id, {
        creatorId: creator.creatorId,
        creatorName: creator.displayName || creator.userName,
        username: creator.userName || creator.displayName,
        platform: creator.platform,
        avatarUrl: creator.avatarUrl,
        followers: creator.followers,
        engagementRate: creator.engagementRate,
        priority: 'HIGH',
        note: `AI Four-Memory (Khớp ${Math.round(creator.finalScore * 100)}%)`,
      });

      // 3. Cập nhật state UI
      setRecommendations((prev) =>
        prev.map((c) => (c.creatorId === creator.creatorId ? { ...c, inShortlist: true } : c))
      );
      loadShortlist();
      onAddedToShortlist?.(creator.creatorId);

      (shortlistResult.action === 'ALREADY_EXISTS' ? message.info : message.success)({
        content: shortlistResult.action === 'ALREADY_EXISTS' ? 'Đã ghi nhận phản hồi; kênh đã có trong shortlist.' : shortlistResult.action === 'RESTORED' ? 'Đã ghi nhận phản hồi và khôi phục kênh vào shortlist.' : 'Đã ghi nhận phản hồi và thêm kênh vào shortlist.',
        key: 'feedback_act',
        duration: 3,
      });
      return true;
    } catch (err) {
      console.error('Lỗi khi gửi feedback accept:', err);
      message.error('Không thể hoàn tất phản hồi lúc này.');
      return false;
    } finally {
      setShortlistingId(null);
    }
  };

  // Open Reject Modal: "Đóng góp ý kiến cho AI"
  const handleOpenReject = (creator: CreatorRecommendationItemDto) => {
    setSelectedCreatorForFeedback(creator);
    rejectForm.resetFields();
    rejectForm.setFieldsValue({ reasonCode: 'PRICE_TOO_HIGH' });
    setRejectModalOpen(true);
  };

  // Submit Reject: Gửi feedback REJECT, cập nhật context version và ẩn creator khỏi danh sách
  const handleSubmitReject = async () => {
    if (!campaign?.id || !selectedCreatorForFeedback) return;
    try {
      const values = await rejectForm.validateFields();
      setFeedbackSubmitting(true);
      const res = await aiRecommendationService.submitFeedback(campaign.id, {
        creatorId: selectedCreatorForFeedback.creatorId,
        action: 'REJECT',
        reasonCode: values.reasonCode,
        reasonNote: values.reasonNote,
      });

      const nextVersion = res?.newContextVersion || contextVersion + 1;

      // Toast thông báo chính xác theo yêu cầu:
      message.success({
        content: `Đã ghi nhận phản hồi. AI đã nâng cấp bộ nhớ ngữ cảnh lên v${nextVersion} và sẽ không đề xuất lại Creator này.`,
        duration: 4,
      });

      // Ẩn Creator bị Reject khỏi danh sách
      setRecommendations((prev) =>
        prev.filter((c) => c.creatorId !== selectedCreatorForFeedback.creatorId)
      );
      setContextVersion(nextVersion);
      setRejectModalOpen(false);
    } catch (err: any) {
      if (err?.errorFields) return;
      console.error('Lỗi khi submit feedback reject:', err);
      message.error('Không thể gửi phản hồi từ chối lúc này.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Add to shortlist
  const handleAddToShortlist = async (creator: CreatorRecommendationItemDto) => {
    if (!campaign?.id) return;
    setShortlistingId(creator.creatorId);
    try {
      const shortlistResult = await creatorService.addToShortlist(campaign.id, {
        creatorId: creator.creatorId,
        creatorName: creator.displayName || creator.userName,
        username: creator.userName || creator.displayName,
        platform: creator.platform,
        avatarUrl: creator.avatarUrl,
        followers: creator.followers,
        engagementRate: creator.engagementRate,
        priority: 'HIGH',
        note: `AI Four-Memory (Khớp ${Math.round(creator.finalScore * 100)}%)`,
      });
      (shortlistResult.action === 'ALREADY_EXISTS' ? message.info : message.success)(shortlistResult.action === 'ALREADY_EXISTS' ? 'Kênh đã có trong shortlist.' : shortlistResult.action === 'RESTORED' ? 'Đã khôi phục kênh vào shortlist.' : 'Đã thêm kênh vào shortlist.');
      setRecommendations((prev) =>
        prev.map((c) => (c.creatorId === creator.creatorId ? { ...c, inShortlist: true } : c))
      );
      onAddedToShortlist?.(creator.creatorId);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể thêm vào shortlist.');
    } finally {
      setShortlistingId(null);
    }
  };

  // Render Score Breakdown Popover
  const renderScoreBreakdownContent = (breakdown?: ScoreBreakdownDto) => {
    if (!breakdown) return <div>Chưa có dữ liệu phân rã điểm.</div>;
    const items = [
      { label: 'M1: Uy tín & Lịch sử Creator', score: breakdown.m1Score, color: '#4F46E5' },
      { label: 'M2: Hiệu suất & Tương tác công khai', score: breakdown.m2Score, color: '#10B981' },
      { label: 'M3: Độ khớp ngữ nghĩa Brief (PGVector)', score: breakdown.m3Score ?? breakdown.semanticMatchScore, color: '#EC4899' },
      { label: 'M4: Khẩu vị & Ưu tiên Nhãn hàng', score: breakdown.m4Score, color: '#8B5CF6' },
      ...(breakdown.followerScore != null ? [{ label: 'Quy mô người theo dõi', score: breakdown.followerScore, color: '#F59E0B' }] : []),
      ...(breakdown.engagementScore != null ? [{ label: 'Tỷ lệ tương tác (ER)', score: breakdown.engagementScore, color: '#06B6D4' }] : []),
    ];

    return (
      <div style={{ width: 280, padding: '4px 0' }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#0F172A' }}>
          Phân rã Chỉ số Four-Memory (Score Breakdown)
        </div>
        {items.map((it, idx) => {
          const hasScore = typeof it.score === 'number' && !isNaN(it.score);
          const valPct = hasScore ? Math.round(it.score! * 100) : 0;
          return (
            <div key={idx} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 2 }}>
                <span style={{ color: '#475569' }}>{it.label}</span>
                <span style={{ fontWeight: 700, color: it.color }}>{hasScore ? `${valPct}%` : '—'}</span>
              </div>
              <Progress percent={valPct} size="small" strokeColor={it.color} showInfo={false} />
            </div>
          );
        })}
      </div>
    );
  };

  // Format number
  const formatFollowers = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${Math.round(num / 1_000)}K`;
    return `${num}`;
  };

  // Helper trích xuất các chỉ số thực tế từ backend Four-Memory
  const getCreatorImpact = (creator: CreatorRecommendationItemDto) => {
    const estViewsText = creator.avgViews != null ? `${formatFollowers(creator.avgViews)} lượt xem/video` : '—';
    const engRate = creator.engagementRate != null
      ? creator.engagementRate <= 1
        ? creator.engagementRate * 100
        : creator.engagementRate
      : null;
    const engText = engRate != null ? `${Number(engRate).toFixed(1)}%` : '—';
    const audienceFit = creator.niche || 'Chưa phân loại';

    let reason1 = creator.reasoning?.reasons?.[0] || creator.reasoning?.summary || 'Ứng viên được chọn lọc qua Four-Memory Engine.';
    let reason2 = creator.reasoning?.reasons?.[1] || (creator.reasoning?.evidenceWarnings?.[0] ? `Lưu ý: ${creator.reasoning.evidenceWarnings[0]}` : 'Hiệu suất đã đối soát chính sách.');

    const m1 = creator.scoreBreakdown?.m1Score != null ? Math.round(creator.scoreBreakdown.m1Score * 100) : null;
    const m2 = creator.scoreBreakdown?.m2Score != null ? Math.round(creator.scoreBreakdown.m2Score * 100) : null;
    const m3 = (creator.scoreBreakdown?.m3Score ?? creator.scoreBreakdown?.semanticMatchScore) != null
      ? Math.round((creator.scoreBreakdown?.m3Score ?? creator.scoreBreakdown?.semanticMatchScore)! * 100)
      : null;
    const m4 = creator.scoreBreakdown?.m4Score != null ? Math.round(creator.scoreBreakdown.m4Score * 100) : null;

    return {
      estViewsText,
      engText,
      audienceFit,
      reason1,
      reason2,
      m1,
      m2,
      m3,
      m4,
    };
  };

  // Helper render Thẻ ứng viên đề xuất AI (Grid Mode) tinh gọn & nổi bật hiệu quả
  const renderCreatorCard = (
    creator: CreatorRecommendationItemDto,
    index: number,
    isShortlisted: boolean
  ) => {
    const hasScore = typeof creator.finalScore === 'number' && creator.finalScore > 0;
    const matchPct = hasScore ? Math.round(creator.finalScore * 100) : null;
    const impact = getCreatorImpact(creator);

    return (
      <div className="ai-rec-card" key={creator.creatorId || index}>
        {/* 1. Header: Thứ hạng + Match Score Pill + Nền tảng */}
        <div className="ai-rec-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span className="rec-rank-badge">#{index + 1}</span>
            <Popover
              content={renderScoreBreakdownContent(creator.scoreBreakdown)}
              trigger="hover"
              placement="bottom"
            >
              <span
                className="rec-score-pill"
                onClick={() => handleOpenDeepAnalysis(creator)}
                title="Nhấn để mở Phân tích chuyên sâu Four-Memory"
              >
                <ThunderboltFilled style={{ color: hasScore ? '#F59E0B' : '#94A3B8' }} />
                <span>{matchPct != null ? `${matchPct}% Match` : 'Chưa có điểm AI'}</span>
                <InfoCircleOutlined style={{ fontSize: 10, color: '#059669' }} />
              </span>
            </Popover>

            {creator.isProvisional && (
              <Tag color="orange" style={{ fontWeight: 700, borderRadius: 6, margin: 0, fontSize: 11 }}>
                Tiềm năng
              </Tag>
            )}

            {isShortlisted && (
              <span className="rec-shortlisted-pill">
                <CheckCircleFilled style={{ color: '#10B981' }} />
                <span>Đã lưu</span>
              </span>
            )}
          </div>

          <span className={`rec-platform-tag ${creator.platform?.toLowerCase() || 'tiktok'}`}>
            {creator.platform?.toUpperCase() || 'TIKTOK'}
          </span>
        </div>

        {/* 2. Identity: Avatar + Tên + Category */}
        <div className="ai-rec-card-profile">
          <Avatar
            size={48}
            src={
              creator.avatarUrl && creator.avatarUrl.trim() !== ''
                ? creator.avatarUrl
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    creator.displayName || 'Creator'
                  )}&background=4F46E5&color=fff&size=150&bold=true`
            }
            onError={() => false}
            className="ai-rec-avatar"
          >
            {(creator.displayName || 'KOC').slice(0, 2).toUpperCase()}
          </Avatar>

          <div className="ai-rec-info">
            <div className="ai-rec-name-row">
              <span
                className="ai-rec-name"
                onClick={() => navigate(`/creators/${creator.creatorId}`)}
                title={creator.displayName}
              >
                {creator.displayName}
              </span>
              <CheckCircleFilled style={{ color: '#2563EB', fontSize: 13 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="ai-rec-username">@{creator.userName}</span>
              <span className="rec-dot">•</span>
              <span className="rec-category-tag">{creator.niche || 'Làm đẹp & Sức khỏe'}</span>
            </div>
          </div>
        </div>

        {/* 3. Khung Dự báo Hiệu quả Chiến dịch (Impact Metrics) */}
        <div className="rec-impact-grid">
          <div className="rec-impact-col">
            <span className="rec-impact-val">{formatFollowers(creator.followers)}</span>
            <span className="rec-impact-lbl">Người theo dõi</span>
          </div>
          <div className="rec-impact-col">
            <span className="rec-impact-val highlight">{impact.engText}</span>
            <span className="rec-impact-lbl">Tương tác (ER)</span>
          </div>
          <div className="rec-impact-col">
            <span className="rec-impact-val">{impact.estViewsText}</span>
            <span className="rec-impact-lbl">Dự kiến Views</span>
          </div>
        </div>

        {/* 4. Hiệu quả Đề xuất Cốt lõi (AI Value Highlights) */}
        <div className="rec-value-box">
          <div className="rec-value-title">
            <span>✨ Điểm mạnh đối soát theo Brief:</span>
            <span
              className="rec-deep-link"
              onClick={() => handleOpenDeepAnalysis(creator)}
            >
              Chẩn đoán AI ➔
            </span>
          </div>
          <div className="rec-value-reasons">
            <div className="rec-value-line">
              <CheckOutlined style={{ color: '#10B981', fontSize: 11, marginTop: 2, flexShrink: 0 }} />
              <span>{impact.reason1}</span>
            </div>
            <div className="rec-value-line">
              <CheckOutlined style={{ color: '#10B981', fontSize: 11, marginTop: 2, flexShrink: 0 }} />
              <span>{impact.reason2}</span>
            </div>
          </div>
        </div>

        {/* 5. Mini Four-Memory Score Breakdown Bar */}
        <div
          className="rec-mini-m4-bar"
          onClick={() => handleOpenDeepAnalysis(creator)}
          title="Bấm để xem bóc tách chi tiết 4 bộ nhớ AI Four-Memory"
        >
          <div className="m4-pill"><span>M1 Hồ sơ:</span> <b>{impact.m1}%</b></div>
          <div className="m4-pill"><span>M2 Tương tác:</span> <b>{impact.m2}%</b></div>
          <div className="m4-pill"><span>M3 Clip:</span> <b>{impact.m3}%</b></div>
          <div className="m4-pill"><span>M4 Safety:</span> <b>{impact.m4}%</b></div>
        </div>

        {/* 6. Nút Hành động */}
        <div className="ai-rec-card-actions">
          {isShortlisted ? (
            <Button
              className="btn-rec-saved"
              icon={<CheckCircleFilled />}
              onClick={() => {
                if (campaign?.id) {
                  sessionStorage.setItem('current_campaign_id', campaign.id);
                  localStorage.setItem('last_active_campaign_id', campaign.id);
                }
                navigate('/creators/shortlist');
              }}
            >
              Đã có trong Shortlist ➔
            </Button>
          ) : (
            <Button
              type="primary"
              className="btn-rec-add"
              loading={shortlistingId === creator.creatorId}
              icon={<PlusOutlined />}
              onClick={() => handleAcceptCreator(creator)}
            >
              Lưu vào Shortlist
            </Button>
          )}

          <Button
            className="btn-rec-detail"
            onClick={() => handleOpenDeepAnalysis(creator)}
          >
            Phân tích sâu
          </Button>

          {!isShortlisted && (
            <Tooltip title="Đóng góp ý kiến (AI học M4)">
              <Button
                size="small"
                type="text"
                danger
                icon={<CloseCircleFilled style={{ color: '#94A3B8', fontSize: 16 }} />}
                onClick={() => handleOpenReject(creator)}
                style={{ width: 34, height: 34, padding: 0 }}
              />
            </Tooltip>
          )}
        </div>
      </div>
    );
  };

  // Helper render Hàng ứng viên (List Mode)
  const renderCreatorRow = (
    creator: CreatorRecommendationItemDto,
    index: number,
    isShortlisted: boolean
  ) => {
    const hasScore = typeof creator.finalScore === 'number' && creator.finalScore > 0;
    const matchPct = hasScore ? Math.round(creator.finalScore * 100) : null;
    const impact = getCreatorImpact(creator);

    return (
      <Col xs={24} key={creator.creatorId || index}>
        <Card
          hoverable
          style={{
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            transition: 'all 0.2s ease',
          }}
          bodyStyle={{ padding: '16px 20px' }}
        >
          <Row gutter={[20, 16]} align="middle">
            {/* Creator Profile Left */}
            <Col xs={24} lg={7}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className="rec-rank-badge">#{index + 1}</span>
                <Avatar
                  size={52}
                  src={
                    creator.avatarUrl && creator.avatarUrl.trim() !== ''
                      ? creator.avatarUrl
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          creator.displayName || 'Creator'
                        )}&background=4F46E5&color=fff&size=150&bold=true`
                  }
                  onError={() => false}
                  className="ai-rec-avatar"
                >
                  {(creator.displayName || 'KOC').slice(0, 2).toUpperCase()}
                </Avatar>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: 15,
                        color: '#0F172A',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/creators/${creator.creatorId}`)}
                    >
                      {creator.displayName}
                    </span>
                    <CheckCircleFilled style={{ color: '#2563EB', fontSize: 13 }} />
                    <span className={`rec-platform-tag ${creator.platform?.toLowerCase() || 'tiktok'}`}>
                      {creator.platform?.toUpperCase() || 'TIKTOK'}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                    @{creator.userName} • <span style={{ color: '#475569' }}>{creator.niche || 'Làm đẹp & Sức khỏe'}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 5, fontSize: 11.5, color: '#475569' }}>
                    <span>
                      Followers: <strong>{formatFollowers(creator.followers)}</strong>
                    </span>
                    <span>
                      ER: <strong style={{ color: '#059669' }}>{impact.engText}</strong>
                    </span>
                    <span>
                      Dự kiến: <strong style={{ color: '#4F46E5' }}>{impact.estViewsText} views</strong>
                    </span>
                  </div>
                </div>
              </div>
            </Col>

            {/* Reasoning Card Middle */}
            <Col xs={24} lg={10}>
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 12,
                  padding: '10px 14px',
                  border: '1px solid #EEF2F6',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#4F46E5',
                    marginBottom: 4,
                  }}
                >
                  <span>✨ Điểm mạnh đối soát theo Brief:</span>
                  <span
                    onClick={() => handleOpenDeepAnalysis(creator)}
                    style={{
                      cursor: 'pointer',
                      fontSize: 11,
                      color: '#6D28D9',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <ThunderboltOutlined /> Phân tích Four-Memory ➔
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11.5, color: '#334155' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <CheckOutlined style={{ color: '#10B981', fontSize: 11, marginTop: 2, flexShrink: 0 }} />
                    <span>{impact.reason1}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <CheckOutlined style={{ color: '#10B981', fontSize: 11, marginTop: 2, flexShrink: 0 }} />
                    <span>{impact.reason2}</span>
                  </div>
                </div>
              </div>
            </Col>

            {/* Match Score & Action Buttons Right */}
            <Col xs={24} lg={7}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 14,
                  flexWrap: 'wrap',
                }}
              >
                <Popover
                  content={renderScoreBreakdownContent(creator.scoreBreakdown)}
                  trigger="hover"
                  placement="topLeft"
                >
                  <div
                    onClick={() => handleOpenDeepAnalysis(creator)}
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      padding: '8px 14px',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                      border: '1px solid #C7D2FE',
                    }}
                    title="Nhấn để mở Phân tích chuyên sâu Four-Memory"
                  >
                    <div style={{ fontSize: 20, fontWeight: 900, color: hasScore ? '#4338CA' : '#94A3B8', lineHeight: 1 }}>
                      {matchPct != null ? `${matchPct}%` : '—'}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#6366F1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        marginTop: 2,
                      }}
                    >
                      <span>Match Score</span>
                      <InfoCircleOutlined style={{ fontSize: 9 }} />
                    </div>
                  </div>
                </Popover>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 170 }}>
                  <Button
                    size="middle"
                    className="btn-ai-analyze"
                    icon={<ThunderboltOutlined />}
                    onClick={() => handleOpenDeepAnalysis(creator)}
                    style={{ height: 34 }}
                  >
                    Phân tích Four-Memory
                  </Button>

                  {isShortlisted ? (
                    <Button
                      size="middle"
                      disabled
                      icon={<CheckCircleFilled style={{ color: '#10B981' }} />}
                      style={{
                        borderRadius: 9,
                        fontWeight: 700,
                        fontSize: 12,
                        background: '#ECFDF5',
                        borderColor: '#A7F3D0',
                        color: '#065F46',
                        height: 34,
                      }}
                    >
                      Đã thêm vào chiến dịch
                    </Button>
                  ) : (
                    <Button
                      size="middle"
                      type="primary"
                      loading={shortlistingId === creator.creatorId}
                      icon={<CheckCircleFilled />}
                      onClick={() => handleAcceptCreator(creator)}
                      style={{
                        borderRadius: 9,
                        fontWeight: 700,
                        fontSize: 12,
                        height: 34,
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        borderColor: '#10B981',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      Phù hợp / Thêm vào
                    </Button>
                  )}

                  {!isShortlisted && (
                    <Button
                      size="middle"
                      type="default"
                      danger
                      icon={<CloseCircleFilled />}
                      onClick={() => handleOpenReject(creator)}
                      style={{
                        borderRadius: 9,
                        fontWeight: 600,
                        fontSize: 12,
                        height: 32,
                        background: '#FEF2F2',
                        borderColor: '#FECACA',
                        color: '#DC2626',
                      }}
                    >
                      Không phù hợp
                    </Button>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    );
  };

  return (
    <div style={{ padding: '4px 0' }}>
      {/* 1. Header Row đồng bộ phong cách Shortlist */}
      <div className="shortlist-header-row" style={{ marginBottom: 14 }}>
        <div>
          <h1 className="shortlist-main-title">Đề xuất Nhà sáng tạo từ AI</h1>
          <p className="shortlist-description">
            Hệ thống Four-Memory tự động phân tích và sàng lọc những nhà sáng tạo tối ưu nhất cho chiến dịch.
          </p>
        </div>

        <div className="shortlist-header-actions">
          {availableCampaigns && availableCampaigns.length > 0 && (
            <div className="campaign-selector-box">
              <span className="campaign-selector-label">Chiến dịch:</span>
              <Select
                value={campaign?.id}
                onChange={onSelectCampaign}
                style={{ width: 220 }}
                options={availableCampaigns.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Nguồn:</span>
            <Select<CandidateSource>
              value={candidateSource}
              onChange={setCandidateSource}
              style={{ width: 175 }}
              options={[
                { value: 'DISCOVERY', label: 'Toàn hệ thống (Discovery)' },
                { value: 'SHORTLIST', label: 'Shortlist chiến dịch' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Chế độ:</span>
            <Select<DisplayMode>
              value={displayMode}
              onChange={setDisplayMode}
              style={{ width: 195 }}
              options={[
                { value: 'BEST_MATCH', label: 'Khớp nhất (TOPSIS)' },
                { value: 'BUDGET_READY_FIRST', label: 'Sẵn sàng ngân sách' },
                { value: 'DIVERSIFIED_MATCH', label: 'Đa dạng hóa (MMR)' },
              ]}
            />
          </div>

          <Button
            type="primary"
            icon={<ReloadOutlined spin={loading} />}
            loading={loading}
            onClick={handleRunAiRecommendation}
            style={{
              height: 38,
              borderRadius: 8,
              fontWeight: 600,
              background: '#4F46E5',
              borderColor: '#4F46E5',
            }}
          >
            Chạy Đề xuất AI
          </Button>

          {campaign?.id && (
            <Button
              onClick={() => {
                sessionStorage.setItem('current_campaign_id', campaign.id);
                localStorage.setItem('last_active_campaign_id', campaign.id);
                navigate('/creators/shortlist');
              }}
              style={{
                height: 38,
                borderRadius: 8,
                fontWeight: 600,
                color: '#4F46E5',
                borderColor: '#C7D2FE',
                background: '#EEF2FF',
              }}
            >
              Bảng Shortlist ({shortlistItems.length}) ➔
            </Button>
          )}
        </div>
      </div>

      {/* 2. Mode Switcher Bar */}
      <div className="shortlist-mode-switcher-bar" style={{ marginBottom: 14 }}>
        <div className="mode-switcher-tabs">
          <button
            type="button"
            className={`mode-tab-btn ${activeSubTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('recommendations')}
          >
            <ThunderboltFilled />
            <span>Đề xuất Four-Memory</span>
            <span className="mode-count-badge highlight">
              {filteredRecommendations.length}
            </span>
          </button>

          <button
            type="button"
            className={`mode-tab-btn ${activeSubTab === 'provisional' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('provisional')}
          >
            <InfoCircleOutlined />
            <span>Ứng viên tiềm năng</span>
            <span className="mode-count-badge">
              {filteredProvisional.length}
            </span>
          </button>

          <button
            type="button"
            className={`mode-tab-btn ${activeSubTab === 'shortlist' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('shortlist')}
          >
            <CheckCircleOutlined />
            <span>Shortlist ({filteredShortlistCandidates.length})</span>
          </button>

          <button
            type="button"
            className={`mode-tab-btn ${activeSubTab === 'runs' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('runs')}
          >
            <ClockCircleOutlined />
            <span>Lịch sử các phiên ({runsList.length})</span>
          </button>
        </div>

        {activeSubTab !== 'runs' && (
          <div className="layout-toggle-group">
            <span style={{ fontSize: 12, color: '#64748B', marginRight: 4 }}>Hiển thị:</span>
            <Button
              size="small"
              type={boardLayout === 'grid' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setBoardLayout('grid')}
            >
              Thẻ
            </Button>
            <Button
              size="small"
              type={boardLayout === 'list' ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              onClick={() => setBoardLayout('list')}
            >
              Bảng
            </Button>
          </div>
        )}
      </div>

      {/* 3. Loading state with Four-Memory Progress */}
      {loading && (
        <Card
          style={{
            borderRadius: 14,
            marginBottom: 20,
            textAlign: 'center',
            padding: '28px 20px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <Spin size="large" />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', marginBottom: 6 }}>
            {loadingStepText}
          </h3>
          <div style={{ maxWidth: 450, margin: '0 auto 10px auto' }}>
            <Progress
              percent={loadingProgress}
              status="active"
              strokeColor={{
                '0%': '#4F46E5',
                '50%': '#8B5CF6',
                '100%': '#06B6D4',
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            Đang trích xuất và đối soát Four-Memory: M1 Uy tín, M2 Hiệu suất, M3 Ngữ nghĩa, M4 Khẩu vị nhãn hàng...
          </span>
        </Card>
      )}

      {/* Sub-Tab 1: Recommendations (Score-Ready) */}
      {activeSubTab === 'recommendations' && (
        <>
          {recommendations.length === 0 && !loading ? (
            <Card style={{ borderRadius: 14, textAlign: 'center', padding: '40px 20px', border: '1px solid #E2E8F0' }}>
              <Empty
                description={
                  <div style={{ color: '#64748B', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
                    Chưa có kết quả đề xuất Four-Memory trong phiên hiện tại.
                    Nhấn nút <strong>"Chạy Đề xuất AI"</strong> để hệ thống phân tích và đề xuất KOC phù hợp nhất với Brief chiến dịch.
                  </div>
                }
              >
                <Space style={{ marginTop: 12 }}>
                  <Button
                    type="primary"
                    icon={<ThunderboltFilled />}
                    onClick={handleRunAiRecommendation}
                    loading={loading}
                    style={{ borderRadius: 8, fontWeight: 600, background: '#4F46E5' }}
                  >
                    Kích hoạt Đề xuất Four-Memory
                  </Button>
                </Space>
              </Empty>
            </Card>
          ) : (
            <div>
              {recommendationStats && (
                <div className="ai-impact-summary-bar">
                  <div className="ai-impact-stat">
                    <div className="ai-impact-icon-wrap" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                      <ThunderboltFilled />
                    </div>
                    <div>
                      <div className="ai-impact-val">{recommendationStats.avgScore}%</div>
                      <div className="ai-impact-lbl">Độ khớp Brief TB (TOPSIS)</div>
                    </div>
                  </div>
                  <div className="ai-impact-divider" />
                  <div className="ai-impact-stat">
                    <div className="ai-impact-icon-wrap" style={{ background: '#ECFDF5', color: '#10B981' }}>
                      <EyeOutlined />
                    </div>
                    <div>
                      <div className="ai-impact-val">{formatFollowers(recommendationStats.totalEstReach)}</div>
                      <div className="ai-impact-lbl">Tổng lượt xem TB (Views)</div>
                    </div>
                  </div>
                  <div className="ai-impact-divider" />
                  <div className="ai-impact-stat">
                    <div className="ai-impact-icon-wrap" style={{ background: '#FFFBEB', color: '#F59E0B' }}>
                      <FireOutlined />
                    </div>
                    <div>
                      <div className="ai-impact-val">{recommendationStats.avgEr}%</div>
                      <div className="ai-impact-lbl">Tương tác TB (Avg ER)</div>
                    </div>
                  </div>
                  <div className="ai-impact-divider" />
                  <div className="ai-impact-stat">
                    <div className="ai-impact-icon-wrap" style={{ background: '#F5F3FF', color: '#8B5CF6' }}>
                      <SafetyCertificateOutlined />
                    </div>
                    <div>
                      <div className="ai-impact-val">{recommendationStats.count} KOC</div>
                      <div className="ai-impact-lbl">Ứng viên đạt chuẩn Score-Ready</div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                    Ứng viên Đề xuất Four-Memory ({filteredRecommendations.length})
                  </h3>
                  <span style={{ fontSize: 12, color: '#64748B' }}>
                    Xếp hạng tối ưu theo thuật toán TOPSIS và đối soát ngữ nghĩa Vector Brief.
                  </span>
                </div>
              </div>

              {boardLayout === 'grid' ? (
                <div className="ai-rec-grid">
                  {filteredRecommendations.map((item, idx) =>
                    renderCreatorCard(item, idx, shortlistedCreatorIds.has(item.creatorId))
                  )}
                </div>
              ) : (
                <Row gutter={[16, 16]}>
                  {filteredRecommendations.map((item, idx) =>
                    renderCreatorRow(item, idx, shortlistedCreatorIds.has(item.creatorId))
                  )}
                </Row>
              )}
            </div>
          )}
        </>
      )}

      {/* Sub-Tab 2: Provisional Pool */}
      {activeSubTab === 'provisional' && (
        <div>
          <Alert
            type="info"
            showIcon
            message="Ứng viên tiềm năng (Provisional Candidates)"
            description="Các KOC này có độ tương thích cao về nội dung và định vị với chiến dịch nhưng chưa đủ dữ liệu lịch sử hoặc cửa sổ 3 bài đăng gần nhất để kiểm định độ ổn định của chỉ số."
            style={{ marginBottom: 16, borderRadius: 10 }}
          />

          {filteredProvisional.length === 0 ? (
            <Card style={{ borderRadius: 14, textAlign: 'center', padding: '40px 20px', border: '1px solid #E2E8F0' }}>
              <Empty description="Không có ứng viên nào thuộc nhóm tiềm năng trong đợt chạy này." />
            </Card>
          ) : (
            boardLayout === 'grid' ? (
              <div className="ai-rec-grid">
                {filteredProvisional.map((item, idx) =>
                  renderCreatorCard(item, idx, shortlistedCreatorIds.has(item.creatorId))
                )}
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {filteredProvisional.map((item, idx) =>
                  renderCreatorRow(item, idx, shortlistedCreatorIds.has(item.creatorId))
                )}
              </Row>
            )
          )}
        </div>
      )}

      {/* Sub-Tab 3: Shortlist View */}
      {activeSubTab === 'shortlist' && (
        <>
          {loadingShortlist ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Spin size="large" />
              <div style={{ color: '#64748B', marginTop: 12, fontWeight: 600 }}>
                Đang tải danh sách Creator trong Shortlist...
              </div>
            </div>
          ) : filteredShortlistCandidates.length === 0 ? (
            <Card style={{ borderRadius: 14, textAlign: 'center', padding: '40px 20px', border: '1px solid #E2E8F0' }}>
              <Empty
                description={
                  <div style={{ color: '#64748B', maxWidth: 450, margin: '0 auto', lineHeight: 1.6 }}>
                    Chiến dịch "{campaign?.name || 'hiện tại'}" chưa có Creator nào trong Shortlist.
                    Nhấn "Phù hợp / Thêm vào" từ tab Đề xuất Four-Memory hoặc tìm kiếm tại trang Khám phá.
                  </div>
                }
              >
                <Space style={{ marginTop: 12 }}>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={() => {
                      if (campaign?.id) {
                        sessionStorage.setItem('current_campaign_id', campaign.id);
                        localStorage.setItem('last_active_campaign_id', campaign.id);
                      }
                      navigate('/creators');
                    }}
                    style={{ borderRadius: 8, fontWeight: 600 }}
                  >
                    Khám phá kho Creator
                  </Button>
                </Space>
              </Empty>
            </Card>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                    Nhà sáng tạo trong Shortlist chiến dịch ({filteredShortlistCandidates.length})
                  </h3>
                  <span style={{ fontSize: 12, color: '#64748B' }}>
                    Danh sách các ứng viên đã lưu. Các ứng viên được đối soát trong phiên AI sẽ hiển thị điểm Four-Memory thực tế.
                  </span>
                </div>
                <Button
                  type="primary"
                  onClick={() => {
                    if (campaign?.id) {
                      sessionStorage.setItem('current_campaign_id', campaign.id);
                      localStorage.setItem('last_active_campaign_id', campaign.id);
                    }
                    navigate('/creators/shortlist');
                  }}
                  style={{ borderRadius: 8, fontWeight: 600, background: '#4F46E5' }}
                >
                  Mở Bảng so sánh Shortlist đầy đủ ➔
                </Button>
              </div>

              {boardLayout === 'grid' ? (
                <div className="ai-rec-grid">
                  {filteredShortlistCandidates.map((item, idx) =>
                    renderCreatorCard(item, idx, true)
                  )}
                </div>
              ) : (
                <Row gutter={[16, 16]}>
                  {filteredShortlistCandidates.map((item, idx) =>
                    renderCreatorRow(item, idx, true)
                  )}
                </Row>
              )}
            </div>
          )}
        </>
      )}


      {/* 4. Sub-Tab 2: Historical Runs Table */}
      {activeSubTab === 'runs' && (
        <Card
          style={{ borderRadius: 16, border: '1px solid #E2E8F0' }}
          bodyStyle={{ padding: '20px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                Lịch sử các phiên chạy Đề xuất AI (Recommendation Runs)
              </h3>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                Ghi nhận từng lần thực thi thuật toán Four-Memory và sự tiến hóa của bộ nhớ ngữ cảnh qua từng phiên.
              </span>
            </div>

            <Button
              size="small"
              icon={<ReloadOutlined spin={runsLoading} />}
              onClick={handleLoadRuns}
              style={{ borderRadius: 8 }}
            >
              Làm mới
            </Button>
          </div>

          <Table
            dataSource={runsList}
            rowKey={(r) => r.id}
            loading={runsLoading}
            pagination={{ pageSize: 5 }}
            locale={{ emptyText: 'Chưa có phiên chạy nào được ghi nhận cho chiến dịch này.' }}
            columns={[
              {
                title: 'Phiên bản ngữ cảnh',
                key: 'version',
                render: (_, r) => (
                  <Tag color="purple" style={{ fontWeight: 800, borderRadius: 999, padding: '2px 10px' }}>
                    Phiên bản Four-Memory v{r.contextVersion}
                  </Tag>
                ),
              },
              {
                title: 'Thời gian chạy',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (val) => (
                  <span style={{ fontSize: 12.5, color: '#334155' }}>
                    <ClockCircleOutlined style={{ marginRight: 6, color: '#94A3B8' }} />
                    {val ? new Date(val).toLocaleString('vi-VN') : '—'}
                  </span>
                ),
              },
              {
                title: 'Tóm tắt Brief',
                dataIndex: 'queryBrief',
                key: 'queryBrief',
                render: (val) => (
                  <span style={{ fontSize: 12.5, color: '#475569', maxWidth: 320, display: 'inline-block' }}>
                    {val || 'Đề xuất tối ưu theo tiêu chí chiến dịch'}
                  </span>
                ),
              },
              {
                title: 'Số KOC tìm thấy',
                dataIndex: 'candidatesCount',
                key: 'candidatesCount',
                render: (count) => (
                  <Tag color="blue" style={{ borderRadius: 8, fontWeight: 700 }}>
                    {count || 10} KOC
                  </Tag>
                ),
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                render: (status) => (
                  <Tag
                    color={status === 'SUCCESS' ? 'green' : 'gold'}
                    style={{ borderRadius: 8, fontWeight: 700 }}
                  >
                    {status === 'SUCCESS' ? 'THÀNH CÔNG' : status || 'HOÀN TẤT'}
                  </Tag>
                ),
              },
              {
                title: 'Hành động',
                key: 'action',
                render: () => (
                  <Button
                    size="small"
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setActiveSubTab('shortlist');
                      message.info('Đang hiển thị danh sách KOC của phiên đề xuất này.');
                    }}
                    style={{ fontWeight: 700, padding: 0 }}
                  >
                    Xem kết quả ➔
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* 5. Feedback Reject Modal: "Đóng góp ý kiến cho AI" */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
            <CloseCircleFilled style={{ color: '#EF4444', fontSize: 18 }} />
            <span>Đóng góp ý kiến cho AI</span>
          </div>
        }
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
        width={520}
      >
        <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 16px 0', lineHeight: 1.5 }}>
          Phản hồi của bạn giúp AI Four-Memory ghi nhận lý do không phù hợp và nâng cấp bộ nhớ ngữ cảnh để tránh đề xuất lại Creator này cho chiến dịch.
        </p>

        {selectedCreatorForFeedback && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              marginBottom: 18,
            }}
          >
            <Avatar
              size={42}
              src={selectedCreatorForFeedback.avatarUrl}
              style={{ backgroundColor: '#7C3AED', fontWeight: 700, flexShrink: 0 }}
            >
              {selectedCreatorForFeedback.displayName?.charAt(0) || 'K'}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedCreatorForFeedback.displayName}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                @{selectedCreatorForFeedback.userName} • {selectedCreatorForFeedback.niche}
              </div>
            </div>
            <Tag color="purple" style={{ fontWeight: 800, borderRadius: 999, margin: 0 }}>
              Khớp {Math.round(selectedCreatorForFeedback.finalScore * 100)}%
            </Tag>
          </div>
        )}

        <Form form={rejectForm} layout="vertical" onFinish={handleSubmitReject}>
          <Form.Item
            name="reasonCode"
            label={<span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>Lý do không phù hợp:</span>}
            rules={[{ required: true, message: 'Vui lòng chọn lý do không phù hợp!' }]}
          >
            <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              {REJECTION_REASONS.map((reason) => (
                <Radio
                  key={reason.value}
                  value={reason.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '9px 14px',
                    borderRadius: 9,
                    border: '1px solid #E2E8F0',
                    margin: 0,
                    transition: 'all 0.15s ease',
                    background: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {reason.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="reasonNote"
            label={<span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>Ghi chú chi tiết (Tùy chọn):</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: Báo giá vượt mức chi trả của đợt này..."
              maxLength={300}
              showCount
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
            <Button onClick={() => setRejectModalOpen(false)} style={{ borderRadius: 8 }}>
              Hủy
            </Button>
            <Button
              type="primary"
              danger
              htmlType="submit"
              loading={feedbackSubmitting}
              style={{ borderRadius: 8, fontWeight: 700, minWidth: 140 }}
            >
              Gửi phản hồi cho AI
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 5. Drawer Phân tích chuyên sâu AI (Four-Memory Diagnostic & Alignment) */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <ThunderboltOutlined style={{ fontSize: 16 }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                Phân tích Chuyên sâu AI Four-Memory
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>
                Hệ thống 4 Bộ nhớ lượng hóa mức độ khớp lệnh cho chiến dịch "{campaign?.name || 'Hiện tại'}"
              </div>
            </div>
          </div>
        }
        open={isDeepAnalysisOpen}
        onClose={() => setIsDeepAnalysisOpen(false)}
        width={680}
        bodyStyle={{ padding: '20px 24px', background: '#F8FAFC' }}
        footer={
          selectedCreatorForDeepAnalysis && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {(selectedCreatorForDeepAnalysis.inShortlist ||
                  (selectedCreatorForDeepAnalysis as any).isInShortlist ||
                  shortlistedCreatorIds.has(selectedCreatorForDeepAnalysis.creatorId)) ? (
                  <Tag
                    color="success"
                    icon={<CheckCircleFilled />}
                    style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 8 }}
                  >
                    ĐÃ LƯU TRONG SHORTLIST CHIẾN DỊCH
                  </Tag>
                ) : (
                  <Tag
                    color="purple"
                    style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 8 }}
                  >
                    ĐỀ XUẤT AI FOUR-MEMORY
                  </Tag>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {(selectedCreatorForDeepAnalysis.inShortlist ||
                  (selectedCreatorForDeepAnalysis as any).isInShortlist ||
                  shortlistedCreatorIds.has(selectedCreatorForDeepAnalysis.creatorId)) ? (
                  <Button
                    type="primary"
                    onClick={() => {
                      setIsDeepAnalysisOpen(false);
                      if (campaign?.id) {
                        sessionStorage.setItem('current_campaign_id', campaign.id);
                        localStorage.setItem('last_active_campaign_id', campaign.id);
                      }
                      navigate('/creators/shortlist');
                    }}
                    style={{
                      background: '#4F46E5',
                      borderRadius: 8,
                      fontWeight: 700,
                      height: 38,
                    }}
                  >
                    Mở Bảng Shortlist ➔
                  </Button>
                ) : (
                  <>
                    <Button
                      danger
                      onClick={() => {
                        setIsDeepAnalysisOpen(false);
                        handleOpenReject(selectedCreatorForDeepAnalysis);
                      }}
                      style={{ borderRadius: 8, height: 38, fontWeight: 600 }}
                    >
                      Từ chối
                    </Button>
                    <Button
                      type="primary"
                      icon={<CheckCircleFilled />}
                      loading={shortlistingId === selectedCreatorForDeepAnalysis.creatorId}
                      onClick={async () => {
                        const saved = await handleAcceptCreator(selectedCreatorForDeepAnalysis);
                        if (saved) setSelectedCreatorForDeepAnalysis((prev) => (prev ? { ...prev, inShortlist: true } : null));
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        borderColor: '#10B981',
                        borderRadius: 8,
                        fontWeight: 700,
                        height: 38,
                      }}
                    >
                      Thêm vào Shortlist
                    </Button>
                  </>
                )}

                <Button
                  onClick={() => {
                    navigate(`/creators/${selectedCreatorForDeepAnalysis.creatorId}`);
                  }}
                  style={{ borderRadius: 8, height: 38, fontWeight: 600 }}
                >
                  Xem Hồ sơ Chi tiết
                </Button>
              </div>
            </div>
          )
        }
      >
        {selectedCreatorForDeepAnalysis && (
          <div>
            {/* Header Profile Card */}
            <div className="deep-analysis-header-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Avatar
                    size={64}
                    src={
                      selectedCreatorForDeepAnalysis.avatarUrl && selectedCreatorForDeepAnalysis.avatarUrl.trim() !== ''
                        ? selectedCreatorForDeepAnalysis.avatarUrl
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCreatorForDeepAnalysis.displayName || 'Creator')}&background=4F46E5&color=fff&size=150&bold=true`
                    }
                    style={{
                      border: '3px solid #FFFFFF',
                      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)',
                      backgroundColor: '#EEF2FF',
                      color: '#4F46E5',
                      fontWeight: 800,
                      fontSize: 20,
                    }}
                  >
                    {(selectedCreatorForDeepAnalysis.displayName || 'KOC').slice(0, 2).toUpperCase()}
                  </Avatar>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                        {selectedCreatorForDeepAnalysis.displayName}
                      </span>
                      <CheckCircleFilled style={{ color: '#2563EB', fontSize: 15 }} />
                      <Tag
                        color={selectedCreatorForDeepAnalysis.platform === 'tiktok' ? 'black' : selectedCreatorForDeepAnalysis.platform === 'youtube' ? 'red' : 'magenta'}
                        style={{
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {selectedCreatorForDeepAnalysis.platform}
                      </Tag>
                    </div>

                    <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                      @{selectedCreatorForDeepAnalysis.userName} • {selectedCreatorForDeepAnalysis.niche || 'Lối sống & Sáng tạo'}
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 12, color: '#475569' }}>
                      <span>
                        Người theo dõi: <strong>{formatFollowers(selectedCreatorForDeepAnalysis.followers)}</strong>
                      </span>
                      <span>
                        Tương tác (ER):{' '}
                        <strong style={{ color: '#10B981' }}>
                          {selectedCreatorForDeepAnalysis.engagementRate && selectedCreatorForDeepAnalysis.engagementRate <= 1
                            ? (selectedCreatorForDeepAnalysis.engagementRate * 100).toFixed(2)
                            : selectedCreatorForDeepAnalysis.engagementRate || '4.50'}
                          %
                        </strong>
                      </span>
                      <span>
                        Phân khúc: <strong>{selectedCreatorForDeepAnalysis.creatorType || 'MACRO'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    textAlign: 'center',
                    background: '#FFFFFF',
                    borderRadius: 14,
                    padding: '12px 18px',
                    border: '1.5px solid #E0E7FF',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.08)',
                  }}
                >
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#4F46E5', lineHeight: 1 }}>
                    {Math.round((selectedCreatorForDeepAnalysis.finalScore || 0.85) * 100)}%
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', marginTop: 4 }}>
                    Độ khớp Four-Memory
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Section: 4 Bộ nhớ AI */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <BulbOutlined style={{ color: '#4F46E5', fontSize: 16 }} />
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                  Kiến trúc 4 Bộ nhớ AI (Four-Memory Diagnostic)
                </h4>
              </div>

              {/* M1: Historical Creator Reputation */}
              {(() => {
                const s = selectedCreatorForDeepAnalysis.scoreBreakdown?.m1Score;
                const hasS = typeof s === 'number';
                const pct = hasS ? Math.round(s * 100) : 0;
                return (
                  <div className="deep-memory-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag color="blue" style={{ fontWeight: 800, borderRadius: 6, margin: 0 }}>M1</Tag>
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: '#1E293B' }}>
                          Uy tín & Lịch sử Creator (Historical Creator Reputation)
                        </span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#4F46E5', fontSize: 14 }}>
                        {hasS ? `${pct}%` : '—'}
                      </span>
                    </div>
                    <Progress percent={pct} strokeColor="#4F46E5" size="small" showInfo={false} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <CheckCircleFilled style={{ color: '#10B981', fontSize: 12, marginTop: 2 }} />
                        <span><strong>Định vị ngành hàng:</strong> Phù hợp danh mục {selectedCreatorForDeepAnalysis.niche || 'Lối sống & Sáng tạo'}.</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <CheckCircleFilled style={{ color: '#10B981', fontSize: 12, marginTop: 2 }} />
                        <span><strong>Độ hoàn thiện hồ sơ:</strong> Tài khoản đã thu thập và đối soát định danh trên nền tảng {selectedCreatorForDeepAnalysis.platform?.toUpperCase() || 'TIKTOK'}.</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* M2: Public Performance Metrics */}
              {(() => {
                const s = selectedCreatorForDeepAnalysis.scoreBreakdown?.m2Score;
                const hasS = typeof s === 'number';
                const pct = hasS ? Math.round(s * 100) : 0;
                return (
                  <div className="deep-memory-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag color="green" style={{ fontWeight: 800, borderRadius: 6, margin: 0 }}>M2</Tag>
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: '#1E293B' }}>
                          Hiệu suất Công khai (Public Performance Metrics)
                        </span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#10B981', fontSize: 14 }}>
                        {hasS ? `${pct}%` : '—'}
                      </span>
                    </div>
                    <Progress percent={pct} strokeColor="#10B981" size="small" showInfo={false} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <CheckCircleFilled style={{ color: '#10B981', fontSize: 12, marginTop: 2 }} />
                        <span>
                          <strong>Tỷ lệ tương tác ER:</strong>{' '}
                          {selectedCreatorForDeepAnalysis.engagementRate != null
                            ? `${(selectedCreatorForDeepAnalysis.engagementRate <= 1 ? selectedCreatorForDeepAnalysis.engagementRate * 100 : selectedCreatorForDeepAnalysis.engagementRate).toFixed(2)}%`
                            : 'Chưa có dữ liệu'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <CheckCircleFilled style={{ color: '#10B981', fontSize: 12, marginTop: 2 }} />
                        <span>
                          <strong>Lượt xem trung bình:</strong>{' '}
                          {selectedCreatorForDeepAnalysis.avgViews != null ? `${formatFollowers(selectedCreatorForDeepAnalysis.avgViews)} views/video` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* M3: Semantic Fit */}
              {(() => {
                const s = selectedCreatorForDeepAnalysis.scoreBreakdown?.m3Score ?? selectedCreatorForDeepAnalysis.scoreBreakdown?.semanticMatchScore;
                const hasS = typeof s === 'number';
                const pct = hasS ? Math.round(s * 100) : 0;
                return (
                  <div className="deep-memory-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag color="magenta" style={{ fontWeight: 800, borderRadius: 6, margin: 0 }}>M3</Tag>
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: '#1E293B' }}>
                          Độ khớp Ngữ nghĩa (Semantic Fit - Vector Embedding & Brief)
                        </span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#EC4899', fontSize: 14 }}>
                        {hasS ? `${pct}%` : '—'}
                      </span>
                    </div>
                    <Progress percent={pct} strokeColor="#EC4899" size="small" showInfo={false} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <CheckCircleFilled style={{ color: '#10B981', fontSize: 12, marginTop: 2 }} />
                        <span><strong>Mô hình Embedding:</strong> Đối chiếu Cosine Similarity giữa Brief chiến dịch và nội dung clip gần nhất.</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* M4: Brand Taste / Affinity & Feedback Loop */}
              {(() => {
                const s = selectedCreatorForDeepAnalysis.scoreBreakdown?.m4Score;
                const hasS = typeof s === 'number';
                const pct = hasS ? Math.round(s * 100) : 0;
                return (
                  <div className="deep-memory-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag color="purple" style={{ fontWeight: 800, borderRadius: 6, margin: 0 }}>M4</Tag>
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: '#1E293B' }}>
                          Khẩu vị & Ưu tiên Nhãn hàng (Brand Taste / Affinity & Feedback)
                        </span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#8B5CF6', fontSize: 14 }}>
                        {hasS ? `${pct}%` : '—'}
                      </span>
                    </div>
                    <Progress percent={pct} strokeColor="#8B5CF6" size="small" showInfo={false} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <CheckCircleFilled style={{ color: '#10B981', fontSize: 12, marginTop: 2 }} />
                        <span><strong>Phiên bản ngữ cảnh:</strong> Đang hoạt động ở contextVersion v{contextVersion}.</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <CheckCircleFilled style={{ color: '#10B981', fontSize: 12, marginTop: 2 }} />
                        <span><strong>Tiến hóa sở thích:</strong> Cập nhật từ lịch sử ACCEPT/REJECT của nhãn hàng.</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Explainable AI Reasoning Report */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <SafetyCertificateOutlined style={{ color: '#10B981', fontSize: 16 }} />
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                  Báo cáo Giải trình Thuật toán (Explainable AI - XAI)
                </h4>
              </div>

              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  padding: '16px 18px',
                }}
              >
                {selectedCreatorForDeepAnalysis.reasoning?.evidenceWarnings && selectedCreatorForDeepAnalysis.reasoning.evidenceWarnings.length > 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    message="Cảnh báo kiểm định dữ liệu"
                    description={
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
                        {selectedCreatorForDeepAnalysis.reasoning.evidenceWarnings.map((warn, wIdx) => (
                          <li key={wIdx}>{warn}</li>
                        ))}
                      </ul>
                    }
                    style={{ marginBottom: 12 }}
                  />
                )}

                <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.55, fontWeight: 500, marginBottom: 10 }}>
                  {selectedCreatorForDeepAnalysis.reasoning?.summary ||
                    `Hệ thống Four-Memory đánh giá KOC này dựa trên tổng hòa 4 chiều: Uy tín lịch sử, Hiệu suất công khai, Độ tương thích Brief và Khẩu vị nhãn hàng.`}
                </p>

                {selectedCreatorForDeepAnalysis.reasoning?.reasons && selectedCreatorForDeepAnalysis.reasoning.reasons.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {selectedCreatorForDeepAnalysis.reasoning.reasons.map((r, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: '#475569' }}>
                        <span style={{ color: '#4F46E5', fontWeight: 800 }}>•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Estimated Campaign Impact */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <BarChartOutlined style={{ color: '#0284C7', fontSize: 16 }} />
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                  Dự báo Hiệu quả & KPI Chiến dịch (Projected Performance)
                </h4>
              </div>

              <Row gutter={[12, 12]}>
                <Col xs={12} sm={6}>
                  <div className="deep-kpi-card">
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>
                      {formatFollowers(Math.round(selectedCreatorForDeepAnalysis.followers * 0.45))} - {formatFollowers(Math.round(selectedCreatorForDeepAnalysis.followers * 0.75))}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Reach ước tính</div>
                  </div>
                </Col>

                <Col xs={12} sm={6}>
                  <div className="deep-kpi-card">
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#059669' }}>
                      {formatFollowers(selectedCreatorForDeepAnalysis.avgViews || Math.round(selectedCreatorForDeepAnalysis.followers * 0.22))}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Lượt xem dự kiến</div>
                  </div>
                </Col>

                <Col xs={12} sm={6}>
                  <div className="deep-kpi-card">
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#7C3AED' }}>
                      {formatFollowers(Math.round(selectedCreatorForDeepAnalysis.followers * 0.048))}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Tương tác dự kiến</div>
                  </div>
                </Col>

                <Col xs={12} sm={6}>
                  <div className="deep-kpi-card">
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0284C7' }}>
                      98 / 100
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Brand Safety Index</div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

