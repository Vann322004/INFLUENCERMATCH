import React, { useState } from 'react';
import type { QualityItem, QualityOverview } from '../../types';
import QualityStatsCards from './QualityStatsCards';
import QualityFilterBar from './QualityFilterBar';
import QualityTable from './QualityTable';
import StandardizeModal from './StandardizeModal';

interface QualityReviewTabProps {
  overview: QualityOverview;
  items: QualityItem[];
  loading: boolean;
  recrawlingId: string | null;
  onApproveSubmit: (item: QualityItem, values: { niche: string; primaryType: string; notes?: string }) => Promise<void>;
  onRecrawl: (item: QualityItem) => Promise<void>;
}

export const QualityReviewTab: React.FC<QualityReviewTabProps> = ({
  overview,
  items,
  loading,
  recrawlingId,
  onApproveSubmit,
  onRecrawl,
}) => {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<QualityItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [approving, setApproving] = useState(false);

  // Filter items
  const filteredItems = items.filter((it) => {
    if (platformFilter !== 'all' && it.platform.toLowerCase() !== platformFilter.toLowerCase()) return false;
    if (confidenceFilter === 'high' && it.dataConfidence < 0.7) return false;
    if (confidenceFilter === 'medium' && (it.dataConfidence < 0.5 || it.dataConfidence >= 0.7)) return false;
    if (confidenceFilter === 'low' && it.dataConfidence >= 0.5) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (it.displayName || '').toLowerCase().includes(q);
      const matchUser = (it.userName || '').toLowerCase().includes(q);
      const matchNiche = (it.niche || '').toLowerCase().includes(q);
      const matchSummary = (it.contentSummary || '').toLowerCase().includes(q);
      if (!matchName && !matchUser && !matchNiche && !matchSummary) return false;
    }
    return true;
  });

  const handleOpenApprove = (item: QualityItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleModalSubmit = async (values: { niche: string; primaryType: string; notes?: string }) => {
    if (!selectedItem) return;
    setApproving(true);
    try {
      await onApproveSubmit(selectedItem, values);
      setModalOpen(false);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div style={{ padding: '24px 24px 32px' }}>
      {/* 1. Stat cards */}
      <QualityStatsCards overview={overview} fallbackPendingCount={items.length} />

      {/* 2. Filter bar */}
      <QualityFilterBar
        search={search}
        onSearchChange={setSearch}
        platformFilter={platformFilter}
        onPlatformChange={setPlatformFilter}
        confidenceFilter={confidenceFilter}
        onConfidenceChange={setConfidenceFilter}
        filteredCount={filteredItems.length}
        totalCount={items.length}
      />

      {/* 3. Table */}
      <QualityTable
        items={filteredItems}
        loading={loading}
        recrawlingId={recrawlingId}
        onOpenApprove={handleOpenApprove}
        onRecrawl={onRecrawl}
      />

      {/* 4. Standardize modal */}
      <StandardizeModal
        open={modalOpen}
        selectedItem={selectedItem}
        approving={approving}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default QualityReviewTab;

