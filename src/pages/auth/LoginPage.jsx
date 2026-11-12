import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { LABELS } from '../../constants/labels';
import { ROUTES } from '../../constants/routes';
import { authService } from '../../services/api/authService';
import { brandService } from '../../services/api/brandService';
import { getErrorMessage, setAuthSession, clearAuthSession, getAuthSessionId } from '../../services/apiClient';
import { claimRefreshCookie } from '../../services/authSession';
import './LoginPage.css';

export default function LoginPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Lắng nghe callback redirect từ Google OAuth2 (Luồng 1.3)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleCode = params.get('code');
    const tokenParam = params.get('accessToken') || params.get('token');

    if (googleCode) {
      setLoading(true);
      message.loading({ content: 'Đang xác thực đăng nhập Google...', key: 'google_login' });
      authService
        .googleExchange(googleCode)
        .then(async (loginData) => {
          message.success({
            content: `Đăng nhập Google thành công! Xin chào ${loginData.user?.fullName || loginData.user?.email}`,
            key: 'google_login',
          });
          window.history.replaceState({}, '', window.location.pathname);
          await redirectByRole(loginData.user);
        })
        .catch((err) => {
          message.error({
            content: getErrorMessage(err, 'Đăng nhập Google không thành công. Vui lòng thử lại.'),
            key: 'google_login',
          });
          window.history.replaceState({}, '', window.location.pathname);
        })
        .finally(() => setLoading(false));
    } else if (tokenParam) {
      const refreshTokenParam = params.get('refreshToken') || '';
      clearAuthSession();
      setAuthSession(tokenParam, refreshTokenParam);
      claimRefreshCookie();
      const sessionId = getAuthSessionId();
      window.history.replaceState({}, '', window.location.pathname);
      authService
        .getMe()
        .then(async (user) => {
          message.success(`Đăng nhập thành công! Xin chào ${user?.fullName || user?.email}`);
          await redirectByRole(user);
        })
        .catch(() => {
          if (getAuthSessionId() !== sessionId) return;
          clearAuthSession();
          message.error('Không xác thực được tài khoản. Vui lòng đăng nhập lại.');
          navigate('/login');
        });
    }
  }, []);

  const redirectByRole = async (user) => {
    const sessionId = getAuthSessionId();
    if (user && (user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'DATA_MANAGER')) {
      navigate('/admin/dashboard');
    } else if (user && (user.role === 'CREATOR' || user.role === 'creator')) {
      navigate('/creator/dashboard');
    } else {
      // Role BRAND / SME: Kiểm tra xem thương hiệu đã cập nhật hồ sơ lần đầu chưa
      try {
        const brand = await brandService.getMyBrand(true);
        if (getAuthSessionId() !== sessionId) return;
        // Nếu chưa có hồ sơ (null/404) hoặc chưa hoàn thiện thông tin (chưa có tên thương hiệu hoặc ngành hàng)
        const hasCompletedProfile = Boolean(brand && (brand.businessName?.trim() || brand.industry?.trim()));
        if (!hasCompletedProfile) {
          message.info('Chào mừng bạn! Vui lòng hoàn thiện thông tin hồ sơ thương hiệu để bắt đầu.');
          navigate('/brand-profile');
          return;
        }
      } catch (err) {
        if (getAuthSessionId() !== sessionId) return;
        console.warn('Lỗi kiểm tra hồ sơ brand, chuyển hướng trang tạo hồ sơ:', err);
        navigate('/brand-profile');
        return;
      }
      navigate(ROUTES.DASHBOARD || '/dashboard');
    }
  };

  const onFinish = async (values) => {
    if (loading) return;
    setLoading(true);
    try {
      const loginData = await authService.login({
        email: values.email?.trim(),
        password: values.password,
      });

      message.success(`Đăng nhập thành công! Xin chào ${loginData.user?.fullName || loginData.user?.email}`);
      await redirectByRole(loginData.user);
    } catch (error) {
      message.error(getErrorMessage(error, 'Đăng nhập thất bại! Vui lòng kiểm tra lại email và mật khẩu.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    if (provider === 'Google') {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      window.location.href = `${apiBase}/auth/google`;
    } else {
      message.info(`Đang kết nối với ${provider}...`);
    }
  };

  return (
    <div className="login-card-inner">
      {/* ── Title & Welcome Subtitle (Matching Mockup Serif/Editorial Title) ── */}
      <div className="login-heading-group">
        <h2 className="login-title">Đăng nhập</h2>
        <p className="login-welcome-text">Chào mừng trở lại!</p>
      </div>

      {/* ── Form Inputs ── */}
      <Form
        form={form}
        name="login_form"
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ remember: true }}
        requiredMark={false}
        size="large"
        autoComplete="off"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            { type: 'email', message: 'Địa chỉ email không hợp lệ!' },
          ]}
          style={{ marginBottom: 16 }}
        >
          <Input
            id="login-email"
            placeholder="Email"
            autoComplete="email"
            disabled={loading}
            className="luxe-input"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          style={{ marginBottom: 16 }}
        >
          <Input.Password
            id="login-password"
            placeholder="Mật khẩu"
            autoComplete="current-password"
            disabled={loading}
            className="luxe-input"
          />
        </Form.Item>

        {/* ── Remember me & Forgot Password ── */}
        <div className="login-options-row">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox className="luxe-checkbox">
              Ghi nhớ đăng nhập
            </Checkbox>
          </Form.Item>

          <Link
            to={ROUTES.AUTH.FORGOT_PASSWORD || '/forgot-password'}
            className="login-forgot-link"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* ── Submit Button with Arrow Icon ── */}
        <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            disabled={loading}
            className="luxe-primary-btn"
          >
            <span>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
            {!loading && <ArrowRightOutlined className="btn-arrow-icon" />}
          </Button>
        </Form.Item>
      </Form>

      {/* ── Divider ── */}
      <div className="luxe-divider">
        <span className="luxe-divider-line" />
        <span className="luxe-divider-text">hoặc tiếp tục với</span>
        <span className="luxe-divider-line" />
      </div>

      {/* ── Google Sign-in Button ── */}
      <button
        type="button"
        onClick={() => handleSocialLogin('Google')}
        className="luxe-google-btn"
        disabled={loading}
        aria-label="Đăng nhập với Google"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>Đăng nhập với Google</span>
      </button>

      {/* ── Footer Registration Banner (Matching Mockup grey pill box) ── */}
      <div className="login-register-banner">
        <span className="register-prompt">Chưa có tài khoản?</span>
        <Link to={ROUTES.AUTH.REGISTER || '/register'} className="register-now-link">
          <span>Đăng ký ngay</span>
          <ArrowRightOutlined style={{ fontSize: 11, marginLeft: 4 }} />
        </Link>
      </div>

      {/* ── Demo Accounts Quick-fill (Collapsible/Subtle to keep UI ultra-clean) ── */}
      <div className="login-demo-bar">
        <span className="demo-hint">Tài khoản demo:</span>
        <div className="demo-chip-group">
          <button
            type="button"
            className="demo-chip"
            onClick={() => form.setFieldsValue({ email: 'creator@influencermatch.vn', password: 'creator123' })}
          >
            Creator
          </button>
          <button
            type="button"
            className="demo-chip"
            onClick={() => form.setFieldsValue({ email: 'manager@influencermatch.vn', password: 'manager123' })}
          >
            Manager
          </button>
          <button
            type="button"
            className="demo-chip"
            onClick={() => form.setFieldsValue({ email: 'admin@influencermatch.com', password: 'Password123!' })}
          >
            Admin
          </button>
        </div>
      </div>
    </div>
  );
}
