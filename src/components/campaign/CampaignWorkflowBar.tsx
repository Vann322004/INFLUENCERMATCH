import React from 'react';
import { Card, Select, Button, Badge, Tag, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleFilled,
  CompassOutlined,
  UnorderedListOutlined,
  ThunderboltFilled,
  TeamOutlined,
  RightOutlined,
  PlusOutlined,
  RocketOutlined,
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

  const activeId = campaignId || (availableCampaigns[0]?.id) || 'current';
  const displayName = campaignName || availableCampaigns.find((c) => c.id === activeId)?.name || 'Chiến dịch hiện tại';

  // Steps definition
  const steps: { key: WorkflowStep; stepNum: number; title: string; icon: React.ReactNode; path: string }[] = [
    {
      key: 'create',
      stepNum: 1,
      title: 'Tạo Brief AI',
      icon: <CheckCircleFilled style={{ color: currentStep === 'create' ? '#4F46E5' : '#10B981' }} />,
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
      icon: <ThunderboltFilled style={{ color: currentStep === 'recommendation' ? '#F59E0B' : undefined }} />,
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
    <Card
      style={{
        borderRadius: 14,
        marginBottom: 20,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
      bodyStyle={{ padding: '12px 18px' }}
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
        {/* Left: Active Campaign Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 260 }}>
          <Tag
            color="purple"
            style={{
              fontWeight: 800,
              fontSize: 11,
              borderRadius: 6,
              padding: '2px 8px',
              textTransform: 'uppercase',
            }}
          >
            Quy trình chiến dịch
          </Tag>

          {availableCampaigns.length > 0 ? (
            <Select
              value={activeId}
              onChange={(val) => {
                if (onSelectCampaign) {
                  onSelectCampaign(val);
                } else {
                  // Auto redirect to current step with new campaign
                  if (currentStep === 'discovery') navigate(`/creators?campaignId=${val}`);
                  else if (currentStep === 'shortlist') navigate(`/creators/shortlist?campaignId=${val}`);
                  else if (currentStep === 'recommendation') navigate(`/campaign-management/${val}?tab=recommendation`);
                  else if (currentStep === 'crm') navigate(`/campaign-management/${val}`);
                }
              }}
              style={{ minWidth: 200, fontWeight: 700 }}
              options={availableCampaigns.map((c) => ({
                value: c.id,
                label: `🎯 ${c.name}`,
              }))}
            />
          ) : (
            <span style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
              🎯 {displayName}
            </span>
          )}
        </div>

        {/* Center: Funnel Stepper */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            background: '#F8FAFC',
            padding: '6px 12px',
            borderRadius: 10,
            border: '1px solid #EEF2F6',
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
                    padding: '5px 12px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive
                      ? '#4F46E5'
                      : isCompleted
                      ? '#EEF2FF'
                      : 'transparent',
                    color: isActive ? '#fff' : isCompleted ? '#4338CA' : '#64748B',
                    fontWeight: isActive ? 800 : isCompleted ? 700 : 500,
                    fontSize: 12.5,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{st.icon}</span>
                  <span>{st.title}</span>
                  {st.key === 'shortlist' && typeof shortlistCount === 'number' && (
                    <Badge
                      count={shortlistCount}
                      style={{
                        backgroundColor: isActive ? '#fff' : '#4F46E5',
                        color: isActive ? '#4F46E5' : '#fff',
                        fontWeight: 800,
                        boxShadow: 'none',
                      }}
                    />
                  )}
                </button>

                {idx < steps.length - 1 && (
                  <RightOutlined
                    style={{
                      fontSize: 10,
                      color: isCompleted ? '#818CF8' : '#CBD5E1',
                      margin: '0 2px',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right: Quick Action to next step */}
        <div>
          {currentStep === 'discovery' && (
            <Button
              type="primary"
              size="middle"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate(`/creators/shortlist${activeId !== 'current' ? `?campaignId=${activeId}` : ''}`)}
              style={{
                borderRadius: 8,
                fontWeight: 700,
                background: '#4F46E5',
              }}
            >
              Sang Shortlist ({typeof shortlistCount === 'number' ? shortlistCount : '➔'})
            </Button>
          )}

          {currentStep === 'shortlist' && (
            <Button
              type="primary"
              size="middle"
              icon={<ThunderboltFilled />}
              onClick={() => {
                const target = activeId !== 'current' ? activeId : '';
                navigate(target ? `/campaign-management/${target}?tab=recommendation` : '/recommendations?tab=recommendation');
              }}
              style={{
                borderRadius: 8,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
                borderColor: 'transparent',
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
              }}
            >
              ⚡ Đề xuất AI Four-Memory ➔
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
                borderRadius: 8,
                fontWeight: 700,
                background: '#059669',
                borderColor: 'transparent',
              }}
            >
              Sang Tiếp cận CRM ➔
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
