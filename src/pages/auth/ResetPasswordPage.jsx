import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Form, Input, Typography, message } from 'antd';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LABELS } from '../../constants/labels';
import { ROUTES } from '../../constants/routes';
import { authService } from '../../services/api/authService';

const { Title, Text } = Typography;
const REQUEST_NOTICE = 'Nếu tài khoản đủ điều kiện, mã xác nhận sẽ được gửi đến email của bạn.';

export default function ResetPasswordPage() {
  const { state } = useLocation();
  if (typeof state?.email !== 'string' || !state.email) {
    return <Navigate to={ROUTES.AUTH.FORGOT_PASSWORD} replace />;
  }
  return <ResetPasswordForm key={state.email} email={state.email} initialResendAt={state.resendAt} />;
}

function ResetPasswordForm({ email, initialResendAt }) {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const pending = useRef(false);
  const [action, setAction] = useState(null);
  const [error, setError] = useState('');
  const [resendAt, setResendAt] = useState(initialResendAt ?? 0);
  const [now, setNow] = useState(Date.now);
  const seconds = Math.max(0, Math.ceil((resendAt - now) / 1000));

  useEffect(() => {
    if (!seconds) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [seconds]);

  async function onFinish({ otp, newPassword }) {
    if (pending.current) return;
    pending.current = true;
    setAction('confirm');
    setError('');
    try {
      await authService.confirmPasswordReset(email, otp, newPassword);
      message.success('Đã đặt lại mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới.');
      navigate(ROUTES.AUTH.LOGIN, { replace: true });
    } catch (failure) {
      const code = failure?.response?.data?.code;
      setError(code === 'EMAIL_OTP_INVALID_OR_EXPIRED'
        ? 'Mã xác nhận không hợp lệ hoặc đã hết hạn. Bạn có thể yêu cầu mã mới.'
        : failure?.response?.status === 400
          ? 'Thông tin chưa hợp lệ. Vui lòng kiểm tra mã xác nhận và mật khẩu mới.'
          : 'Chưa thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      pending.current = false;
      setAction(null);
    }
  }

  async function resend() {
    if (pending.current || Date.now() < resendAt) return;
    pending.current = true;
    setAction('resend');
    setError('');
    try {
      await authService.requestPasswordReset(email);
      const sentAt = Date.now();
      setNow(sentAt);
      setResendAt(sentAt + 60_000);
      message.info(REQUEST_NOTICE);
    } catch {
      setError('Chưa thể gửi lại mã. Vui lòng thử lại sau.');
    } finally {
      pending.current = false;
      setAction(null);
    }
  }

  return (
    <div className="al-recovery-form">
      <div className="card-title-group">
        <Title level={3}>{LABELS.AUTH.RESET_TITLE}</Title>
        <Text type="secondary">{REQUEST_NOTICE}</Text>
        <Text strong>{email}</Text>
        <Link to={ROUTES.AUTH.FORGOT_PASSWORD} replace>Đổi email</Link>
      </div>

      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
      <Form form={form} layout="vertical" onFinish={onFinish} size="large">
        <Form.Item
          label="Mã xác nhận"
          name="otp"
          rules={[{ required: true, pattern: /^[0-9]{6}$/, message: 'Nhập mã xác nhận gồm 6 chữ số.' }]}
        >
          <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
        </Form.Item>
        <Form.Item
          label="Mật khẩu mới"
          name="newPassword"
          rules={[
            { required: true, whitespace: true, min: 8, message: 'Nhập mật khẩu mới có ít nhất 8 ký tự.' },
            { validator: (_, value) => !value || new TextEncoder().encode(value).length <= 72
              ? Promise.resolve()
              : Promise.reject(new Error('Mật khẩu không được vượt quá 72 byte UTF-8.')) },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label="Xác nhận mật khẩu mới"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu mới.' },
            ({ getFieldValue }) => ({
              validator: (_, value) => !value || value === getFieldValue('newPassword')
                ? Promise.resolve()
                : Promise.reject(new Error('Mật khẩu xác nhận không khớp.')),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={action === 'confirm'} disabled={action === 'resend'}>
          Lưu mật khẩu mới
        </Button>
        <Button type="link" htmlType="button" block onClick={resend} loading={action === 'resend'} disabled={seconds > 0 || action === 'confirm'}>
          {seconds > 0 ? `Gửi lại mã sau ${seconds} giây` : 'Gửi lại mã'}
        </Button>
      </Form>

      <div className="card-footer-text">
        <Link to={ROUTES.AUTH.LOGIN}>Quay lại đăng nhập</Link>
      </div>
    </div>
  );
}
