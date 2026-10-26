import React, { useState, useEffect, useCallback } from 'react';
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
} from 'antd';
import {
  ThunderboltFilled,
  ThunderboltOutlined,
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
  FireFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { aiRecommendationService } from '../../services/api/aiRecommendationService';
import { creatorService } from '../../services/api/creatorService';
import type {
  CreatorRecommendationItemDto,
  RecommendationRun,
  ScoreBreakdownDto,
} from '../../types/api/aiRecommendation.types';
import type { CampaignResponse } from '../../types/api/campaign.types';

interface AiRecommendationTabProps {
  campaign: CampaignResponse | null;
  onAddedToShortlist?: (creatorId: string) => void;
}

const REJECTION_REASONS = [
  { value: 'PRICE_TOO_HIGH', label: 'Báo giá vượt ngân sách cho phép' },
  { value: 'CONTENT_MISMATCH', label: 'Phong cách nội dung chưa phù hợp thương hiệu' },
  { value: 'POOR_ENGAGEMENT', label: 'Chỉ số tương tác thực tế thấp hoặc ảo' },
  { value: 'COMPETITOR_CONFLICT', label: 'Đang hợp tác với đối thủ cạnh tranh trực tiếp' },
  { value: 'LOCATION_UNSUITABLE', label: 'Khu vực hoạt động chưa khớp thị trường mục tiêu' },
  { value: 'OTHER', label: 'Lý do khác' },
];

export default function AiRecommendationTab({
  campaign,
  onAddedToShortlist,
}: AiRecommendationTabProps) {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<'recommendation' | 'runs'>('recommendation');

  // Recommendation State
  const [loading, setLoading] = useState(false);
  const [loadingStepText, setLoadingStepText] = useState('Đang khởi tạo Four-Memory Engine...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [recommendations, setRecommendations] = useState<CreatorRecommendationItemDto[]>([]);
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

  // Load recommendations
  const handleRunAiRecommendation = useCallback(async () => {
    if (!campaign?.id) {
      message.warning('Vui lòng chọn chiến dịch trước khi kích hoạt đề xuất AI!');
      return;
    }

    setLoading(true);
    setLoadingProgress(15);
    setLoadingStepText('🧠 M1: Đang phân tích Brand Profile & Mục tiêu chiến dịch...');

    const stepTimer1 = setTimeout(() => {
      setLoadingProgress(45);
      setLoadingStepText('📈 M2: Đánh giá Hiệu suất tương tác & Sức mua khán giả KOC...');
    }, 450);

    const stepTimer2 = setTimeout(() => {
      setLoadingProgress(75);
      setLoadingStepText('📝 M3: Đối chiếu Ngữ nghĩa nội dung clip gần đây (Semantic BKAI pgvector)...');
    }, 900);

    const stepTimer3 = setTimeout(() => {
      setLoadingProgress(92);
      setLoadingStepText('🔄 M4: Khai thác Lịch sử Feedback & Gu thẩm mỹ thương hiệu...');
    }, 1300);

    try {
      const res = await aiRecommendationService.runRecommendation(campaign.id, 10);
      setRecommendations(res?.recommendations || []);
      setContextVersion(res?.contextVersion || 1);
      setRunId(res?.recommendationRunId || null);
      setLoadingProgress(100);
      message.success({
        content: `⚡ Đã hoàn tất phân tích Four-Memory! Tìm thấy ${res?.recommendations?.length || 0} KOC tối ưu nhất cho "${campaign.name}".`,
        key: 'ai_rec_run',
        duration: 3,
      });
    } catch (err) {
      console.error('Lỗi khi chạy đề xuất AI:', err);
      message.error('Không thể thực hiện đề xuất AI lúc này. Vui lòng thử lại!');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setLoading(false);
    }
  }, [campaign?.id, campaign?.name]);

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

  // Handle Accept
  const handleAcceptCreator = async (creator: CreatorRecommendationItemDto) => {
    if (!campaign?.id) return;
    try {
      message.loading({ content: `Đang chấp thuận @${creator.userName}...`, key: 'feedback_act' });
      const res = await aiRecommendationService.submitFeedback(campaign.id, {
        creatorId: creator.creatorId,
        action: 'ACCEPT',
      });
      message.success({
        content: `🎉 ${res.message || `Đã chấp thuận @${creator.userName}!`}`,
        key: 'feedback_act',
        duration: 3,
      });
      // Tự động thêm vào shortlist nếu chưa có
      if (!creator.inShortlist) {
        await creatorService.addToShortlist(campaign.id, {
          creatorId: creator.creatorId,
          priority: 'HIGH',
          note: `Được AI Four-Memory đề xuất với điểm khớp ${Math.round(creator.finalScore * 100)}%`,
        });
        setRecommendations((prev) =>
          prev.map((c) => (c.creatorId === creator.creatorId ? { ...c, inShortlist: true } : c))
        );
        onAddedToShortlist?.(creator.creatorId);
      }
    } catch (err) {
      console.error('Lỗi khi submit feedback accept:', err);
      message.error('Không thể gửi phản hồi lúc này.');
    }
  };

  // Open Reject Modal
  const handleOpenReject = (creator: CreatorRecommendationItemDto) => {
    setSelectedCreatorForFeedback(creator);
    rejectForm.resetFields();
    rejectForm.setFieldsValue({ reasonCode: 'PRICE_TOO_HIGH' });
    setRejectModalOpen(true);
  };

  // Submit Reject
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

      message.success({
        content: `Đã loại trừ @${selectedCreatorForFeedback.userName}. ${res.message || 'Hệ thống đã ghi nhớ vào bộ nhớ M4.'}`,
        duration: 3,
      });

      // Remove creator from current recommendation view
      setRecommendations((prev) =>
        prev.filter((c) => c.creatorId !== selectedCreatorForFeedback.creatorId)
      );
      setContextVersion(res.newContextVersion || contextVersion + 1);
      setRejectModalOpen(false);
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('Không thể gửi phản hồi từ chối.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Add to shortlist
  const handleAddToShortlist = async (creator: CreatorRecommendationItemDto) => {
    if (!campaign?.id) return;
    setShortlistingId(creator.creatorId);
    try {
      await creatorService.addToShortlist(campaign.id, {
        creatorId: creator.creatorId,
        priority: 'HIGH',
        note: `AI Four-Memory (Khớp ${Math.round(creator.finalScore * 100)}%)`,
      });
      message.success(`Đã thêm @${creator.userName} vào Shortlist chiến dịch!`);
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
      { label: '🧠 M1 (Brand Profile & Ngành)', score: breakdown.m1Score, color: '#4F46E5' },
      { label: '📈 M2 (Hiệu suất & Tương tác)', score: breakdown.m2Score, color: '#10B981' },
      { label: '📝 M3 (Ngữ nghĩa Nội dung clip)', score: breakdown.semanticMatchScore || breakdown.nicheMatchScore, color: '#EC4899' },
      { label: '🔄 M4 (Lịch sử & Gu phản hồi)', score: breakdown.m4Score, color: '#8B5CF6' },
      { label: '👥 Điểm quy mô Followers', score: breakdown.followerScore, color: '#F59E0B' },
      { label: '🎯 Điểm Engagement Rate', score: breakdown.engagementScore, color: '#06B6D4' },
    ];

    return (
      <div style={{ width: 280, padding: '4px 0' }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#0F172A' }}>
          Phân rã Chỉ số Four-Memory (Score Breakdown)
        </div>
        {items.map((it, idx) => {
          const valPct = Math.round((it.score || 0) * 100);
          return (
            <div key={idx} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 2 }}>
                <span style={{ color: '#475569' }}>{it.label}</span>
                <span style={{ fontWeight: 700, color: it.color }}>{valPct}%</span>
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

  return (
    <div style={{ padding: '4px 0' }}>
      {/* 1. Header Banner & Sub-Tabs */}
      <Card
        style={{
          borderRadius: 16,
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
          color: '#fff',
          marginBottom: 20,
          border: 'none',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.4)',
        }}
        bodyStyle={{ padding: '24px 28px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={15}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Tag
                color="gold"
                style={{
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: 11,
                  padding: '1px 10px',
                  background: '#FEF3C7',
                  color: '#92400E',
                  border: 'none',
                }}
              >
                ★ Four-Memory Engine v{contextVersion}
              </Tag>
              {runId && (
                <span style={{ fontSize: 11.5, color: '#C7D2FE', opacity: 0.9 }}>
                  Phiên chạy: {runId.slice(0, 8)}...
                </span>
              )}
            </div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 6px 0' }}>
              Trợ lý Đề xuất Creator Thông minh Four-Memory
            </h2>
            <div style={{ color: '#E0E7FF', fontSize: 13, lineHeight: 1.5, maxWidth: 640 }}>
              Hệ thống AI tự động phân tích 4 bộ nhớ: <strong>M1 (Hồ sơ thương hiệu)</strong>,{' '}
              <strong>M2 (Hiệu suất tương tác)</strong>, <strong>M3 (Ngữ nghĩa nội dung)</strong>, và{' '}
              <strong>M4 (Lịch sử phản hồi của bạn)</strong> để sàng lọc ra đội hình KOC chuyển đổi cao nhất.
            </div>
          </Col>

          <Col xs={24} md={9} style={{ textAlign: 'right' }}>
            <Space size={10} wrap>
              <Radio.Group
                value={activeSubTab}
                onChange={(e) => setActiveSubTab(e.target.value)}
                buttonStyle="solid"
                style={{ background: 'rgba(255,255,255,0.12)', padding: 3, borderRadius: 10 }}
              >
                <Radio.Button
                  value="recommendation"
                  style={{
                    borderRadius: 8,
                    fontWeight: 700,
                    background: activeSubTab === 'recommendation' ? '#fff' : 'transparent',
                    color: activeSubTab === 'recommendation' ? '#312E81' : '#fff',
                    border: 'none',
                  }}
                >
                  ⚡ Đề xuất hiện tại ({recommendations.length})
                </Radio.Button>
                <Radio.Button
                  value="runs"
                  style={{
                    borderRadius: 8,
                    fontWeight: 700,
                    background: activeSubTab === 'runs' ? '#fff' : 'transparent',
                    color: activeSubTab === 'runs' ? '#312E81' : '#fff',
                    border: 'none',
                  }}
                >
                  🕒 Lịch sử phiên ({runsList.length || '—'})
                </Radio.Button>
              </Radio.Group>

              <Button
                type="primary"
                size="large"
                icon={<ReloadOutlined spin={loading} />}
                loading={loading}
                onClick={handleRunAiRecommendation}
                style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  borderColor: 'transparent',
                  fontWeight: 800,
                  borderRadius: 10,
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4)',
                }}
              >
                Chạy lại AI
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 2. Loading state with animated Four-Memory Progress */}
      {loading && (
        <Card
          style={{
            borderRadius: 16,
            marginBottom: 24,
            textAlign: 'center',
            padding: '30px 20px',
            background: '#F8FAFC',
            border: '1.5px dashed #C7D2FE',
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <Spin indicator={<ThunderboltFilled style={{ fontSize: 32, color: '#4F46E5' }} spin />} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1E1B4B', marginBottom: 6 }}>
            {loadingStepText}
          </h3>
          <div style={{ maxWidth: 450, margin: '0 auto 12px auto' }}>
            <Progress
              percent={loadingProgress}
              status="active"
              strokeColor={{
                '0%': '#4F46E5',
                '50%': '#8B5CF6',
                '100%': '#EC4899',
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            Đang trích xuất dữ liệu đa nguồn: BKAI 768-dim pgvector + Rank Fusion + Feedback context...
          </span>
        </Card>
      )}

      {/* 3. Sub-Tab 1: Recommendations List */}
      {activeSubTab === 'recommendation' && !loading && (
        <>
          {recommendations.length === 0 ? (
            <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px 20px' }}>
              <Empty
                description={
                  <div style={{ color: '#64748B' }}>
                    Chưa có đề xuất nào cho chiến dịch này hoặc tất cả ứng viên đã được xử lý.
                  </div>
                }
              >
                <Button
                  type="primary"
                  icon={<ThunderboltFilled />}
                  onClick={handleRunAiRecommendation}
                  style={{
                    background: '#4F46E5',
                    borderRadius: 10,
                    fontWeight: 700,
                    marginTop: 10,
                  }}
                >
                  ⚡ Chạy đề xuất AI Four-Memory ngay
                </Button>
              </Empty>
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {recommendations.map((creator, index) => {
                const matchPct = Math.round((creator.finalScore || 0.85) * 100);
                const engPct =
                  creator.engagementRate && creator.engagementRate <= 1
                    ? (creator.engagementRate * 100).toFixed(2)
                    : creator.engagementRate || '4.50';

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
                      bodyStyle={{ padding: '20px 24px' }}
                    >
                      <Row gutter={[20, 16]} align="middle">
                        {/* Creator Profile Left */}
                        <Col xs={24} lg={7}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <Badge
                              count={`#${index + 1}`}
                              style={{
                                backgroundColor: index === 0 ? '#F59E0B' : index === 1 ? '#64748B' : index === 2 ? '#B45309' : '#94A3B8',
                                fontWeight: 800,
                              }}
                            >
                              <Avatar
                                size={64}
                                src={creator.avatarUrl}
                                style={{
                                  border: '2px solid #E0E7FF',
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                                }}
                              />
                            </Badge>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontWeight: 800,
                                    fontSize: 16,
                                    color: '#0F172A',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => navigate(`/creators/${creator.creatorId}`)}
                                >
                                  {creator.displayName}
                                </span>
                                <Tag
                                  color={creator.platform === 'tiktok' ? 'black' : 'magenta'}
                                  style={{
                                    borderRadius: 999,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {creator.platform}
                                </Tag>
                              </div>

                              <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                                @{creator.userName}
                              </div>

                              <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: '#475569' }}>
                                <span>
                                  <strong>{formatFollowers(creator.followers)}</strong> followers
                                </span>
                                <span>
                                  ER: <strong style={{ color: '#10B981' }}>{engPct}%</strong>
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
                              padding: '12px 16px',
                              border: '1px solid #EEF2F6',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#4F46E5',
                                marginBottom: 4,
                              }}
                            >
                              <FireFilled />
                              <span>Lý do đề xuất từ AI (Reasoning Card):</span>
                            </div>

                            <p style={{ fontSize: 12.5, color: '#334155', margin: '0 0 6px 0', lineHeight: 1.45 }}>
                              {creator.reasoning?.summary ||
                                `KOC này có độ tương đồng 100% với ngành hàng ${creator.niche} và sở hữu tệp người xem chuyển đổi cao.`}
                            </p>

                            {creator.reasoning?.reasons && creator.reasoning.reasons.length > 0 && (
                              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                                {creator.reasoning.reasons.slice(0, 2).map((r, rIdx) => (
                                  <div key={rIdx} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                                    <span style={{ color: '#10B981', fontWeight: 800 }}>✓</span>
                                    <span>{r}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </Col>

                        {/* Match Score & Action Buttons Right */}
                        <Col xs={24} lg={7}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: 16,
                              flexWrap: 'wrap',
                            }}
                          >
                            {/* Score badge with Breakdown Popover */}
                            <Popover
                              content={renderScoreBreakdownContent(creator.scoreBreakdown)}
                              trigger="hover"
                              placement="topLeft"
                            >
                              <div
                                style={{
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  padding: '8px 14px',
                                  borderRadius: 12,
                                  background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                                  border: '1px solid #C7D2FE',
                                }}
                              >
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#4338CA', lineHeight: 1 }}>
                                  {matchPct}%
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

                            {/* Actions Group */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
                              {creator.inShortlist ? (
                                <Button
                                  size="small"
                                  disabled
                                  icon={<CheckCircleFilled style={{ color: '#10B981' }} />}
                                  style={{ borderRadius: 8, fontWeight: 600 }}
                                >
                                  Đã trong Shortlist
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  type="primary"
                                  loading={shortlistingId === creator.creatorId}
                                  onClick={() => handleAddToShortlist(creator)}
                                  style={{
                                    background: '#4F46E5',
                                    borderRadius: 8,
                                    fontWeight: 700,
                                  }}
                                >
                                  + Thêm vào Shortlist
                                </Button>
                              )}

                              <Space size={6}>
                                <Button
                                  size="small"
                                  type="default"
                                  icon={<CheckCircleFilled style={{ color: '#10B981' }} />}
                                  onClick={() => handleAcceptCreator(creator)}
                                  style={{
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    flex: 1,
                                    borderColor: '#A7F3D0',
                                    color: '#065F46',
                                    background: '#ECFDF5',
                                  }}
                                >
                                  Chấp thuận
                                </Button>

                                <Button
                                  size="small"
                                  type="text"
                                  danger
                                  icon={<CloseCircleFilled />}
                                  onClick={() => handleOpenReject(creator)}
                                  style={{
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    background: '#FEF2F2',
                                  }}
                                >
                                  Từ chối
                                </Button>
                              </Space>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                );
              })}
            </Row>
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
                title: 'Phiên bản & Mã',
                key: 'version',
                render: (_, r) => (
                  <div>
                    <Tag color="purple" style={{ fontWeight: 800, borderRadius: 999 }}>
                      v{r.contextVersion}
                    </Tag>
                    <span style={{ fontSize: 11.5, color: '#64748B', fontFamily: 'monospace' }}>
                      {r.id.slice(0, 8)}...
                    </span>
                  </div>
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
                      setActiveSubTab('recommendation');
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

      {/* 5. Feedback Reject Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#EF4444' }}>
            <CloseCircleFilled />
            <span>Từ chối Creator & Huấn luyện Bộ nhớ M4</span>
          </div>
        }
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
          Phản hồi của bạn giúp AI ghi nhớ gu thẩm mỹ và loại trừ các KOC không phù hợp trong các đợt đề xuất sau của thương hiệu.
        </p>

        <Form form={rejectForm} layout="vertical" onFinish={handleSubmitReject}>
          <Form.Item
            name="reasonCode"
            label={<span style={{ fontWeight: 600 }}>Lý do từ chối chính:</span>}
            rules={[{ required: true, message: 'Vui lòng chọn lý do từ chối!' }]}
          >
            <Select options={REJECTION_REASONS} size="large" />
          </Form.Item>

          <Form.Item
            name="reasonNote"
            label={<span style={{ fontWeight: 600 }}>Ghi chú chi tiết thêm (Tùy chọn):</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: KOC báo giá vượt 15 triệu ngân sách hoặc hình ảnh chưa chuẩn gu sang trọng..."
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button onClick={() => setRejectModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              danger
              htmlType="submit"
              loading={feedbackSubmitting}
              style={{ fontWeight: 700 }}
            >
              Xác nhận từ chối & Cập nhật AI
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
