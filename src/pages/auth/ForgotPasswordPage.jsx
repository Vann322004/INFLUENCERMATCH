import React, { useRef, useState } from 'react';
import { Alert, Form, Input, Button, Typography } from 'antd';
import { ArrowLeftOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { LABELS } from '../../constants/labels';
import { ROUTES } from '../../constants/routes';
import { authService } from '../../services/api/authService';

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const pending = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function onFinish({ email }) {
    if (pending.current) return;
    pending.current = true;
    const normalizedEmail = email.trim().toLowerCase();
    setSubmitting(true);
    setError('');
    try {
      await authService.requestPasswordReset(normalizedEmail);
      navigate(ROUTES.AUTH.RESET_PASSWORD, {
        state: { email: normalizedEmail, resendAt: Date.now() + 60_000 },
      });
    } catch {
      setError('Chưa thể gửi mã xác nhận. Vui lòng thử lại sau.');
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="al-recovery-form">
      <div className="card-title-group">
        <Title level={3}>
          {LABELS.AUTH.FORGOT_TITLE}
        </Title>
        <Text type="secondary">
          Khôi phục quyền truy cập tài khoản bằng email đã đăng ký.
        </Text>
      </div>

      <Form
        form={form}
        onFinish={onFinish}
        name="forgot_form"
        layout="vertical"
        requiredMark={false}
        size="large"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            { type: 'email', transform: (value) => value?.trim(), message: 'Email không hợp lệ!' },
          ]}
        >
          <Input
            maxLength={255}
            prefix={<MailOutlined />}
            placeholder="Email của bạn"
            aria-label="Email đã đăng ký"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item className="al-recovery-submit">
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={submitting}
          >
            Gửi mã xác nhận
          </Button>
        </Form.Item>
      </Form>

      {error && <Alert className="al-recovery-note" type="error" showIcon title={error} />}

      <div className="card-footer-text">
        <Link to={ROUTES.AUTH.LOGIN}>
          <ArrowLeftOutlined aria-hidden="true" /> Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
