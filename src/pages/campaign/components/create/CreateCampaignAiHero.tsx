import React from 'react';
import { Input, Button, Alert, Tag, Spin } from 'antd';
import { ThunderboltFilled, RobotOutlined } from '@ant-design/icons';
import { AI_SAMPLE_PROMPTS } from './createCampaignConstants';

interface CreateCampaignAiHeroProps {
  aiPrompt: string;
  setAiPrompt: (val: string) => void;
  isAiLoading: boolean;
  aiExplanation: string | null;
  setAiExplanation: (val: string | null) => void;
  onAiSuggest: (overridePrompt?: string) => void;
}

export const CreateCampaignAiHero: React.FC<CreateCampaignAiHeroProps> = ({
  aiPrompt,
  setAiPrompt,
  isAiLoading,
  aiExplanation,
  setAiExplanation,
  onAiSuggest,
}) => {
  return (
    <div className="ccreate-ai-hero-card">
      <div className="ccreate-ai-hero-header">
        <div className="ccreate-ai-hero-title-group">
          <div className="ccreate-ai-hero-icon">
            <ThunderboltFilled />
          </div>
          <div>
            <span className="ccreate-ai-hero-title">Trợ lý AI Chiến dịch</span>
            <span className="ccreate-ai-hero-sub" style={{ marginLeft: 8 }}>
              Tự động phân tích brief, trích xuất mục tiêu & đề xuất cấu hình phù hợp
            </span>
          </div>
        </div>
      </div>

      {/* AI Input Row */}
      <div className="ccreate-ai-input-wrap">
        <Input
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Ví dụ: Dòng kem chống nắng nâng tone kiềm dầu cho học sinh sinh viên, giá dưới 200k..."
          className="ccreate-ai-input-field"
          onPressEnter={() => onAiSuggest()}
        />
        <Button
          type="primary"
          icon={<ThunderboltFilled />}
          loading={isAiLoading}
          onClick={() => onAiSuggest()}
          className="ccreate-ai-action-btn"
        >
          AI Tự động điền
        </Button>
      </div>

      {/* Sample Prompt Chips */}
      <div className="ccreate-ai-samples-strip">
        <span className="ccreate-ai-samples-label">Gợi ý mẫu:</span>
        {AI_SAMPLE_PROMPTS.map((item, idx) => (
          <button
            type="button"
            key={idx}
            className="ccreate-ai-sample-chip"
            onClick={() => {
              setAiPrompt(item.prompt);
              onAiSuggest(item.prompt);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* AI Processing Spin Indicator */}
      {isAiLoading && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(237, 233, 254, 0.7)',
            border: '1px dashed #A78BFA',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Spin size="small" />
          <span style={{ fontSize: 12.5, color: '#6D28D9', fontWeight: 600 }}>
            Trợ lý AI đang phân tích yêu cầu và tự động điền các thông số vào từng bước...
          </span>
        </div>
      )}

      {/* AI Explanation Alert nếu có */}
      {aiExplanation && !isAiLoading && (
        <Alert
          style={{
            borderRadius: 12,
            border: '1px solid #C4B5FD',
            background: 'linear-gradient(135deg, #FDF4FF 0%, #F5F3FF 50%, #EDE9FE 100%)',
            padding: '10px 16px',
          }}
          message={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, color: '#5B21B6', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <RobotOutlined style={{ fontSize: 15, color: '#7C3AED' }} /> Chiến lược phân tích từ AI
              </span>
              <Button
                type="text"
                size="small"
                onClick={() => setAiExplanation(null)}
                style={{ color: '#7C3AED', fontWeight: 600, fontSize: 11.5 }}
              >
                Đóng
              </Button>
            </div>
          }
          description={
            <div>
              <p style={{ margin: '2px 0 8px 0', fontSize: 12.5, color: '#4C1D95', lineHeight: 1.5 }}>
                {aiExplanation}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <Tag style={{ background: '#FFFFFF', borderColor: '#DDD6FE', color: '#6D28D9', fontSize: 11, borderRadius: 6, fontWeight: 600 }}>
                  ✓ Bước 1: Tên, Sản phẩm & Mục tiêu
                </Tag>
                <Tag style={{ background: '#FFFFFF', borderColor: '#DDD6FE', color: '#6D28D9', fontSize: 11, borderRadius: 6, fontWeight: 600 }}>
                  ✓ Bước 2: Nền tảng, Niche & Độ tuổi
                </Tag>
                <Tag style={{ background: '#FFFFFF', borderColor: '#DDD6FE', color: '#6D28D9', fontSize: 11, borderRadius: 6, fontWeight: 600 }}>
                  ✓ Bước 3: Ngân sách & Thời gian
                </Tag>
              </div>
            </div>
          }
          type="info"
          showIcon={false}
        />
      )}
    </div>
  );
};

export default CreateCampaignAiHero;

