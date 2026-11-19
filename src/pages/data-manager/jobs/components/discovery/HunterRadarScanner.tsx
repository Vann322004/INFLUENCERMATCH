import React from 'react';
import { Progress, Spin, Button } from 'antd';
import { SyncOutlined, ArrowRightOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

interface HunterRadarScannerProps {
  loading?: boolean;
  currentKeyword: string;
  progressPercent: number;
  waitSeconds?: number;
  errorMessage?: string;
  scannedCount: number;
  filteredOutCount: number;
  pendingReviewCount: number | null;
  matchedCount: number;
  logLines: string[];
  onNavigateQuality?: () => void;
}

function getStageText(progressPercent: number): string {
  if (progressPercent < 30) return 'Đang kết nối và tìm kiếm kênh phù hợp';
  if (progressPercent < 65) return 'Đang trích xuất hồ sơ và dữ liệu bài đăng';
  return 'Đang lọc điều kiện và tổng hợp danh sách';
}

function renderLogLine(line: string) {
  const match = line.match(/^(\[[^\]]+\])\s*(.*)$/);
  if (!match) return <span>{line}</span>;
  return (
    <>
      <span className="collection-log-time">{match[1]}</span>
      <span>{match[2]}</span>
    </>
  );
}

export default function HunterRadarScanner({
  loading = false,
  currentKeyword,
  progressPercent,
  waitSeconds = 0,
  errorMessage = '',
  scannedCount,
  filteredOutCount,
  pendingReviewCount,
  matchedCount,
  logLines,
  onNavigateQuality,
}: HunterRadarScannerProps) {
  const isRunning = loading;
  const isDone = !isRunning && !errorMessage && progressPercent === 100;
  const displayPercent = isRunning ? Math.max(8, progressPercent) : progressPercent;
  const formattedTime = `${Math.floor(waitSeconds / 60)}:${String(waitSeconds % 60).padStart(2, '0')}`;

  const title = isRunning
    ? 'Đang thu thập dữ liệu nhà sáng tạo…'
    : errorMessage
      ? 'Quá trình thu thập bị gián đoạn'
      : isDone
        ? 'Hoàn tất thu thập dữ liệu'
        : 'Tiến trình thu thập';

  return (
    <section className="collection-radar-card" aria-live="polite">
      <div className="collection-radar-header">
        <div className="collection-radar-title-group">
          <div className="collection-radar-title-row">
            {isRunning ? (
              <Spin indicator={<SyncOutlined spin style={{ fontSize: 15, color: '#7C3AED' }} />} />
            ) : (
              <span
                className={`collection-radar-status-dot ${
                  errorMessage ? 'is-error' : isDone ? 'is-done' : ''
                }`}
                aria-hidden="true"
              />
            )}
            <h3>{title}</h3>
          </div>
          {isRunning && (
            <div className="collection-radar-meta">
              <span>{getStageText(progressPercent)}</span>
              {currentKeyword && <span className="collection-radar-keyword">#{currentKeyword}</span>}
            </div>
          )}
        </div>

        <div className="collection-radar-right">
          {isRunning && <span className="collection-radar-timer">{formattedTime}</span>}
          <span className={`collection-radar-percent ${errorMessage ? 'is-error' : isDone ? 'is-done' : ''}`}>
            {displayPercent}%
          </span>
        </div>
      </div>

      <div className="collection-radar-progress">
        <Progress
          percent={displayPercent}
          showInfo={false}
          status={errorMessage ? 'exception' : isRunning ? 'active' : isDone ? 'success' : 'normal'}
          strokeColor={errorMessage ? '#dc2626' : isDone ? '#10b981' : '#7C3AED'}
          trailColor="#e2e8f0"
          size={['100%', 8]}
        />
      </div>

      {errorMessage && (
        <div className="collection-radar-error" role="alert">
          <ExclamationCircleOutlined className="collection-radar-error-icon" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="collection-radar-stats">
        <div className="collection-radar-stat">
          <span className="collection-radar-stat-label">Số kênh yêu cầu</span>
          <div className="collection-radar-stat-value">
            <strong>{scannedCount}</strong>
            <span>kênh</span>
          </div>
        </div>
        <div className="collection-radar-stat">
          <span className="collection-radar-stat-label">Không đạt / Lỗi thu thập</span>
          <div className="collection-radar-stat-value is-muted">
            <strong>{filteredOutCount}</strong>
            <span>kênh</span>
          </div>
        </div>
        <div className="collection-radar-stat">
          <span className="collection-radar-stat-label">Nhà sáng tạo đạt chuẩn</span>
          <div className="collection-radar-stat-value is-success">
            <strong>{matchedCount}</strong>
            <span>tài khoản</span>
          </div>
        </div>
      </div>

      {isDone && !errorMessage && filteredOutCount > 0 && (
        <div className="collection-radar-review-bar">
          <div className="collection-radar-review-copy">
            <strong>Có {filteredOutCount} kênh thu thập lỗi hoặc chưa đạt bộ lọc Tier-0</strong>
            <span>Chỉ hồ sơ đủ dữ liệu và hợp lệ mới được chuyển sang danh sách chờ kiểm định.</span>
          </div>
          {onNavigateQuality && (
            <Button type="default" icon={<ArrowRightOutlined />} onClick={onNavigateQuality}>
              {pendingReviewCount === null ? 'Kiểm định chất lượng' : `Kiểm định chất lượng (${pendingReviewCount})`}
            </Button>
          )}
        </div>
      )}

      {logLines.length > 0 && (
        <div className="collection-radar-logs">
          {logLines.map((line, i) => (
            <div key={i} className={`collection-radar-log-line ${i === 0 ? 'is-latest' : ''}`}>
              {renderLogLine(line)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
