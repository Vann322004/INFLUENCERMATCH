import React from 'react';
import { Row, Col, Input, Select, Tag, Tooltip, Checkbox } from 'antd';
import { LockOutlined, AimOutlined, ShoppingCartOutlined, MessageOutlined } from '@ant-design/icons';

const CATEGORY_LABELS: Record<string, string> = {
  beauty: 'Làm đẹp & Mỹ phẩm', skincare: 'Chăm sóc da', makeup: 'Trang điểm',
  fashion: 'Thời trang', lifestyle: 'Phong cách sống', student_lifestyle: 'Đời sống học sinh, sinh viên',
  food: 'Ẩm thực', travel: 'Du lịch', technology: 'Công nghệ', fitness: 'Thể hình',
  health: 'Sức khỏe', education: 'Giáo dục', pets: 'Thú cưng', gaming: 'Trò chơi',
};
const categoryLabel = (value: string) => CATEGORY_LABELS[value.toLowerCase()] || value;
const CAMPAIGN_CATEGORIES = [
  'Làm đẹp & Mỹ phẩm', 'Thời trang & Phụ kiện', 'Ẩm thực',
  'Du lịch', 'Công nghệ', 'Giải trí', 'Đời sống & Gia đình',
];
const CATEGORY_ALIASES: Record<string, string> = {
  'Chăm sóc cá nhân và đời sống': 'Chăm sóc cá nhân',
  'Thời trang': 'Thời trang & Phụ kiện',
  'Chăm sóc da & Skincare': 'Chăm sóc da',
  'Mỹ phẩm & Làm đẹp': 'Làm đẹp & Mỹ phẩm',
  'Đời sống học sinh, sinh viên': 'Phong cách sống',
};
const canonicalCategory = (value: string) => {
  const label = categoryLabel(value);
  const normalized = (CATEGORY_ALIASES[label] || label).toLocaleLowerCase('vi');
  if (/làm đẹp|mỹ phẩm|chăm sóc da|skincare|trang điểm|chăm sóc tóc|chăm sóc cá nhân/.test(normalized)) return 'Làm đẹp & Mỹ phẩm';
  if (/thời trang|fashion/.test(normalized)) return 'Thời trang & Phụ kiện';
  if (/ẩm thực|ăn uống|đồ ăn|food/.test(normalized)) return 'Ẩm thực';
  if (/du lịch|travel/.test(normalized)) return 'Du lịch';
  if (/công nghệ|điện thoại|gaming|trò chơi/.test(normalized)) return 'Công nghệ';
  if (/giải trí|truyền thông/.test(normalized)) return 'Giải trí';
  return 'Đời sống & Gia đình';
};
const GROUP_NICHES: Record<string, string[]> = {
  'Làm đẹp & Mỹ phẩm': ['Chăm sóc da', 'Trang điểm', 'Chăm sóc tóc', 'Chăm sóc cá nhân'],
  'Thời trang & Phụ kiện': ['Thời trang nữ', 'Thời trang nam', 'Giày dép', 'Phụ kiện thời trang'],
  'Ẩm thực': ['Đồ ăn', 'Đồ uống', 'Đồ ăn vặt', 'Nấu ăn', 'Review nhà hàng'],
  'Du lịch': ['Du lịch trải nghiệm', 'Review khách sạn', 'Du lịch & Ẩm thực'],
  'Công nghệ': ['Điện thoại', 'Máy tính', 'Thiết bị công nghệ', 'Gaming'],
  'Giải trí': ['Âm nhạc', 'Phim ảnh', 'Hài hước'],
  'Đời sống & Gia đình': ['Đồ gia dụng', 'Mẹ & Bé', 'Sức khỏe', 'Thể thao', 'Giáo dục', 'Thú cưng', 'Phong cách sống'],
};
const groupForNiche = (value: string) => {
  const label = CATEGORY_ALIASES[categoryLabel(value)] || categoryLabel(value);
  return Object.keys(GROUP_NICHES).find(group => GROUP_NICHES[group].includes(label)) || canonicalCategory(value);
};

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
  const selectedCategories = [...new Set(interests.split(',').map(value => value.trim()).filter(Boolean))];
  const selectedGroups = [...new Set(selectedCategories.map(groupForNiche))];
  const selectedNiches = selectedCategories.filter(value => !CAMPAIGN_CATEGORIES.includes(categoryLabel(value)));
  const nicheOptions = [...new Set(selectedGroups.flatMap(group => GROUP_NICHES[group] || []))];
  // Send specific niches when selected; broad group names must not weaken their filter.
  const saveSelection = (groups: string[], niches: string[]) => setInterests(groups.flatMap(group => {
    const specifics = niches.filter(value => groupForNiche(value) === group);
    return specifics.length ? specifics : [group];
  }).join(', '));

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
              <Tooltip title="Chiến dịch đã khởi chạy hoặc chốt Nhà sáng tạo. Tên sản phẩm được khóa để bảo vệ tính nhất quán của hợp đồng.">
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
            <span>Ngành hàng & Sở thích liên quan (tùy chọn)</span>
          </div>
          <Select
            aria-label="Ngành hàng và sở thích liên quan"
            mode="multiple"
            value={selectedGroups}
            onChange={(groups: string[]) => saveSelection(groups, selectedNiches)}
            options={CAMPAIGN_CATEGORIES.map(value => ({ value, label: value }))}
            showSearch
            optionFilterProp="label"
            allowClear
            placeholder="Chọn ngành hàng liên quan đến sản phẩm"
            notFoundContent="Không có ngành hàng phù hợp"
            style={{ width: '100%', minHeight: 40, fontSize: 13 }}
          />
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>
            Chọn nhóm ngành chung. Sản phẩm và brief giúp xác định chủ đề cụ thể để tìm creator phù hợp.
          </div>
          <div className="ccreate-field-label" style={{ marginTop: 16 }}>
            <span>Niche cụ thể <span style={{ color: '#94A3B8', fontWeight: 400 }}>(không bắt buộc)</span></span>
          </div>
          <Select
            aria-label="Niche cụ thể"
            mode="multiple"
            value={selectedNiches.map(value => ({ value, label: categoryLabel(value) }))}
            labelInValue
            onChange={(items: { value: string }[]) => saveSelection(selectedGroups, items.map(item => item.value))}
            options={nicheOptions.map(label => ({
              value: selectedNiches.find(value => categoryLabel(value) === label) || label,
              label,
            }))}
            disabled={!selectedGroups.length}
            showSearch
            optionFilterProp="label"
            allowClear
            placeholder="Chọn chủ đề cụ thể trong nhóm ngành"
            style={{ width: '100%', minHeight: 40 }}
          />
        </Col>
      </Row>

      {/* Phần 2: Mục tiêu chiến dịch */}
      <div className="ccreate-sub-section">
        <div className="ccreate-sub-title">
          <span>Mục tiêu chiến dịch <span style={{ color: '#EF4444' }}>*</span></span>
          <span style={{ fontSize: 12, color: '#6D28D9', fontWeight: 600 }}>
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

