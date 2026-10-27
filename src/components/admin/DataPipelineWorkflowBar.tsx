import React from 'react';
import { Card, Tag, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  ApiOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  RightOutlined,
  ArrowRightOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';

export type DataStep = 'sources' | 'jobs' | 'quality';

export interface DataPipelineWorkflowBarProps {
  currentStep: DataStep;
  pendingQualityCount?: number;
  runningJobsCount?: number;
  activeConnectorsCount?: number;
}

export default function DataPipelineWorkflowBar({
  currentStep,
  pendingQualityCount,
  runningJobsCount,
  activeConnectorsCount,
}: DataPipelineWorkflowBarProps) {
  const navigate = useNavigate();

  const steps = [
    {
      key: 'sources' as DataStep,
      stepNum: 1,
      title: 'Nguồn dữ liệu (Data Sources)',
      icon: <ApiOutlined />,
      path: ADMIN_ROUTES.DATA_SOURCES,
      meta: typeof activeConnectorsCount === 'number' ? `${activeConnectorsCount} kết nối` : undefined,
    },
    {
      key: 'jobs' as DataStep,
      stepNum: 2,
      title: 'Tiến trình cào (Crawler Jobs)',
      icon: <SyncOutlined spin={currentStep === 'jobs'} />,
      path: ADMIN_ROUTES.JOBS,
      meta: typeof runningJobsCount === 'number' ? `${runningJobsCount} đang chạy` : undefined,
    },
    {
      key: 'quality' as DataStep,
      stepNum: 3,
      title: 'Kiểm định dữ liệu (Data Quality)',
      icon: <CheckCircleOutlined />,
      path: '/admin/data-quality',
      meta: typeof pendingQualityCount === 'number' ? `${pendingQualityCount} chờ duyệt` : undefined,
    },
  ];

  return (
    <Card
      style={{
        borderRadius: 14,
        marginBottom: 20,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
      bodyStyle={{ padding: '12px 20px' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        {/* Left: Role & Pipeline Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: '#EEF2FF',
              color: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            <DatabaseOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A', lineHeight: 1.2 }}>
              DATA INGESTION PIPELINE
            </div>
            <div style={{ fontSize: 11, color: '#64748B' }}>
              Quy trình thu thập, giám sát và kiểm định chất lượng Creator
            </div>
          </div>
        </div>

        {/* Center: Stepper */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#F8FAFC',
            padding: '4px 10px',
            borderRadius: 10,
            border: '1px solid #EEF2F6',
            flexWrap: 'wrap',
          }}
        >
          {steps.map((st, idx) => {
            const isActive = st.key === currentStep;
            const isCompleted = steps.findIndex((s) => s.key === currentStep) > idx;

            return (
              <React.Fragment key={st.key}>
                <button
                  type="button"
                  onClick={() => navigate(st.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? '#4F46E5' : isCompleted ? '#EEF2FF' : 'transparent',
                    color: isActive ? '#FFFFFF' : isCompleted ? '#4338CA' : '#64748B',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 12.5,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{st.icon}</span>
                  <span>{st.title}</span>
                  {st.meta && (
                    <Tag
                      style={{
                        margin: 0,
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        background: isActive ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                        color: isActive ? '#fff' : '#475569',
                        border: 'none',
                        padding: '0 6px',
                        lineHeight: '16px',
                      }}
                    >
                      {st.meta}
                    </Tag>
                  )}
                </button>

                {idx < steps.length - 1 && (
                  <RightOutlined style={{ fontSize: 10, color: '#CBD5E1', margin: '0 2px' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right: Next step button */}
        <div>
          {currentStep === 'sources' && (
            <Button
              type="primary"
              size="middle"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate(ADMIN_ROUTES.JOBS)}
              style={{ borderRadius: 8, fontWeight: 600, background: '#4F46E5' }}
            >
              Xem Crawler Jobs ➔
            </Button>
          )}

          {currentStep === 'jobs' && (
            <Button
              type="primary"
              size="middle"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate('/admin/data-quality')}
              style={{ borderRadius: 8, fontWeight: 600, background: '#4F46E5' }}
            >
              Kiểm định chất lượng ➔
            </Button>
          )}

          {currentStep === 'quality' && (
            <Button
              size="middle"
              onClick={() => navigate(ADMIN_ROUTES.CREATORS)}
              style={{ borderRadius: 8, fontWeight: 600, color: '#4F46E5', borderColor: '#C7D2FE' }}
            >
              Mở Creator Catalog ➔
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
