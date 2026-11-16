import React from 'react';
import { Spin } from 'antd';
import './CampaignDetailPage.css';
import { useCampaignDetail } from './hooks/useCampaignDetail';
import { useCampaignWorkspace } from '../../hooks/useCampaignWorkspace';
import CampaignWorkspaceBar from '../../components/layout/CampaignWorkspaceBar';
import { CampaignHeroBanner } from './components/detail/CampaignHeroBanner';
import { CampaignMetricCards } from './components/detail/CampaignMetricCards';
import { CampaignDetailNavTabs } from './components/detail/CampaignDetailNavTabs';
import { CampaignOverviewTab } from './components/detail/CampaignOverviewTab';
import { CampaignCreatorsTab } from './components/detail/CampaignCreatorsTab';
import { CampaignBudgetTab } from './components/detail/CampaignBudgetTab';
import { CampaignTimelineTab } from './components/detail/CampaignTimelineTab';
import { CampaignGuidelinesTab } from './components/detail/CampaignGuidelinesTab';
import { CampaignCancelModal } from './components/detail/CampaignCancelModal';
import { translateObjective, translateNiche } from './components/detail/campaignDetailUtils';

export default function CampaignDetailPage() {
  const workspace = useCampaignWorkspace();
  const {
    resolvedId,
    rawCampaign,
    participatingCreators,
    currentStatus,
    activeTab,
    setActiveTab,
    isCancelModalOpen,
    setIsCancelModalOpen,
    cancelReason,
    setCancelReason,
    campaignTitle,
    campaignBudgetFormatted,
    allocatedBudget,
    remainingBudget,
    progressPercent,
    confirmedCreatorCount,
    targetCreatorCount,
    shortlistCount,
    isOverTarget,
    isLoadingDetail,
    handleActivate,
    handleComplete,
    handleConfirmCancel,
    handleNavigateToEdit,
    moreMenuItems,
    creatorColumns,
  } = useCampaignDetail();

  return (
    <div className="campaign-detail-container" style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px 40px' }}>
      {/* Workspace Workflow Bar for End-to-End navigation */}
      <div style={{ marginBottom: 16 }}>
        <CampaignWorkspaceBar workspace={workspace} />
      </div>

      {isLoadingDetail && !rawCampaign ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Spin size="large" tip="Đang tải dữ liệu chiến dịch..." />
        </div>
      ) : (
        <>
          {/* 1. Header Banner */}
          <CampaignHeroBanner
            campaignTitle={campaignTitle}
            rawCampaign={rawCampaign}
            currentStatus={currentStatus}
            resolvedId={resolvedId}
            handleActivate={handleActivate}
            handleComplete={handleComplete}
            moreMenuItems={moreMenuItems}
            setActiveTab={setActiveTab}
            translateObjective={translateObjective}
            translateNiche={translateNiche}
          />

          {/* 2. Metric KPI Cards */}
          <CampaignMetricCards
            campaignBudgetFormatted={campaignBudgetFormatted}
            allocatedBudget={allocatedBudget}
            progressPercent={progressPercent}
            rawCampaign={rawCampaign}
            participatingCreators={participatingCreators}
            confirmedCreatorCount={confirmedCreatorCount}
            targetCreatorCount={targetCreatorCount}
            shortlistCount={shortlistCount}
            isOverTarget={isOverTarget}
            setActiveTab={setActiveTab}
          />

          {/* 3. Navigation Tabs */}
          <CampaignDetailNavTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            creatorsCount={confirmedCreatorCount || participatingCreators.length}
          />

          {/* 4. Tab Content Area */}
          <div className="cdetail-tab-content-wrap">
            {activeTab === 'overview' && (
              <CampaignOverviewTab
                rawCampaign={rawCampaign}
                currentStatus={currentStatus}
                participatingCreators={participatingCreators}
                handleNavigateToEdit={handleNavigateToEdit}
                moreMenuItems={moreMenuItems}
              />
            )}

            {activeTab === 'creators' && (
              <CampaignCreatorsTab
                participatingCreators={participatingCreators}
                creatorColumns={creatorColumns}
                resolvedId={resolvedId}
              />
            )}

            {activeTab === 'budget' && (
              <CampaignBudgetTab
                campaignBudgetFormatted={campaignBudgetFormatted}
                allocatedBudget={allocatedBudget}
                remainingBudget={remainingBudget}
                confirmedCreatorCount={confirmedCreatorCount}
                participatingCreators={participatingCreators}
                campaignTitle={campaignTitle}
              />
            )}

            {activeTab === 'timeline' && (
              <CampaignTimelineTab rawCampaign={rawCampaign} />
            )}

            {activeTab === 'guidelines' && (
              <CampaignGuidelinesTab rawCampaign={rawCampaign} />
            )}
          </div>

          {/* 5. Cancel Campaign Confirmation Modal */}
          <CampaignCancelModal
            isOpen={isCancelModalOpen}
            campaignTitle={campaignTitle}
            cancelReason={cancelReason}
            setCancelReason={setCancelReason}
            onConfirmCancel={handleConfirmCancel}
            onClose={() => setIsCancelModalOpen(false)}
          />
        </>
      )}
    </div>
  );
}
