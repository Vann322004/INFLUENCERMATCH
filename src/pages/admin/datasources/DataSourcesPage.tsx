import React, { useState } from 'react';
import { Card, Tabs, Row, Col, Button, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import {
  ApiOutlined,
  ThunderboltOutlined,
  SortAscendingOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { MOCK_CONNECTORS, type DataConnector } from '../../../mock/adminData';
import ConnectorStatusCard from './components/ConnectorStatusCard';
import SyncRateLimitPanel from './components/SyncRateLimitPanel';
import SourcePriorityPanel from './components/SourcePriorityPanel';

export default function DataSourcesPage() {
  const [connectors, setConnectors] = useState<DataConnector[]>(MOCK_CONNECTORS);
  const [activeTab, setActiveTab] = useState('connectors');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleUpdateConnector = (updated: DataConnector) => {
    setConnectors(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  };

  const handleSavePriority = (reordered: DataConnector[]) => {
    setConnectors(reordered);
  };

  const handleCreateConnector = (values: { name: string; platform: string; rateLimit: number }) => {
    const newConnector: DataConnector = {
      id: `conn_${Date.now()}`,
      name: values.name,
      platform: values.platform,
      status: 'active',
      lastSync: 'Chưa đồng bộ',
      successCount: 0,
      failCount: 0,
      rateLimit: values.rateLimit || 60,
      priority: connectors.length + 1,
    };
    setConnectors(prev => [...prev, newConnector]);
    setAddModalOpen(false);
    form.resetFields();
    message.success(`Đã thêm connector ${values.name} thành công!`);
  };

  const activeCount = connectors.filter(c => c.status === 'active').length;

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 20 }}>Data Sources & Connectors</div>
          <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>
            Quản lý tích hợp API, tỷ lệ đồng bộ dữ liệu và điều tiết lưu lượng từ các mạng xã hội
          </div>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddModalOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
          }}
        >
          Thêm Connector mới
        </Button>
      </div>

      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="line"
          tabBarStyle={{ padding: '0 20px', marginBottom: 0, borderBottom: '1px solid #EEF0F6' }}
          items={[
            {
              key: 'connectors',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <ApiOutlined /> Danh sách kết nối ({activeCount}/{connectors.length} hoạt động)
                </span>
              ),
              children: (
                <div style={{ padding: '24px 20px' }}>
                  <Row gutter={[16, 16]}>
                    {connectors.map(connector => (
                      <Col xs={24} md={12} lg={6} key={connector.id}>
                        <ConnectorStatusCard
                          connector={connector}
                          onUpdate={handleUpdateConnector}
                        />
                      </Col>
                    ))}
                  </Row>
                </div>
              ),
            },
            {
              key: 'rate-limit',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <ThunderboltOutlined /> Quản lý Tốc độ & Giới hạn
                </span>
              ),
              children: (
                <div style={{ padding: '24px 20px' }}>
                  <SyncRateLimitPanel
                    connectors={connectors}
                    onUpdateConnector={handleUpdateConnector}
                  />
                </div>
              ),
            },
            {
              key: 'priority',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <SortAscendingOutlined /> Thứ tự ưu tiên nguồn
                </span>
              ),
              children: (
                <div style={{ padding: '24px 20px' }}>
                  <SourcePriorityPanel
                    connectors={connectors}
                    onSavePriority={handleSavePriority}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Add Connector Modal */}
      <Modal
        title="Thêm Connector mới"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onOk={() => form.submit()}
        okText="Thêm connector"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateConnector} style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Tên Connector"
            rules={[{ required: true, message: 'Vui lòng nhập tên connector' }]}
          >
            <Input placeholder="VD: Facebook Graph API v19" />
          </Form.Item>

          <Form.Item
            name="platform"
            label="Nền tảng mạng xã hội"
            rules={[{ required: true, message: 'Vui lòng chọn nền tảng' }]}
          >
            <Select placeholder="Chọn nền tảng">
              <Select.Option value="TikTok">TikTok</Select.Option>
              <Select.Option value="Instagram">Instagram</Select.Option>
              <Select.Option value="YouTube">YouTube</Select.Option>
              <Select.Option value="Twitter/X">Twitter/X</Select.Option>
              <Select.Option value="Facebook">Facebook</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="rateLimit"
            label="Rate-Limit mặc định (req/phút)"
            initialValue={60}
          >
            <InputNumber min={10} max={1000} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
