import React from 'react';
import { Card, Input, Select, Button, Row, Col, Typography } from 'antd';
import type { CrawlPlatform } from '../../../../../types/api/crawler.types';

const { Text } = Typography;
const { Option } = Select;

const SAMPLE_CREATORS = ['@schannelvn', '@duytham', '@linh.beauty', '@banh.mi.review', '@khoalangthang'];

interface LiveCrawlInputBarProps {
  inputUrl: string;
  platform: CrawlPlatform;
  loading: boolean;
  onInputChange: (val: string) => void;
  onPlatformChange: (val: CrawlPlatform) => void;
  onCrawl: () => void;
}

export default function LiveCrawlInputBar({
  inputUrl,
  platform,
  loading,
  onInputChange,
  onPlatformChange,
  onCrawl,
}: LiveCrawlInputBarProps) {
  return (
    <Card
      style={{
        borderRadius: 12,
        background: '#FAFAFE',
        border: '1px solid #E2E8F0',
        marginBottom: 20,
      }}
      bodyStyle={{ padding: 22 }}
    >
      <div style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', display: 'block' }}>
          Cào dữ liệu trực tiếp KOC theo thời gian thực
        </Text>
        <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>
          Nhập đường dẫn kênh hoặc tên người dùng (TikTok, Facebook, Instagram). Hệ thống sẽ trích xuất tức thì thông tin hồ sơ và số liệu bài đăng mới nhất.
        </div>
      </div>

      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} sm={6} md={5}>
          <Select
            value={platform}
            onChange={(val) => onPlatformChange(val as CrawlPlatform)}
            style={{ width: '100%', height: 40 }}
            size="large"
          >
            <Option value="TIKTOK">TikTok</Option>
            <Option value="INSTAGRAM">Instagram</Option>
            <Option value="FACEBOOK">Facebook</Option>
            <Option value="YOUTUBE">YouTube</Option>
          </Select>
        </Col>

        <Col xs={24} sm={12} md={14}>
          <Input
            size="large"
            placeholder="VD: https://www.tiktok.com/@schannelvn hoặc schannelvn"
            value={inputUrl}
            onChange={(e) => onInputChange(e.target.value)}
            onPressEnter={onCrawl}
            disabled={loading}
            allowClear
            style={{ borderRadius: 8, height: 40 }}
          />
        </Col>

        <Col xs={24} sm={6} md={5}>
          <Button
            type="primary"
            size="large"
            onClick={onCrawl}
            loading={loading}
            style={{
              width: '100%',
              height: 40,
              borderRadius: 8,
              background: '#4F46E5',
              border: 'none',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
            }}
          >
            Cào trực tiếp ngay
          </Button>
        </Col>
      </Row>

      {/* Gợi ý KOC nhanh */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Text style={{ fontSize: 12, color: '#64748B' }}>Gợi ý kênh thử nghiệm:</Text>
        {SAMPLE_CREATORS.map((sample) => (
          <span
            key={sample}
            style={{
              cursor: 'pointer',
              borderRadius: 6,
              padding: '2px 8px',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              fontSize: 12,
              color: '#334155',
            }}
            onClick={() => {
              onInputChange(sample);
              onPlatformChange('TIKTOK');
            }}
          >
            {sample}
          </span>
        ))}
      </div>
    </Card>
  );
}
