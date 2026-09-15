import React from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { LABELS } from '../../constants/labels';
import { ROUTES } from '../../constants/routes';

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    message.success(`Yêu cầu khôi phục đã được gửi tới ${values.email}`);
  };

  return (
    <div>
      <div className="card-title-group">
        <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
          {LABELS.AUTH.FORGOT_TITLE}
        </Title>
        <Text type="secondary" style={{ fontSize: 13.5 }}>
          {LABELS.AUTH.FORGOT_SUBTITLE}
        </Text>
      </div>

      <Form
        form={form}
        name="forgot_form"
        layout="vertical"
        onFinish={onFinish}
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
            placeholder={LABELS.AUTH.EMAIL_OR_PHONE_PLACEHOLDER}
          />
        </Form.Item>

        <Form.Item style={{ marginTop: 20, marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            icon={<ArrowRightOutlined />}
          >
            {LABELS.AUTH.SUBMIT_FORGOT}
          </Button>
        </Form.Item>
      </Form>

      <div className="card-footer-text">
        <Link to={ROUTES.AUTH.LOGIN} style={{ fontWeight: 700, color: '#8B5CF6' }}>
          ← Quay lại {LABELS.AUTH.LOGIN_NOW_LINK}
        </Link>
      </div>
    </div>
  );
}
