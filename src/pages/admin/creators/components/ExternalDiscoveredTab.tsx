import React, { useState } from 'react';
import {
  Table, Avatar, Tag, Button, Input, Select, Space,
  Typography, Tooltip, Badge, message,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  SearchOutlined, CheckCircleOutlined, CloseCircleOutlined,
  GlobalOutlined, FilterOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

interface ExternalCreator {
  id: string;
  handle: string;
  platform: string;
  followers: number;
  er: number;
  country: string;
  source: string;
  discoveredAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

const MOCK_EXTERNAL: ExternalCreator[] = [
  { id: 'e1', handle: '@travel_viet',    platform: 'tiktok',    followers: 2100000, er: 8.2, country: 'VN', source: 'TikTok Trend',    discoveredAt: '2 giờ trước',  status: 'pending' },
  { id: 'e2', handle: '@chef_hanoi',     platform: 'instagram', followers: 780000,  er: 5.6, country: 'VN', source: 'Brand Mention',   discoveredAt: '5 giờ trước',  status: 'pending' },
  { id: 'e3', handle: '@tech_saigon',    platform: 'youtube',   followers: 430000,  er: 4.1, country: 'VN', source: 'YouTube Search',  discoveredAt: '1 ngày trước', status: 'approved' },
  { id: 'e4', handle: '@fitness_mai',    platform: 'tiktok',    followers: 950000,  er: 9.3, country: 'VN', source: 'TikTok Trend',    discoveredAt: '1 ngày trước', status: 'pending' },
  { id: 'e5', handle: '@beauty_sg',      platform: 'instagram', followers: 1200000, er: 6.8, country: 'SG', source: 'Partner Network', discoveredAt: '2 ngày trước', status: 'rejected' },
  { id: 'e6', handle: '@game_quang',     platform: 'youtube',   followers: 2500000, er: 3.2, country: 'VN', source: 'YouTube Search',  discoveredAt: '3 ngày trước', status: 'approved' },
];

const PLATFORM_COLOR: Record<string, string> = {
  tiktok: '#010101', instagram: '#E1306C', youtube: '#FF0000',
};

const STATUS_BADGE: Record<string, { label: string; color: 'processing' | 'success' | 'error' }> = {
  pending:  { label: 'Chờ duyệt', color: 'processing' },
  approved: { label: 'Đã duyệt',  color: 'success' },
  rejected: { label: 'Từ chối',   color: 'error' },
};

export default function ExternalDiscoveredTab() {
  const [data, setData] = useState(MOCK_EXTERNAL);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('pending');

  const filtered = data.filter(c => {
    const q = search.toLowerCase();
    const mQ = !q || c.handle.toLowerCase().includes(q);
    const mP = platform === 'all' || c.platform === platform;
    const mS = status   === 'all' || c.status   === status;
    return mQ && mP && mS;
  });

  const approve = (id: string) => {
    setData(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' as const } : c));
    message.success('Đã thêm creator vào catalog!');
  };

  const reject = (id: string) => {
    setData(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' as const } : c));
    message.info('Đã từ chối creator.');
  };

  const columns: TableColumnsType<ExternalCreator> = [
    {
      title: 'Handle',
      key: 'handle',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={32} style={{ background: PLATFORM_COLOR[r.platform] + '20', color: PLATFORM_COLOR[r.platform], fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
            {r.platform[0].toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{r.handle}</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>{r.source}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      width: 110,
      render: (p: string) => (
        <Tag style={{ background: PLATFORM_COLOR[p]+'12', border: `1px solid ${PLATFORM_COLOR[p]}30`, color: PLATFORM_COLOR[p], borderRadius: 20, fontWeight: 700, fontSize: 11 }}>
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Followers',
      dataIndex: 'followers',
      width: 100,
      sorter: (a, b) => a.followers - b.followers,
      render: (v: number) => <Text style={{ fontWeight: 700, color: '#0F172A' }}>{v >= 1e6 ? (v/1e6).toFixed(1)+'M' : (v/1e3).toFixed(0)+'K'}</Text>,
    },
    {
      title: 'ER%',
      dataIndex: 'er',
      width: 70,
      render: (v: number) => <Tag color={v >= 7 ? 'success' : v >= 4 ? 'blue' : 'default'} style={{ fontWeight: 700 }}>{v}%</Tag>,
    },
    {
      title: 'Phát hiện',
      dataIndex: 'discoveredAt',
      width: 120,
      render: (v: string) => <Text style={{ color: '#94A3B8', fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 110,
      render: (s: string) => <Badge status={STATUS_BADGE[s].color} text={<span style={{ fontWeight: 600, fontSize: 12 }}>{STATUS_BADGE[s].label}</span>} />,
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      render: (_, r) => r.status === 'pending' ? (
        <Space>
          <Tooltip title="Thêm vào catalog">
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => approve(r.id)}
              style={{ background: '#10B981', border: 'none' }} />
          </Tooltip>
          <Tooltip title="Từ chối">
            <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => reject(r.id)} />
          </Tooltip>
        </Space>
      ) : (
        <Text style={{ color: '#94A3B8', fontSize: 12 }}>—</Text>
      ),
    },
  ];

  const pendingCount  = data.filter(c => c.status === 'pending').length;
  const approvedCount = data.filter(c => c.status === 'approved').length;

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Chờ duyệt', value: pendingCount,  bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C' },
          { label: 'Đã thêm',   value: approvedCount, bg: '#F0FDF4', border: '#BBF7D0', color: '#16A34A' },
        ].map(s => (
          <div key={s.label} style={{ padding: '8px 16px', borderRadius: 10, background: s.bg, border: `1px solid ${s.border}` }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 12, color: s.color, marginLeft: 6, fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Space wrap style={{ marginBottom: 14 }}>
        <Input prefix={<SearchOutlined />} placeholder="Tìm handle..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} allowClear />
        <Select value={platform} onChange={setPlatform} style={{ width: 140 }} suffixIcon={<FilterOutlined />}>
          <Option value="all">Tất cả</Option>
          <Option value="tiktok">TikTok</Option>
          <Option value="instagram">Instagram</Option>
          <Option value="youtube">YouTube</Option>
        </Select>
        <Select value={status} onChange={setStatus} style={{ width: 140 }}>
          <Option value="all">Tất cả TT</Option>
          <Option value="pending">Chờ duyệt</Option>
          <Option value="approved">Đã duyệt</Option>
          <Option value="rejected">Từ chối</Option>
        </Select>
      </Space>

      <Table columns={columns} dataSource={filtered} rowKey="id" size="middle"
        pagination={{ pageSize: 8, showTotal: t => `${t} creators` }} />
    </div>
  );
}
