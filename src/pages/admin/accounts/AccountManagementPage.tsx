import React, { useState } from 'react';
import {
  Table, Tag, Avatar, Button, Input, Select, Space,
  Tooltip, Dropdown, Typography, Row, Col, Card, Statistic, Badge,
} from 'antd';
import type { MenuProps, TableColumnsType } from 'antd';
import {
  SearchOutlined, PlusOutlined, FilterOutlined,
  LockOutlined, UnlockOutlined, EyeOutlined,
  MoreOutlined, TeamOutlined, UserOutlined,
  SafetyCertificateOutlined, CrownOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { MOCK_ACCOUNTS, type AdminAccount, type AccountRole, type AccountStatus } from '../../../mock/adminData';
import CreateAdminModal from './components/CreateAdminModal';
import LockUnlockModal from './components/LockUnlockModal';

const { Text } = Typography;
const { Option } = Select;

// ── Status config ─────────────────────────────────────
const STATUS_CONFIG: Record<AccountStatus, { label: string; color: string; bg: string }> = {
  active:   { label: 'Hoạt động', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  locked:   { label: 'Đã khóa',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  inactive: { label: 'Không HĐ',  color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  pending:  { label: 'Chờ duyệt', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
};

const ROLE_CONFIG: Record<AccountRole, { label: string; color: string; icon: React.ReactNode }> = {
  super_admin: { label: 'Super Admin', color: '#8B5CF6', icon: <SafetyCertificateOutlined /> },
  admin:       { label: 'Admin',       color: '#6366F1', icon: <CrownOutlined /> },
  brand:       { label: 'Brand',       color: '#0EA5E9', icon: <TeamOutlined /> },
  creator:     { label: 'Creator',     color: '#10B981', icon: <UserOutlined /> },
};

export default function AccountManagementPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminAccount[]>(MOCK_ACCOUNTS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [lockTarget, setLockTarget] = useState<AdminAccount | null>(null);
  const [lockAction, setLockAction] = useState<'lock' | 'unlock' | 'restore'>('lock');
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  // Filtered data
  const filtered = data.filter(acc => {
    const q = search.toLowerCase();
    const matchSearch = !q || acc.name.toLowerCase().includes(q) || acc.email.toLowerCase().includes(q);
    const matchRole   = roleFilter === 'all'   || acc.role === roleFilter;
    const matchStatus = statusFilter === 'all' || acc.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  // KPI stats
  const stats = {
    total:   data.length,
    active:  data.filter(a => a.status === 'active').length,
    locked:  data.filter(a => a.status === 'locked').length,
    pending: data.filter(a => a.status === 'pending').length,
  };

  const openLock = (record: AdminAccount, action: 'lock' | 'unlock' | 'restore') => {
    setLockTarget(record);
    setLockAction(action);
  };

  const handleLockDone = (id: string, newStatus: AccountStatus) => {
    setData(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    setLockTarget(null);
  };

  const handleCreate = (newAdmin: AdminAccount) => {
    setData(prev => [newAdmin, ...prev]);
    setCreateOpen(false);
  };

  const rowActions = (record: AdminAccount): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'Xem chi tiết',
      onClick: () => navigate(`/admin/accounts/${record.id}`),
    },
    { type: 'divider' },
    record.status === 'active'
      ? { key: 'lock',    icon: <LockOutlined style={{ color: '#EF4444' }} />, label: <span style={{ color: '#EF4444' }}>Khóa tài khoản</span>, onClick: () => openLock(record, 'lock') }
      : record.status === 'locked'
      ? { key: 'unlock',  icon: <UnlockOutlined style={{ color: '#10B981' }} />, label: <span style={{ color: '#10B981' }}>Mở khóa</span>, onClick: () => openLock(record, 'unlock') }
      : { key: 'restore', icon: <UnlockOutlined style={{ color: '#F59E0B' }} />, label: <span style={{ color: '#F59E0B' }}>Khôi phục</span>, onClick: () => openLock(record, 'restore') },
  ];

  const columns: TableColumnsType<AdminAccount> = [
    {
      title: 'Tài khoản',
      key: 'account',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar src={r.avatar} size={36} style={{ border: '1.5px solid rgba(99,102,241,0.3)', flexShrink: 0 }} />
          <div>
            <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{r.name}</div>
            <div style={{ color: '#64748B', fontSize: 11.5, lineHeight: 1.2 }}>{r.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role: AccountRole) => {
        const cfg = ROLE_CONFIG[role];
        return (
          <Tag
            icon={cfg.icon}
            style={{
              background: cfg.color + '18',
              border: `1px solid ${cfg.color}40`,
              color: cfg.color,
              borderRadius: 20,
              fontWeight: 700,
              fontSize: 11,
              padding: '2px 8px',
            }}
          >
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: AccountStatus) => {
        const cfg = STATUS_CONFIG[status];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Badge color={cfg.color} />
            <span style={{ color: cfg.color, fontWeight: 600, fontSize: 12 }}>{cfg.label}</span>
          </div>
        );
      },
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 160,
      render: (v: string) => <Text style={{ color: '#64748B', fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      width: 130,
      render: (v: string) => <Text style={{ color: '#64748B', fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Tooltip title="Xem chi tiết">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/admin/accounts/${record.id}`)}
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818CF8' }}
            />
          </Tooltip>
          <Dropdown menu={{ items: rowActions(record) }} trigger={['click']} placement="bottomRight">
            <Button
              size="small"
              icon={<MoreOutlined />}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8' }}
            />
          </Dropdown>
        </div>
      ),
    },
  ];

  const statCards = [
    { label: 'Tổng tài khoản', value: stats.total, color: '#6366F1', icon: <TeamOutlined /> },
    { label: 'Đang hoạt động', value: stats.active, color: '#10B981', icon: <UnlockOutlined /> },
    { label: 'Đã khóa', value: stats.locked, color: '#EF4444', icon: <LockOutlined /> },
    { label: 'Chờ duyệt', value: stats.pending, color: '#F59E0B', icon: <UserOutlined /> },
  ];

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 20 }}>Quản lý Tài khoản</div>
          <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>Quản lý toàn bộ tài khoản Admin, Brand và Creator</div>
        </div>
        <Space>
          <Button
            icon={<ExportOutlined />}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8' }}
          >
            Export CSV
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none', fontWeight: 700 }}
          >
            Tạo Admin mới
          </Button>
        </Space>
      </div>

      {/* KPI Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {statCards.map(card => (
          <Col xs={12} sm={6} key={card.label}>
        <Card
          bordered={false}
          bodyStyle={{ padding: '14px 18px' }}
          style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', height: '100%' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: card.color + '15',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: card.color, fontSize: 16,
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>{card.label}</div>
              <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 20, lineHeight: 1.1 }}>{card.value}</div>
            </div>
          </div>
        </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Card
        bordered={false}
        bodyStyle={{ padding: '14px 18px' }}
        style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 16 }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={10} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: '#64748B' }} />}
              placeholder="Tìm theo tên, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', borderRadius: 8 }}
              allowClear
            />
          </Col>
          <Col xs={12} sm={7} md={5}>
            <Select
              value={roleFilter}
              onChange={setRoleFilter}
              style={{ width: '100%' }}
              suffixIcon={<FilterOutlined style={{ color: '#64748B' }} />}
            >
              <Option value="all">Tất cả vai trò</Option>
              <Option value="super_admin">Super Admin</Option>
              <Option value="admin">Admin</Option>
              <Option value="brand">Brand</Option>
              <Option value="creator">Creator</Option>
            </Select>
          </Col>
          <Col xs={12} sm={7} md={5}>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: '100%' }}>
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="active">Hoạt động</Option>
              <Option value="locked">Đã khóa</Option>
              <Option value="inactive">Không HĐ</Option>
              <Option value="pending">Chờ duyệt</Option>
            </Select>
          </Col>
          <Col xs={24} sm={0} md={6} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Text style={{ color: '#64748B', fontSize: 12 }}>{filtered.length} / {data.length} tài khoản</Text>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}
      >
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          size="middle"
          rowSelection={{
            selectedRowKeys: selectedKeys,
            onChange: setSelectedKeys,
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => <span style={{ color: '#64748B', fontSize: 12 }}>{total} tài khoản</span>,
          }}
          onRow={record => ({
            onClick: () => navigate(`/admin/accounts/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      {/* Modals */}
      <CreateAdminModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
      {lockTarget && (
        <LockUnlockModal
          open={!!lockTarget}
          account={lockTarget}
          action={lockAction}
          onClose={() => setLockTarget(null)}
          onDone={handleLockDone}
        />
      )}
    </div>
  );
}
