import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Form, Input, Modal, Select, Spin } from 'antd';
import { creatorService } from '../../../services/api/creatorService';
import { shortlistService } from '../../../services/api/shortlistService';
import type { ShortlistPriority } from '../../../types/api/creator.types';
import type { BatchAddResult } from '../../../types/api/shortlist.types';

export default function ShortlistBatchAdd({ campaignId, open, onClose, onChanged }: { campaignId: string; open: boolean; onClose: () => void; onChanged: () => void }) {
  const [form] = Form.useForm();
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchAddResult | null>(null);
  const [retry, setRetry] = useState(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!open) return;
    let alive = true; setLoading(true); setError(null); setResult(null); form.resetFields();
    creatorService.getCreators().then(items => {
      if (!alive) return;
      const unique = new Map(items.filter(item => item.creatorId).map(item => [item.creatorId, { value: item.creatorId, label: `${item.displayName || item.userName || item.creatorId} · ${item.platform || '—'}` }]));
      setOptions([...unique.values()]);
    }).catch(() => { if (alive) setError('Không thể tải danh sách kênh.'); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [open, campaignId, retry, form]);
  const submit = async (values: { creatorIds: string[]; priority: ShortlistPriority; note?: string }) => {
    setSaving(true); setError(null);
    try { const response = await shortlistService.batchAdd(campaignId, values.creatorIds, values.priority, values.note); if (mounted.current) { setResult(response); onChanged(); } }
    catch { if (mounted.current) setError('Không thể thêm vào shortlist. Vui lòng thử lại.'); }
    finally { if (mounted.current) setSaving(false); }
  };
  return <Modal title="Thêm kênh vào shortlist" open={open} onCancel={() => { if (!saving) onClose(); }} footer={null} width={560} destroyOnHidden maskClosable={!saving}>
    {error && <Alert type="error" title={error} action={<Button onClick={() => setRetry(value => value + 1)}>Tải lại kênh</Button>} />}
    {loading ? <Spin /> : result ? <>
      <p>Kết quả từng kênh từ Backend:</p><ul className="sl-batch-results">{result.results.map(row => <li key={row.creatorId}><strong>{options.find(option => option.value === row.creatorId)?.label || row.creatorId}</strong><span>{row.action}{row.errorCode ? ` · ${row.errorCode}` : ''}</span></li>)}</ul>
      <Button onClick={onClose}>Đóng</Button>
    </> : <Form form={form} layout="vertical" initialValues={{ priority: 'MEDIUM' }} onFinish={submit} disabled={saving}>
      <Form.Item name="creatorIds" label="Kênh Creator (1–100)" rules={[{ required: true, type: 'array', min: 1, max: 100 }]}><Select mode="multiple" options={options} optionFilterProp="label" placeholder="Chọn kênh thực từ hệ thống" /></Form.Item>
      <Form.Item name="priority" label="Ưu tiên"><Select options={['LOW','MEDIUM','HIGH'].map(value => ({ value, label: value }))} /></Form.Item>
      <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={3} /></Form.Item>
      <Button type="primary" htmlType="submit" loading={saving} disabled={!options.length}>Thêm vào shortlist</Button>
    </Form>}
  </Modal>;
}
