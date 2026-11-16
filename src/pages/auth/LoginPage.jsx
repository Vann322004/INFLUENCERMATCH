import React, { useCallback, useRef, useState } from 'react';
import { App, Form, Input, Button, Checkbox } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { authService } from '../../services/api/authService';
import { brandService } from '../../services/api/brandService';
import { hasDeferredBrandOnboarding } from '../../services/brandOnboarding';
import { getErrorMessage, getAuthSessionId } from '../../services/apiClient';
import GoogleIdentityButton, { googleErrorMessage } from './GoogleIdentityButton';
import GoogleRegistrationModal from './GoogleRegistrationModal';
import './LoginPage.css';

export default function LoginPage() {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [registration, setRegistration] = useState(null);
  const [googleAttempt, setGoogleAttempt] = useState(0);
  const pending = useRef(false);
  const startGoogle = useCallback(async (signal) => {
    const sessionId = getAuthSessionId();
    const challenge = await authService.startGoogleLogin(sessionId, signal);
    return { challenge, sessionId };
  }, []);

  const redirectByRole = async (user) => {
    const sessionId = getAuthSessionId();
    if (user && (user.role === 'ADMIN' || user.role === 'admin' || user.role === 'super_admin')) {
      navigate('/admin/dashboard');
    } else if (user && (user.role === 'MANAGER' || user.role === 'DATA_MANAGER' || user.role === 'manager')) {
      navigate('/data-manager/dashboard');
    } else if (user && (user.role === 'CREATOR' || user.role === 'creator')) {
      navigate('/creator/dashboard');
    } else if (user?.role === 'BRAND') {
      const dashboard = ROUTES.DASHBOARD || '/dashboard';
      if (user.onboardingStatus === 'COMPLETED' || (user.id && hasDeferredBrandOnboarding(user.id))) {
        navigate(dashboard, { replace: true });
        return;
      }
      let status = user.onboardingStatus;
      if (!status) {
        try {
          status = (await brandService.getMyBrand(true))?.onboardingStatus;
        } catch {
          // The setup page shows the load error and offers a retry.
        }
        if (getAuthSessionId() !== sessionId) return;
      }
      navigate(status === 'COMPLETED' ? dashboard : '/brand-onboarding', { replace: true });
    } else {
      navigate(ROUTES.DASHBOARD || '/dashboard');
    }
  };

  const onFinish = async (values) => {
    if (pending.current || registration) return;
    pending.current = true;
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
      pending.current = false;
      setLoading(false);
      setGoogleAttempt(value => value + 1);
    }
  };

  const finishGoogleLogin = (result) => {
    message.success('Đăng nhập bằng Google thành công.');
    void redirectByRole(result.user);
  };

  const onGoogleCredential = async (challenge, credential, sessionId) => {
    if (pending.current || registration) return;
    pending.current = true;
    setLoading(true);
    try {
      const result = await authService.loginWithGoogle(challenge.sessionId, credential, sessionId);
      if (result.status === 'REGISTRATION_REQUIRED') setRegistration({ result, sessionId });
      else finishGoogleLogin(result);
    } catch (error) {
      message.error(googleErrorMessage(error, 'Đăng nhập Google không thành công. Vui lòng thử lại.'));
      setGoogleAttempt(value => value + 1);
    } finally {
      pending.current = false;
      setLoading(false);
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

      <div className="google-login-control">
        {!registration && <GoogleIdentityButton key={googleAttempt}
          start={startGoogle} onCredential={onGoogleCredential} disabled={loading} />}
      </div>
      {registration && <GoogleRegistrationModal registration={registration.result} sessionId={registration.sessionId}
        onClose={() => { setRegistration(null); setGoogleAttempt(value => value + 1); }}
        onSuccess={finishGoogleLogin} />}

      {/* ── Footer Registration Banner (Matching Mockup grey pill box) ── */}
      <div className="login-register-banner">
        <span className="register-prompt">Chưa có tài khoản?</span>
        <Link to={ROUTES.AUTH.REGISTER || '/register'} className="register-now-link">
          <span>Đăng ký ngay</span>
          <ArrowRightOutlined style={{ fontSize: 11, marginLeft: 4 }} />
        </Link>
      </div>
    </div>
  );
}
