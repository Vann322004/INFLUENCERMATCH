import React from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { LABELS } from '../../constants/labels';
import { ROUTES } from '../../constants/routes';

const { Title, Text } = Typography;

export default function ResetPasswordPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = (values) => {
    message.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
    navigate(ROUTES.AUTH.LOGIN);
  };

  return (
    <div>
      <div className="card-title-group">
        <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
          {LABELS.AUTH.RESET_TITLE}
        </Title>
        <Text type="secondary" style={{ fontSize: 13.5 }}>
          {LABELS.AUTH.RESET_SUBTITLE}
        </Text>
      </div>

      <Form
        form={form}
        name="reset_form"
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        size="large"
      >
        <Form.Item
          name="newPassword"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#94A3B8' }} />}
            placeholder="Mật khẩu mới"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#94A3B8' }} />}
            placeholder="Xác nhận mật khẩu mới"
          />
        </Form.Item>

        <Form.Item style={{ marginTop: 20, marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            icon={<ArrowRightOutlined />}
          >
            Lưu mật khẩu mới
          </Button>
        </Form.Item>
      </Form>

      <div className="card-footer-text">
        <Link to={ROUTES.AUTH.LOGIN} style={{ fontWeight: 700, color: '#8B5CF6' }}>
          ← Quay lại {LABELS.AUTH.LOGIN_NOW_LINK}
        </Link>
      </div>
    </div>
  );
}
