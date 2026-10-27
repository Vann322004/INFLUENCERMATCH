import React from 'react';
import { Select, Button, Badge, Tag, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleFilled,
  CompassOutlined,
  UnorderedListOutlined,
  AimOutlined,
  TeamOutlined,
  RightOutlined,
  ArrowRightOutlined,
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

  const activeId = campaignId || availableCampaigns[0]?.id || 'current';
  const displayName = campaignName || availableCampaigns.find((c) => c.id === activeId)?.name || 'Chiến dịch hiện tại';

  // Steps definition - Chuẩn hóa Tiếng Việt và bỏ bớt các icon AI rườm rà
  const steps: { key: WorkflowStep; stepNum: number; title: string; icon: React.ReactNode; path: string }[] = [
    {
      key: 'create',
      stepNum: 1,
      title: 'Tạo Brief',
      icon: <CheckCircleFilled style={{ color: currentStep === 'create' ? '#FFFFFF' : '#10B981' }} />,
      path: '/campaigns/create',
    },
    {
      key: 'discovery',
      stepNum: 2,
      title: 'Khám phá KOC',
      icon: <CompassOutlined />,
      path: `/creators${activeId !== 'current' ? `?campaignId=${activeId}` : ''}`,
    },
    {
      key: 'shortlist',
      stepNum: 3,
      title: 'Danh sách chọn',
      icon: <UnorderedListOutlined />,
      path: `/creators/shortlist${activeId !== 'current' ? `?campaignId=${activeId}` : ''}`,
    },
    {
      key: 'recommendation',
      stepNum: 4,
      title: 'Đề xuất AI',
      icon: <AimOutlined />,
      path: activeId !== 'current' ? `/campaign-management/${activeId}?tab=recommendation` : '/recommendations?tab=recommendation',
    },
    {
      key: 'crm',
      stepNum: 5,
      title: 'Tiếp cận CRM',
      icon: <TeamOutlined />,
      path: activeId !== 'current' ? `/campaign-management/${activeId}` : '/crm',
    },
  ];

  const handleStepClick = (step: typeof steps[0]) => {
    navigate(step.path);
  };

  return (
    <div
      className="im-workflow-bottom-dock"
      style={{
        position: 'fixed',
        bottom: 20,
        left: 'calc(50% + 120px)',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 300px)',
        maxWidth: 1140,
        minWidth: 320,
        zIndex: 999,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid #E2E8F0',
        borderRadius: 20,
        boxShadow: '0 12px 36px -4px rgba(15, 23, 42, 0.16), 0 2px 8px rgba(0, 0, 0, 0.04)',
        padding: '10px 20px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* 1. Left: Active Campaign Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 230, flexShrink: 0 }}>
        <Tag
          style={{
            fontWeight: 800,
            fontSize: 10.5,
            borderRadius: 6,
            padding: '2px 8px',
            background: '#EEF2FF',
            color: '#4F46E5',
            borderColor: '#C7D2FE',
            margin: 0,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          Quy trình
        </Tag>

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
            style={{ minWidth: 180, maxWidth: 260 }}
            options={availableCampaigns.map((c) => ({
              value: c.id,
              label: (
                <span style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>
                  🎯 {c.name}
                </span>
              ),
            }))}
          />
        ) : (
          <span
            style={{
              fontWeight: 700,
              fontSize: 13.5,
              color: '#0F172A',
              maxWidth: 220,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={displayName}
          >
            🎯 {displayName}
          </span>
        )}
      </div>

      {/* 2. Center: Stepper (5 bước chuẩn mực) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#F8FAFC',
          padding: '4px 10px',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          flex: '1 1 auto',
          justifyContent: 'center',
          minWidth: 320,
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
                onClick={() => handleStepClick(st)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive
                    ? 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)'
                    : isCompleted
                    ? '#EEF2FF'
                    : 'transparent',
                  color: isActive ? '#FFFFFF' : isCompleted ? '#4338CA' : '#64748B',
                  fontWeight: isActive ? 700 : isCompleted ? 600 : 500,
                  fontSize: 12.5,
                  boxShadow: isActive ? '0 3px 10px rgba(79, 70, 229, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
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
                      height: 18,
                      lineHeight: '18px',
                      minWidth: 18,
                    }}
                  />
                )}
              </button>

              {idx < steps.length - 1 && (
                <RightOutlined
                  style={{
                    fontSize: 9,
                    color: isCompleted ? '#818CF8' : '#CBD5E1',
                    margin: '0 1px',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 3. Right: Quick Action chuyển bước tiếp theo */}
      <div style={{ flexShrink: 0 }}>
        {currentStep === 'discovery' && (
          <Button
            type="primary"
            size="middle"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate(`/creators/shortlist${activeId !== 'current' ? `?campaignId=${activeId}` : ''}`)}
            style={{
              height: 38,
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              border: 'none',
              boxShadow: '0 3px 10px rgba(79, 70, 229, 0.25)',
              padding: '0 18px',
            }}
          >
            Sang Danh sách chọn {typeof shortlistCount === 'number' && shortlistCount > 0 ? `(${shortlistCount})` : ''} ➔
          </Button>
        )}

        {currentStep === 'shortlist' && (
          <Button
            type="primary"
            size="middle"
            icon={<AimOutlined />}
            onClick={() => {
              const target = activeId !== 'current' ? activeId : '';
              navigate(target ? `/campaign-management/${target}?tab=recommendation` : '/recommendations?tab=recommendation');
            }}
            style={{
              height: 38,
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              border: 'none',
              boxShadow: '0 3px 10px rgba(124, 58, 237, 0.25)',
              padding: '0 18px',
            }}
          >
            Sang Đề xuất AI ➔
          </Button>
        )}

        {currentStep === 'recommendation' && (
          <Button
            type="primary"
            size="middle"
            icon={<TeamOutlined />}
            onClick={() => {
              const target = activeId !== 'current' ? activeId : '';
              navigate(target ? `/campaign-management/${target}` : '/crm');
            }}
            style={{
              height: 38,
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              background: '#059669',
              border: 'none',
              boxShadow: '0 3px 10px rgba(5, 150, 105, 0.25)',
              padding: '0 18px',
            }}
          >
            Sang Tiếp cận CRM ➔
          </Button>
        )}
      </div>
    </div>
  );
}
