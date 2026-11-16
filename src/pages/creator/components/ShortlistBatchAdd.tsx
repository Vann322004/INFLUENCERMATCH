import { useEffect, useRef, useState } from 'react';
import { Alert, Button, ConfigProvider, Form, Input, Modal, Select } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { shortlistService } from '../../../services/api/shortlistService';
import { getAuthSessionId, getStoredUser } from '../../../services/authSession';
import type { ShortlistPriority } from '../../../types/api/creator.types';
import type { BatchAddResult } from '../../../types/api/shortlist.types';
import { shortlistLabel } from './shortlistDisplay';

type Channel = { id: string; name: string };
const scope = () => { const user = getStoredUser(); return JSON.stringify([getAuthSessionId(), user?.id, user?.role, user?.authVersion, user?.permissions]); };
export default function ShortlistBatchAdd({ campaignId, creators, onClose, onChanged }: {
  campaignId: string; creators: Channel[]; onClose: () => void; onChanged: (result: BatchAddResult) => void;
}) {
  const [saving, setSaving] = useState(false), [error, setError] = useState(false);
  const [result, setResult] = useState<BatchAddResult | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const submit = async (values: { priority: ShortlistPriority; note?: string }) => {
    const session = scope(); setSaving(true); setError(false);
    try {
      const response = await shortlistService.batchAdd(campaignId, creators.map(item => item.id), values.priority, values.note);
      if (mounted.current && session === scope()) { setResult(response); onChanged(response); }
    } catch { if (mounted.current && session === scope()) setError(true); }
    finally { if (mounted.current) setSaving(false); }
  };
  return <ConfigProvider locale={viVN}><Modal title="Lưu các kênh đã chọn" open onCancel={() => { if (!saving) onClose(); }} footer={null} width={560} destroyOnHidden mask={{ closable: !saving }}>
    {error && <Alert type="error" title="Chưa lưu được danh sách. Vui lòng thử lại." />}
    {result ? <>
      <p>Kết quả từng kênh được hệ thống xác nhận:</p>
      <ul className="sl-batch-results">{result.results.map(row => <li key={row.creatorId}><strong>{creators.find(item => item.id === row.creatorId)?.name || 'Kênh đã chọn'}</strong><span>{shortlistLabel(row.action)}{row.errorCode ? ` · ${shortlistLabel(row.errorCode)}` : ''}</span></li>)}</ul>
      {result.results.some(row => ['INVALID', 'FAILED'].includes(row.action)) && <p>Các kênh chưa lưu thành công vẫn được đánh dấu để bạn thử lại.</p>}<Button type="primary" onClick={onClose}>Đóng</Button>
    </> : <Form layout="vertical" initialValues={{ priority: 'MEDIUM' }} onFinish={submit} disabled={saving}>
      <p>Lưu {creators.length} kênh từ trang khám phá vào danh sách đã chọn của chiến dịch.</p>
      <Form.Item name="priority" label="Ưu tiên" rules={[{ required: true }]}><Select options={[{ value: 'HIGH', label: 'Cao' }, { value: 'MEDIUM', label: 'Trung bình' }, { value: 'LOW', label: 'Thấp' }]} /></Form.Item>
      <Form.Item name="note" label="Ghi chú chung"><Input.TextArea rows={3} /></Form.Item>
      <Button type="primary" htmlType="submit" loading={saving}>Lưu vào danh sách đã chọn</Button>
    </Form>}
  </Modal></ConfigProvider>;
}
