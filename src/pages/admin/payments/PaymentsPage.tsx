import React, { useState } from 'react';
import { Card, Table, Tag, Input, Select, Button, Row, Col, Space, Typography, Tooltip, message } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  DollarCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { MOCK_TRANSACTIONS, type Transaction, type TxnStatus } from '../../../mock/adminData';
import TransactionDetailModal from './components/TransactionDetailModal';
import RefundModal from './components/RefundModal';

const { Text } = Typography;

const STATUS_CFG: Record<TxnStatus, { label: string; color: string; icon: React.ReactNode }> = {
  paid:     { label: 'Thành công',  color: 'success',    icon: <CheckCircleOutlined /> },
  pending:  { label: 'Đang xử lý',  color: 'processing', icon: <ClockCircleOutlined /> },
  refunded: { label: 'Đã hoàn tiền', color: 'default',    icon: <RollbackOutlined /> },
  failed:   { label: 'Thất bại',    color: 'error',      icon: <CloseCircleOutlined /> },
};

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  // Financial Stats
  const totalRevenue = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunded = transactions
    .filter(t => t.status === 'refunded')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPending = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const paidCount = transactions.filter(t => t.status === 'paid').length;

  const handleOpenDetail = (txn: Transaction) => {
    setSelectedTxn(txn);
    setDetailOpen(true);
  };

  const handleOpenRefund = (txn: Transaction) => {
    setSelectedTxn(txn);
    setRefundOpen(true);
  };

  const handleConfirmRefund = (txn: Transaction, reason: string) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === txn.id
          ? { ...t, status: 'refunded' }
          : t
      )
    );
    setRefundOpen(false);
    message.success(`Đã xử lý hoàn tiền thành công cho giao dịch #${txn.ref}!`);
  };

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      t.ref.toLowerCase().includes(q) ||
      t.userName.toLowerCase().includes(q) ||
      t.userEmail.toLowerCase().includes(q);
    const matchS = statusFilter === 'all' || t.status === statusFilter;
    const matchG = gatewayFilter === 'all' || t.gateway === gatewayFilter;
    return matchQ && matchS && matchG;
  });

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
          <div style={{ fontSize: 11, color: '#64748B' }}>{r.userEmail}</div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 20 }}>Payments & Transaction Management</div>
          <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>
            Theo dõi dòng tiền đăng ký gói, tra cứu lịch sử giao dịch và đối soát hoàn tiền
          </div>
        </div>

        <Button
          icon={<DownloadOutlined />}
          onClick={() => message.success('Đã xuất báo cáo giao dịch (CSV)!')}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Xuất báo cáo
        </Button>
      </div>

      {/* Financial KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>DOANH THU THỰC NHẬN</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981', marginTop: 4 }}>
              {(totalRevenue / 1e6).toFixed(2)} tr
            </div>
            <div style={{ fontSize: 11, color: '#10B981', marginTop: 2 }}>{paidCount} giao dịch thành công</div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>ĐANG CHỜ THANH TOÁN</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#3B82F6', marginTop: 4 }}>
              {(totalPending / 1e6).toFixed(2)} tr
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Đang chờ xác nhận từ gateway</div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>TIỀN ĐÃ HOÀN TRẢ</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#EF4444', marginTop: 4 }}>
              {(totalRefunded / 1e6).toFixed(2)} tr
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Theo yêu cầu bảo đảm quyền lợi</div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>TỔNG GIAO DỊCH</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#6366F1', marginTop: 4 }}>
              {transactions.length} đơn
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Ghi nhận trong toàn hệ thống</div>
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card
        bordered={false}
        style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden' }}
        bodyStyle={{ padding: 20 }}
      >
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <Input
            placeholder="Tìm theo Mã Ref, Tên khách hàng, Email..."
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 280, borderRadius: 8 }}
            allowClear
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
          >
            <Select.Option value="all">Tất cả trạng thái</Select.Option>
            <Select.Option value="paid">Thành công</Select.Option>
            <Select.Option value="pending">Đang xử lý</Select.Option>
            <Select.Option value="refunded">Đã hoàn tiền</Select.Option>
            <Select.Option value="failed">Thất bại</Select.Option>
          </Select>

          <Select
            value={gatewayFilter}
            onChange={setGatewayFilter}
            style={{ width: 160 }}
          >
            <Select.Option value="all">Tất cả cổng</Select.Option>
            <Select.Option value="VNPAY">VNPAY</Select.Option>
            <Select.Option value="MoMo">MoMo</Select.Option>
            <Select.Option value="Bank Transfer">Chuyển khoản ngân hàng</Select.Option>
          </Select>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 8, showTotal: (t) => `Tổng số ${t} giao dịch` }}
          size="middle"
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
