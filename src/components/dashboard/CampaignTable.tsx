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
import { useNavigate } from 'react-router-dom';
import { campaignService } from '../../services/api/campaignService';
import type { CampaignResponse } from '../../types/api/campaign.types';
import type { Campaign } from '../../data/mockData';

export const mapApiCampaignToUi = (c: CampaignResponse): Campaign => {
  const statusMap: Record<string, 'running' | 'draft' | 'completed'> = {
    ACTIVE: 'running',
    READY_FOR_DISCOVERY: 'running',
    DRAFT: 'draft',
    COMPLETED: 'completed',
    ARCHIVED: 'completed',
  };
  const statusTextMap: Record<string, string> = {
    ACTIVE: 'Đang chạy',
    READY_FOR_DISCOVERY: 'Sẵn sàng AI',
    DRAFT: 'Bản nháp',
    COMPLETED: 'Đã hoàn thành',
    ARCHIVED: 'Đã lưu trữ',
  };

  const budgetNum = c.budgetMax || c.budgetMin || 0;
  const budgetText = budgetNum > 0 ? `${(budgetNum / 1_000_000).toFixed(0)}M ₫` : 'Chưa định mức';

  return {
    id: c.id,
    title: c.name,
    tags: [
      c.objective || 'Mục tiêu chung',
      ...(c.platforms || []).map((p) => p.toLowerCase()),
    ],
    thumbnail: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&auto=format&fit=crop&q=80',
    status: statusMap[c.status] || 'draft',
    statusText: statusTextMap[c.status] || c.status,
    creatorsCount: 0,
    reach: '0',
    reachNumber: 0,
    engagement: '0%',
    engagementNumber: 0,
    spent: budgetText,
    spentNumber: budgetNum,
    date: c.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : 'Mới tạo',
  };
};

export default function CampaignTable() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [currentPage, setCurrentPage] = useState<number>(1);

  React.useEffect(() => {
    let isMounted = true;
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const data = await campaignService.getCampaigns(0, 50);
        if (isMounted && Array.isArray(data)) {
          setCampaigns(data.map(mapApiCampaignToUi));
        }
      } catch (err) {
        console.error('Lỗi khi tải chiến dịch:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCampaigns();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter & Sort
  const filteredData = useMemo(() => {
    let list = [...campaigns];

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
  }, [campaigns, activeTab, searchText, sortBy]);

  const actionItems: MenuProps['items'] = [
    { key: 'view', icon: <EyeOutlined />, label: 'Xem chi tiết' },
    { key: 'edit', icon: <EditOutlined />, label: 'Chỉnh sửa' },
    { type: 'divider' },
    { key: 'delete', icon: <DeleteOutlined />, danger: true, label: 'Xóa chiến dịch' },
  ];

  const handleActionMenu = (key: string, record?: Campaign) => {
    if (key === 'view' && record) {
      navigate(`/campaigns/${record.id}`);
    } else if (key === 'edit') {
      navigate('/campaigns/create');
    }
  };

  const columns: ColumnsType<Campaign> = [
    {
      title: 'Chiến dịch',
      dataIndex: 'title',
      key: 'title',
      render: (_, record) => (
        <Space
          size={12}
          align="center"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/campaigns/${record.id}`)}
        >
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
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#5B5BF0')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#0F172A')}
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
        <Dropdown
          menu={{ items: actionItems, onClick: ({ key }) => handleActionMenu(key) }}
          trigger={['click']}
          placement="bottomRight"
        >
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
        loading={loading}
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
