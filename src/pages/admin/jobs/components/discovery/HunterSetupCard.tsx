import React from 'react';
import { Card, Row, Col, Select, Tag, Input, Slider, Button, Typography, Radio } from 'antd';
import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { TOPIC_PRESETS } from './hunterConstants';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export interface HunterSetupCardProps {
  mode: 'category' | 'custom';
  onModeChange: (m: 'category' | 'custom') => void;
  platform: string;
  selectedTopic: string;
  activeKeywords: string[];
  customUsernames: string;
  onCustomUsernamesChange: (val: string) => void;
  maxKocs: number;
  loading: boolean;
  onPlatformChange: (p: string) => void;
  onSelectTopic: (topicId: string) => void;
  onKeywordsChange: (keywords: string[]) => void;
  onMaxKocsChange: (val: number) => void;
  onStartHunting: () => void;
}

const TIER0_RULES = [
  'Tối thiểu 7.000 người theo dõi (loại bỏ clone, seeding ảo)',
  'Chặn tài khoản bán sỉ / shop thương mại (dropship, kho buôn)',
  'Chống trùng lặp — chỉ nạp KOC chưa có trong Database',
];

export default function HunterSetupCard({
  mode,
  onModeChange,
  platform,
  selectedTopic,
  activeKeywords,
  customUsernames,
  onCustomUsernamesChange,
  maxKocs,
  loading,
  onPlatformChange,
  onSelectTopic,
  onKeywordsChange,
  onMaxKocsChange,
  onStartHunting,
}: HunterSetupCardProps) {
  const [customInput, setCustomInput] = React.useState('');

  const handleAddKeyword = () => {
    const kw = customInput.trim().replace(/^#/, '');
    if (kw && !activeKeywords.includes(kw)) {
      onKeywordsChange([...activeKeywords, kw]);
      setCustomInput('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    onKeywordsChange(activeKeywords.filter((k) => k !== kw));
  };

  return (
    <Card
      style={{
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        marginBottom: 20,
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      }}
      bodyStyle={{ padding: 24 }}
    >
      {/* Header & Mode Switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
          borderBottom: '1px solid #F1F5F9',
          paddingBottom: 16,
        }}
      >
        <div>
          <Text style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'block' }}>
            {mode === 'category' ? 'Săn KOC Tự Động theo Lĩnh vực' : 'Thu thập KOC theo Danh sách Tùy chọn'}
          </Text>
          <Text style={{ fontSize: 12.5, color: '#64748B' }}>
            {mode === 'category'
              ? 'Tự động quét mạng xã hội theo từ khóa, phát hiện KOC mới và loại bỏ shop/clone theo chuẩn Tier-0.'
              : 'Trích xuất song song nhiều KOC cùng lúc từ danh sách username hoặc đường dẫn kênh.'}
          </Text>
        </div>

        <Radio.Group
          value={mode}
          onChange={(e) => onModeChange(e.target.value)}
          buttonStyle="solid"
          size="middle"
        >
          <Radio.Button value="category" style={{ fontWeight: 600 }}>
            <AppstoreOutlined style={{ marginRight: 6 }} /> Theo Lĩnh vực
          </Radio.Button>
          <Radio.Button value="custom" style={{ fontWeight: 600 }}>
            <UnorderedListOutlined style={{ marginRight: 6 }} /> Theo Danh sách tùy chọn
          </Radio.Button>
        </Radio.Group>
      </div>

      <Row gutter={[20, 20]}>
        {/* 1. Nền tảng */}
        <Col xs={24} sm={mode === 'category' ? 9 : 8}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Nền tảng quét
          </div>
          <Select value={platform} onChange={onPlatformChange} style={{ width: '100%' }} size="large">
            <Option value="ALL">Tất cả nền tảng (TikTok + Facebook)</Option>
            <Option value="TIKTOK">TikTok</Option>
            <Option value="FACEBOOK">Facebook</Option>
            <Option value="INSTAGRAM">Instagram</Option>
          </Select>
        </Col>

        {mode === 'category' ? (
          <>
            {/* 2. Lĩnh vực */}
            <Col xs={24} sm={15}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Lĩnh vực
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TOPIC_PRESETS.map((t) => {
                  const isSelected = selectedTopic === t.id;
                  return (
                    <Tag
                      key={t.id}
                      onClick={() => onSelectTopic(t.id)}
                      style={{
                        cursor: 'pointer',
                        padding: '5px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        background: isSelected ? '#EEF2FF' : '#F8FAFC',
                        color: isSelected ? '#4338CA' : '#64748B',
                        border: isSelected ? '1.5px solid #6366F1' : '1px solid #E2E8F0',
                      }}
                    >
                      {t.label}
                    </Tag>
                  );
                })}
              </div>
            </Col>

            {/* 3. Từ khóa */}
            <Col span={24}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Từ khóa & Hashtag đang săn
              </div>
              <div
                style={{
                  padding: '10px 12px',
                  background: '#F8FAFC',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  alignItems: 'center',
                  minHeight: 44,
                }}
              >
                {activeKeywords.map((kw) => (
                  <Tag
                    key={kw}
                    closable
                    onClose={() => handleRemoveKeyword(kw)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#334155',
                      margin: 0,
                    }}
                  >
                    #{kw}
                  </Tag>
                ))}
                <Input
                  size="small"
                  placeholder="Thêm từ khóa..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onPressEnter={handleAddKeyword}
                  bordered={false}
                  style={{ width: 160, fontSize: 12, padding: '2px 4px' }}
                />
              </div>
            </Col>
          </>
        ) : (
          /* Chế độ nhập danh sách tùy chọn */
          <Col xs={24} sm={16}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Danh sách username hoặc link KOC (mỗi dòng hoặc dấu phẩy)
            </div>
            <TextArea
              rows={3}
              placeholder={`Nhập danh sách KOC cần cào, ví dụ:\n@schannelvn\n@duytham\nhttps://www.tiktok.com/@linh.beauty`}
              value={customUsernames}
              onChange={(e) => onCustomUsernamesChange(e.target.value)}
              style={{ borderRadius: 8, fontSize: 12.5 }}
            />
          </Col>
        )}

        {/* 4. Tiêu chuẩn Tier-0 */}
        <Col xs={24} md={14}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Bộ lọc Tier-0 (tự động áp dụng)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {TIER0_RULES.map((rule, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12.5, color: '#475569' }}>
                <span style={{ color: '#10B981', fontWeight: 700, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </Col>

        {/* 5. Số lượng mục tiêu + nút chạy */}
        <Col xs={24} md={10}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Mục tiêu đợt này
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#4F46E5' }}>{maxKocs}</span>
            <span style={{ fontSize: 13, color: '#64748B' }}>KOC</span>
          </div>
          <Slider
            min={3}
            max={30}
            step={mode === 'custom' ? 1 : 5}
            value={maxKocs}
            onChange={onMaxKocsChange}
            marks={{ 3: '3', 5: '5', 10: '10', 20: '20', 30: '30' }}
            style={{ marginBottom: 24 }}
          />
          <Button
            type="primary"
            size="large"
            onClick={onStartHunting}
            loading={loading}
            block
            style={{
              height: 44,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: '0 3px 10px rgba(79,70,229,0.3)',
            }}
          >
            {mode === 'category' ? 'Bắt đầu săn KOC tự động' : 'Bắt đầu cào danh sách KOC'}
          </Button>
        </Col>
      </Row>
    </Card>
  );
}
