import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Table, Tag, Input, Select, Button, Row, Col, Space, Tooltip, message, Alert, DatePicker } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
  EyeOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { Transaction, TxnStatus } from '../../../types/api/admin.types';
import { adminService, type PaymentStats } from '../../../services/api/adminService';
import TransactionDetailModal from './components/TransactionDetailModal';
import RefundModal from './components/RefundModal';
import RevenueReportCard from './components/RevenueReportCard';
import dayjs, { type Dayjs } from 'dayjs';
import type { RevenueReport } from '../../../services/api/adminService';

const STATUS_CFG: Record<TxnStatus, { label: string; color: string; icon: React.ReactNode }> = {
  paid:     { label: 'Thành công',   color: 'success',    icon: <CheckCircleOutlined /> },
  pending:  { label: 'Đang xử lý',   color: 'processing', icon: <ClockCircleOutlined /> },
  refunded: { label: 'Đã hoàn tiền', color: 'default',    icon: <RollbackOutlined /> },
  failed:   { label: 'Thất bại',     color: 'error',      icon: <CloseCircleOutlined /> },
};

export default function PaymentsPage() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(29, 'day'), dayjs()]);
  const from = dateRange[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS');
  const to = `${dateRange[1].format('YYYY-MM-DD')}T23:59:59.999999`;
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day');
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportVersion, setReportVersion] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    totalRefunded: 0,
    totalPending: 0,
    paidCount: 0,
    pendingCount: 0,
    refundedCount: 0,
    failedCount: 0,
    totalCount: 0,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const tableRequest = useRef(0);

  // Fetch transactions independently from reports.
  const fetchData = useCallback(async () => {
    const request = ++tableRequest.current;
    setLoading(true);
    setAuthError(null);
    try {
      const txnRes = await adminService.getTransactions({
          search,
          status: statusFilter,
          gateway: gatewayFilter,
          page,
          size: pageSize,
          from, to,
        });

      if (request !== tableRequest.current) return;
      setTransactions(txnRes.items || []);
      setTotalElements(txnRes.totalElements || 0);

    } catch (err: any) {
      if (request !== tableRequest.current) return;
      console.error('[PaymentsPage] Error fetching data:', err);
      if (err?.response?.status === 401) {
        setAuthError('Yêu cầu xác thực (401 Unauthorized): Cần có token Admin hợp lệ để xem và đối soát dữ liệu giao dịch. Vui lòng đăng nhập lại tài khoản Admin.');
        message.error('Lỗi 401: Phiên đăng nhập chưa được xác thực hoặc token đã hết hạn!');
      } else {
        message.error(err?.response?.data?.message || err?.message || 'Không thể tải danh sách giao dịch từ máy chủ.');
      }
      setTransactions([]);
      setTotalElements(0);
    } finally {
      if (request === tableRequest.current) setLoading(false);
    }
  }, [search, statusFilter, gatewayFilter, page, pageSize, from, to]);

  useEffect(() => {
    void fetchData();
    return () => { tableRequest.current += 1; };
  }, [fetchData]);

  useEffect(() => {
    let active = true;
    setReportLoading(true);
    setReportError('');
    Promise.all([
      adminService.getTransactionStats({ from, to }),
      adminService.getRevenueReport({ from: from.slice(0, 10), to: to.slice(0, 10), groupBy }),
    ]).then(([financialStats, revenue]) => {
      if (!active) return;
      setStats(financialStats); setReport(revenue);
    }).catch(error => {
      if (active) setReportError(error?.response?.data?.message || 'Không tải được báo cáo doanh thu.');
    }).finally(() => { if (active) setReportLoading(false); });
    return () => { active = false; };
  }, [from, to, groupBy, reportVersion]);

  const handleOpenDetail = (txn: Transaction) => {
    setSelectedTxn(txn);
    setDetailOpen(true);
  };

  const handleOpenRefund = (txn: Transaction) => {
    setSelectedTxn(txn);
    setRefundOpen(true);
  };

  const handleConfirmRefund = async (txn: Transaction, reason: string) => {
    try {
      const updated = await adminService.refundTransaction(txn.id, reason);
      if (updated) {
        setTransactions(prev => prev.map(t => (t.id === txn.id ? { ...t, status: 'refunded' } : t)));
        message.success(`Đã xử lý hoàn tiền thành công cho giao dịch #${txn.ref}!`);
      }
      setRefundOpen(false);
      void fetchData();
      setReportVersion(value => value + 1);
    } catch {
      message.error('Có lỗi khi xử lý hoàn tiền');
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      message.info('Không có dữ liệu để xuất');
      return;
    }
    const headers = ['Mã Ref', 'Khách hàng', 'Email', 'Gói dịch vụ', 'Số tiền (VND)', 'Cổng thanh toán', 'Trạng thái', 'Thời gian'];
    const rows = transactions.map(t => [
      t.ref,
      `"${t.userName}"`,
      t.userEmail,
      t.plan,
      t.amount,
      t.gateway,
      t.status,
      t.createdAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,﻿' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Đã xuất báo cáo giao dịch (CSV)!');
  };

  const columns: TableColumnsType<Transaction> = [
    {
      title: 'Mã Ref',
      dataIndex: 'ref',
      key: 'ref',
      render: (ref: string, r) => (
        <a onClick={() => handleOpenDetail(r)} style={{ fontWeight: 700, color: '#6366F1' }}>
          #{ref}
        </a>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'user',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.userName}</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>{r.userEmail || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Gói dịch vụ',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan: string) => (
        <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600 }}>
          {plan}
        </Tag>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amt: number) => (
        <strong style={{ color: '#0F172A' }}>
          {amt.toLocaleString()} VND
        </strong>
      ),
    },
    {
      title: 'Cổng thanh toán',
      dataIndex: 'gateway',
      key: 'gateway',
      render: (gw: string) => (
        <Tag color="blue" style={{ borderRadius: 6 }}>
          {gw}
        </Tag>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => <span style={{ fontSize: 12, color: '#64748B' }}>{time}</span>,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, r) => {
        const st = STATUS_CFG[r.status] || STATUS_CFG.pending;
        return (
          <Tag color={st.color} icon={st.icon} style={{ borderRadius: 6, fontWeight: 600 }}>
            {st.label}
          </Tag>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, r) => (
        <Space size={6}>
          <Tooltip title="Xem chi tiết">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleOpenDetail(r)}
              style={{ borderRadius: 6 }}
            />
          </Tooltip>
          {r.status === 'paid' && (
            <Tooltip title="Hoàn tiền">
              <Button
                size="small"
                danger
                icon={<RollbackOutlined />}
                onClick={() => handleOpenRefund(r)}
                style={{ borderRadius: 6 }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 20 }}>Quản lý Giao dịch & Thanh toán</div>
          <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>
            Theo dõi dòng tiền đăng ký gói, tra cứu lịch sử giao dịch và đối soát hoàn tiền
          </div>
        </div>

        <Space>
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={() => { void fetchData(); setReportVersion(value => value + 1); }}
            style={{ borderRadius: 8 }}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportCSV}
            style={{ borderRadius: 8, fontWeight: 600, background: '#6366F1' }}
          >
            Xuất báo cáo
          </Button>
        </Space>
      </div>

      {/* Thông báo xác thực nếu gặp 401 */}
      {authError && (
        <Alert
          type="error"
          showIcon
          message="Yêu cầu đăng nhập xác thực (401 Unauthorized)"
          description={authError}
          style={{ marginBottom: 20, borderRadius: 10 }}
          action={
            <Button size="small" type="primary" danger onClick={() => { window.location.href = '/login'; }}>
              Đăng nhập tài khoản Admin
            </Button>
          }
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <strong>Khoảng thời gian</strong>
        <DatePicker.RangePicker value={dateRange} allowClear={false} format="DD/MM/YYYY"
          onChange={range => {
            if (range?.[0] && range?.[1]) {
              if (range[1].diff(range[0], 'day') > 366) { message.warning('Vui lòng chọn khoảng thời gian tối đa một năm.'); return; }
              setDateRange([range[0], range[1]]); setPage(0);
            }
          }} />
        <span style={{ color: '#64748b', fontSize: 12 }}>Báo cáo VNĐ theo khoảng đã chọn; bộ lọc bên dưới áp dụng cho danh sách giao dịch.</span>
      </div>
      {/* Financial KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} loading={reportLoading} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', height: '100%' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>DOANH THU THỰC NHẬN</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981', marginTop: 4 }}>
              {stats.totalRevenue >= 1e6 ? `${(stats.totalRevenue / 1e6).toFixed(2)} tr` : `${stats.totalRevenue.toLocaleString('vi-VN')} đ`}
            </div>
            <div style={{ fontSize: 11, color: '#10B981', marginTop: 2 }}>{stats.paidCount} giao dịch thành công</div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} loading={reportLoading} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', height: '100%' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>ĐANG CHỜ THANH TOÁN</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#3B82F6', marginTop: 4 }}>
              {stats.totalPending >= 1e6 ? `${(stats.totalPending / 1e6).toFixed(2)} tr` : `${stats.totalPending.toLocaleString('vi-VN')} đ`}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{stats.pendingCount} đơn chờ xác nhận từ gateway</div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} loading={reportLoading} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', height: '100%' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>TIỀN ĐÃ HOÀN TRẢ</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#EF4444', marginTop: 4 }}>
              {stats.totalRefunded >= 1e6 ? `${(stats.totalRefunded / 1e6).toFixed(2)} tr` : `${stats.totalRefunded.toLocaleString('vi-VN')} đ`}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{stats.refundedCount} giao dịch hoàn trả</div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} loading={reportLoading} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', height: '100%' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>TỔNG GIAO DỊCH</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#6366F1', marginTop: 4 }}>
              {stats.totalCount} đơn
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Trong khoảng thời gian đã chọn</div>
          </Card>
        </Col>
      </Row>

      <RevenueReportCard report={report} loading={reportLoading} error={reportError} groupBy={groupBy}
        onGroupChange={setGroupBy} onRetry={() => setReportVersion(value => value + 1)} />
      {/* Main Table Card */}
      <Card
        bordered={false}
        style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden' }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <Input
            placeholder="Tìm theo Mã Ref, Tên khách hàng, Email, Gói..."
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(0);
            }}
            style={{ flex: '1 1 240px', minWidth: 200, borderRadius: 8 }}
            allowClear
          />

          <Select
            value={statusFilter}
            onChange={val => {
              setStatusFilter(val);
              setPage(0);
            }}
            style={{ flex: '0 1 170px', minWidth: 150 }}
          >
            <Select.Option value="all">Tất cả trạng thái</Select.Option>
            <Select.Option value="paid">Thành công</Select.Option>
            <Select.Option value="pending">Đang xử lý</Select.Option>
            <Select.Option value="refunded">Đã hoàn tiền</Select.Option>
            <Select.Option value="failed">Thất bại</Select.Option>
          </Select>

          <Select
            value={gatewayFilter}
            onChange={val => {
              setGatewayFilter(val);
              setPage(0);
            }}
            style={{ flex: '0 1 160px', minWidth: 140 }}
          >
            <Select.Option value="all">Tất cả cổng</Select.Option>
            <Select.Option value="VNPAY">VNPAY</Select.Option>
            <Select.Option value="MoMo">MoMo</Select.Option>
            <Select.Option value="Bank Transfer">Chuyển khoản</Select.Option>
          </Select>
        </div>

        {/* Table with responsive horizontal scroll and server-side/fallback pagination */}
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page + 1,
            pageSize: pageSize,
            total: totalElements,
            showTotal: (total) => `Tổng số ${total} giao dịch`,
            responsive: true,
            showSizeChanger: true,
            onChange: (p, s) => {
              setPage(p - 1);
              if (s) setPageSize(s);
            },
          }}
          size="middle"
          scroll={{ x: 860 }}
        />
      </Card>

      {/* Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTxn}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onOpenRefund={handleOpenRefund}
      />

      {/* Refund Modal */}
      <RefundModal
        transaction={selectedTxn}
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        onConfirmRefund={handleConfirmRefund}
      />
    </div>
  );
}
