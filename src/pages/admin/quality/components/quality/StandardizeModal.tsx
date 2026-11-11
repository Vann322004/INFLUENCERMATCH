import React, { useEffect } from 'react';
import { Modal, Form, Select, Radio, Input, Button, Avatar, Tag } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import type { QualityItem } from '../../types';
import { STANDARD_NICHES, PLATFORM_COLOR_MAP } from '../../types';

interface StandardizeModalProps {
  open: boolean;
  selectedItem: QualityItem | null;
  approving: boolean;
  onCancel: () => void;
  onSubmit: (values: { niche: string; primaryType: string; notes?: string }) => Promise<void>;
}

export const StandardizeModal: React.FC<StandardizeModalProps> = ({
  open,
  selectedItem,
  approving,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectedItem) {
      form.setFieldsValue({
        niche: selectedItem.niche,
        primaryType: 'KOC',
        notes: '',
      });
    }
  }, [selectedItem, form]);

  const handleFinish = async (values: any) => {
    await onSubmit(values);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700 }}>
          <SafetyCertificateOutlined style={{ color: '#4F46E5' }} />
          <span>Chuẩn hóa & Phê duyệt Ngành hàng KOC</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={520}
    >
      {selectedItem && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 10,
              padding: '12px 14px',
              border: '1px solid #E2E8F0',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Avatar src={selectedItem.avatarUrl} size={42}>
              {selectedItem.displayName?.charAt(0) || selectedItem.userName?.charAt(0)}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{selectedItem.displayName}</div>
              <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>@{selectedItem.userName}</span>
                <span>•</span>
                <Tag color={PLATFORM_COLOR_MAP[selectedItem.platform.toLowerCase()] || 'default'} style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
                  {selectedItem.platform.toUpperCase()}
                </Tag>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12.5, color: '#334155', marginBottom: 16, background: '#FFFBEB', padding: '10px 12px', borderRadius: 8, border: '1px solid #FDE68A' }}>
            <strong>Tóm tắt nội dung cào / Bio gần nhất:</strong>
            <div style={{ marginTop: 4, color: '#4B5563', lineHeight: 1.45 }}>{selectedItem.contentSummary}</div>
          </div>

          <Form form={form} layout="vertical" onFinish={handleFinish}>
            <Form.Item
              name="niche"
              label={<span style={{ fontWeight: 600 }}>Ngành hàng chuẩn hóa (Niche Taxonomy):</span>}
              rules={[{ required: true, message: 'Vui lòng chọn hoặc nhập ngành hàng chuẩn!' }]}
            >
              <Select
                showSearch
                placeholder="Chọn ngành hàng chuẩn..."
                options={STANDARD_NICHES.map((n) => ({ value: n, label: n }))}
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="primaryType"
              label={<span style={{ fontWeight: 600 }}>Phân loại đối tượng:</span>}
              initialValue="KOC"
            >
              <Radio.Group buttonStyle="solid">
                <Radio.Button value="KOC">KOC (Nano / Micro Reviewer)</Radio.Button>
                <Radio.Button value="KOL">KOL (Macro Influencer / Celebrity)</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="notes"
              label={<span style={{ fontWeight: 600 }}>Ghi chú thẩm định (Tùy chọn):</span>}
            >
              <Input.TextArea rows={2} placeholder="Nhập ghi chú thêm cho hồ sơ này (nếu có)..." />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <Button onClick={onCancel}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={approving}
                style={{ fontWeight: 700, background: '#4F46E5', borderRadius: 6 }}
              >
                Xác nhận phê duyệt & Lưu vào Catalog
              </Button>
            </div>
          </Form>
        </div>
      )}
    </Modal>
  );
};

export default StandardizeModal;

