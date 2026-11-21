import React, { useCallback, useSyncExternalStore } from 'react';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { ArrowLeftOutlined, EllipsisOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { rememberCampaign, campaignPath, campaignEditor } from '../../../../services/campaignContext';
import type { CampaignResponse } from '../../../../types/api/campaign.types';
import { aiRecommendationService } from '../../../../services/api/aiRecommendationService';
import { getAuthSessionId, getStoredUser, subscribeAuthSession } from '../../../../services/authSession';
import { useAsyncResource } from '../../../../hooks/useAsyncResource';

import type { CampaignStatusType, CampaignDetailTabKey } from './campaignDetailTypes';
export type { CampaignStatusType, CampaignDetailTabKey };

interface CampaignHeroBannerProps {
  campaignTitle: string;
  rawCampaign: CampaignResponse | null;
  currentStatus: CampaignStatusType;
  resolvedId: string;
  handleActivate: () => void;
  handleComplete: () => void;
  moreMenuItems: MenuProps['items'];
  setActiveTab: (tab: CampaignDetailTabKey) => void;
  translateObjective: (obj?: string) => string;
  translateNiche: (niche?: string) => string;
}

export const CampaignHeroBanner: React.FC<CampaignHeroBannerProps> = ({
  campaignTitle,
  rawCampaign,
  currentStatus,
  resolvedId,
  handleActivate,
  handleComplete,
  moreMenuItems,
  setActiveTab,
  translateObjective,
  translateNiche,
}) => {
  const navigate = useNavigate();
  const sessionId = useSyncExternalStore(subscribeAuthSession, getAuthSessionId);
  const canViewRecommendations = (getStoredUser()?.permissions ?? []).includes('VIEW_OWN_RECOMMENDATION');
  const historyQuery = useCallback(() => {
    if (getAuthSessionId() !== sessionId) throw new Error('Phiên đăng nhập đã thay đổi.');
    return aiRecommendationService.getRecommendationRuns(resolvedId);
  }, [resolvedId, sessionId]);
  const history = useAsyncResource(historyQuery, !!resolvedId && canViewRecommendations);
  const latestRun = history.data?.filter(run => run.status === 'COMPLETED' && Array.isArray(run.scoringSnapshot))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))[0];
  const toolbarMenu: MenuProps['items'] = [
    ...(moreMenuItems ?? []),
    { key: 'budget', label: 'Ngân sách & thỏa thuận', onClick: () => setActiveTab('budget') },
    ...(['DRAFT', 'READY_FOR_DISCOVERY'].includes(rawCampaign?.status ?? '')
      ? [{ key: 'activate', label: 'Kích hoạt chiến dịch', onClick: handleActivate }] : []),
    ...(rawCampaign?.status === 'ACTIVE'
      ? [{ key: 'complete', label: 'Hoàn thành chiến dịch', onClick: handleComplete }] : []),
  ];

  return (
    <div className="cdetail-hero-banner">
      {/* Top Bar: Back navigation & Date Range */}
      <div className="cdetail-hero-top-row">
        <div className="cdetail-hero-meta-left">
          <button
            type="button"
            className="cdetail-back-btn"
            onClick={() => navigate('/campaigns')}
          >
            <ArrowLeftOutlined style={{ fontSize: 12 }} />
            <span>Danh sách chiến dịch</span>
          </button>
          <span className="cdetail-nav-slash">/</span>
          <span className={`cdetail-hero-status-tag ${currentStatus}`}>
            <span className="cdetail-status-dot-pulse" />
            {currentStatus === 'running'
              ? 'Đang triển khai'
              : currentStatus === 'completed'
              ? 'Hoàn thành'
              : currentStatus === 'cancelled'
              ? 'Đã lưu trữ'
              : rawCampaign?.status === 'READY_FOR_DISCOVERY' ? 'Sẵn sàng lựa chọn' : 'Bản nháp'}
          </span>
        </div>

        <div className="cdetail-hero-date-chip">
          <span>Thời gian:</span>
          <strong>
            {rawCampaign?.startDate ? new Date(rawCampaign.startDate).toLocaleDateString('vi-VN') : 'Chưa thiết lập'}
            {' – '}
            {rawCampaign?.endDate ? new Date(rawCampaign.endDate).toLocaleDateString('vi-VN') : 'Chưa thiết lập'}
          </strong>
        </div>
      </div>

      {/* Main Title, Description & Categorization Tags */}
      <div className="cdetail-hero-meta">
        {rawCampaign?.imageUrl && <img src={rawCampaign.imageUrl} alt="Ảnh chiến dịch" referrerPolicy="no-referrer"
          style={{ display: 'block', width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 12, marginBottom: 20 }}
          onLoad={event => { event.currentTarget.style.display = 'block'; }}
          onError={event => { event.currentTarget.style.display = 'none'; }} />}
        <h1 className="cdetail-hero-title">
          {campaignTitle}
        </h1>

        <p className="cdetail-hero-desc">
          {rawCampaign?.brief || rawCampaign?.productService || ''}
        </p>

        <div className="cdetail-hero-badge-row">
          <span className="cdetail-hero-tag highlight">
            {translateObjective(rawCampaign?.objective)}
          </span>

          {(rawCampaign?.platforms ?? []).map((p) => {
              const name = ({ TIKTOK: 'TikTok', INSTAGRAM: 'Instagram', YOUTUBE: 'YouTube', FACEBOOK: 'Facebook', THREADS: 'Threads', TWITTER: 'X' } as Record<string, string>)[p] || p;
              return (
                <span key={p} className="cdetail-hero-tag">
                  {name}
                </span>
              );
            })}

          {(rawCampaign?.niches || []).map((n) => (
            <span key={n} className="cdetail-hero-tag">
              {translateNiche(n)}
            </span>
          ))}
        </div>
      </div>

      {/* Actions Toolbar */}
      <p className="cdetail-hero-desc">
        {rawCampaign?.status === 'DRAFT' ? 'Bạn có thể chỉnh sửa yêu cầu trước khi bắt đầu đánh giá.'
          : rawCampaign?.status === 'READY_FOR_DISCOVERY' ? 'Yêu cầu đã được chốt. Bạn có thể tiếp tục lựa chọn và đánh giá các kênh.'
          : rawCampaign?.status === 'ACTIVE' ? 'Theo dõi các thỏa thuận và tiến độ hợp tác. Yêu cầu chiến dịch đã được chốt.'
          : rawCampaign?.status === 'COMPLETED' ? 'Chiến dịch đã kết thúc. Bạn có thể xem lại thông tin và kết quả.'
          : 'Chiến dịch đã được lưu trữ và không thể tiếp tục chỉnh sửa.'}
      </p>
      <div className="cdetail-hero-toolbar">
        <div className="cdetail-hero-actions-group">
          {rawCampaign?.status === 'DRAFT' && <button type="button" className="cdetail-hero-btn secondary" onClick={() => {
            const target = campaignEditor(resolvedId);
            navigate(target.path, { state: target.state });
          }}>Chỉnh sửa yêu cầu</button>}
          {['COMPLETED', 'ARCHIVED'].includes(rawCampaign?.status ?? '') ? <button type="button" className="cdetail-hero-btn primary-action" onClick={() => navigate('/campaigns/create')}>Tạo chiến dịch mới</button> : <>
          <button
            type="button"
            className="cdetail-hero-btn primary-action"
            onClick={() => {
              if (!resolvedId) return;
              rememberCampaign(resolvedId);
              navigate(campaignPath('/discovery', resolvedId));
            }}
          >
            Tìm kiếm Nhà sáng tạo
          </button>

          <button type="button" className="cdetail-hero-btn secondary" onClick={() => {
            rememberCampaign(resolvedId);
            navigate('/creators/shortlist', { state: { shortlistContext: { sessionId, campaignId: resolvedId } } });
          }}>Danh sách đã chọn</button>

          <button
            type="button"
            className="cdetail-hero-btn secondary"
            onClick={() => {
              rememberCampaign(resolvedId);
              navigate(campaignPath('/crm', resolvedId));
            }}
          >
            Tiếp cận & thỏa thuận
          </button>
          </>}

          {latestRun && <button type="button" className="cdetail-hero-btn secondary" onClick={() => {
            rememberCampaign(resolvedId);
            navigate('/campaign-management?tab=recommendation', { state: {
              recommendationContext: { sessionId, campaignId: resolvedId, creatorIds: [] },
              recommendationViewRunId: latestRun.id,
            } });
          }}>Xem gợi ý AI</button>}

          <Dropdown menu={{ items: toolbarMenu }} trigger={['click']} placement="bottomRight">
            <button type="button" className="cdetail-hero-btn icon-btn" title="Thao tác khác">
              <EllipsisOutlined style={{ fontSize: 16 }} />
            </button>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};
