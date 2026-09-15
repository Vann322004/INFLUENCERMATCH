import React from 'react';
import { Form, Input, Button, Checkbox, Divider, Row, Col, Typography, message } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  ArrowRightOutlined,
  GoogleOutlined,
  FacebookFilled,
  AppleFilled
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { LABELS } from '../../constants/labels';
import { ROUTES } from '../../constants/routes';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = (values) => {
    message.success(`Đăng nhập thành công! Chào mừng ${values.username}`);
    // Navigate to dashboard if needed
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

      {/* Ant Design Form */}
      <Form
        form={form}
        name="login_form"
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ remember: true }}
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

        <Form.Item style={{ marginTop: 20, marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            icon={<ArrowRightOutlined />}
          >
            {LABELS.AUTH.SUBMIT_LOGIN}
          </Button>
        </Form.Item>
      </Form>

      {/* Divider */}
      <Divider style={{ color: '#94A3B8', fontSize: 12, margin: '22px 0' }}>
        {LABELS.AUTH.OR_CONTINUE_WITH}
      </Divider>

      {/* Social Logins */}
      <Row gutter={12}>
        <Col span={8}>
          <Button
            block
            onClick={() => handleSocialLogin('Google')}
            icon={<GoogleOutlined style={{ color: '#4285F4' }} />}
          >
            Google
          </Button>
        </Col>
        <Col span={8}>
          <Button
            block
            onClick={() => handleSocialLogin('Facebook')}
            icon={<FacebookFilled style={{ color: '#1877F2' }} />}
          >
            Facebook
          </Button>
        </Col>
        <Col span={8}>
          <Button
            block
            onClick={() => handleSocialLogin('Apple')}
            icon={<AppleFilled style={{ color: '#000000' }} />}
          >
            Apple
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
