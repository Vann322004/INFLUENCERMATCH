import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Avatar, Tag, Descriptions, Card, Row, Col,
  Typography, Space, Badge, Divider,
} from 'antd';
import {
  ArrowLeftOutlined, LockOutlined, UnlockOutlined,
  EditOutlined, MailOutlined, CalendarOutlined, GlobalOutlined,
} from '@ant-design/icons';
import { MOCK_ACCOUNTS, type AccountStatus, type AccountRole } from '../../../mock/adminData';
import SecurityActivityPanel from './components/SecurityActivityPanel';
import LockUnlockModal from './components/LockUnlockModal';

const { Title, Text } = Typography;

const STATUS_CONFIG: Record<AccountStatus, { label: string; color: string }> = {
  active:   { label: 'Hoạt động', color: 'success' },
  locked:   { label: 'Đã khóa',   color: 'error' },
  inactive: { label: 'Không HĐ',  color: 'default' },
  pending:  { label: 'Chờ duyệt', color: 'warning' },
};

const ROLE_COLOR: Record<AccountRole, string> = {
  super_admin: '#8B5CF6',
  admin:       '#6366F1',
  brand:       '#0EA5E9',
  creator:     '#10B981',
};

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState(MOCK_ACCOUNTS);
  const [lockOpen, setLockOpen] = useState(false);
  const [lockAction, setLockAction] = useState<'lock' | 'unlock' | 'restore'>('lock');

  const account = accounts.find(a => a.id === id);

  if (!account) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <Text style={{ color: '#94A3B8', fontSize: 16 }}>Không tìm thấy tài khoản.</Text>
        <br />
        <Button style={{ marginTop: 16 }} onClick={() => navigate('/admin/accounts')}>← Quay lại</Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[account.status];
  const roleColor = ROLE_COLOR[account.role];

  const handleLockDone = (accId: string, newStatus: AccountStatus) => {
    setAccounts(prev => prev.map(a => a.id === accId ? { ...a, status: newStatus } : a));
    setLockOpen(false);
  };

  const openLock = (action: 'lock' | 'unlock' | 'restore') => {
    setLockAction(action);
    setLockOpen(true);
  };

  return (
    <div>
      {/* Back Button */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/admin/accounts')}
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', marginBottom: 20 }}
      >
        Quay lại danh sách
      </Button>

      <Row gutter={[20, 20]}>
        {/* Left — Profile Card */}
        <Col xs={24} lg={8}>
        <Card
            bordered={false}
            bodyStyle={{ padding: '28px 24px' }}
            style={{
              borderRadius: 16,
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}
          >
            <Avatar
              src={account.avatar}
              size={80}
              style={{ border: '3px solid rgba(99,102,241,0.4)', marginBottom: 14 }}
            />
            <Title level={4} style={{ color: '#0F172A', margin: '0 0 4px', fontWeight: 800 }}>
              {account.name}
            </Title>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              <Tag
                style={{
                  background: roleColor + '18',
                  border: `1px solid ${roleColor}40`,
                  color: roleColor,
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: 11,
                }}
              >
                {account.roleLabel || account.role}
              </Tag>
              <Badge status={statusCfg.color as any} text={
                <span style={{ color: '#94A3B8', fontSize: 12 }}>{statusCfg.label}</span>
              } />
            </div>

            <Divider style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

            <div style={{ textAlign: 'left' }}>
              {[
                { icon: <MailOutlined />, label: 'Email', value: account.email },
                { icon: <CalendarOutlined />, label: 'Tham gia', value: account.joinedAt },
                { icon: <GlobalOutlined />, label: 'IP cuối', value: account.ip },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ color: '#6366F1', fontSize: 14, width: 18 }}>{item.icon}</span>
                  <div>
                    <div style={{ color: '#64748B', fontSize: 10, fontWeight: 600, lineHeight: 1 }}>{item.label}</div>
                    <div style={{ color: '#334155', fontSize: 12.5, fontWeight: 600 }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <Divider style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '14px 0' }} />

            {/* Action Buttons */}
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                block
                icon={<EditOutlined />}
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818CF8', fontWeight: 600 }}
              >
                Chỉnh sửa thông tin
              </Button>
              {account.status === 'active' ? (
                <Button
                  block
                  icon={<LockOutlined />}
                  onClick={() => openLock('lock')}
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171', fontWeight: 600 }}
                >
                  Khóa tài khoản
                </Button>
              ) : account.status === 'locked' ? (
                <Button
                  block
                  icon={<UnlockOutlined />}
                  onClick={() => openLock('unlock')}
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34D399', fontWeight: 600 }}
                >
                  Mở khóa
                </Button>
              ) : (
                <Button
                  block
                  icon={<UnlockOutlined />}
                  onClick={() => openLock('restore')}
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#FBBF24', fontWeight: 600 }}
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
                bordered={false}
                bodyStyle={{ padding: '20px 22px' }}
                style={{
                  borderRadius: 16,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                }}
              >
                <Title level={5} style={{ color: '#0F172A', fontWeight: 700, margin: '0 0 16px' }}>
                  Thông tin tài khoản
                </Title>
                <Descriptions
                  column={2}
                  size="small"
                  labelStyle={{ color: '#64748B', fontWeight: 600, fontSize: 12 }}
                  contentStyle={{ color: '#334155', fontWeight: 600, fontSize: 13 }}
                  colon={false}
                >
                  <Descriptions.Item label="ID">{account.id}</Descriptions.Item>
                  <Descriptions.Item label="Tên hiển thị">{account.name}</Descriptions.Item>
                  <Descriptions.Item label="Email">{account.email}</Descriptions.Item>
                  <Descriptions.Item label="Vai trò">{account.roleLabel || account.role}</Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    <Tag color={statusCfg.color}>{statusCfg.label}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tham gia">{account.joinedAt}</Descriptions.Item>
                  <Descriptions.Item label="Đăng nhập cuối">{account.lastLogin}</Descriptions.Item>
                  <Descriptions.Item label="IP đăng nhập cuối">{account.ip}</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            {/* Security Activity */}
            <Col span={24}>
              <Card
                bordered={false}
                bodyStyle={{ padding: '20px 22px' }}
                style={{
                  borderRadius: 16,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
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
