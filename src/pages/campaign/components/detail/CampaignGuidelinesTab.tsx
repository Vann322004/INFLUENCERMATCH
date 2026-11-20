import type { CampaignResponse } from '../../../../types/api/campaign.types';
export const CampaignGuidelinesTab = ({ rawCampaign }: { rawCampaign: CampaignResponse | null }) => (
  <div className="cdetail-card-modern">
    <div className="cdetail-card-header"><span className="cdetail-card-title">Yêu cầu hợp tác</span></div>
    <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{rawCampaign?.brief || 'Chưa có yêu cầu hợp tác được lưu.'}</p>
    <div className="cdetail-card-header"><span className="cdetail-card-title">Ấn phẩm bàn giao</span></div>
    {rawCampaign?.deliverables?.length ? rawCampaign.deliverables.map((d, index) => (
      <div className="cdetail-ops-row" key={index}><span>{d.platform} · {d.contentType}</span><span>Số lượng: {d.quantity}</span></div>
    )) : <p>Chưa thiết lập ấn phẩm bàn giao.</p>}
  </div>
);
