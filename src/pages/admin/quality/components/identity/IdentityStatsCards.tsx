import React from 'react';
import { Row, Col, Card } from 'antd';
import { BranchesOutlined, CheckCircleOutlined, SwapOutlined } from '@ant-design/icons';

interface IdentityStatsCardsProps {
  pendingConflictsCount: number;
  averageMatchScore?: number;
  mergedSuccessCount?: number;
}

export const IdentityStatsCards: React.FC<IdentityStatsCardsProps> = ({
  pendingConflictsCount,
  averageMatchScore = 87.6,
  mergedSuccessCount = 14,
}) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      <Col xs={24} sm={8}>
        <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Xung đột chờ xử lý</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', marginTop: 2 }}>
                {pendingConflictsCount} cặp hồ sơ
              </div>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              <BranchesOutlined />
            </div>
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={8}>
        <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Độ khớp AI trung bình</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                {averageMatchScore}%
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

      <Col xs={24} sm={8}>
        <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Hồ sơ đã gộp thành công</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 2 }}>
                {mergedSuccessCount} Creator
              </div>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#F0FDF4',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              <SwapOutlined />
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default IdentityStatsCards;

