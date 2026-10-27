import React from 'react';
import { Row, Col, Button, Tag, Progress, Spin } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { QuotaMetric } from '../../../data/mockData';
import type { SubInfoData } from './CurrentPlanBanner';

interface QuotaTabProps {
  quotas: QuotaMetric[];
  subInfo: SubInfoData;
  loading: boolean;
  onGoToPlans: () => void;
}

export default function QuotaTab({ quotas, subInfo, loading, onGoToPlans }: QuotaTabProps) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" tip="Đang tải dữ liệu hạn mức..." />
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      {/* Quota overview alert */}
      <div
        style={{
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <InfoCircleOutlined style={{ fontSize: 20, color: '#2563EB' }} />
          <div>
            <div style={{ fontWeight: 700, color: '#1E3A8A', fontSize: 13.5 }}>
              {subInfo.isActive
                ? `Chu kỳ hạn mức của bạn được làm mới vào ngày ${subInfo.renewalDate}`
                : 'Bạn đang dùng gói trải nghiệm cơ bản, chưa kích hoạt chu kỳ trả phí'}
            </div>
            <div style={{ color: '#3B82F6', fontSize: 12 }}>
              Các chỉ số chưa dùng hết trong tháng sẽ không được cộng dồn sang chu kỳ tiếp theo.
            </div>
          </div>
        </div>
        <Button
          type="primary"
          size="middle"
          style={{ background: '#2563EB', fontWeight: 600, borderRadius: 8 }}
          onClick={onGoToPlans}
        >
          Nâng gói để tăng quota
        </Button>
      </div>

      {/* Quota Metrics Cards */}
      <Row gutter={[18, 18]}>
        {quotas.map((quota) => {
          const percent = quota.total > 0 ? Math.round((quota.used / quota.total) * 100) : 0;
          const isHighUsage = percent >= 80;

          return (
            <Col xs={24} sm={12} lg={6} key={quota.id}>
              <div className="quota-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: '#1E293B' }}>
                    {quota.title}
                  </span>
                  <Tag
                    color={isHighUsage ? 'error' : 'default'}
                    style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}
                  >
                    {percent}% đã dùng
                  </Tag>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '8px 0' }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: quota.color }}>
                    {quota.used}
                  </span>
                  <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                    / {quota.total} {quota.unit}
                  </span>
                </div>

                <Progress
                  percent={percent}
                  strokeColor={quota.color}
                  railColor="#F1F5F9"
                  showInfo={false}
                  style={{ marginBottom: 10 }}
                />

                <div style={{ fontSize: 11.5, color: '#64748B', lineHeight: 1.4 }}>
                  {quota.description}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
