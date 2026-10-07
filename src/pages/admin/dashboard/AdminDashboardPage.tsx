import React from 'react';
import { Row, Col, Card, Typography, Tag, List, Avatar } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  ADMIN_KPI,
  MONTHLY_USER_GROWTH,
  REVENUE_BY_PLAN,
  RECENT_ACTIVITY,
} from '../../../mock/adminData';

const { Title, Text } = Typography;

// ── KPI Card ─────────────────────────────────────────
interface KpiCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: number;
  color: string;
  bg: string;
}

function KpiCard({ icon, title, value, trend, color, bg }: KpiCardProps) {
  const isUp = trend >= 0;
  return (
    <Card
      bordered={false}
      style={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(99,102,241,0.12)',
        borderRadius: 16,
        backdropFilter: 'blur(8px)',
        height: '100%',
      }}
      bodyStyle={{ padding: '20px 22px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, letterSpacing: 0.4 }}>
            {title}
          </Text>
          <div style={{ color: '#F1F5F9', fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginTop: 4 }}>
            {value}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
            {isUp
              ? <ArrowUpOutlined style={{ color: '#10B981', fontSize: 11 }} />
              : <ArrowDownOutlined style={{ color: '#EF4444', fontSize: 11 }} />}
            <Text style={{ color: isUp ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: 600 }}>
              {Math.abs(trend)}%
            </Text>
            <Text style={{ color: '#475569', fontSize: 11 }}>so với tháng trước</Text>
          </div>
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            background: bg,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

// ── Recharts Custom Tooltip ───────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1E293B',
      border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <div style={{ color: '#94A3B8', fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, fontWeight: 600, marginBottom: 2 }}>
          {p.name}: {p.value.toLocaleString('vi-VN')}
        </div>
      ))}
    </div>
  );
}

// ── Revenue Tooltip ───────────────────────────────────
function RevenueTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1E293B',
      border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <div style={{ color: '#94A3B8', fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ color: '#6366F1', fontWeight: 700 }}>
        {(payload[0]?.value / 1_000_000).toFixed(1)}M ₫
      </div>
      <div style={{ color: '#94A3B8', fontSize: 11 }}>{payload[1]?.value} users</div>
    </div>
  );
}

// ── Activity Icon ─────────────────────────────────────
const activityIcons: Record<string, React.ReactNode> = {
  user_register: <UserOutlined />,
  job_failed: <ThunderboltOutlined />,
  plan_upgrade: <RiseOutlined />,
  creator_added: <TeamOutlined />,
  refund: <DollarOutlined />,
  scoring_update: <ThunderboltOutlined />,
};

// ── Main Page ─────────────────────────────────────────
export default function AdminDashboardPage() {
  const kpiCards: KpiCardProps[] = [
    {
      icon: <TeamOutlined />,
      title: 'TỔNG NGƯỜI DÙNG',
      value: ADMIN_KPI.totalUsers.toLocaleString('vi-VN'),
      trend: ADMIN_KPI.totalUsersTrend,
      color: '#6366F1',
      bg: 'rgba(99,102,241,0.15)',
    },
    {
      icon: <UserOutlined />,
      title: 'CREATOR HOẠT ĐỘNG',
      value: ADMIN_KPI.activeCreators.toLocaleString('vi-VN'),
      trend: ADMIN_KPI.activeCreatorsTrend,
      color: '#10B981',
      bg: 'rgba(16,185,129,0.12)',
    },
    {
      icon: <DollarOutlined />,
      title: 'DOANH THU THÁNG NÀY',
      value: (ADMIN_KPI.revenueMonth / 1_000_000).toFixed(1) + 'M ₫',
      trend: ADMIN_KPI.revenueMonthTrend,
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.12)',
    },
    {
      icon: <ThunderboltOutlined />,
      title: 'JOBS ĐANG CHẠY',
      value: ADMIN_KPI.jobsRunning.toString(),
      trend: ADMIN_KPI.jobsRunningTrend,
      color: '#0EA5E9',
      bg: 'rgba(14,165,233,0.12)',
    },
  ];

  const sectionTitle = (text: string, sub?: string) => (
    <div style={{ marginBottom: 16 }}>
      <Title level={5} style={{ color: '#F1F5F9', margin: 0, fontWeight: 700, fontSize: 15 }}>{text}</Title>
      {sub && <Text style={{ color: '#64748B', fontSize: 12 }}>{sub}</Text>}
    </div>
  );

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <Title level={3} style={{ color: '#F1F5F9', margin: 0, fontWeight: 800 }}>
          Admin Dashboard
        </Title>
        <Text style={{ color: '#64748B', fontSize: 13 }}>
          Tổng quan hệ thống InfluencerMatch • {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {kpiCards.map((card, i) => (
          <Col xs={24} sm={12} xl={6} key={i}>
            <KpiCard {...card} />
          </Col>
        ))}
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* User Growth Line Chart */}
        <Col xs={24} xl={14}>
          <Card
            bordered={false}
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(99,102,241,0.12)',
              borderRadius: 16,
              height: '100%',
            }}
            bodyStyle={{ padding: '20px 22px' }}
          >
            {sectionTitle('Tăng trưởng người dùng', 'Theo tháng — Brand vs Creator')}
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={MONTHLY_USER_GROWTH} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 12 }}
                  formatter={(v) => <span style={{ color: '#94A3B8', fontSize: 12 }}>{v}</span>}
                />
                <Line type="monotone" dataKey="brands" name="Brand" stroke="#6366F1" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="creators" name="Creator" stroke="#10B981" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Revenue by Plan Bar Chart */}
        <Col xs={24} xl={10}>
          <Card
            bordered={false}
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(99,102,241,0.12)',
              borderRadius: 16,
              height: '100%',
            }}
            bodyStyle={{ padding: '20px 22px' }}
          >
            {sectionTitle('Doanh thu theo gói cước', 'Tháng hiện tại')}
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={REVENUE_BY_PLAN} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="plan" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<RevenueTip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#6366F1" radius={[8, 8, 0, 0]} />
                <Bar dataKey="users" name="Users" fill="rgba(99,102,241,0.3)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row>
        <Col span={24}>
          <Card
            bordered={false}
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(99,102,241,0.12)',
              borderRadius: 16,
            }}
            bodyStyle={{ padding: '20px 22px' }}
          >
            {sectionTitle('Hoạt động gần đây', 'Real-time system events')}
            <List
              dataSource={RECENT_ACTIVITY}
              renderItem={(item) => (
                <List.Item style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '10px 0' }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={activityIcons[item.type] || <ThunderboltOutlined />}
                        style={{ background: item.color + '22', color: item.color, border: `1px solid ${item.color}44` }}
                        size={36}
                      />
                    }
                    title={
                      <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>
                        {item.action}
                      </Text>
                    }
                    description={
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                        <Tag
                          style={{
                            background: 'rgba(99,102,241,0.1)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            color: '#A5B4FC',
                            fontSize: 11,
                            padding: '0 6px',
                            lineHeight: '18px',
                          }}
                        >
                          {item.actor}
                        </Tag>
                        <Text style={{ color: '#475569', fontSize: 11 }}>{item.time}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
