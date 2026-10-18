import React, { useState } from 'react';
import { Card, Table, Tag, Input, Select, Button, Row, Col, Space, Typography, Modal, Form, message } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { MOCK_JOBS, type CollectionJob, type JobStatus } from '../../../mock/adminData';
import JobDetailModal from './components/JobDetailModal';
import RetryCancelActions from './components/RetryCancelActions';

const { Text } = Typography;

const STATUS_MAP: Record<JobStatus, { color: string; label: string; icon: React.ReactNode }> = {
  running:   { color: 'processing', label: 'Đang chạy', icon: <SyncOutlined spin /> },
  done:      { color: 'success',    label: 'Thành công', icon: <CheckCircleOutlined /> },
  failed:    { color: 'error',      label: 'Thất bại',   icon: <CloseCircleOutlined /> },
  cancelled: { color: 'default',    label: 'Đã hủy',     icon: <StopOutlined /> },
  pending:   { color: 'warning',    label: 'Chờ xử lý',  icon: <ClockCircleOutlined /> },
};

export default function CollectionJobsPage() {
  const [jobs, setJobs] = useState<CollectionJob[]>(MOCK_JOBS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<CollectionJob | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Metrics
  const runningCount = jobs.filter(j => j.status === 'running').length;
  const doneCount = jobs.filter(j => j.status === 'done').length;
  const failedCount = jobs.filter(j => j.status === 'failed').length;
  const total = jobs.length;
  const successRate = total > 0 ? Math.round((doneCount / (doneCount + failedCount || 1)) * 100) : 100;

  const handleRetry = (job: CollectionJob) => {
    setJobs(prev =>
      prev.map(j =>
        j.id === job.id
          ? {
              ...j,
              status: 'running',
              startedAt: 'Vừa xong',
              duration: '0s',
              errorMsg: undefined,
              logs: [`[${new Date().toLocaleTimeString()}] Retrying job #${job.id}...`, '[...] Connecting to data provider...'],
            }
          : j
      )
    );
    setDetailModalOpen(false);
    message.success(`Đã khởi chạy lại Job #${job.id}!`);
  };

  const handleCancel = (job: CollectionJob) => {
    setJobs(prev =>
      prev.map(j =>
        j.id === job.id
          ? {
              ...j,
              status: 'cancelled',
              logs: [...j.logs, `[${new Date().toLocaleTimeString()}] Job cancelled by admin.`],
            }
          : j
      )
    );
    setDetailModalOpen(false);
    message.info(`Đã hủy Job #${job.id}.`);
  };

  const handleCreateJob = (values: { type: string; source: string; target: string }) => {
    const newJob: CollectionJob = {
      id: `J-${Math.floor(4830 + Math.random() * 100)}`,
      type: values.type,
      source: values.source,
      target: values.target,
      status: 'running',
      startedAt: 'Vừa xong',
      duration: '10s',
      logs: [
        `[${new Date().toLocaleTimeString()}] Job manual trigger initiated.`,
        `[...] Target: ${values.target}`,
      ],
    };
    setJobs(prev => [newJob, ...prev]);
    setCreateModalOpen(false);
    form.resetFields();
    message.success(`Đã kích hoạt tiến trình thu thập #${newJob.id}!`);
  };

  const filteredJobs = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchQ = !q || j.id.toLowerCase().includes(q) || j.type.toLowerCase().includes(q) || j.target.toLowerCase().includes(q);
    const matchS = statusFilter === 'all' || j.status === statusFilter;
    const matchSrc = sourceFilter === 'all' || j.source.toLowerCase() === sourceFilter.toLowerCase();
    return matchQ && matchS && matchSrc;
  });

  const columns: TableColumnsType<CollectionJob> = [
    {
      title: 'Mã Job',
      dataIndex: 'id',
      key: 'id',
      render: (id: string, r) => (
        <a
          onClick={() => {
            setSelectedJob(r);
            setDetailModalOpen(true);
          }}
          style={{ fontWeight: 700, color: '#6366F1' }}
        >
          #{id}
        </a>
      ),
    },
    {
      title: 'Loại công việc / Đối tượng',
      key: 'type',
      render: (_, r) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0F172A' }}>{r.type}</span>
          <div style={{ fontSize: 11, color: '#64748B' }}>Target: {r.target}</div>
        </div>
      ),
    },
    {
      title: 'Nguồn',
      dataIndex: 'source',
      key: 'source',
      render: (src: string) => (
        <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 600 }}>
          {src}
        </Tag>
      ),
    },
    {
      title: 'Thời gian bắt đầu / Thời lượng',
      key: 'time',
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          <div>{r.startedAt}</div>
          <span style={{ color: '#94A3B8' }}>{r.duration}</span>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, r) => {
        const st = STATUS_MAP[r.status] || STATUS_MAP.pending;
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
        <RetryCancelActions
          job={r}
          onViewDetail={(job) => {
            setSelectedJob(job);
            setDetailModalOpen(true);
          }}
          onRetry={handleRetry}
          onCancel={handleCancel}
        />
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 20 }}>Collection Background Jobs</div>
          <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>
            Giám sát các tác vụ thu thập, cào dữ liệu và đồng bộ chỉ số Creator theo thời gian thực
          </div>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
          }}
        >
          Kích hoạt Job mới
        </Button>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>ĐANG CHẠY (RUNNING)</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#3B82F6', marginTop: 4 }}>
              {runningCount}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Tiến trình nền song song</div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>HOÀN THÀNH (DONE)</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 4 }}>
              {doneCount}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Đã kết thúc thành công</div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>THẤT BẠI (FAILED)</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#EF4444', marginTop: 4 }}>
              {failedCount}
            </div>
            <div style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>Cần can thiệp hoặc retry</div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>TỶ LỆ THÀNH CÔNG</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#6366F1', marginTop: 4 }}>
              {successRate}%
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Trên tổng số job đã chạy</div>
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
            placeholder="Tìm theo ID, loại job, đối tượng..."
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
            <Select.Option value="running">Đang chạy</Select.Option>
            <Select.Option value="done">Thành công</Select.Option>
            <Select.Option value="failed">Thất bại</Select.Option>
            <Select.Option value="cancelled">Đã hủy</Select.Option>
          </Select>

          <Select
            value={sourceFilter}
            onChange={setSourceFilter}
            style={{ width: 150 }}
          >
            <Select.Option value="all">Tất cả nguồn</Select.Option>
            <Select.Option value="tiktok">TikTok</Select.Option>
            <Select.Option value="instagram">Instagram</Select.Option>
            <Select.Option value="youtube">YouTube</Select.Option>
          </Select>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredJobs}
          rowKey="id"
          pagination={{ pageSize: 8, showTotal: (t) => `Tổng số ${t} jobs` }}
          size="middle"
        />
      </Card>

      {/* Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onRetry={handleRetry}
        onCancel={handleCancel}
      />

      {/* Create Job Modal */}
      <Modal
        title="Kích hoạt tác vụ thu thập mới"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => form.submit()}
        okText="Chạy ngay"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateJob} style={{ marginTop: 16 }}>
          <Form.Item
            name="type"
            label="Loại tác vụ"
            rules={[{ required: true, message: 'Vui lòng chọn loại tác vụ' }]}
          >
            <Select placeholder="Chọn loại tác vụ">
              <Select.Option value="Profile Sync">Profile Sync (Đồng bộ hồ sơ)</Select.Option>
              <Select.Option value="Engagement Crawl">Engagement Crawl (Cào tương tác)</Select.Option>
              <Select.Option value="New Discovery">New Discovery (Khám phá creator mới)</Select.Option>
              <Select.Option value="Video Stats">Video Stats (Chỉ số clip/reels)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="source"
            label="Nền tảng mạng xã hội"
            rules={[{ required: true, message: 'Vui lòng chọn nền tảng' }]}
          >
            <Select placeholder="Chọn nền tảng">
              <Select.Option value="TikTok">TikTok</Select.Option>
              <Select.Option value="Instagram">Instagram</Select.Option>
              <Select.Option value="YouTube">YouTube</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="target"
            label="Đối tượng thu thập"
            rules={[{ required: true, message: 'Vui lòng nhập đối tượng' }]}
            initialValue="All active creators"
          >
            <Input placeholder="VD: All active creators, Category: Làm đẹp, @linh.beauty..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
