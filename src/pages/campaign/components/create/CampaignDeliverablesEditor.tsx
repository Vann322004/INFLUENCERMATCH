import { Button, Input, InputNumber, Select } from 'antd';
import type { CampaignPlatform, CampaignPlanningFields } from '../../../../types/api/campaign.types';
type Deliverables = NonNullable<CampaignPlanningFields['deliverables']>;
export default function CampaignDeliverablesEditor({ value, onChange, platforms }: { value: Deliverables; onChange: (value: Deliverables) => void; platforms: string[] }) {
  const update = (index: number, patch: Partial<Deliverables[number]>) => onChange(value.map((item, i) => i === index ? { ...item, ...patch } : item));
  return <section className="ccreate-card"><h3>Ấn phẩm dự kiến của chiến dịch</h3><p className="ad-note">Khai báo loại nội dung và số lượng trên từng nền tảng trước khi chuyển sang sẵn sàng khám phá.</p>
    {value.map((item, index) => <div className="workflow-deliverable" key={index}>
      <Select aria-label={`Nền tảng ấn phẩm ${index + 1}`} value={item.platform} options={platforms.map(platform => ({ value: platform.toUpperCase(), label: platform }))} onChange={platform => update(index, { platform })} />
      <Input aria-label={`Nội dung ấn phẩm ${index + 1}`} placeholder="Loại nội dung, ví dụ: video đánh giá" maxLength={100} value={item.contentType} onChange={e => update(index, { contentType: e.target.value })} />
      <InputNumber aria-label={`Số lượng ấn phẩm ${index + 1}`} min={1} precision={0} value={item.quantity} onChange={quantity => update(index, { quantity: quantity ?? 1 })} />
      <Button onClick={() => onChange(value.filter((_, i) => i !== index))}>Bỏ</Button>
    </div>)}
    <Button disabled={!platforms.length} onClick={() => onChange([...value, { platform: platforms[0].toUpperCase() as CampaignPlatform, contentType: '', quantity: 1 }])}>Thêm ấn phẩm</Button>
  </section>;
}
