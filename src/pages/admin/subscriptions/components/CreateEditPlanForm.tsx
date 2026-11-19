import React, { useEffect } from 'react';
import { Drawer, Form, Input, InputNumber, Button, Select, Alert } from 'antd';
import type { PlanResponse, PlanCreateRequest, PlanUpdateRequest } from '../../../../types/api/subscription.types';
import './CreateEditPlanForm.css';

interface Props {
  open: boolean;
  onClose: () => void;
  plan: PlanResponse | null;
  onSave: (payload: PlanCreateRequest | PlanUpdateRequest, planId?: string) => Promise<void>;
  saving?: boolean;
}
const quotas = [
  { name: 'campaignQuota', label: 'Chiến dịch', help: 'Số chiến dịch được tạo trong một chu kỳ.', unit: 'chiến dịch' },
  { name: 'recommendationQuota', label: 'Gợi ý nhà sáng tạo', help: 'Số lượt sử dụng tính năng gợi ý nhà sáng tạo.', unit: 'lượt' },
  { name: 'refreshQuota', label: 'Làm mới dữ liệu', help: 'Số lượt cập nhật lại dữ liệu nhà sáng tạo.', unit: 'lượt' },
];

export default function CreateEditPlanForm({ open, onClose, plan, onSave, saving = false }: Props) {
  const [form] = Form.useForm();
  const price = Form.useWatch('price', form);
  const duration = Form.useWatch('durationDays', form);
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(plan ? {
      planName: plan.planName, description: plan.description || '', price: plan.price,
      durationDays: plan.durationDays, campaignQuota: plan.campaignQuota,
      recommendationQuota: plan.recommendationQuota, refreshQuota: plan.refreshQuota,
      status: plan.status,
    } : { planName: '', description: '', price: 0, durationDays: 30,
      campaignQuota: 5, recommendationQuota: 50, refreshQuota: 20, status: 'ACTIVE' });
  }, [open, plan, form]);

  const submit = async () => {
    if (saving) return;
    try {
      const values = await form.validateFields();
      const payload: PlanCreateRequest = {
        planName: values.planName.trim(), description: values.description?.trim() || '',
        price: values.price, currency: plan?.currency || 'VND', durationDays: values.durationDays,
        campaignQuota: values.campaignQuota, recommendationQuota: values.recommendationQuota,
        refreshQuota: values.refreshQuota,
      };
      if (plan) await onSave({ ...payload, status: values.status }, plan.id);
      else await onSave(payload);
    } catch (error) {
      const validation = error as { errorFields?: { name: string[] }[] };
      if (validation.errorFields?.length) form.scrollToField(validation.errorFields[0].name, { focus: true, block: 'center' });
      // API failures are displayed by the parent; preserve the form for retry.
    }
  };
  const close = () => { if (!saving) onClose(); };
  return <Drawer
    title={<div className="plan-form-heading"><span>{plan ? 'Chỉnh sửa gói dịch vụ' : 'Tạo gói dịch vụ mới'}</span><p>{plan ? plan.planName : 'Thiết lập thông tin, giá và hạn mức cho gói.'}</p></div>}
    open={open} onClose={close} size="min(600px, 100vw)" rootClassName="plan-form-drawer"
    destroyOnClose maskClosable={!saving} keyboard={!saving} closable={!saving}
    footer={<div className="plan-form-footer">
      <div className="plan-form-summary"><strong>{price == null ? 'Chưa nhập giá' : price === 0 ? 'Miễn phí' : `${Number(price).toLocaleString('vi-VN')} ₫`}</strong><span>{duration ? ` / ${duration} ngày` : ''}</span></div>
      <div className="plan-form-footer-buttons"><Button disabled={saving} onClick={close}>Hủy bỏ</Button><Button type="primary" loading={saving} onClick={submit}>{plan ? 'Lưu thay đổi' : 'Tạo gói'}</Button></div>
    </div>}
  >
    {plan && <Alert className="plan-form-impact" type="info" title={plan.activeSubscriptionCount == null ? 'Ảnh hưởng khi sửa gói' : `${plan.activeSubscriptionCount} thuê bao đang hoạt động`} description="Thay đổi chỉ áp dụng cho lượt đăng ký mới. Thuê bao hiện tại giữ nguyên điều khoản đã đăng ký." />}
    <Form form={form} layout="vertical" requiredMark={false} disabled={saving} size="large" className="plan-edit-form" onFinish={submit}>
      <section className="plan-form-section">
        <h3>Thông tin gói</h3>
        <Form.Item name="planName" label="Tên gói dịch vụ" rules={[{ required: true, whitespace: true, message: 'Nhập tên gói dịch vụ.' }, { max: 100, message: 'Tên gói tối đa 100 ký tự.' }]}>
          <Input maxLength={100} placeholder="Ví dụ: Cơ bản, Chuyên nghiệp" autoComplete="off" />
        </Form.Item>
        <Form.Item name="description" label={<span>Mô tả <span className="plan-form-optional">Không bắt buộc</span></span>} rules={[{ max: 2000, message: 'Mô tả tối đa 2000 ký tự.' }]}>
          <Input.TextArea placeholder="Gói phù hợp với ai và có quyền lợi gì?" autoSize={{ minRows: 2, maxRows: 5 }} maxLength={2000} />
        </Form.Item>
      </section>
      <section className="plan-form-section">
        <h3>Giá và thời hạn</h3>
        <div className="plan-form-price-grid">
          <Form.Item name="price" label="Giá gói (VNĐ)" extra="Nhập 0 nếu là gói miễn phí." rules={[{ required: true, message: 'Nhập giá gói.' }, { type: 'integer', min: 0, max: 9999999999, message: 'Nhập số nguyên từ 0 đến 9.999.999.999.' }]}>
            <InputNumber<number> controls={false} min={0} max={9999999999} precision={0} inputMode="numeric" placeholder="Ví dụ: 1.500.000"
              formatter={(value, info) => info.userTyping ? info.input : value == null ? '' : Number(value).toLocaleString('vi-VN')}
              parser={value => value?.replace(/[.\s,₫]/g, '') as unknown as number} />
          </Form.Item>
          <Form.Item name="durationDays" label="Thời hạn (ngày)" rules={[{ required: true, message: 'Nhập thời hạn.' }, { type: 'integer', min: 1, max: 3650, message: 'Nhập từ 1 đến 3650 ngày.' }]}>
            <InputNumber controls={false} min={1} max={3650} precision={0} inputMode="numeric" placeholder="Ví dụ: 30" />
          </Form.Item>
        </div>
        <div className="plan-form-presets"><span>Chọn nhanh thời hạn</span>{[30, 90, 180, 365].map(days => <Button key={days} size="small" type={duration === days ? 'primary' : 'default'} disabled={saving} onClick={() => { form.setFieldValue('durationDays', days); form.validateFields(['durationDays']).catch(() => {}); }}>{days} ngày</Button>)}</div>
      </section>
      <section className="plan-form-section">
        <h3>Hạn mức sử dụng</h3>
        <p className="plan-form-section-note">Áp dụng cho mỗi chu kỳ gói. Nhập 0 nếu không cung cấp tính năng.</p>
        {quotas.map(field => <div className="plan-form-quota-row" key={field.name}>
          <div><label htmlFor={field.name}>{field.label}</label><p>{field.help}</p></div>
          <div className="plan-form-quota-input">
            <Form.Item name={field.name} rules={[{ required: true, message: 'Nhập hạn mức.' }, { type: 'integer', min: 0, max: 2147483647, message: 'Nhập số nguyên từ 0 đến 2.147.483.647.' }]}>
              <InputNumber id={field.name} aria-label={field.label} controls={false} min={0} max={2147483647} precision={0} inputMode="numeric" />
            </Form.Item>
            <span>{field.unit}</span>
          </div>
        </div>)}
      </section>
      {plan && <section className="plan-form-section"><h3>Mở bán</h3><Form.Item name="status" label="Trạng thái gói" rules={[{required:true,message:'Chọn trạng thái gói.'}]}><Select options={[{value:'ACTIVE',label:'Đang mở bán'},{value:'INACTIVE',label:'Ngừng bán'}]} /></Form.Item></section>}
    </Form>
  </Drawer>;
}
