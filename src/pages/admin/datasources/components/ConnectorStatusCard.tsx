import React, { useState } from 'react';
import { Card, Tag, Switch, Button, Progress, Modal, Form, Input, InputNumber, Space, Typography, Tooltip, message } from 'antd';
import {
  SyncOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PauseCircleOutlined,
  InstagramOutlined,
  YoutubeOutlined,
  TwitterOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import type { DataConnector, ConnectorStatus } from '../../../../mock/adminData';

const { Text } = Typography;

interface Props {
  connector: DataConnector;
  onUpdate: (updated: DataConnector) => void;
}

const PLATFORM_ICONS: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  TikTok: {
    icon: <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: -0.5 }}>TT</span>,
    bg: '#000000',
    color: '#ffffff',
  },
  Instagram: {
    icon: <InstagramOutlined style={{ fontSize: 18 }} />,
    bg: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)',
    color: '#ffffff',
  },
  YouTube: {
    icon: <YoutubeOutlined style={{ fontSize: 18 }} />,
    bg: '#FF0000',
    color: '#ffffff',
  },
  'Twitter/X': {
    icon: <TwitterOutlined style={{ fontSize: 18 }} />,
    bg: '#0F1419',
    color: '#ffffff',
  },
};

const STATUS_CONFIG: Record<ConnectorStatus, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Hoạt động', color: 'success', icon: <CheckCircleOutlined /> },
  paused: { label: 'Tạm dừng', color: 'warning', icon: <PauseCircleOutlined /> },
  error:  { label: 'Lỗi kết nối', color: 'error',   icon: <CloseCircleOutlined /> },
};

export default function ConnectorStatusCard({ connector, onUpdate }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const totalReq = connector.successCount + connector.failCount;
  const successRate = totalReq > 0 ? Math.round((connector.successCount / totalReq) * 100) : 100;

  const platformStyle = PLATFORM_ICONS[connector.platform] || {
    icon: <ApiOutlined style={{ fontSize: 18 }} />,
    bg: '#4F46E5',
    color: '#ffffff',
  };

  const handleToggle = (checked: boolean) => {
    const newStatus: ConnectorStatus = checked ? 'active' : 'paused';
    onUpdate({ ...connector, status: newStatus });
    message.success(`${connector.name} đã chuyển sang trạng thái ${newStatus === 'active' ? 'Hoạt động' : 'Tạm dừng'}`);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    await new Promise(r => setTimeout(r, 900));
    setSyncing(false);
    onUpdate({
      ...connector,
      lastSync: 'Vừa xong',
      successCount: connector.successCount + 12,
    });
    message.success(`Đã đồng bộ thành công dữ liệu từ ${connector.name}!`);
  };

  const handleSaveSettings = (values: { rateLimit: number; apiKey?: string }) => {
    onUpdate({
      ...connector,
      rateLimit: values.rateLimit,
    });
    setModalOpen(false);
    message.success('Đã lưu cấu hình connector thành công!');
  };

  const cfg = STATUS_CONFIG[connector.status] || STATUS_CONFIG.active;

  return (
    <>
      <Card
        bordered={false}
        style={{
          borderRadius: 14,
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          border: '1px solid #EEF0F6',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.2s ease',
        }}
        bodyStyle={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}
      >
        {/* Top: Icon + Title + Switch */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: platformStyle.bg,
                color: platformStyle.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                flexShrink: 0,
              }}
            >
              {platformStyle.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', lineHeight: 1.2 }}>
                {connector.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Tag color={cfg.color} icon={cfg.icon} style={{ borderRadius: 6, margin: 0, fontSize: 11, fontWeight: 600 }}>
                  {cfg.label}
                </Tag>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>Ưu tiên #{connector.priority}</span>
              </div>
            </div>
          </div>

          <Tooltip title={connector.status === 'active' ? 'Tạm dừng connector' : 'Kích hoạt connector'}>
            <Switch
              checked={connector.status === 'active'}
              onChange={handleToggle}
              style={{ background: connector.status === 'active' ? '#6366F1' : undefined }}
            />
          </Tooltip>
        </div>

        {/* Sync Stats */}
        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', border: '1px solid #E2E8F0', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Tỷ lệ thành công</Text>
            <Text style={{ fontSize: 13, fontWeight: 800, color: successRate >= 95 ? '#10B981' : successRate >= 80 ? '#F59E0B' : '#EF4444' }}>
              {successRate}%
            </Text>
          </div>
          <Progress
            percent={successRate}
            size="small"
            strokeColor={successRate >= 95 ? '#10B981' : successRate >= 80 ? '#F59E0B' : '#EF4444'}
            showInfo={false}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: '#64748B' }}>
            <span>Thành công: <strong style={{ color: '#10B981' }}>{connector.successCount.toLocaleString()}</strong></span>
            <span>Thất bại: <strong style={{ color: '#EF4444' }}>{connector.failCount.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Meta Details */}
        <div style={{ fontSize: 12, color: '#64748B', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Lần đồng bộ cuối:</span>
            <strong style={{ color: '#334155' }}>{connector.lastSync}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Giới hạn Rate-limit:</span>
            <strong style={{ color: '#6366F1' }}>{connector.rateLimit} req/min</strong>
          </div>
        </div>

        {/* Actions Footer */}
        <div style={{ marginTop: 'auto', display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
          <Button
            size="small"
            icon={<SyncOutlined spin={syncing} />}
            loading={syncing}
            onClick={handleSyncNow}
            style={{ flex: 1, borderRadius: 8, fontWeight: 600 }}
          >
            Đồng bộ ngay
          </Button>
          <Button
            size="small"
            icon={<SettingOutlined />}
            onClick={() => {
              form.setFieldsValue({ rateLimit: connector.rateLimit });
              setModalOpen(true);
            }}
            style={{ borderRadius: 8 }}
          >
            Cấu hình
          </Button>
        </div>
      </Card>

      {/* Settings Modal */}
      <Modal
        title={`Cấu hình kết nối: ${connector.name}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu thay đổi"
        cancelText="Đóng"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSaveSettings} style={{ marginTop: 16 }}>
          <Form.Item
            name="rateLimit"
            label="Rate Limit (requests / phút)"
            rules={[{ required: true, message: 'Vui lòng nhập giới hạn' }]}
          >
            <InputNumber min={10} max={1000} step={10} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="apiKey" label="API Key / Token (Masked)">
            <Input.Password placeholder="••••••••••••••••••••••••••••••••" />
          </Form.Item>

          <Form.Item name="webhookUrl" label="Webhook URL thông báo lỗi">
            <Input placeholder={`https://api.influencermatch.vn/webhook/${connector.platform.toLowerCase()}`} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
