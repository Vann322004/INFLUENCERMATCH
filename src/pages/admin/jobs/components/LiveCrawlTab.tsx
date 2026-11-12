import React, { useState } from 'react';
import { Card, Button, Space, Tag, Typography, Spin, message } from 'antd';
import { crawlerService } from '../../../../services/api/crawlerService';
import type { CrawlPlatform, LiveCrawlResult } from '../../../../types/api/crawler.types';
import LiveCrawlInputBar from './live/LiveCrawlInputBar';
import LiveCrawlProfileCard from './live/LiveCrawlProfileCard';
import LiveCrawlVideoGrid from './live/LiveCrawlVideoGrid';

const { Text } = Typography;

interface LiveCrawlTabProps {
  onImportSuccess?: (result: LiveCrawlResult) => void;
  defaultInput?: string;
}

export default function LiveCrawlTab({ onImportSuccess, defaultInput = '' }: LiveCrawlTabProps) {
  const [inputUrl, setInputUrl] = useState(defaultInput);
  const [platform, setPlatform] = useState<CrawlPlatform>('TIKTOK');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LiveCrawlResult | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');

  const handleInputChange = (val: string) => {
    setInputUrl(val);
    const lower = val.toLowerCase();
    if (lower.includes('tiktok.com')) setPlatform('TIKTOK');
    else if (lower.includes('instagram.com')) setPlatform('INSTAGRAM');
    else if (lower.includes('facebook.com')) setPlatform('FACEBOOK');
    else if (lower.includes('youtube.com') || lower.includes('youtu.be')) setPlatform('YOUTUBE');
  };

  const handleCrawl = async () => {
    if (!inputUrl.trim()) {
      message.warning('Vui lòng nhập đường dẫn kênh hoặc tên người dùng KOC để cào');
      return;
    }

    setLoading(true);
    setResult(null);
    setCurrentStep('Đang kết nối tới máy chủ cào dữ liệu...');

    try {
      setTimeout(() => setCurrentStep('Đang bóc tách thông tin hồ sơ KOC...'), 400);
      setTimeout(() => setCurrentStep('Đang trích xuất bài đăng gần nhất...'), 900);

      const res = await crawlerService.testScrape(inputUrl, platform);
      setResult(res);
      const latencySec = res.latency_ms ? (res.latency_ms / 1000).toFixed(1) : '0.5';
      message.success(`Cào thành công @${res.username}! (${latencySec} giây)`);
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi cào dữ liệu từ máy chủ');
    } finally {
      setLoading(false);
      setCurrentStep('');
    }
  };

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    message.success('Đã sao chép toàn bộ dữ liệu vào bộ nhớ tạm!');
  };

  const handleImportToCatalog = async () => {
    if (!result) return;
    message.loading({ content: `Đang lưu hồ sơ @${result.username} vào hệ thống...`, key: 'import_catalog' });
    try {
      await crawlerService.enqueueCandidate(platform, result.username, true);
      message.success({ content: `Đã lưu @${result.username} vào hệ thống thành công!`, key: 'import_catalog' });
      if (onImportSuccess) onImportSuccess(result);
    } catch (err: any) {
      message.error({ content: err.message || 'Lỗi khi lưu vào hệ thống', key: 'import_catalog' });
    }
  };

  const handleSendToQuality = async () => {
    if (!result) return;
    message.loading({ content: `Đang gửi @${result.username} sang kiểm định...`, key: 'send_quality' });
    try {
      await crawlerService.enqueueCandidate(platform, result.username, false);
      message.success({ content: `Đã đưa @${result.username} vào danh sách kiểm định chất lượng!`, key: 'send_quality' });
    } catch (err: any) {
      message.error({ content: err.message || 'Lỗi khi đưa vào kiểm định', key: 'send_quality' });
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
    if (dec === 'AUTO_ACCEPT_KOL' || primaryType === 'KOL') {
      return <Tag color="purple" style={{ fontWeight: 700 }}>Đạt chuẩn KOL</Tag>;
    }
    if (dec === 'ACCEPTED' || dec === 'AUTO_ACCEPT_KOC' || dec === 'PASS') {
      return <Tag color="success" style={{ fontWeight: 700 }}>Đạt chuẩn KOC</Tag>;
    }
    if (dec === 'REJECTED' || dec === 'AUTO_REJECT' || dec === 'REJECT') {
      return <Tag color="error" style={{ fontWeight: 700 }}>Từ chối (Bán hàng / Spam)</Tag>;
    }
    return <Tag color="warning" style={{ fontWeight: 600 }}>Chờ xem xét</Tag>;
  };

  return (
    <div>
      {/* 1. Thanh tìm kiếm và chọn nền tảng */}
      <LiveCrawlInputBar
        inputUrl={inputUrl}
        platform={platform}
        loading={loading}
        onInputChange={handleInputChange}
        onPlatformChange={setPlatform}
        onCrawl={handleCrawl}
      />

      {/* 2. Trạng thái đang cào */}
      {loading && (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: '36px 20px', marginBottom: 20 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, fontSize: 14, fontWeight: 700, color: '#4F46E5' }}>
            {currentStep || 'Đang thực hiện cào dữ liệu...'}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
            Quá trình trích xuất trực tiếp diễn ra trong khoảng 5 - 15 giây
          </div>
        </Card>
      )}

      {/* 3. Hiển thị kết quả cào */}
      {result && !loading && (
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
                Sao chép dữ liệu
              </Button>
              <Button onClick={handleCrawl}>
                Cào lại
              </Button>
              <Button
                onClick={handleSendToQuality}
                style={{ borderColor: '#F59E0B', color: '#D97706', fontWeight: 600 }}
              >
                Gửi sang Kiểm định
              </Button>
              <Button
                type="primary"
                onClick={handleImportToCatalog}
                style={{
                  background: '#10B981',
                  border: 'none',
                  fontWeight: 600,
                  borderRadius: 6,
                }}
              >
                Lưu vào Danh mục
              </Button>
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
