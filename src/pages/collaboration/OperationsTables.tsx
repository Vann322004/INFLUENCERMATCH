import { Empty, Tag } from 'antd';
import type { ReactNode } from 'react';
import type { Deliverable, ExecutionSnapshot, OutcomeRevision, PaymentStatus } from '../../types/api/collaboration.types';
import { currentPublication, formatDate, formatMoney, measurementFor, measurementMetric, metricLabels, metrics } from './ExecutionForms';

const payments: Record<PaymentStatus, string> = {
  PENDING: 'Chờ thanh toán', PARTIALLY_PAID: 'Đã thanh toán một phần',
  PAID: 'Đã thanh toán', FAILED: 'Thanh toán thất bại', REFUNDED: 'Đã hoàn tiền',
};

export function HttpsLink({ url, children }: { url: string; children: string }) {
  try {
    const target = new URL(url);
    if (target.protocol === 'https:' && !target.username && !target.password) {
      return <a href={target.href} target="_blank" rel="noopener noreferrer">{children}</a>;
    }
  } catch {
    // Historical data can contain a malformed URL.
  }
  return <span>Link không hợp lệ</span>;
}

export function OperationsTable({ label, headers, children }: {
  label: string;
  headers: string[];
  children: ReactNode;
}) {
  return <div className="collab-table-card" role="region" tabIndex={0} aria-label={label}>
    <table className="collab-table" aria-label={label}>
      <thead><tr>{headers.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>;
}

export function FeesOverview({ snapshot, latest }: {
  snapshot: ExecutionSnapshot;
  latest?: OutcomeRevision;
}) {
  const fee = formatMoney(snapshot.agreedFee, snapshot.currency);
  const cost = formatMoney(latest?.calculation.actualCost, latest?.payload.currency);
  const payment = snapshot.paymentStatus && (payments[snapshot.paymentStatus] ?? snapshot.paymentStatus);

  return <section className="collab-fees-section" aria-label="Thù lao và đối soát">
    <OperationsTable label="Bảng thù lao và đối soát" headers={['Phí đã chốt', 'Chi phí thực tế', 'Nguồn chi phí', 'Trạng thái thanh toán']}>
      <tr>
        <td>{fee}</td>
        <td>{cost}</td>
        <td>{latest?.calculation.actualCost != null
          ? `Kết quả v${latest.revision} · Brand khai báo${latest.payload.financialConfirmed ? ' và xác nhận' : ''}` : '—'}</td>
        <td>{payment ? <Tag color={snapshot.paymentStatus === 'PAID' ? 'success' : 'default'}>{payment}</Tag> : '—'}</td>
      </tr>
    </OperationsTable>
    <p className="collab-muted collab-missing-note">— Chưa có dữ liệu.</p>
  </section>;
}

export function OutcomeTable({ snapshot, latest, label }: {
  snapshot: ExecutionSnapshot;
  latest?: OutcomeRevision;
  label: (unit: Deliverable) => string;
}) {
  const posts = snapshot.deliverables.flatMap(unit => {
    const publication = currentPublication(unit);
    if (!publication) return [];
    const measurement = measurementFor(latest?.payload, unit);
    return [{ unit, publication, measurement }];
  });
  return <section className="collab-kpi-section" aria-label="KPI bài đăng">
    <div className="kpi-controls-bar">
      <div>
        <h2>Kết quả bài đăng</h2>
        {latest && <span>Phiên bản {latest.revision} · {latest.source || latest.calculation.metricSource}</span>}
      </div>
    </div>
    {posts.length ? <OperationsTable label="Bảng KPI bài đăng" headers={['Ấn phẩm và link bài đăng', 'Kỳ đo', ...metrics.map(metric => metricLabels[metric])]}>
      {posts.map(({ unit, publication, measurement }) => <tr key={unit.id}>
        <td><strong>{label(unit)}</strong><div><HttpsLink url={publication.url}>Mở bài đăng</HttpsLink></div>
          {measurement?.evidenceUrl && <div><HttpsLink url={measurement.evidenceUrl}>Bằng chứng</HttpsLink></div>}</td>
        <td>{measurement ? `${formatDate(measurement.periodStart)} – ${formatDate(measurement.periodEnd)}` : '—'}</td>
        {metrics.map(metric => <td key={metric}>{measurementMetric(measurement, metric)}</td>)}
      </tr>)}
    </OperationsTable> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có bài đăng hiện hành" />}
    {(posts.length > 0 || latest) && <p className="collab-muted collab-missing-note">— Chưa có dữ liệu.</p>}
  </section>;
}
