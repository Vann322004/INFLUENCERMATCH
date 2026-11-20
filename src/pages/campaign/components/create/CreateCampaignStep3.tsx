import type { ReactNode } from 'react';
import { Button, InputNumber } from 'antd';
import type { CampaignPlanningFields } from '../../../../types/api/campaign.types';

interface Props {
  budgetTotal: number;
  setBudgetTotal: (value: number) => void;
  campaignName: string;
  product: string;
  selectedPlatforms: string[];
  creatorQuantity: number;
  creatorTier: string;
  selectedAges: string[];
  selectedGender: string;
  locationState: string;
  isAiAutofilled: boolean;
  startDate: string;
  endDate: string;
  brief: string;
  deliverables: NonNullable<CampaignPlanningFields['deliverables']>;
  children: ReactNode;
}
const dateLabel = (value: string) => value ? value.split('-').reverse().join('/') : 'Chưa chọn';
export const CreateCampaignStep3 = (props: Props) => {
  const { budgetTotal, setBudgetTotal } = props;
  const budgetValid = Number.isSafeInteger(budgetTotal) && budgetTotal > 0;
  const tier = ({ nano: 'Quy mô nhỏ', micro: 'Quy mô vừa', macro: 'Quy mô lớn', mega: 'Quy mô rất lớn' } as Record<string, string>)[props.creatorTier];
  return <div className={`ccreate-card ${props.isAiAutofilled ? 'ai-highlight-card' : ''}`}>
    <div className="ccreate-card-header">
      <div className="ccreate-card-badge">3</div>
      <div><div className="ccreate-card-title">Ngân sách & thời gian</div><div className="ccreate-card-subtitle">Kiểm tra thông tin trước khi chốt yêu cầu chiến dịch.</div></div>
    </div>
    <label className="ccreate-field-label" htmlFor="campaign-total-budget">Tổng ngân sách dự kiến (VND) <span className="req">*</span></label>
    <InputNumber<number> id="campaign-total-budget" min={1} max={Number.MAX_SAFE_INTEGER} precision={0} controls={false}
      value={budgetTotal > 0 ? budgetTotal : null} placeholder="Nhập tổng ngân sách"
      onChange={value => setBudgetTotal(value != null && Number.isSafeInteger(value) && value > 0 ? value : 0)}
      formatter={value => value == null ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
      parser={value => Number((value ?? '').replace(/\./g, ''))}
      suffix="₫" style={{ width: '100%' }} />
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 10 }}>
      <span className="ad-note">Chọn nhanh:</span>
      {[5_000_000, 10_000_000, 20_000_000, 50_000_000].map(value => <Button key={value} size="small"
        type={budgetTotal === value ? 'primary' : 'default'} aria-pressed={budgetTotal === value}
        onClick={() => setBudgetTotal(value)}>{value / 1_000_000} triệu</Button>)}
    </div>
    {props.children}
    <div className="ccreate-sub-section">
      <div className="ccreate-sub-title">Tóm tắt trước khi chốt</div>
      <div className="ccreate-overview-card">
        {[
          ['Tên chiến dịch', props.campaignName || 'Chưa nhập'],
          ['Sản phẩm', props.product || 'Chưa nhập'],
          ['Ngân sách kế hoạch', budgetValid ? `${budgetTotal.toLocaleString('vi-VN')} ₫` : 'Chưa nhập'],
          ['Thời gian', `${dateLabel(props.startDate)} – ${dateLabel(props.endDate)}`],
          ['Nền tảng & nhà sáng tạo', `${props.selectedPlatforms.map(value => ({ tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube' }[value] ?? value)).join(', ')} · ${props.creatorQuantity} nhà sáng tạo${tier ? ` · ${tier}` : ''}`],
          ['Khán giả & khu vực', [
            [...props.selectedAges].sort((a, b) => parseInt(a) - parseInt(b)).join(', '),
            ({ all: 'Tất cả giới tính', female: 'Nữ', male: 'Nam' } as Record<string, string>)[props.selectedGender],
            props.locationState === 'nationwide' ? 'Toàn quốc' : props.locationState,
          ].filter(Boolean).join(' · ') || 'Chưa thiết lập'],
        ].map(([label, value]) => <div className="ccreate-overview-item" key={label}><span className="ccreate-overview-item-label">{label}</span><span className="ccreate-overview-item-val">{value}</span></div>)}
        <div className="ccreate-overview-item"><span className="ccreate-overview-item-label">Ấn phẩm dự kiến</span>
          <span className="ccreate-overview-item-val">{props.deliverables.length ? props.deliverables.map(item => `${item.quantity} ${item.contentType} · ${item.platform}`).join('; ') : 'Chưa thêm ấn phẩm'}</span>
        </div>
        <div className="ccreate-overview-item"><span className="ccreate-overview-item-label">Yêu cầu sáng tạo</span><span className="ccreate-overview-item-val" style={{ whiteSpace: 'pre-wrap' }}>{props.brief || 'Chưa nhập'}</span></div>
      </div>
    </div>
  </div>;
};
export default CreateCampaignStep3;
