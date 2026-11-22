import { canQueueCollectionResult, collectionOutcome, collectionOutcomeLabel } from '../../../../services/collectionDecision';
import { saveCollectionResults } from '../../../../services/collectionResults';
import { useCollectionState } from '../../../../hooks/useCollectionState';
import React, { useRef, useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Space, Tag, Typography, Spin, message, Empty, Select } from 'antd';
import { crawlerService } from '../../../../services/api/crawlerService';
import type { CrawlPlatform, LiveCrawlResult } from '../../../../types/api/crawler.types';
import LiveCrawlInputBar from './live/LiveCrawlInputBar';
import LiveCrawlProfileCard from './live/LiveCrawlProfileCard';
import LiveCrawlVideoGrid from './live/LiveCrawlVideoGrid';

const { Text } = Typography;

const DISMISS_REASONS = [
  { value: 'spam', label: 'Tài khoản spam / giả mạo' },
  { value: 'low_quality', label: 'Nội dung kém chất lượng / không phù hợp thương hiệu' },
  { value: 'off_niche', label: 'Không đúng ngành hàng / lĩnh vực' },
  { value: 'inactive', label: 'Kênh không hoạt động / đã ngừng đăng bài' },
  { value: 'duplicate', label: 'Trùng lặp với hồ sơ đã có trong hệ thống' },
  { value: 'other', label: 'Lý do khác' },
];

interface LiveCrawlTabProps {
  onImportSuccess?: (result: LiveCrawlResult) => void;
  onDismiss?: (result: LiveCrawlResult, reason?: string) => void;
  defaultInput?: string;
  initialResult?: LiveCrawlResult;
}

export default function LiveCrawlTab({ onImportSuccess, onDismiss, defaultInput = '', initialResult }: LiveCrawlTabProps) {
  const [inputUrl, setInputUrl] = useCollectionState(`live.${defaultInput}.input`, defaultInput);
  const [platform, setPlatform] = useCollectionState<CrawlPlatform>(`live.${defaultInput}.platform`, (initialResult?.platform as CrawlPlatform) || 'TIKTOK');
  const [loading, setLoading] = useCollectionState(`live.${defaultInput}.loading`, false, false);
  const [result, setResult] = useCollectionState<LiveCrawlResult | null>(`live.${defaultInput}.result`, initialResult || null);
  const [currentStep, setCurrentStep] = useCollectionState(`live.${defaultInput}.currentStep`, '', false);
  const [submitting, setSubmitting] = useState<'queue' | 'catalog' | null>(null);
  const submittingRef = useRef(false);
  const autoCrawledRef = useRef(false);
  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissReasonNote, setDismissReasonNote] = useState('');

  // Có dữ liệu chi tiết = đã cào thực tế: phải có followers hoặc bài viết — không chỉ có avatar/username từ overview
  const hasDetailedData = Boolean(
    result &&
    (result.followers != null ||
      (result.recent_posts && result.recent_posts.length > 0))
  );

  const handleInputChange = (val: string) => {
    setInputUrl(val);
    const lower = val.toLowerCase();
    if (lower.includes('tiktok.com')) setPlatform('TIKTOK');
    else if (lower.includes('instagram.com')) setPlatform('INSTAGRAM');
    else if (lower.includes('facebook.com')) setPlatform('FACEBOOK');
    else if (lower.includes('youtube.com') || lower.includes('youtu.be')) setPlatform('YOUTUBE');
  };

  const handleCrawl = async (crawlTarget?: string) => {
    if (loading) return;
    const target = (crawlTarget || inputUrl || defaultInput || initialResult?.username || '').trim();
    if (!target) {
      message.warning('Vui lòng nhập đường dẫn kênh hoặc tên nhà sáng tạo để cào');
      return;
    }

    setLoading(true);
    setCurrentStep('Đang kết nối tới máy chủ cào dữ liệu...');

    try {
      setTimeout(() => setCurrentStep('Đang bóc tách thông tin hồ sơ nhà sáng tạo...'), 400);
      setTimeout(() => setCurrentStep('Đang trích xuất bài đăng gần nhất...'), 900);

      const res = await crawlerService.testScrape(target, platform);
      setResult(res);
      saveCollectionResults([res], 'manual');
      const latencySec = res.latency_ms ? (res.latency_ms / 1000).toFixed(1) : '0.5';
      message.success(`Cào thành công @${res.username}! (${latencySec} giây)`);
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi cào dữ liệu từ máy chủ');
    } finally {
      setLoading(false);
      setCurrentStep('');
    }
  };

  // Auto-crawl khi mở modal nếu chưa có dữ liệu followers / bài viết thực
  useEffect(() => {
    const target = (defaultInput || initialResult?.username || '').trim();
    if (!hasDetailedData && target && !autoCrawledRef.current) {
      autoCrawledRef.current = true;
      handleCrawl(target);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismissConfirm = () => {
    if (!result) return;
    const reasonLabel = DISMISS_REASONS.find(r => r.value === dismissReason)?.label || dismissReason;
    const fullReason = [reasonLabel, dismissReasonNote].filter(Boolean).join(' — ');
    if (onDismiss) onDismiss(result, fullReason || undefined);
    setDismissModalOpen(false);
    setDismissReason('');
    setDismissReasonNote('');
  };

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    message.success('Đã sao chép toàn bộ dữ liệu vào bộ nhớ tạm!');
  };

  // Quyền cào sâu: Cho phép Quản trị viên duyệt và gửi cào sâu nếu kênh không bị từ chối
  const canDeepCrawl = Boolean(
    result &&
    result.username?.trim() &&
    collectionOutcome(result.decision, result.primary_type) !== 'rejected'
  );

  const handleImportToCatalog = async () => {
    if (!result || submittingRef.current || !canDeepCrawl) return;
    submittingRef.current = true;
    setSubmitting('catalog');
    message.loading({ content: `Đang gửi yêu cầu cào sâu @${result.username}...`, key: 'import_catalog' });
    try {
      await crawlerService.enqueueCandidate(result.platform as CrawlPlatform, result.username, true);
      message.success({
        content: `Đã gửi yêu cầu cào sâu @${result.username}. Hồ sơ sẽ được chuyển sang kiểm định sau khi cào xong.`,
        key: 'import_catalog',
      });
      if (onImportSuccess) onImportSuccess(result);
    } catch (err: any) {
      message.error({ content: err.message || 'Không gửi được yêu cầu cào sâu', key: 'import_catalog' });
    } finally {
      submittingRef.current = false;
      setSubmitting(null);
    }
  };

  const handleSendToQueue = async () => {
    if (!result || submittingRef.current || !canQueueCollectionResult(result)) return;
    submittingRef.current = true;
    setSubmitting('queue');
    message.loading({ content: `Đang gửi @${result.username} vào hàng đợi xử lý...`, key: 'send_queue' });
    try {
      await crawlerService.enqueueCandidate(result.platform as CrawlPlatform, result.username, false);
      message.success({ content: `Đã đưa @${result.username} vào hàng đợi. Theo dõi kết quả ở Tiến trình thu thập.`, key: 'send_queue' });
    } catch (err: any) {
      message.error({ content: err.message || 'Lỗi khi gửi vào hàng đợi', key: 'send_queue' });
    } finally {
      submittingRef.current = false;
      setSubmitting(null);
    }
  };

  const calculateEngagementRate = () => {
    if (!result || !result.followers || !result.recent_posts || result.recent_posts.length === 0) return 0;
    const totalInteractions = result.recent_posts.reduce((acc, p) => acc + (p.likes || 0) + (p.comments || 0), 0);
    const avgInteractions = totalInteractions / result.recent_posts.length;
    return Number(((avgInteractions / result.followers) * 100).toFixed(2));
  };

  const engagementRate = calculateEngagementRate();

  const getDecisionTag = (dec?: string, primaryType?: string) => {
    const outcome = collectionOutcome(dec, primaryType);
    return <Tag color={outcome === 'accepted' ? 'success' : outcome === 'rejected' ? 'error' : 'warning'}>{collectionOutcomeLabel(outcome)}</Tag>;
  };

  // Nút loại bỏ hồ sơ — mở Modal có lý do
  const DismissButton = ({ size }: { size?: 'small' }) =>
    onDismiss ? (
      <Button
        danger
        size={size}
        style={{ borderRadius: 6, fontWeight: 500 }}
        onClick={() => setDismissModalOpen(true)}
      >
        Loại bỏ hồ sơ
      </Button>
    ) : null;

  return (
    <div>
      {/* Modal nhập lý do loại bỏ */}
      <Modal
        open={dismissModalOpen}
        title={<span style={{ color: '#DC2626', fontWeight: 700 }}>Loại bỏ hồ sơ @{result?.username}</span>}
        okText="Xác nhận loại bỏ"
        cancelText="Hủy"
        okButtonProps={{ danger: true, disabled: !dismissReason }}
        onCancel={() => { setDismissModalOpen(false); setDismissReason(''); setDismissReasonNote(''); }}
        onOk={handleDismissConfirm}
        destroyOnClose
      >
        <div style={{ marginBottom: 16, color: '#475569', fontSize: 13 }}>
          Hồ sơ sẽ bị ẩn khỏi danh sách cần đối chiếu. Bạn có thể khôi phục lại trong mục <strong>Đã loại bỏ</strong>.
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>
            Lý do loại bỏ <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <Select
            style={{ width: '100%' }}
            placeholder="Chọn lý do..."
            value={dismissReason || undefined}
            onChange={setDismissReason}
            options={DISMISS_REASONS}
          />
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>
            Ghi chú thêm (tùy chọn)
          </label>
          <Input.TextArea
            rows={2}
            placeholder="Mô tả thêm nếu cần..."
            value={dismissReasonNote}
            onChange={(e) => setDismissReasonNote(e.target.value)}
            maxLength={200}
            showCount
          />
        </div>
      </Modal>

      {/* 1. Thanh tìm kiếm và chọn nền tảng (chỉ hiển thị khi mở chế độ cào tự do, không có initialResult) */}
      {!initialResult && (
        <div style={{ marginBottom: 16 }}>
          <LiveCrawlInputBar
            inputUrl={inputUrl}
            platform={platform}
            loading={loading}
            onInputChange={handleInputChange}
            onPlatformChange={setPlatform}
            onCrawl={() => handleCrawl()}
          />
        </div>
      )}

      {/* 2. Trạng thái đang cào */}
      {loading && (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: '36px 20px', marginBottom: 20 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, fontSize: 14, fontWeight: 700, color: '#6D28D9' }}>
            {currentStep || `Đang trích xuất dữ liệu trực tiếp của @${inputUrl || defaultInput}...`}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
            Quá trình trích xuất trực tiếp bài đăng và thông số diễn ra trong khoảng 5 - 15 giây
          </div>
        </Card>
      )}

      {/* 3. Hồ sơ chưa có dữ liệu chi tiết */}
      {!loading && !hasDetailedData && (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: '36px 20px', marginBottom: 20 }}>
          <Empty
            description={
              <div>
                <p style={{ fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Chưa có dữ liệu bài viết và thông số kênh cho @{inputUrl || defaultInput || 'tài khoản này'}
                </p>
                <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>
                  Hồ sơ mới chỉ được ghi nhận tên kênh từ quét tự động. Bấm nút dưới đây để trích xuất trực tiếp thông tin và bài đăng để đối chiếu.
                </p>
              </div>
            }
          >
            <Space size={12}>
              <Button
                type="primary"
                onClick={() => handleCrawl()}
                style={{ background: '#7C3AED', borderColor: '#7C3AED', fontWeight: 600 }}
              >
                Cào dữ liệu kênh ngay
              </Button>
              {onDismiss && result && <DismissButton />}
            </Space>
          </Empty>
        </Card>
      )}

      {/* 4. Hiển thị kết quả cào khi đã có dữ liệu */}
      {result && !loading && hasDetailedData && (
        <div>
          {/* Thanh công cụ hành động */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
              padding: '12px 16px',
              background: '#FFFFFF',
              borderRadius: 10,
              border: '1px solid #E2E8F0',
            }}
          >
            <Space align="center" wrap>
              <Text strong style={{ fontSize: 14, color: '#0F172A' }}>
                Kết quả: @{result.username}
              </Text>
              <Tag color="cyan">
                {result.latency_ms ? `${(result.latency_ms / 1000).toFixed(1)} giây` : 'Tức thì'}
              </Tag>
              {result.primary_type && result.primary_type !== 'UNKNOWN' && (
                <Tag color="purple">{result.primary_type}</Tag>
              )}
              {getDecisionTag(result.decision, result.primary_type)}
            </Space>

            <Space wrap>
              <Button onClick={handleCopyJson}>
                Sao chép JSON
              </Button>
              <Button onClick={() => handleCrawl()} disabled={submitting !== null}>
                Thu thập lại
              </Button>
              <Button
                onClick={handleSendToQueue}
                loading={submitting === 'queue'}
                disabled={submitting !== null || !canQueueCollectionResult(result)}
                style={{ borderColor: '#F59E0B', color: '#D97706', fontWeight: 600 }}
              >
                Gửi vào hàng đợi xử lý
              </Button>
              <Button
                type="primary"
                onClick={handleImportToCatalog}
                loading={submitting === 'catalog'}
                disabled={submitting !== null || !canDeepCrawl}
                style={{
                  background: '#10B981',
                  border: 'none',
                  fontWeight: 600,
                  borderRadius: 6,
                }}
              >
                Yêu cầu cào sâu
              </Button>
              <DismissButton />
            </Space>
          </div>

          {/* Hồ sơ KOC */}
          <LiveCrawlProfileCard result={result} engagementRate={engagementRate} />

          {/* Lưới bài đăng trích xuất */}
          <LiveCrawlVideoGrid result={result} />
        </div>
      )}
    </div>
  );
}
