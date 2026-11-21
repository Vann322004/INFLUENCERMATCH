import React from 'react';
import { Alert, Button, Spin } from 'antd';
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
    activationNeedsDeliverables, editDeliverables,
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
    loadError, relatedErrors, reload, collaborationsError,
    handleActivate,
    handleComplete,
    handleConfirmCancel,
    handleNavigateToEdit,
    moreMenuItems,
    creatorColumns,
  } = useCampaignDetail();

  return (
    <div className="campaign-detail-container" style={{ maxWidth: 1400, width: '100%', minWidth: 0, margin: '0 auto', padding: '0 0 24px' }}>
      {/* Workspace Workflow Bar for End-to-End navigation */}
      {!workspace.id && (
        <div style={{ marginBottom: 16 }}>
          <CampaignWorkspaceBar workspace={workspace} />
        </div>
      )}

      {relatedErrors.length > 0 && <Alert type="warning" title="Không tải được một số dữ liệu ngân sách, danh sách đã chọn hoặc hợp tác." action={<Button onClick={reload}>Thử lại</Button>} />}
      {loadError ? <Alert type="error" title="Không tải được chiến dịch" description={loadError} action={<Button onClick={reload}>Thử lại</Button>} /> : !resolvedId ? null : isLoadingDetail && !rawCampaign ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Spin size="large" tip="Đang tải dữ liệu chiến dịch..." />
        </div>
      ) : (
        <>
          {/* 1. Header Banner */}
          {activationNeedsDeliverables && <Alert
            type="warning"
            showIcon
            title="Cần bổ sung ấn phẩm bàn giao trước khi kích hoạt"
            description="Thêm nền tảng, loại nội dung và số lượng, sau đó lưu chiến dịch."
            action={rawCampaign?.status === 'DRAFT' ? <Button type="primary" onClick={editDeliverables}>Bổ sung ấn phẩm</Button> : undefined}
            style={{ marginBottom: 16 }}
          />}
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
            creatorsCount={participatingCreators.length}
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
                onViewRequirements={() => setActiveTab('guidelines')}
              />
            )}

            {activeTab === 'creators' && (collaborationsError ? <Alert type="error" title="Không tải được danh sách hợp tác" action={<Button onClick={reload}>Thử lại</Button>} /> : (
              <CampaignCreatorsTab
                participatingCreators={participatingCreators}
                creatorColumns={creatorColumns}
                resolvedId={resolvedId}
              />
            ))}

            {activeTab === 'budget' && (
              <CampaignBudgetTab
                campaignBudgetFormatted={campaignBudgetFormatted}
                allocatedBudget={allocatedBudget}
                remainingBudget={remainingBudget}
                confirmedCreatorCount={confirmedCreatorCount}
                participatingCreators={participatingCreators}
                campaignTitle={campaignTitle}
                collaborationsError={collaborationsError}
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
