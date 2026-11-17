import React from 'react';
import { Form, Input, Button, Typography } from 'antd';
import { ArrowLeftOutlined, MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { LABELS } from '../../constants/labels';
import { ROUTES } from '../../constants/routes';

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const [form] = Form.useForm();

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
        name="forgot_form"
        layout="vertical"
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
            disabled
          >
            {LABELS.AUTH.SUBMIT_FORGOT}
          </Button>
        </Form.Item>
      </Form>

      <p className="al-recovery-note" role="status">Chức năng gửi email khôi phục hiện chưa khả dụng.</p>

      <div className="card-footer-text">
        <Link to={ROUTES.AUTH.LOGIN}>
          <ArrowLeftOutlined aria-hidden="true" /> Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
