import React, { useState } from 'react';
import { Select, Button, Badge, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleFilled,
  CompassOutlined,
  UnorderedListOutlined,
  AimOutlined,
  TeamOutlined,
  RightOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';

export type WorkflowStep = 'create' | 'discovery' | 'shortlist' | 'recommendation' | 'crm';

export interface CampaignWorkflowBarProps {
  currentStep: WorkflowStep;
  campaignId?: string;
  campaignName?: string;
  shortlistCount?: number;
  availableCampaigns?: { id: string; name: string }[];
  onSelectCampaign?: (campaignId: string) => void;
}

export default function CampaignWorkflowBar({
  currentStep,
  campaignId,
  campaignName,
  shortlistCount,
  availableCampaigns = [],
  onSelectCampaign,
}: CampaignWorkflowBarProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const activeId = campaignId || availableCampaigns[0]?.id || 'current';
  const displayName = campaignName || availableCampaigns.find((c) => c.id === activeId)?.name || 'Chiến dịch hiện tại';

  // 5 bước quy trình ngắn gọn, rõ ràng
  const steps: { key: WorkflowStep; title: string; icon: React.ReactNode; path: string }[] = [
    {
      key: 'create',
      title: 'Tạo Brief',
      icon: <CheckCircleFilled style={{ color: currentStep === 'create' ? '#FFFFFF' : '#10B981', fontSize: 13 }} />,
      path: '/campaigns/create',
    },
    {
      key: 'discovery',
      title: 'Khám phá KOC',
      icon: <CompassOutlined style={{ fontSize: 13 }} />,
      path: `/creators${activeId !== 'current' ? `?campaignId=${activeId}` : ''}`,
    },
    {
      key: 'shortlist',
      title: 'Danh sách chọn',
      icon: <UnorderedListOutlined style={{ fontSize: 13 }} />,
      path: `/creators/shortlist${activeId !== 'current' ? `?campaignId=${activeId}` : ''}`,
    },
    {
      key: 'recommendation',
      title: 'Đề xuất AI',
      icon: <AimOutlined style={{ fontSize: 13 }} />,
      path: activeId !== 'current' ? `/campaign-management/${activeId}?tab=recommendation` : '/recommendations?tab=recommendation',
    },
    {
      key: 'crm',
      title: 'Tiếp cận CRM',
      icon: <TeamOutlined style={{ fontSize: 13 }} />,
      path: activeId !== 'current' ? `/campaign-management/${activeId}` : '/crm',
    },
  ];

  const handleStepClick = (step: typeof steps[0]) => {
    navigate(step.path);
  };

  // Trạng thái thu nhỏ (Mini Floating Pill)
  if (collapsed) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: 'calc(50% + 120px)',
          transform: 'translateX(-50%)',
          zIndex: 1000,
        }}
      >
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(12px)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 999,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            cursor: 'pointer',
            fontSize: 12.5,
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
        >
          <span>🎯 Quy trình chiến dịch</span>
          <UpOutlined style={{ fontSize: 11 }} />
        </button>
      </div>
    );
  }

  // Trạng thái chuẩn: 1 hàng duy nhất cực kỳ thanh mảnh, hợp lý và êm mắt
  return (
    <div
      className="im-workflow-bottom-dock"
      style={{
        position: 'fixed',
        bottom: 20,
        left: 'calc(50% + 120px)',
        transform: 'translateX(-50%)',
        width: 'fit-content',
        maxWidth: 'calc(100vw - 280px)',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid #E2E8F0',
        borderRadius: 999,
        boxShadow: '0 8px 30px -4px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
        padding: '5px 8px 5px 14px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'nowrap',
        whiteSpace: 'nowrap',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* 1. Chiến dịch đang chọn */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {availableCampaigns.length > 0 ? (
          <Select
            value={activeId}
            onChange={(val) => {
              if (onSelectCampaign) {
                onSelectCampaign(val);
              } else {
                if (currentStep === 'discovery') navigate(`/creators?campaignId=${val}`);
                else if (currentStep === 'shortlist') navigate(`/creators/shortlist?campaignId=${val}`);
                else if (currentStep === 'recommendation') navigate(`/campaign-management/${val}?tab=recommendation`);
                else if (currentStep === 'crm') navigate(`/campaign-management/${val}`);
              }
            }}
            popupMatchSelectWidth={false}
            bordered={false}
            size="small"
            style={{ width: 170 }}
            options={availableCampaigns.map((c) => ({
              value: c.id,
              label: (
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 12.5 }}>
                  🎯 {c.name}
                </span>
              ),
            }))}
          />
        ) : (
          <span
            style={{
              fontWeight: 700,
              fontSize: 12.5,
              color: '#0F172A',
              maxWidth: 160,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'inline-block',
            }}
            title={displayName}
          >
            🎯 {displayName}
          </span>
        )}
      </div>

      {/* Vạch ngăn cách */}
      <div style={{ height: 18, width: 1, background: '#E2E8F0', flexShrink: 0 }} />

      {/* 2. Stepper 5 bước trên 1 hàng */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          flexShrink: 0,
        }}
      >
        {steps.map((st, idx) => {
          const isActive = st.key === currentStep;
          const isCompleted = steps.findIndex((s) => s.key === currentStep) > idx;

          return (
            <React.Fragment key={st.key}>
              <button
                type="button"
                onClick={() => handleStepClick(st)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: isActive ? '5px 12px' : '5px 8px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive
                    ? 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)'
                    : 'transparent',
                  color: isActive ? '#FFFFFF' : isCompleted ? '#4F46E5' : '#64748B',
                  fontWeight: isActive ? 700 : isCompleted ? 600 : 500,
                  fontSize: 12,
                  boxShadow: isActive ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{st.icon}</span>
                <span>{st.title}</span>
                {st.key === 'shortlist' && typeof shortlistCount === 'number' && shortlistCount > 0 && (
                  <Badge
                    count={shortlistCount}
                    style={{
                      backgroundColor: isActive ? '#FFFFFF' : '#4F46E5',
                      color: isActive ? '#4F46E5' : '#FFFFFF',
                      fontWeight: 800,
                      boxShadow: 'none',
                      fontSize: 10,
                      height: 16,
                      lineHeight: '16px',
                      minWidth: 16,
                    }}
                  />
                )}
              </button>

              {idx < steps.length - 1 && (
                <RightOutlined
                  style={{
                    fontSize: 8,
                    color: isCompleted ? '#818CF8' : '#CBD5E1',
                    margin: '0 1px',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Vạch ngăn cách */}
      <div style={{ height: 18, width: 1, background: '#E2E8F0', flexShrink: 0 }} />

      {/* 3. Nút chuyển tiếp nhanh (Next Action) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {currentStep === 'discovery' && (
          <Button
            type="primary"
            size="small"
            onClick={() => navigate(`/creators/shortlist${activeId !== 'current' ? `?campaignId=${activeId}` : ''}`)}
            style={{
              height: 32,
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 12,
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              border: 'none',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
              padding: '0 14px',
            }}
          >
            Sang Danh sách chọn {typeof shortlistCount === 'number' && shortlistCount > 0 ? `(${shortlistCount})` : ''} ➔
          </Button>
        )}

        {currentStep === 'shortlist' && (
          <Button
            type="primary"
            size="small"
            onClick={() => {
              const target = activeId !== 'current' ? activeId : '';
              navigate(target ? `/campaign-management/${target}?tab=recommendation` : '/recommendations?tab=recommendation');
            }}
            style={{
              height: 32,
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 12,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              border: 'none',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
              padding: '0 14px',
            }}
          >
            Sang Đề xuất AI ➔
          </Button>
        )}

        {currentStep === 'recommendation' && (
          <Button
            type="primary"
            size="small"
            onClick={() => {
              const target = activeId !== 'current' ? activeId : '';
              navigate(target ? `/campaign-management/${target}` : '/crm');
            }}
            style={{
              height: 32,
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 12,
              background: '#059669',
              border: 'none',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
              padding: '0 14px',
            }}
          >
            Sang Tiếp cận CRM ➔
          </Button>
        )}

        {/* Nút thu nhỏ */}
        <Tooltip title="Thu nhỏ thanh điều hướng">
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'color 0.2s',
            }}
          >
            <DownOutlined style={{ fontSize: 11 }} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
