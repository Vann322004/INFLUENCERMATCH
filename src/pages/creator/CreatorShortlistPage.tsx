import ShortlistCreatorCard from './components/ShortlistCreatorCard';
import CampaignImage from '../../components/common/CampaignImage';
import ShortlistQuickPicker from '../../components/campaign/ShortlistQuickPicker';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, Button, ConfigProvider, Empty, Form, Input, Modal, Pagination, Select, Skeleton, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { activeCampaignId, rememberCampaign } from '../../services/campaignContext';
import { shortlistService } from '../../services/api/shortlistService';
import { campaignService } from '../../services/api/campaignService';
import { getErrorMessage } from '../../services/apiClient';
import { getStoredUser, getAuthSessionId, subscribeAuthSession } from '../../services/authSession';
import type { ShortlistRecord, ShortlistStatus } from '../../types/api/shortlist.types';
import type { ShortlistPriority } from '../../types/api/creator.types';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { useShortlistRealtime } from '../../hooks/useShortlistRealtime';
import ShortlistComparison from './components/ShortlistComparison';
import { aiRecommendationService } from '../../services/api/aiRecommendationService';
import { coveringRun } from '../../services/recommendationHistory';
import './CreatorDiscoveryPage.css';
import './CreatorShortlistPage.css';

const authScope = () => { const user = getStoredUser(); return JSON.stringify([getAuthSessionId(), user?.id, user?.role, user?.authVersion, user?.permissions]); };
const errorText = (error: unknown) => {
  const err = error as { response?: { status?: number }; message?: string };
  return err.response?.status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : err.response?.status === 404 ? 'Không tìm thấy dữ liệu thuộc tài khoản hiện tại.' : err.response?.status === 409 ? 'Dữ liệu đã thay đổi. Vui lòng tải lại và thử lại.' : 'Không thể thực hiện yêu cầu. Vui lòng thử lại.';
};
const priorities = [{ value: 'HIGH', label: 'Cao' }, { value: 'MEDIUM', label: 'Trung bình' }, { value: 'LOW', label: 'Thấp' }];
const statuses: Record<ShortlistStatus, string> = { SAVED: 'Đã lưu', READY_TO_CONTACT: 'Sẵn sàng liên hệ', CONTACTED: 'Đã chuyển bước liên hệ', REMOVED: 'Đã xóa' };

export default function CreatorShortlistPage() {
  const location = useLocation(), navigate = useNavigate();
  const session = useSyncExternalStore(subscribeAuthSession, authScope);
  const sessionId = getAuthSessionId();
  const canManage = !!getStoredUser()?.permissions?.includes('MANAGE_OWN_SHORTLIST');
  const campaignQuery = useCallback(() => shortlistService.campaigns(), [session]);
  const campaigns = useAsyncResource(campaignQuery, canManage);
  const searchParams = new URLSearchParams(location.search);
  const routeContext = location.state?.shortlistContext?.sessionId === sessionId ? location.state.shortlistContext : null;
  const campaignId: string = searchParams.get('campaignId') || location.state?.campaignId || routeContext?.campaignId || activeCampaignId() || '';
  useEffect(() => {
    if (!campaignId || (!new URLSearchParams(location.search).has('campaignId') && !location.state?.campaignId && routeContext?.campaignId === campaignId)) return;
    rememberCampaign(campaignId);
    const next = new URLSearchParams(location.search); next.delete('campaignId'); next.delete('creatorIds');
    const { campaignId: _legacyId, ...state } = location.state ?? {};
    navigate({ pathname: location.pathname, search: next.toString() }, { replace: true, state: {
      ...state, shortlistContext: { sessionId, campaignId },
    } });
  }, [campaignId, sessionId, location.search, location.state, location.pathname, routeContext?.campaignId, navigate]);
  const campaign = campaigns.data?.find(item => item.id === campaignId);
  const compareSection = useRef<HTMLElement>(null);

  const context = session + ':' + campaignId, live = useRef(context); live.current = context;
  const [params, setParams] = useState<{ page: number; size: number; priority?: ShortlistPriority; status?: ShortlistStatus }>({ page: 0, size: 20 });
  const query = useCallback(() => shortlistService.list(campaignId, params), [campaignId, params, session]);
  const list = useAsyncResource(query, canManage && !!campaignId);
  const [selection, setSelection] = useState<{ context: string; items: ShortlistRecord[] }>({ context: '', items: [] });
  const selected = selection.context === context ? selection.items : [];
  const selectedCreatorKey = JSON.stringify(selected.map(item => item.creatorId));
  const [compareOpen, setCompareOpen] = useState(false);
  const compareQuery = useCallback(() => shortlistService.compare(campaignId, JSON.parse(selectedCreatorKey)), [campaignId, selectedCreatorKey, session]);
  const comparison = useAsyncResource(compareQuery, canManage && compareOpen && selected.length >= 2 && selected.length <= 5);
  const [busy, setBusy] = useState<string | null>(null), [edit, setEdit] = useState<{ context: string; item: ShortlistRecord } | null>(null);
  const [editForm] = Form.useForm();
  const reload = useCallback(() => { void list.reload(); if (compareOpen && selected.length >= 2) void comparison.reload(); }, [list.reload, compareOpen, comparison.reload, selected.length]);
  useShortlistRealtime(campaignId || null, reload);

  const [quickOpen, setQuickOpen] = useState(false);
  const recommendationNavigationLock = useRef(false);
  useEffect(() => { recommendationNavigationLock.current = false; }, [context]);
  const canStartRecommendations = !!campaign && !busy && !!getStoredUser()?.permissions?.includes('RUN_RECOMMENDATION')
    && !['COMPLETED', 'ARCHIVED', 'CLOSED'].includes(campaign.status);
  const canViewRecommendations = !!getStoredUser()?.permissions?.includes('VIEW_OWN_RECOMMENDATION');
  const evaluationQuery = useCallback(async () => { if (authScope() !== session) throw new Error('Phiên đăng nhập đã thay đổi.'); return { records: await shortlistService.all(campaignId), runs: await aiRecommendationService.getRecommendationRuns(campaignId) }; }, [campaignId, session]);
  const evaluation = useAsyncResource(evaluationQuery, !!campaignId && canManage && canViewRecommendations);
  const refreshEvaluation = evaluation.reload, evaluationListData = list.data, evaluationListStatus = list.status;
  useEffect(() => { if (evaluationListStatus === 'success') void refreshEvaluation(); }, [evaluationListData, evaluationListStatus, refreshEvaluation]);
  const scopeIds = selected.length ? selected.map(item => item.creatorId) : evaluation.data?.records.filter(item => item.status !== 'REMOVED').map(item => item.creatorId) ?? [];
  const existingEvaluation = coveringRun(evaluation.data?.runs ?? [], campaignId, scopeIds);
  const backToDiscovery = () => {
    if (!campaignId) return;
    rememberCampaign(campaignId);
    navigate('/creators', { state: { campaignId } });
  };
  const openRecommendations = async (ids: string[] = selected.map(item => item.creatorId)) => {
    if (!campaign || (!canStartRecommendations && !canViewRecommendations) || recommendationNavigationLock.current) return;
    recommendationNavigationLock.current = true;
    try {
    const [records, runs] = await Promise.all([shortlistService.all(campaign.id), aiRecommendationService.getRecommendationRuns(campaign.id)]);
    if (live.current !== context) return;
    const activeIds = records.filter(item => item.status !== 'REMOVED').map(item => item.creatorId);
    const requested = ids.length ? ids : activeIds;
    if (!requested.length || requested.some(id => !activeIds.includes(id))) { message.warning('Chọn kênh đang lưu trước khi đánh giá.'); return; }
    const saved = coveringRun(runs, campaign.id, requested);
    if (existingEvaluation && !saved) {
      message.warning('Phạm vi đánh giá đã thay đổi. Kiểm tra lại lựa chọn trước khi chạy lượt mới.');
      await evaluation.reload();
      return;
    }
    if (!saved && !canStartRecommendations) { message.warning('Bạn chưa thể chạy lượt đánh giá mới.'); return; }
    rememberCampaign(campaign.id);
    const sessionId = getAuthSessionId();
    navigate('/campaign-management?tab=recommendation', {
      state: {
        recommendationContext: { sessionId, campaignId: campaign.id, creatorIds: ids },
        recommendationViewRunId: saved?.id,
        recommendationRunIntent: saved ? undefined : { token: crypto.randomUUID(), sessionId, campaignId: campaign.id, creatorIds: ids },
      },
    });
    } catch (error) { message.error(getErrorMessage(error, 'Chưa kiểm tra được lịch sử đánh giá. Không có lượt AI nào được chạy.')); }
    finally { recommendationNavigationLock.current = false; }
  };



  const toggle = (item: ShortlistRecord, checked: boolean) => {
    if (checked && selected.length >= 100) { message.warning('Mỗi lần chỉ xử lý tối đa 100 kênh. Bỏ chọn một kênh trước.'); return; }
    setSelection(previous => ({ context, items: checked ? [...(previous.context === context ? previous.items : []), item]
      : previous.items.filter(row => row.creatorId !== item.creatorId) }));
  };

  const mutate = async (key: string, work: () => Promise<unknown>, success: string) => {
    const active = context; setBusy(key);
    try { await work(); if (live.current !== active) return; message.success(success); setEdit(null); await list.reload(); if (compareOpen && selected.length >= 2) await comparison.reload(); return true; }
    catch (error) { if (live.current === active) message.error(errorText(error)); return false; }
    finally { if (live.current === active) setBusy(null); }
  };

  const restore = async (item: ShortlistRecord) => {
    const active = context; setBusy(item.id);
    try {
      const result = await shortlistService.add(campaignId, { creatorId: item.creatorId, priority: item.priority, note: item.note ?? undefined });
      if (live.current !== active) return;
      message.info(result.action === 'RESTORED' ? 'Đã khôi phục kênh vào danh sách.' : result.action === 'ALREADY_EXISTS' ? 'Kênh đã có trong danh sách.' : 'Đã thêm kênh vào danh sách.'); await list.reload();
    } catch (error) { if (live.current === active) message.error(errorText(error)); }
    finally { if (live.current === active) setBusy(null); }
  };

  const handleViewProfile = (item: ShortlistRecord) => {
    if (campaignId) rememberCampaign(campaignId);
    navigate('/creators/detail', {
      state: {
        creatorId: item.creatorId,
        campaignId: campaignId || undefined,
        from: 'shortlist',
        returnTo: '/creators/shortlist',
      },
    });
  };

  if (!canManage) return <div className="sl-page"><Alert type="info" title="Bạn không có quyền quản lý danh sách đã chọn." /></div>;
  return (
    <ConfigProvider locale={viVN}>
      <div className="sl-page">
        <header className="sl-heading">
          <div>
            <h1>Danh sách đã chọn</h1>
          </div>
        </header>
        {campaigns.status === 'loading' ? (
          <Skeleton active />
        ) : campaigns.status === 'error' ? (
          <Alert type="error" title="Không thể tải chiến dịch." action={<Button onClick={() => void campaigns.reload()}>Thử lại</Button>} />
        ) : campaigns.data?.length === 0 ? (
          <Empty description="Chưa có chiến dịch" />
        ) : !campaign ? (
          <section className="sl-panel"><Empty description={campaignId ? 'Không tìm thấy chiến dịch hiện tại hoặc bạn không có quyền truy cập.' : 'Chọn chiến dịch trước khi xem danh sách đã lưu.'} />
            <Button onClick={() => navigate('/campaigns')}>Về danh sách chiến dịch</Button>
          </section>
        ) : (
          <>
            <section className="sl-panel sl-campaign-context">
              <div className="sl-campaign-context-main">
                <CampaignImage src={campaign.imageUrl} className="sl-campaign-thumb" />
                <div>
                  <span className="sl-campaign-label">CHIẾN DỊCH HIỆN TẠI</span>
                  <h2>{campaign.name}</h2>
                </div>
              </div>
              <Button icon={<ArrowLeftOutlined />} onClick={backToDiscovery}>Thêm từ Khám phá</Button>
            </section>
            <div className="sl-workspace-card">
            <div className="sl-list-header">
              <div>
                <h2>Kênh đã lưu {list.status === 'success' && <span>{list.data?.totalElements.toLocaleString('vi-VN')}</span>}</h2>
              </div>
              <div className="sl-list-tools">
                <Button disabled={!canStartRecommendations} aria-expanded={quickOpen} onClick={() => setQuickOpen(value => !value)}>Chọn nhanh</Button>
                <Select aria-label="Lọc ưu tiên" value={params.priority ?? 'ALL'} options={[{ value: 'ALL', label: 'Mọi ưu tiên' }, ...priorities]} onChange={value => setParams(previous => ({ ...previous, page: 0, priority: value === 'ALL' ? undefined : value as ShortlistPriority }))} />
                <Select aria-label="Lọc trạng thái" value={params.status ?? 'ALL'} options={[{ value: 'ALL', label: 'Kênh đang lưu' }, ...Object.entries(statuses).map(([value, label]) => ({ value, label }))]} onChange={value => setParams(previous => ({ ...previous, page: 0, status: value === 'ALL' ? undefined : value as ShortlistStatus }))} />
              </div>
            </div>
            <div className="sl-workspace-body">
        {quickOpen && (
          <ShortlistQuickPicker
            key={context}
            inline
            open={quickOpen}
            campaignId={campaignId}
            selectedIds={selected.map(item => item.creatorId)}
            confirmLabel="Đánh giá"
            onClose={() => setQuickOpen(false)}
            onApply={ids => {
              setQuickOpen(false);
              openRecommendations(ids);
            }}
          />
        )}
            {!campaignId ? (
              <Empty description="Chọn chiến dịch để xem danh sách" />
            ) : list.status === 'loading' ? (
              <Skeleton active />
            ) : list.status === 'error' ? (
              <Alert type="error" title="Không thể tải danh sách đã chọn." action={<Button onClick={() => void list.reload()}>Thử lại</Button>} />
            ) : !list.data?.items.length ? (
              <Empty description="Chưa có kênh theo bộ lọc này">
                <Button onClick={backToDiscovery}>Khám phá nhà sáng tạo</Button>
              </Empty>
            ) : (
              <div className="sl-channel-grid">
                {list.data.items.map(item => (
                  <ShortlistCreatorCard
                    key={item.id}
                    item={item}
                    checked={selected.some(row => row.creatorId === item.creatorId)}
                    busy={!!busy}
                    onToggle={checked => toggle(item, checked)}
                    onEdit={() => {
                      setEdit({ context, item });
                      editForm.setFieldsValue({ priority: item.priority, note: item.note ?? '' });
                    }}
                    onRemove={async () => {
                      const removed = await mutate(item.id, () => shortlistService.remove(campaignId, item.id), 'Đã bỏ kênh khỏi danh sách.');
                      if (removed && live.current === context) {
                        setSelection(previous => ({
                          ...previous,
                          items: previous.items.filter(row => row.creatorId !== item.creatorId),
                        }));
                      }
                    }}
                    onRestore={() => void restore(item)}
                    onView={() => void handleViewProfile(item)}
                  />
                ))}
              </div>
            )}
            {list.status === 'success' && list.data && (
              <Pagination
                hideOnSinglePage
                current={list.data.page + 1}
                pageSize={list.data.size}
                total={list.data.totalElements}
                showSizeChanger
                pageSizeOptions={[10, 20, 50]}
                onChange={(page, size) => setParams(previous => ({ ...previous, page: size !== previous.size ? 0 : page - 1, size }))}
              />
            )}
            </div>
            </div>
            {compareOpen && (
              <section ref={compareSection} className="sl-panel sl-comparison" aria-label="So sánh các kênh">
                <div className="sl-heading">
                  <h2>So sánh kênh · theo thứ tự đã chọn</h2>
                  <Button onClick={() => setCompareOpen(false)}>Đóng so sánh</Button>
                </div>
                <p className="sl-muted">Các chỉ số phản ánh dữ liệu đã thu thập của từng kênh.</p>
                {selected.length < 2 || selected.length > 5 ? (
                  <p>Chọn từ 2 đến 5 kênh để so sánh.</p>
                ) : comparison.status === 'loading' ? (
                  <Skeleton active />
                ) : comparison.status === 'error' ? (
                  <Alert type="error" title="Không thể lấy dữ liệu so sánh." action={<Button onClick={() => void comparison.reload()}>Thử lại so sánh</Button>} />
                ) : (
                  comparison.data && <ShortlistComparison data={comparison.data} />
                )}
              </section>
            )}
            <footer className={selected.length > 0 ? 'sl-action-bar is-floating' : 'sl-action-bar'} aria-label="Thao tác danh sách đã chọn">
              <div className="sl-action-summary">
                <strong>{selected.length ? `Đã chọn ${selected.length} kênh` : 'Chưa đánh dấu kênh'}</strong>
              </div>
              <div className="sl-action-buttons">
                <Button icon={<ArrowLeftOutlined />} disabled={!!busy} onClick={backToDiscovery}>Khám phá</Button>
                {selected.length > 0 && (
                  <>
                    <Button
                      disabled={selected.length < 2 || selected.length > 5 || !!busy}
                      onClick={() => {
                        setCompareOpen(true);
                        requestAnimationFrame(() => compareSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                      }}
                    >
                      So sánh (2–5 kênh)
                    </Button>
                    <Button disabled={!!busy} onClick={() => { setSelection({ context, items: [] }); setCompareOpen(false); }}>Bỏ chọn</Button>
                  </>
                )}
                <Button
                  type="primary"
                  disabled={!!busy || evaluation.status === 'loading' || (!canStartRecommendations && !existingEvaluation)}
                  onClick={() => openRecommendations()}
                >
                  {existingEvaluation ? 'Xem kết quả đánh giá' : selected.length > 0 ? `Đánh giá ${selected.length} kênh đã chọn` : `Đánh giá toàn bộ ${scopeIds.length} kênh đang lưu`} <ArrowRightOutlined />
                </Button>
              </div>
            </footer>
          </>
        )}

        <Modal
          title="Ghi chú và ưu tiên"
          open={edit?.context === context}
          onCancel={() => { if (!busy) setEdit(null); }}
          footer={null}
          destroyOnHidden
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={values => {
              if (edit?.context === context) {
                void mutate(edit.item.id, () => shortlistService.update(campaignId, edit.item.id, { priority: values.priority, note: values.note }), 'Đã lưu ưu tiên và ghi chú vào hệ thống.');
              }
            }}
          >
            <Form.Item name="priority" label="Ưu tiên" rules={[{ required: true }]}><Select options={priorities} /></Form.Item>
            <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={4} /></Form.Item>
            <Button type="primary" htmlType="submit" loading={!!busy}>Lưu thay đổi</Button>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
}
