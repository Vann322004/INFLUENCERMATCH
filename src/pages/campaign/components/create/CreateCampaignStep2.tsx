import React from 'react';
import { Row, Col, Select, InputNumber, Input } from 'antd';
import {
  TikTokBrandIcon,
  InstagramBrandIcon,
  FacebookBrandIcon,
  AGE_GROUPS,
  GENDERS,
} from './createCampaignConstants';

const { TextArea } = Input;

interface CreateCampaignStep2Props {
  selectedPlatforms: string[];
  togglePlatform: (p: string) => void;
  creatorQuantity: number;
  setCreatorQuantity: (val: number) => void;
  minFollowers: string;
  handleMinFollowersChange: (val: string) => void;
  locationState: string;
  setLocationState: (val: string) => void;
  provinceOptions: { value: string; label: string }[];
  loadingProvinces: boolean;
  selectedAges: string[];
  toggleAge: (age: string) => void;
  selectedGender: string;
  setSelectedGender: (val: string) => void;
  creatorBrief: string;
  setCreatorBrief: (val: string) => void;
  isAiAutofilled: boolean;
}

export const CreateCampaignStep2: React.FC<CreateCampaignStep2Props> = ({
  selectedPlatforms,
  togglePlatform,
  creatorQuantity,
  setCreatorQuantity,
  minFollowers,
  handleMinFollowersChange,
  locationState,
  setLocationState,
  provinceOptions,
  loadingProvinces,
  selectedAges,
  toggleAge,
  selectedGender,
  setSelectedGender,
  creatorBrief,
  setCreatorBrief,
  isAiAutofilled,
}) => {
  return (
    <div className={`ccreate-card ${isAiAutofilled ? 'ai-highlight-card' : ''}`}>
      <div className="ccreate-card-header">
        <div className="ccreate-card-badge">2</div>
        <div>
          <div className="ccreate-card-title">Yêu cầu Creator & Chân dung khán giả</div>
          <div className="ccreate-card-subtitle">
            Thiết lập các tiêu chí tuyển chọn KOC/KOL và đặc điểm nhân khẩu học tệp người theo dõi.
          </div>
        </div>
      </div>

      {/* Phần 1: Nền tảng hoạt động */}
      <div className="ccreate-sub-section">
        <div className="ccreate-field-label">
          <span>Nền tảng ưu tiên quảng bá <span className="req">*</span></span>
        </div>
        <div className="ccreate-platform-strip">
          {[
            {
              key: 'tiktok',
              name: 'TikTok',
              icon: <TikTokBrandIcon size={16} color={selectedPlatforms.includes('tiktok') ? '#0F172A' : '#475569'} />,
            },
            {
              key: 'instagram',
              name: 'Instagram',
              icon: <InstagramBrandIcon size={16} color={selectedPlatforms.includes('instagram') ? '#E1306C' : '#64748B'} />,
            },
            {
              key: 'facebook',
              name: 'Facebook',
              icon: <FacebookBrandIcon size={16} color={selectedPlatforms.includes('facebook') ? '#1877F2' : '#64748B'} />,
            },
          ].map((p) => {
            const isSelected = selectedPlatforms.includes(p.key);
            return (
              <button
                key={p.key}
                type="button"
                className={`ccreate-platform-card ${isSelected ? 'selected' : ''}`}
                onClick={() => togglePlatform(p.key)}
              >
                {p.icon}
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Phần 2: Tiêu chí Creator */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <div className="ccreate-field-label">
            <span>Số lượng Creator cần tuyển <span className="req">*</span></span>
          </div>
          <InputNumber
            min={1}
            max={500}
            value={creatorQuantity}
            onChange={(val) => setCreatorQuantity(val || 1)}
            style={{ width: '100%', borderRadius: 10, height: 40, lineHeight: '38px' }}
            suffix={<span style={{ color: '#94A3B8', fontSize: 12 }}>Creator</span>}
          />
        </Col>

        <Col xs={24} sm={12}>
          <div className="ccreate-field-label">
            <span>Lượng Follower tối thiểu <span className="req">*</span></span>
          </div>
          <Select
            value={minFollowers || undefined}
            onChange={handleMinFollowersChange}
            placeholder="Chọn lượng Follower tối thiểu"
            style={{ width: '100%', height: 40 }}
            options={[
              { value: '10k', label: 'Từ 10.000 followers' },
              { value: '50k', label: 'Từ 50.000 followers' },
              { value: '100k', label: 'Từ 100.000 followers' },
              { value: '500k', label: 'Từ 500.000 followers' },
            ]}
          />
        </Col>

        <Col xs={24} sm={12}>
          <div className="ccreate-field-label">
            <span>Khu vực / Tỉnh thành ưu tiên <span className="req">*</span></span>
          </div>
          <Select
            showSearch
            loading={loadingProvinces}
            value={locationState}
            onChange={setLocationState}
            style={{ width: '100%', height: 40 }}
            filterOption={(input, option) =>
              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
            options={provinceOptions}
          />
        </Col>
      </Row>

      {/* Phần 3: Chân dung tệp khán giả */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <div className="ccreate-field-label">
            <span>Độ tuổi người theo dõi mục tiêu <span className="req">*</span></span>
            <span style={{ fontSize: 11.5, color: '#4F46E5', fontWeight: 600 }}>
              {selectedAges.length > 0 ? `Đã chọn ${selectedAges.length} nhóm` : '(Bắt buộc)'}
            </span>
          </div>
          <div className="ccreate-chips-group">
            {AGE_GROUPS.map((age) => {
              const isSelected = selectedAges.includes(age);
              return (
                <button
                  key={age}
                  type="button"
                  className={`ccreate-chip-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleAge(age)}
                >
                  {age}
                </button>
              );
            })}
          </div>
        </Col>

        <Col xs={24} md={10}>
          <div className="ccreate-field-label">
            <span>Giới tính khán giả <span className="req">*</span></span>
          </div>
          <div className="ccreate-chips-group">
            {GENDERS.map((g) => {
              const isSelected = selectedGender === g.key;
              return (
                <button
                  key={g.key}
                  type="button"
                  className={`ccreate-chip-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedGender(g.key)}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </Col>
      </Row>

      {/* Phần 4: Creator Brief */}
      <div>
        <div className="ccreate-field-label">
          <span>Tóm tắt yêu cầu sáng tạo (Creator Brief) <span className="req">*</span></span>
          <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 500 }}>
            Kịch bản, thông điệp chính & quy định (Bắt buộc)
          </span>
        </div>
        <TextArea
          rows={3}
          value={creatorBrief}
          onChange={(e) => setCreatorBrief(e.target.value)}
          placeholder="Mô tả thông điệp sản phẩm, key visual, hashtag bắt buộc, thời lượng video và quyền lợi dành cho Creator..."
          style={{ borderRadius: 10, fontSize: 13, lineHeight: 1.5 }}
        />
      </div>
    </div>
  );
};

export default CreateCampaignStep2;

