import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, App, Button, Card, Drawer, Empty, Form, Modal, Skeleton, Space, Tabs, Tag } from 'antd';
import { CarryOutOutlined, MailOutlined, ReloadOutlined } from '@ant-design/icons';
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
import './CreatorPortalPage.css';

const STATUS_TAG_COLORS: Record<string, string> = {
  CONTACTED: 'blue',
  NEGOTIATING: 'purple',
  ACCEPTED: 'success',
  CONVERTED: 'success',
  DECLINED: 'error',
  CANCELLED: 'default',
  EXPIRED: 'default',
};

export default function CreatorCooperationPage() {
  const [params, setParams] = useSearchParams();
  const active = params.get('view') === 'work' ? 'work' : 'offers';
  return (
    <div className="creator-studio-stack">
      <header className="creator-page-header-row">
        <div>
          <h2 className="creator-page-title">Quản lý Hợp tác &amp; Booking</h2>
          <p className="creator-page-subtitle">
            Xem lời mời từ Thương hiệu, trao đổi điều khoản và theo dõi tiến độ bàn giao sản phẩm
          </p>
        </div>
      </header>

      <Tabs
        activeKey={active}
        onChange={view => setParams(previous => { const next = new URLSearchParams(previous); next.set('view', view); return next; }, { replace: true })}
        items={[
          {
            key: 'offers',
            label: <span><MailOutlined style={{ marginRight: 6 }} />Lời mời hợp tác</span>,
            children: <CreatorOffers />,
          },
          {
            key: 'work',
            label: <span><CarryOutOutlined style={{ marginRight: 6 }} />Quản lý bàn giao</span>,
            children: <CreatorCollaborations />,
          },
        ]}
      />
    </div>
  );
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
  if (!canRespond) return <Alert type="warning" showIcon title="Bạn chưa có quyền phản hồi lời mời hợp tác." />;

  const deals = resource.data ?? [];
  const negotiatingCount = deals.filter(d => ['CONTACTED', 'NEGOTIATING'].includes(d.status)).length;
  const acceptedCount = deals.filter(d => d.status === 'ACCEPTED' || (d.proposal != null && d.acceptedRevision === d.proposal.revision)).length;

  return (
    <div className="creator-studio-stack">
      <div className="creator-admin-rate-stats" style={{ marginBottom: 0 }}>
        <section>
          <span>Tổng lời mời</span>
          <strong>{deals.length} đề xuất</strong>
          <small>Gửi tới các kênh bạn đang quản lý</small>
        </section>
        <section>
          <span>Đang trao đổi</span>
          <strong>{negotiatingCount} lời mời</strong>
          <small>Cần xem xét hoặc phản hồi đề xuất</small>
        </section>
        <section>
          <span>Đã đồng ý</span>
          <strong>{acceptedCount} hợp tác</strong>
          <small>Sẵn sàng hoặc đang chờ Brand xác nhận</small>
        </section>
      </div>

      <Card
        className="creator-admin-rate-table"
        styles={{ header: { background: '#f8fafc', borderBottom: '1px solid #e2e8f0' } }}
        title="Danh sách lời mời hợp tác"
        extra={
          <Button size="small" icon={<ReloadOutlined />} onClick={() => void resource.reload()}>
            Cập nhật
          </Button>
        }
      >
        {resource.status === 'loading' ? (
          <Skeleton active />
        ) : resource.status === 'error' ? (
          <Alert type="error" showIcon title={resource.error} action={<Button onClick={() => void resource.reload()}>Thử lại</Button>} />
        ) : !deals.length ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lời mời thuộc các kênh bạn quản lý." />
        ) : (
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            {deals.map(deal => {
              const acceptedThisRevision = deal.acceptedRevision === deal.proposal?.revision && !!deal.proposal;
              const headline = deal.brandName
                ? `${deal.brandName}${deal.campaignName ? ` · ${deal.campaignName}` : ''}`
                : deal.channels.map(c => `${c.platform} · @${c.username.replace(/^@+/, '')}`).join(' / ');
              return (
                <div
                  key={deal.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 14,
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ minWidth: 220, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ color: '#0f172a', fontSize: 14.5 }}>{headline}</strong>
                      <Tag color={STATUS_TAG_COLORS[deal.status] ?? 'default'} style={{ margin: 0, fontWeight: 600 }}>
                        {dealLabel(deal.status)}
                      </Tag>
                      {acceptedThisRevision && (
                        <Tag color="success" style={{ margin: 0 }}>Bạn đã đồng ý bản này</Tag>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {deal.channels.map(channel => (
                        <Tag key={channel.creatorId} color="geekblue" style={{ margin: 0 }}>
                          {channel.platform} · @{channel.username.replace(/^@+/, '')}
                        </Tag>
                      ))}
                      {deal.proposal ? (
                        <span style={{ fontSize: 13, color: '#475569' }}>
                          Ngân sách: <strong style={{ color: '#7C3AED' }}>{deal.proposal.fee.toLocaleString('vi-VN')} ₫</strong>
                          {' · '}Bản đề xuất {deal.proposal.revision}
                        </span>
                      ) : (
                        <span style={{ fontSize: 13, color: '#64748b' }}>Chưa có đề xuất</span>
                      )}
                    </div>
                  </div>

                  <Button type="primary" onClick={() => setSelected(deal.id)}>
                    Xem lời mời
                  </Button>
                </div>
              );
            })}
          </Space>
        )}
      </Card>

      <Drawer title="Chi tiết lời mời" open={!!id} onClose={() => setSelected('')} destroyOnHidden size="min(700px, 100vw)" rootClassName="contact-proposal-drawer">
        {id && <CreatorOffer key={session + id} id={id} onSaved={() => void resource.reload()} />}
      </Drawer>
    </div>
  );
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
  const errorRef = useRef<HTMLDivElement>(null);
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
    } catch (error) {
      if (getAuthSessionId() === session) {
        const msg = getErrorMessage(error, 'Đề xuất có thể đã thay đổi. Tải lại trước khi phản hồi.');
        setError(msg);
        message.error(msg);
        requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      }
    }
    finally { lock.current = false; if (getAuthSessionId() === session) setBusy(false); }
  };
  if (!deal.proposal) return <Empty description="Thương hiệu chưa phát hành đề xuất" />;
  return <div className="contact-proposal">
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 10,
      padding: '12px 14px',
      borderRadius: 10,
      background: '#F8FAFC',
      border: '1px solid #E2E8F0',
    }}>
      <strong style={{ fontSize: 15, color: '#0F172A' }}>
        {deal.brandName ?? 'Thương hiệu'}{deal.campaignName ? ' · ' + deal.campaignName : ''}
      </strong>
      <Tag color="purple" style={{ margin: 0, fontWeight: 600 }}>Bản đề xuất {deal.proposal.revision}</Tag>
    </div>
    {accepted && <Alert type="success" showIcon title="Bạn đã đồng ý. Hợp tác chỉ được tạo sau khi thương hiệu xác nhận." />}
    {counter && !accepted && <Alert type="info" showIcon title="Chế độ đề xuất thay đổi" description="Chỉnh sửa ngân sách, KPI, điều khoản hoặc ấn phẩm bên dưới rồi bấm Gửi đề xuất thay đổi." />}
    {deal.proposal.kind === 'COUNTEROFFER' && <Alert type="info" showIcon title="Đang chờ thương hiệu phản hồi đề xuất thay đổi của bạn." />}
    {error && <div ref={errorRef}><Alert type="error" showIcon title={error} action={<Button onClick={onSaved}>Tải lại</Button>} /></div>}
    <ProposalFields form={form} deal={deal} initialValues={{ fee: deal.proposal.fee, terms: deal.proposal.terms, kpiType: deal.proposal.kpiType ?? undefined, kpiTarget: deal.proposal.kpiTarget ?? null, units: deal.proposal.deliverables.map(unit => ({ ...unit, dueAt: localDate(unit.dueAt), checklist: unit.acceptanceChecklist.join('\n') })) }} mutable={counter && !!mutable && !accepted} busy={busy} onDirty={() => {}} onFinish={values => void perform('counteroffers', values)} />
    {mutable && !accepted && <div className="contact-proposal-footer">{counter ? <><Button disabled={busy} onClick={() => { form.resetFields(); setCounter(false); }}>Quay lại</Button><Button type="primary" loading={busy} onClick={() => form.submit()}>Gửi đề xuất thay đổi</Button></> : <>
      <Button disabled={busy} onClick={() => Modal.confirm({ title: 'Từ chối lời mời này?', okText: 'Từ chối', cancelText: 'Để sau', onOk: () => perform('decline') })}>Từ chối</Button><Button disabled={busy} onClick={() => setCounter(true)}>Đề xuất thay đổi</Button>
      <Button type="primary" disabled={busy} onClick={() => Modal.confirm({ title: 'Đồng ý với bản đề xuất ' + deal.proposal!.revision + '?', content: 'Bạn đồng ý phí, công việc, hạn bàn giao và điều khoản của bản đang xem.', okText: 'Đồng ý', cancelText: 'Kiểm tra lại', onOk: () => perform('accept') })}>Đồng ý đề xuất</Button>
    </>}</div>}
  </div>;
}
