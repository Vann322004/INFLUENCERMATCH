import { useCallback, useState } from 'react';
import { Button, Empty, Form, Input, Table, Tag, Tooltip } from 'antd';
import type { TableColumnsType } from 'antd';
import { adminService } from '../../../services/api/adminService';
import { authService } from '../../../services/api/authService';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import type { AuditLogItem, AuditLogsParams } from '../../../types/api/admin.types';
import ResourceState from '../dashboard/components/AdminDashboardState';
import AuditDetailDrawer from './components/AuditDetailDrawer';
import SystemMonitoringPanel from './components/SystemMonitoringPanel';
import { auditTimestamp } from './auditDisplay';
import '../dashboard/AdminDashboard.css';
import './AuditLogPage.css';

const uuidRule = { validator: (_: unknown, value: string) => !value?.trim() || /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value.trim())
  ? Promise.resolve() : Promise.reject(new Error('Nhập UUID hợp lệ.')) };

export default function AuditLogPage() {
  const [form] = Form.useForm();
  const [params, setParams] = useState<AuditLogsParams>({ page: 0, size: 10 });
  const [selected, setSelected] = useState<AuditLogItem | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const user = authService.getCurrentUser();
  const canAudit = authService.isAdmin() && !!user?.permissions?.includes('VIEW_AUDIT_LOG');
  const canMonitor = authService.isAdmin() && !!user?.permissions?.includes('VIEW_SYSTEM_STATUS');
  const fetchLogs = useCallback(() => adminService.getAuditLogs(params), [params]);
  const resource = useAsyncResource(fetchLogs, canAudit);

  const applyFilters = (values: Record<string, string>) => {
    const cleaned = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value?.trim() || undefined]));
    if (cleaned.from && cleaned.to && cleaned.from > cleaned.to) {
      form.setFields([{ name: 'to', errors: ['Thời gian kết thúc phải sau hoặc bằng thời gian bắt đầu.'] }]); return;
    }
    setSelected(null);
    setExportError(null);
    setParams(previous => ({ ...cleaned, page: 0, size: previous.size }));
  };

  const downloadCsv = async () => {
    setExporting(true); setExportError(null);
    try {
      const blob = await adminService.exportAuditLogs(params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'audit-logs.csv'; document.body.append(link);
      try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    } catch {
      setExportError('Không thể xuất CSV. Vui lòng thử lại.');
    } finally { setExporting(false); }
  };

  const columns: TableColumnsType<AuditLogItem> = [
    { title: 'Thời gian', dataIndex: 'createdAt', render: value => <><span className="audit-cell-label" aria-hidden="true">Thời gian Backend</span><time>{auditTimestamp(value)}</time></> },
    { title: 'Người thực hiện', dataIndex: 'actorId', render: (value, log) => <>
      <span className="audit-cell-label" aria-hidden="true">Actor UUID</span><code>{value ?? '—'}</code>
      <span className="audit-cell-secondary">IP: {log.ip || '—'}</span>
    </> },
    { title: 'Hành động', dataIndex: 'action', render: value => <>
      <span className="audit-cell-label" aria-hidden="true">Action</span>{value ? <Tag>{value}</Tag> : '—'}
    </> },
    { title: 'Đối tượng', dataIndex: 'entityType', render: (value, log) => <>
      <span className="audit-cell-label" aria-hidden="true">Entity type / UUID</span><span className="audit-entity-type">{value || '—'}</span>
      <code className="audit-cell-secondary">{log.entityId ?? '—'}</code>
    </> },
    { title: '', width: 96, className: 'audit-record-action', render: (_, log) => <Button onClick={() => setSelected(log)}>Chi tiết</Button> },
  ];

  return <div className="ad-dashboard audit-page">
    <header className="ad-header"><h1>Nhật ký & giám sát hệ thống</h1>
      <p>Tra cứu sự kiện được Backend ghi nhận và các chỉ số vận hành hiện có.</p></header>
    <SystemMonitoringPanel allowed={canMonitor} />
    <section className="ad-panel audit-logs" aria-label="Nhật ký kiểm toán">
      <div className="audit-section-header audit-logs-header">
        <div><h2>Nhật ký kiểm toán</h2><p className="ad-note">Tra cứu sự kiện và xem metadata được ghi nhận.</p></div>
        {canAudit && <Tooltip title="Tải tối đa 10.000 bản ghi theo bộ lọc đã áp dụng. CSV chỉ chứa mã sự kiện, actor UUID, action, entity và thời gian.">
          <Button loading={exporting} disabled={resource.status !== 'success'} onClick={() => void downloadCsv()}>Xuất CSV</Button>
        </Tooltip>}
      </div>
      {canAudit && <Form form={form} layout="vertical" onFinish={applyFilters} className="audit-filter-form">
        <div className="audit-filter-primary">
          <Form.Item name="keyword" label="Từ khóa" rules={[{ max: 200, message: 'Từ khóa tối đa 200 ký tự.' }]}><Input maxLength={200} placeholder="Action, entity type, mô tả, IP hoặc UUID" /></Form.Item>
          <Form.Item name="from" label="Từ thời gian"><Input type="datetime-local" step={1} /></Form.Item>
          <Form.Item name="to" label="Đến thời gian"><Input type="datetime-local" step={1} /></Form.Item>
        </div>
        <details className="audit-advanced-filters"><summary>Bộ lọc chi tiết</summary>
        <div className="audit-filters">
          <Form.Item name="actorId" label="Actor UUID" rules={[uuidRule]}><Input placeholder="UUID người thực hiện" /></Form.Item>
          <Form.Item name="entityId" label="Entity UUID" rules={[uuidRule]}><Input placeholder="UUID đối tượng" /></Form.Item>
          <Form.Item name="action" label="Action"><Input maxLength={100} placeholder="Ví dụ: ASSIGN_USER_ROLE" /></Form.Item>
          <Form.Item name="entityType" label="Entity type"><Input maxLength={100} placeholder="Ví dụ: User, Plan, Payment" /></Form.Item>
        </div>
        <p className="ad-note">UUID, action và entity type khớp chính xác. Thời gian theo Backend, chưa kèm múi giờ.</p>
        </details>
        <div className="audit-filter-actions"><Button type="primary" htmlType="submit">Áp dụng bộ lọc</Button>
          <Button onClick={() => { form.resetFields(); setSelected(null); setExportError(null); setParams(previous => ({ page: 0, size: previous.size })); }}>Xóa bộ lọc</Button>
        </div>
      </Form>}
      {exportError && <p className="ad-state" role="alert">{exportError}</p>}
      {canAudit && resource.status === 'success' && resource.data
        ? <Table<AuditLogItem> rowKey="id" columns={columns} dataSource={resource.data.items ?? []} tableLayout="fixed" size="middle"
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" /> }}
            pagination={{ current: (resource.data.page ?? 0) + 1, pageSize: resource.data.size, total: resource.data.totalElements,
              showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100],
              showTotal: total => `Tổng ${total.toLocaleString('vi-VN')} bản ghi`,
              onChange: (page, size) => { setSelected(null); setParams(previous => ({ ...previous, page: size !== previous.size ? 0 : page - 1, size })); } }} />
        : <ResourceState resource={resource} allowed={canAudit} />}
    </section>
    <AuditDetailDrawer log={selected} open={selected !== null} onClose={() => setSelected(null)} />
  </div>;
}
