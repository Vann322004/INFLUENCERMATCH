import React from 'react';
import { Card, Radio, Select, Input, Slider, Button, Row, Col, Tag, Typography, Space } from 'antd';
import {
  ClusterOutlined,
  ThunderboltFilled,
  AppstoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { CrawlPlatform, CrawlCategory } from '../../../../../types/api/crawler.types';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface BatchCrawlConfigCardProps {
  platform: CrawlPlatform;
  mode: 'category' | 'custom';
  categories: CrawlCategory[];
  selectedCategory: string;
  customUsernames: string;
  maxChannels: number;
  loading: boolean;
  onPlatformChange: (p: CrawlPlatform) => void;
  onModeChange: (m: 'category' | 'custom') => void;
  onSelectCategory: (id: string) => void;
  onCustomUsernamesChange: (val: string) => void;
  onMaxChannelsChange: (val: number) => void;
  onStartBatchCrawl: () => void;
}

export default function BatchCrawlConfigCard({
  platform,
  mode,
  categories,
  selectedCategory,
  customUsernames,
  maxChannels,
  loading,
  onPlatformChange,
  onModeChange,
  onSelectCategory,
  onCustomUsernamesChange,
  onMaxChannelsChange,
  onStartBatchCrawl,
}: BatchCrawlConfigCardProps) {
  return (
    <Card
      style={{
        borderRadius: 14,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        marginBottom: 20,
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      }}
      bodyStyle={{ padding: 24 }}
    >
      <div style={{ marginBottom: 16 }}>
        <Space align="center">
          <ClusterOutlined style={{ color: '#6366F1', fontSize: 20 }} />
          <Text style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
            Cào hàng loạt KOC theo ngành hàng hoặc danh sách
          </Text>
        </Space>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          Thu thập song song nhiều hồ sơ nhà sáng tạo theo ngành hàng hoặc từ danh sách tùy chọn.
        </div>
      </div>

      <Row gutter={[20, 20]}>
        {/* Lựa chọn nền tảng */}
        <Col xs={24} sm={8}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 8 }}>
            1. Chọn nền tảng mạng xã hội:
          </div>
          <Select
            value={platform}
            onChange={(val) => onPlatformChange(val as CrawlPlatform)}
            style={{ width: '100%' }}
            size="large"
          >
            <Option value="TIKTOK">🎵 TikTok</Option>
            <Option value="INSTAGRAM">📸 Instagram</Option>
            <Option value="FACEBOOK">📘 Trang Facebook</Option>
          </Select>
        </Col>

        {/* Chuyển chế độ */}
        <Col xs={24} sm={16}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 8 }}>
            2. Phương thức chọn mục tiêu:
          </div>
          <Radio.Group
            value={mode}
            onChange={(e) => onModeChange(e.target.value)}
            buttonStyle="solid"
            size="large"
            style={{ width: '100%', display: 'flex' }}
          >
            <Radio.Button value="category" style={{ flex: 1, textAlign: 'center' }}>
              <AppstoreOutlined /> Theo Danh mục Ngành hàng
            </Radio.Button>
            <Radio.Button value="custom" style={{ flex: 1, textAlign: 'center' }}>
              <UnorderedListOutlined /> Nhập danh sách KOC tùy chỉnh
            </Radio.Button>
          </Radio.Group>
        </Col>

        {/* Lựa chọn ngành hàng hoặc Textarea */}
        {mode === 'category' ? (
          <Col span={24}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 10 }}>
              3. Chọn ngành hàng mục tiêu:
            </div>
            <Row gutter={[12, 12]}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <Col xs={12} sm={8} md={6} key={cat.id}>
                    <div
                      onClick={() => onSelectCategory(cat.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: isSelected ? '#EEF2FF' : '#F8FAFC',
                        border: isSelected ? '2px solid #6366F1' : '1px solid #E2E8F0',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: isSelected ? '#4338CA' : '#1E293B' }}>
                        {cat.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                        {cat.description || `Mã: ${cat.id}`}
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Col>
        ) : (
          <Col span={24}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 6 }}>
              3. Dán danh sách tên người dùng hoặc đường dẫn kênh (mỗi dòng 1 KOC):
            </div>
            <TextArea
              rows={4}
              value={customUsernames}
              onChange={(e) => onCustomUsernamesChange(e.target.value)}
              placeholder="Nhập hoặc dán danh sách tài khoản cần cào (mỗi dòng 1 tên hoặc đường dẫn)..."
              style={{ borderRadius: 8 }}
            />
          </Col>
        )}

        {/* Thanh trượt số lượng và nút chạy */}
        <Col xs={24} md={16}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 6 }}>
            Số lượng kênh cần cào trong lượt này: <Tag color="blue">{maxChannels} kênh</Tag>
          </div>
          <Slider
            min={1}
            max={15}
            value={maxChannels}
            onChange={onMaxChannelsChange}
            marks={{ 1: '1 kênh', 3: '3 kênh', 5: '5 kênh', 10: '10 kênh', 15: '15 kênh' }}
          />
        </Col>

        <Col xs={24} md={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Button
            type="primary"
            size="large"
            icon={<ThunderboltFilled />}
            onClick={onStartBatchCrawl}
            loading={loading}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              border: 'none',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
            }}
          >
            Bắt đầu cào hàng loạt
          </Button>
        </Col>
      </Row>
    </Card>
  );
}
