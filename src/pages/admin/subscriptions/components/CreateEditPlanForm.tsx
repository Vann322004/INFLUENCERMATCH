import React, { useEffect } from 'react';
import { Drawer, Form, Input, InputNumber, Button, Space, Divider, Typography, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { SubscriptionPlan } from '../../../../mock/adminData';

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
  onSave: (savedPlan: SubscriptionPlan) => void;
}

export default function CreateEditPlanForm({ open, onClose, plan, onSave }: Props) {
  const [form] = Form.useForm();
  const isEdit = !!plan;

  useEffect(() => {
    if (open) {
      if (plan) {
        form.setFieldsValue(plan);
      } else {
        form.resetFields();
        form.setFieldsValue({
          features: ['50 lượt tìm kiếm/tháng', 'Hỗ trợ xuất CSV'],
          quotaSearch: 50,
          quotaCreators: 50,
          quotaCampaigns: 3,
        });
      }
    }
  }, [open, plan, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const result: SubscriptionPlan = {
        id: plan ? plan.id : `plan_${Date.now()}`,
        name: values.name,
        priceMonth: values.priceMonth || 0,
        priceYear: values.priceYear || 0,
        description: values.description || '',
        features: values.features?.filter(Boolean) || [],
        quotaSearch: values.quotaSearch || 0,
        quotaCreators: values.quotaCreators || 0,
        quotaCampaigns: values.quotaCampaigns || 0,
        status: plan ? plan.status : 'active',
        activeUsers: plan ? plan.activeUsers : 0,
      };
      onSave(result);
      onClose();
    } catch {
      // validation error
    }
  };

  return (
    <Drawer
      title={isEdit ? `Chỉnh sửa gói: ${plan?.name}` : 'Tạo gói dịch vụ mới'}
      open={open}
      onClose={onClose}
      width={480}
      extra={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" onClick={handleSubmit} style={{ background: '#6366F1', border: 'none' }}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo Plan'}
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Tên Gói dịch vụ *"
          rules={[{ required: true, message: 'Vui lòng nhập tên gói' }]}
        >
          <Input placeholder="VD: Growth Pro, Agency VIP..." />
        </Form.Item>

        <Form.Item name="description" label="Mô tả ngắn">
          <Input.TextArea placeholder="Mục đích sử dụng của gói này..." rows={2} style={{ resize: 'none' }} />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              name="priceMonth"
              label="Giá theo tháng (VND) *"
              rules={[{ required: true, message: 'Nhập giá tháng' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                min={0}
                step={50000}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="priceYear"
              label="Giá theo năm (VND) *"
              rules={[{ required: true, message: 'Nhập giá năm' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                min={0}
                step={500000}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="left" style={{ fontSize: 13, fontWeight: 700 }}>Hạn mức định lượng (Quotas)</Divider>

        <Row gutter={12}>
          <Col span={8}>
            <Form.Item name="quotaSearch" label="Tìm kiếm/tháng">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="quotaCreators" label="Creator/search">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="quotaCampaigns" label="Chiến dịch">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="left" style={{ fontSize: 13, fontWeight: 700 }}>Danh sách tính năng (Features)</Divider>

        <Form.List name="features">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={name}
                    rules={[{ required: true, message: 'Nhập tên tính năng' }]}
                    style={{ flex: 1, margin: 0, width: 340 }}
                  >
                    <Input placeholder="VD: Hỗ trợ Export CSV..." />
                  </Form.Item>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                  />
                </Space>
              ))}
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginTop: 8 }}>
                Thêm dòng tính năng
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Drawer>
  );
}
