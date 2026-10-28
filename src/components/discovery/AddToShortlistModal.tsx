import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Button, message, Alert, Avatar } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
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
  defaultCampaignId?: string;
  onSuccess?: (campaignId: string) => void;
}

export default function AddToShortlistModal({
  open,
  onClose,
  creator,
  defaultCampaignId,
  onSuccess,
}: AddToShortlistModalProps) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [campaignOptions, setCampaignOptions] = useState<{ value: string; label: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [priorityVal, setPriorityVal] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

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
            label: c.name,
          }));
          setCampaignOptions(opts);

          // Chọn defaultCampaignId nếu có, hoặc chọn chiến dịch đầu tiên
          const selectedId = (defaultCampaignId && opts.some((o) => o.value === defaultCampaignId))
            ? defaultCampaignId
            : opts.length > 0
            ? opts[0].value
            : undefined;

          form.setFieldsValue({ campaignId: selectedId, priority: 'HIGH' });
          setPriorityVal('HIGH');
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
  }, [open, defaultCampaignId, form]);

  const handleSubmit = async () => {
    if (!creator) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const savedItem = await creatorService.addToShortlist(values.campaignId, {
        creatorId: creator.id,
        creatorName: creator.name,
        avatarUrl: creator.avatar,
        niche: creator.niche,
        priority: priorityVal as ShortlistPriority,
        note: values.note || undefined,
      });

      // Đồng bộ đồng nhất tất cả các key lưu trữ giữa Discovery và Shortlist
      sessionStorage.setItem('current_campaign_id', values.campaignId);
      localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', values.campaignId);
      localStorage.setItem('last_active_campaign_id', values.campaignId);

      // Kích hoạt custom event để các trang khác đang mở tự động cập nhật
      window.dispatchEvent(new CustomEvent('im_shortlist_updated', {
        detail: { campaignId: values.campaignId, creatorId: creator.id }
      }));

      message.success({
        content: (
          <span>
            Đã lưu <b>{creator.name}</b> vào Danh sách chọn!{' '}
            <a
              style={{ fontWeight: 700, marginLeft: 8, color: '#4F46E5', textDecoration: 'underline' }}
              onClick={() => {
                sessionStorage.setItem('current_campaign_id', values.campaignId);
                localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', values.campaignId);
                navigate('/creators/shortlist', { state: { campaignId: values.campaignId } });
              }}
            >
              Xem danh sách chọn ➔
            </a>
          </span>
        ),
        duration: 4,
      });
      onClose();
      form.resetFields();
      onSuccess?.(values.campaignId);
    } catch (err: any) {
      if (err?.errorFields) return; // Form validation error
      message.error(err?.response?.data?.message || 'Không thể thêm vào shortlist. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ paddingBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
            Thêm vào Danh sách chọn (Shortlist)
          </div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: 400 }}>
            Lưu creator vào shortlist để dễ dàng quản lý và so sánh sau này.
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={520}
      centered
      styles={{
        body: {
          paddingTop: 8,
        },
      }}
    >
      {creator && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '12px 16px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            margin: '14px 0 18px',
          }}
        >
          <Avatar size={48} src={creator.avatar} style={{ border: '2px solid #C7D2FE', flexShrink: 0 }}>
            {creator.name?.charAt(0)}
          </Avatar>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0F172A' }}>{creator.name}</div>
            <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 1 }}>
              {creator.username ? `@${creator.username.replace(/^@+/, '')}` : ''}
            </div>
            {creator.niche && (
              <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                {creator.niche}
              </div>
            )}
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
            style={{ background: '#4F46E5', borderRadius: 10, height: 40, fontWeight: 700 }}
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
          {/* 1. Chọn chiến dịch mục tiêu */}
          <Form.Item
            name="campaignId"
            label={
              <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>
                <span style={{ color: '#EF4444', marginRight: 4 }}>*</span>Chọn chiến dịch mục tiêu
              </span>
            }
            rules={[{ required: true, message: 'Vui lòng chọn một chiến dịch' }]}
            style={{ marginBottom: 16 }}
          >
            <Select
              loading={loadingCampaigns}
              placeholder="Chọn chiến dịch mục tiêu"
              options={campaignOptions}
              size="large"
              style={{ width: '100%' }}
            />
          </Form.Item>

          {/* 2. Mức độ ưu tiên (3 Card Radio) */}
          <Form.Item
            label={<span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>Mức độ ưu tiên</span>}
            style={{ marginBottom: 16 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { value: 'HIGH', title: 'Ưu tiên cao', sub: 'Nên liên hệ sớm' },
                { value: 'MEDIUM', title: 'Trung bình', sub: 'Có thể liên hệ sau' },
                { value: 'LOW', title: 'Dự phòng', sub: 'Lưu để tham khảo' },
              ].map((opt) => {
                const checked = priorityVal === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      setPriorityVal(opt.value as any);
                      form.setFieldsValue({ priority: opt.value });
                    }}
                    style={{
                      border: `1.5px solid ${checked ? '#6366F1' : '#E2E8F0'}`,
                      background: checked ? '#F5F3FF' : '#FFFFFF',
                      borderRadius: 12,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      transition: 'all 0.15s ease',
                      boxShadow: checked ? '0 2px 8px rgba(99, 102, 241, 0.12)' : 'none',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: checked ? '#4F46E5' : '#0F172A' }}>
                        {opt.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                        {opt.sub}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        border: `2px solid ${checked ? '#6366F1' : '#CBD5E1'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 1,
                        background: '#FFFFFF',
                      }}
                    >
                      {checked && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Form.Item>

          {/* 3. Ghi chú nội bộ (Tùy chọn) */}
          <Form.Item
            name="note"
            label={<span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>Ghi chú nội bộ (Tùy chọn)</span>}
            style={{ marginBottom: 20 }}
          >
            <TextArea
              rows={3}
              placeholder="Ví dụ: Phù hợp chiến dịch summer, nội dung unboxing kem chống nắng, giá dự kiến 15M, ưu tiên liên hệ trước thứ 6..."
              maxLength={250}
              showCount
              style={{ borderRadius: 10, fontSize: 13 }}
            />
          </Form.Item>

          {/* 4. Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button
              onClick={onClose}
              style={{
                borderRadius: 10,
                height: 38,
                fontWeight: 600,
                padding: '0 20px',
                borderColor: '#E2E8F0',
                color: '#334155',
              }}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={handleSubmit}
              style={{
                background: '#4F46E5',
                border: 'none',
                borderRadius: 10,
                height: 38,
                padding: '0 24px',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
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
