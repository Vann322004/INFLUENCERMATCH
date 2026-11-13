import { Button } from 'antd';
import { adminService } from '../../../../services/api/adminService';
import { useAsyncResource } from '../../../../hooks/useAsyncResource';
import { bytesToMB } from '../../../../services/api/systemStatusMapping';
import ResourceState from '../../dashboard/components/AdminDashboardState';

const mb = (bytes: number) => bytesToMB(bytes).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
export default function SystemMonitoringPanel({ allowed }: { allowed: boolean }) {
  const resource = useAsyncResource(adminService.getSystemStatus, allowed);
  const data = resource.data;
  return <section className="ad-panel audit-system" aria-label="Giám sát hệ thống">
    <div className="audit-section-header"><h2>Giám sát hệ thống</h2>
      {allowed && resource.status === 'success' && <Button onClick={() => void resource.reload()}>Kiểm tra lại</Button>}
    </div>
    <p className="ad-note">Kết nối API cho biết có nhận được phản hồi; sức khỏe hệ thống là kết quả kiểm tra từ Backend.</p>
    {allowed && resource.status === 'success' && data ? <>
      <div className="audit-health-grid">
        <div><h3>Kết nối API</h3><p>Đã nhận phản hồi</p><span className="ad-note">Thời điểm Backend: {data.timestamp}</span></div>
        <div><h3>Sức khỏe hệ thống</h3><p>{data.overallStatus}</p><span className="ad-note">Phạm vi kiểm tra hiện tại: kết nối Database.</span></div>
        <div><h3>Database Ping</h3><p>{data.database.status}</p>
          <span className="ad-note">{data.database.responseTimeMs < 0 ? 'Chưa đo được độ trễ' : `${data.database.responseTimeMs.toLocaleString('vi-VN')} ms`}</span>
          <div className="ad-note">{data.database.databaseProductName ?? 'Chưa có thông tin Database'}</div></div>
        <div><h3>JVM Heap</h3><p title={`${data.jvm.usedMemoryBytes} / ${data.jvm.maxMemoryBytes} bytes`}>{mb(data.jvm.usedMemoryBytes)} / {mb(data.jvm.maxMemoryBytes)} MB</p>
          <span className="ad-note">Đã dùng / tối đa. 1 MB = 1.000.000 bytes.</span></div>
        <div><h3>Hikari Pool</h3>{data.connectionPool ? <>
          <p>{data.connectionPool.activeConnections ?? '—'} / {data.connectionPool.maximumPoolSize ?? '—'}</p>
          <span className="ad-note">Kết nối đang dùng / tối đa</span>
          <dl className="ad-status-list"><div><dt>Nhàn rỗi</dt><dd>{data.connectionPool.idleConnections ?? '—'}</dd></div>
            <div><dt>Tổng kết nối</dt><dd>{data.connectionPool.totalConnections ?? '—'}</dd></div>
            <div><dt>Luồng chờ kết nối</dt><dd>{data.connectionPool.threadsAwaitingConnection ?? '—'}</dd></div></dl>
        </> : <p className="ad-state">Chưa có dữ liệu Pool</p>}</div>
      </div>
    </> : <>
      {allowed && resource.status === 'error' && <p className="ad-note">Chưa xác định sức khỏe hệ thống vì không nhận được dữ liệu hợp lệ từ API.</p>}
      <ResourceState resource={resource} allowed={allowed} />
    </>}
  </section>;
}
