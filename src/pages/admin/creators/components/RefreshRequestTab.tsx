import React, { useState } from 'react';
import {
  Table, Avatar, Tag, Button, Space, Badge, Tooltip,
  Typography, message, Select, Input,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  SyncOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SearchOutlined, ClockCircleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

interface RefreshRequest {
  id: string;
  handle: string;
  platform: string;
  avatar: string;
  requestedBy: string;
  requestedAt: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  status: 'queued' | 'in_progress' | 'done' | 'failed';
  lastData: string;
}

const MOCK_REFRESH: RefreshRequest[] = [
  { id: 'r1', handle: '@linh_beauty',   platform: 'tiktok',    avatar: 'https://i.pravatar.cc/40?img=1',  requestedBy: 'Brand: NovaSkin', requestedAt: '10 phút trước',  reason: 'Dữ liệu lỗi thời >30 ngày', priority: 'high',   status: 'queued',      lastData: '45 ngày trước' },
  { id: 'r2', handle: '@chef_minh',     platform: 'youtube',   avatar: 'https://i.pravatar.cc/40?img=4',  requestedBy: 'System',           requestedAt: '1 giờ trước',    reason: 'Scheduled auto-refresh',    priority: 'medium', status: 'in_progress', lastData: '30 ngày trước' },
  { id: 'r3', handle: '@travel_viet',   platform: 'tiktok',    avatar: 'https://i.pravatar.cc/40?img=7',  requestedBy: 'Brand: TourPro',   requestedAt: '2 giờ trước',    reason: 'Yêu cầu từ brand',           priority: 'high',   status: 'done',        lastData: 'Vừa xong' },
  { id: 'r4', handle: '@fitness_mai',   platform: 'tiktok',    avatar: 'https://i.pravatar.cc/40?img=9',  requestedBy: 'Admin',            requestedAt: '3 giờ trước',    reason: 'Score thay đổi đột biến',   priority: 'high',   status: 'failed',      lastData: '60 ngày trước' },
  { id: 'r5', handle: '@beauty_sg',     platform: 'instagram', avatar: 'https://i.pravatar.cc/40?img=11', requestedBy: 'Brand: GlowCo',   requestedAt: '5 giờ trước',    reason: 'Chuẩn bị chiến dịch Q4',   priority: 'low',    status: 'queued',      lastData: '14 ngày trước' },
  { id: 'r6', handle: '@tech_saigon',   platform: 'youtube',   avatar: 'https://i.pravatar.cc/40?img=13', requestedBy: 'System',           requestedAt: '1 ngày trước',   reason: 'Scheduled auto-refresh',    priority: 'medium', status: 'done',        lastData: 'Hôm qua' },
];

const PRIORITY_CFG: Record<string, { label: string; color: string }> = {
  high:   { label: 'Cao',    color: '#EF4444' },
  medium: { label: 'Trung',  color: '#F59E0B' },
  low:    { label: 'Thấp',   color: '#94A3B8' },
};

const STATUS_CFG: Record<string, { label: string; badge: 'processing' | 'success' | 'error' | 'default' | 'warning' }> = {
  queued:      { label: 'Chờ xử lý',   badge: 'default' },
  in_progress: { label: 'Đang chạy',   badge: 'processing' },
  done:        { label: 'Hoàn thành',  badge: 'success' },
  failed:      { label: 'Thất bại',    badge: 'error' },
};

const PLATFORM_COLOR: Record<string, string> = {
  tiktok: '#010101', instagram: '#E1306C', youtube: '#FF0000',
};

export default function RefreshRequestTab() {
  const [data, setData]     = useState(MOCK_REFRESH);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('all');

  const filtered = data.filter(r => {
    const mQ = !search || r.handle.toLowerCase().includes(search.toLowerCase());
    const mS = statusF === 'all' || r.status === statusF;
    return mQ && mS;
  });

  const retry = (id: string) => {
    setData(prev => prev.map(r => r.id === id ? { ...r, status: 'queued' as const } : r));
    message.success('Đã đưa vào queue lại!');
  };

  const cancelRequest = (id: string) => {
    setData(prev => prev.filter(r => r.id !== id));
    message.info('Đã hủy yêu cầu.');
  };

  const columns: TableColumnsType<RefreshRequest> = [
    {
      title: 'Creator',
      key: 'creator',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar src={r.avatar} size={32} style={{ flexShrink: 0, border: '1.5px solid #E2E8F0' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', lineHeight: 1.2 }}>{r.handle}</div>
            <Tag style={{ fontSize: 9, padding: '0 4px', lineHeight: '14px', color: PLATFORM_COLOR[r.platform], background: PLATFORM_COLOR[r.platform]+'10', border: 'none', borderRadius: 10 }}>
              {r.platform}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Yêu cầu bởi',
      dataIndex: 'requestedBy',
      width: 140,
      render: (v: string) => <Text style={{ color: '#334155', fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      render: (v: string) => <Text style={{ color: '#64748B', fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      width: 90,
      render: (p: string) => (
        <Tag style={{ background: PRIORITY_CFG[p].color + '15', border: `1px solid ${PRIORITY_CFG[p].color}40`, color: PRIORITY_CFG[p].color, borderRadius: 20, fontWeight: 700, fontSize: 11 }}>
          {PRIORITY_CFG[p].label}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      render: (s: string) => (
        <Badge
          status={STATUS_CFG[s].badge}
          text={<span style={{ fontWeight: 600, fontSize: 12 }}>{STATUS_CFG[s].label}</span>}
        />
      ),
    },
    {
      title: 'Dữ liệu cuối',
      dataIndex: 'lastData',
      width: 120,
      render: (v: string) => <Text style={{ color: '#94A3B8', fontSize: 12 }}><ClockCircleOutlined style={{ marginRight: 4 }} />{v}</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_, r) => (
        <Space>
          {r.status === 'failed' && (
            <Tooltip title="Thử lại">
              <Button size="small" icon={<SyncOutlined />} onClick={() => retry(r.id)}
                style={{ borderColor: '#5B5BF0', color: '#5B5BF0' }} />
            </Tooltip>
          )}
          {(r.status === 'queued') && (
            <Tooltip title="Hủy yêu cầu">
              <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => cancelRequest(r.id)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Stats bar
  const stats = {
    queued:      data.filter(r => r.status === 'queued').length,
    in_progress: data.filter(r => r.status === 'in_progress').length,
    done:        data.filter(r => r.status === 'done').length,
    failed:      data.filter(r => r.status === 'failed').length,
  };

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'queued',      label: 'Chờ xử lý', color: '#64748B', bg: '#F8FAFC' },
          { key: 'in_progress', label: 'Đang chạy',  color: '#5B5BF0', bg: '#EEF2FF' },
          { key: 'done',        label: 'Xong',        color: '#10B981', bg: '#ECFDF5' },
          { key: 'failed',      label: 'Lỗi',         color: '#EF4444', bg: '#FEF2F2' },
        ].map(s => (
          <div key={s.key} style={{ padding: '8px 16px', borderRadius: 10, background: s.bg, cursor: 'pointer',
            border: `1px solid ${s.color}25` }} onClick={() => setStatusF(s.key)}>
            <span style={{ fontWeight: 800, fontSize: 18, color: s.color }}>{stats[s.key as keyof typeof stats]}</span>
            <span style={{ fontSize: 11, color: s.color, marginLeft: 6, fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Space wrap style={{ marginBottom: 14 }}>
        <Input prefix={<SearchOutlined />} placeholder="Tìm handle..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} allowClear />
        <Select value={statusF} onChange={setStatusF} style={{ width: 150 }}>
          <Option value="all">Tất cả trạng thái</Option>
          <Option value="queued">Chờ xử lý</Option>
          <Option value="in_progress">Đang chạy</Option>
          <Option value="done">Hoàn thành</Option>
          <Option value="failed">Thất bại</Option>
        </Select>
      </Space>

      <Table columns={columns} dataSource={filtered} rowKey="id" size="middle"
        pagination={{ pageSize: 8, showTotal: t => `${t} yêu cầu` }} />
    </div>
  );
}
