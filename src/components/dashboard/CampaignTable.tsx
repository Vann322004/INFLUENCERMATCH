import React, { useState, useMemo } from 'react';
import {
  Card,
  Tabs,
  Input,
  Select,
  Table,
  Tag,
  Avatar,
  Space,
  Button,
  Dropdown,
  Pagination,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  SearchOutlined,
  EllipsisOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { CAMPAIGNS_DATA } from '../../data/mockData';
import type { Campaign } from '../../data/mockData';

export default function CampaignTable() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter & Sort
  const filteredData = useMemo(() => {
    let list = [...CAMPAIGNS_DATA];

    // Status filter
    if (activeTab === 'running') {
      list = list.filter((c) => c.status === 'running');
    } else if (activeTab === 'draft') {
      list = list.filter((c) => c.status === 'draft');
    } else if (activeTab === 'completed') {
      list = list.filter((c) => c.status === 'completed');
    }

    // Search filter
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q));
    }

    // Sort
    if (sortBy === 'reach') {
      list.sort((a, b) => b.reachNumber - a.reachNumber);
    } else if (sortBy === 'cost') {
      list.sort((a, b) => b.spentNumber - a.spentNumber);
    }

    return list;
  }, [activeTab, searchText, sortBy]);

  const actionItems: MenuProps['items'] = [
    { key: 'view', icon: <EyeOutlined />, label: 'Xem chi tiết' },
    { key: 'edit', icon: <EditOutlined />, label: 'Chỉnh sửa' },
    { type: 'divider' },
    { key: 'delete', icon: <DeleteOutlined />, danger: true, label: 'Xóa chiến dịch' },
  ];

  const columns: ColumnsType<Campaign> = [
    {
      title: 'Chiến dịch',
      dataIndex: 'title',
      key: 'title',
      render: (_, record) => (
        <Space size={12} align="center">
          <Avatar
            shape="square"
            size={42}
            src={record.thumbnail}
            style={{ borderRadius: 8, flexShrink: 0 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: 13.5,
                color: '#0F172A',
                lineHeight: 1.3,
                marginBottom: 3,
              }}
            >
              {record.title}
            </span>
            <Space size={6} wrap>
              {record.tags.map((tag) => (
                <Tag
                  key={tag}
                  bordered={false}
                  style={{
                    background: '#F1F5F9',
                    color: '#64748B',
                    fontSize: 10.5,
                    borderRadius: 4,
                    padding: '1px 6px',
                    margin: 0,
                  }}
                >
                  {tag}
                </Tag>
              ))}
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (_, record) => {
        let color = 'success';
        let bg = '#ECFDF5';
        let text = '#059669';

        if (record.status === 'draft') {
          color = 'processing';
          bg = '#EEF2FF';
          text = '#4F46E5';
        } else if (record.status === 'completed') {
          color = 'default';
          bg = '#F1F5F9';
          text = '#64748B';
        }

        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: bg,
              color: text,
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: text,
              }}
            />
            {record.statusText}
          </span>
        );
      },
    },
    {
      title: 'Số Creator',
      dataIndex: 'creatorsCount',
      key: 'creatorsCount',
      width: 100,
      render: (val) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>{val}</div>
          <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Creator</div>
        </div>
      ),
    },
    {
      title: 'Tiếp cận',
      dataIndex: 'reach',
      key: 'reach',
      width: 100,
      render: (val) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>{val}</div>
          <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Tiếp cận</div>
        </div>
      ),
    },
    {
      title: 'Tương tác',
      dataIndex: 'engagement',
      key: 'engagement',
      width: 100,
      render: (val) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>{val}</div>
          <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Tương tác</div>
        </div>
      ),
    },
    {
      title: 'Đã chi',
      dataIndex: 'spent',
      key: 'spent',
      width: 100,
      render: (val) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>{val}</div>
          <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Đã chi</div>
        </div>
      ),
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (val) => (
        <span style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
          {val}
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 44,
      render: () => (
        <Dropdown menu={{ items: actionItems }} trigger={['click']} placement="bottomRight">
          <Button
            type="text"
            size="small"
            icon={<EllipsisOutlined style={{ fontSize: 16, color: '#94A3B8' }} />}
          />
        </Dropdown>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: 'Tất cả (8)' },
    { key: 'running', label: 'Đang chạy (5)' },
    { key: 'draft', label: 'Bản nháp (2)' },
    { key: 'completed', label: 'Hoàn thành (1)' },
  ];

  return (
    <Card
      bordered
      style={{
        borderRadius: 14,
        borderColor: '#EEF0F6',
      }}
      bodyStyle={{ padding: '8px 20px 20px 20px' }}
    >
      {/* Top Controls: Tabs + Search & Sort */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          borderBottom: '1px solid #EEF0F6',
          marginBottom: 12,
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="custom-campaign-tabs"
        />

        {/* Search & Sort */}
        <Space size={10} wrap>
          <Input
            placeholder="Tìm kiếm chiến dịch..."
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 190, borderRadius: 8, height: 32, fontSize: 12.5 }}
          />

          <Select
            value={sortBy}
            onChange={setSortBy}
            size="small"
            style={{ width: 140, height: 32 }}
            options={[
              { value: 'latest', label: 'Sắp xếp: Mới nhất' },
              { value: 'reach', label: 'Tiếp cận cao nhất' },
              { value: 'cost', label: 'Chi phí cao nhất' },
            ]}
          />
        </Space>
      </div>

      {/* Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        pagination={false}
        className="campaign-table"
        scroll={{ x: 800 }}
      />

      {/* Footer: Count & Pagination */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          paddingTop: 16,
          borderTop: '1px solid #F1F5F9',
          marginTop: 8,
        }}
      >
        <span style={{ fontSize: 12.5, color: '#64748B' }}>
          Hiển thị 1 đến 6 trên 12 chiến dịch
        </span>

        <Pagination
          current={currentPage}
          onChange={setCurrentPage}
          total={12}
          pageSize={6}
          size="small"
          showSizeChanger={false}
        />
      </div>
    </Card>
  );
}
