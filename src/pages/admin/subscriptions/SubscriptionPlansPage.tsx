import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Tag, Typography, Spin, message, Empty, Alert, Pagination, Table } from 'antd';
import { subscriptionService } from '../../../services/api/subscriptionService';
import { adminService } from '../../../services/api/adminService';
import { authService } from '../../../services/api/authService';
import { createAdminQuery } from '../../../services/adminCache';
import type { PageResponse } from '../../../types/api/common.types';
import type { PlanResponse, PlanCreateRequest, PlanUpdateRequest } from '../../../types/api/subscription.types';
import CreateEditPlanForm from './components/CreateEditPlanForm';
import ActivateStopToggle from './components/ActivateStopToggle';
import './SubscriptionPlansPage.css';

const statsQuery = createAdminQuery('plans:payment-stats', () => adminService.getTransactionStats(), { ttl: 30_000, tags: ['admin-billing'] });
type PaymentStats = Awaited<ReturnType<typeof adminService.getTransactionStats>>;
function explain(error: unknown, fallback: string) {
  const err = error as { response?: { status?: number; data?: { detail?: string; message?: string } }; message?: string };
  if (err.response?.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (err.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  return err.response?.data?.detail || err.response?.data?.message || err.message || fallback;
}

export default function SubscriptionPlansPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(8);
  const [catalog, setCatalog] = useState<PageResponse<PlanResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanResponse | null>(null);
  const lock = useRef(false);
  const canManage = authService.getCurrentUser()?.permissions?.includes('MANAGE_PLAN') ?? false;
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    subscriptionService.getPlansPage(page, size).then(result => {
      if (!active) return;
      if (result.totalPages > 0 && page >= result.totalPages) { setPage(result.totalPages - 1); return; }
      setCatalog(result);
    }).catch(err => { if (active) setError(explain(err, 'Không tải được danh mục gói dịch vụ.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, size, revision]);

  const statsRequest = useRef(0);
  const fetchStats = useCallback(async (force = false) => {
    const request = ++statsRequest.current;
    setStatsLoading(true); setStatsError('');
    if (force) statsQuery.invalidate();
    try { const data = await statsQuery(); if (request === statsRequest.current) setStats(data); }
    catch (err) { if (request === statsRequest.current) { setStats(null); setStatsError(explain(err, 'Không tải được thống kê.')); } }
    finally { if (request === statsRequest.current) setStatsLoading(false); }
  }, []);
  useEffect(() => { fetchStats(); return () => { ++statsRequest.current; }; }, [fetchStats]);
  const refresh = () => { subscriptionService.clearPlansCache(); setRevision(value => value + 1); };
  const changeStatus = async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
    if (lock.current || !canManage) return;
    lock.current = true; setBusyId(id);
    try {
      if (status === 'INACTIVE') await subscriptionService.deletePlan(id);
      else await subscriptionService.updatePlan(id, { status });
      message.success(status === 'ACTIVE' ? 'Đã mở bán gói dịch vụ.' : 'Đã ngừng bán gói dịch vụ.');
      refresh();
    } catch (err) { message.error(explain(err, 'Không cập nhật được trạng thái gói.')); throw err; }
    finally { lock.current = false; setBusyId(null); }
  };
  const savePlan = async (payload: PlanCreateRequest | PlanUpdateRequest, id?: string) => {
    if (lock.current || !canManage) throw new Error('Không thể lưu gói lúc này.');
    lock.current = true; setSaving(true);
    try {
      if (id) await subscriptionService.updatePlan(id, payload as PlanUpdateRequest);
      else await subscriptionService.createPlan(payload as PlanCreateRequest);
      message.success(id ? 'Đã cập nhật gói dịch vụ.' : 'Đã tạo gói dịch vụ.');
      setFormOpen(false); refresh();
    } catch (err) { message.error(explain(err, 'Không lưu được gói dịch vụ.')); throw err; }
    finally { lock.current = false; setSaving(false); }
  };
  const plans = catalog?.items ?? [];
  const activeCount = plans.filter(plan => plan.status === 'ACTIVE').length;
  const inactiveCount = plans.filter(plan => plan.status === 'INACTIVE').length;
  const otherCount = plans.length - activeCount - inactiveCount;
  const ready = !loading && !error && catalog !== null;
  const money = (value: number, currency = 'VND') => new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(value);
  return <div className="admin-plans-page">
    <header className="admin-plans-header">
      <div><Typography.Title level={4}>Quản lý gói dịch vụ</Typography.Title><p>Quản lý giá, thời hạn, hạn mức sử dụng và trạng thái mở bán.</p></div>
      <div className="admin-plans-header-actions">
        <Button loading={loading} onClick={() => { refresh(); fetchStats(true); }}>Làm mới</Button>
        {canManage && <Button type="primary" disabled={saving || busyId !== null} onClick={() => { setEditingPlan(null); setFormOpen(true); }}>Tạo gói mới</Button>}
      </div>
    </header>
    <div className="admin-plans-stats">
      <section><span>Tổng số gói trong danh mục</span><strong>{ready ? catalog.totalElements.toLocaleString('vi-VN') : '—'}</strong>
        <small>{ready ? `Trang này: ${activeCount} đang mở bán · ${inactiveCount} ngừng bán${otherCount ? ` · ${otherCount} trạng thái khác` : ''}` : 'Đang chờ dữ liệu danh mục'}</small></section>
      <section><span>Tổng doanh thu thanh toán</span><strong>{!statsLoading && stats ? money(stats.totalRevenue) : '—'}</strong><small>Toàn hệ thống · Theo thống kê thanh toán</small></section>
      <section><span>Giao dịch thành công</span><strong>{!statsLoading && stats ? stats.paidCount.toLocaleString('vi-VN') : '—'}</strong><small>{stats ? `Toàn hệ thống · Trên ${stats.totalCount.toLocaleString('vi-VN')} giao dịch` : 'Theo thống kê thanh toán'}</small></section>
    </div>
    {statsError && <Alert type="warning" title="Chưa tải được thống kê thanh toán" description={statsError} action={<Button onClick={() => fetchStats(true)} loading={statsLoading}>Thử lại thống kê</Button>} />}
    <p className="admin-plans-impact">Thay đổi gói chỉ áp dụng cho lượt đăng ký mới. Thuê bao đang hoạt động giữ nguyên giá, thời hạn và hạn mức đã đăng ký.</p>
    {loading ? <div className="admin-plans-loading" role="status"><Spin /><span>Đang tải danh sách gói dịch vụ…</span></div>
      : error ? <Alert type="error" title="Không tải được danh sách gói" description={error} action={<Button onClick={refresh}>Thử lại</Button>} />
      : !plans.length ? <Empty description="Chưa có gói dịch vụ trong danh mục." />
      : <div className="admin-plans-table"><Table<PlanResponse>
        rowKey="id" dataSource={plans} pagination={false} scroll={{ x: 1150 }}
        columns={[
          { title: 'Gói dịch vụ', key: 'name', width: 260, render: (_, plan) => <div className="admin-plan-table-name"><strong>{plan.planName}</strong><p title={plan.description}>{plan.description || 'Chưa có mô tả'}</p></div> },
          { title: 'Giá / chu kỳ', key: 'price', width: 170, render: (_, plan) => <div className="admin-plan-table-price"><strong>{plan.price === 0 ? 'Miễn phí' : money(plan.price, plan.currency || 'VND')}</strong><span>{plan.durationDays} ngày</span></div> },
          { title: 'Chiến dịch', dataIndex: 'campaignQuota', align: 'right', width: 100, render: (value: number) => value.toLocaleString('vi-VN') },
          { title: 'Lượt gợi ý', dataIndex: 'recommendationQuota', align: 'right', width: 100, render: (value: number) => value.toLocaleString('vi-VN') },
          { title: 'Lượt làm mới', dataIndex: 'refreshQuota', align: 'right', width: 110, render: (value: number) => value.toLocaleString('vi-VN') },
          { title: 'Thuê bao hoạt động', dataIndex: 'activeSubscriptionCount', align: 'right', width: 140, render: (value?: number) => value == null ? '—' : value.toLocaleString('vi-VN') },
          { title: 'Mở bán', key: 'status', width: 170, render: (_, plan) => canManage && ['ACTIVE', 'INACTIVE'].includes(plan.status)
            ? <ActivateStopToggle plan={plan} onStatusChange={changeStatus} loading={busyId === plan.id} disabled={saving || busyId !== null || loading} />
            : <Tag color={plan.status === 'ACTIVE' ? 'success' : 'default'}>{plan.status === 'ACTIVE' ? 'Đang mở bán' : plan.status === 'INACTIVE' ? 'Ngừng bán' : plan.status}</Tag> },
          { title: '', key: 'actions', width: 110, render: (_, plan) => canManage ? <Button disabled={saving || busyId !== null || loading} onClick={() => { setEditingPlan(plan); setFormOpen(true); }}>Chỉnh sửa</Button> : null },
        ]}
      /></div>}
    {ready && catalog.totalElements > 0 && <Pagination className="admin-plans-pagination" current={page + 1} pageSize={size} total={catalog.totalElements} showSizeChanger pageSizeOptions={[8, 16, 24]} disabled={busyId !== null || saving}
      locale={{ items_per_page: '/ trang', jump_to: 'Đến trang', page: '', prev_page: 'Trang trước', next_page: 'Trang sau', prev_5: 'Lùi 5 trang', next_5: 'Tiến 5 trang' }}
      showTotal={(total, range) => `${range[0]}–${range[1]} / ${total} gói`}
      onChange={(next, nextSize) => { setPage(nextSize === size ? next - 1 : 0); setSize(nextSize); }} />}
    <CreateEditPlanForm open={formOpen} onClose={() => { if (!saving) setFormOpen(false); }} plan={editingPlan} onSave={savePlan} saving={saving} />
  </div>;
}
