import React, { useState } from 'react';
import type { IdentityConflictItem } from '../../types';
import IdentityStatsCards from './IdentityStatsCards';
import IdentityFilterBar from './IdentityFilterBar';
import IdentityTable from './IdentityTable';
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
  const [compareDrawerOpen, setCompareDrawerOpen] = useState(false);

  // Filter conflicts
  const filteredConflicts = conflicts.filter((c) => {
    if (conflictFilter !== 'all' && c.conflictType !== conflictFilter) return false;
    return true;
  });

  const handleOpenCompare = (conflict: IdentityConflictItem) => {
    setSelectedConflict(conflict);
    setCompareDrawerOpen(true);
  };

  const handleSeparateSubmit = async (conflict: IdentityConflictItem) => {
    await onResolveSeparate(conflict);
    if (compareDrawerOpen) setCompareDrawerOpen(false);
  };

  const avgMatchScore = conflicts.length > 0
    ? Math.round((conflicts.reduce((sum, c) => sum + (c.matchScore || 0), 0) / conflicts.length) * 100)
    : 0;

  return (
    <div style={{ padding: '24px 24px 32px' }}>
      {/* 1. Stat cards */}
      <IdentityStatsCards
        pendingConflictsCount={conflicts.length}
        averageMatchScore={avgMatchScore}
        mergedSuccessCount={0}
      />

      {/* 2. Filter Bar */}
      {(conflicts.length > 0 || conflictFilter !== 'all') && (
        <IdentityFilterBar
          conflictFilter={conflictFilter}
          onFilterChange={setConflictFilter}
          filteredCount={filteredConflicts.length}
          totalCount={conflicts.length}
        />
      )}

      {/* 3. Table */}
      <IdentityTable
        conflicts={filteredConflicts}
        loading={loading}
        onOpenCompare={handleOpenCompare}
        onResolveSeparate={handleSeparateSubmit}
      />

      {/* 4. Compare & Merge Drawer */}
      <CompareConflictDrawer
        open={compareDrawerOpen}
        selectedConflict={selectedConflict}
        onClose={() => setCompareDrawerOpen(false)}
        onResolveSeparate={handleSeparateSubmit}
        onConfirmMerge={onConfirmMerge}
      />
    </div>
  );
};

export default IdentityResolutionTab;
