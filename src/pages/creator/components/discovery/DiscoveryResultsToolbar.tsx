import React from 'react';
import { Button } from 'antd';
import type { Creator, BrandCampaignItem } from './types';

interface DiscoveryResultsToolbarProps {
  loading: boolean;
  isMatching: boolean;
  matchedCampaign: BrandCampaignItem | null;
  filteredCount: number;
  paginatedCreators: Creator[];
  selectedCreatorIds: Set<string>;
  onToggleSelectAll: () => void;
  onBulkAddToShortlist: () => void;
}

export const DiscoveryResultsToolbar: React.FC<DiscoveryResultsToolbarProps> = ({
  loading,
  isMatching,
  matchedCampaign,
  filteredCount,
  paginatedCreators,
  selectedCreatorIds,
  onToggleSelectAll,
  onBulkAddToShortlist,
}) => {
  const isAllSelected =
    paginatedCreators.length > 0 &&
    paginatedCreators.every((c) => selectedCreatorIds.has(c.id));

  return (
    <div className="cdiscovery-results-toolbar">
      <div className="cdiscovery-results-left">
        <span className="cdiscovery-results-heading">
          {loading || isMatching
            ? 'Đang tải danh sách Nhà sáng tạo...'
            : matchedCampaign
            ? `Nhà sáng tạo phù hợp (${filteredCount} hồ sơ)`
            : `Tất cả Nhà sáng tạo hệ thống (${filteredCount.toLocaleString('vi-VN')} Nhà sáng tạo)`}
        </span>
        <label className="cdiscovery-select-all-label">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={onToggleSelectAll}
            className="cdiscovery-checkbox"
          />
          <span>Chọn trang này</span>
        </label>
      </div>

      <div className="cdiscovery-results-right">
        <span className="cdiscovery-selected-badge">
          Đã chọn: {selectedCreatorIds.size} Nhà sáng tạo
        </span>
        <Button
          type="primary"
          disabled={selectedCreatorIds.size === 0}
          onClick={onBulkAddToShortlist}
          className="cdiscovery-btn-bulk-shortlist"
        >
          + Lưu các kênh đã chọn
        </Button>
      </div>
    </div>
  );
};

export default DiscoveryResultsToolbar;

