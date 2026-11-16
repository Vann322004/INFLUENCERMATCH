import ShortlistCreatorCard, { formatFollowers, formatEngagement, formatFee } from './components/ShortlistCreatorCard';
import ShortlistQuickPicker from '../../components/campaign/ShortlistQuickPicker';
import { CreatorDetailDrawer } from './components/discovery/CreatorDetailDrawer';
import type { Creator } from './components/discovery/types';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, Button, ConfigProvider, Dropdown, Empty, Form, Input, Modal, Pagination, Popconfirm, Select, Skeleton, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { ArrowRightOutlined, MoreOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { activeCampaignId, rememberCampaign, campaignPath } from '../../services/campaignContext';
import { shortlistService } from '../../services/api/shortlistService';
import { campaignService } from '../../services/api/campaignService';
import { creatorService } from '../../services/api/creatorService';
import { getErrorMessage } from '../../services/apiClient';
import { getStoredUser, getAuthSessionId, subscribeAuthSession } from '../../services/authSession';
import type { ShortlistRecord, ShortlistStatus, OutreachResult } from '../../types/api/shortlist.types';
import type { ShortlistPriority } from '../../types/api/creator.types';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { useShortlistRealtime } from '../../hooks/useShortlistRealtime';
import ShortlistComparison from './components/ShortlistComparison';
import { shortlistLabel, readinessReason, outreachLabel } from './components/shortlistDisplay';
import './CreatorDiscoveryPage.css';
import './CreatorShortlistPage.css';

const authScope = () => { const user = getStoredUser(); return JSON.stringify([getAuthSessionId(), user?.id, user?.role, user?.authVersion, user?.permissions]); };
const errorText = (error: unknown) => {
  const err = error as { response?: { status?: number }; message?: string };
  return err.response?.status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : err.response?.status === 404 ? 'Không tìm thấy dữ liệu thuộc tài khoản hiện tại.' : err.response?.status === 409 ? 'Dữ liệu đã thay đổi. Vui lòng tải lại và thử lại.' : 'Không thể thực hiện yêu cầu. Vui lòng thử lại.';
};
const priorities = [{ value: 'HIGH', label: 'Cao' }, { value: 'MEDIUM', label: 'Trung bình' }, { value: 'LOW', label: 'Thấp' }];
const statuses: Record<ShortlistStatus, string> = { SAVED: 'Đã lưu', READY_TO_CONTACT: 'Sẵn sàng liên hệ', CONTACTED: 'Đã chuyển bước liên hệ', REMOVED: 'Đã xóa' };

function shortlistRecordToCreator(item: ShortlistRecord): Creator {
  const categories = [
    ...new Set(
      [item.niche, item.category].flatMap(
        (v) => v?.split(/[,;]/).map((t) => t.trim()).filter(Boolean) ?? []
      )
    ),
  ];
  const fee = formatFee(item);

  return {
    id: item.creatorId,
    name: item.creatorName || 'Kênh chưa có tên',
    username: item.userName ? item.userName.replace(/^@+/, '') : '',
    avatar: item.avatarUrl || '',
    isVerified: !!item.verifiedByInfluencerMatch,
    matchRate: 0,
    matchLevel: 'medium',
    platforms: item.platform ? [item.platform.toLowerCase() as Creator['platforms'][number]] : [],
    categories,
    bio: item.contentSummary || '',
    followers: formatFollowers(item.followers),
    followersCount: item.followers || 0,
    engagementRate: formatEngagement(item.engagementRate),
    engagementValue: item.engagementRate || 0,
    avgPrice: fee,
    priceSource: item.actualFee != null ? 'Báo giá đã ghi nhận' : item.estimatedFeeMin != null || item.estimatedFeeMax != null ? 'Khoảng giá ước tính' : undefined,
    avgPriceValue: item.actualFee || item.estimatedFeeMin || 0,
    location: (item as { location?: string | null }).location || '',
    saved: item.status !== 'REMOVED',
  };
}

export default function CreatorShortlistPage() {
  const location = useLocation(), navigate = useNavigate();
  const session = useSyncExternalStore(subscribeAuthSession, authScope);
  const sessionId = getAuthSessionId();
  const canManage = !!getStoredUser()?.permissions?.includes('MANAGE_OWN_SHORTLIST');
  const canPrepareCrm = canManage && !!getStoredUser()?.permissions?.includes('MANAGE_OWN_RELATIONSHIP');
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
  const isDraft = campaign?.status === 'DRAFT';
  const canChangeStatus = !!getStoredUser()?.permissions?.includes('CHANGE_CAMPAIGN_STATUS');
  const compareSection = useRef<HTMLElement>(null);
  const [previewCreator, setPreviewCreator] = useState<Creator | null>(null);

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
  const [contactOpen, setContactOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null), [edit, setEdit] = useState<{ context: string; item: ShortlistRecord } | null>(null);
  const [editForm] = Form.useForm();
  const [outreach, setOutreach] = useState<{ context: string; result: OutreachResult } | null>(null);
  const readinessQuery = useCallback(() => shortlistService.readiness(campaignId, JSON.parse(selectedItemKey)), [campaignId, selectedItemKey, session]);
  const readiness = useAsyncResource(readinessQuery, canManage && contactOpen && selected.length > 0);
  const reload = useCallback(() => { void list.reload(); if (compareOpen && selected.length >= 2) void comparison.reload(); }, [list.reload, compareOpen, comparison.reload, selected.length]);
  useShortlistRealtime(campaignId || null, reload);

  const [quickOpen, setQuickOpen] = useState(false);
  const openRecommendations = (ids: string[] = selected.map(item => item.creatorId)) => {
    if (!campaign || busy) return;
    rememberCampaign(campaign.id);
    const sessionId = getAuthSessionId();
    navigate('/campaign-management?tab=recommendation', {
      state: {
        recommendationContext: { sessionId, campaignId: campaign.id, creatorIds: ids },
        recommendationRunIntent: { token: crypto.randomUUID(), sessionId, campaignId: campaign.id, creatorIds: ids },
      },
    });
  };

  const activateDiscovery = async () => {
    if (!campaign || busy || !canChangeStatus) return;
    setBusy('activate');
    try {
      await campaignService.updateStatus(campaign.id, 'READY_FOR_DISCOVERY', campaign.campaignRevision);
      message.success('Đã kích hoạt chiến dịch sẵn sàng khám phá & gợi ý!');
      await campaigns.reload();
    } catch (error) {
      message.error(getErrorMessage(error, 'Chưa thể chuyển chiến dịch sang sẵn sàng khám phá. Kiểm tra lại thông tin bản nháp.'));
    } finally {
      setBusy(null);
    }
  };

  const changeCampaign = (value: string) => {
    setParams({ page: 0, size: 20 }); setSelection({ context: '', items: [] }); setCompareOpen(false);
    setEdit(null); setContactOpen(false); setOutreach(null); setBusy(null);
    // A navigation pointer is allowed; no shortlist results or metrics are stored locally.
    rememberCampaign(value); navigate('/creators/shortlist', { replace: true, state: { shortlistContext: { sessionId, campaignId: value } } });
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

  const prepareCrm = async () => {
    const active = context; setBusy('outreach');
    try { const result = await shortlistService.prepareOutreach(campaignId, JSON.parse(selectedItemKey));
      if (live.current === active) { setOutreach({ context, result }); await list.reload(); } }
    catch (error) { if (live.current === active) message.error(errorText(error)); }
    finally { if (live.current === active) setBusy(null); }
  };

  const handleViewProfile = async (item: ShortlistRecord) => {
    const base = shortlistRecordToCreator(item);
    setPreviewCreator(base);
    try {
      const detail = await creatorService.getCreatorById(item.creatorId);
      if (detail) {
        setPreviewCreator(prev => {
          if (!prev || prev.id !== item.creatorId) return prev;
          const cat = [
            ...new Set(
              [detail.niche, detail.category, ...(prev.categories || [])].flatMap(
                v => v?.split(/[,;]/).map(t => t.trim()).filter(Boolean) ?? []
              )
            ),
          ];
          return {
            ...prev,
            name: detail.displayName || prev.name,
            username: detail.userName ? detail.userName.replace(/^@+/, '') : prev.username,
            avatar: detail.avatarUrl || prev.avatar,
            bio: detail.contentSummary || prev.bio,
            followers: formatFollowers(detail.followers ?? item.followers),
            followersCount: detail.followers ?? prev.followersCount,
            engagementRate: formatEngagement(detail.engagementRate ?? item.engagementRate),
            engagementValue: detail.engagementRate ?? prev.engagementValue,
            avgPrice: formatFee({
              actualFee: detail.actualFee,
              estimatedFeeMin: detail.estimatedFeeMin,
              estimatedFeeMax: detail.estimatedFeeMax,
            }),
            priceSource: detail.actualFee != null ? 'Báo giá đã ghi nhận' : detail.estimatedFeeMin != null || detail.estimatedFeeMax != null ? 'Khoảng giá ước tính' : undefined,
            location: detail.location || prev.location,
            isVerified: detail.verifiedByInfluencerMatch ?? prev.isVerified,
            categories: cat.length ? cat : prev.categories,
          };
        });
      }
    } catch {
      message.warning('Chưa tải được hồ sơ chi tiết. Đang hiển thị thông tin đã lưu trong danh sách.');
    }
  };

  if (!canManage) return <div className="sl-page"><Alert type="info" title="Bạn không có quyền quản lý danh sách đã chọn." /></div>;
  return (
    <ConfigProvider locale={viVN}>
      <div className="sl-page">
        <header className="sl-heading">
          <div>
            <h1>Danh sách đã chọn</h1>
            <p>Các kênh được lưu từ trang khám phá và đề xuất của chiến dịch.</p>
          </div>
        </header>
        {campaigns.status === 'loading' ? (
          <Skeleton active />
        ) : campaigns.status === 'error' ? (
          <Alert type="error" title="Không thể tải chiến dịch." action={<Button onClick={() => void campaigns.reload()}>Thử lại</Button>} />
        ) : campaigns.data?.length === 0 ? (
          <Empty description="Chưa có chiến dịch" />
        ) : (
          <>
            <section className="sl-panel sl-campaign-context">
              <label>
                Chiến dịch
                <Select
                  aria-label="Chiến dịch"
                  value={campaignId || undefined}
                  placeholder="Chọn chiến dịch"
                  options={campaigns.data?.map(item => ({ value: item.id, label: item.name }))}
                  onChange={changeCampaign}
                />
              </label>
            </section>
            <div className="sl-list-header">
              <div>
                <h2>Kênh đã lưu {list.status === 'success' && <span>{list.data?.totalElements.toLocaleString('vi-VN')}</span>}</h2>
                <p className="sl-muted">Chọn kênh để so sánh, chạy gợi ý hoặc chuẩn bị liên hệ.</p>
              </div>
              <div className="sl-list-tools">
                <Button disabled={!campaign} onClick={() => setQuickOpen(true)}>Chọn kênh</Button>
                <Select aria-label="Lọc ưu tiên" value={params.priority ?? 'ALL'} options={[{ value: 'ALL', label: 'Mọi ưu tiên' }, ...priorities]} onChange={value => setParams(previous => ({ ...previous, page: 0, priority: value === 'ALL' ? undefined : value as ShortlistPriority }))} />
                <Select aria-label="Lọc trạng thái" value={params.status ?? 'ALL'} options={[{ value: 'ALL', label: 'Kênh đang lưu' }, ...Object.entries(statuses).map(([value, label]) => ({ value, label }))]} onChange={value => setParams(previous => ({ ...previous, page: 0, status: value === 'ALL' ? undefined : value as ShortlistStatus }))} />
              </div>
            </div>
            {!campaignId ? (
              <Empty description="Chọn chiến dịch để xem danh sách" />
            ) : list.status === 'loading' ? (
              <Skeleton active />
            ) : list.status === 'error' ? (
              <Alert type="error" title="Không thể tải danh sách đã chọn." action={<Button onClick={() => void list.reload()}>Thử lại</Button>} />
            ) : !list.data?.items.length ? (
              <Empty description="Chưa có kênh theo bộ lọc này">
                <Button onClick={() => navigate('/creators')}>Khám phá nhà sáng tạo</Button>
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
            <footer className="sl-action-bar" aria-label="Thao tác danh sách đã chọn">
              <div className="sl-action-summary">
                <strong>{selected.length ? `Đã chọn ${selected.length} kênh` : 'Chưa đánh dấu kênh'}</strong>
                <span>
                  {selected.length ? `Gợi ý sẽ dùng ${selected.length} kênh đã chọn.` : 'Không chọn riêng: gợi ý dùng toàn bộ danh sách.'}
                  {isDraft && ' · Chiến dịch đang ở Bản nháp (DRAFT).'}
                </span>
              </div>
              <div className="sl-action-buttons">
                {isDraft && (
                  <Button
                    type="dashed"
                    loading={busy === 'activate'}
                    disabled={!!busy || !canChangeStatus}
                    onClick={activateDiscovery}
                  >
                    Kích hoạt sẵn sàng khám phá
                  </Button>
                )}
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
                    <Button disabled={!!busy} onClick={() => { setOutreach(null); setContactOpen(true); }}>
                      Chuẩn bị liên hệ
                    </Button>
                    <Dropdown
                      menu={{
                        items: [
                          { key: 'ready', label: 'Đánh dấu sẵn sàng liên hệ', disabled: !!busy },
                          { key: 'clear', label: 'Bỏ chọn', disabled: !!busy },
                        ],
                        onClick: ({ key }) => {
                          if (key === 'clear') {
                            setSelection({ context, items: [] });
                            setCompareOpen(false);
                          } else {
                            void mutate('status', () => shortlistService.batchStatus(campaignId, JSON.parse(selectedItemKey), 'READY_TO_CONTACT'), 'Đã cập nhật trạng thái sẵn sàng liên hệ.');
                          }
                        },
                      }}
                    >
                      <Button icon={<MoreOutlined />} aria-label="Thao tác khác" />
                    </Dropdown>
                  </>
                )}
                <Button
                  type="primary"
                  disabled={!campaign || !!busy}
                  onClick={() => openRecommendations()}
                >
                  {selected.length > 0 ? `Chạy gợi ý (${selected.length} kênh đã chọn)` : 'Chạy gợi ý toàn bộ danh sách'} <ArrowRightOutlined />
                </Button>
              </div>
            </footer>
          </>
        )}
        {quickOpen && (
          <ShortlistQuickPicker
            key={context}
            open={quickOpen}
            campaignId={campaignId}
            selectedIds={selected.map(item => item.creatorId)}
            confirmLabel="Chạy gợi ý"
            onClose={() => setQuickOpen(false)}
            onApply={ids => {
              setQuickOpen(false);
              openRecommendations(ids);
            }}
          />
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
        <Modal
          title="Kiểm tra khả năng liên hệ"
          open={contactOpen && selected.length > 0}
          onCancel={() => { if (!busy) setContactOpen(false); }}
          footer={null}
          width={680}
          destroyOnHidden
        >
          {readiness.status === 'loading' ? (
            <Skeleton active />
          ) : readiness.status === 'error' ? (
            <Alert type="error" title="Không thể kiểm tra liên hệ." action={<Button onClick={() => void readiness.reload()}>Thử lại</Button>} />
          ) : (
            <>
              <ul className="sl-batch-results">
                {readiness.data?.items.map(item => (
                  <li key={item.shortlistItemId}>
                    <strong>{item.creatorName || 'Kênh chưa có tên'}</strong>
                    <span>{shortlistLabel(item.readinessStatus)} · {shortlistLabel(item.contactChannel)}</span>
                    <span>{readinessReason(item.readinessStatus)}</span>
                  </li>
                ))}
              </ul>
              <Alert type="info" title="Chuẩn bị hồ sơ tiếp cận" description="Tạo hồ sơ và thỏa thuận nháp, gộp các kênh của cùng nhà sáng tạo nếu đã được xác định. Thao tác này chưa gửi thư mời và chưa xác nhận hợp tác." />
              {!canPrepareCrm && <p>Bạn cần quyền quản lý quan hệ hợp tác để tiếp tục.</p>}
              <Popconfirm title="Tạo hồ sơ tiếp cận cho các kênh đã chọn?" onConfirm={prepareCrm}>
                <Button type="primary" disabled={!canPrepareCrm || !!busy} loading={busy === 'outreach'}>Tạo hồ sơ tiếp cận</Button>
              </Popconfirm>
            </>
          )}
          {outreach?.context === context && (
            <>
              <h3>Kết quả xử lý</h3>
              <ul className="sl-batch-results">
                {outreach.result.items.map(item => (
                  <li key={item.shortlistItemId}>
                    <strong>{item.creatorName || 'Kênh chưa có tên'}</strong>
                    <span>{outreachLabel(item.contactStatus)}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={() => navigate(campaignPath('/crm', campaignId))}>Tiếp tục thỏa thuận</Button>
            </>
          )}
        </Modal>

        {/* Drawer xem hồ sơ chi tiết KOC */}
        <CreatorDetailDrawer
          visible={!!previewCreator}
          creator={previewCreator}
          matchedCampaign={null}
          showMatch={false}
          actionLabel={selected.some(item => item.creatorId === previewCreator?.id) ? 'Bỏ chọn kênh' : 'Chọn để chạy gợi ý'}
          actionDisabled={!!busy || !list.data?.items.some(item => item.creatorId === previewCreator?.id && item.status !== 'REMOVED')}
          onClose={() => setPreviewCreator(null)}
          onOpenShortlist={(c) => {
            const rec = list.data?.items.find(r => r.creatorId === c.id);
            if (rec) {
              const isSel = selected.some(r => r.creatorId === c.id);
              toggle(rec, !isSel);

            }
          }}
        />
      </div>
    </ConfigProvider>
  );
}
