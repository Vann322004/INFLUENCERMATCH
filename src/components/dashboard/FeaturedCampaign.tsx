import React from 'react';
import { Card, Space, Button, Tag, Typography, Row, Col, Avatar } from 'antd';
import { FireOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { CampaignResponse } from '../../types/api/campaign.types';
import { FEATURED_CAMPAIGN } from '../../data/mockData';

const { Text } = Typography;

interface FeaturedCampaignProps {
  campaign?: CampaignResponse | null;
}

export default function FeaturedCampaign({ campaign }: FeaturedCampaignProps) {
  const navigate = useNavigate();

  // If campaign is explicitly null (user has 0 campaigns), show prompt
  if (campaign === null) {
    return (
      <Card
        bordered
        style={{
          borderRadius: 14,
          borderColor: '#EEF0F6',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        bodyStyle={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          flex: 1,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#EEF2FF',
            color: '#5B5BF0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            marginBottom: 12,
          }}
        >
          <FireOutlined />
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 6 }}>
          Chưa có chiến dịch nổi bật
        </div>
        <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 18, maxWidth: 260 }}>
          Hãy khởi tạo chiến dịch mới để bắt đầu ghép nối AI và theo dõi hiệu suất.
        </div>
        <Button
          type="primary"
          onClick={() => navigate('/campaigns/create')}
          style={{
            background: '#5B5BF0',
            fontWeight: 700,
            borderRadius: 10,
            height: 38,
            padding: '0 20px',
          }}
        >
          Tạo chiến dịch ngay
        </Button>
      </Card>
    );
  }

  // If real campaign is provided
  const title = campaign ? campaign.name : FEATURED_CAMPAIGN.title;
  const subtitle = campaign
    ? ((campaign.niches && campaign.niches.length > 0) ? campaign.niches.join(' • ') : (campaign.productService || 'Chiến dịch influencer'))
    : FEATURED_CAMPAIGN.subtitle;
  const statusText = campaign
    ? (campaign.status === 'ACTIVE' ? 'Đang chạy' : campaign.status === 'DRAFT' ? 'Bản nháp' : 'Hoàn thành')
    : FEATURED_CAMPAIGN.statusText;
  const statusColor = campaign
    ? (campaign.status === 'ACTIVE' ? 'success' : campaign.status === 'DRAFT' ? 'processing' : 'default')
    : 'success';
  const budgetNum = campaign ? (campaign.budgetMax || campaign.budgetMin || 0) : 0;
  const cost = campaign
    ? (budgetNum > 0 ? `${(budgetNum / 1_000_000).toFixed(0)}M ₫` : 'Thỏa thuận')
    : FEATURED_CAMPAIGN.cost;
  const reach = campaign
    ? (campaign.followerMin ? `${(campaign.followerMin / 1000).toFixed(0)}K` : '0')
    : FEATURED_CAMPAIGN.reach;
  const engagement = campaign ? '4.8%' : FEATURED_CAMPAIGN.engagement;
  const detailLink = campaign ? `/campaigns/${campaign.id}` : '/campaign-management';

  return (
    <Card
      bordered
      style={{
        borderRadius: 14,
        borderColor: '#EEF0F6',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      bodyStyle={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
      }}
    >
      <div>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Space size={8}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: '#EEF2FF',
                color: '#5B5BF0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              <FireOutlined />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
              Chiến dịch nổi bật nhất
            </span>
          </Space>

          <Button
            type="link"
            size="small"
            onClick={() => navigate('/campaigns')}
            style={{
              color: '#5B5BF0',
              fontWeight: 600,
              fontSize: 12.5,
              padding: 0,
            }}
          >
            Xem tất cả <RightOutlined style={{ fontSize: 10 }} />
          </Button>
        </div>

        {/* Campaign Info */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
          <Avatar
            shape="square"
            size={52}
            src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=120&auto=format&fit=crop&q=80"
            style={{ borderRadius: 10, flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#0F172A',
                  lineHeight: 1.2,
                }}
              >
                {title}
              </span>
              <Tag
                color={statusColor}
                style={{
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 600,
                  padding: '1px 8px',
                  margin: 0,
                }}
              >
                ● {statusText}
              </Tag>
            </div>
            <Text style={{ fontSize: 11.5, color: '#64748B' }}>
              {subtitle}
            </Text>
          </div>
        </div>

        {/* 3 Metrics Box */}
        <Row
          gutter={8}
          style={{
            background: '#F8FAFC',
            borderRadius: 12,
            padding: '12px 10px',
            marginBottom: 16,
            border: '1px solid #F1F5F9',
          }}
        >
          <Col span={8} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10.5, color: '#64748B', marginBottom: 2 }}>Tiếp cận</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{reach}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#10B981', marginTop: 1 }}>Realtime</div>
          </Col>
          <Col span={8} style={{ textAlign: 'center', borderLeft: '1px solid #EEF0F6', borderRight: '1px solid #EEF0F6' }}>
            <div style={{ fontSize: 10.5, color: '#64748B', marginBottom: 2 }}>Tương tác</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{engagement}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#10B981', marginTop: 1 }}>Est.</div>
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10.5, color: '#64748B', marginBottom: 2 }}>Ngân sách</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{cost}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#10B981', marginTop: 1 }}>Kế hoạch</div>
          </Col>
        </Row>
      </div>

      {/* CTA Button */}
      <Button
        type="primary"
        block
        onClick={() => {
          if (campaign?.id) {
            sessionStorage.setItem('current_campaign_id', campaign.id);
            navigate('/campaigns/detail', { state: { id: campaign.id } });
          } else {
            navigate('/campaign-management');
          }
        }}
        style={{
          background: '#5B5BF0',
          fontWeight: 700,
          borderRadius: 10,
          height: 38,
        }}
      >
        Xem chi tiết
      </Button>
    </Card>
  );
}
