import { Alert, Card, Table } from 'antd';
import { Link } from 'react-router-dom';
import type { HistoryDetail, HistoryMetric } from '../../types/api/campaignHistory.types';
import { historyDate, historyMoney, historyNumber, provenanceLabel } from './historyView';
import './CampaignHistoryPage.css';

const metrics: Record<string, string> = {
  committedFee: 'Phí cam kết', actualCost: 'Chi phí thực tế', gmv: 'Tổng giá trị đơn hàng (GMV)',
  revenue: 'Doanh thu', views: 'Lượt xem', clicks: 'Lượt nhấp', likes: 'Lượt thích', comments: 'Bình luận',
  shares: 'Lượt chia sẻ', engagements: 'Lượt tương tác', roas: 'ROAS', roi: 'ROI', cpm: 'CPM', cpe: 'CPE',
};

const metricReasons: Record<string, string> = {
  NO_COMPLETED_COLLABORATIONS: 'Chưa có hợp tác hoàn tất.',
  MISSING_ACCEPTED_REVIEWED_SOURCE: 'Có hợp tác thiếu Outcome được nghiệm thu và đánh giá cuối tham chiếu.',
  UNSUPPORTED_CURRENCY: 'Dữ liệu tiền tệ chưa thể đối chiếu bằng VND.',
  MISSING_COMMITMENT: 'Thiếu phí cam kết.',
  INVALID_OR_MISSING_ACTUAL_COST: 'Chi phí thực tế thiếu hoặc chưa hợp lệ.',
  UNSUPPORTED_FINANCIAL_POLICY: 'Phiên bản tính tài chính chưa tương thích.',
  MISSING_POSTS: 'Chưa có dữ liệu bài đăng.',
  MISSING_PUBLICATION_REFERENCE: 'Thiếu tham chiếu bài đăng.',
  MISSING_MEASUREMENT_PERIOD: 'Thiếu kỳ đo.',
  INCONSISTENT_FINANCIAL_PERIOD: 'Kỳ tài chính và kỳ đo chưa nhất quán.',
  MISSING_METRIC_INPUT: 'Thiếu đầu vào của chỉ số.',
  DUPLICATE_POST_CONFLICT: 'Số liệu của cùng một bài đăng mâu thuẫn.',
  INVALID_METRIC_INPUT: 'Đầu vào của chỉ số chưa hợp lệ.',
  INCONSISTENT_MEASUREMENT_PERIOD: 'Kỳ đo giữa các bài chưa nhất quán.',
  ATTRIBUTION_NOT_ESTABLISHED: 'Chưa xác định được phạm vi ghi nhận doanh thu giữa các hợp tác.',
  INVALID_FINANCIAL_INPUT: 'Dữ liệu tài chính chưa hợp lệ.',
  MISSING_FINANCIAL_INPUT: 'Thiếu dữ liệu tài chính.',
  INVALID_DENOMINATOR: 'Mẫu số bằng 0 hoặc chưa hợp lệ.',
};

function metricValue(key: string, metric: HistoryMetric) {
  const { value, unit, availability } = metric;
  if (availability !== 'AVAILABLE' || value == null) return '—';
  if (key === 'roi') return new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 2 }).format(value);
  if (unit === 'RATIO') return `${historyNumber(value)}×`;
  if (unit === 'VND_PER_1000_VIEWS') return `${historyMoney(value, 'VND')} / 1.000 lượt xem`;
  if (unit === 'VND_PER_ENGAGEMENT') return `${historyMoney(value, 'VND')} / lượt tương tác`;
  return unit === 'VND' ? historyMoney(value, 'VND') : historyNumber(value);
}

export default function CampaignOutcomeReport({ detail }: { detail: HistoryDetail }) {
  const { report, copyOrigin, latestContext, snapshotAvailability } = detail;
  return <div className="history-stack">
    <div className="history-grid">{[
      ['Đã hoàn tất', report.completedCount], ['Chưa hoàn tất', report.unfinishedCount],
      ['Đã hủy', report.cancelledCount], ['Có nguồn đủ điều kiện báo cáo', report.eligibleCount],
    ].map(([label, value]) => <Card key={label}><div className="history-summary"><span>{label}</span><strong>{value}</strong></div></Card>)}</div>
    {snapshotAvailability === 'MISSING' && <Alert showIcon type="info" title="Chưa có bản lưu lịch sử của brief." />}
    {latestContext && <p className="history-muted">Bản lưu brief mới nhất · Phiên bản {latestContext.version ?? '—'} · {historyDate(latestContext.createdAt, true)}</p>}
    {copyOrigin && <p className="history-muted">Chiến dịch được tạo bằng cách dùng lại brief từ <Link
      to={`/campaign-history/${copyOrigin.sourceCampaignId}`}>chiến dịch nguồn</Link>.</p>}
    <Card title="Báo cáo kết quả">
      <p className="history-muted">Kết quả lấy từ hợp tác đã hoàn tất có Outcome được nghiệm thu và đánh giá cuối tham chiếu.
        Phí cam kết gồm các hợp tác chưa hủy. Nguồn số liệu: {provenanceLabel(report.metricSource)}.</p>
      <Table rowKey="key" size="middle" scroll={{ x: 'max-content' }} pagination={false}
        dataSource={Object.entries(report.metrics).map(([key, metric]) => ({ key, metric }))}
        columns={[
          { title: 'Chỉ số', render: (_, row) => metrics[row.key] ?? row.key },
          { title: 'Giá trị', render: (_, row) => <strong>{metricValue(row.key, row.metric)}</strong> },
          { title: 'Độ phủ', render: (_, { metric: { coverage } }) => <span>
            {coverage.includedCollaborationCount}/{coverage.requiredCollaborationCount} hợp tác
            {coverage.distinctPostCount > 0 && ` · ${coverage.distinctPostCount} bài đăng`}
          </span> },
          { title: 'Dữ liệu còn thiếu', width: 320, render: (_, { metric }) => metric.unavailableReasons.length
            ? <ul className="history-reasons">{metric.unavailableReasons.map(reason =>
              <li key={reason}>{metricReasons[reason] ?? reason}</li>)}</ul> : '—' },
        ]} />
    </Card>
  </div>;
}
