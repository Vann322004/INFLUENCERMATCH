import React, { useState } from 'react';
import { Card, Button, Space, Tag, Modal, Form, Tabs, Select, Input, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import AutoHunterTab from './components/discovery/AutoHunterTab';
import LiveCrawlTab from './components/LiveCrawlTab';
import JobsMonitorTab from './components/jobs/JobsMonitorTab';
import { crawlerService } from '../../../services/api/crawlerService';
import type { CrawlPlatform } from '../../../types/api/crawler.types';

export default function CollectionJobsPage() {
  const [activeTab, setActiveTab] = useState<'hunter' | 'live' | 'jobs'>('hunter');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [form] = Form.useForm();

  const handleCreateJob = async (values: { source: string; target: string; forceDeep: boolean }) => {
    try {
      const res = await crawlerService.enqueueCandidate(
        values.source as CrawlPlatform,
        values.target,
        values.forceDeep
      );
      setCreateModalOpen(false);
      form.resetFields();
      setActiveTab('jobs');
      message.success(res.message || `Đã đưa @${values.target} vào hàng đợi xử lý!`);
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi gửi yêu cầu vào hàng đợi');
    }
  };

  const handleTriggerDbRefresh = async () => {
    setTriggerLoading(true);
    message.loading({ content: 'Đang gửi lệnh làm mới dữ liệu KOC...', key: 'db_refresh' });
    try {
      const res = await crawlerService.triggerDbRefresh(25);
      message.success({ content: res.message || 'Đã đưa 25 KOC vào hàng đợi làm mới!', key: 'db_refresh' });
      setActiveTab('jobs');
    } catch (err: any) {
      message.error({ content: err.message || 'Lỗi khi gửi yêu cầu làm mới dữ liệu', key: 'db_refresh' });
    } finally {
      setTriggerLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Trung tâm Thu thập & Cào Dữ liệu</span>
            <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700 }}>
              Săn tìm KOC thông minh
            </Tag>
          </div>
          <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
            Tự động săn lùng & phát hiện KOC mới theo chủ đề/hashtag, cào dữ liệu trực tiếp và giám sát các tác vụ nền.
          </div>
        </div>

        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleTriggerDbRefresh}
            loading={triggerLoading}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            Làm mới dữ liệu KOC
          </Button>

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
            Thêm vào hàng đợi cào
          </Button>
        </Space>
      </div>

      {/* Tabs */}
      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as any)}
          size="middle"
          tabBarStyle={{
            padding: '0 20px',
            marginBottom: 0,
            borderBottom: '1px solid #EEF0F6',
            background: '#FAFAFD',
          }}
          items={[
            {
              key: 'hunter',
              label: <span style={{ fontWeight: 700, fontSize: 14 }}>Săn & Thu thập KOC</span>,
              children: (
                <div style={{ padding: '24px 24px 32px' }}>
                  <AutoHunterTab />
                </div>
              ),
            },
            {
              key: 'live',
              label: <span style={{ fontWeight: 700, fontSize: 14 }}>Cào trực tiếp KOC</span>,
              children: (
                <div style={{ padding: '24px 24px 32px' }}>
                  <LiveCrawlTab />
                </div>
              ),
            },
            {
              key: 'jobs',
              label: <span style={{ fontWeight: 700, fontSize: 14 }}>Tiến trình thu thập</span>,
              children: (
                <div style={{ padding: '20px 20px 24px' }}>
                  <JobsMonitorTab />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal thêm vào hàng đợi */}
      <Modal
        title="Đưa nhà sáng tạo vào hàng đợi xử lý nền"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => form.submit()}
        okText="Gửi vào hàng đợi"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateJob} style={{ marginTop: 16 }}>
          <Form.Item
            name="source"
            label="Nền tảng mạng xã hội"
            rules={[{ required: true, message: 'Vui lòng chọn nền tảng' }]}
            initialValue="TIKTOK"
          >
            <Select placeholder="Chọn nền tảng">
              <Select.Option value="TIKTOK">TikTok</Select.Option>
              <Select.Option value="INSTAGRAM">Instagram</Select.Option>
              <Select.Option value="FACEBOOK">Facebook</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="target"
            label="Tên tài khoản / Đường dẫn KOC"
            rules={[{ required: true, message: 'Vui lòng nhập tên tài khoản' }]}
          >
            <Input prefix="@" placeholder="VD: linh.beauty hoặc schannelvn" />
          </Form.Item>

          <Form.Item
            name="forceDeep"
            label="Chế độ xử lý"
            initialValue={false}
          >
            <Select>
              <Select.Option value={false}>Sàng lọc sơ bộ tự động (Preflight)</Select.Option>
              <Select.Option value={true}>Cào sâu toàn diện ngay</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
