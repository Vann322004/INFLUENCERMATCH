import { Button, Progress } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { adminService } from '../../../../services/api/adminService';
import { useAsyncResource } from '../../../../hooks/useAsyncResource';
import { bytesToMB } from '../../../../services/api/systemStatusMapping';
import { auditTimestamp } from '../auditDisplay';
import ResourceState from '../../dashboard/components/AdminDashboardState';

const mb = (bytes: number) => bytesToMB(bytes).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
const ratio = (used: number, maximum: number) => Math.min(100, Math.max(0, used / maximum * 100));
function timestamp(value: string) {
  if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return auditTimestamp(value);
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) + ' (UTC+7)';
}

export default function SystemMonitoringPanel({ allowed }: { allowed: boolean }) {
  const resource = useAsyncResource(adminService.getSystemStatus, allowed);
  const data = resource.data;
  const pool = data?.connectionPool;
  return <section className="ad-panel audit-system" aria-label="Giám sát hệ thống">
    <div className="audit-section-header">
      <div><h2>Giám sát hệ thống</h2><p className="ad-note">Trạng thái kết nối và tài nguyên tại lần kiểm tra gần nhất.</p></div>
      {allowed && <Button icon={<ReloadOutlined />} loading={resource.status === 'loading'} onClick={() => void resource.reload()}>Kiểm tra lại</Button>}
    </div>
    {allowed && resource.status === 'success' && data ? <>
      <div className="audit-monitor-overview">
        <article className="audit-overview-card">
          <h3>Kết nối API</h3>
          <p className="audit-overview-value"><span className="audit-status-dot" />Đã nhận phản hồi</p>
          <p className="audit-monitor-caption">Lần kiểm tra: <time dateTime={data.timestamp} title={data.timestamp}>{timestamp(data.timestamp)}</time></p>
        </article>
        <article className="audit-overview-card audit-overview-health">
          <h3>Sức khỏe hệ thống</h3>
          <p className="audit-overview-value">{data.overallStatus}</p>
          <p className="audit-monitor-caption">Kết quả kiểm tra từ hệ thống. Phạm vi hiện tại: kết nối Database.</p>
        </article>
      </div>
      <div className="audit-health-grid">
        <article className="audit-metric-card">
          <div className="audit-metric-heading"><h3>Database Ping</h3><span className="audit-status-pill">{data.database.status}</span></div>
          <p className="audit-metric-value">{data.database.responseTimeMs < 0 ? 'Chưa đo được' : <>{data.database.responseTimeMs.toLocaleString('vi-VN')} <span>ms</span></>}</p>
          <p className="audit-monitor-caption">Độ trễ phản hồi cơ sở dữ liệu</p>
          <div className="audit-metric-footnote"><span>Thông tin Database</span><p>{data.database.databaseProductName ?? 'Chưa có dữ liệu'}</p></div>
        </article>
        <article className="audit-metric-card">
          <div className="audit-metric-heading"><h3>JVM Heap</h3><span className="audit-metric-unit">Bộ nhớ</span></div>
          <p className="audit-metric-value" title={`${data.jvm.usedMemoryBytes} bytes`}>{mb(data.jvm.usedMemoryBytes)} <span>MB</span></p>
          <p className="audit-monitor-caption">Đã sử dụng / {mb(data.jvm.maxMemoryBytes)} MB tối đa</p>
          {data.jvm.maxMemoryBytes > 0 && <Progress percent={ratio(data.jvm.usedMemoryBytes, data.jvm.maxMemoryBytes)} showInfo={false} strokeColor="#7C3AED" trailColor="#F3E8FF" size="small" />}
          <div className="audit-metric-footnote"><span>Đơn vị hiển thị</span><p>1 MB = 1.000.000 bytes</p></div>
        </article>
        <article className="audit-metric-card">
          <div className="audit-metric-heading"><h3>Hikari Pool</h3><span className="audit-metric-unit">Kết nối</span></div>
          {pool ? <>
            <p className="audit-metric-value">{pool.activeConnections ?? '—'} <span>/ {pool.maximumPoolSize ?? '—'}</span></p>
            <p className="audit-monitor-caption">Đang sử dụng / tối đa</p>
            {pool.activeConnections != null && pool.maximumPoolSize != null && pool.maximumPoolSize > 0 && <Progress percent={ratio(pool.activeConnections, pool.maximumPoolSize)} showInfo={false} strokeColor="#7C3AED" trailColor="#F3E8FF" size="small" />}
            <dl className="audit-pool-details"><div><dt>Nhàn rỗi</dt><dd>{pool.idleConnections ?? '—'}</dd></div>
              <div><dt>Tổng kết nối</dt><dd>{pool.totalConnections ?? '—'}</dd></div>
              <div><dt>Luồng đang chờ</dt><dd>{pool.threadsAwaitingConnection ?? '—'}</dd></div></dl>
          </> : <p className="ad-state">Chưa có dữ liệu Pool</p>}
        </article>
      </div>
      <p className="audit-monitor-note">Kết nối API xác nhận đã nhận phản hồi; trạng thái hệ thống phản ánh kết quả kiểm tra ở thời điểm ghi nhận.</p>
    </> : <>
      {allowed && resource.status === 'error' && <p className="ad-note">Chưa xác định sức khỏe hệ thống vì chưa nhận được dữ liệu hợp lệ.</p>}
      <ResourceState resource={resource} allowed={allowed} />
    </>}
  </section>;
}
