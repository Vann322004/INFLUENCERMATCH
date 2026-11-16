import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Row, Col, message } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { authService } from '../../services/api/authService';
import { getErrorMessage } from '../../services/apiClient';
import './RegisterPage.css';

export default function RegisterPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timeout = setTimeout(() => setResendCooldown(value => value - 1), 1000);
    return () => clearTimeout(timeout);
  }, [resendCooldown]);

  // Thêm class để card mở rộng vừa vặn cho layout 2 cột đều nhau
  React.useEffect(() => {
    const parentCard = document.querySelector('.al-form-card');
    if (parentCard) {
      parentCard.classList.add('al-form-card-register');
      return () => parentCard.classList.remove('al-form-card-register');
    }
  }, []);

  const onFinish = async (values) => {
    if (loading) return;
    setLoading(true);
    try {
      const policies = await authService.getPolicies();
      await authService.register({
        fullName: values.fullName?.trim(),
        email: values.email?.trim(),
        phoneNumber: values.phone?.trim(),
        password: values.password,
        policyAcceptance: {
          acceptedTerms: values.agreement === true,
          acceptedPrivacy: values.agreement === true,
          termsVersion: policies.termsVersion,
          privacyVersion: policies.privacyVersion,
        },
      });

      setVerificationEmail(values.email.trim());
      setResendCooldown(60);
      message.success('Đã tạo tài khoản. Vui lòng nhập mã xác minh được gửi đến email.');
    } catch (error) {
      message.error(getErrorMessage(error, 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async ({ otp }) => {
    if (loading) return;
    setLoading(true);
    try {
      await authService.verifyEmail(verificationEmail, otp);
      message.success('Xác minh email thành công! Bạn có thể đăng nhập.');
      navigate(ROUTES.AUTH.LOGIN || '/login');
    } catch (error) {
      message.error(getErrorMessage(error, 'Không xác minh được email. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (loading || resendCooldown > 0) return;
    setLoading(true);
    try {
      await authService.resendVerification(verificationEmail);
      setResendCooldown(60);
      message.success('Yêu cầu gửi lại mã đã được tiếp nhận. Vui lòng kiểm tra email.');
    } catch (error) {
      message.error(getErrorMessage(error, 'Không gửi lại được mã xác minh.'));
    } finally {
      setLoading(false);
    }
  };

  if (verificationEmail) {
    return (
      <div className="register-card-inner">
        <div className="register-heading-group">
          <h2 className="register-title">Xác minh email</h2>
          <p className="register-subtitle">Nhập mã 6 chữ số gửi đến {verificationEmail}. Hãy kiểm tra cả thư rác.</p>
        </div>
        <Form layout="vertical" onFinish={verifyEmail} requiredMark={false}>
          <Form.Item name="otp" label="Mã xác minh" rules={[
            { required: true, message: 'Vui lòng nhập mã xác minh.' },
            { pattern: /^\d{6}$/, message: 'Mã xác minh gồm 6 chữ số.' },
          ]}>
            <Input autoComplete="one-time-code" inputMode="numeric" maxLength={6} disabled={loading} className="luxe-input" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} className="luxe-primary-btn">Xác minh email</Button>
          <Button type="link" onClick={resendVerification} disabled={loading || resendCooldown > 0}>
            {resendCooldown > 0 ? `Gửi lại mã sau ${resendCooldown}s` : 'Gửi lại mã'}
          </Button>
        </Form>
        <div className="register-login-banner">
          <Link to={ROUTES.AUTH.LOGIN || '/login'} className="link">Về trang đăng nhập</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="register-card-inner">
      {/* ── Heading ── */}
      <div className="register-heading-group">
        <h2 className="register-title">Đăng ký tài khoản</h2>
        <p className="register-subtitle">Dành cho Doanh nghiệp & Thương hiệu (Brand / SME)</p>
      </div>

      <Form
        form={form}
        name="brand_register_form"
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        size="large"
        autoComplete="off"
      >
        <Row gutter={[12, 0]}>
          {/* Họ và tên */}
          <Col span={24}>
            <Form.Item
              name="fullName"
              label="Họ tên"
              rules={[
                { required: true, message: 'Vui lòng nhập họ và tên!' },
                { whitespace: true, message: 'Họ và tên không được để trống!' },
                { max: 150, message: 'Tối đa 150 ký tự!' },
              ]}
            >
              <Input
                id="register-fullname"
                placeholder="VD: Nguyễn Văn A"
                disabled={loading}
                className="luxe-input"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[12, 0]}>
          {/* Email doanh nghiệp */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="email"
              label="Email doanh nghiệp"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không đúng định dạng!' },
              ]}
            >
              <Input
                id="register-email"
                placeholder="contact@brand.com"
                autoComplete="email"
                disabled={loading}
                className="luxe-input"
              />
            </Form.Item>
          </Col>

          {/* Số điện thoại */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại!' },
                {
                  pattern: /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/,
                  message: 'Số điện thoại không hợp lệ (10 số)!',
                },
              ]}
            >
              <Input
                id="register-phone"
                placeholder="0912345678"
                autoComplete="tel"
                disabled={loading}
                className="luxe-input"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[12, 0]}>
          {/* Mật khẩu */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 8, message: 'Tối thiểu 8 ký tự!' },
                {
                  pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])/,
                  message: 'Cần chữ hoa, số & ký tự đặc biệt!',
                },
              ]}
            >
              <Input.Password
                id="register-password"
                placeholder="Mật khẩu (≥ 8 ký tự)"
                autoComplete="new-password"
                disabled={loading}
                className="luxe-input"
              />
            </Form.Item>
          </Col>

          {/* Xác nhận mật khẩu */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password
                id="register-confirm-password"
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
                disabled={loading}
                className="luxe-input"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Checkbox đồng ý điều khoản */}
        <Form.Item
          name="agreement"
          valuePropName="checked"
          className="register-checkbox-item"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(new Error('Vui lòng đồng ý với điều khoản để tiếp tục!')),
            },
          ]}
        >
          <Checkbox className="luxe-checkbox">
            Tôi đồng ý với{' '}
            <a href="#terms" className="register-legal-link" onClick={(e) => e.preventDefault()}>
              Điều khoản dịch vụ
            </a>{' '}
            và{' '}
            <a href="#privacy" className="register-legal-link" onClick={(e) => e.preventDefault()}>
              Chính sách bảo mật
            </a>
          </Checkbox>
        </Form.Item>

        {/* Nút Tạo tài khoản */}
        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            disabled={loading}
            className="luxe-primary-btn"
          >
            <span>{loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}</span>
            {!loading && <ArrowRightOutlined className="btn-arrow-icon" />}
          </Button>
        </Form.Item>
      </Form>

      {/* Footer link quay lại Đăng nhập */}
      <div className="register-login-banner">
        <span className="prompt">Đã có tài khoản?</span>
        <Link to={ROUTES.AUTH.LOGIN || '/login'} className="link">
          <span>Đăng nhập ngay</span>
          <ArrowRightOutlined style={{ fontSize: 11, marginLeft: 4 }} />
        </Link>
      </div>
    </div>
  );
}
