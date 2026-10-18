import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Divider, Row, Col, Typography, message } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  ArrowRightOutlined,
  GoogleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { LABELS } from '../../constants/labels';
import { ROUTES } from '../../constants/routes';
import { authService } from '../../services/api/authService';
import { getErrorMessage } from '../../services/apiClient';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const redirectByRole = (user) => {
    if (user && (user.role === 'ADMIN' || user.role === 'DATA_MANAGER')) {
      navigate('/admin/dashboard');
    } else {
      navigate(ROUTES.DASHBOARD || '/dashboard');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const loginData = await authService.login({
        email: values.email?.trim(),
        password: values.password,
      });

      message.success(`Đăng nhập thành công! Xin chào ${loginData.user?.fullName || loginData.user?.email}`);
      redirectByRole(loginData.user);
    } catch (error) {
      message.error(getErrorMessage(error, 'Đăng nhập thất bại! Vui lòng kiểm tra lại email và mật khẩu.'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (email, password) => {
    form.setFieldsValue({
      email,
      password,
    });
    form.submit();
  };

  const handleSocialLogin = (provider) => {
    if (provider === 'Google') {
      window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://221.121.3.226:8080/api/v1'}/auth/google`;
    } else {
      message.info(`Đang kết nối với ${provider}...`);
    }
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
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6D28D9', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <ThunderboltOutlined /> Tài khoản đã kiểm thử trên Server:
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', marginBottom: 2 }}>🏢 BRAND TEST</div>
            <div style={{ fontSize: 11, color: '#4B5563' }}>
              <code>brand_test_01@influencermatch.vn</code> / <code>Password123!</code>
            </div>
          </div>
        </div>
        <Button
          size="small"
          type="primary"
          onClick={() => handleQuickLogin('brand_test_01@influencermatch.vn', 'Password123!')}
          style={{ fontSize: 11, height: 26, padding: '0 10px', background: '#7C3AED', borderRadius: 8, marginTop: 8 }}
        >
          Điền nhanh & Đăng nhập
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
          email: 'brand_test_01@influencermatch.vn',
          password: 'Password123!',
        }}
        requiredMark={false}
        size="large"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            { type: 'email', message: 'Email không hợp lệ!' },
          ]}
        >
          <Input
            prefix={<MailOutlined style={{ color: '#94A3B8' }} />}
            placeholder="Email tài khoản"
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
