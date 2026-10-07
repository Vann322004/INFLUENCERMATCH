import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Tag,
  Progress,
  Avatar,
  Segmented,
  List,
  Space,
  Statistic
} from 'antd';
import {
  TeamOutlined,
  RocketOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  RightOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  FileDoneOutlined,
  LineChartOutlined,
  CommentOutlined,
  ArrowRightOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [campaignTab, setCampaignTab] = useState('Tất cả');
  const [chartPeriod, setChartPeriod] = useState('30 ngày');

  // 4 Metric Stats Data
  const statCards = [
    {
      id: 'stat_1',
      title: 'Tổng số Creator',
      value: '12,458',
      growth: '+ 12% so với tháng trước',
      icon: <TeamOutlined style={{ fontSize: 16, color: '#9333EA' }} />,
      iconBg: '#F3E8FF',
    },
    {
      id: 'stat_2',
      title: 'Chiến dịch đang chạy',
      value: '8',
      growth: '+ 33% so với tháng trước',
      icon: <RocketOutlined style={{ fontSize: 16, color: '#9333EA' }} />,
      iconBg: '#F3E8FF',
    },
    {
      id: 'stat_3',
      title: 'Tổng lượt tiếp cận',
      value: '4.8M',
      growth: '+ 56% so với tháng trước',
      icon: <BarChartOutlined style={{ fontSize: 16, color: '#3B82F6' }} />,
      iconBg: '#EFF6FF',
    },
    {
      id: 'stat_4',
      title: 'Doanh thu ước tính',
      value: '₫268.5M',
      growth: '+ 42% so với tháng trước',
      icon: <span style={{ fontWeight: 800, fontSize: 16, color: '#3B82F6' }}>₫</span>,
      iconBg: '#EFF6FF',
    },
  ];

  // Campaigns list data
  const campaigns = [
    {
      id: 'c1',
      title: 'Ra mắt dòng skincare mới',
      category: 'Sản phẩm làm đẹp • 01/05 - 31/05/2025',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&auto=format&fit=crop&q=80',
      status: 'active',
      statusText: 'Đang chạy',
      reach: '4.2M',
      engagement: 12.6,
    },
    {
      id: 'c2',
      title: 'Chiến dịch giày thể thao mùa hè',
      category: 'Thể thao & Thời trang • 05/05 - 20/05/2025',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80',
      status: 'active',
      statusText: 'Đang chạy',
      reach: '3.1M',
      engagement: 10.4,
    },
    {
      id: 'c3',
      title: 'Du lịch trải nghiệm cùng bạn',
      category: 'Du lịch • 10/05 - 30/05/2025',
      image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=100&auto=format&fit=crop&q=80',
      status: 'pending',
      statusText: 'Chờ duyệt',
      reach: '1.8M',
      engagement: 8.2,
    },
    {
      id: 'c4',
      title: 'Laptop cho Gen Z',
      category: 'Công nghệ • 15/05 - 31/05/2025',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&auto=format&fit=crop&q=80',
      status: 'active',
      statusText: 'Đang chạy',
      reach: '2.6M',
      engagement: 11.7,
    },
  ];

  // Action items / Tasks data
  const tasks = [
    {
      id: 't1',
      title: 'Duyệt 3 creator mới',
      subtitle: 'Chiến dịch: Ra mắt dòng skincare mới',
      time: '2 giờ trước',
      icon: <UserAddOutlined style={{ color: '#3B82F6' }} />,
      iconBg: '#EFF6FF',
    },
    {
      id: 't2',
      title: 'Phê duyệt nội dung',
      subtitle: 'Chiến dịch: Du lịch trải nghiệm cùng bạn',
      time: '4 giờ trước',
      icon: <FileDoneOutlined style={{ color: '#7C3AED' }} />,
      iconBg: '#F5F3FF',
    },
    {
      id: 't3',
      title: 'Theo dõi hiệu quả chiến dịch',
      subtitle: 'Chiến dịch: Laptop cho Gen Z',
      time: 'Hôm nay 10:00',
      icon: <LineChartOutlined style={{ color: '#3B82F6' }} />,
      iconBg: '#EFF6FF',
    },
    {
      id: 't4',
      title: 'Trả lời tin nhắn từ creator',
      subtitle: 'Có 3 tin nhắn mới',
      time: 'Hôm nay 14:30',
      icon: <CommentOutlined style={{ color: '#7C3AED' }} />,
      iconBg: '#F5F3FF',
    },
  ];

  // Top Creators data
  const topCreators = [
    {
      rank: 1,
      name: 'Phạm Ngọc Anh',
      category: 'Lifestyle & Beauty',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      reach: '1.2M',
      engagement: '4.8%',
    },
    {
      rank: 2,
      name: 'Trần Minh Quân',
      category: 'Fashion & Style',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      reach: '980K',
      engagement: '4.2%',
    },
    {
      rank: 3,
      name: 'Lê Hoàng Mai',
      category: 'Travel & Food',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      reach: '760K',
      engagement: '3.9%',
    },
    {
      rank: 4,
      name: 'Nguyễn Thảo Vy',
      category: 'Tech & Gaming',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      reach: '620K',
      engagement: '3.6%',
    },
  ];

  const filteredCampaigns = campaigns.filter((c) => {
    if (campaignTab === 'Đang chạy') return c.status === 'active';
    if (campaignTab === 'Chờ duyệt') return c.status === 'pending';
    if (campaignTab === 'Hoàn thành') return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. WELCOME GREETING BANNER */}
      <Card
        bordered={false}
        style={{
          background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 45%, #FCE7F3 100%)',
          borderRadius: 20,
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.08)',
        }}
        bodyStyle={{ padding: '24px 32px' }}
      >
        <Title level={3} style={{ margin: '0 0 6px 0', fontWeight: 800, color: '#0F172A' }}>
          Chào buổi sáng, Văn! <span className="im-hand-wave">👋</span>
        </Title>
        <Text type="secondary" style={{ fontSize: 13.5, color: '#64748B' }}>
          Hành trình kết nối thương hiệu của bạn với những influencer phù hợp bắt đầu từ đây. Cùng tạo nên những chiến dịch bùng nổ!
        </Text>
      </Card>

      {/* 2. 4 METRIC STAT CARDS (Ant Design Row/Col + Card) */}
      <Row gutter={[16, 16]}>
        {statCards.map((stat) => (
          <Col xs={24} sm={12} lg={6} key={stat.id}>
            <Card
              bordered
              style={{
                borderRadius: 16,
                borderColor: '#E2E8F0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
              }}
              bodyStyle={{ padding: '18px 20px' }}
            >
              <Space align="center" size={10} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: stat.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {stat.icon}
                </div>
                <Text style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B' }}>
                  {stat.title}
                </Text>
              </Space>

              <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginBottom: 8, letterSpacing: -0.5 }}>
                {stat.value}
              </div>

              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center' }}>
                <ArrowUpOutlined style={{ fontSize: 10, marginRight: 4 }} />
                <span>{stat.growth}</span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 3. MIDDLE ROW (CAMPAIGNS LEFT + CREATE/TASKS RIGHT) */}
      <Row gutter={[18, 18]}>
        {/* Left: Active Campaigns */}
        <Col xs={24} lg={15}>
          <Card
            bordered
            style={{ borderRadius: 18, borderColor: '#E2E8F0', height: '100%' }}
            title={
              <Space>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: '#F3E8FF',
                    color: '#9333EA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                  }}
                >
                  <RocketOutlined />
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                  Chiến dịch đang chạy
                </span>
              </Space>
            }
            extra={
              <Button type="link" size="small" style={{ color: '#3B82F6', fontWeight: 600, fontSize: 12.5, padding: 0 }}>
                Xem tất cả <RightOutlined style={{ fontSize: 10 }} />
              </Button>
            }
            bodyStyle={{ padding: '16px 20px' }}
          >
            {/* Ant Design Segmented Filter Tabs */}
            <div style={{ marginBottom: 16 }}>
              <Segmented
                options={['Tất cả', 'Đang chạy', 'Chờ duyệt', 'Hoàn thành']}
                value={campaignTab}
                onChange={setCampaignTab}
                style={{
                  background: '#F1F5F9',
                  padding: 3,
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 12.5,
                }}
              />
            </div>

            {/* Ant Design List for Campaigns */}
            <List
              itemLayout="horizontal"
              dataSource={filteredCampaigns}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid #F1F5F9',
                    marginBottom: 10,
                    transition: 'all 0.2s',
                  }}
                  className="antd-list-item-hover"
                >
                  <Row align="middle" style={{ width: '100%' }} gutter={[12, 8]}>
                    <Col flex="48px">
                      <Avatar shape="square" size={44} src={item.image} style={{ borderRadius: 10 }} />
                    </Col>

                    <Col flex="auto" style={{ minWidth: 120, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.category}
                      </div>
                    </Col>

                    <Col flex="90px">
                      <Tag
                        color={item.status === 'active' ? 'success' : 'warning'}
                        style={{ borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 600, margin: 0 }}
                      >
                        ● {item.statusText}
                      </Tag>
                    </Col>

                    <Col flex="90px" style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{item.reach}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>Lượt tiếp cận</div>
                    </Col>

                    <Col flex="110px">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>{item.engagement}%</span>
                        <span style={{ color: '#94A3B8', fontSize: 9.5 }}>Tương tác</span>
                      </div>
                      <Progress
                        percent={item.engagement * 6}
                        showInfo={false}
                        strokeColor="#2563EB"
                        size="small"
                        style={{ margin: 0 }}
                      />
                    </Col>

                    <Col flex="24px" style={{ textAlign: 'right' }}>
                      <Button type="text" size="small" icon={<RightOutlined style={{ fontSize: 11, color: '#94A3B8' }} />} />
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Right: Create Campaign CTA + To-Do Tasks */}
        <Col xs={24} lg={9}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
            {/* Create Campaign Card */}
            <Card
              bordered={false}
              style={{
                borderRadius: 18,
                background: 'linear-gradient(135deg, #3B46F1 0%, #6366F1 60%, #8B5CF6 100%)',
                boxShadow: '0 10px 25px -4px rgba(79, 70, 229, 0.35)',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
              }}
              bodyStyle={{ padding: '20px 22px' }}
            >
              <div style={{ maxWidth: 210, position: 'relative', zIndex: 2 }}>
                <Title level={4} style={{ color: '#FFFFFF', margin: '0 0 6px 0', fontWeight: 800 }}>
                  Tạo chiến dịch mới
                </Title>
                <p style={{ fontSize: 11.5, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                  Tìm kiếm Influencer phù hợp với thương hiệu của bạn chỉ trong vài bước.
                </p>
                <Button
                  shape="round"
                  onClick={() => navigate('/campaigns/create')}
                  style={{
                    background: '#FFFFFF',
                    color: '#1E1B4B',
                    fontWeight: 700,
                    fontSize: 12,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  icon={<ArrowRightOutlined style={{ fontSize: 11 }} />}
                >
                  Tạo chiến dịch
                </Button>
              </div>

              {/* Decorative Radar Graphic */}
              <div className="im-create-graphic">
                <div className="im-radar-circle c1"></div>
                <div className="im-radar-circle c2"></div>
                <div className="im-radar-circle c3"></div>
                <div className="im-radar-center">✦</div>
              </div>
            </Card>

            {/* To-Do Tasks Card */}
            <Card
              bordered
              style={{ borderRadius: 18, borderColor: '#E2E8F0', flex: 1 }}
              title={
                <Space>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: '#EFF6FF',
                      color: '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                    }}
                  >
                    <CheckCircleOutlined />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Việc cần làm</span>
                </Space>
              }
              extra={
                <Button type="link" size="small" style={{ color: '#3B82F6', fontWeight: 600, fontSize: 12.5, padding: 0 }}>
                  Xem tất cả <RightOutlined style={{ fontSize: 10 }} />
                </Button>
              }
              bodyStyle={{ padding: '12px 18px' }}
            >
              <List
                dataSource={tasks}
                renderItem={(task) => (
                  <List.Item
                    style={{ padding: '8px 0', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}
                    className="antd-task-hover"
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            backgroundColor: task.iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 15,
                          }}
                        >
                          {task.icon}
                        </div>
                      }
                      title={
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                          {task.title}
                        </div>
                      }
                      description={
                        <div style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {task.subtitle}
                        </div>
                      }
                    />
                    <Space size={4}>
                      <span style={{ fontSize: 10.5, color: '#94A3B8' }}>{task.time}</span>
                      <RightOutlined style={{ fontSize: 10, color: '#CBD5E1' }} />
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </div>
        </Col>
      </Row>

      {/* 4. BOTTOM ROW (ANALYTICS LEFT + TOP CREATORS RIGHT) */}
      <Row gutter={[18, 18]}>
        {/* Left: Campaign Performance Card */}
        <Col xs={24} lg={15}>
          <Card
            bordered
            style={{ borderRadius: 18, borderColor: '#E2E8F0' }}
            title={
              <Space>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: '#EFF6FF',
                    color: '#3B82F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                  }}
                >
                  <BarChartOutlined />
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                  Hiệu quả chiến dịch
                </span>
              </Space>
            }
            extra={
              <Segmented
                options={['7 ngày', '30 ngày', '90 ngày']}
                value={chartPeriod}
                onChange={setChartPeriod}
                size="small"
                style={{ background: '#F1F5F9', borderRadius: 999, fontWeight: 600, fontSize: 11.5 }}
              />
            }
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Row gutter={[20, 20]} align="middle">
              {/* Spline Area Chart */}
              <Col xs={24} md={14}>
                <div style={{ display: 'flex', gap: 10, height: 190 }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      fontSize: 10.5,
                      color: '#94A3B8',
                      paddingBottom: 22,
                    }}
                  >
                    <span>4M</span>
                    <span>3M</span>
                    <span>2M</span>
                    <span>1M</span>
                    <span>0</span>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <svg viewBox="0 0 500 180" style={{ width: '100%', height: 160 }} preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaGradientAntd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.45" />
                          <stop offset="60%" stopColor="#C084FC" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="lineGradientAntd" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#6366F1" />
                          <stop offset="50%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#A855F7" />
                        </linearGradient>
                      </defs>

                      <line x1="0" y1="15" x2="500" y2="15" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="50" x2="500" y2="50" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="90" x2="500" y2="90" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="130" x2="500" y2="130" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="170" x2="500" y2="170" stroke="#E2E8F0" strokeWidth="1" />

                      <path
                        d="M 0,135 C 50,130 70,105 120,110 C 170,115 190,100 240,80 C 280,65 330,58 380,55 C 420,53 460,65 500,60 L 500,170 L 0,170 Z"
                        fill="url(#areaGradientAntd)"
                      />

                      <path
                        d="M 0,135 C 50,130 70,105 120,110 C 170,115 190,100 240,80 C 280,65 330,58 380,55 C 420,53 460,65 500,60"
                        fill="none"
                        stroke="url(#lineGradientAntd)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      <circle cx="240" cy="80" r="4.5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2" />
                      <circle cx="380" cy="55" r="4.5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2" />
                    </svg>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#94A3B8', marginTop: 4 }}>
                      <span>1/5</span>
                      <span>5/5</span>
                      <span>10/5</span>
                      <span>15/5</span>
                      <span>20/5</span>
                      <span>25/5</span>
                      <span>31/5</span>
                    </div>
                  </div>
                </div>
              </Col>

              {/* Donut Chart & Breakdown */}
              <Col xs={24} md={10}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    background: '#F8FAFC',
                    borderRadius: 14,
                    padding: '16px 12px',
                  }}
                >
                  <div style={{ position: 'relative', width: 105, height: 105, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 140 140" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <circle cx="70" cy="70" r="45" fill="transparent" stroke="#2563EB" strokeWidth="14" strokeDasharray="118.75 164" strokeDashoffset="0" strokeLinecap="round" />
                      <circle cx="70" cy="70" r="45" fill="transparent" stroke="#06B6D4" strokeWidth="14" strokeDasharray="79.16 203.58" strokeDashoffset="-123" strokeLinecap="round" />
                      <circle cx="70" cy="70" r="45" fill="transparent" stroke="#10B981" strokeWidth="14" strokeDasharray="50.9 231.84" strokeDashoffset="-207" strokeLinecap="round" />
                      <circle cx="70" cy="70" r="45" fill="transparent" stroke="#F59E0B" strokeWidth="14" strokeDasharray="33.9 248.84" strokeDashoffset="-262" strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>4.8M</div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: '#10B981' }}>+ 56%</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 2 }}>Tổng lượt tiếp cận</div>
                    <Space size={8}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', display: 'inline-block' }}></span><span style={{ fontSize: 11.5, color: '#475569' }}>TikTok</span><span style={{ fontWeight: 700, fontSize: 11.5, color: '#0F172A' }}>42%</span></Space>
                    <Space size={8}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06B6D4', display: 'inline-block' }}></span><span style={{ fontSize: 11.5, color: '#475569' }}>Instagram</span><span style={{ fontWeight: 700, fontSize: 11.5, color: '#0F172A' }}>28%</span></Space>
                    <Space size={8}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span><span style={{ fontSize: 11.5, color: '#475569' }}>Facebook</span><span style={{ fontWeight: 700, fontSize: 11.5, color: '#0F172A' }}>18%</span></Space>
                    <Space size={8}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }}></span><span style={{ fontSize: 11.5, color: '#475569' }}>YouTube</span><span style={{ fontWeight: 700, fontSize: 11.5, color: '#0F172A' }}>12%</span></Space>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right: Top Creator Card */}
        <Col xs={24} lg={9}>
          <Card
            bordered
            style={{ borderRadius: 18, borderColor: '#E2E8F0', height: '100%' }}
            title={
              <Space>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: '#F3E8FF',
                    color: '#9333EA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                  }}
                >
                  <PlusOutlined />
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Top Creator</span>
              </Space>
            }
            extra={
              <Button type="link" size="small" style={{ color: '#3B82F6', fontWeight: 600, fontSize: 12.5, padding: 0 }}>
                Xem tất cả <RightOutlined style={{ fontSize: 10 }} />
              </Button>
            }
            bodyStyle={{ padding: '12px 18px' }}
          >
            <List
              dataSource={topCreators}
              renderItem={(creator) => (
                <List.Item
                  style={{ padding: '8px 6px', borderBottom: '1px solid #F8FAFC', cursor: 'pointer' }}
                  className="antd-creator-row-hover"
                >
                  <Row align="middle" style={{ width: '100%' }} gutter={[10, 4]}>
                    <Col flex="18px">
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 13,
                          color: creator.rank === 1 ? '#D97706' : creator.rank === 2 ? '#64748B' : creator.rank === 3 ? '#B45309' : '#94A3B8',
                        }}
                      >
                        {creator.rank}
                      </span>
                    </Col>

                    <Col flex="40px">
                      <Avatar size={36} src={creator.avatar} />
                    </Col>

                    <Col flex="auto">
                      <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0F172A' }}>{creator.name}</div>
                      <div style={{ fontSize: 10.5, color: '#64748B' }}>{creator.category}</div>
                    </Col>

                    <Col flex="80px" style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A' }}>{creator.reach}</div>
                      <div style={{ fontSize: 9.5, color: '#94A3B8' }}>Lượt tiếp cận</div>
                    </Col>

                    <Col flex="60px" style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A' }}>{creator.engagement}</div>
                      <div style={{ fontSize: 9.5, color: '#94A3B8' }}>Tương tác</div>
                    </Col>

                    <Col flex="16px" style={{ textAlign: 'right' }}>
                      <RightOutlined style={{ fontSize: 10, color: '#CBD5E1' }} />
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
