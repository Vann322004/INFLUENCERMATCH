import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox, message, Spin } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { adminAuthService } from '../../mock/adminData';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const result = adminAuthService.login(values.email, values.password);
    if (result.success) {
      message.success('Đăng nhập thành công!');
      navigate(ADMIN_ROUTES.DASHBOARD);
    } else {
      message.error(result.message);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Glow Effects */}
      <div style={{
        position: 'absolute', top: '20%', left: '15%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '10%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* Grid pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Login Card */}
      <div
        style={{
          width: 420,
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 24,
          padding: '40px 36px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo & Branding */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              borderRadius: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            }}
          >
            <SafetyCertificateOutlined style={{ fontSize: 30, color: '#fff' }} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 22, color: '#F1F5F9', letterSpacing: 0.5 }}>
            Admin Panel
          </div>
          <div style={{ color: '#6366F1', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginTop: 4 }}>
            INFLUENCERMATCH SYSTEM
          </div>
          <div
            style={{
              marginTop: 10,
              padding: '5px 12px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 20,
              display: 'inline-block',
              color: '#A5B4FC',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            🔐 Khu vực dành riêng cho quản trị viên
          </div>
        </div>

        {/* Login Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          requiredMark={false}
          initialValues={{ email: 'admin@influencermatch.vn', password: 'admin123' }}
        >
          <Form.Item
            name="email"
            label={<span style={{ color: '#CBD5E1', fontWeight: 600, fontSize: 13 }}>Email Admin</span>}
            rules={[{ required: true, message: 'Vui lòng nhập email' }]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#6366F1' }} />}
              placeholder="admin@influencermatch.vn"
              size="large"
              style={{
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 12,
                color: '#F1F5F9',
                height: 48,
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: '#CBD5E1', fontWeight: 600, fontSize: 13 }}>Mật khẩu</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            style={{ marginBottom: 12 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#6366F1' }} />}
              placeholder="••••••••"
              size="large"
              iconRender={(visible) => visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
              style={{
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 12,
                color: '#F1F5F9',
                height: 48,
              }}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox style={{ color: '#94A3B8', fontSize: 12 }}>Ghi nhớ đăng nhập</Checkbox>
            </Form.Item>
          </div>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              icon={loading ? <Spin size="small" /> : <ThunderboltOutlined />}
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                border: 'none',
                borderRadius: 12,
                height: 50,
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: 0.5,
                boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
              }}
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập Admin'}
            </Button>
          </Form.Item>
        </Form>

        {/* Hint */}
        <div
          style={{
            marginTop: 20,
            padding: '10px 14px',
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 10,
            textAlign: 'center',
          }}
        >
          <div style={{ color: '#94A3B8', fontSize: 11, fontWeight: 500 }}>
            Demo: <span style={{ color: '#A5B4FC', fontWeight: 700 }}>admin@influencermatch.vn</span> / <span style={{ color: '#A5B4FC', fontWeight: 700 }}>admin123</span>
          </div>
        </div>

        {/* Back to Brand */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a
            onClick={() => navigate('/login')}
            style={{ color: '#475569', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
          >
            ← Về trang đăng nhập Brand
          </a>
        </div>
      </div>
    </div>
  );
}
