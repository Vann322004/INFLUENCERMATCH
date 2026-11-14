import './AddToShortlistModal.css';
import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { Modal, Form, Select, Input, Button, message, Alert, Avatar, Radio } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { shortlistService } from '../../services/api/shortlistService';
import { creatorService } from '../../services/api/creatorService';
import type { ShortlistPriority } from '../../types/api/creator.types';
import { getAuthSessionId, getStoredUser, subscribeAuthSession } from '../../services/authSession';

const scope = () => JSON.stringify([getAuthSessionId(), getStoredUser()]);

const { TextArea } = Input;

export interface AddToShortlistModalProps {
  open: boolean;
  onClose: () => void;
  creator: {
    id: string;
    name: string;
    avatar?: string;
    username?: string;
    platform?: string;
    followers?: number;
    engagementRate?: number;
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
  const session = useSyncExternalStore(subscribeAuthSession, scope);
  const [form] = Form.useForm();
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [campaignOptions, setCampaignOptions] = useState<{ value: string; label: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [priorityVal, setPriorityVal] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    const loadCampaigns = async () => {
      setLoadingCampaigns(true);
      setCampaignError(null);
      try {
        const camps = await shortlistService.campaigns();
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
      } catch {
        if (isMounted) { setCampaignError('Không thể tải chiến dịch. Vui lòng thử lại.'); setCampaignOptions([]); }
      } finally {
        if (isMounted) setLoadingCampaigns(false);
      }
    };

    loadCampaigns();
    return () => {
      isMounted = false;
    };
  }, [open, defaultCampaignId, form, retry, session]);

  const handleSubmit = async () => {
    if (!creator) return;
    const active = scope();
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const result = await creatorService.addToShortlist(values.campaignId, {
        creatorId: creator.id,
        creatorName: creator.name,
        username: creator.username || (creator as any).userName || (creator as any).handle || creator.name,
        platform: creator.platform,
        avatarUrl: creator.avatar,
        followers: creator.followers,
        engagementRate: creator.engagementRate,
        niche: creator.niche,
        priority: priorityVal as ShortlistPriority,
        note: values.note || undefined,
      });
      if (scope() !== active) return;

      // Đồng bộ đồng nhất tất cả các key lưu trữ giữa Discovery và Shortlist
      sessionStorage.setItem('current_campaign_id', values.campaignId);
      localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', values.campaignId);
      localStorage.setItem('last_active_campaign_id', values.campaignId);

      // Kích hoạt custom event để các trang khác đang mở tự động cập nhật
      window.dispatchEvent(new CustomEvent('im_shortlist_updated', {
        detail: { campaignId: values.campaignId, creatorId: creator.id }
      }));

      const report = result.action === 'ALREADY_EXISTS' ? message.info : message.success;
      report({
        content: (
          <span>
            {result.action === 'ALREADY_EXISTS' ? 'Kênh đã có trong danh sách chọn: ' : result.action === 'RESTORED' ? 'Đã khôi phục kênh: ' : 'Đã thêm kênh: '}<b>{creator.name}</b>{' '}
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
      if (scope() !== active) return;
      if (err?.errorFields) return; // Form validation error
      message.error(err?.response?.data?.message || 'Không thể thêm vào shortlist. Vui lòng thử lại!');
    } finally {
      if (scope() === active) setSubmitting(false);
    }
  };

  return (
    <Modal
      className="shortlist-modal"
      title={<div className="shortlist-modal-heading"><h2>Lưu vào danh sách chọn</h2><p>Chọn chiến dịch và mức độ ưu tiên cho KOC.</p></div>}
      open={open}
      onCancel={() => { if (!submitting) onClose(); }}
      footer={null}
      destroyOnHidden
      width={560}
      centered
      maskClosable={!submitting}
      closable={!submitting}
    >
      {creator && <div className="shortlist-modal-creator">
        <Avatar size={48} src={creator.avatar}>{creator.name?.charAt(0)}</Avatar>
        <div><strong>{creator.name}</strong><p>{creator.username ? `@${creator.username.replace(/^@+/, '')}` : 'KOC'}{creator.niche && ` · ${creator.niche}`}</p></div>
      </div>}
      {campaignError ? <Alert type="error" title={campaignError} action={<Button onClick={() => setRetry(value => value + 1)}>Thử lại</Button>} /> : campaignOptions.length === 0 && !loadingCampaigns ? <>
        <Alert type="info" showIcon title="Chưa có chiến dịch" description="Tạo chiến dịch để lưu và quản lý danh sách KOC phù hợp." />
        <div className="shortlist-modal-actions"><Button onClick={onClose}>Đóng</Button><Button type="primary" icon={<RocketOutlined />} onClick={() => { onClose(); navigate('/campaigns/create'); }}>Tạo chiến dịch</Button></div>
      </> : <Form form={form} layout="vertical" initialValues={{ priority: 'HIGH' }} disabled={submitting}>
        <Form.Item name="campaignId" label="Chiến dịch" rules={[{ required: true, message: 'Vui lòng chọn chiến dịch' }]}>
          <Select loading={loadingCampaigns} placeholder="Chọn chiến dịch" options={campaignOptions} size="large" />
        </Form.Item>
        <Form.Item label="Mức độ ưu tiên">
          <Radio.Group className="shortlist-priority" value={priorityVal} onChange={event => { setPriorityVal(event.target.value); form.setFieldsValue({ priority: event.target.value }); }}>
            {[
              { value: 'HIGH', title: 'Ưu tiên cao', description: 'Liên hệ sớm' },
              { value: 'MEDIUM', title: 'Trung bình', description: 'Cân nhắc thêm' },
              { value: 'LOW', title: 'Dự phòng', description: 'Lưu tham khảo' },
            ].map(option => <Radio key={option.value} value={option.value} className="shortlist-priority-option"><strong>{option.title}</strong><span>{option.description}</span></Radio>)}
          </Radio.Group>
        </Form.Item>
        <Form.Item name="note" label="Ghi chú nội bộ" extra="Tùy chọn · Chỉ dùng để quản lý danh sách của bạn.">
          <TextArea rows={3} placeholder="Ví dụ: Nội dung phù hợp, ưu tiên liên hệ trong tuần này…" maxLength={250} showCount />
        </Form.Item>
        <div className="shortlist-modal-actions">
          <Button onClick={onClose} disabled={submitting}>Hủy</Button>
          <Button type="primary" loading={submitting} disabled={loadingCampaigns} onClick={handleSubmit}>Lưu vào danh sách</Button>
        </div>
      </Form>}
    </Modal>
  );
}
