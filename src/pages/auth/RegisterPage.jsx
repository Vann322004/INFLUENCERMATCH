import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { LABELS } from '../../constants/labels';
import { ROUTES } from '../../constants/routes';
import { authService } from '../../services/api/authService';
import { getErrorMessage } from '../../services/apiClient';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNavigateLogin = (e) => {
    e.preventDefault();
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      navigate(ROUTES.AUTH.LOGIN || '/login');
    }, 240);
  };

  const onFinish = async (values) => {
    if (loading) return;
    setLoading(true);
    try {
      await authService.register({
        fullName: values.fullName?.trim(),
        email: values.email?.trim(),
        password: values.password,
      });

      message.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      navigate(ROUTES.AUTH.LOGIN || '/login');
    } catch (error) {
      message.error(getErrorMessage(error, 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-form-container ${isTransitioning ? 'al-form-slide-exit-to-right' : 'al-form-slide-enter'}`}>
      {/* Title & Subtitle */}
      <div className="card-title-group">
        <Title level={2} className="al-card-title">
          {LABELS.AUTH.REGISTER_TITLE}
        </Title>
        <Text className="al-card-subtitle">
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
          style={{ marginBottom: 12 }}
        >
          <Input
            id="register-fullname"
            prefix={<UserOutlined className="al-field-icon" aria-hidden="true" />}
            placeholder={LABELS.AUTH.FULL_NAME_PLACEHOLDER}
            disabled={loading}
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            { type: 'email', message: 'Email không hợp lệ!' },
          ]}
          style={{ marginBottom: 12 }}
        >
          <Input
            id="register-email"
            prefix={<MailOutlined className="al-field-icon" aria-hidden="true" />}
            placeholder={LABELS.AUTH.EMAIL_OR_PHONE_PLACEHOLDER}
            autoComplete="email"
            disabled={loading}
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu!' },
            { min: 8, message: 'Mật khẩu phải có tối thiểu 8 ký tự!' },
          ]}
          style={{ marginBottom: 16 }}
        >
          <Input.Password
            id="register-password"
            prefix={<LockOutlined className="al-field-icon" aria-hidden="true" />}
            placeholder="Mật khẩu (tối thiểu 8 ký tự)"
            autoComplete="new-password"
            disabled={loading}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
            disabled={loading}
            icon={!loading && <ArrowRightOutlined aria-hidden="true" />}
            className="primary-login-btn"
          >
            {loading ? 'Đang tạo tài khoản...' : LABELS.AUTH.SUBMIT_REGISTER}
          </Button>
        </Form.Item>
      </Form>

      {/* Footer Login Link */}
      <div className="al-footer-register">
        <span className="al-footer-prompt">{LABELS.AUTH.HAS_ACCOUNT_PROMPT}</span>
        <a
          href={ROUTES.AUTH.LOGIN || '/login'}
          onClick={handleNavigateLogin}
          className="al-register-link"
          role="button"
          tabIndex={0}
        >
          {LABELS.AUTH.LOGIN_NOW_LINK}
        </a>
      </div>

      {/* Legal disclaimer */}
      <p className="al-legal-disclaimer">
        Bằng việc đăng ký, bạn đồng ý với{' '}
        <a href="#terms" className="al-legal-link">Điều khoản</a> và{' '}
        <a href="#privacy" className="al-legal-link">Chính sách bảo mật</a>
      </p>
    </div>
  );
}
