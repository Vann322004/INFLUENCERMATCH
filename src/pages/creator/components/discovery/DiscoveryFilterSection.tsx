import React, { useState } from 'react';
import { Input, Button, Select } from 'antd';
import {
  SearchOutlined,
  DownOutlined,
  UpOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  CloseOutlined,
  SlidersOutlined,
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
  campaignPlatforms?: string[];
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
  campaignPlatforms,
  onPlatformChange,
  selectedCategory,
  onCategoryChange,
  categoriesList,
  followerTier,
  onFollowerTierChange,
  engagementTier,
  onEngagementTierChange,
  activeFiltersCount,
  onResetFilters,
}) => {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  return (
    <div className="cdiscovery-search-filter-card is-sticky">
      {/* Dòng 1: Thanh tìm kiếm gọn, luôn ghim khi cuộn */}
      <div className="cdiscovery-filter-row-top">
        <div className="cdiscovery-search-input-group">
          <Input
            placeholder="Tìm kiếm Nhà sáng tạo theo tên, kênh, chủ đề, từ khóa..."
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
          <Button
            type={isFilterExpanded || activeFiltersCount > 0 ? 'default' : 'default'}
            icon={<SlidersOutlined />}
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            aria-expanded={isFilterExpanded}
            className={`cdiscovery-btn-filter-toggle ${isFilterExpanded || activeFiltersCount > 0 ? 'is-active' : ''}`}
          >
            Bộ lọc{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''} {isFilterExpanded ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />}
          </Button>
        </div>

        <div className="cdiscovery-sort-group">
          <span className="cdiscovery-sort-label">Sắp xếp:</span>
          <Select
            value={sortBy}
            onChange={onSortChange}
            className="cdiscovery-sort-select"
            options={[
              { value: 'match', label: 'Độ liên quan' },
              { value: 'followers', label: 'Lượt theo dõi' },
              { value: 'engagement', label: 'Tỷ lệ tương tác' },
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

      {isFilterExpanded && (
        <>

          {/* Dòng 2: Thanh bộ lọc tinh gọn, sang trọng (Pills Filter Capsules) */}
          <div className="cdiscovery-filter-pills-row">
            {/* 1. Nền tảng */}
            {campaignPlatforms?.length !== 1 && <div className="cdiscovery-filter-field"><span className="cdiscovery-filter-field-label">Nền tảng</span><Select
              value={selectedPlatform}
              onChange={onPlatformChange}
              className={`cdiscovery-pill-select ${selectedPlatform !== 'all' ? 'has-value' : ''}`}
              popupMatchSelectWidth
              suffixIcon={<DownOutlined style={{ fontSize: 10, color: selectedPlatform !== 'all' ? '#6D28D9' : '#94A3B8' }} />}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'tiktok', label: 'TikTok' },
                { value: 'instagram', label: 'Instagram' },
                { value: 'youtube', label: 'YouTube' },
                { value: 'facebook', label: 'Facebook' },
                { value: 'x', label: 'X (Twitter)' },
              ].filter(option => option.value === 'all' || !campaignPlatforms?.length || campaignPlatforms.includes(option.value))}
            /></div>}

            {/* 2. Ngành hàng */}
            <div className="cdiscovery-filter-field"><span className="cdiscovery-filter-field-label">Ngành hàng</span><Select
              value={selectedCategory}
              onChange={onCategoryChange}
              className={`cdiscovery-pill-select ${selectedCategory !== 'all' ? 'has-value' : ''}`}
              popupMatchSelectWidth={false}
              suffixIcon={<DownOutlined style={{ fontSize: 10, color: selectedCategory !== 'all' ? '#6D28D9' : '#94A3B8' }} />}
              options={[
                { value: 'all', label: 'Tất cả' },
                ...categoriesList.map((c) => ({ value: c, label: c })),
              ]}
            /></div>

            {/* 3. Lượt theo dõi / Quy mô */}
            <div className="cdiscovery-filter-field"><span className="cdiscovery-filter-field-label">Người theo dõi</span><Select
              value={followerTier}
              onChange={onFollowerTierChange}
              className={`cdiscovery-pill-select ${followerTier !== 'all' ? 'has-value' : ''}`}
              popupMatchSelectWidth={false}
              suffixIcon={<DownOutlined style={{ fontSize: 10, color: followerTier !== 'all' ? '#6D28D9' : '#94A3B8' }} />}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'nano', label: 'Dưới 50 nghìn' },
                { value: 'micro', label: '50 – dưới 200 nghìn' },
                { value: 'macro', label: '200 – dưới 500 nghìn' },
                { value: 'mega', label: 'Từ 500 nghìn' },
              ]}
            /></div>

            {/* 4. Tỷ lệ tương tác */}
            <div className="cdiscovery-filter-field"><span className="cdiscovery-filter-field-label">Tỷ lệ tương tác</span><Select
              value={engagementTier}
              onChange={onEngagementTierChange}
              className={`cdiscovery-pill-select ${engagementTier !== 'all' ? 'has-value' : ''}`}
              popupMatchSelectWidth={false}
              suffixIcon={<DownOutlined style={{ fontSize: 10, color: engagementTier !== 'all' ? '#6D28D9' : '#94A3B8' }} />}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'high', label: 'Cao (≥ 5%)' },
                { value: 'vhigh', label: 'Rất cao (≥ 8%)' },
              ]}
            /></div>

            {/* Nút đặt lại nhanh chỉ hiện khi có bộ lọc */}
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

