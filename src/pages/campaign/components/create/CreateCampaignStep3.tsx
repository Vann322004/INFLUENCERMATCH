import React from 'react';
import { Row, Col, Select, InputNumber, Tag } from 'antd';

interface CreateCampaignStep3Props {
  budgetTotal: number;
  setBudgetTotal: (val: number) => void;
  campaignDuration: string;
  setCampaignDuration: (val: string) => void;
  campaignName: string;
  product: string;
  selectedPlatforms: string[];
  creatorQuantity: number;
  creatorTier: string;
  selectedAges: string[];
  selectedGender: string;
  locationState: string;
  isAiAutofilled: boolean;
}

export const CreateCampaignStep3: React.FC<CreateCampaignStep3Props> = ({
  budgetTotal,
  setBudgetTotal,
  campaignDuration,
  setCampaignDuration,
  campaignName,
  product,
  selectedPlatforms,
  creatorQuantity,
  creatorTier,
  selectedAges,
  selectedGender,
  locationState,
  isAiAutofilled,
}) => {
  return (
    <div className={`ccreate-card ${isAiAutofilled ? 'ai-highlight-card' : ''}`}>
      <div className="ccreate-card-header">
        <div className="ccreate-card-badge">3</div>
        <div>
          <div className="ccreate-card-title">Ngân sách & Thời gian thực thi</div>
          <div className="ccreate-card-subtitle">
            Xác định hạn mức tài chính, kỳ vọng chuyển đổi và lịch trình triển khai của chiến dịch.
          </div>
        </div>
      </div>

      {/* Phần 1: Ngân sách & Thời gian */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <div className="ccreate-field-label">
            <span>Tổng ngân sách dự kiến (VND) <span className="req">*</span></span>
            <Tag color="blue" style={{ borderRadius: 6, fontSize: 11.5, fontWeight: 700, margin: 0 }}>
              {(budgetTotal / 1000000).toFixed(1)} Triệu VNĐ
            </Tag>
          </div>
          <InputNumber
            value={budgetTotal}
            onChange={(val) => setBudgetTotal(val || 0)}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
            style={{ width: '100%', borderRadius: 10, height: 42, lineHeight: '40px', fontSize: 14, fontWeight: 700 }}
            suffix={<span style={{ color: '#4F46E5', fontWeight: 700 }}>VNĐ</span>}
          />
        </Col>

        <Col xs={24} md={12}>
          <div className="ccreate-field-label">
            <span>Thời lượng chiến dịch <span className="req">*</span></span>
          </div>
          <Select
            value={campaignDuration}
            onChange={setCampaignDuration}
            style={{ width: '100%', height: 40 }}
            options={[
              { value: '2_weeks', label: '2 tuần (Chiến dịch thần tốc / Flash campaign)' },
              { value: '4_weeks', label: '4 tuần (Khuyên dùng cho ra mắt sản phẩm)' },
              { value: '8_weeks', label: '8 tuần (Chiến dịch duy trì nhận diện dài hạn)' },
            ]}
          />
        </Col>
      </Row>

      {/* Phần 3: Executive Overview Card */}
      <div className="ccreate-sub-section">
        <div className="ccreate-sub-title">
          <span>Tóm tắt tổng quan chiến dịch</span>
          <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>
            ✓ Sẵn sàng khởi chạy
          </span>
        </div>

        <div className="ccreate-overview-card">
          <div className="ccreate-overview-item">
            <span className="ccreate-overview-item-label">Tên & Sản phẩm</span>
            <span className="ccreate-overview-item-val">{campaignName} — {product}</span>
          </div>
          <div className="ccreate-overview-item">
            <span className="ccreate-overview-item-label">Ngân sách & Thời lượng</span>
            <span className="ccreate-overview-item-val" style={{ color: '#4F46E5' }}>
              {(budgetTotal / 1000000).toFixed(1)} Triệu VNĐ • {campaignDuration === '2_weeks' ? '2 tuần' : campaignDuration === '4_weeks' ? '4 tuần' : '8 tuần'}
            </span>
          </div>
          <div className="ccreate-overview-item">
            <span className="ccreate-overview-item-label">Nền tảng & Creator</span>
            <span className="ccreate-overview-item-val">
              {selectedPlatforms.map(p => p.toUpperCase()).join(', ')} • {creatorQuantity} {creatorTier.toUpperCase()}
            </span>
          </div>
          <div className="ccreate-overview-item">
            <span className="ccreate-overview-item-label">Khán giả & Khu vực</span>
            <span className="ccreate-overview-item-val">
              {selectedAges.join(', ')} • {selectedGender === 'all' ? 'Tất cả' : selectedGender === 'female' ? 'Nữ' : 'Nam'} • {locationState}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignStep3;

