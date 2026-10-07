import React, { useState } from 'react';
import { Modal, Form, Input, Button, Alert, message, Avatar, Typography } from 'antd';
import { LockOutlined, UnlockOutlined, WarningOutlined } from '@ant-design/icons';
import type { AdminAccount, AccountStatus } from '../../../../mock/adminData';

const { Text } = Typography;

interface LockUnlockModalProps {
  open: boolean;
  account: AdminAccount;
  action: 'lock' | 'unlock' | 'restore';
  onClose: () => void;
  onDone: (id: string, newStatus: AccountStatus) => void;
}

const ACTION_CONFIG = {
  lock: {
    title: 'Khóa tài khoản',
    desc: 'Tài khoản sẽ không thể đăng nhập vào hệ thống.',
    newStatus: 'locked' as AccountStatus,
    buttonLabel: 'Xác nhận khóa',
    buttonColor: '#EF4444',
    icon: <LockOutlined />,
    alertType: 'error' as const,
    alertMsg: 'Hành động này sẽ chặn ngay lập tức quyền truy cập của tài khoản này.',
  },
  unlock: {
    title: 'Mở khóa tài khoản',
    desc: 'Tài khoản sẽ được khôi phục quyền đăng nhập bình thường.',
    newStatus: 'active' as AccountStatus,
    buttonLabel: 'Xác nhận mở khóa',
    buttonColor: '#10B981',
    icon: <UnlockOutlined />,
    alertType: 'success' as const,
    alertMsg: 'Tài khoản sẽ có thể đăng nhập lại ngay sau khi mở khóa.',
  },
  restore: {
    title: 'Khôi phục tài khoản',
    desc: 'Kích hoạt lại tài khoản đang ở trạng thái không hoạt động.',
    newStatus: 'active' as AccountStatus,
    buttonLabel: 'Xác nhận khôi phục',
    buttonColor: '#F59E0B',
    icon: <UnlockOutlined />,
    alertType: 'warning' as const,
    alertMsg: 'Tài khoản sẽ được kích hoạt trở lại với đầy đủ quyền hạn.',
  },
};

export default function LockUnlockModal({ open, account, action, onClose, onDone }: LockUnlockModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const cfg = ACTION_CONFIG[action];

  const handleConfirm = async () => {
    try {
      if (action === 'lock') {
        await form.validateFields();
      }
      setLoading(true);
      await new Promise(r => setTimeout(r, 600));
      onDone(account.id, cfg.newStatus);
      message.success(`${cfg.title} thành công cho ${account.name}!`);
      form.resetFields();
    } catch {
      // validation failed
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: cfg.buttonColor, fontSize: 18 }}>{cfg.icon}</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{cfg.title}</span>
        </div>
      }
      footer={null}
      width={440}
    >
      <div style={{ marginTop: 16 }}>
        {/* Account Preview */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px',
          background: '#F8FAFC',
          borderRadius: 10,
          border: '1px solid #E2E8F0',
          marginBottom: 16,
        }}>
          <Avatar src={account.avatar} size={40} style={{ border: '1.5px solid #CBD5E1', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{account.name}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{account.email}</div>
          </div>
        </div>

        <Alert
          type={cfg.alertType}
          icon={<WarningOutlined />}
          message={cfg.alertMsg}
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Text style={{ color: '#475569', fontSize: 13 }}>{cfg.desc}</Text>

        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {action === 'lock' && (
            <Form.Item
              name="reason"
              label="Lý do khóa *"
              rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
            >
              <Input.TextArea
                prefix={<LockOutlined />}
                placeholder="Nhập lý do khóa tài khoản (bắt buộc)..."
                rows={3}
                style={{ resize: 'none' }}
              />
            </Form.Item>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button onClick={onClose}>Hủy</Button>
            <Button
              loading={loading}
              onClick={handleConfirm}
              style={{ background: cfg.buttonColor, border: 'none', color: '#fff', fontWeight: 700 }}
            >
              {cfg.buttonLabel}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
