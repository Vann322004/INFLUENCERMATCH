import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, Avatar, Button, Checkbox, Empty, Form, Input, Modal, Pagination, Popconfirm, Select, Skeleton, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { shortlistService } from '../../services/api/shortlistService';
import { getStoredUser, getAuthSessionId, subscribeAuthSession } from '../../services/authSession';
import type { ShortlistRecord, ShortlistStatus, OutreachResult } from '../../types/api/shortlist.types';
import type { ShortlistPriority } from '../../types/api/creator.types';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { useShortlistRealtime } from '../../hooks/useShortlistRealtime';
import ShortlistComparison, { shortlistNumber } from './components/ShortlistComparison';
import ShortlistBatchAdd from './components/ShortlistBatchAdd';
import './CreatorShortlistPage.css';

const authScope = () => { const user = getStoredUser(); return JSON.stringify([getAuthSessionId(), user?.id, user?.role, user?.authVersion, user?.permissions]); };
const errorText = (error: unknown) => {
  const err = error as { response?: { status?: number }; message?: string };
  return err.response?.status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : err.response?.status === 404 ? 'Không tìm thấy dữ liệu thuộc tài khoản hiện tại.' : err.message || 'Không thể thực hiện yêu cầu. Vui lòng thử lại.';
};
const date = (value: string | null | undefined) => value ? value.replace('T', ' ') : 'Chưa có dữ liệu';
const priorities = [{ value: 'HIGH', label: 'Cao' }, { value: 'MEDIUM', label: 'Trung bình' }, { value: 'LOW', label: 'Thấp' }];

export default function CreatorShortlistPage() {
  const location = useLocation(), navigate = useNavigate();
  const session = useSyncExternalStore(subscribeAuthSession, authScope);
  const canManage = !!getStoredUser()?.permissions?.includes('MANAGE_OWN_SHORTLIST');
  const canPrepareCrm = canManage && !!getStoredUser()?.permissions?.includes('MANAGE_OWN_RELATIONSHIP');
  const [campaignChoice, setCampaignChoice] = useState(() => new URLSearchParams(location.search).get('campaignId') || location.state?.campaignId || sessionStorage.getItem('current_campaign_id') || '');
  const campaignQuery = useCallback(() => shortlistService.campaigns(), [session]);
  const campaigns = useAsyncResource(campaignQuery, canManage);
  const campaignId = campaigns.data?.find(item => item.id === campaignChoice)?.id ?? campaigns.data?.[0]?.id ?? '';
  const context = session + ':' + campaignId, live = useRef(context); live.current = context;
  const [params, setParams] = useState<{ page: number; size: number; priority?: ShortlistPriority; status?: ShortlistStatus }>({ page: 0, size: 20 });
  const query = useCallback(() => shortlistService.list(campaignId, params), [campaignId, params, session]);
  const list = useAsyncResource(query, canManage && !!campaignId);
  const [selection, setSelection] = useState<{ context: string; items: ShortlistRecord[] }>({ context: '', items: [] });
  const selected = selection.context === context ? selection.items : [];
  const selectedCreatorKey = JSON.stringify(selected.map(item => item.creatorId)), selectedItemKey = JSON.stringify(selected.map(item => item.id));
  const [compareOpen, setCompareOpen] = useState(false);
  const compareQuery = useCallback(() => shortlistService.compare(campaignId, JSON.parse(selectedCreatorKey)), [campaignId, selectedCreatorKey, session]);
  const comparison = useAsyncResource(compareQuery, canManage && compareOpen && selected.length >= 2 && selected.length <= 5);
  const [addOpen, setAddOpen] = useState(false), [contactOpen, setContactOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null), [edit, setEdit] = useState<{ context: string; item: ShortlistRecord } | null>(null);
  const [editForm] = Form.useForm();
  const [outreach, setOutreach] = useState<{ context: string; result: OutreachResult } | null>(null);
  const readinessQuery = useCallback(() => shortlistService.readiness(campaignId, JSON.parse(selectedItemKey)), [campaignId, selectedItemKey, session]);
  const readiness = useAsyncResource(readinessQuery, canManage && contactOpen && selected.length > 0);
  const reload = useCallback(() => { void list.reload(); if (compareOpen && selected.length >= 2) void comparison.reload(); }, [list.reload, compareOpen, comparison.reload, selected.length]);
  const realtime = useShortlistRealtime(campaignId || null, reload);

  const changeCampaign = (value: string) => {
    setCampaignChoice(value); setParams({ page: 0, size: 20 }); setSelection({ context: '', items: [] }); setCompareOpen(false);
    setEdit(null); setContactOpen(false); setOutreach(null); setBusy(null);
    // A navigation pointer is allowed; no shortlist results or metrics are stored locally.
    sessionStorage.setItem('current_campaign_id', value);
  };
  const toggle = (item: ShortlistRecord, checked: boolean) => {
    if (checked && selected.length >= 5) { message.warning('Chỉ được chọn tối đa 5 kênh để so sánh. Bỏ chọn một kênh trước.'); return; }
    setSelection(previous => ({ context, items: checked ? [...(previous.context === context ? previous.items : []), item]
      : previous.items.filter(row => row.creatorId !== item.creatorId) }));
  };
  const mutate = async (key: string, work: () => Promise<unknown>, success: string) => {
    const active = context; setBusy(key);
    try { await work(); if (live.current !== active) return; message.success(success); setEdit(null); await list.reload(); if (compareOpen && selected.length >= 2) await comparison.reload(); }
    catch (error) { if (live.current === active) message.error(errorText(error)); }
    finally { if (live.current === active) setBusy(null); }
  };
  const restore = async (item: ShortlistRecord) => {
    const active = context; setBusy(item.id);
    try {
      const result = await shortlistService.add(campaignId, { creatorId: item.creatorId, priority: item.priority, note: item.note ?? undefined });
      if (live.current !== active) return;
      message.info(result.action === 'RESTORED' ? 'Đã khôi phục kênh vào shortlist.' : result.action === 'ALREADY_EXISTS' ? 'Kênh đã có trong shortlist.' : 'Đã thêm kênh vào shortlist.'); await list.reload();
    } catch (error) { if (live.current === active) message.error(errorText(error)); }
    finally { if (live.current === active) setBusy(null); }
  };
  const prepareCrm = async () => {
    const active = context; setBusy('outreach');
    try { const result = await shortlistService.prepareOutreach(campaignId, JSON.parse(selectedItemKey));
      if (live.current === active) { setOutreach({ context, result }); await list.reload(); } }
    catch (error) { if (live.current === active) message.error(errorText(error)); }
    finally { if (live.current === active) setBusy(null); }
  };

  if (!canManage) return <div className="sl-page"><Alert type="info" title="Bạn không có quyền quản lý shortlist." /></div>;
  return <div className="sl-page">
    <header className="sl-heading"><div><h1>Danh sách chọn</h1><p>Quản lý kênh theo chiến dịch và so sánh dữ liệu được hệ thống ghi nhận.</p></div>
      <Button onClick={() => { void campaigns.reload(); reload(); }}>Tải lại</Button></header>
    {campaigns.status === 'loading' ? <Skeleton active /> : campaigns.status === 'error' ? <Alert type="error" title="Không thể tải chiến dịch." action={<Button onClick={() => void campaigns.reload()}>Thử lại</Button>} />
      : campaigns.data?.length === 0 ? <Empty description="Chưa có chiến dịch" /> : <>
      <section className="sl-panel sl-toolbar">
        <label>Chiến dịch<Select aria-label="Chiến dịch" value={campaignId} options={campaigns.data?.map(item => ({ value: item.id, label: item.name }))} onChange={changeCampaign} /></label>
        <label>Ưu tiên<Select aria-label="Lọc ưu tiên" allowClear placeholder="Tất cả" value={params.priority} options={priorities} onChange={value => setParams(previous => ({ ...previous, page: 0, priority: value }))} /></label>
        <label>Trạng thái<Select aria-label="Lọc trạng thái" allowClear placeholder="Đang có trong shortlist" value={params.status} options={['SAVED','READY_TO_CONTACT','CONTACTED','REMOVED'].map(value => ({ value, label: value }))} onChange={value => setParams(previous => ({ ...previous, page: 0, status: value }))} /></label>
        <Button type="primary" onClick={() => setAddOpen(true)}>Thêm kênh</Button>
      </section>
      <div className="sl-selection"><span>Đã chọn {selected.length}/5 kênh{list.status === 'success' ? ` · ${list.data?.totalElements.toLocaleString('vi-VN')} bản ghi theo bộ lọc` : ''}</span>
        <div><Button onClick={() => { if (selected.length < 2) { message.info('Chọn từ 2 đến 5 kênh để so sánh.'); return; } setCompareOpen(true); }}>So sánh ({selected.length})</Button>
          <Button disabled={!selected.length || !!busy} onClick={() => void mutate('status', () => shortlistService.batchStatus(campaignId, JSON.parse(selectedItemKey), 'READY_TO_CONTACT'), 'Đã cập nhật trạng thái từ Backend.')}>Sẵn sàng liên hệ</Button>
          <Button disabled={!selected.length} onClick={() => { setOutreach(null); setContactOpen(true); }}>Kiểm tra liên hệ</Button>
          <Button disabled={!selected.length} onClick={() => { setSelection({ context, items: [] }); setCompareOpen(false); }}>Bỏ chọn</Button></div>
      </div>
      <p className="sl-muted sl-realtime">{realtime === 'live' ? 'Realtime đang kết nối · dữ liệu hiển thị lấy từ REST.' : 'Realtime chưa kết nối · dùng Tải lại để lấy dữ liệu REST mới nhất.'}</p>
      {list.status === 'loading' ? <Skeleton active /> : list.status === 'error' ? <Alert type="error" title="Không thể tải shortlist." action={<Button onClick={() => void list.reload()}>Thử lại</Button>} />
        : !list.data?.items.length ? <Empty description="Chưa có kênh theo bộ lọc này" /> : <div className="sl-grid">{list.data.items.map(item => <article className="sl-panel sl-card" key={item.id}>
          <div className="sl-card-header"><Avatar src={item.avatarUrl || undefined}>{item.creatorName?.charAt(0)}</Avatar><div><h2>{item.creatorName || item.creatorId}</h2><p>{item.platform ?? 'Chưa có nền tảng'}</p></div>
            <Checkbox aria-label={`Chọn ${item.creatorName || item.creatorId}`} disabled={item.status === 'REMOVED'} checked={selected.some(row => row.creatorId === item.creatorId)} onChange={event => toggle(item, event.target.checked)} /></div>
          <dl className="sl-facts"><div><dt>Followers</dt><dd>{shortlistNumber(item.followers)}</dd></div><div><dt>Engagement rate · API</dt><dd>{shortlistNumber(item.engagementRate)}</dd></div>
            <div><dt>Ưu tiên</dt><dd>{priorities.find(priority => priority.value === item.priority)?.label ?? item.priority}</dd></div><div><dt>Trạng thái</dt><dd>{item.status}</dd></div>
            <div><dt>Độ mới</dt><dd>{item.freshnessStatus ?? 'Chưa có dữ liệu'}</dd></div><div><dt>Data confidence</dt><dd>{shortlistNumber(item.dataConfidence)}</dd></div></dl>
          <p className="sl-note">{item.note ?? 'Chưa có ghi chú'}</p><p className="sl-muted">Thu thập: {date(item.collectedAt)}</p>
          <div className="sl-card-actions">{item.status === 'REMOVED' ? <Button loading={busy === item.id} onClick={() => void restore(item)}>Khôi phục</Button> : <>
            <Button onClick={() => { setEdit({ context, item }); editForm.setFieldsValue({ priority: item.priority, note: item.note ?? '' }); }}>Sửa ưu tiên / ghi chú</Button>
            <Popconfirm title="Xóa mềm kênh khỏi shortlist?" onConfirm={() => mutate(item.id, async () => { await shortlistService.remove(campaignId, item.id);
              if (live.current === context) setSelection(previous => ({ ...previous, items: previous.items.filter(row => row.id !== item.id) })); }, 'Đã xóa kênh khỏi shortlist.')}><Button loading={busy === item.id}>Xóa</Button></Popconfirm>
          </>}</div>
        </article>)}</div>}
      {list.status === 'success' && list.data && <Pagination current={list.data.page + 1} pageSize={list.data.size} total={list.data.totalElements} showSizeChanger pageSizeOptions={[10,20,50]}
        onChange={(page, size) => setParams(previous => ({ ...previous, page: size !== previous.size ? 0 : page - 1, size }))} />}
      {compareOpen && <section className="sl-panel" aria-label="So sánh Creator"><div className="sl-heading"><h2>So sánh kênh · theo thứ tự đã chọn</h2><Button onClick={() => setCompareOpen(false)}>Đóng so sánh</Button></div>
        <p className="sl-muted">Các chỉ số phản ánh dữ liệu đã thu thập của từng kênh.</p>
        {selected.length < 2 ? <p>Chọn từ 2 đến 5 kênh.</p> : comparison.status === 'loading' ? <Skeleton active /> : comparison.status === 'error' ? <Alert type="error" title="Không thể lấy dữ liệu so sánh." action={<Button onClick={() => void comparison.reload()}>Thử lại so sánh</Button>} />
          : comparison.data && <ShortlistComparison data={comparison.data} />}
      </section>}
    </>}
    <Modal title="Sửa shortlist" open={edit?.context === context} onCancel={() => { if (!busy) setEdit(null); }} footer={null} destroyOnHidden>
      <Form form={editForm} layout="vertical" onFinish={values => { if (edit?.context === context) void mutate(edit.item.id, () => shortlistService.update(campaignId, edit.item.id, { priority: values.priority, note: values.note }), 'Đã lưu ưu tiên và ghi chú vào hệ thống.'); }}>
        <Form.Item name="priority" label="Ưu tiên" rules={[{ required: true }]}><Select options={priorities} /></Form.Item><Form.Item name="note" label="Ghi chú"><Input.TextArea rows={4} /></Form.Item>
        <Button type="primary" htmlType="submit" loading={!!busy}>Lưu thay đổi</Button>
      </Form>
    </Modal>
    <ShortlistBatchAdd key={context} campaignId={campaignId} open={addOpen && !!campaignId} onClose={() => setAddOpen(false)} onChanged={() => void list.reload()} />
    <Modal title="Kiểm tra liên hệ & chuẩn bị CRM" open={contactOpen && selected.length > 0} onCancel={() => { if (!busy) setContactOpen(false); }} footer={null} width={680} destroyOnHidden>
      {readiness.status === 'loading' ? <Skeleton active /> : readiness.status === 'error' ? <Alert type="error" title="Không thể kiểm tra liên hệ." action={<Button onClick={() => void readiness.reload()}>Thử lại</Button>} /> : <>
        <ul className="sl-batch-results">{readiness.data?.items.map(item => <li key={item.shortlistItemId}><strong>{item.creatorName || item.creatorId}</strong><span>{item.readinessStatus} · {item.contactChannel ?? '—'}</span><span>{item.reason ?? '—'}</span></li>)}</ul>
        <Alert type="info" title="Tạo nháp CRM không phải gửi lời mời" description="Thao tác sau tạo quan hệ và Deal nháp theo nhóm Creator Master. Không gửi email, không xác nhận booking và không tự điền phí. Hoàn thiện đề xuất trong CRM." />
        {!canPrepareCrm && <p>Bạn cần quyền quản lý quan hệ CRM để tiếp tục.</p>}
        <Popconfirm title="Tạo quan hệ và bản nháp hợp tác trong CRM?" onConfirm={prepareCrm}><Button type="primary" disabled={!canPrepareCrm || !!busy} loading={busy === 'outreach'}>Tạo nháp CRM</Button></Popconfirm>
      </>}
      {outreach?.context === context && <><h3>Kết quả Backend</h3><ul className="sl-batch-results">{outreach.result.items.map(item => <li key={item.shortlistItemId}><strong>{item.creatorName || item.creatorId}</strong><span>{item.contactStatus}</span><span>{item.message ?? '—'}</span></li>)}</ul>
        <Button onClick={() => { setContactOpen(false); navigate('/crm', { state: { campaignId } }); }}>Mở CRM</Button></>}
    </Modal>
  </div>;
}
