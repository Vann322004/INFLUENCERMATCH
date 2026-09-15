import React from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { LABELS } from '../../constants/labels';
import { ROUTES } from '../../constants/routes';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    message.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
  };

  return (
    <div>
      <div className="card-title-group">
        <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
          {LABELS.AUTH.REGISTER_TITLE}
        </Title>
        <Text type="secondary" style={{ fontSize: 13.5 }}>
          {LABELS.AUTH.REGISTER_SUBTITLE}
        </Text>
      </div>

      <Form
        form={form}
        name="register_form"
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        size="large"
      >
        <Form.Item
          name="fullName"
          rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: '#94A3B8' }} />}
            placeholder={LABELS.AUTH.FULL_NAME_PLACEHOLDER}
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            { type: 'email', message: 'Email không hợp lệ!' },
          ]}
        >
          <Input
            prefix={<MailOutlined style={{ color: '#94A3B8' }} />}
            placeholder={LABELS.AUTH.EMAIL_OR_PHONE_PLACEHOLDER}
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#94A3B8' }} />}
            placeholder={LABELS.AUTH.PASSWORD_PLACEHOLDER}
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
            {LABELS.AUTH.SUBMIT_REGISTER}
          </Button>
        </Form.Item>
      </Form>

      <div className="card-footer-text">
        <Text type="secondary">{LABELS.AUTH.HAS_ACCOUNT_PROMPT}</Text>
        <Link to={ROUTES.AUTH.LOGIN} style={{ fontWeight: 700, marginLeft: 6, color: '#8B5CF6' }}>
          {LABELS.AUTH.LOGIN_NOW_LINK}
        </Link>
      </div>
    </div>
  );
}
