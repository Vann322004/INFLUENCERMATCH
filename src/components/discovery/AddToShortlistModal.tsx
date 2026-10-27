import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Radio, Input, Button, message, Alert, Avatar } from 'antd';
import { UnorderedListOutlined, PlusOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { campaignService } from '../../services/api/campaignService';
import { creatorService } from '../../services/api/creatorService';
import type { ShortlistPriority } from '../../types/api/creator.types';

const { TextArea } = Input;

export interface AddToShortlistModalProps {
  open: boolean;
  onClose: () => void;
  creator: {
    id: string;
    name: string;
    avatar?: string;
    username?: string;
    niche?: string;
  } | null;
  onSuccess?: (campaignId: string) => void;
}

export default function AddToShortlistModal({
  open,
  onClose,
  creator,
  onSuccess,
}: AddToShortlistModalProps) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [campaignOptions, setCampaignOptions] = useState<{ value: string; label: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    const loadCampaigns = async () => {
      setLoadingCampaigns(true);
      try {
        const camps = await campaignService.getCampaigns(0, 50);
        if (isMounted) {
          const opts = camps.map((c) => ({
            value: c.id,
            label: `🎯 ${c.name} (${c.status === 'ACTIVE' ? 'Đang chạy' : c.status})`,
          }));
          setCampaignOptions(opts);
          if (opts.length > 0) {
            form.setFieldsValue({ campaignId: opts[0].value, priority: 'HIGH' });
          }
        }
      } catch (err) {
        console.error('Failed to load campaigns:', err);
      } finally {
        if (isMounted) setLoadingCampaigns(false);
      }
    };

    loadCampaigns();
    return () => {
      isMounted = false;
    };
  }, [open, form]);

  const handleSubmit = async () => {
    if (!creator) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      await creatorService.addToShortlist(values.campaignId, {
        creatorId: creator.id,
        creatorName: creator.name,
        avatarUrl: creator.avatar,
        niche: creator.niche,
        priority: values.priority as ShortlistPriority,
        note: values.note || undefined,
      });

      message.success({
        content: (
          <span>
            Đã thêm <b>{creator.name}</b> vào Shortlist!{' '}
            <a
              style={{ fontWeight: 700, marginLeft: 8, color: '#4F46E5', textDecoration: 'underline' }}
              onClick={() => navigate(`/creators/shortlist?campaignId=${values.campaignId}`)}
            >
              Xem Shortlist ➔
            </a>
          </span>
        ),
        duration: 4,
      });
      onClose();
      form.resetFields();
      onSuccess?.(values.campaignId);
    } catch (err: any) {
      if (err?.errorFields) return; // Validation error
      message.error(err?.response?.data?.message || 'Không thể thêm vào shortlist. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700 }}>
          <UnorderedListOutlined style={{ color: '#4F46E5' }} />
          <span>Thêm vào Danh sách chọn (Shortlist)</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={480}
      centered
    >
      {creator && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            margin: '14px 0 18px',
          }}
        >
          <Avatar size={44} src={creator.avatar} style={{ border: '2px solid #C7D2FE', flexShrink: 0 }}>
            {creator.name?.charAt(0)}
          </Avatar>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{creator.name}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              {creator.username ? `@${creator.username}` : ''} {creator.niche ? `• ${creator.niche}` : ''}
            </div>
          </div>
        </div>
      )}

      {campaignOptions.length === 0 && !loadingCampaigns ? (
        <div>
          <Alert
            type="warning"
            showIcon
            message="Chưa có chiến dịch nào"
            description="Bạn cần có ít nhất một chiến dịch đang hoạt động để lưu danh sách Creator vào phễu tuyển chọn."
            style={{ borderRadius: 10, marginBottom: 16 }}
          />
          <Button
            type="primary"
            block
            icon={<RocketOutlined />}
            style={{ background: '#4F46E5', borderRadius: 8, height: 38, fontWeight: 600 }}
            onClick={() => {
              onClose();
              navigate('/campaigns/create');
            }}
          >
            Tạo chiến dịch mới ngay
          </Button>
        </div>
      ) : (
        <Form form={form} layout="vertical" initialValues={{ priority: 'HIGH' }}>
          <Form.Item
            name="campaignId"
            label={<span style={{ fontWeight: 600 }}>Chọn Chiến dịch mục tiêu:</span>}
            rules={[{ required: true, message: 'Vui lòng chọn một chiến dịch' }]}
          >
            <Select
              loading={loadingCampaigns}
              placeholder="Chọn chiến dịch cần thêm ứng viên"
              options={campaignOptions}
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="priority"
            label={<span style={{ fontWeight: 600 }}>Mức độ ưu tiên:</span>}
          >
            <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
              <Radio.Button value="HIGH" style={{ width: '33.33%', textAlign: 'center' }}>
                🌟 Ưu tiên cao
              </Radio.Button>
              <Radio.Button value="MEDIUM" style={{ width: '33.33%', textAlign: 'center' }}>
                ⚡ Trung bình
              </Radio.Button>
              <Radio.Button value="LOW" style={{ width: '33.33%', textAlign: 'center' }}>
                📝 Dự phòng
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="note"
            label={<span style={{ fontWeight: 600 }}>Ghi chú nội bộ (Tùy chọn):</span>}
          >
            <TextArea
              rows={3}
              placeholder="Ví dụ: Phù hợp kịch bản unboxing hè, giá dự kiến 15M, ưu tiên liên hệ trước thứ 6..."
              maxLength={250}
              showCount
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button onClick={onClose} style={{ borderRadius: 8 }}>
              Hủy
            </Button>
            <Button
              type="primary"
              loading={submitting}
              icon={<PlusOutlined />}
              onClick={handleSubmit}
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              Thêm vào Shortlist
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
}
