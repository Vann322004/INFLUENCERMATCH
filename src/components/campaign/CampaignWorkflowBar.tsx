import React, { useState } from 'react';
import { Select, Button, Badge, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  CheckOutlined,
  RightOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';

export type WorkflowStep =
  | 'create'
  | 'discovery'
  | 'shortlist'
  | 'recommendation'
  | 'crm'
  | 'collaboration'
  | 'performance';

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

  const isUuid = (val?: string) =>
    !val || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

  // Xác định campaign hợp lệ: nếu campaignId truyền vào có trong availableCampaigns thì dùng, không thì lấy cái đầu tiên
  const selectedCamp = availableCampaigns.find((c) => c.id === campaignId) || availableCampaigns[0];
  const activeId = selectedCamp?.id || (campaignId && !isUuid(campaignId) ? campaignId : 'current');
  const rawDisplayName = campaignName || selectedCamp?.name;
  const displayName = !rawDisplayName || isUuid(rawDisplayName) ? 'Chiến dịch hiện tại' : rawDisplayName;

  // 7 bước quy trình trọn vẹn của chiến dịch
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
      path: '/creators',
    },
    {
      key: 'shortlist',
      stepNum: 3,
      title: 'Danh sách chọn',
      path: '/creators/shortlist',
    },
    {
      key: 'recommendation',
      stepNum: 4,
      title: 'Đề xuất AI',
      path: '/campaign-management?tab=recommendation',
    },
    {
      key: 'crm',
      stepNum: 5,
      title: 'Tiếp cận CRM',
      path: '/campaign-management?tab=crm',
    },
    {
      key: 'collaboration',
      stepNum: 6,
      title: 'Quản lý Hợp tác',
      path: '/collaboration',
    },
    {
      key: 'performance',
      stepNum: 7,
      title: 'Đo lường ROI',
      path: '/performance',
    },
  ];

  const currentIdx = steps.findIndex((s) => s.key === currentStep);

  const handleStepClick = (step: typeof steps[0]) => {
    navigate(step.path);
  };

  // Trạng thái thu gọn (Mini Pill Dock căn giữa 100%)
  if (collapsed) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: 0,
          right: 0,
          margin: '0 auto',
          width: 'fit-content',
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
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(12px)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 999,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
        >
          <span>🎯 Tiến trình: {currentIdx + 1}/{steps.length}</span>
          <UpOutlined style={{ fontSize: 10 }} />
        </button>
      </div>
    );
  }

  // Dạng Thanh Tiến Trình Căn Giữa 100% Cân Đối (Zero Horizontal Offset)
  return (
    <div
      className="im-workflow-bottom-dock"
      style={{
        position: 'fixed',
        bottom: 20,
        left: 0,
        right: 0,
        margin: '0 auto',
        width: 'fit-content',
        maxWidth: 'calc(100vw - 40px)',
        height: 42,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid #E2E8F0',
        borderRadius: 999,
        boxShadow: '0 10px 30px -4px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)',
        padding: '0 8px 0 14px',
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
        {availableCampaigns.length > 0 && availableCampaigns.some((c) => c.id === activeId) ? (
          <Select
            value={activeId}
            onChange={(val) => {
              sessionStorage.setItem('current_campaign_id', val);
              localStorage.setItem('last_active_campaign_id', val);
              if (onSelectCampaign) {
                onSelectCampaign(val);
              } else {
                if (currentStep === 'discovery') navigate('/creators');
                else if (currentStep === 'shortlist') navigate('/creators/shortlist');
                else if (currentStep === 'recommendation') {
                  navigate('/campaign-management?tab=recommendation');
                } else if (currentStep === 'crm') {
                  navigate('/campaign-management?tab=crm');
                }
              }
            }}
            popupMatchSelectWidth={false}
            bordered={false}
            size="small"
            style={{ width: 155 }}
            options={availableCampaigns.map((c) => ({
              value: c.id,
              label: (
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 12.5 }}>
                  🎯 {isUuid(c.name) ? 'Chiến dịch' : c.name}
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
              maxWidth: 150,
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
      <div style={{ height: 16, width: 1, background: '#E2E8F0', flexShrink: 0 }} />

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
          const isCompleted = currentIdx > idx;

          return (
            <React.Fragment key={st.key}>
              <button
                type="button"
                onClick={() => handleStepClick(st)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  height: 28,
                  padding: isActive ? '0 12px' : '0 8px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive
                    ? 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)'
                    : 'transparent',
                  color: isActive ? '#FFFFFF' : isCompleted ? '#4F46E5' : '#64748B',
                  fontWeight: isActive ? 700 : isCompleted ? 600 : 500,
                  fontSize: 12,
                  boxShadow: isActive ? '0 2px 8px rgba(79, 70, 229, 0.28)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Số thứ tự hoặc Icon check xanh */}
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                    background: isActive
                      ? '#FFFFFF'
                      : isCompleted
                      ? '#DCFCE7'
                      : '#F1F5F9',
                    color: isActive
                      ? '#4F46E5'
                      : isCompleted
                      ? '#16A34A'
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
                      height: 16,
                      lineHeight: '16px',
                      minWidth: 16,
                      padding: '0 4px',
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
      <div style={{ height: 16, width: 1, background: '#E2E8F0', flexShrink: 0 }} />

      {/* 3. Nút chuyển tiếp nhanh (Next Action) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {currentStep === 'discovery' && (
          <Button
            type="primary"
            size="small"
            onClick={() => {
              if (activeId && activeId !== 'current') {
                sessionStorage.setItem('current_campaign_id', activeId);
                localStorage.setItem('last_active_campaign_id', activeId);
              }
              navigate('/creators/shortlist');
            }}
            style={{
              height: 30,
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 12,
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              border: 'none',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
              padding: '0 14px',
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
              if (activeId && activeId !== 'current') {
                sessionStorage.setItem('current_campaign_id', activeId);
              }
              navigate('/campaign-management?tab=recommendation');
            }}
            style={{
              height: 30,
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
              if (activeId && activeId !== 'current') {
                sessionStorage.setItem('current_campaign_id', activeId);
              }
              navigate('/campaign-management?tab=crm');
            }}
            style={{
              height: 30,
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
              transition: 'color 0.2s',
            }}
          >
            <DownOutlined style={{ fontSize: 10 }} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
