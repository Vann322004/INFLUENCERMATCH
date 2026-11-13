import { Drawer } from 'antd';
import type { AuditLogItem } from '../../../../types/api/admin.types';
import { auditTimestamp, safeAuditValue } from '../auditDisplay';

export default function AuditDetailDrawer({ log, open, onClose }: { log: AuditLogItem | null; open: boolean; onClose: () => void }) {
  return <Drawer title="Chi tiết nhật ký kiểm toán" open={open} onClose={onClose} width="min(760px, 100vw)" className="audit-detail-drawer" destroyOnHidden>
    {log && <>
      <dl className="audit-detail-meta">
        {[
          ['Mã bản ghi', log.id], ['Actor UUID', log.actorId], ['Action', log.action],
          ['Entity type', log.entityType], ['Entity UUID', log.entityId], ['IP', log.ip],
          ['Thời gian Backend', auditTimestamp(log.createdAt)],
        ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}
      </dl>
      <p className="ad-note">Chỉ hiển thị metadata an toàn do Backend cung cấp. Giá trị trống không cho biết giao dịch thành công, thất bại hay bản ghi đã bị xóa.</p>
      <div className="audit-diff-grid">
        {([['Giá trị trước', log.oldValue], ['Giá trị sau', log.newValue]] as const).map(([label, value]) => <section key={label}>
          <h3>{label}</h3><pre>{value == null ? 'Chưa có dữ liệu' : JSON.stringify(safeAuditValue(value), null, 2)}</pre>
        </section>)}
      </div>
    </>}
  </Drawer>;
}
