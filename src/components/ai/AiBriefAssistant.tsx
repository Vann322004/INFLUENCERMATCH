import React, { useState } from 'react';
import { Input, Button, Tag, Space, Typography, Tooltip, message } from 'antd';
import {
  ThunderboltFilled,
  SendOutlined,
  CheckCircleFilled,
  ReloadOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { campaignService } from '../../services/api/campaignService';

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
    label: '💄 Mỹ phẩm Gen-Z TP.HCM',
    text: 'Cần tìm 3 bạn nữ Gen-Z tại TP. Hồ Chí Minh chuyên về Làm đẹp & Chăm sóc da, tương tác cao trên 5%, chi phí dưới $1,000.',
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
    label: '📱 Công nghệ & Game Hà Nội',
    text: 'Tìm Creator chuyên unbox đồ công nghệ, sạc dự phòng, điện thoại tại Hà Nội, nội dung uy tín, tương tác tốt.',
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
      reason: 'Đã tìm thấy các reviewer công nghệ có lượt tương tác cao.',
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
      reason: 'Đã lọc các nhà sáng tạo có cộng đồng cam kết cao.',
    },
  },
];

export default function AiBriefAssistant({ onApplyBrief, onReset }: AiBriefAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedResult, setParsedResult] = useState<StructuredBrief | null>(null);

  const handleAnalyze = async (customBrief?: StructuredBrief) => {
    if (!promptText.trim() && !customBrief) {
      message.warning('Vui lòng nhập yêu cầu chiến dịch hoặc bấm vào gợi ý mẫu!');
      return;
    }

    setIsAnalyzing(true);
    message.loading({ content: 'AI đang phân tích yêu cầu & trích xuất tiêu chí...', key: 'ai_brief' });

    try {
      let targetBrief = customBrief;
      if (!targetBrief) {
        // Gọi API backend thực tế: POST /ai/campaign-autofill
        const res = await campaignService.autofillCampaign(promptText.trim());

        const primaryNiche = res.niches?.[0] || 'Làm đẹp & Chăm sóc da';
        const primaryLocation = res.locations?.[0] || 'all';
        const isHn = primaryLocation.toLowerCase().includes('hà nội');
        const isHcm = primaryLocation.toLowerCase().includes('hồ chí minh') || primaryLocation.toLowerCase().includes('hcm');

        let priceRange = 'mid';
        let priceText = 'Mức giá $500 – $1,000';
        if (res.budgetMax && res.budgetMax > 30000000) {
          priceRange = 'high';
          priceText = 'Mức giá > $1,000';
        } else if (res.budgetMax && res.budgetMax < 15000000) {
          priceRange = 'low';
          priceText = 'Mức giá < $500';
        }

        const queryKeywords = [res.productService, primaryNiche].filter(Boolean).join(' ');

        targetBrief = {
          category: primaryNiche,
          categoryLabel: primaryNiche,
          location: isHn ? 'Thành phố Hà Nội' : isHcm ? 'Thành phố Hồ Chí Minh' : primaryLocation,
          locationLabel: isHn ? '📍 Hà Nội' : isHcm ? '📍 TP. Hồ Chí Minh' : primaryLocation !== 'all' ? `📍 ${primaryLocation}` : 'Toàn quốc',
          engagement: 'high',
          engagementLabel: 'Tương tác cao (> 5%)',
          price: priceRange,
          priceLabel: priceText,
          query: queryKeywords || promptText.split(' ').slice(0, 3).join(' '),
          reason: res.aiExplanation || `AI đã phân tích ngữ nghĩa và trích xuất tiêu chí ngành ${primaryNiche} thành công.`,
        };
      }

      setParsedResult(targetBrief);
      onApplyBrief(targetBrief);
      message.success({
        content: 'AI đã trích xuất tiêu chí và tự động áp dụng bộ lọc!',
        key: 'ai_brief',
        duration: 3,
      });
    } catch (err) {
      console.error('Error analyzing brief with AI:', err);
      message.error({ content: 'Không thể phân tích brief lúc này. Vui lòng thử lại!', key: 'ai_brief' });
    } finally {
      setIsAnalyzing(false);
    }
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
    <>
      {/* 1. Floating Circular Icon Button (Chatbot Widget) */}
      <Tooltip title={isOpen ? 'Đóng Trợ lý AI' : 'Trợ lý AI Brief (Click để mở)'} placement="left">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="AI Brief Assistant"
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #EC4899 100%)',
            boxShadow: isOpen
              ? '0 6px 20px rgba(124, 58, 237, 0.5)'
              : '0 8px 28px rgba(124, 58, 237, 0.42), 0 2px 8px rgba(0, 0, 0, 0.12)',
            border: '2px solid rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1050,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'scale(0.95)' : 'scale(1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = isOpen ? 'scale(1)' : 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = isOpen ? 'scale(0.95)' : 'scale(1)';
          }}
        >
          {isOpen ? (
            <CloseOutlined style={{ fontSize: 20, color: '#FFFFFF' }} />
          ) : (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ThunderboltFilled style={{ fontSize: 24, color: '#FFFFFF' }} />
              <span
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  background: '#10B981',
                  border: '2px solid #FFFFFF',
                  boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)',
                }}
              />
            </div>
          )}
        </button>
      </Tooltip>

      {/* 2. Floating Chat Box Card (Toggled on click) */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 98,
            right: 28,
            width: 440,
            maxWidth: 'calc(100vw - 36px)',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF5FF 100%)',
            borderRadius: 20,
            border: '1.5px solid #DDD6FE',
            boxShadow: '0 20px 48px rgba(30, 27, 75, 0.22), 0 4px 18px rgba(124, 58, 237, 0.15)',
            zIndex: 1050,
            overflow: 'hidden',
            animation: 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 18px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <ThunderboltFilled style={{ fontSize: 16, color: '#FDE047' }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: '#FFFFFF', lineHeight: 1.2 }}>
                  Trợ lý AI Brief
                </div>
                <div style={{ fontSize: 11, color: '#E0E7FF', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
                  Tự động trích xuất bộ lọc Creator
                </div>
              </div>
            </div>

            <Button
              type="text"
              shape="circle"
              size="small"
              icon={<CloseOutlined style={{ color: '#FFFFFF', fontSize: 13 }} />}
              onClick={() => setIsOpen(false)}
              style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none' }}
            />
          </div>

          {/* Body */}
          <div style={{ padding: '16px 18px', maxHeight: '72vh', overflowY: 'auto' }}>
            {/* AI Greeting Message Bubble */}
            <div
              style={{
                background: '#F5F3FF',
                border: '1px solid #E9D5FF',
                borderRadius: '14px 14px 14px 4px',
                padding: '12px 14px',
                marginBottom: 14,
                fontSize: 12.5,
                color: '#3B0764',
                lineHeight: 1.5,
              }}
            >
              👋 Chào bạn! Hãy mô tả nhanh yêu cầu tìm Creator (sản phẩm, khu vực, tương tác...), AI sẽ tự động phân tích và áp dụng bộ lọc phù hợp nhất.
            </div>

            {/* Quick Sample Chips */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Gợi ý mẫu:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SAMPLE_PROMPTS.map((sample, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSample(sample)}
                    style={{
                      cursor: 'pointer',
                      padding: '7px 10px',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#4338CA',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#EEF2FF';
                      e.currentTarget.style.borderColor = '#C7D2FE';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FFFFFF';
                      e.currentTarget.style.borderColor = '#E2E8F0';
                    }}
                  >
                    <span>{sample.label}</span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Dùng ngay →</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <div style={{ marginTop: 12 }}>
              <TextArea
                rows={3}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Ví dụ: Cần tìm 3 Creator nữ tại TP.HCM review son môi & serum, tương tác > 5%..."
                style={{
                  borderRadius: 10,
                  background: '#FFFFFF',
                  borderColor: '#C7D2FE',
                  fontSize: 12.5,
                  padding: '10px 12px',
                }}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleAnalyze();
                  }
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                {parsedResult ? (
                  <Button
                    size="small"
                    type="text"
                    icon={<ReloadOutlined />}
                    onClick={handleClear}
                    style={{ color: '#64748B', fontSize: 11.5 }}
                  >
                    Xóa Brief
                  </Button>
                ) : <span />}

                <Button
                  type="primary"
                  loading={isAnalyzing}
                  icon={<SendOutlined />}
                  onClick={() => handleAnalyze()}
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 12.5,
                    height: 36,
                    padding: '0 16px',
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
                    border: 'none',
                  }}
                >
                  AI Phân tích & Lọc
                </Button>
              </div>
            </div>

            {/* Parsed Result Display */}
            {parsedResult && (
              <div
                style={{
                  marginTop: 14,
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #C7D2FE',
                  borderRadius: 12,
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: '#1E1B4B', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircleFilled style={{ color: '#10B981' }} />
                    Tiêu chí trích xuất:
                  </span>
                  <Tag color="success" style={{ margin: 0, fontSize: 10.5 }}>Đã áp dụng ✓</Tag>
                </div>

                <Space orientation="horizontal" size={[4, 6]} wrap>
                  <Tag color="purple">{parsedResult.categoryLabel}</Tag>
                  <Tag color="blue">{parsedResult.locationLabel}</Tag>
                  <Tag color="cyan">{parsedResult.engagementLabel}</Tag>
                  <Tag color="gold">{parsedResult.priceLabel}</Tag>
                </Space>

                <div style={{ fontSize: 11.5, color: '#475569', marginTop: 8 }}>
                  💡 <em>{parsedResult.reason}</em>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
