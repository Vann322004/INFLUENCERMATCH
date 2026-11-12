import React from 'react';

interface IdentityStatsCardsProps {
  pendingConflictsCount: number;
  averageMatchScore?: number;
  mergedSuccessCount?: number;
}

export const IdentityStatsCards: React.FC<IdentityStatsCardsProps> = ({
  pendingConflictsCount,
  averageMatchScore = 0,
  mergedSuccessCount = 0,
}) => {
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
          Hồ sơ nghi vấn trùng lặp
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: pendingConflictsCount > 0 ? '#2563EB' : '#0F172A',
            marginTop: 2,
          }}
        >
          {pendingConflictsCount} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>cặp</span>
        </div>
      </div>

      <div style={{ width: 1, height: 34, background: '#E2E8F0' }} />

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Độ tương đồng trung bình
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
          {averageMatchScore > 0 ? `${averageMatchScore}%` : '—'}
        </div>
      </div>

      <div style={{ width: 1, height: 34, background: '#E2E8F0' }} />

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Đã hợp nhất thành công
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981', marginTop: 2 }}>
          {mergedSuccessCount} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>Creator</span>
        </div>
      </div>
    </div>
  );
};

export default IdentityStatsCards;
