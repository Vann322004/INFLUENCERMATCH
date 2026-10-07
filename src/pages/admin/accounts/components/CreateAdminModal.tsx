import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { AdminAccount } from '../../../../mock/adminData';

const { Option } = Select;

interface CreateAdminModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (admin: AdminAccount) => void;
}

export default function CreateAdminModal({ open, onClose, onCreate }: CreateAdminModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await new Promise(r => setTimeout(r, 600));

      const newAdmin: AdminAccount = {
        id: `usr_${Date.now()}`,
        name: values.name,
        email: values.email,
        role: values.role,
        roleLabel: values.role === 'super_admin' ? 'Super Admin' : 'Admin',
        status: 'active',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(values.name)}&background=6366F1&color=fff`,
        lastLogin: '—',
        joinedAt: new Date().toISOString().split('T')[0],
        ip: '—',
      };

      onCreate(newAdmin);
      form.resetFields();
      message.success(`Đã tạo tài khoản admin cho ${values.name}!`);
    } catch {
      // validation error
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
          <SafetyCertificateOutlined style={{ color: '#6366F1', fontSize: 18 }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Tạo tài khoản Admin mới</span>
        </div>
      }
      footer={null}
      width={480}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="Họ và tên"
          rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: '#6366F1' }} />}
            placeholder="Nguyễn Văn A"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input
            prefix={<MailOutlined style={{ color: '#6366F1' }} />}
            placeholder="admin@influencermatch.vn"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="role"
          label="Vai trò"
          rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          initialValue="admin"
        >
          <Select size="large">
            <Option value="admin">Admin</Option>
            <Option value="super_admin">Super Admin</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật khẩu tạm thời"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu' },
            { min: 8, message: 'Tối thiểu 8 ký tự' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#6366F1' }} />}
            placeholder="Tối thiểu 8 ký tự"
            size="large"
          />
        </Form.Item>

        <Form.Item name="note" label="Ghi chú (tuỳ chọn)">
          <Input.TextArea
            placeholder="Ghi chú nội bộ..."
            rows={2}
            style={{ resize: 'none' }}
          />
        </Form.Item>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none', fontWeight: 700 }}
          >
            Tạo tài khoản
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
