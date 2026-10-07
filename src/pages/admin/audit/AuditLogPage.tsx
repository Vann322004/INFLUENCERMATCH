import React, { useState } from 'react';
import { Card, Table, Tag, Input, Select, Button, Space, Typography, Tooltip, message } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  AuditOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { MOCK_AUDIT_LOGS, type AuditLog, type AuditAction } from '../../../mock/adminData';
import AuditDetailDrawer from './components/AuditDetailDrawer';

const { Text } = Typography;

const ACTION_COLORS: Record<AuditAction, string> = {
  CREATE: 'blue',
  UPDATE: 'orange',
  DELETE: 'red',
  LOGIN:  'green',
  LOGOUT: 'default',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleOpenDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setDrawerOpen(true);
  };

  const filteredLogs = logs.filter(l => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      l.actor.toLowerCase().includes(q) ||
      l.actorEmail.toLowerCase().includes(q) ||
      l.resource.toLowerCase().includes(q) ||
      l.resourceId.toLowerCase().includes(q) ||
      l.ip.includes(q);
    const matchA = actionFilter === 'all' || l.action === actionFilter;
    const matchR = resourceFilter === 'all' || l.resource === resourceFilter;
    return matchQ && matchA && matchR;
  });

  const columns: TableColumnsType<AuditLog> = [
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (t: string) => <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>{t}</span>,
    },
    {
      title: 'Người thực hiện',
      key: 'actor',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.actor}</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>{r.actorEmail}</div>
        </div>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      render: (act: AuditAction) => (
        <Tag color={ACTION_COLORS[act] || 'default'} style={{ fontWeight: 700, borderRadius: 6 }}>
          {act}
        </Tag>
      ),
    },
    {
      title: 'Tài nguyên / Đối tượng',
      key: 'resource',
      render: (_, r) => (
        <div>
          <Tag color="purple" style={{ borderRadius: 6 }}>{r.resource}</Tag>
          <span style={{ fontSize: 11, color: '#64748B' }}>ID: {r.resourceId}</span>
        </div>
      ),
    },
    {
      title: 'Địa chỉ IP',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip: string) => <code style={{ fontSize: 12, color: '#475569' }}>{ip}</code>,
    },
    {
      title: 'Chi tiết',
      key: 'actions',
      render: (_, r) => (
        <Tooltip title="Xem biến động dữ liệu">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleOpenDetail(r)}
            style={{ borderRadius: 6 }}
          >
            So sánh
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 20 }}>Audit Log & Security Trail</div>
          <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>
            Nhật ký kiểm toán hệ thống, lưu vết toàn bộ thay đổi cấu hình, dữ liệu và hành động quản trị
          </div>
        </div>

        <Button
          icon={<DownloadOutlined />}
          onClick={() => message.success('Đã xuất toàn bộ Audit Log ra file CSV!')}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Xuất CSV
        </Button>
      </div>

      {/* Main Table Card */}
      <Card
        bordered={false}
        style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden' }}
        bodyStyle={{ padding: 20 }}
      >
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <Input
            placeholder="Tìm theo Actor, Resource, IP..."
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 280, borderRadius: 8 }}
            allowClear
          />

          <Select
            value={actionFilter}
            onChange={setActionFilter}
            style={{ width: 160 }}
          >
            <Select.Option value="all">Tất cả hành động</Select.Option>
            <Select.Option value="CREATE">CREATE</Select.Option>
            <Select.Option value="UPDATE">UPDATE</Select.Option>
            <Select.Option value="DELETE">DELETE</Select.Option>
            <Select.Option value="LOGIN">LOGIN</Select.Option>
          </Select>

          <Select
            value={resourceFilter}
            onChange={setResourceFilter}
            style={{ width: 180 }}
          >
            <Select.Option value="all">Tất cả tài nguyên</Select.Option>
            <Select.Option value="Auth">Auth (Xác thực)</Select.Option>
            <Select.Option value="Account">Account (Tài khoản)</Select.Option>
            <Select.Option value="ScoringConfig">ScoringConfig (Thuật toán)</Select.Option>
            <Select.Option value="SubscriptionPlan">SubscriptionPlan (Gói)</Select.Option>
            <Select.Option value="Creator">Creator (Hồ sơ)</Select.Option>
            <Select.Option value="DataConnector">DataConnector (Kết nối)</Select.Option>
          </Select>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredLogs}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: (t) => `Tổng số ${t} bản ghi audit` }}
          size="middle"
        />
      </Card>

      {/* Detail Diff Drawer */}
      <AuditDetailDrawer
        log={selectedLog}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
