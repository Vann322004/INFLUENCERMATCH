import React from 'react';
import { Row, Col, Card, Typography, Tag, List, Avatar } from 'antd';
import {
  TeamOutlined, UserOutlined, DollarOutlined, ThunderboltOutlined,
  ArrowUpOutlined, ArrowDownOutlined, RiseOutlined,
} from '@ant-design/icons';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  ADMIN_KPI, MONTHLY_USER_GROWTH, REVENUE_BY_PLAN, RECENT_ACTIVITY,
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
      style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', height: '100%' }}
      bodyStyle={{ padding: '20px 22px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <Text style={{ color: '#64748B', fontSize: 12, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
            {title}
          </Text>
          <div style={{ color: '#0F172A', fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginTop: 4 }}>
            {value}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
            {isUp
              ? <ArrowUpOutlined style={{ color: '#10B981', fontSize: 11 }} />
              : <ArrowDownOutlined style={{ color: '#EF4444', fontSize: 11 }} />}
            <Text style={{ color: isUp ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: 600 }}>
              {Math.abs(trend)}%
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 11 }}>so với tháng trước</Text>
          </div>
        </div>
        <div style={{
          width: 44, height: 44, background: bg, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, fontSize: 20, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

// ── Custom Tooltips ────────────────────────────────────
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #EEF0F6', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ color: '#64748B', fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, fontWeight: 600, marginBottom: 2 }}>
          {p.name}: {p.value.toLocaleString('vi-VN')}
        </div>
      ))}
    </div>
  );
}

function RevenueTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #EEF0F6', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ color: '#64748B', fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ color: '#5B5BF0', fontWeight: 700 }}>
        {(payload[0]?.value / 1_000_000).toFixed(1)}M ₫
      </div>
      <div style={{ color: '#94A3B8', fontSize: 11 }}>{payload[1]?.value} users</div>
    </div>
  );
}

// ── Activity Icon Map ─────────────────────────────────
const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  user_register:   <UserOutlined />,
  job_failed:      <ThunderboltOutlined />,
  plan_upgrade:    <RiseOutlined />,
  creator_added:   <TeamOutlined />,
  refund:          <DollarOutlined />,
  scoring_update:  <ThunderboltOutlined />,
};

export default function AdminDashboardPage() {
  const kpiCards: KpiCardProps[] = [
    { icon: <TeamOutlined />,        title: 'Tổng người dùng',    value: ADMIN_KPI.totalUsers.toLocaleString('vi-VN'),                        trend: ADMIN_KPI.totalUsersTrend,    color: '#5B5BF0', bg: '#EEF2FF' },
    { icon: <UserOutlined />,        title: 'Creator hoạt động',  value: ADMIN_KPI.activeCreators.toLocaleString('vi-VN'),                    trend: ADMIN_KPI.activeCreatorsTrend,color: '#10B981', bg: '#ECFDF5' },
    { icon: <DollarOutlined />,      title: 'Doanh thu tháng này',value: (ADMIN_KPI.revenueMonth / 1_000_000).toFixed(1) + 'M ₫',            trend: ADMIN_KPI.revenueMonthTrend,  color: '#F59E0B', bg: '#FFFBEB' },
    { icon: <ThunderboltOutlined />, title: 'Jobs đang chạy',     value: ADMIN_KPI.jobsRunning.toString(),                                    trend: ADMIN_KPI.jobsRunningTrend,   color: '#0EA5E9', bg: '#F0F9FF' },
  ];

  const sectionTitle = (text: string, sub?: string) => (
    <div style={{ marginBottom: 16 }}>
      <Title level={5} style={{ color: '#0F172A', margin: 0, fontWeight: 700, fontSize: 15 }}>{text}</Title>
      {sub && <Text style={{ color: '#94A3B8', fontSize: 12 }}>{sub}</Text>}
    </div>
  );

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: '#0F172A', margin: 0, fontWeight: 800 }}>
          Admin Dashboard
        </Title>
        <Text style={{ color: '#64748B', fontSize: 13 }}>
          Tổng quan hệ thống InfluencerMatch •{' '}
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {kpiCards.map((card, i) => (
          <Col xs={24} sm={12} xl={6} key={i}>
            <KpiCard {...card} />
          </Col>
        ))}
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* User Growth Line Chart */}
        <Col xs={24} xl={14}>
          <Card
            bordered={false}
            style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', height: '100%' }}
            bodyStyle={{ padding: '20px 22px' }}
          >
            {sectionTitle('Tăng trưởng người dùng', 'Theo tháng — Brand vs Creator')}
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={MONTHLY_USER_GROWTH} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ paddingTop: 12 }} formatter={v => <span style={{ color: '#64748B', fontSize: 12 }}>{v}</span>} />
                <Line type="monotone" dataKey="brands"   name="Brand"   stroke="#5B5BF0" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="creators" name="Creator" stroke="#10B981" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Revenue by Plan Bar Chart */}
        <Col xs={24} xl={10}>
          <Card
            bordered={false}
            style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', height: '100%' }}
            bodyStyle={{ padding: '20px 22px' }}
          >
            {sectionTitle('Doanh thu theo gói', 'Tháng hiện tại')}
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={REVENUE_BY_PLAN} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="plan" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<RevenueTip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#5B5BF0" radius={[8, 8, 0, 0]} />
                <Bar dataKey="users"   name="Users"   fill="#DDD6FE"  radius={[8, 8, 0, 0]} />
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
            style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}
            bodyStyle={{ padding: '20px 22px' }}
          >
            {sectionTitle('Hoạt động gần đây', 'Real-time system events')}
            <List
              dataSource={RECENT_ACTIVITY}
              renderItem={(item) => (
                <List.Item style={{ borderBottom: '1px solid #F1F5F9', padding: '10px 0' }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={ACTIVITY_ICONS[item.type] || <ThunderboltOutlined />}
                        style={{ background: item.color + '18', color: item.color, border: `1px solid ${item.color}33` }}
                        size={36}
                      />
                    }
                    title={<Text style={{ color: '#0F172A', fontSize: 13, fontWeight: 600 }}>{item.action}</Text>}
                    description={
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                        <Tag style={{ background: '#EEF2FF', border: '1px solid #DDD6FE', color: '#5B5BF0', fontSize: 11, padding: '0 6px', lineHeight: '18px' }}>
                          {item.actor}
                        </Tag>
                        <Text style={{ color: '#94A3B8', fontSize: 11 }}>{item.time}</Text>
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
