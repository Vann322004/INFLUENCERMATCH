import React from 'react';
import { Breadcrumb, Typography, Button, Row, Col, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import StatCard from '../components/dashboard/StatCard';
import PerformanceChart from '../components/dashboard/PerformanceChart';
import FeaturedCampaign from '../components/dashboard/FeaturedCampaign';
import CampaignTable from '../components/dashboard/CampaignTable';
import { STAT_CARDS_DATA } from '../data/mockData';

const { Title, Paragraph, Text } = Typography;

export default function CampaignPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Page Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ maxWidth: 640 }}>
          <Breadcrumb
            separator="/"
            items={[
              { title: <span style={{ color: '#94A3B8' }}>Không gian làm việc</span> },
              { title: <span style={{ color: '#5B5BF0', fontWeight: 600 }}>Chiến dịch</span> },
            ]}
            style={{ marginBottom: 6, fontSize: 12.5 }}
          />
          <Title
            level={2}
            style={{
              fontWeight: 800,
              fontSize: 26,
              color: '#0F172A',
              margin: '0 0 6px 0',
              letterSpacing: -0.5,
            }}
          >
            Chiến dịch
          </Title>
          <Paragraph
            style={{
              color: '#64748B',
              fontSize: 13,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Quản lý các chiến dịch influencer, theo dõi hiệu suất và tìm kiếm những nhà sáng tạo nội dung phù hợp cho thương hiệu của bạn.
          </Paragraph>
        </div>

        {/* Right Side: Handwritten Note + Create Campaign Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="handwritten-note">
              Chiến dịch tuyệt vời nào cũng bắt đầu từ một ý tưởng thật sự
            </span>
            {/* Curved Arrow SVG */}
            <svg
              width="32"
              height="24"
              viewBox="0 0 36 26"
              fill="none"
              style={{ color: '#5B5BF0', flexShrink: 0, transform: 'rotate(-5deg)' }}
            >
              <path
                d="M2 18 C 12 18, 22 14, 30 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M 24 4 L 32 6 L 28 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            style={{
              background: '#5B5BF0',
              fontWeight: 700,
              fontSize: 13.5,
              height: 42,
              padding: '0 18px',
              borderRadius: 10,
              boxShadow: '0 4px 14px rgba(91, 91, 240, 0.35)',
            }}
          >
            Tạo chiến dịch mới
          </Button>
        </div>
      </div>

      {/* 2. 4 Stat Cards Row */}
      <Row gutter={[16, 16]}>
        {STAT_CARDS_DATA.map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.id}>
            <StatCard item={item} />
          </Col>
        ))}
      </Row>

      {/* 3. Performance Chart (16/24) + Featured Campaign (8/24) */}
      <Row gutter={[18, 18]}>
        <Col xs={24} xl={16}>
          <PerformanceChart />
        </Col>
        <Col xs={24} xl={8}>
          <FeaturedCampaign />
        </Col>
      </Row>

      {/* 4. Campaigns Table */}
      <Row gutter={[18, 18]}>
        <Col span={24}>
          <CampaignTable />
        </Col>
      </Row>
    </div>
  );
}
