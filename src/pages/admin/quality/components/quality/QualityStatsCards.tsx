import React from 'react';
import type { QualityOverview } from '../../types';

interface QualityStatsCardsProps {
  overview: QualityOverview;
  fallbackPendingCount: number;
  highConfidenceCount?: number;
}

export const QualityStatsCards: React.FC<QualityStatsCardsProps> = ({
  overview,
  fallbackPendingCount,
}) => {
  const pendingCount = overview.pendingCount || fallbackPendingCount;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '16px 24px',
        marginBottom: 20,
        gap: 36,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Chờ kiểm duyệt
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: pendingCount > 0 ? '#D97706' : '#0F172A', marginTop: 2 }}>
          {pendingCount} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>hồ sơ</span>
        </div>
      </div>

      <div style={{ width: 1, height: 34, background: '#E2E8F0' }} />

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Đã duyệt hôm nay
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981', marginTop: 2 }}>
          {overview.standardizedTodayCount}{' '}
          <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>hồ sơ</span>
        </div>
      </div>

      <div style={{ width: 1, height: 34, background: '#E2E8F0' }} />

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Độ tin cậy phân loại
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#4F46E5', marginTop: 2 }}>
          {overview.accuracyRate ? `${overview.accuracyRate}%` : '—'}
        </div>
      </div>
    </div>
  );
};

export default QualityStatsCards;
