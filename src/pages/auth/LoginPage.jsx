import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Divider, Typography, message } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
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
  const [isTransitioning, setIsTransitioning] = useState(false);

  const redirectByRole = (user) => {
    if (user && (user.role === 'ADMIN' || user.role === 'DATA_MANAGER')) {
      navigate('/admin/dashboard');
    } else {
      navigate(ROUTES.DASHBOARD || '/dashboard');
    }
  };

  const handleNavigateRegister = (e) => {
    e.preventDefault();
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      navigate(ROUTES.AUTH.REGISTER || '/register');
    }, 240);
  };

  const onFinish = async (values) => {
    if (loading) return; // Prevent double-submit
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

  const handleSocialLogin = (provider) => {
    if (provider === 'Google') {
      window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://221.121.3.226:8080/api/v1'}/auth/google`;
    } else {
      message.info(`Đang kết nối với ${provider}...`);
    }
  };

  return (
    <div className={`login-form-container ${isTransitioning ? 'al-form-slide-exit-to-left' : 'al-form-slide-enter'}`}>
      {/* Title & Subtitle */}
      <div className="card-title-group">
        <Title level={2} className="al-card-title">
          {LABELS.AUTH.LOGIN_TITLE}
        </Title>
        <Text className="al-card-subtitle">
          {LABELS.AUTH.LOGIN_SUBTITLE}
        </Text>
      </div>

      {/* Ant Design Form */}
      <Form
        form={form}
        name="login_form"
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          remember: true,
        }}
        requiredMark={false}
        size="large"
        aria-live="polite"
      >
        <Form.Item
          name="email"
          htmlFor="login-email"
          label={<span className="al-input-label">Email tài khoản</span>}
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            { type: 'email', message: 'Địa chỉ email không hợp lệ!' },
          ]}
          style={{ marginBottom: 12 }}
        >
          <Input
            id="login-email"
            prefix={<MailOutlined className="al-field-icon" aria-hidden="true" />}
            placeholder="name@company.com"
            autoComplete="email"
            disabled={loading}
          />
        </Form.Item>

        <Form.Item
          name="password"
          htmlFor="login-password"
          label={<span className="al-input-label">Mật khẩu</span>}
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          style={{ marginBottom: 12 }}
        >
          <Input.Password
            id="login-password"
            prefix={<LockOutlined className="al-field-icon" aria-hidden="true" />}
            placeholder="Nhập mật khẩu của bạn"
            autoComplete="current-password"
            disabled={loading}
            iconRender={(visible) => (
              <span
                role="button"
                className="al-pwd-toggle-btn"
                aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
              >
                {visible ? <EyeOutlined aria-hidden="true" /> : <EyeInvisibleOutlined aria-hidden="true" />}
              </span>
            )}
          />
        </Form.Item>

        {/* Remember me & Forgot password */}
        <div className="al-form-options">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox className="al-remember-checkbox">
              {LABELS.AUTH.REMEMBER_ME}
            </Checkbox>
          </Form.Item>

          <Link
            to={ROUTES.AUTH.FORGOT_PASSWORD || '/forgot-password'}
            className="al-forgot-link"
          >
            {LABELS.AUTH.FORGOT_PASSWORD_LINK}
          </Link>
        </div>

        {/* Submit Button */}
        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
            disabled={loading}
            className="primary-login-btn"
          >
            {loading ? 'Đang xác thực...' : LABELS.AUTH.SUBMIT_LOGIN}
          </Button>
        </Form.Item>
      </Form>

      {/* Divider */}
      <Divider className="al-divider">
        {LABELS.AUTH.OR_CONTINUE_WITH}
      </Divider>

      {/* Google Sign-in */}
      <Button
        block
        size="large"
        onClick={() => handleSocialLogin('Google')}
        className="al-google-btn"
        disabled={loading}
        aria-label="Đăng nhập với Google"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>Đăng nhập với Google</span>
      </Button>

      {/* Footer Registration Link */}
      <div className="al-footer-register">
        <span className="al-footer-prompt">{LABELS.AUTH.NO_ACCOUNT_PROMPT}</span>
        <a
          href={ROUTES.AUTH.REGISTER || '/register'}
          onClick={handleNavigateRegister}
          className="al-register-link"
          role="button"
          tabIndex={0}
        >
          {LABELS.AUTH.REGISTER_NOW_LINK}
        </a>
      </div>

      {/* Legal disclaimer */}
      <p className="al-legal-disclaimer">
        Bằng việc đăng nhập, bạn đồng ý với{' '}
        <a href="#terms" className="al-legal-link">Điều khoản</a> và{' '}
        <a href="#privacy" className="al-legal-link">Chính sách bảo mật</a>
      </p>
    </div>
  );
}
