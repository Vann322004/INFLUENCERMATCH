import { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, Space, Tag } from 'antd';
import { LockOutlined, ShopOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { getErrorMessage } from '../../services/apiClient';
import { clearAuthSession, getStoredUser } from '../../services/authSession';

type UserProfile = Awaited<ReturnType<typeof authService.getMe>>;

const ROLE_LABELS: Record<string, string> = {
  BRAND: 'Thương hiệu (Brand)',
  CREATOR: 'Nhà sáng tạo (Creator)',
  DATA_MANAGER: 'Quản lý dữ liệu',
  ADMIN: 'Quản trị viên',
};

export default function UserProfilePage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [profileForm] = Form.useForm<{ fullName: string }>();
  const [passwordForm] = Form.useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>();
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser() as UserProfile | null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let active = true;
    void authService.getMe()
      .then((data) => {
        if (!active) return;
        setUser(data);
        profileForm.setFieldsValue({ fullName: data.fullName || '' });
      })
      .catch(() => {
        // Fallback to stored user already initialized
      });
    if (user?.fullName) {
      profileForm.setFieldsValue({ fullName: user.fullName });
    }
    return () => {
      active = false;
    };
  }, [profileForm]);

  const handleSaveProfile = async (values: { fullName: string }) => {
    setSavingProfile(true);
    try {
      const updated = await authService.updateMe(values.fullName.trim());
      setUser(updated);
      profileForm.setFieldsValue({ fullName: updated.fullName });
      message.success('Đã cập nhật thông tin cá nhân.');
    } catch (error) {
      message.error(getErrorMessage(error, 'Không thể cập nhật thông tin cá nhân.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    setSavingPassword(true);
    try {
      await authService.changePassword(values.currentPassword, values.newPassword);
      clearAuthSession();
      message.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      navigate('/login', { replace: true });
    } catch (error) {
      message.error(getErrorMessage(error, 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.'));
    } finally {
      setSavingPassword(false);
    }
  };

  const role = String(user?.role || '').toUpperCase();

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Thông tin cá nhân</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#64748B' }}>
            Quản lý thông tin tài khoản đăng nhập và bảo mật mật khẩu của bạn
          </p>
        </div>
        {role === 'BRAND' && (
          <Button icon={<ShopOutlined />} onClick={() => navigate('/brand-profile')}>
            Đi tới Hồ sơ Thương hiệu
          </Button>
        )}
      </div>

      <Card
        style={{ borderRadius: 14, border: '1px solid #E2E8F0' }}
        styles={{ header: { background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' } }}
        title={
          <Space>
            <UserOutlined style={{ color: '#7C3AED' }} />
            <span>Hồ sơ tài khoản</span>
          </Space>
        }
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          <Tag color="purple" style={{ margin: 0, fontWeight: 600 }}>
            {ROLE_LABELS[role] || role || 'Người dùng'}
          </Tag>
          <Tag color={user?.status === 'ACTIVE' ? 'success' : 'default'} style={{ margin: 0 }}>
            {user?.status === 'ACTIVE' ? 'Đang hoạt động' : user?.status || '—'}
          </Tag>
        </div>

        <Form form={profileForm} layout="vertical" onFinish={(v) => void handleSaveProfile(v)}>
          <Form.Item label="Email đăng nhập">
            <Input value={user?.email || ''} disabled style={{ color: '#0F172A', background: '#F8FAFC' }} />
          </Form.Item>

          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[
              { required: true, whitespace: true, message: 'Vui lòng nhập họ và tên.' },
              { max: 120, message: 'Họ và tên tối đa 120 ký tự.' },
            ]}
          >
            <Input placeholder="Nhập họ và tên hiển thị" maxLength={120} />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={savingProfile}>
            Lưu thông tin cá nhân
          </Button>
        </Form>
      </Card>

      <Card
        style={{ borderRadius: 14, border: '1px solid #E2E8F0' }}
        styles={{ header: { background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' } }}
        title={
          <Space>
            <LockOutlined style={{ color: '#7C3AED' }} />
            <span>Đổi mật khẩu</span>
          </Space>
        }
      >
        <Form form={passwordForm} layout="vertical" onFinish={(v) => void handleChangePassword(v)}>
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại.' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu hiện tại" maxLength={72} />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới.' },
              { min: 8, message: 'Mật khẩu mới tối thiểu 8 ký tự.' },
            ]}
          >
            <Input.Password placeholder="Tối thiểu 8 ký tự" maxLength={72} />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới.' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp.'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" maxLength={72} />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={savingPassword}>
            Đổi mật khẩu
          </Button>
        </Form>
      </Card>
    </div>
  );
}
