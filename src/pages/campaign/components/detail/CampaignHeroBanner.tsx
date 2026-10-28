import React from 'react';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { ArrowLeftOutlined, EllipsisOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { CampaignResponse } from '../../../../types/api/campaign.types';

export type { CampaignStatusType } from './campaignDetailTypes';

interface CampaignHeroBannerProps {
  campaignTitle: string;
  rawCampaign: CampaignResponse | null;
  currentStatus: CampaignStatusType;
  resolvedId: string;
  handleActivate: () => void;
  handleComplete: () => void;
  moreMenuItems: MenuProps['items'];
  setActiveTab: (tab: string) => void;
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
              : 'Bản nháp'}
          </span>
        </div>

        <div className="cdetail-hero-date-chip">
          <span>Thời gian:</span>
          <strong>
            {rawCampaign?.startDate ? new Date(rawCampaign.startDate).toLocaleDateString('vi-VN') : '26/10/2026'}
            {' – '}
            {rawCampaign?.endDate ? new Date(rawCampaign.endDate).toLocaleDateString('vi-VN') : '25/12/2026'}
          </strong>
        </div>
      </div>

      {/* Main Title, Description & Categorization Tags */}
      <div className="cdetail-hero-meta">
        <h1 className="cdetail-hero-title">
          {campaignTitle}
        </h1>

        <p className="cdetail-hero-desc">
          {rawCampaign?.description ||
            'Chiến dịch ra mắt sản phẩm hè 2026, tiếp cận tệp khách hàng tiềm năng qua các nền tảng mạng xã hội.'}
        </p>

        <div className="cdetail-hero-badge-row">
          <span className="cdetail-hero-tag highlight">
            {translateObjective(rawCampaign?.objective)}
          </span>

          {((rawCampaign?.platforms && rawCampaign.platforms.length > 0)
            ? rawCampaign.platforms
            : (['TIKTOK', 'INSTAGRAM'] as any[])
          )
            .filter((p: any) => String(p).toUpperCase() !== 'YOUTUBE')
            .map((p: any) => {
              const name = String(p).toUpperCase() === 'TIKTOK' ? 'TikTok' : 'Instagram';
              return (
                <span key={p} className="cdetail-hero-tag">
                  {name}
                </span>
              );
            })}

          {(rawCampaign?.niches || ['Beauty', 'Skincare', 'Lifestyle']).map((n) => (
            <span key={n} className="cdetail-hero-tag">
              {translateNiche(n)}
            </span>
          ))}
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="cdetail-hero-toolbar">
        <div className="cdetail-hero-actions-group">
          <button
            type="button"
            className="cdetail-hero-btn primary-action"
            onClick={() => {
              const cId = resolvedId || 'camp_sg2026';
              sessionStorage.setItem('current_campaign_id', cId);
              navigate(`/discovery?campaignId=${cId}`, { state: { campaignId: cId } });
            }}
          >
            Tìm kiếm KOC
          </button>

          <button
            type="button"
            className="cdetail-hero-btn secondary"
            onClick={() => {
              sessionStorage.setItem('current_campaign_id', resolvedId);
              navigate('/crm');
            }}
          >
            Tiến độ hợp tác
          </button>

          <button
            type="button"
            className="cdetail-hero-btn secondary"
            onClick={() => setActiveTab('budget')}
          >
            Chi phí & Thanh toán
          </button>

          {currentStatus === 'draft' && (
            <button
              type="button"
              className="cdetail-hero-btn success"
              onClick={handleActivate}
            >
              Kích hoạt
            </button>
          )}

          {currentStatus !== 'completed' && currentStatus !== 'draft' && currentStatus !== 'cancelled' && (
            <button
              type="button"
              className="cdetail-hero-btn secondary"
              onClick={handleComplete}
            >
              Hoàn thành
            </button>
          )}

          <Dropdown menu={{ items: moreMenuItems }} trigger={['click']} placement="bottomRight">
            <button type="button" className="cdetail-hero-btn icon-btn" title="Thao tác khác">
              <EllipsisOutlined style={{ fontSize: 16 }} />
            </button>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};
