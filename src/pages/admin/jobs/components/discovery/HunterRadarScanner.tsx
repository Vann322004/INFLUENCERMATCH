import React from 'react';
import { Card, Progress, Tag, Spin } from 'antd';
import { SyncOutlined } from '@ant-design/icons';

interface HunterRadarScannerProps {
  currentKeyword: string;
  progressPercent: number;
  scannedCount: number;
  filteredOutCount: number;
  matchedCount: number;
  logLines: string[];
}

export default function HunterRadarScanner({
  currentKeyword,
  progressPercent,
  scannedCount,
  filteredOutCount,
  matchedCount,
  logLines,
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
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: logLines.length > 0 ? 16 : 0 }}>
        <StatBadge label="Tổng số yêu cầu" value={scannedCount} unit="kênh" color="#6366F1" />
        <StatBadge label="Không lấy được" value={filteredOutCount} unit="kênh" color="#F87171" />
        <StatBadge label="Cào thành công" value={matchedCount} unit="tài khoản" color="#10B981" />
      </div>

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
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div
      style={{
        flex: '1 1 140px',
        background: '#FFFFFF',
        border: `1px solid ${color}30`,
        borderRadius: 10,
        padding: '10px 14px',
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{label} ({unit})</div>
    </div>
  );
}
