import React, { useState } from 'react';
import { Button, Checkbox } from 'antd';
import CreatorAvatar from './CreatorAvatar';
import { DownOutlined } from '@ant-design/icons';
import type { Creator, BrandCampaignItem } from './types';

interface DiscoveryResultsToolbarProps {
  loading: boolean;
  isMatching: boolean;
  matchedCampaign: BrandCampaignItem | null;
  filteredCount: number;
  availableCreators: Creator[];
  selectedCreatorIds: Set<string>;
  onBulkAddToShortlist: () => void;
  onViewShortlist?: () => void;
  onQuickSelect: (ids: string[], selected: boolean) => void;
}

export const DiscoveryResultsToolbar: React.FC<DiscoveryResultsToolbarProps> = ({
  loading,
  isMatching,
  matchedCampaign,
  filteredCount,
  availableCreators,
  selectedCreatorIds,
  onBulkAddToShortlist,
  onViewShortlist,
  onQuickSelect,
}) => {
  const [quickOpen, setQuickOpen] = useState(false);
  const busy = loading || isMatching;
  const matched = availableCreators.filter(creator => !creator.isSimilarFallback);
  const selectable = availableCreators.filter(creator => !creator.saved);
  const allSelected = selectable.length > 0 && selectable.every(creator => selectedCreatorIds.has(creator.id));

  return (
    <div className="cdiscovery-results-toolbar">
      <div className="cdiscovery-results-left">
        <span className="cdiscovery-results-heading">
          {loading || isMatching
            ? 'Đang tải danh sách Nhà sáng tạo...'
            : matchedCampaign
            ? `Kết quả khám phá · ${filteredCount.toLocaleString('vi-VN')} hồ sơ`
            : `Nhà sáng tạo · ${filteredCount.toLocaleString('vi-VN')} hồ sơ`}
        </span>
        <span className="cdiscovery-selected-badge">Đã chọn {selectedCreatorIds.size} kênh</span>
      </div>

      <div className="cdiscovery-results-right">
        {onViewShortlist && <Button disabled={!matchedCampaign} onClick={onViewShortlist}>Danh sách đã chọn</Button>}
          <Button onClick={() => setQuickOpen(value => !value)} disabled={busy || !availableCreators.length} aria-expanded={quickOpen}>Chọn nhanh <DownOutlined /></Button>
        {selectedCreatorIds.size > 0 && (
          <Button
            type="primary"
            disabled={busy}
            onClick={onBulkAddToShortlist}
            className="cdiscovery-btn-bulk-shortlist"
          >
            + Lưu {selectedCreatorIds.size} kênh đã chọn
          </Button>
        )}
      </div>
      {quickOpen && !busy && <div className="cdiscovery-quick-select">
            <div className="cdiscovery-quick-select-head"><strong>Chọn từ kết quả khám phá</strong><span>{availableCreators.length} kênh</span></div>
            <div className="cdiscovery-quick-select-actions">
              <Button size="small" disabled={!selectable.length} onClick={() => onQuickSelect(selectable.map(creator => creator.id), !allSelected)}>{allSelected ? 'Bỏ chọn tất cả kết quả' : 'Chọn tất cả kết quả'}</Button>
              {matchedCampaign && <Button size="small" disabled={!matched.length} onClick={() => {
                onQuickSelect([...selectedCreatorIds], false);
                onQuickSelect(matched.filter(creator => !creator.saved).map(creator => creator.id), true);
              }}>Chỉ chọn nhóm phù hợp</Button>}
            </div>
            <div className="cdiscovery-quick-select-list">{availableCreators.map(creator => <Checkbox key={creator.id} className="cdiscovery-quick-select-row"
              disabled={creator.saved} checked={selectedCreatorIds.has(creator.id)} onChange={event => onQuickSelect([creator.id], event.target.checked)}>
              <CreatorAvatar src={creator.avatar} name={creator.name} size={30} />
              <span className="cdiscovery-quick-select-copy"><strong>{creator.name}</strong><small>{creator.saved ? 'Đã lưu trong chiến dịch' : creator.isSimilarFallback ? 'Kết quả mở rộng' : matchedCampaign ? 'Phù hợp yêu cầu' : creator.username}</small></span>
            </Checkbox>)}</div>
            <div className="cdiscovery-quick-select-footer">
              <Button type="text" size="small" disabled={!selectedCreatorIds.size} onClick={() => onQuickSelect([...selectedCreatorIds], false)}>Bỏ chọn tất cả</Button>
              <Button type="primary" size="small" onClick={() => setQuickOpen(false)}>Xong</Button>
            </div>
          </div>}
    </div>
  );
};

export default DiscoveryResultsToolbar;

