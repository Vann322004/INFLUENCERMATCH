import React from 'react';
import { Button, Progress } from 'antd';
import { CrownFilled, ArrowRightOutlined, ThunderboltFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { CURRENT_SUBSCRIPTION_INFO } from '../../data/mockData';

export default function SidebarPromo() {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate('/subscription')}
      style={{
        background: 'linear-gradient(145deg, #FAF5FF 0%, #F5F3FF 50%, #EEF2FF 100%)',
        border: '1px solid #DDD6FE',
        borderRadius: 14,
        padding: '13px 12px 12px 12px',
        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.08)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
      }}
      className="sidebar-subscription-card"
    >
      {/* Decorative ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 70,
          height: 70,
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header: Crown Icon + Plan Title + Pro Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(124, 58, 237, 0.35)',
            flexShrink: 0,
          }}
        >
          <CrownFilled style={{ color: '#FDE047', fontSize: 16 }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: 12.5,
                color: '#0F172A',
                letterSpacing: -0.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Gói {CURRENT_SUBSCRIPTION_INFO.currentPlanName}
            </span>
            <span
              style={{
                background: 'linear-gradient(135deg, #FDE047 0%, #F59E0B 100%)',
                color: '#78350F',
                fontWeight: 800,
                fontSize: 9,
                padding: '1.5px 5px',
                borderRadius: 4,
                letterSpacing: 0.5,
                lineHeight: 1.2,
                flexShrink: 0,
              }}
            >
              PRO
            </span>
          </div>

          <div
            style={{
              fontSize: 10.5,
              color: '#6366F1',
              fontWeight: 600,
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Còn {CURRENT_SUBSCRIPTION_INFO.daysRemaining} ngày chu kỳ
          </div>
        </div>
      </div>

      {/* Progress Quota Section */}
      <div style={{ marginTop: 10 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 10.5,
            color: '#64748B',
            fontWeight: 600,
            marginBottom: 3,
          }}
        >
          <span>Dung lượng sử dụng</span>
          <span style={{ color: '#4F46E5', fontWeight: 700 }}>68%</span>
        </div>

        <Progress
          percent={68}
          size="small"
          showInfo={false}
          strokeColor={{
            '0%': '#6366F1',
            '100%': '#8B5CF6',
          }}
          trailColor="#E2E8F0"
          style={{ margin: 0, height: 6 }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            color: '#94A3B8',
            marginTop: 4,
            fontWeight: 500,
          }}
        >
          <span>8/15 chiến dịch</span>
          <span>34/50 refresh</span>
        </div>
      </div>

      {/* Action Button */}
      <Button
        type="primary"
        size="small"
        block
        style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          border: 'none',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 11,
          height: 28,
          marginTop: 9,
          boxShadow: '0 3px 10px rgba(99, 102, 241, 0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
        onClick={(e) => {
          e.stopPropagation();
          navigate('/subscription');
        }}
      >
        <span>Quản lý & Hạn mức</span>
        <ArrowRightOutlined style={{ fontSize: 9.5 }} />
      </Button>
    </div>
  );
}
