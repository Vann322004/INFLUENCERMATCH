import { Button } from 'antd';
import type { MenuProps } from 'antd';
import type { CampaignResponse } from '../../../../types/api/campaign.types';
import type { CampaignStatusType, CampaignCreatorRow } from './campaignDetailTypes';
import { translateObjective } from './campaignDetailUtils';
interface Props {
  rawCampaign: CampaignResponse | null;
  currentStatus: CampaignStatusType;
  participatingCreators: CampaignCreatorRow[];
  handleNavigateToEdit: () => void;
  moreMenuItems: MenuProps['items'];
}
export const CampaignOverviewTab = ({ rawCampaign: c, handleNavigateToEdit }: Props) => (
  <div className="cdetail-overview-rows">
    <div className="cdetail-overview-row">
      <div className="cdetail-card-modern">
        <div className="cdetail-card-header"><span className="cdetail-card-title">Sản phẩm & yêu cầu chiến dịch</span>
          {c?.status === 'DRAFT' && <Button onClick={handleNavigateToEdit}>Chỉnh sửa</Button>}
        </div>
        <div className="cdetail-product-box"><div className="cdetail-product-info">
          <span className="cdetail-product-label">Sản phẩm / Dịch vụ</span>
          <span className="cdetail-product-name">{c?.productService || 'Chưa thiết lập'}</span>
          <div className="cdetail-product-tags">{c?.niches?.map(n => <span key={n} className="cdetail-product-tag">{n}</span>)}</div>
        </div></div>
        <div className="cdetail-brief-block"><span className="cdetail-brief-label">Yêu cầu hợp tác</span>
          <p className="cdetail-brief-text" style={{ whiteSpace: 'pre-wrap' }}>{c?.brief || 'Chưa có yêu cầu hợp tác'}</p>
        </div>
      </div>
      <div className="cdetail-card-modern">
        <div className="cdetail-card-header"><span className="cdetail-card-title">Thông tin chiến dịch</span></div>
        <div className="cdetail-ops-list">
          {[
            ['Mục tiêu', translateObjective(c?.objective)],
            ['Nền tảng', c?.platforms?.join(', ')],
            ['Khán giả mục tiêu', c?.targetAudiences?.join(', ')],
            ['Khu vực', c?.locations?.join(', ')],
            ['Số nhà sáng tạo mục tiêu', c?.targetCreatorCount],
            ['Mô hình', c?.creatorMode === 'MULTI' ? 'Nhiều nhà sáng tạo' : c?.creatorMode === 'SINGLE' ? 'Một nhà sáng tạo' : null],
          ].map(([label, value]) => <div key={label} className="cdetail-ops-row"><span className="cdetail-ops-label">{label}</span><span className="cdetail-ops-value">{value ?? 'Chưa thiết lập'}</span></div>)}
        </div>
      </div>
    </div>
    <div className="cdetail-card-modern">
      <div className="cdetail-card-header"><span className="cdetail-card-title">Ấn phẩm bàn giao</span></div>
      {c?.deliverables?.length ? c.deliverables.map((d, index) => <div className="cdetail-ops-row" key={index}>
        <span>{d.platform} · {d.contentType}</span><span>Số lượng: {d.quantity}</span>
      </div>) : <p>Chưa thiết lập ấn phẩm bàn giao</p>}
    </div>
  </div>
);
