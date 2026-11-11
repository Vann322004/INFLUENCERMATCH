import React, { useState } from 'react';
import { Alert } from 'antd';
import type { IdentityConflictItem } from '../../types';
import IdentityStatsCards from './IdentityStatsCards';
import IdentityFilterBar from './IdentityFilterBar';
import IdentityTable from './IdentityTable';
import MergeConflictModal from './MergeConflictModal';
import CompareConflictDrawer from './CompareConflictDrawer';

interface IdentityResolutionTabProps {
  conflicts: IdentityConflictItem[];
  loading?: boolean;
  onConfirmMerge: (conflict: IdentityConflictItem, masterProfileId: string) => Promise<void>;
  onResolveSeparate: (conflict: IdentityConflictItem) => Promise<void>;
}

export const IdentityResolutionTab: React.FC<IdentityResolutionTabProps> = ({
  conflicts,
  loading,
  onConfirmMerge,
  onResolveSeparate,
}) => {
  const [conflictFilter, setConflictFilter] = useState('all');
  const [selectedConflict, setSelectedConflict] = useState<IdentityConflictItem | null>(null);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [compareDrawerOpen, setCompareDrawerOpen] = useState(false);
  const [masterProfileId, setMasterProfileId] = useState<string>('');
  const [merging, setMerging] = useState(false);

  // Filter conflicts
  const filteredConflicts = conflicts.filter((c) => {
    if (conflictFilter !== 'all' && c.conflictType !== conflictFilter) return false;
    return true;
  });

  const handleOpenMerge = (conflict: IdentityConflictItem) => {
    setSelectedConflict(conflict);
    setMasterProfileId(conflict.profileA.id);
    setMergeModalOpen(true);
  };

  const handleOpenCompare = (conflict: IdentityConflictItem) => {
    setSelectedConflict(conflict);
    setCompareDrawerOpen(true);
  };

  const handleMergeSubmit = async () => {
    if (!selectedConflict) return;
    setMerging(true);
    try {
      await onConfirmMerge(selectedConflict, masterProfileId);
      setMergeModalOpen(false);
      setCompareDrawerOpen(false);
    } finally {
      setMerging(false);
    }
  };

  const handleSeparateSubmit = async (conflict: IdentityConflictItem) => {
    await onResolveSeparate(conflict);
    if (compareDrawerOpen) setCompareDrawerOpen(false);
  };

  return (
    <div style={{ padding: '24px 24px 32px' }}>
      {/* 1. Stat cards */}
      <IdentityStatsCards pendingConflictsCount={conflicts.length} />

      {/* 2. Alert Guidance */}
      <Alert
        message="Thuật toán Entity Resolution tự động"
        description="Hệ thống tự động quét và đối chiếu các Creator từ TikTok, Instagram và YouTube. Khi phát hiện chỉ số tương đồng (khớp email, nhận diện khuôn mặt, trùng handle) trên 75%, hệ thống sẽ tạm giữ để Quản lý xác nhận gộp (Merge) nhằm tránh phân mảnh dữ liệu."
        type="info"
        showIcon
        style={{ marginBottom: 16, borderRadius: 10, border: '1px solid #BFDBFE' }}
      />

      {/* 3. Filter Bar */}
      <IdentityFilterBar
        conflictFilter={conflictFilter}
        onFilterChange={setConflictFilter}
        filteredCount={filteredConflicts.length}
        totalCount={conflicts.length}
      />

      {/* 4. Table */}
      <IdentityTable
        conflicts={filteredConflicts}
        loading={loading}
        onOpenCompare={handleOpenCompare}
        onOpenMerge={handleOpenMerge}
        onResolveSeparate={handleSeparateSubmit}
      />

      {/* 5. Merge modal */}
      <MergeConflictModal
        open={mergeModalOpen}
        selectedConflict={selectedConflict}
        masterProfileId={masterProfileId}
        onMasterProfileChange={setMasterProfileId}
        merging={merging}
        onCancel={() => setMergeModalOpen(false)}
        onConfirmMerge={handleMergeSubmit}
      />

      {/* 6. Compare drawer */}
      <CompareConflictDrawer
        open={compareDrawerOpen}
        selectedConflict={selectedConflict}
        onClose={() => setCompareDrawerOpen(false)}
        onResolveSeparate={handleSeparateSubmit}
        onOpenMerge={(conflict) => {
          setCompareDrawerOpen(false);
          handleOpenMerge(conflict);
        }}
      />
    </div>
  );
};

export default IdentityResolutionTab;

