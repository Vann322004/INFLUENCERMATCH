import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Divider, Row, Col, Typography, message, Alert } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  ArrowRightOutlined,
  GoogleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { LABELS } from '../../constants/labels';
import { ROUTES } from '../../constants/routes';
import { authService, MOCK_USER } from '../../mock/authData';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    setTimeout(() => {
      const result = authService.login(values.username, values.password);
      setLoading(false);

      if (result.success) {
        message.success(`Đăng nhập thành công! Xin chào ${result.user.name}`);
        navigate(ROUTES.DASHBOARD || '/dashboard');
      } else {
        message.error(result.message || 'Đăng nhập thất bại!');
      }
    }, 400);
  };

  const handleQuickLogin = () => {
    form.setFieldsValue({
      username: MOCK_USER.email,
      password: MOCK_USER.password,
    });
    setLoading(true);
    setTimeout(() => {
      authService.login(MOCK_USER.email, MOCK_USER.password);
      setLoading(false);
      message.success(`Đăng nhập thành công! Chào mừng ${MOCK_USER.name}`);
      navigate(ROUTES.DASHBOARD || '/dashboard');
    }, 300);
  };

  const handleSocialLogin = (provider) => {
    message.info(`Đang kết nối với ${provider}...`);
  };

  return (
    <div>
      {/* Title & Subtitle */}
      <div className="card-title-group">
        <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
          {LABELS.AUTH.LOGIN_TITLE}
        </Title>
        <Text type="secondary" style={{ fontSize: 13.5 }}>
          {LABELS.AUTH.LOGIN_SUBTITLE}
        </Text>
      </div>

      {/* Demo Account Box */}
      <div
        style={{
          background: 'linear-gradient(135deg, #F5F3FF 0%, #EFF6FF 100%)',
          border: '1px solid #DDD6FE',
          borderRadius: 12,
          padding: '10px 14px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6D28D9', display: 'flex', alignItems: 'center', gap: 5 }}>
            <ThunderboltOutlined /> Tài khoản Mock Demo:
          </div>
          <div style={{ fontSize: 11.5, color: '#4B5563', marginTop: 2 }}>
            <code>thevan@influencermatch.com</code> / <code>123456</code>
          </div>
        </div>
        <Button
          size="small"
          type="primary"
          onClick={handleQuickLogin}
          style={{
            fontSize: 11,
            height: 28,
            padding: '0 10px',
            background: '#7C3AED',
            borderRadius: 8,
          }}
        >
          Điền nhanh
        </Button>
      </div>

      {/* Ant Design Form */}
      <Form
        form={form}
        name="login_form"
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          remember: true,
          username: MOCK_USER.email,
          password: MOCK_USER.password,
        }}
        requiredMark={false}
        size="large"
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: 'Vui lòng nhập email hoặc số điện thoại!' }]}
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

        <div className="form-options">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox style={{ color: '#475569', fontWeight: 600 }}>
              {LABELS.AUTH.REMEMBER_ME}
            </Checkbox>
          </Form.Item>

          <Link to={ROUTES.AUTH.FORGOT_PASSWORD} className="forgot-link">
            {LABELS.AUTH.FORGOT_PASSWORD_LINK}
          </Link>
        </div>

        <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
            icon={<ArrowRightOutlined />}
          >
            {LABELS.AUTH.SUBMIT_LOGIN}
          </Button>
        </Form.Item>
      </Form>

      {/* Divider */}
      <Divider style={{ color: '#94A3B8', fontSize: 12, margin: '18px 0' }}>
        {LABELS.AUTH.OR_CONTINUE_WITH}
      </Divider>

      {/* Social Logins */}
      <Row>
        <Col span={24}>
          <Button
            block
            onClick={() => handleSocialLogin('Google')}
            icon={<GoogleOutlined style={{ color: '#4285F4' }} />}
          >
            Google
          </Button>
        </Col>
      </Row>

      {/* Footer link */}
      <div className="card-footer-text">
        <Text type="secondary">{LABELS.AUTH.NO_ACCOUNT_PROMPT}</Text>
        <Link to={ROUTES.AUTH.REGISTER} style={{ fontWeight: 700, marginLeft: 6, color: '#8B5CF6' }}>
          {LABELS.AUTH.REGISTER_NOW_LINK}
        </Link>
      </div>
    </div>
  );
}
