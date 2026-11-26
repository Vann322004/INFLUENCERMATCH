import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  Button, Avatar, Tag, Descriptions, Card, Row, Col,
  Typography, Space, Badge, Divider, Spin,
} from 'antd';
import {
  ArrowLeftOutlined, LockOutlined, UnlockOutlined,
  EditOutlined, MailOutlined, CalendarOutlined, GlobalOutlined,
} from '@ant-design/icons';
import { adminService } from '../../../services/api/adminService';
import type { AdminUser, AdminUserStatus, AdminUserRole } from '../../../types/api/admin.types';
import SecurityActivityPanel from './components/SecurityActivityPanel';
import LockUnlockModal from './components/LockUnlockModal';

const { Title, Text } = Typography;

const STATUS_CONFIG: Record<AdminUserStatus, { label: string; color: string }> = {
  active:   { label: 'Hoạt động', color: 'success' },
  locked:   { label: 'Đã khóa',   color: 'error' },
  inactive: { label: 'Không HĐ',  color: 'default' },
  pending:  { label: 'Chờ duyệt', color: 'warning' },
};

const ROLE_COLOR: Record<AdminUserRole, string> = {
  super_admin: '#7C3AED',
  admin:       '#7C3AED',
  manager:     '#06B6D4',
  brand:       '#0EA5E9',
  creator:     '#10B981',
};

const ROLE_LABEL_MAP: Record<AdminUserRole, string> = {
  super_admin: 'Quản trị viên cấp cao',
  admin:       'Quản trị viên',
  manager:     'Quản lý',
  brand:       'Doanh nghiệp',
  creator:     'Nhà sáng tạo',
};

export default function AccountDetailPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const stateId = (location.state as { accountId?: string } | null)?.accountId;
  const id = stateId || paramId || sessionStorage.getItem('im.admin.selectedAccountId') || '';
  const [account, setAccount] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [lockOpen, setLockOpen] = useState(false);
  const [lockAction, setLockAction] = useState<'lock' | 'unlock' | 'restore'>('lock');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    sessionStorage.setItem('im.admin.selectedAccountId', id);
    if (paramId) {
      navigate('/admin/accounts/detail', { replace: true, state: { accountId: id } });
    }
    setLoading(true);
    adminService.getUserById(id)
      .then(setAccount)
      .catch(() => setAccount(null))
      .finally(() => setLoading(false));
  }, [id, paramId, navigate]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!account) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <Text style={{ color: '#94A3B8', fontSize: 16 }}>Không tìm thấy tài khoản.</Text>
        <br />
        <Button style={{ marginTop: 16 }} onClick={() => navigate('/admin/accounts')}>← Quay lại</Button>
      </div>
    );
  }

  const statusCfg = (account.status && STATUS_CONFIG[account.status]) || STATUS_CONFIG['active'];
  const roleColor = (account.role && ROLE_COLOR[account.role]) || '#7C3AED';

  const handleLockDone = (accId: string, newStatus: AdminUserStatus) => {
    setAccount(prev => prev ? { ...prev, status: newStatus } : prev);
    setLockOpen(false);
  };

  const openLock = (action: 'lock' | 'unlock' | 'restore') => {
    setLockAction(action);
    setLockOpen(true);
  };

  return (
    <div style={{ color: '#0F172A' }}>
      {/* Back Button */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/admin/accounts')}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          color: '#0F172A',
          fontWeight: 600,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        Quay lại danh sách
      </Button>

      <Row gutter={[20, 20]}>
        {/* Left — Profile Card */}
        <Col xs={24} lg={8}>
          <Card
            variant="borderless"
            styles={{ body: { padding: '28px 24px' } }}
            style={{
              borderRadius: 14,
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              textAlign: 'center',
            }}
          >
            <Avatar
              src={account.avatar}
              size={80}
              style={{ border: '3px solid #DDD6FE', marginBottom: 14 }}
            />
            <Title level={4} style={{ color: '#0F172A', margin: '0 0 6px', fontWeight: 800 }}>
              {account.name}
            </Title>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <Tag
                style={{
                  background: roleColor + '18',
                  border: `1px solid ${roleColor}40`,
                  color: roleColor,
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: 11,
                  marginInlineEnd: 0,
                }}
              >
                {account.roleLabel || ROLE_LABEL_MAP[account.role] || account.role}
              </Tag>
              <Badge status={statusCfg.color as any} text={
                <span style={{ color: '#475569', fontSize: 12, fontWeight: 600 }}>{statusCfg.label}</span>
              } />
            </div>

            <Divider style={{ borderColor: '#F1F5F9', margin: '12px 0' }} />

            <div style={{ textAlign: 'left' }}>
              {[
                { icon: <MailOutlined />, label: 'Email', value: account.email },
                { icon: <CalendarOutlined />, label: 'Tham gia', value: account.joinedAt },
                { icon: <GlobalOutlined />, label: 'IP cuối', value: account.ip },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ color: '#7C3AED', fontSize: 14, width: 18, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#64748B', fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{item.label}</div>
                    <div style={{ color: '#1E293B', fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere' }}>{item.value || '—'}</div>
                  </div>
                </div>
              ))}
            </div>

            <Divider style={{ borderColor: '#F1F5F9', margin: '14px 0' }} />

            {/* Action Buttons */}
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                block
                icon={<EditOutlined />}
                style={{ background: '#F3E8FF', border: '1px solid #DDD6FE', color: '#6D28D9', fontWeight: 700, borderRadius: 8, height: 38 }}
              >
                Chỉnh sửa thông tin
              </Button>
              {account.status === 'active' ? (
                <Button
                  block
                  icon={<LockOutlined />}
                  onClick={() => openLock('lock')}
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontWeight: 700, borderRadius: 8, height: 38 }}
                >
                  Khóa tài khoản
                </Button>
              ) : account.status === 'locked' ? (
                <Button
                  block
                  icon={<UnlockOutlined />}
                  onClick={() => openLock('unlock')}
                  style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', fontWeight: 700, borderRadius: 8, height: 38 }}
                >
                  Mở khóa
                </Button>
              ) : (
                <Button
                  block
                  icon={<UnlockOutlined />}
                  onClick={() => openLock('restore')}
                  style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#D97706', fontWeight: 700, borderRadius: 8, height: 38 }}
                >
                  Khôi phục tài khoản
                </Button>
              )}
            </Space>
          </Card>
        </Col>

        {/* Right — Details + Security */}
        <Col xs={24} lg={16}>
          <Row gutter={[0, 20]}>
            {/* Account Info */}
            <Col span={24}>
              <Card
                variant="borderless"
                styles={{ body: { padding: '22px 24px' } }}
                style={{
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                }}
              >
                <Title level={5} style={{ color: '#0F172A', fontWeight: 700, margin: '0 0 16px' }}>
                  Thông tin tài khoản
                </Title>
                <Descriptions
                  column={{ xs: 1, sm: 2 }}
                  size="small"
                  styles={{
                    label: { color: '#64748B', fontWeight: 600, fontSize: 12 },
                    content: { color: '#1E293B', fontWeight: 600, fontSize: 13 },
                  }}
                  colon={false}
                >
                  <Descriptions.Item label="Tên hiển thị">{account.name}</Descriptions.Item>
                  <Descriptions.Item label="Email">{account.email}</Descriptions.Item>
                  <Descriptions.Item label="Vai trò">{account.roleLabel || ROLE_LABEL_MAP[account.role] || account.role}</Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    <Tag color={statusCfg.color} style={{ marginInlineEnd: 0, fontWeight: 600 }}>{statusCfg.label}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tham gia">{account.joinedAt || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Đăng nhập cuối">{account.lastLogin || '—'}</Descriptions.Item>
                  <Descriptions.Item label="IP đăng nhập cuối">{account.ip || '—'}</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            {/* Security Activity */}
            <Col span={24}>
              <Card
                variant="borderless"
                styles={{ body: { padding: '22px 24px' } }}
                style={{
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                }}
              >
                <SecurityActivityPanel userId={account.id} />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Lock/Unlock Modal */}
      {lockOpen && (
        <LockUnlockModal
          open={lockOpen}
          account={account}
          action={lockAction}
          onClose={() => setLockOpen(false)}
          onDone={handleLockDone}
        />
      )}
    </div>
  );
}
