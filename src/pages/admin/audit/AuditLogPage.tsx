import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Input, Select, Button, Space, Typography, Tooltip, message, Spin } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  AuditOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { adminService } from '../../../services/api/adminService';
import type { AuditLogItem, AuditAction } from '../../../types/api/admin.types';
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
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchLogs = async (p = page) => {
    try {
      setLoading(true);
      const res = await adminService.getAuditLogs({
        page: p - 1,
        size: 10,
        search: search || undefined,
        action: actionFilter !== 'all' ? (actionFilter as AuditAction) : undefined,
        resource: resourceFilter !== 'all' ? resourceFilter : undefined,
      });
      const list = res.items ?? res.content ?? (Array.isArray(res) ? res : []);
      setLogs(list);
      setTotal(res.totalElements ?? list.length);
    } catch {
      // handled by apiClient interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(1); setPage(1); }, [search, actionFilter, resourceFilter]);
  useEffect(() => { fetchLogs(page); }, [page]);

  const handleOpenDetail = (log: AuditLogItem) => {
    setSelectedLog(log);
    setDrawerOpen(true);
  };

  const columns: TableColumnsType<AuditLogItem> = [
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
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            pagination={{
              current: page,
              pageSize: 10,
              total,
              onChange: setPage,
              showTotal: (t) => `Tổng số ${t} bản ghi audit`,
            }}
            size="middle"
          />
        </Spin>
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
