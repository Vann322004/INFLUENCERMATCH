import React, { useCallback, useRef, useState } from 'react';
import { Alert, App, Form, Input, Button, Checkbox } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { authService } from '../../services/api/authService';
import { brandService } from '../../services/api/brandService';
import { hasDeferredBrandOnboarding } from '../../services/brandOnboarding';
import { getErrorMessage, getAuthSessionId } from '../../services/apiClient';
import GoogleIdentityButton, { googleErrorMessage } from './GoogleIdentityButton';
import GoogleRegistrationModal from './GoogleRegistrationModal';
import GoogleLinkModal from '../brand/GoogleLinkModal';
import './LoginPage.css';
import { cooperationPath, pendingCooperation, rememberCooperation, validCooperationToken } from '../../services/cooperationContinuation';

export default function LoginPage() {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const cooperationInvitation = validCooperationToken(location.state?.cooperationToken) ? location.state.cooperationToken : pendingCooperation();
  const [loading, setLoading] = useState(false);

  const [registration, setRegistration] = useState(null);
  const [linkRequired, setLinkRequired] = useState(false);
  const [googleLink, setGoogleLink] = useState(null);
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
      const invitation = validCooperationToken(location.state?.cooperationToken) ? location.state.cooperationToken : pendingCooperation();
      if (invitation) rememberCooperation(invitation);
      navigate(invitation ? cooperationPath() : location.state?.cooperationReturnTo === '/creator/bookings' ? '/creator/bookings' : '/creator/dashboard');
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

  const signIn = async (values, linkGoogle = false) => {
    if (pending.current || registration || googleLink) return;
    pending.current = true;
    setLoading(true);
    try {
      const loginData = await authService.login({
        email: values.email?.trim(),
        password: values.password,
      });

      if (linkGoogle && loginData.user?.role === 'BRAND') {
        const sessionId = getAuthSessionId();
        const link = { user: loginData.user, sessionId };
        try {
          const challenge = await authService.startGoogleLink(values.password, sessionId);
          if (getAuthSessionId() === sessionId) {
            setGoogleLink({ ...link, initialStep: { challenge, sessionId } });
          }
        } catch (error) {
          if (getAuthSessionId() === sessionId) {
            setGoogleLink({ ...link, initialError: googleErrorMessage(error, 'Chưa thể bắt đầu liên kết Google.') });
          }
        }
        return;
      }

      message.success(`Đăng nhập thành công! Xin chào ${loginData.user?.fullName || loginData.user?.email}`);
      await redirectByRole(loginData.user);
    } catch (error) {
      message.error(getErrorMessage(error, 'Đăng nhập thất bại! Vui lòng kiểm tra lại email và mật khẩu.'));
    } finally {
      if (linkGoogle) form.setFieldValue('password', '');
      pending.current = false;
      setLoading(false);
    }
  };

  const linkExistingGoogle = async () => {
    let values;
    try {
      values = await form.validateFields(['email', 'password']);
    } catch {
      return;
    }
    await signIn(values, true);
  };

  const closeGoogleLink = () => {
    const link = googleLink;
    setGoogleLink(null);
    setLinkRequired(false);
    if (link && getAuthSessionId() === link.sessionId) void redirectByRole(link.user);
  };

  const finishGoogleLogin = (result) => {
    message.success('Đăng nhập bằng Google thành công.');
    void redirectByRole(result.user);
  };

  const onGoogleCredential = async (challenge, credential, sessionId) => {
    if (pending.current || registration || googleLink) return;
    pending.current = true;
    setLoading(true);
    try {
      const result = await authService.loginWithGoogle(challenge.sessionId, credential, sessionId);
      setLinkRequired(false);
      if (result.status === 'REGISTRATION_REQUIRED') setRegistration({ result, sessionId });
      else finishGoogleLogin(result);
    } catch (error) {
      if (error?.response?.data?.code === 'GOOGLE_ACCOUNT_LINK_REQUIRED') {
        setLinkRequired(true);
      } else {
        message.error(googleErrorMessage(error, 'Đăng nhập Google không thành công. Vui lòng thử lại.'));
      }
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
        onFinish={values => void signIn(values)}
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
          className="login-form-field"
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
          className="login-form-field"
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

        {linkRequired && !googleLink && <Alert type="info" showIcon
          title="Email Google này đã có tài khoản"
          description="Nhập email và mật khẩu của Brand ở trên, rồi chọn Liên kết Google để dùng Google từ lần sau."
          style={{ marginBottom: 16 }}
          action={<Button size="small" disabled={loading} onClick={() => void linkExistingGoogle()}>
            Liên kết Google
          </Button>} />}

        {/* ── Submit Button with Arrow Icon ── */}
        <Form.Item className="login-submit-field">
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
      <div className="luxe-divider" style={cooperationInvitation ? { display: 'none' } : undefined}>
        <span className="luxe-divider-line" />
        <span className="luxe-divider-text">hoặc tiếp tục với</span>
        <span className="luxe-divider-line" />
      </div>

      <div className="google-login-control" style={cooperationInvitation ? { display: 'none' } : undefined}>
        {!registration && !googleLink && <GoogleIdentityButton key={googleAttempt}
          start={startGoogle} onCredential={onGoogleCredential} disabled={loading} />}
      </div>
      {registration && <GoogleRegistrationModal registration={registration.result} sessionId={registration.sessionId}
        onClose={() => { setRegistration(null); setGoogleAttempt(value => value + 1); }}
        onSuccess={finishGoogleLogin} />}
      {googleLink && <GoogleLinkModal initialStep={googleLink.initialStep}
        initialError={googleLink.initialError} closeLabel="Tiếp tục vào tài khoản" onClose={closeGoogleLink} />}

      {/* ── Footer Registration Banner (Matching Mockup grey pill box) ── */}
      <div className="login-register-banner">
        <span className="register-prompt">Chưa có tài khoản?</span>
        <Link to={cooperationInvitation ? cooperationPath() : ROUTES.AUTH.REGISTER || '/register'} className="register-now-link">
          <span>Đăng ký ngay</span>
          <ArrowRightOutlined style={{ fontSize: 11, marginLeft: 4 }} />
        </Link>
      </div>
    </div>
  );
}
