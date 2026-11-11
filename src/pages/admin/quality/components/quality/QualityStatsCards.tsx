import React from 'react';
import { Row, Col, Card } from 'antd';
import { InboxOutlined, ControlOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { QualityOverview } from '../../types';

interface QualityStatsCardsProps {
  overview: QualityOverview;
  fallbackPendingCount: number;
}

export const QualityStatsCards: React.FC<QualityStatsCardsProps> = ({ overview, fallbackPendingCount }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      <Col xs={24} sm={8}>
        <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Cần kiểm duyệt</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B', marginTop: 2 }}>
                {overview.pendingCount || fallbackPendingCount} hồ sơ
              </div>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#FFFBEB',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              <InboxOutlined />
            </div>
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={8}>
        <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Tỷ lệ AI phân loại chuẩn</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                {overview.accuracyRate}%
              </div>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              <ControlOutlined />
            </div>
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={8}>
        <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Đã chuẩn hóa hôm nay</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 2 }}>
                {overview.standardizedTodayCount} hồ sơ
              </div>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              <CheckCircleOutlined />
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default QualityStatsCards;

