import React, { useEffect } from 'react';
import { Drawer, Form, Input, InputNumber, Button, Space, Divider, Typography, Row, Col, Select } from 'antd';
import type { PlanResponse, PlanCreateRequest, PlanUpdateRequest } from '../../../../types/api/subscription.types';

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  plan: PlanResponse | null;
  onSave: (payload: PlanCreateRequest | PlanUpdateRequest, planId?: string) => Promise<void>;
  saving?: boolean;
}

export default function CreateEditPlanForm({ open, onClose, plan, onSave, saving = false }: Props) {
  const [form] = Form.useForm();
  const isEdit = !!plan;

  useEffect(() => {
    if (open) {
      if (plan) {
        form.setFieldsValue({
          planName: plan.planName,
          description: plan.description || '',
          price: plan.price,
          durationDays: plan.durationDays || 30,
          campaignQuota: plan.campaignQuota,
          recommendationQuota: plan.recommendationQuota,
          refreshQuota: plan.refreshQuota,
          status: plan.status || 'ACTIVE',
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          planName: '',
          description: '',
          price: 0,
          durationDays: 30,
          campaignQuota: 5,
          recommendationQuota: 50,
          refreshQuota: 20,
          status: 'ACTIVE',
        });
      }
    }
  }, [open, plan, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit && plan) {
        const payload: PlanUpdateRequest = {
          planName: values.planName.trim(),
          description: values.description ? values.description.trim() : '',
          price: Number(values.price) || 0,
          currency: 'VND',
          durationDays: Number(values.durationDays) || 30,
          campaignQuota: Number(values.campaignQuota) || 0,
          recommendationQuota: Number(values.recommendationQuota) || 0,
          refreshQuota: Number(values.refreshQuota) || 0,
          status: values.status || 'ACTIVE',
        };
        await onSave(payload, plan.id);
      } else {
        const payload: PlanCreateRequest = {
          planName: values.planName.trim(),
          description: values.description ? values.description.trim() : '',
          price: Number(values.price) || 0,
          currency: 'VND',
          durationDays: Number(values.durationDays) || 30,
          campaignQuota: Number(values.campaignQuota) || 0,
          recommendationQuota: Number(values.recommendationQuota) || 0,
          refreshQuota: Number(values.refreshQuota) || 0,
        };
        await onSave(payload);
      }
      onClose();
    } catch {
      // form validation error
    }
  };

  return (
    <Drawer
      title={
        <div style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>
          {isEdit ? `Chỉnh sửa gói: ${plan?.planName}` : 'Tạo gói dịch vụ mới'}
        </div>
      }
      open={open}
      onClose={onClose}
      width={500}
      extra={
        <Space>
          <Button onClick={onClose} disabled={saving}>
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            loading={saving}
            onClick={handleSubmit}
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            {isEdit ? 'Lưu thay đổi' : 'Tạo gói'}
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item
          name="planName"
          label={<span style={{ fontWeight: 600 }}>Tên gói dịch vụ</span>}
          rules={[{ required: true, message: 'Vui lòng nhập tên gói dịch vụ' }]}
        >
          <Input placeholder="Ví dụ: Gói Cơ Bản (Starter), Gói Chuyên Nghiệp (Pro)..." />
        </Form.Item>

        <Form.Item
          name="description"
          label={<span style={{ fontWeight: 600 }}>Mô tả ngắn</span>}
        >
          <Input.TextArea
            placeholder="Mô tả mục đích sử dụng hoặc đối tượng khách hàng phù hợp..."
            rows={3}
            style={{ resize: 'none' }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={14}>
            <Form.Item
              name="price"
              label={<span style={{ fontWeight: 600 }}>Đơn giá (VNĐ)</span>}
              rules={[{ required: true, message: 'Vui lòng nhập đơn giá' }]}
              extra={<Text type="secondary" style={{ fontSize: 11 }}>Nhập 0 nếu là gói miễn phí hoặc dùng thử</Text>}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => (v ? v.replace(/\$\s?|(,*)/g, '') : '') as any}
                min={0}
                step={50000}
                addonAfter="đ"
              />
            </Form.Item>
          </Col>

          <Col span={10}>
            <Form.Item
              name="durationDays"
              label={<span style={{ fontWeight: 600 }}>Thời hạn chu kỳ</span>}
              rules={[{ required: true, message: 'Nhập số ngày' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                step={30}
                addonAfter="ngày"
              />
            </Form.Item>
          </Col>
        </Row>

        {isEdit && (
          <Form.Item
            name="status"
            label={<span style={{ fontWeight: 600 }}>Trạng thái mở bán</span>}
          >
            <Select
              options={[
                { value: 'ACTIVE', label: '🟢 Đang mở bán (Hoạt động)' },
                { value: 'INACTIVE', label: '⚪ Tạm dừng mở bán' },
              ]}
            />
          </Form.Item>
        )}

        <Divider titlePlacement="left" style={{ fontSize: 13, fontWeight: 700, margin: '20px 0 16px' }}>
          Hạn mức định lượng (Quotas)
        </Divider>

        <Row gutter={12}>
          <Col span={8}>
            <Form.Item
              name="campaignQuota"
              label={<span style={{ fontWeight: 600, fontSize: 12 }}>Chiến dịch tối đa</span>}
              rules={[{ required: true, message: 'Nhập hạn mức' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="VD: 5" addonAfter="cd" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="recommendationQuota"
              label={<span style={{ fontWeight: 600, fontSize: 12 }}>Đề xuất AI Match</span>}
              rules={[{ required: true, message: 'Nhập hạn mức' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="VD: 50" addonAfter="lượt" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="refreshQuota"
              label={<span style={{ fontWeight: 600, fontSize: 12 }}>Làm mới Creator</span>}
              rules={[{ required: true, message: 'Nhập hạn mức' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="VD: 20" addonAfter="người" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
}
