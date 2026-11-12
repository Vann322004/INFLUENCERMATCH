import React, { useState } from 'react';
import { message } from 'antd';
import type { QualityItem, QualityOverview } from '../../types';
import QualityStatsCards from './QualityStatsCards';
import QualityFilterBar from './QualityFilterBar';
import QualityTable from './QualityTable';

interface QualityReviewTabProps {
  overview: QualityOverview;
  items: QualityItem[];
  loading: boolean;
  recrawlingId: string | null;
  rejectingId?: string | null;
  onApproveSubmit: (item: QualityItem, values: { niche: string; primaryType: string; notes?: string }) => Promise<void>;
  onReject: (item: QualityItem) => Promise<void>;
  onRecrawl: (item: QualityItem) => Promise<void>;
}

export const QualityReviewTab: React.FC<QualityReviewTabProps> = ({
  overview,
  items,
  loading,
  recrawlingId,
  rejectingId,
  onApproveSubmit,
  onReject,
  onRecrawl,
}) => {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [batchApproving, setBatchApproving] = useState(false);

  // Per-row inline edits (niche & primaryType)
  const [drafts, setDrafts] = useState<Record<string, { niche: string; primaryType: 'KOC' | 'KOL' }>>({});

  const handleDraftChange = (metricId: string, updates: Partial<{ niche: string; primaryType: 'KOC' | 'KOL' }>) => {
    setDrafts((prev) => ({
      ...prev,
      [metricId]: {
        niche: updates.niche ?? prev[metricId]?.niche ?? 'Sản phẩm tiêu dùng',
        primaryType: updates.primaryType ?? prev[metricId]?.primaryType ?? 'KOC',
      },
    }));
  };

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

  const highConfidenceFilteredItems = filteredItems.filter((i) => i.dataConfidence >= 0.7);
  const totalHighConfidenceCount = items.filter((i) => i.dataConfidence >= 0.7).length;

  // 1-Click quick approve (NO MODAL)
  const handleQuickApprove = async (item: QualityItem) => {
    setApprovingId(item.metricId);
    try {
      const chosenNiche = drafts[item.metricId]?.niche || item.niche || 'Sản phẩm tiêu dùng';
      const chosenType = drafts[item.metricId]?.primaryType || 'KOC';
      await onApproveSubmit(item, {
        niche: chosenNiche,
        primaryType: chosenType,
      });
    } finally {
      setApprovingId(null);
    }
  };

  // Batch approve all reliable items
  const handleBatchApproveHighConfidence = async () => {
    if (highConfidenceFilteredItems.length === 0) return;
    setBatchApproving(true);
    message.loading({ content: `Đang phê duyệt nhanh ${highConfidenceFilteredItems.length} hồ sơ đạt chuẩn...`, key: 'batch_approve' });
    let successCount = 0;
    try {
      for (const item of highConfidenceFilteredItems) {
        const chosenNiche = drafts[item.metricId]?.niche || item.niche || 'Sản phẩm tiêu dùng';
        const chosenType = drafts[item.metricId]?.primaryType || 'KOC';
        try {
          await onApproveSubmit(item, { niche: chosenNiche, primaryType: chosenType });
          successCount++;
        } catch {
          // Continue with next
        }
      }
      message.success({
        content: `Đã chuẩn hóa và nạp thành công ${successCount} hồ sơ vào Creator Catalog!`,
        key: 'batch_approve',
      });
    } finally {
      setBatchApproving(false);
    }
  };

  return (
    <div style={{ padding: '24px 24px 32px' }}>
      {/* 1. Stat cards đồng bộ giao diện */}
      <QualityStatsCards
        overview={overview}
        fallbackPendingCount={items.length}
        highConfidenceCount={totalHighConfidenceCount}
      />

      {/* 2. Thanh lọc & nút duyệt nhanh */}
      {(items.length > 0 || search || platformFilter !== 'all' || confidenceFilter !== 'all') && (
        <QualityFilterBar
          search={search}
          onSearchChange={setSearch}
          platformFilter={platformFilter}
          onPlatformChange={setPlatformFilter}
          confidenceFilter={confidenceFilter}
          onConfidenceChange={setConfidenceFilter}
          filteredCount={filteredItems.length}
          totalCount={items.length}
          highConfidenceCount={highConfidenceFilteredItems.length}
          onBatchApproveHighConfidence={handleBatchApproveHighConfidence}
          batchApproving={batchApproving}
        />
      )}

      {/* 3. Bảng chuẩn hóa inline (không modal) */}
      <QualityTable
        items={filteredItems}
        loading={loading}
        recrawlingId={recrawlingId}
        approvingId={approvingId}
        rejectingId={rejectingId}
        drafts={drafts}
        onDraftChange={handleDraftChange}
        onQuickApprove={handleQuickApprove}
        onReject={onReject}
        onRecrawl={onRecrawl}
      />
    </div>
  );
};

export default QualityReviewTab;
