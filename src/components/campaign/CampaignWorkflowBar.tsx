import React, { useState } from 'react';
import { Select, Button, Badge, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  CheckOutlined,
  RightOutlined,
  UpOutlined,
  DownOutlined,
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

  // 5 bước quy trình dạng tiến trình số chuẩn mực
  const steps: { key: WorkflowStep; stepNum: number; title: string; path: string }[] = [
    {
      key: 'create',
      stepNum: 1,
      title: 'Tạo Brief',
      path: '/campaigns/create',
    },
    {
      key: 'discovery',
      stepNum: 2,
      title: 'Khám phá KOC',
      path: `/creators${activeId !== 'current' ? `?campaignId=${activeId}` : ''}`,
    },
    {
      key: 'shortlist',
      stepNum: 3,
      title: 'Danh sách chọn',
      path: `/creators/shortlist${activeId !== 'current' ? `?campaignId=${activeId}` : ''}`,
    },
    {
      key: 'recommendation',
      stepNum: 4,
      title: 'Đề xuất AI',
      path: activeId !== 'current' ? `/campaign-management/${activeId}?tab=recommendation` : '/recommendations?tab=recommendation',
    },
    {
      key: 'crm',
      stepNum: 5,
      title: 'Tiếp cận CRM',
      path: activeId !== 'current' ? `/campaign-management/${activeId}` : '/crm',
    },
  ];

  const currentIdx = steps.findIndex((s) => s.key === currentStep);

  const handleStepClick = (step: typeof steps[0]) => {
    navigate(step.path);
  };

  // Trạng thái thu gọn (Mini Pill)
  if (collapsed) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 16,
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
            gap: 6,
            height: 32,
            padding: '0 14px',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(12px)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 999,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span>🎯 Tiến trình: {currentIdx + 1}/5</span>
          <UpOutlined style={{ fontSize: 10 }} />
        </button>
      </div>
    );
  }

  // Dạng Thanh Tiến Trình Siêu Gọn (Slimline Progress Bar - Height 36px)
  return (
    <div
      className="im-workflow-bottom-dock"
      style={{
        position: 'fixed',
        bottom: 16,
        left: 'calc(50% + 120px)',
        transform: 'translateX(-50%)',
        width: 'fit-content',
        maxWidth: 'calc(100vw - 280px)',
        height: 38,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid #E2E8F0',
        borderRadius: 999,
        boxShadow: '0 6px 20px -2px rgba(15, 23, 42, 0.1), 0 2px 6px rgba(0, 0, 0, 0.04)',
        padding: '0 6px 0 12px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'nowrap',
        whiteSpace: 'nowrap',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* 1. Tên chiến dịch nhỏ gọn */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
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
            style={{ width: 145 }}
            options={availableCampaigns.map((c) => ({
              value: c.id,
              label: (
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 12 }}>
                  🎯 {c.name}
                </span>
              ),
            }))}
          />
        ) : (
          <span
            style={{
              fontWeight: 700,
              fontSize: 12,
              color: '#0F172A',
              maxWidth: 140,
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

      {/* Vạch ngăn cách */}
      <div style={{ height: 14, width: 1, background: '#E2E8F0', flexShrink: 0 }} />

      {/* 2. Thanh tiến trình 5 nấc siêu gọn */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexShrink: 0,
        }}
      >
        {steps.map((st, idx) => {
          const isActive = st.key === currentStep;
          const isCompleted = currentIdx > idx;

          return (
            <React.Fragment key={st.key}>
              <button
                type="button"
                onClick={() => handleStepClick(st)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  height: 26,
                  padding: isActive ? '0 10px' : '0 6px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? '#4F46E5' : 'transparent',
                  color: isActive ? '#FFFFFF' : isCompleted ? '#4F46E5' : '#64748B',
                  fontWeight: isActive ? 700 : isCompleted ? 600 : 500,
                  fontSize: 11.5,
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Số thứ tự hoặc Icon đã hoàn thành */}
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9.5,
                    fontWeight: 800,
                    background: isActive
                      ? '#FFFFFF'
                      : isCompleted
                      ? '#EEF2FF'
                      : '#F1F5F9',
                    color: isActive
                      ? '#4F46E5'
                      : isCompleted
                      ? '#4F46E5'
                      : '#94A3B8',
                  }}
                >
                  {isCompleted ? <CheckOutlined style={{ fontSize: 9 }} /> : st.stepNum}
                </span>

                <span>{st.title}</span>

                {/* Badge số KOC trong danh sách chọn */}
                {st.key === 'shortlist' && typeof shortlistCount === 'number' && shortlistCount > 0 && (
                  <Badge
                    count={shortlistCount}
                    style={{
                      backgroundColor: isActive ? '#FFFFFF' : '#4F46E5',
                      color: isActive ? '#4F46E5' : '#FFFFFF',
                      fontWeight: 800,
                      boxShadow: 'none',
                      fontSize: 9.5,
                      height: 15,
                      lineHeight: '15px',
                      minWidth: 15,
                      padding: '0 4px',
                    }}
                  />
                )}
              </button>

              {idx < steps.length - 1 && (
                <RightOutlined
                  style={{
                    fontSize: 7.5,
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
      <div style={{ height: 14, width: 1, background: '#E2E8F0', flexShrink: 0 }} />

      {/* 3. Nút chuyển tiếp nấc kế tiếp */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {currentStep === 'discovery' && (
          <Button
            type="primary"
            size="small"
            onClick={() => navigate(`/creators/shortlist${activeId !== 'current' ? `?campaignId=${activeId}` : ''}`)}
            style={{
              height: 26,
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 11.5,
              background: '#4F46E5',
              border: 'none',
              padding: '0 12px',
            }}
          >
            Sang Danh sách {typeof shortlistCount === 'number' && shortlistCount > 0 ? `(${shortlistCount})` : ''} ➔
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
              height: 26,
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 11.5,
              background: '#4F46E5',
              border: 'none',
              padding: '0 12px',
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
              height: 26,
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 11.5,
              background: '#059669',
              border: 'none',
              padding: '0 12px',
            }}
          >
            Sang Tiếp cận CRM ➔
          </Button>
        )}

        {/* Nút thu nhỏ */}
        <Tooltip title="Ẩn thanh tiến trình">
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
            }}
          >
            <DownOutlined style={{ fontSize: 9.5 }} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
