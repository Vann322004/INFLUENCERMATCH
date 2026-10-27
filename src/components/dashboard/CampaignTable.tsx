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
  Modal,
  Form,
  InputNumber,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  SearchOutlined,
  EllipsisOutlined,
  EyeOutlined,
  EditOutlined,
  CompassOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { campaignService } from '../../services/api/campaignService';
import { getErrorMessage } from '../../services/apiClient';
import type { CampaignResponse, CampaignStatus, CampaignObjective, CampaignPlatform } from '../../types/api/campaign.types';
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
          let deletedIds: string[] = [];
          try {
            deletedIds = JSON.parse(localStorage.getItem('IM_DELETED_CAMPAIGN_IDS') || '[]');
          } catch {}

          const activeList = data.filter(
            (c) => c.status !== 'ARCHIVED' && !deletedIds.includes(c.id)
          );
          setCampaigns(activeList.map(mapApiCampaignToUi));
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

  // Edit & Delete State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    budget: number;
    status: CampaignStatus;
    objective: CampaignObjective;
    platforms: CampaignPlatform[];
  }>({
    name: '',
    budget: 25000000,
    status: 'ACTIVE',
    objective: 'AWARENESS',
    platforms: ['TIKTOK', 'INSTAGRAM'],
  });

  const handleOpenEdit = (record: Campaign) => {
    setEditingCampaign(record);
    const revStatusMap: Record<string, CampaignStatus> = {
      running: 'ACTIVE',
      draft: 'DRAFT',
      completed: 'COMPLETED',
    };

    const revObjectiveMap: Record<string, CampaignObjective> = {
      'Tăng doanh số': 'CONVERSION',
      'Độ nhận diện': 'AWARENESS',
      'Tương tác': 'ENGAGEMENT',
      'Lưu lượng truy cập': 'TRAFFIC',
      'CONVERSION': 'CONVERSION',
      'AWARENESS': 'AWARENESS',
      'ENGAGEMENT': 'ENGAGEMENT',
      'TRAFFIC': 'TRAFFIC',
    };

    const primaryTag = record.tags[0] || 'AWARENESS';
    const parsedObj = revObjectiveMap[primaryTag] || 'AWARENESS';
    const parsedPlatforms = record.tags
      .slice(1)
      .map((t) => t.toUpperCase())
      .filter((p) => ['TIKTOK', 'INSTAGRAM', 'FACEBOOK'].includes(p)) as CampaignPlatform[];

    setEditForm({
      name: record.title,
      budget: record.spentNumber || 25000000,
      status: revStatusMap[record.status] || 'ACTIVE',
      objective: parsedObj,
      platforms: parsedPlatforms.length > 0 ? parsedPlatforms : ['TIKTOK', 'INSTAGRAM'],
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCampaign) return;
    if (!editForm.name.trim()) {
      message.warning('Vui lòng nhập tên chiến dịch!');
      return;
    }

    try {
      setSavingEdit(true);
      message.loading({ content: 'Đang lưu cập nhật chiến dịch...', key: 'edit_camp' });

      await campaignService.updateCampaign(editingCampaign.id, {
        name: editForm.name.trim(),
        budgetMax: editForm.budget,
        objective: editForm.objective,
        platforms: editForm.platforms,
      });

      if (editForm.status) {
        await campaignService.updateStatus(editingCampaign.id, editForm.status).catch(() => {});
      }

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

      const budgetNum = editForm.budget || 0;
      const budgetText = budgetNum > 0 ? `${(budgetNum / 1_000_000).toFixed(0)}M ₫` : 'Chưa định mức';

      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.id === editingCampaign.id) {
            return {
              ...c,
              title: editForm.name.trim(),
              status: statusMap[editForm.status] || c.status,
              statusText: statusTextMap[editForm.status] || c.statusText,
              spent: budgetText,
              spentNumber: budgetNum,
              tags: [editForm.objective, ...editForm.platforms.map((p) => p.toLowerCase())],
            };
          }
          return c;
        })
      );

      // Cập nhật localStorage nếu là chiến dịch đang chọn
      try {
        const stored = localStorage.getItem('IM_MATCHED_CAMPAIGN');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.id === editingCampaign.id) {
            localStorage.setItem(
              'IM_MATCHED_CAMPAIGN',
              JSON.stringify({
                ...parsed,
                name: editForm.name.trim(),
                budget: budgetText,
              })
            );
          }
        }
      } catch {}

      message.success({ content: '🎉 Đã cập nhật chiến dịch thành công!', key: 'edit_camp' });
      setEditModalVisible(false);
      setEditingCampaign(null);
    } catch (err) {
      message.error({ content: getErrorMessage(err, 'Không thể cập nhật chiến dịch.'), key: 'edit_camp' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteCampaign = (record: Campaign) => {
    Modal.confirm({
      title: 'Xóa chiến dịch',
      icon: <ExclamationCircleOutlined style={{ color: '#EF4444' }} />,
      content: (
        <div>
          Bạn có chắc chắn muốn xóa chiến dịch <strong style={{ color: '#0F172A' }}>"{record.title}"</strong> không?
          <div style={{ color: '#64748B', fontSize: 12.5, marginTop: 6 }}>
            Thao tác này sẽ gỡ bỏ chiến dịch khỏi danh sách và cập nhật ngay lập tức.
          </div>
        </div>
      ),
      okText: 'Xóa chiến dịch',
      okType: 'danger',
      cancelText: 'Hủy',
      maskClosable: true,
      async onOk() {
        try {
          message.loading({ content: `Đang xóa chiến dịch "${record.title}"...`, key: 'del_camp' });
          await campaignService.deleteCampaign(record.id);

          setCampaigns((prev) => prev.filter((c) => c.id !== record.id));

          try {
            const stored = localStorage.getItem('IM_MATCHED_CAMPAIGN');
            if (stored && JSON.parse(stored)?.id === record.id) {
              localStorage.removeItem('IM_MATCHED_CAMPAIGN');
              localStorage.removeItem('IM_SELECTED_CAMPAIGN_ID');
            }
          } catch {}

          message.success({ content: `🗑️ Đã xóa chiến dịch "${record.title}" thành công!`, key: 'del_camp' });
        } catch (err) {
          message.error({ content: getErrorMessage(err, 'Không thể xóa chiến dịch.'), key: 'del_camp' });
        }
      },
    });
  };

  const handleOpenDetail = (record: Campaign) => {
    sessionStorage.setItem('current_campaign_id', record.id);
    try {
      sessionStorage.setItem('current_campaign_data', JSON.stringify({
        id: record.id,
        name: record.title,
        budgetFormatted: record.spent,
        budgetRaw: record.spentNumber,
        niches: record.tags,
        dateRange: record.date,
        thumbnail: record.thumbnail,
        status: record.status === 'completed' ? 'COMPLETED' : (record.status === 'draft' ? 'DRAFT' : 'ACTIVE'),
        statusText: record.statusText,
        creatorsCount: record.creatorsCount,
      }));
    } catch {}
    navigate('/campaigns/detail', { state: { id: record.id, item: record } });
  };

  const handleActionMenu = (key: string, record: Campaign) => {
    if (key === 'view') {
      handleOpenDetail(record);
    } else if (key === 'edit') {
      handleOpenEdit(record);
    } else if (key === 'discovery') {
      sessionStorage.setItem('current_campaign_id', record.id);
      localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', record.id);
      navigate(`/discovery?campaignId=${record.id}`, { state: { campaignId: record.id } });
    } else if (key === 'delete') {
      handleDeleteCampaign(record);
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
          onClick={() => handleOpenDetail(record)}
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
      render: (_, record) => {
        const actionMenuItems: MenuProps['items'] = [
          { key: 'view', icon: <EyeOutlined />, label: 'Xem chi tiết' },
          { key: 'edit', icon: <EditOutlined />, label: 'Chỉnh sửa' },
          { key: 'discovery', icon: <CompassOutlined />, label: 'Khám phá KOC AI' },
          { type: 'divider' },
          { key: 'delete', icon: <DeleteOutlined />, danger: true, label: 'Xóa chiến dịch' },
        ];

        return (
          <Dropdown
            menu={{
              items: actionMenuItems,
              onClick: ({ key }) => handleActionMenu(key, record),
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              size="small"
              icon={<EllipsisOutlined style={{ fontSize: 16, color: '#94A3B8' }} />}
            />
          </Dropdown>
        );
      },
    },
  ];

  const allCount = campaigns.length;
  const runningCount = campaigns.filter((c) => c.status === 'running').length;
  const draftCount = campaigns.filter((c) => c.status === 'draft').length;
  const completedCount = campaigns.filter((c) => c.status === 'completed').length;

  const tabItems = [
    { key: 'all', label: `Tất cả (${allCount})` },
    { key: 'running', label: `Đang chạy (${runningCount})` },
    { key: 'draft', label: `Bản nháp (${draftCount})` },
    { key: 'completed', label: `Hoàn thành (${completedCount})` },
  ];

  const pageSize = 6;
  const startIndex = filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, filteredData.length);
  const paginatedData = useMemo(() => {
    return filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredData, currentPage]);

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
          onChange={(key) => {
            setActiveTab(key);
            setCurrentPage(1);
          }}
          items={tabItems}
          className="custom-campaign-tabs"
        />

        {/* Search & Sort */}
        <Space size={10} wrap>
          <Input
            placeholder="Tìm kiếm chiến dịch..."
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrentPage(1);
            }}
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
        dataSource={paginatedData}
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
          {filteredData.length > 0
            ? `Hiển thị ${startIndex} đến ${endIndex} trên ${filteredData.length} chiến dịch`
            : 'Chưa có chiến dịch nào'}
        </span>

        {filteredData.length > pageSize && (
          <Pagination
            current={currentPage}
            onChange={setCurrentPage}
            total={filteredData.length}
            pageSize={pageSize}
            size="small"
            showSizeChanger={false}
          />
        )}
      </div>

      {/* Edit Campaign Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700 }}>
            <EditOutlined style={{ color: '#2563EB' }} />
            <span>Chỉnh sửa thông tin chiến dịch</span>
          </div>
        }
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingCampaign(null);
        }}
        onOk={handleSaveEdit}
        confirmLoading={savingEdit}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        width={560}
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 12 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#334155' }}>
              Tên chiến dịch <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <Input
              size="large"
              placeholder="Nhập tên chiến dịch..."
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              style={{ borderRadius: 8 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#334155' }}>
                Trạng thái
              </label>
              <Select
                size="large"
                style={{ width: '100%' }}
                value={editForm.status}
                onChange={(val) => setEditForm((prev) => ({ ...prev, status: val }))}
                options={[
                  { value: 'ACTIVE', label: '🟢 Đang chạy (Active)' },
                  { value: 'READY_FOR_DISCOVERY', label: '⚡ Sẵn sàng AI' },
                  { value: 'DRAFT', label: '📝 Bản nháp (Draft)' },
                  { value: 'COMPLETED', label: '🏁 Đã hoàn thành' },
                  { value: 'ARCHIVED', label: '📦 Lưu trữ' },
                ]}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#334155' }}>
                Mục tiêu chính
              </label>
              <Select
                size="large"
                style={{ width: '100%' }}
                value={editForm.objective}
                onChange={(val) => setEditForm((prev) => ({ ...prev, objective: val }))}
                options={[
                  { value: 'AWARENESS', label: '📢 Tăng nhận diện' },
                  { value: 'CONVERSION', label: '🛒 Thúc đẩy doanh số' },
                  { value: 'ENGAGEMENT', label: '💬 Tương tác cộng đồng' },
                  { value: 'TRAFFIC', label: '🚀 Kéo Traffic website' },
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#334155' }}>
                Ngân sách dự kiến (VND)
              </label>
              <InputNumber
                size="large"
                style={{ width: '100%', borderRadius: 8 }}
                value={editForm.budget}
                min={1000000}
                step={1000000}
                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, '') || 0)}
                onChange={(val) => setEditForm((prev) => ({ ...prev, budget: Number(val) || 0 }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#334155' }}>
                Nền tảng ưu tiên
              </label>
              <Select
                mode="multiple"
                size="large"
                style={{ width: '100%' }}
                value={editForm.platforms}
                onChange={(val) => setEditForm((prev) => ({ ...prev, platforms: val }))}
                options={[
                  { value: 'TIKTOK', label: 'TikTok' },
                  { value: 'INSTAGRAM', label: 'Instagram' },
                  { value: 'FACEBOOK', label: 'Facebook' },
                ]}
              />
            </div>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
