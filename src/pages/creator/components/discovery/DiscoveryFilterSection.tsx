import React, { useState } from 'react';
import { Input, Button, Select } from 'antd';
import {
  SearchOutlined,
  DownOutlined,
  UpOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  CloseOutlined,
} from '@ant-design/icons';

interface DiscoveryFilterSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  selectedPlatform: string;
  onPlatformChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categoriesList: string[];
  followerTier: string;
  onFollowerTierChange: (value: string) => void;
  engagementTier: string;
  onEngagementTierChange: (value: string) => void;
  audienceAge: string;
  onAudienceAgeChange: (value: string) => void;
  audienceGender: string;
  onAudienceGenderChange: (value: string) => void;
  priceTier: string;
  priceFilterAvailable?: boolean;
  onPriceTierChange: (value: string) => void;
  activeFiltersCount: number;
  onResetFilters: () => void;
}

export const DiscoveryFilterSection: React.FC<DiscoveryFilterSectionProps> = ({
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  selectedPlatform,
  onPlatformChange,
  selectedCategory,
  onCategoryChange,
  categoriesList,
  followerTier,
  onFollowerTierChange,
  engagementTier,
  onEngagementTierChange,
  audienceAge,
  onAudienceAgeChange,
  audienceGender,
  onAudienceGenderChange,
  priceTier,
  priceFilterAvailable = false,
  onPriceTierChange,
  activeFiltersCount,
  onResetFilters,
}) => {
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  return (
    <div className="cdiscovery-search-filter-card">
      <div
        className="cdiscovery-filter-card-header"
        onClick={() => setIsFilterExpanded(!isFilterExpanded)}
      >
        <span className="cdiscovery-filter-card-title">
          Tìm kiếm & Bộ lọc {isFilterExpanded ? <DownOutlined style={{ fontSize: 12, marginLeft: 4 }} /> : <UpOutlined style={{ fontSize: 12, marginLeft: 4 }} />}
        </span>
        <span className="cdiscovery-filter-toggle-icon">
          {isFilterExpanded ? 'Thu gọn' : 'Mở rộng'}
        </span>
      </div>

      {isFilterExpanded && (
        <>
          {/* Dòng 1: Tìm kiếm + Sắp xếp + View switch */}
          <div className="cdiscovery-filter-row-top">
            <div className="cdiscovery-search-input-group">
              <Input
                placeholder="Tìm kiếm KOC theo tên, kênh, chủ đề, từ khóa..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onPressEnter={onSearchSubmit}
                prefix={<SearchOutlined style={{ color: '#94A3B8', fontSize: 15 }} />}
                allowClear
                className="cdiscovery-search-input"
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={onSearchSubmit}
                className="cdiscovery-btn-search"
              >
                Tìm kiếm
              </Button>
            </div>

            <div className="cdiscovery-sort-group">
              <span className="cdiscovery-sort-label">Sắp xếp:</span>
              <Select
                value={sortBy}
                onChange={onSortChange}
                className="cdiscovery-sort-select"
                options={[
                  { value: 'match', label: 'Độ phù hợp (AI)' },
                  { value: 'followers', label: 'Lượt theo dõi' },
                  { value: 'engagement', label: 'Tỷ lệ tương tác' },
                  { value: 'priceAsc', label: 'Giá: Thấp đến cao' },
                  { value: 'priceDesc', label: 'Giá: Cao đến thấp' },
                ]}
              />
            </div>

            <div className="cdiscovery-view-switch-btns">
              <button
                type="button"
                className={`cdiscovery-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => onViewModeChange('grid')}
                title="Dạng lưới"
              >
                <AppstoreOutlined />
              </button>
              <button
                type="button"
                className={`cdiscovery-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => onViewModeChange('list')}
                title="Dạng danh sách"
              >
                <UnorderedListOutlined />
              </button>
            </div>
          </div>

          {/* Dòng 2: Thanh bộ lọc tinh gọn, sang trọng (Pills Filter Capsules) */}
          <div className="cdiscovery-filter-pills-row">
            {/* 1. Nền tảng */}
            <Select
              value={selectedPlatform}
              onChange={onPlatformChange}
              className={`cdiscovery-pill-select ${selectedPlatform !== 'all' ? 'has-value' : ''}`}
              popupMatchSelectWidth={false}
              suffixIcon={<DownOutlined style={{ fontSize: 10, color: selectedPlatform !== 'all' ? '#4F46E5' : '#94A3B8' }} />}
              options={[
                { value: 'all', label: 'Nền tảng: Tất cả' },
                { value: 'tiktok', label: 'TikTok' },
                { value: 'instagram', label: 'Instagram' },
                { value: 'youtube', label: 'YouTube' },
                { value: 'facebook', label: 'Facebook' },
                { value: 'x', label: 'X (Twitter)' },
              ]}
            />

            {/* 2. Ngành hàng */}
            <Select
              value={selectedCategory}
              onChange={onCategoryChange}
              className={`cdiscovery-pill-select ${selectedCategory !== 'all' ? 'has-value' : ''}`}
              popupMatchSelectWidth={false}
              suffixIcon={<DownOutlined style={{ fontSize: 10, color: selectedCategory !== 'all' ? '#4F46E5' : '#94A3B8' }} />}
              options={[
                { value: 'all', label: 'Ngành hàng: Tất cả' },
                ...categoriesList.map((c) => ({ value: c, label: c })),
              ]}
            />

            {/* 3. Lượt theo dõi / Quy mô */}
            <Select
              value={followerTier}
              onChange={onFollowerTierChange}
              className={`cdiscovery-pill-select ${followerTier !== 'all' ? 'has-value' : ''}`}
              popupMatchSelectWidth={false}
              suffixIcon={<DownOutlined style={{ fontSize: 10, color: followerTier !== 'all' ? '#4F46E5' : '#94A3B8' }} />}
              options={[
                { value: 'all', label: 'Quy mô: Tất cả' },
                { value: 'nano', label: 'Nano (< 50K)' },
                { value: 'micro', label: 'Micro (50K – 200K)' },
                { value: 'macro', label: 'Macro (200K – 500K)' },
                { value: 'mega', label: 'Mega (500K+)' },
              ]}
            />

            {/* 4. Tỷ lệ tương tác */}
            <Select
              value={engagementTier}
              onChange={onEngagementTierChange}
              className={`cdiscovery-pill-select ${engagementTier !== 'all' ? 'has-value' : ''}`}
              popupMatchSelectWidth={false}
              suffixIcon={<DownOutlined style={{ fontSize: 10, color: engagementTier !== 'all' ? '#4F46E5' : '#94A3B8' }} />}
              options={[
                { value: 'all', label: 'Tương tác: Tất cả' },
                { value: 'high', label: 'Tương tác cao (≥ 5%)' },
                { value: 'vhigh', label: 'Rất cao (≥ 8%)' },
              ]}
            />

            {/* 5. Độ tuổi khán giả */}
            <Select
              value={audienceAge}
              disabled
              title="API chưa cung cấp dữ liệu độ tuổi khán giả để lọc."
              onChange={onAudienceAgeChange}
              className={`cdiscovery-pill-select ${audienceAge !== 'all' ? 'has-value' : ''}`}
              popupMatchSelectWidth={false}
              suffixIcon={<DownOutlined style={{ fontSize: 10, color: audienceAge !== 'all' ? '#4F46E5' : '#94A3B8' }} />}
              options={[
                { value: 'all', label: 'Độ tuổi: Tất cả' },
                { value: '18-24', label: '18 – 24 tuổi' },
                { value: '25-34', label: '25 – 34 tuổi' },
                { value: '35+', label: '35+ tuổi' },
              ]}
            />

            {/* 6. Giới tính khán giả */}
            <Select
              value={audienceGender}
              disabled
              title="API chưa cung cấp tỷ lệ giới tính khán giả để lọc."
              onChange={onAudienceGenderChange}
              className={`cdiscovery-pill-select ${audienceGender !== 'all' ? 'has-value' : ''}`}
              popupMatchSelectWidth={false}
              suffixIcon={<DownOutlined style={{ fontSize: 10, color: audienceGender !== 'all' ? '#4F46E5' : '#94A3B8' }} />}
              options={[
                { value: 'all', label: 'Giới tính: Tất cả' },
                { value: 'female', label: 'Nữ giới (> 60%)' },
                { value: 'male', label: 'Nam giới (> 60%)' },
                { value: 'balanced', label: 'Cân bằng (50/50)' },
              ]}
            />

            {/* 7. Mức ngân sách / Báo giá */}
            <Select
              value={priceTier}
              disabled={!priceFilterAvailable}
              title={priceFilterAvailable ? undefined : 'Chưa có dữ liệu báo giá để lọc.'}
              onChange={onPriceTierChange}
              className={`cdiscovery-pill-select ${priceTier !== 'all' ? 'has-value' : ''}`}
              popupMatchSelectWidth={false}
              suffixIcon={<DownOutlined style={{ fontSize: 10, color: priceTier !== 'all' ? '#4F46E5' : '#94A3B8' }} />}
              options={[
                { value: 'all', label: 'Báo giá: Tất cả' },
                { value: 'low', label: 'Dưới $500' },
                { value: 'mid', label: '$500 – $1,000' },
                { value: 'high', label: 'Trên $1,000' },
              ]}
            />

            {/* Nút đặt lại nhanh nếu có bộ lọc */}
            {activeFiltersCount > 0 && (
              <Button
                type="link"
                size="small"
                onClick={onResetFilters}
                className="cdiscovery-filter-reset-btn"
              >
                <CloseOutlined style={{ fontSize: 10 }} /> Đặt lại ({activeFiltersCount})
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DiscoveryFilterSection;

