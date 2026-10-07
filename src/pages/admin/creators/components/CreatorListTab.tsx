import React, { useState } from 'react';
import {
  Table, Input, Select, Button, Tag, Avatar, Badge,
  Tooltip, Switch, Space, Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  SearchOutlined, FilterOutlined, EyeOutlined,
  InstagramOutlined, YoutubeOutlined,
} from '@ant-design/icons';
import { TikTokOutlined } from '@ant-design/icons';
import { MOCK_CREATORS, type AdminCreator, type CreatorStatus } from '../../../../mock/adminData';

const { Text } = Typography;
const { Option } = Select;

const STATUS_CFG: Record<CreatorStatus, { label: string; color: string }> = {
  active:   { label: 'Hoạt động',  color: 'success' },
  hidden:   { label: 'Ẩn',         color: 'default' },
  inactive: { label: 'Không HĐ',   color: 'warning' },
  pending:  { label: 'Chờ duyệt',  color: 'processing' },
};

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  tiktok:    <span style={{ color: '#010101', fontWeight: 800, fontSize: 11 }}>TT</span>,
  instagram: <InstagramOutlined style={{ color: '#E1306C' }} />,
  youtube:   <YoutubeOutlined   style={{ color: '#FF0000' }} />,
};

const PLATFORM_COLOR: Record<string, string> = {
  tiktok: '#010101', instagram: '#E1306C', youtube: '#FF0000',
};

export default function CreatorListTab() {
  const [data, setData] = useState(MOCK_CREATORS);
  const [search, setSearch]   = useState('');
  const [platform, setPlatform] = useState('all');
  const [status, setStatus]   = useState('all');

  const filtered = data.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.handle.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
    const matchP = platform === 'all' || c.platform === platform;
    const matchS = status   === 'all' || c.status   === status;
    return matchQ && matchP && matchS;
  });

  const toggleHide = (id: string, checked: boolean) => {
    setData(prev => prev.map(c =>
      c.id === id ? { ...c, status: checked ? 'active' : 'hidden' } : c
    ));
  };

  const columns: TableColumnsType<AdminCreator> = [
    {
      title: 'Creator',
      key: 'creator',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar src={r.avatar} size={36} style={{ border: '1.5px solid #E2E8F0', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', lineHeight: 1.2 }}>{r.name}</div>
            <div style={{ fontSize: 11.5, color: '#64748B', lineHeight: 1.2 }}>{r.handle}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      width: 110,
      render: (p: string) => (
        <Tag
          icon={PLATFORM_ICON[p]}
          style={{
            background: PLATFORM_COLOR[p] + '10',
            border: `1px solid ${PLATFORM_COLOR[p]}30`,
            color: PLATFORM_COLOR[p],
            borderRadius: 20, fontWeight: 700, fontSize: 11,
          }}
        >
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Followers',
      dataIndex: 'followers',
      key: 'followers',
      width: 110,
      sorter: (a, b) => a.followers - b.followers,
      render: (v: number) => (
        <Text style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>
          {v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + 'M' : (v / 1_000).toFixed(0) + 'K'}
        </Text>
      ),
    },
    {
      title: 'ER%',
      dataIndex: 'er',
      key: 'er',
      width: 80,
      sorter: (a, b) => a.er - b.er,
      render: (v: number) => (
        <Tag color={v >= 7 ? 'success' : v >= 4 ? 'blue' : 'default'} style={{ fontWeight: 700 }}>
          {v}%
        </Tag>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (v: string) => <Tag style={{ borderRadius: 20, fontSize: 11 }}>{v}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: CreatorStatus) => (
        <Badge status={STATUS_CFG[s].color as any} text={
          <span style={{ fontSize: 12, fontWeight: 600 }}>{STATUS_CFG[s].label}</span>
        } />
      ),
    },
    {
      title: 'Hiển thị',
      key: 'visible',
      width: 80,
      render: (_, r) => (
        <Switch
          size="small"
          checked={r.status === 'active'}
          onChange={checked => toggleHide(r.id, checked)}
        />
      ),
    },
    {
      title: 'Xác minh cuối',
      dataIndex: 'lastVerified',
      key: 'lastVerified',
      width: 120,
      render: (v: string) => <Text style={{ color: '#94A3B8', fontSize: 12 }}>{v}</Text>,
    },
  ];

  return (
    <div>
      {/* Filter Bar */}
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
          placeholder="Tìm handle, tên..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 240 }}
          allowClear
        />
        <Select value={platform} onChange={setPlatform} style={{ width: 140 }} suffixIcon={<FilterOutlined />}>
          <Option value="all">Tất cả platform</Option>
          <Option value="tiktok">TikTok</Option>
          <Option value="instagram">Instagram</Option>
          <Option value="youtube">YouTube</Option>
        </Select>
        <Select value={status} onChange={setStatus} style={{ width: 150 }}>
          <Option value="all">Tất cả trạng thái</Option>
          <Option value="active">Hoạt động</Option>
          <Option value="hidden">Ẩn</Option>
          <Option value="inactive">Không HĐ</Option>
          <Option value="pending">Chờ duyệt</Option>
        </Select>
        <Text style={{ color: '#94A3B8', fontSize: 12 }}>{filtered.length} creator</Text>
      </Space>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        size="middle"
        pagination={{ pageSize: 10, showTotal: t => `${t} creators` }}
      />
    </div>
  );
}
