import React from 'react';
import { Card, Spin, Typography, Button, Pagination, Select } from 'antd';
import type { Creator, BrandCampaignItem } from './types';
import CreatorCard from './CreatorCard';
import CreatorListItem from './CreatorListItem';

const { Title, Paragraph } = Typography;

interface CreatorGridListProps {
  loading: boolean;
  isMatching: boolean;
  creators: Creator[];
  paginatedCreators: Creator[];
  totalCount: number;
  viewMode: 'grid' | 'list';
  matchedCampaign: BrandCampaignItem | null;
  safeCurrentPage: number;
  pageSize: number;
  selectedCreatorIds: Set<string>;
  onToggleSelectCreator: (id: string) => void;
  onOpenCreator: (creator: Creator) => void;
  onOpenShortlist: (creator: Creator, e?: React.MouseEvent) => void;
  onPreview: (creator: Creator) => void;
  onShare: (creator: Creator) => void;
  onMessage: () => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const CreatorGridList: React.FC<CreatorGridListProps> = ({
  loading,
  isMatching,
  creators,
  paginatedCreators,
  totalCount,
  viewMode,
  matchedCampaign,
  safeCurrentPage,
  pageSize,
  selectedCreatorIds,
  onToggleSelectCreator,
  onOpenCreator,
  onOpenShortlist,
  onPreview,
  onShare,
  onMessage,
  onResetFilters,
  onPageChange,
  onPageSizeChange,
}) => {
  if (loading || isMatching) {
    return (
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          textAlign: 'center',
          padding: '80px 20px',
          background: '#FFFFFF',
        }}
      >
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#64748B', fontWeight: 600, fontSize: 14 }}>
          Đang tải danh sách KOC từ hệ thống...
        </div>
      </Card>
    );
  }

  if (totalCount === 0) {
    return (
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          textAlign: 'center',
          padding: '60px 20px',
          background: '#FFFFFF',
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
        <Title level={4} style={{ color: '#0F172A', marginBottom: 6 }}>
          Không tìm thấy KOC phù hợp
        </Title>
        <Paragraph style={{ color: '#64748B', maxWidth: 440, margin: '0 auto 16px auto', fontSize: 13.5 }}>
          Hãy thử điều chỉnh lại từ khóa tìm kiếm hoặc bỏ bớt các tiêu chí lọc để xem thêm kết quả phù hợp.
        </Paragraph>
        <Button
          type="primary"
          onClick={onResetFilters}
          style={{ background: '#4F46E5', borderRadius: 10, height: 40, fontWeight: 700 }}
        >
          Đặt lại bộ lọc
        </Button>
      </Card>
    );
  }

  return (
    <>
      {viewMode === 'grid' ? (
        <div className="cdiscovery-cards-grid">
          {paginatedCreators.map((creator, index) => (
            <CreatorCard
              key={creator.id}
              creator={creator}
              index={index}
              isSelected={selectedCreatorIds.has(creator.id)}
              matchedCampaign={matchedCampaign}
              safeCurrentPage={safeCurrentPage}
              onToggleSelect={onToggleSelectCreator}
              onOpenCreator={onOpenCreator}
              onOpenShortlist={onOpenShortlist}
              onPreview={onPreview}
              onShare={onShare}
              onMessage={onMessage}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {paginatedCreators.map((creator, index) => (
            <CreatorListItem
              key={creator.id}
              creator={creator}
              index={index}
              isSelected={selectedCreatorIds.has(creator.id)}
              matchedCampaign={matchedCampaign}
              onToggleSelect={onToggleSelectCreator}
              onOpenCreator={onOpenCreator}
              onOpenShortlist={onOpenShortlist}
            />
          ))}
        </div>
      )}

      {/* Phân trang chân trang */}
      <div className="cdiscovery-pagination-row">
        <div className="cdiscovery-pagination-count">
          Hiển thị <strong style={{ color: '#0F172A' }}>{Math.min(pageSize, totalCount)}</strong> / <strong style={{ color: '#0F172A' }}>{totalCount}</strong> kết quả
        </div>

        <Pagination
          current={safeCurrentPage}
          pageSize={pageSize}
          total={totalCount}
          onChange={onPageChange}
          showSizeChanger={false}
        />

        <div className="cdiscovery-page-size-wrap">
          <span>Hiển thị:</span>
          <Select
            value={pageSize}
            onChange={onPageSizeChange}
            options={[
              { value: 6, label: '6 / trang' },
              { value: 9, label: '9 / trang' },
              { value: 12, label: '12 / trang' },
              { value: 18, label: '18 / trang' },
            ]}
            style={{ width: 112 }}
          />
        </div>
      </div>
    </>
  );
};

export default CreatorGridList;

