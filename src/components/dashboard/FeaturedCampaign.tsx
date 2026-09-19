import React from 'react';
import { Card, Space, Button, Tag, Typography, Row, Col, Avatar } from 'antd';
import {
  FireOutlined,
  RightOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { FEATURED_CAMPAIGN } from '../../data/mockData';

const { Title, Text } = Typography;

export default function FeaturedCampaign() {
  const item = FEATURED_CAMPAIGN;

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
            src={item.thumbnail}
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
                {item.title}
              </span>
              <Tag
                color="success"
                style={{
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 600,
                  padding: '1px 8px',
                  margin: 0,
                }}
              >
                ● {item.statusText}
              </Tag>
            </div>
            <Text style={{ fontSize: 11.5, color: '#64748B' }}>
              {item.subtitle}
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
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{item.reach}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#10B981', marginTop: 1 }}>{item.reachGrowth}</div>
          </Col>
          <Col span={8} style={{ textAlign: 'center', borderLeft: '1px solid #EEF0F6', borderRight: '1px solid #EEF0F6' }}>
            <div style={{ fontSize: 10.5, color: '#64748B', marginBottom: 2 }}>Tương tác</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{item.engagement}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#10B981', marginTop: 1 }}>{item.engagementGrowth}</div>
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10.5, color: '#64748B', marginBottom: 2 }}>Chi phí</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{item.cost}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#10B981', marginTop: 1 }}>{item.costGrowth}</div>
          </Col>
        </Row>
      </div>

      {/* CTA Button */}
      <Button
        type="primary"
        block
        style={{
          background: '#5B5BF0',
          fontWeight: 700,
          borderRadius: 10,
          height: 38,
        }}
        icon={<ArrowRightOutlined style={{ fontSize: 11 }} />}
      >
        Xem chi tiết
      </Button>
    </Card>
  );
}
