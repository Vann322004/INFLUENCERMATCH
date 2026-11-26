import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, Row, Col, message } from 'antd';
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
      centered
      open={open}
      onCancel={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafetyCertificateOutlined style={{ color: '#7C3AED', fontSize: 18 }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Tạo tài khoản Quản trị / Quản lý mới</span>
        </div>
      }
      footer={null}
      width={580}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label="Họ và tên"
              style={{ marginBottom: 12 }}
              rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#7C3AED' }} />}
                placeholder="Nguyễn Văn A"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="email"
              label="Email"
              style={{ marginBottom: 12 }}
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#7C3AED' }} />}
                placeholder="admin@influencermatch.vn"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="role"
              label="Vai trò"
              style={{ marginBottom: 12 }}
              rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
              initialValue="admin"
            >
              <Select>
                <Option value="admin">Quản trị viên (Hệ thống & Tài khoản)</Option>
                <Option value="manager">Quản lý (Vận hành & Nhà sáng tạo)</Option>
                <Option value="super_admin">Quản trị viên cấp cao</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="password"
              label="Mật khẩu tạm thời"
              style={{ marginBottom: 12 }}
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu' },
                { min: 8, message: 'Tối thiểu 8 ký tự' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#7C3AED' }} />}
                placeholder="Tối thiểu 8 ký tự"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="note" label="Ghi chú (tuỳ chọn)" style={{ marginBottom: 16 }}>
          <Input.TextArea
            placeholder="Ghi chú nội bộ..."
            rows={2}
            style={{ resize: 'none' }}
          />
        </Form.Item>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            style={{ background: '#7C3AED', borderColor: '#7C3AED', fontWeight: 700 }}
          >
            Tạo tài khoản
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
