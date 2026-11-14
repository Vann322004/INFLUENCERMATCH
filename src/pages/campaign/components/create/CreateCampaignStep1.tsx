import React from 'react';
import { Row, Col, Input, Tag, Tooltip, Checkbox } from 'antd';
import { LockOutlined, AimOutlined, ShoppingCartOutlined, MessageOutlined } from '@ant-design/icons';

interface CreateCampaignStep1Props {
  campaignName: string;
  setCampaignName: (val: string) => void;
  product: string;
  setProduct: (val: string) => void;
  isProductLocked: boolean;
  interests: string;
  setInterests: (val: string) => void;
  selectedObjectives: string[];
  toggleObjective: (id: string) => void;
  isAiAutofilled: boolean;
}

const OBJECTIVES = [
  {
    id: 'awareness',
    title: 'Tăng nhận diện thương hiệu',
    subtitle: 'Tiếp cận nhiều người hơn',
    icon: <AimOutlined style={{ fontSize: 18 }} />,
  },
  {
    id: 'sales',
    title: 'Tăng doanh số',
    subtitle: 'Thúc đẩy chuyển đổi',
    icon: <ShoppingCartOutlined style={{ fontSize: 18 }} />,
  },
  {
    id: 'engagement',
    title: 'Tạo tương tác',
    subtitle: 'Tăng thích, bình luận, chia sẻ',
    icon: <MessageOutlined style={{ fontSize: 18 }} />,
  },
];

export const CreateCampaignStep1: React.FC<CreateCampaignStep1Props> = ({
  campaignName,
  setCampaignName,
  product,
  setProduct,
  isProductLocked,
  interests,
  setInterests,
  selectedObjectives,
  toggleObjective,
  isAiAutofilled,
}) => {
  return (
    <div className={`ccreate-card ${isAiAutofilled ? 'ai-highlight-card' : ''}`}>
      <div className="ccreate-card-header">
        <div className="ccreate-card-badge">1</div>
        <div>
          <div className="ccreate-card-title" style={{ display: 'flex', alignItems: 'center' }}>
            Thông tin chiến dịch & Mục tiêu tiếp thị
            {isAiAutofilled && <span className="ccreate-ai-badge">✨ AI Autofilled</span>}
          </div>
          <div className="ccreate-card-subtitle">
            Cung cấp các thông tin cơ bản về sản phẩm và định hướng mục tiêu để hệ thống tối ưu hóa đề xuất.
          </div>
        </div>
      </div>

      {/* Phần 1: Tên chiến dịch & Sản phẩm */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <div className="ccreate-field-label">
            <span>Tên chiến dịch <span className="req">*</span></span>
            <span style={{ color: '#94A3B8', fontSize: 11, fontWeight: 500 }}>{campaignName.length}/100</span>
          </div>
          <Input
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            maxLength={100}
            placeholder="Ví dụ: Summer Glow Skincare Launch 2026"
            style={{ borderRadius: 10, height: 40, fontSize: 13 }}
          />
        </Col>

        <Col xs={24} md={12}>
          <div className="ccreate-field-label">
            <span>Sản phẩm / Dịch vụ được quảng bá <span className="req">*</span></span>
            {isProductLocked && (
              <Tooltip title="Chiến dịch đã khởi chạy hoặc chốt KOC. Tên sản phẩm được khóa để bảo vệ tính nhất quán của hợp đồng.">
                <Tag color="orange" icon={<LockOutlined />} style={{ borderRadius: 6, fontSize: 11, cursor: 'help', margin: 0 }}>
                  Đã khóa
                </Tag>
              </Tooltip>
            )}
          </div>
          <Input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Nhập tên sản phẩm hoặc dịch vụ (ví dụ: Serum dưỡng sáng da, Kem chống nắng...)"
            style={{
              borderRadius: 10,
              height: 40,
              fontSize: 13,
              backgroundColor: isProductLocked ? '#F8FAFC' : undefined,
              borderColor: isProductLocked ? '#E2E8F0' : undefined,
            }}
            disabled={isProductLocked}
            suffix={isProductLocked ? <LockOutlined style={{ color: '#94A3B8' }} /> : undefined}
            allowClear={!isProductLocked}
          />
          {isProductLocked && (
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
              🔒 Tên sản phẩm cố định theo chiến dịch đã ký kết với creator.
            </div>
          )}
        </Col>

        <Col xs={24}>
          <div className="ccreate-field-label">
            <span>Ngành hàng & Sở thích liên quan <span className="req">*</span></span>
          </div>
          <Input
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="Ví dụ: Làm đẹp, Chăm sóc da, Skincare Routine, Thời trang công sở..."
            style={{ borderRadius: 10, height: 40, fontSize: 13 }}
          />
        </Col>
      </Row>

      {/* Phần 2: Mục tiêu chiến dịch */}
      <div className="ccreate-sub-section">
        <div className="ccreate-sub-title">
          <span>Mục tiêu chiến dịch <span style={{ color: '#EF4444' }}>*</span></span>
          <span style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600 }}>
            Đã chọn {selectedObjectives.length} mục tiêu
          </span>
        </div>

        <div className="ccreate-obj-grid">
          {OBJECTIVES.map((obj) => {
            const isSelected = selectedObjectives.includes(obj.id);
            return (
              <div
                key={obj.id}
                className={`ccreate-obj-card ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleObjective(obj.id)}
              >
                <div className="ccreate-obj-top">
                  <div className="ccreate-obj-icon">
                    {obj.icon}
                  </div>
                  <Checkbox checked={isSelected} style={{ pointerEvents: 'none' }} />
                </div>

                <div>
                  <div className="ccreate-obj-name">{obj.title}</div>
                  <div className="ccreate-obj-desc">{obj.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignStep1;

