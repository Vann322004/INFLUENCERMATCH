import React from 'react';
import { Card, Progress, Tag, Spin, Alert, Button } from 'antd';
import { SyncOutlined, ArrowRightOutlined, AuditOutlined } from '@ant-design/icons';

interface HunterRadarScannerProps {
  currentKeyword: string;
  progressPercent: number;
  scannedCount: number;
  filteredOutCount: number;
  pendingReviewCount: number | null;
  matchedCount: number;
  logLines: string[];
  onNavigateQuality?: () => void;
}

export default function HunterRadarScanner({
  currentKeyword,
  progressPercent,
  scannedCount,
  filteredOutCount,
  pendingReviewCount,
  matchedCount,
  logLines,
  onNavigateQuality,
}: HunterRadarScannerProps) {
  const isRunning = progressPercent > 0 && progressPercent < 100;
  const isDone = progressPercent === 100;

  return (
    <Card
      style={{
        borderRadius: 12,
        border: '1px solid #E0E7FF',
        background: '#FAFAFE',
        marginBottom: 20,
      }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isRunning && (
            <Spin indicator={<SyncOutlined spin style={{ fontSize: 16, color: '#6366F1' }} />} />
          )}
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1E293B' }}>
            {isRunning ? 'Đang cào dữ liệu từ các kênh...' : isDone ? 'Hoàn tất quét dữ liệu' : 'Tiến trình quét'}
          </span>
          {isRunning && currentKeyword && (
            <Tag color="geekblue" style={{ borderRadius: 20, fontWeight: 600, fontSize: 11.5 }}>
              #{currentKeyword}
            </Tag>
          )}
        </div>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>{progressPercent}%</span>
      </div>

      <Progress
        percent={progressPercent}
        status={isRunning ? 'active' : isDone && matchedCount > 0 ? 'success' : 'normal'}
        strokeColor={{ '0%': '#6366F1', '100%': '#10B981' }}
        style={{ marginBottom: 16 }}
      />

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatBadge label="Tổng số yêu cầu" value={scannedCount} unit="kênh" color="#6366F1" />
        <StatBadge
          label="Cào lỗi / Bị lọc Tier-0"
          value={filteredOutCount}
          unit="kênh"
          color="#F59E0B"
        />
        <StatBadge label="Cào thành công" value={matchedCount} unit="tài khoản" color="#10B981" />
      </div>

      {/* Alert banner to navigate to Data Quality if there are accounts needing review */}
      {isDone && filteredOutCount > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<AuditOutlined style={{ color: '#D97706', fontSize: 18 }} />}
          style={{
            marginBottom: 16,
            borderRadius: 10,
            border: '1px solid #FDE68A',
            background: '#FFFBEB',
            padding: '12px 16px',
          }}
          message={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#92400E' }}>
                  Có {filteredOutCount} kênh cào lỗi hoặc chưa đạt bộ lọc Tier-0
                </div>
                <div style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>
                  Số kênh bị lọc không phải số hồ sơ chờ kiểm định. Chỉ hồ sơ đã có dữ liệu trên hệ thống và đủ điều kiện mới xuất hiện ở trang kiểm định.
                </div>
              </div>
              {onNavigateQuality && (
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={onNavigateQuality}
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    border: 'none',
                    fontWeight: 700,
                    borderRadius: 8,
                    height: 36,
                    padding: '0 16px',
                    boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
                  }}
                >
                  {pendingReviewCount === null ? 'Mở danh sách kiểm định' : `Kiểm định chất lượng (${pendingReviewCount})`}
                </Button>
              )}
            </div>
          }
        />
      )}

      {/* Log stream */}
      {logLines.length > 0 && (
        <div
          style={{
            background: '#F1F5F9',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            padding: '10px 14px',
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: 11.5,
            color: '#475569',
            lineHeight: 1.7,
            maxHeight: 110,
            overflowY: 'auto',
          }}
        >
          {logLines.map((line, i) => (
            <div key={i} style={{ color: i === 0 ? '#1E293B' : '#94A3B8' }}>{line}</div>
          ))}
        </div>
      )}
    </Card>
  );
}

function StatBadge({
  label,
  value,
  unit,
  color,
  clickable,
  onClick,
  actionHint,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  clickable?: boolean;
  onClick?: () => void;
  actionHint?: string;
}) {
  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        flex: '1 1 140px',
        background: '#FFFFFF',
        border: `1px solid ${color}40`,
        borderRadius: 10,
        padding: '10px 14px',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: clickable ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (clickable) {
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (clickable) {
          e.currentTarget.style.borderColor = `${color}40`;
          e.currentTarget.style.transform = 'none';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        {actionHint && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#4F46E5' }}>{actionHint}</span>
        )}
      </div>
      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{label} ({unit})</div>
    </div>
  );
}
