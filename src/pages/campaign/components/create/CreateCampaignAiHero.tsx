import React from 'react';
import { Input, Button, Spin, Popover } from 'antd';
import { ThunderboltFilled } from '@ant-design/icons';
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
              Mô tả ý tưởng để nhận đề xuất cho chiến dịch
            </span>
          </div>
        </div>
      </div>

      {/* AI Input Row */}
      <div className="ccreate-ai-input-wrap">
        <Input
          aria-label="Mô tả chiến dịch cho AI"
          disabled={isAiLoading}
          maxLength={1000}
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Quảng bá [sản phẩm] cho [khách hàng], mục tiêu [mục tiêu], ngân sách [số tiền]…"
          className="ccreate-ai-input-field"
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
        <button type="button" className="ccreate-ai-sample-chip" disabled={isAiLoading}
          onClick={() => setAiPrompt('Quảng bá kem chống nắng kiềm dầu giá dưới 200.000đ cho sinh viên, mục tiêu tăng nhận diện trên TikTok, tổng ngân sách 15 triệu đồng, hợp tác với 3 nhà sáng tạo để thực hiện tổng cộng 3 video đánh giá trong 4 tuần. Nhấn mạnh lớp nền tự nhiên, không cam kết điều trị da.')}>
          Kem chống nắng cho sinh viên
        </button>
        {AI_SAMPLE_PROMPTS.map((item, idx) => (
          <Popover key={idx} trigger="click" placement="bottomLeft" title="Cấu trúc một câu mô tả"
            content={<p style={{ width: 'min(320px, calc(100vw - 64px))', margin: 0, lineHeight: 1.6 }}>{item.prompt}</p>}>
          <button
            type="button"
            key={idx}
            className="ccreate-ai-sample-chip"
            disabled={isAiLoading}
          >
            {item.label}
          </button>
          </Popover>
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

      {aiExplanation && !isAiLoading && (
        <details className="ccreate-ai-explanation">
          <summary>Chi tiết đề xuất</summary>
          <p>{aiExplanation}</p>
        </details>
      )}
    </div>
  );
};

export default CreateCampaignAiHero;

