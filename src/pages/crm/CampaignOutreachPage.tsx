import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, App, Button, Checkbox, Empty, Input, Modal, Select, Skeleton, Tabs, Tag } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { getAuthSessionId, getStoredUser, subscribeAuthSession } from '../../services/authSession';
import { activeCampaignId, rememberCampaign } from '../../services/campaignContext';
import { assessmentItems } from '../../services/contactContext';
import { completedRuns, coveringRun, evaluatedCreatorIds } from '../../services/recommendationHistory';
import type { ContactAssessment } from '../../services/contactContext';
import { campaignService } from '../../services/api/campaignService';
import { aiRecommendationService } from '../../services/api/aiRecommendationService';
import { shortlistService } from '../../services/api/shortlistService';
import { dealService } from '../../services/api/dealService';
import type { Deal } from '../../services/api/dealService';
import type { ContactReadiness, OutreachResult } from '../../types/api/shortlist.types';
import { getErrorMessage } from '../../services/apiClient';
import { readinessReason, outreachLabel } from '../creator/components/shortlistDisplay';
import CreatorAvatar from '../creator/components/discovery/CreatorAvatar';
import ShortlistQuickPicker from '../../components/campaign/ShortlistQuickPicker';
import DealProposalDrawer from './DealProposalDrawer';
import InvitationListItem from './InvitationListItem';
import './CampaignOutreachPage.css';

const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export default function CampaignOutreachPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = useSyncExternalStore(subscribeAuthSession, getAuthSessionId);
  const context = location.state?.contactContext?.sessionId === sessionId ? location.state.contactContext : null;
  const legacyId = new URLSearchParams(location.search).get('campaignId');
  const campaignId = context?.campaignId || legacyId || location.state?.campaignId || activeCampaignId();
  const permissions = getStoredUser()?.permissions ?? [];
  const campaignQuery = useCallback(async () => {
    if (!sessionId) return [];
    const campaigns = (await campaignService.getAllCampaigns()).filter(item => ['READY_FOR_DISCOVERY', 'ACTIVE'].includes(item.status));
    const checked = await Promise.all(campaigns.map(async campaign => ({ campaign, runs: await aiRecommendationService.getRecommendationRuns(campaign.id) })));
    return checked.filter(item => completedRuns(item.runs, item.campaign.id).length > 0).map(item => item.campaign);
  }, [sessionId]);
  const campaigns = useAsyncResource(campaignQuery, permissions.includes('MANAGE_OWN_RELATIONSHIP') && permissions.includes('VIEW_OWN_RECOMMENDATION'));
  useEffect(() => {
    if (!legacyId) return;
    rememberCampaign(legacyId);
    const params = new URLSearchParams(location.search); params.delete('campaignId');
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true, state: { ...location.state, campaignId: legacyId } });
  }, [legacyId, location.pathname, location.search, location.state, navigate]);
  const selector = <div className="contact-campaign-selector"><label htmlFor="outreach-campaign">Chiến dịch</label><Select id="outreach-campaign" showSearch optionFilterProp="label" placeholder="Chọn chiến dịch đã có kết quả AI" loading={campaigns.status === 'loading'} value={campaigns.data?.some(item => item.id === campaignId) ? campaignId : undefined} options={(campaigns.data ?? []).map(item => ({ value: item.id, label: item.name }))} onChange={id => { rememberCampaign(id); navigate(location.pathname, { replace: true, state: { campaignId: id } }); }} />{campaigns.status === 'error' && <Alert type="error" title="Không tải được danh sách chiến dịch" action={<Button onClick={() => void campaigns.reload()}>Thử lại</Button>} />}{campaigns.status === 'success' && !campaigns.data?.length && <p>Chưa có chiến dịch đang hoạt động đã hoàn tất đánh giá AI.</p>}</div>;
  if (!uuid.test(campaignId)) return <div className="contact-workspace contact-brand-workspace"><header className="contact-heading"><h1>Lời mời & thỏa thuận</h1></header>{selector}<Empty description="Chọn chiến dịch để xem các kênh và lời mời đã lưu" /></div>;
  return <OutreachWorkspace key={sessionId + ':' + campaignId} campaignId={campaignId} campaignSelector={selector}
    initialIds={Array.isArray(context?.creatorIds) && context.creatorIds.length <= 100 && context.creatorIds.every((id: unknown) => typeof id === 'string' && uuid.test(id)) ? context.creatorIds : []}
    assessment={context?.assessment} />;
}

function OutreachWorkspace({ campaignId, initialIds, assessment, campaignSelector }: { campaignId: string; initialIds: string[]; assessment?: ContactAssessment; campaignSelector: import('react').ReactNode }) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const permissions = getStoredUser()?.permissions ?? [];
  const canManage = permissions.includes('MANAGE_OWN_RELATIONSHIP');
  const canSelect = permissions.includes('MANAGE_OWN_SHORTLIST');
  const canViewAI = permissions.includes('VIEW_OWN_RECOMMENDATION');
  const [ids, setIds] = useState<string[]>(initialIds);
  const [addedChannelIds, setChannelIds] = useState<string[]>(initialIds);
  const [quick, setQuick] = useState(false);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('all');
  const [workspaceTab, setWorkspaceTab] = useState(initialIds.length ? 'channels' : 'invitations');
  const lock = useRef(false);
  const live = useRef(true);
  // Ignore mutation responses after leaving this campaign/account workspace.
  const ref = useCallback((node: HTMLDivElement | null) => { live.current = !!node; }, []);
  const [readiness, setReadiness] = useState<{ ids: string; data: ContactReadiness } | null>(null);
  const [checking, setChecking] = useState(false);
  const busy = checking;
  const [prepared, setPrepared] = useState<OutreachResult | null>(null);
  const [edit, setEdit] = useState<Deal | null>(null);
  const load = useCallback(async () => {
    const [campaign, records, deals, runs] = await Promise.all([
      campaignService.getCampaignById(campaignId), canSelect ? shortlistService.all(campaignId) : Promise.resolve([]), dealService.list(campaignId),
      canViewAI ? aiRecommendationService.getRecommendationRuns(campaignId) : Promise.resolve([]),
    ]);
    return { campaign, records: records.filter(item => item.status !== 'REMOVED'), deals, runs };
  }, [campaignId, canSelect, canViewAI]);
  const resource = useAsyncResource(load, uuid.test(campaignId) && canManage);
  useEffect(() => {
    if (resource.data?.campaign.id === campaignId) rememberCampaign(campaignId);
  }, [resource.data?.campaign.id, campaignId]);
  const loadAssessment = useCallback(async (): Promise<ContactAssessment | null> => {
    const runs = resource.data?.runs ?? [];
    const requested = ids;
    const run = assessment?.runId ? completedRuns(runs, campaignId).find(item => item.id === assessment.runId)
      : coveringRun(runs, campaignId, requested) ?? completedRuns(runs, campaignId)[0];
    if (!run || !Array.isArray(run.scoringSnapshot)) return null;
    const rows = run.scoringSnapshot;
    const reference = rows.filter(item => item.isProvisional === true || ['LIMITED_HISTORY', 'LIMITED_STABILITY'].includes(item.recommendationTier ?? ''));
    return { runId: run.id, evaluatedCreatorIds: run.runMetadata?.evaluatedCreatorIds, items: assessmentItems(rows.filter(item => !reference.includes(item)), reference) };
  }, [assessment, campaignId, ids, resource.data?.runs]);
  const ai = useAsyncResource(loadAssessment, canViewAI && resource.status === 'success' && uuid.test(campaignId));
  const records = resource.data?.records ?? [];
  const selected = records.filter(item => ids.includes(item.creatorId));
  const stale = ids.some(id => !records.some(item => item.creatorId === id));
  const selectionKey = JSON.stringify(selected.map(item => item.id).sort());
  const readinessQuery = useCallback(() => shortlistService.readiness(campaignId, JSON.parse(selectionKey)), [campaignId, selectionKey]);
  const contactRoutes = useAsyncResource(readinessQuery, canSelect && selected.length > 0 && resource.status === 'success');
  const eligible = readiness?.ids === selectionKey ? readiness.data : contactRoutes.status === 'success' ? contactRoutes.data : null;
  const terminal = ['COMPLETED', 'ARCHIVED', 'CLOSED'].includes(resource.data?.campaign.status ?? '');
  const uncovered = selected.filter(item => !ai.data?.items.some(result => result.creatorId === item.creatorId) && !ai.data?.evaluatedCreatorIds?.includes(item.creatorId));
  const evaluated = canViewAI && ai.status === 'success' && !!ai.data?.runId && selected.length > 0 && uncovered.length === 0;
  const deals = resource.data?.deals ?? [];
  const grouped = (deal: Deal) => ['CONFIRMED','ACTIVE','COMPLETED'].includes(deal.status) ? 'confirmed' : ['DECLINED','CANCELLED'].includes(deal.status) ? 'closed' : deal.proposal ? 'discussion' : 'draft';
  const visibleDeals = deals.filter(deal => group === 'all' || grouped(deal) === group);
  const savedIds = new Set((resource.data?.deals ?? []).flatMap(deal => deal.channels.map(channel => channel.creatorId)));
  const evaluatedIds = evaluatedCreatorIds(resource.data?.runs ?? [], campaignId);
  const channelIds = [...new Set([...savedIds, ...addedChannelIds])];
  const channels = records.filter(item => channelIds.includes(item.creatorId));
  const visible = channels.filter(item => `${item.creatorName ?? ''} ${item.userName ?? ''}`.toLocaleLowerCase('vi-VN').includes(search.trim().toLocaleLowerCase('vi-VN')));
  const changeSelection = (next: string[]) => { setIds(next); setReadiness(null); setPrepared(null); };
  const evaluateSelection = () => {
    if (!ids.length || terminal) return;
    const sessionId = getAuthSessionId();
    navigate('/campaign-management?tab=recommendation', { state: {
      recommendationContext: { sessionId, campaignId, creatorIds: ids },
      recommendationRunIntent: { token: crypto.randomUUID(), sessionId, campaignId, creatorIds: ids },
    } });
  };

  const check = async () => {
    if (lock.current || !selected.length || stale || !evaluated || terminal) return;
    lock.current = true; setChecking(true); setQuick(false);
    try {
      const data = await shortlistService.readiness(campaignId, selected.map(item => item.id));
      if (!live.current) return;
      setReadiness({ ids: selectionKey, data });
      const itemIds = data.items.filter(item => item.canProceed || ['ALREADY_CONTACTED', 'MANUAL_CONTACT'].includes(item.readinessStatus)).map(item => item.shortlistItemId);
      if (!itemIds.length) { message.warning('Chưa có cách liên hệ khả dụng. Kiểm tra từng kênh bên dưới.'); return; }
      const result = await shortlistService.prepareOutreach(campaignId, itemIds, ai.data!.runId);
      if (!live.current) return;
      setPrepared(result);
      await resource.reload();
      const dealIds = [...new Set(result.items.map(item => item.dealId).filter((id): id is string => !!id))];
      if (dealIds.length) { setWorkspaceTab('invitations'); setGroup('all'); }
      if (dealIds.length === 1) { const deal = await dealService.detail(campaignId, dealIds[0]); if (live.current) setEdit(deal); }
    } catch (error) { if (live.current) message.error(getErrorMessage(error)); }
    finally { lock.current = false; if (live.current) setChecking(false); }
  };

  if (!uuid.test(campaignId)) return <Empty description="Chọn một chiến dịch để tiếp tục"><Button onClick={() => navigate('/campaigns')}>Danh sách chiến dịch</Button></Empty>;
  if (!canManage) return <Alert type="warning" title="Bạn chưa có quyền quản lý tiếp cận và thỏa thuận." />;
  return <div className="contact-workspace contact-brand-workspace" ref={ref}>
    <header className="contact-heading"><div className="contact-heading-copy"><h1>Lời mời & thỏa thuận</h1><p>{resource.data?.campaign.name ?? 'Đang tải chiến dịch…'}</p></div></header>
    {campaignSelector}
    {resource.status === 'loading' ? <Skeleton active /> : resource.status === 'error' ? <Alert type="error" title="Không tải được dữ liệu tiếp cận" description={resource.error} action={<Button onClick={() => void resource.reload()}>Thử lại</Button>} /> : <>
      {terminal && <Alert type="info" title="Chiến dịch đã kết thúc hoặc lưu trữ. Chỉ xem lại hồ sơ." />}
      <Tabs className="contact-workspace-tabs" activeKey={workspaceTab} onChange={setWorkspaceTab} items={[
        { key: 'channels', label: `Kênh tiếp cận · ${channels.length}` },
        { key: 'invitations', label: `Lời mời & thỏa thuận · ${deals.length}` },
      ]} />
      {workspaceTab === 'channels' && <>
      {ai.status === 'error' && ids.length > 0 && <Alert type="warning" title="Chưa kiểm tra được kết quả đánh giá" action={<Button onClick={() => void ai.reload()}>Thử lại</Button>} />}
      {canViewAI && ai.status === 'success' && uncovered.length > 0 && <Alert type="info" title={`${uncovered.length} kênh chưa được đánh giá trong lượt này`} description="Đánh giá các kênh đã chọn cùng nhau để có một bảng xếp hạng chung. Kết quả cũ vẫn được giữ." action={<Button disabled={terminal || !permissions.includes('RUN_RECOMMENDATION')} onClick={evaluateSelection}>Đánh giá lựa chọn này</Button>} />}
      <section className="contact-panel"><div className="contact-section-heading"><h2>Kênh tiếp cận · {channels.length}</h2><div className="contact-channel-tools">{!!channels.length && <Input allowClear aria-label="Tìm kênh tiếp cận" placeholder="Tìm kênh tiếp cận" value={search} onChange={event => setSearch(event.target.value)} />}<Button disabled={!canSelect || busy || checking || terminal} onClick={() => setQuick(value => !value)}>Thêm kênh</Button></div></div>
        <ShortlistQuickPicker inline addOnly allowedIds={evaluatedIds} title="Thêm kênh đã được đánh giá AI" emptyDescription="Không còn kênh đã đánh giá hợp lệ để thêm trong chiến dịch này." excludedIds={channelIds} maxSelection={Math.max(0, 100 - ids.length)} confirmLabel="Thêm kênh" open={quick} campaignId={campaignId} selectedIds={[]} onClose={() => setQuick(false)} onApply={next => { const allowed = next.filter(id => evaluatedIds.includes(id) && !channelIds.includes(id)); setChannelIds(previous => [...new Set([...previous, ...allowed])]); changeSelection([...new Set([...ids, ...allowed])]); setQuick(false); }} />
        {stale && <Alert type="warning" title="Có kênh không còn trong Shortlist. Chọn lại trước khi tiếp tục." />}
        {!channels.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Thêm kênh muốn tiếp cận từ danh sách đã lưu." /> : <>
          <div className="contact-selection-toolbar"><Checkbox checked={channels.length > 0 && channels.every(item => ids.includes(item.creatorId))} indeterminate={selected.length > 0 && selected.length < channels.length} disabled={busy || terminal} onChange={event => changeSelection(event.target.checked ? channels.map(item => item.creatorId) : [])}>Chọn tất cả</Checkbox><span>Đã chọn {selected.length} kênh</span></div>
          <div className="contact-channel-list">{visible.map(item => {
            const result = canViewAI ? ai.data?.items.find(row => row.creatorId === item.creatorId) : null;
            const ready = eligible?.items.find(row => row.creatorId === item.creatorId);
            return <article className="contact-channel" key={item.id}><Checkbox aria-label={`Chọn ${item.creatorName || item.userName || 'kênh'}`} checked={ids.includes(item.creatorId)} disabled={busy || terminal} onChange={event => changeSelection(event.target.checked ? [...new Set([...ids, item.creatorId])] : ids.filter(id => id !== item.creatorId))} /><CreatorAvatar size={40} src={item.avatarUrl || undefined} name={item.creatorName || undefined} />
              <div className="contact-channel-copy"><strong>{item.creatorName || item.userName || 'Kênh chưa có tên'}</strong><small>{[item.platform, item.userName ? '@' + item.userName.replace(/^@+/, '') : null].filter(Boolean).join(' · ')}</small>
                <span>{result ? `${result.group === 'main' ? 'Đề xuất chính' : 'Tham khảo'} · #${result.position}${result.score != null ? ' · ' + result.score.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + '/100' : ' · Chưa công bố điểm'}` : canViewAI && ai.status === 'loading' ? 'Đang đọc kết quả AI…' : ai.data?.evaluatedCreatorIds?.includes(item.creatorId) ? 'Đã đánh giá · Không hiển thị điểm/thứ hạng trong bảng kết quả' : 'Chưa đánh giá trong lượt này'}</span>
                {ready && <div className="contact-route"><Tag>{ready.contactChannel === 'IN_APP_PORTAL' ? 'Portal & email' : ready.contactChannel === 'SYSTEM_EMAIL_OUTBOX' ? 'Email liên hệ' : ready.contactChannel === 'MANUAL_SOCIAL_LINK' ? 'Chia sẻ thủ công' : ready.contactChannel === 'EXISTING_INVITATION' ? 'Đã có hồ sơ lời mời' : 'Chưa thể liên hệ'}</Tag><small>{ready.contactChannel === 'IN_APP_PORTAL' ? 'Creator nhận thông báo trong tài khoản và email khi bạn gửi.' : ready.contactChannel === 'SYSTEM_EMAIL_OUTBOX' ? 'Hệ thống gửi email chứa link xem lời mời.' : ready.contactChannel === 'MANUAL_SOCIAL_LINK' ? 'Bạn lấy link lời mời và tự chia sẻ qua trang cá nhân.' : readinessReason(ready.readinessStatus)}</small></div>}
                {!ready && ids.includes(item.creatorId) && <small>{contactRoutes.status === 'loading' ? 'Đang kiểm tra cách liên hệ…' : contactRoutes.status === 'error' ? 'Chưa kiểm tra được cách liên hệ' : 'Cách gửi sẽ được kiểm tra khi soạn lời mời.'}</small>}
                {ready?.contactChannel === 'MANUAL_SOCIAL_LINK' && /^https?:\/\//i.test(ready.contactTarget ?? '') && <a href={ready.contactTarget!} target="_blank" rel="noopener noreferrer">Mở trang cá nhân để liên hệ</a>}
              </div></article>;
          })}</div>
          {!visible.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có kênh khớp tìm kiếm" />}
        </>}
        {prepared && <div className="contact-batch-results">{prepared.items.map(item => <p key={item.shortlistItemId}><strong>{item.creatorName || 'Kênh'}</strong> · {outreachLabel(item.contactStatus)}</p>)}</div>}
      </section>
      </>}
      {workspaceTab === 'invitations' && <section className="contact-panel"><div className="contact-section-heading"><h2>Lời mời & thỏa thuận</h2><div className="contact-channel-tools"><Select aria-label="Lọc trạng thái lời mời" value={group} onChange={setGroup} options={[['all','Tất cả'],['draft','Bản nháp'],['discussion','Đang trao đổi'],['confirmed','Đã xác nhận'],['closed','Đã dừng / Từ chối']].map(([value,label])=>({value,label:`${label} · ${value === 'all' ? deals.length : deals.filter(deal => grouped(deal) === value).length}`}))} /><Button icon={<ReloadOutlined />} disabled={busy} onClick={() => void resource.reload()}>Cập nhật</Button></div></div>
        {prepared && <div className="contact-batch-results">{prepared.items.map(item => <p key={item.shortlistItemId}><strong>{item.creatorName || 'Kênh'}</strong> · {outreachLabel(item.contactStatus)}</p>)}</div>}
        {!visibleDeals.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lời mời trong nhóm này" /> : <div className="contact-deal-list">{visibleDeals.map(deal => <InvitationListItem key={deal.id} deal={deal} name={deal.channels.map(channel => records.find(item => item.creatorId === channel.creatorId)?.creatorName || channel.username || channel.platform).join(' · ')} readOnly={terminal} onOpen={() => setEdit(deal)} />)}</div>}
      </section>}
    </>}
    <footer className="contact-bottom-bar" aria-label="Thao tác tiếp cận">
      <strong>{workspaceTab === 'channels' ? selected.length ? `Đã chọn ${selected.length} kênh` : 'Chưa chọn kênh' : `${deals.length} lời mời & thỏa thuận`}</strong>
      <div className="contact-bottom-buttons">
        <Button icon={<ArrowLeftOutlined />} disabled={busy} onClick={() => { rememberCampaign(campaignId); navigate('/campaign-management?tab=recommendation', { state: { recommendationContext: { sessionId: getAuthSessionId(), campaignId, creatorIds: [] }, recommendationViewRunId: ai.data?.runId } }); }}>Kết quả AI</Button>
        {workspaceTab === 'channels' && <Button type="primary" loading={checking} disabled={resource.status !== 'success' || busy || terminal || stale || !evaluated} onClick={() => void check()}>Soạn lời mời{selected.length ? ` · ${selected.length} kênh` : ''}</Button>}
      </div>
    </footer>
    <Modal title="Soạn lời mời hợp tác" className="contact-compose-modal" centered width={920} open={!!edit} onCancel={() => setEdit(null)} footer={null} destroyOnHidden maskClosable={false}>
      {edit && <DealProposalDrawer key={edit.id} campaignId={campaignId} dealId={edit.id} readOnly={terminal} reusableDeals={deals} contactChannel={eligible?.items.find(item => edit.channels.some(channel => channel.creatorId === item.creatorId))?.contactChannel ?? undefined} onSaved={() => void resource.reload()} />}
    </Modal>
  </div>;
}
