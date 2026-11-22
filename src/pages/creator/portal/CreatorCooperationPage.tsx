import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, App, Button, Drawer, Empty, Form, Modal, Skeleton, Tabs, Tag } from 'antd';
import { useLocation, useSearchParams } from 'react-router-dom';
import { dealService } from '../../../services/api/dealService';
import type { Deal } from '../../../services/api/dealService';
import { getAuthSessionId, getStoredUser, subscribeAuthSession } from '../../../services/authSession';
import { getErrorMessage } from '../../../services/apiClient';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { CreatorCollaborations } from '../../collaboration/CollaborationPage';
import ProposalFields from '../../crm/ProposalFields';
import { localDate, proposalPayload } from '../../crm/proposalForm';
import type { ProposalForm } from '../../crm/proposalForm';
import { writeKey } from '../../crm/cooperationWriteKey';
import { dealLabel } from '../../crm/cooperationDisplay';
import '../../crm/CampaignOutreachPage.css';

export default function CreatorCooperationPage() {
  const [params, setParams] = useSearchParams();
  const active = params.get('view') === 'work' ? 'work' : 'offers';
  return <Tabs activeKey={active} onChange={view => setParams(previous => { const next = new URLSearchParams(previous); next.set('view', view); return next; }, { replace: true })} items={[{ key: 'offers', label: 'Lời mời hợp tác', children: <CreatorOffers /> }, { key: 'work', label: 'Quản lý bàn giao', children: <CreatorCollaborations /> }]} />;
}
function CreatorOffers() {
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSessionId);
  const location = useLocation();
  const canRespond = (getStoredUser()?.permissions ?? []).includes('RESPOND_OWN_COOPERATION');
  const query = useCallback(() => { if (getAuthSessionId() !== session) throw new Error('Phiên đã thay đổi.'); return dealService.portalList(); }, [session]);
  const resource = useAsyncResource(query, canRespond);
  const [selected, setSelected] = useState<string | null>(null);
  const requested = typeof location.state?.cooperationDealId === 'string' ? location.state.cooperationDealId : null;
  // The detail API verifies ownership, including invitations beyond the first list page.
  const id = selected ?? (requested && /^[a-f0-9-]{36}$/i.test(requested) ? requested : null);
  if (!canRespond) return <Alert type="warning" title="Bạn chưa có quyền phản hồi lời mời hợp tác." />;
  return <div className="contact-workspace"><header className="contact-heading"><div><h1>Lời mời hợp tác</h1><p>Xem yêu cầu, trao đổi và phản hồi đề xuất của thương hiệu.</p></div><Button onClick={() => void resource.reload()}>Cập nhật</Button></header>
    {resource.status === 'loading' ? <Skeleton active /> : resource.status === 'error' ? <Alert type="error" title={resource.error} action={<Button onClick={() => void resource.reload()}>Thử lại</Button>} /> : !resource.data?.length ? <Empty description="Chưa có lời mời thuộc các kênh bạn quản lý" /> : <section className="contact-panel">{resource.data.map(deal => <article className="contact-deal" key={deal.id}><div><strong>{deal.channels.map(channel => `${channel.platform} · @${channel.username}`).join(' / ')}</strong><p><Tag>{dealLabel(deal.status)}</Tag>{deal.proposal ? `${deal.proposal.fee.toLocaleString('vi-VN')} ₫ · Bản ${deal.proposal.revision}` : 'Chưa có đề xuất'}{deal.acceptedRevision === deal.proposal?.revision && deal.proposal ? ' · Bạn đã đồng ý bản này' : ''}</p></div><Button onClick={() => setSelected(deal.id)}>Xem lời mời</Button></article>)}</section>}
    <Drawer title="Chi tiết lời mời" open={!!id} onClose={() => setSelected('')} destroyOnHidden size="min(700px, 100vw)" rootClassName="contact-proposal-drawer">{id && <CreatorOffer key={session + id} id={id} onSaved={() => void resource.reload()} />}</Drawer>
  </div>;
}
function CreatorOffer({ id, onSaved }: { id: string; onSaved: () => void }) {
  const query = useCallback(() => dealService.portalDetail(id), [id]);
  const resource = useAsyncResource(query);
  return resource.status === 'loading' ? <Skeleton active /> : resource.status === 'error' || !resource.data ? <Alert type="error" title={resource.error} action={<Button onClick={() => void resource.reload()}>Thử lại</Button>} /> : <CreatorResponse key={resource.data.revision + ':' + resource.data.acceptedRevision} deal={resource.data} onSaved={() => { onSaved(); void resource.reload(); }} />;
}
function CreatorResponse({ deal, onSaved }: { deal: Deal; onSaved: () => void }) {
  const { message } = App.useApp();
  const [form] = Form.useForm<ProposalForm>();
  const [counter, setCounter] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const session = getAuthSessionId();
  const lock = useRef(false);
  const mutable = ['CONTACTED', 'NEGOTIATING'].includes(deal.status) && deal.proposal?.kind === 'OFFER' && !['COMPLETED','ARCHIVED','CLOSED'].includes(deal.campaignStatus ?? '');
  const accepted = deal.proposal != null && deal.acceptedRevision === deal.proposal.revision;
  const perform = async (action: 'accept' | 'decline' | 'counteroffers', values?: ProposalForm) => {
    if (lock.current || !mutable) return;
    lock.current = true;
    setBusy(true); setError('');
    try {
      const body = action === 'counteroffers' && values ? proposalPayload(values, deal) : { expectedRevision: deal.revision };
      await dealService.portalRespond(deal.id, action, body, action === 'counteroffers' ? await writeKey(deal.id + ':counteroffers', body) : undefined);
      if (getAuthSessionId() !== session) return;
      message.success(action === 'accept' ? 'Đã ghi nhận đồng ý. Chờ thương hiệu xác nhận hợp tác.' : action === 'decline' ? 'Đã từ chối lời mời.' : 'Đã gửi đề xuất thay đổi.'); onSaved();
    } catch (error) { if (getAuthSessionId() === session) setError(getErrorMessage(error, 'Đề xuất có thể đã thay đổi. Tải lại trước khi phản hồi.')); }
    finally { lock.current = false; if (getAuthSessionId() === session) setBusy(false); }
  };
  if (!deal.proposal) return <Empty description="Thương hiệu chưa phát hành đề xuất" />;
  return <div className="contact-proposal"><strong>{deal.brandName ?? 'Thương hiệu'}{deal.campaignName ? ' · ' + deal.campaignName : ''}</strong><Tag>Bản đề xuất {deal.proposal.revision}</Tag>
    {accepted && <Alert type="success" title="Bạn đã đồng ý. Hợp tác chỉ được tạo sau khi thương hiệu xác nhận." />}
    {deal.proposal.kind === 'COUNTEROFFER' && <Alert type="info" title="Đang chờ thương hiệu phản hồi đề xuất thay đổi của bạn." />}
    {error && <Alert type="error" title={error} action={<Button onClick={onSaved}>Tải lại</Button>} />}
    <ProposalFields form={form} deal={deal} initialValues={{ fee: deal.proposal.fee, terms: deal.proposal.terms, kpiType: deal.proposal.kpiType ?? undefined, kpiTarget: deal.proposal.kpiTarget ?? null, units: deal.proposal.deliverables.map(unit => ({ ...unit, dueAt: localDate(unit.dueAt), checklist: unit.acceptanceChecklist.join('\n') })) }} mutable={counter && !!mutable} busy={busy} onDirty={() => {}} onFinish={values => void perform('counteroffers', values)} />
    {counter && accepted && <p className="contact-source">Gửi đề xuất thay đổi sẽ thay thế sự đồng ý với bản trước.</p>}
    {mutable && <div className="contact-proposal-footer">{counter ? <><Button disabled={busy} onClick={() => { form.resetFields(); setCounter(false); }}>Quay lại</Button><Button type="primary" loading={busy} onClick={() => form.submit()}>Gửi đề xuất thay đổi</Button></> : <>
      <Button disabled={busy} onClick={() => Modal.confirm({ title: 'Từ chối lời mời này?', okText: 'Từ chối', cancelText: 'Để sau', onOk: () => perform('decline') })}>Từ chối</Button><Button disabled={busy} onClick={() => setCounter(true)}>Đề xuất thay đổi</Button>
      <Button type="primary" disabled={busy || accepted} onClick={() => Modal.confirm({ title: 'Đồng ý với bản đề xuất ' + deal.proposal!.revision + '?', content: 'Bạn đồng ý phí, công việc, hạn bàn giao và điều khoản của bản đang xem.', okText: 'Đồng ý', cancelText: 'Kiểm tra lại', onOk: () => perform('accept') })}>Đồng ý đề xuất</Button>
    </>}</div>}
  </div>;
}
