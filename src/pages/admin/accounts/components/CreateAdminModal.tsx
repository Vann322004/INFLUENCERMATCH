import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { AdminUser } from '../../../../types/api/admin.types';
import { adminService } from '../../../../services/api/adminService';

const { Option } = Select;

interface CreateAdminModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
}

export default function CreateAdminModal({ open, onClose, onCreate }: CreateAdminModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await adminService.createAdmin({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role || 'admin',
      });
      form.resetFields();
      message.success(`Đã tạo tài khoản ${values.role === 'manager' ? 'Manager' : 'Admin'} cho ${values.name}!`);
      onCreate();
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
          <span style={{ fontWeight: 700, fontSize: 15 }}>Tạo tài khoản Quản trị / Quản lý mới</span>
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
            <Option value="admin">Quản trị viên (Hệ thống & Tài khoản)</Option>
            <Option value="manager">Quản lý (Vận hành & Nhà sáng tạo)</Option>
            <Option value="super_admin">Quản trị viên cấp cao</Option>
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
