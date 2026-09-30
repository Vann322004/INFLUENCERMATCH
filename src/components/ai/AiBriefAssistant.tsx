import React, { useState } from 'react';
import { Card, Input, Button, Tag, Space, Typography, Spin, message, Row, Col } from 'antd';
import {
  ThunderboltFilled,
  SendOutlined,
  CheckCircleFilled,
  ReloadOutlined,
  FireOutlined,
  RobotOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { TextArea } = Input;

export interface StructuredBrief {
  category: string;
  categoryLabel: string;
  location: string;
  locationLabel: string;
  engagement: string;
  engagementLabel: string;
  price: string;
  priceLabel: string;
  query: string;
  reason: string;
}

interface AiBriefAssistantProps {
  onApplyBrief: (brief: StructuredBrief) => void;
  onReset: () => void;
}

const SAMPLE_PROMPTS = [
  {
    label: '💄 Review Mỹ phẩm Gen-Z tại TP.HCM',
    text: 'Cần tìm 3 bạn nữ Gen-Z tại TP. Hồ Chí Minh chuyên về Làm đẹp & Chăm sóc da, tỷ lệ tương tác cao trên 5%, chi phí dưới $1,000.',
    brief: {
      category: 'Làm đẹp & Chăm sóc da',
      categoryLabel: 'Làm đẹp & Chăm sóc da',
      location: 'Thành phố Hồ Chí Minh',
      locationLabel: '📍 TP. Hồ Chí Minh',
      engagement: 'high',
      engagementLabel: 'Tương tác cao (> 5%)',
      price: 'mid',
      priceLabel: 'Mức giá $500 – $1,000',
      query: 'skincare son môi',
      reason: 'Đã tối ưu cho chiến dịch ra mắt mỹ phẩm tiếp cận giới trẻ TP.HCM.',
    },
  },
  {
    label: '📱 Review Công nghệ tại Hà Nội',
    text: 'Tìm Creator chuyên unbox đồ công nghệ, điện thoại tại Hà Nội, nội dung uy tín, tương tác tốt.',
    brief: {
      category: 'Công nghệ & Game',
      categoryLabel: 'Công nghệ & Game',
      location: 'Thành phố Hà Nội',
      locationLabel: '📍 TP. Hà Nội',
      engagement: 'high',
      engagementLabel: 'Tương tác cao (> 5%)',
      price: 'high',
      priceLabel: 'Mức giá > $1,000',
      query: 'công nghệ unbox',
      reason: 'Đã tìm thấy các reviewer công nghệ có lượt xem video YouTube & TikTok cao.',
    },
  },
  {
    label: '🥗 Lifestyle & Eat Clean',
    text: 'Creator chuyên về phong cách sống lành mạnh, ăn sạch Eat Clean, tương tác cực cao trên 8%.',
    brief: {
      category: 'Thể hình & Sức khỏe',
      categoryLabel: 'Thể hình & Sức khỏe',
      location: 'all',
      locationLabel: 'Toàn quốc',
      engagement: 'vhigh',
      engagementLabel: 'Tương tác rất cao (> 8%)',
      price: 'all',
      priceLabel: 'Mọi mức giá',
      query: 'healthy eat clean',
      reason: 'Đã lọc các nhà sáng tạo có cộng đồng người theo dõi cam kết cao.',
    },
  },
];

export default function AiBriefAssistant({ onApplyBrief, onReset }: AiBriefAssistantProps) {
  const [promptText, setPromptText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedResult, setParsedResult] = useState<StructuredBrief | null>(null);

  const handleAnalyze = (customBrief?: StructuredBrief) => {
    if (!promptText.trim() && !customBrief) {
      message.warning('Vui lòng nhập yêu cầu chiến dịch hoặc bấm vào gợi ý mẫu!');
      return;
    }

    setIsAnalyzing(true);
    message.loading({ content: 'AI đang phân tích ngôn ngữ tự nhiên (NLP) & bóc tách Brief...', key: 'ai_brief' });

    setTimeout(() => {
      let targetBrief = customBrief;
      if (!targetBrief) {
        // Fallback smart parser
        targetBrief = {
          category: promptText.toLowerCase().includes('công nghệ')
            ? 'Công nghệ & Game'
            : promptText.toLowerCase().includes('thời trang')
            ? 'Thời trang'
            : promptText.toLowerCase().includes('ẩm thực') || promptText.toLowerCase().includes('ăn')
            ? 'Ẩm thực & Đồ uống'
            : 'Làm đẹp & Chăm sóc da',
          categoryLabel: 'Làm đẹp & Chăm sóc da',
          location: promptText.toLowerCase().includes('hà nội')
            ? 'Thành phố Hà Nội'
            : promptText.toLowerCase().includes('hồ chí minh') || promptText.toLowerCase().includes('hcm')
            ? 'Thành phố Hồ Chí Minh'
            : 'all',
          locationLabel: promptText.toLowerCase().includes('hà nội')
            ? '📍 Hà Nội'
            : promptText.toLowerCase().includes('hồ chí minh')
            ? '📍 TP. Hồ Chí Minh'
            : 'Toàn quốc',
          engagement: 'high',
          engagementLabel: 'Tương tác cao (> 5%)',
          price: 'mid',
          priceLabel: 'Mức giá $500 – $1,000',
          query: promptText.split(' ').slice(0, 3).join(' '),
          reason: 'AI đã trích xuất tiêu chí và tự động điều chỉnh bộ lọc cho bạn.',
        };
      }

      setParsedResult(targetBrief);
      setIsAnalyzing(false);
      onApplyBrief(targetBrief);
      message.success({
        content: '✦ AI đã trích xuất Structured Brief và lọc Creator phù hợp!',
        key: 'ai_brief',
        duration: 3,
      });
    }, 900);
  };

  const handleSelectSample = (sample: (typeof SAMPLE_PROMPTS)[0]) => {
    setPromptText(sample.text);
    handleAnalyze(sample.brief);
  };

  const handleClear = () => {
    setPromptText('');
    setParsedResult(null);
    onReset();
    message.info('Đã xóa Brief AI và hoàn tác bộ lọc.');
  };

  return (
    <Card
      style={{
        borderRadius: 16,
        background: 'linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 50%, #EEF2FF 100%)',
        border: '1.5px solid #DDD6FE',
        boxShadow: '0 4px 18px rgba(124, 58, 237, 0.08)',
        marginBottom: 16,
      }}
      bodyStyle={{ padding: '18px 20px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.35)',
            }}
          >
            <ThunderboltFilled style={{ fontSize: 14 }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#1E1B4B' }}>
            AI Brief Assistant (Khám phá Creator bằng ngôn ngữ tự nhiên)
          </span>
          <Tag color="purple" style={{ borderRadius: 999, fontWeight: 700, fontSize: 10.5 }}>
            NL → STRUCTURED BRIEF
          </Tag>
        </div>

        {parsedResult && (
          <Button
            size="small"
            type="text"
            icon={<ReloadOutlined />}
            onClick={handleClear}
            style={{ color: '#64748B', fontSize: 12 }}
          >
            Xóa Brief AI
          </Button>
        )}
      </div>

      <Text type="secondary" style={{ fontSize: 12.5, display: 'block', marginBottom: 12 }}>
        Mô tả yêu cầu bằng tiếng Việt tự nhiên (ngành hàng, tệp người xem, ngân sách, khu vực...). AI sẽ tự động phân tích và khớp các Creator có chỉ số tốt nhất.
      </Text>

      {/* Input box */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <TextArea
          rows={2}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Ví dụ: Cần tìm 3 bạn nữ Gen-Z tại Sài Gòn review son môi và serum dưỡng ẩm, tương tác trên 5%, ngân sách dưới $1,000/video..."
          style={{
            borderRadius: 10,
            background: '#FFFFFF',
            borderColor: '#C7D2FE',
            fontSize: 13,
          }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleAnalyze();
            }
          }}
        />

        <Button
          type="primary"
          loading={isAnalyzing}
          icon={<SendOutlined />}
          onClick={() => handleAnalyze()}
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            height: 54,
            padding: '0 20px',
            borderRadius: 10,
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
            border: 'none',
            flexShrink: 0,
          }}
        >
          AI Phân tích
        </Button>
      </div>

      {/* Sample Quick Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>Gợi ý mẫu:</span>
        {SAMPLE_PROMPTS.map((sample, idx) => (
          <Tag
            key={idx}
            onClick={() => handleSelectSample(sample)}
            style={{
              cursor: 'pointer',
              borderRadius: 6,
              background: '#FFFFFF',
              borderColor: '#DDD6FE',
              color: '#4338CA',
              fontSize: 11.5,
              padding: '2px 8px',
              transition: 'all 0.2s',
            }}
          >
            {sample.label}
          </Tag>
        ))}
      </div>

      {/* Parsed Structured Brief Display */}
      {parsedResult && (
        <div
          style={{
            marginTop: 14,
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #C7D2FE',
            borderRadius: 12,
            padding: '12px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 12.5, color: '#1E1B4B', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircleFilled style={{ color: '#10B981' }} />
              Structured Brief được AI trích xuất:
            </span>
            <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>
              Đã tự động áp dụng vào bộ lọc ✓
            </span>
          </div>

          <Space size={8} wrap>
            <Tag color="purple">Ngành: {parsedResult.categoryLabel}</Tag>
            <Tag color="blue">{parsedResult.locationLabel}</Tag>
            <Tag color="cyan">{parsedResult.engagementLabel}</Tag>
            <Tag color="gold">{parsedResult.priceLabel}</Tag>
          </Space>

          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 8 }}>
            💡 <em>{parsedResult.reason}</em>
          </div>
        </div>
      )}
    </Card>
  );
}
