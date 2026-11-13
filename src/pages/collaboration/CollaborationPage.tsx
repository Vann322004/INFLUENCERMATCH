import { Alert, Avatar, Button, Card, Empty, Input, Modal, Pagination, Progress, Select, Space, Spin, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../../services/api/authService';
import { collaborationService } from '../../services/api/collaborationService';
import { getErrorMessage } from '../../services/apiClient';
import type { CampaignResponse } from '../../types/api/campaign.types';
import type { CollaborationStatus, CollaborationSummary, ExecutionSnapshot, PendingAssignment } from '../../types/api/collaboration.types';
import { RetryAlert, StatusTag, statusOptions } from './CollaborationExecutionPanel';
import { useCollaborationPermissions } from './useCollaborationPermissions';
import { channelLabel, formatDate, formatMoney } from './ExecutionForms';
import { OperationsTable } from './OperationsTables';
import './CollaborationPage.css';

const pageSize = 20;

const sortOptions = [
  { value: 'newest', label: 'Cập nhật mới nhất' },
  { value: 'oldest', label: 'Cập nhật cũ nhất' },
  { value: 'name-asc', label: 'Tên chiến dịch A–Z' },
  { value: 'name-desc', label: 'Tên chiến dịch Z–A' },
  { value: 'status', label: 'Trạng thái hợp tác' },
] as const;
type SortOrder = typeof sortOptions[number]['value'];
type BrandCollaborationRow = CollaborationSummary & { campaignName: string };

const statusOrder: Record<CollaborationStatus, number> = {
  IN_PROGRESS: 0, AWAITING_REVIEW: 1, PLANNED: 2, COMPLETED: 3, CANCELLED: 4,
};
const nameOrder = new Intl.Collator('vi', { sensitivity: 'base', numeric: true });

function searchableName(value: string) {
  return value.toLocaleLowerCase('vi').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').trim();
}

function compareRows(left: BrandCollaborationRow, right: BrandCollaborationRow, sort: SortOrder) {
  if (sort === 'status') {
    const rank = statusOrder[left.status] - statusOrder[right.status];
    if (rank) return rank;
  }
  const name = nameOrder.compare(left.campaignName, right.campaignName);
  if (sort === 'name-asc' || sort === 'name-desc') {
    return (sort === 'name-desc' ? -name : name) || left.id.localeCompare(right.id);
  }
  const leftDate = Date.parse(left.updatedAt ?? '');
  const rightDate = Date.parse(right.updatedAt ?? '');
  if (Number.isFinite(leftDate) !== Number.isFinite(rightDate)) return Number.isFinite(leftDate) ? -1 : 1;
  const dateOrder = leftDate - rightDate;
  return (sort === 'oldest' ? dateOrder : -dateOrder) || name || left.id.localeCompare(right.id);
}

function CreatorName({ row }: { row: CollaborationSummary }) {
  const name = row.creatorName ?? row.channelName ?? 'Creator';
  return <Space>
    <Avatar src={row.avatarUrl}>{name.slice(0, 1)}</Avatar>
    <div><strong>{name}</strong>
      <div className="collab-muted">{row.channels?.map(channelLabel).join(', ') || row.platform || '—'}</div>
    </div>
  </Space>;
}

function ProgressTable({ rows, snapshots, returnTo, emptyLabel }: {
  rows: BrandCollaborationRow[];
  snapshots: Record<string, ExecutionSnapshot>;
  returnTo: string;
  emptyLabel: string;
}) {
  if (!rows.length) return <Card><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyLabel} /></Card>;
  return <OperationsTable label="Bảng tiến độ hợp tác"
    headers={['Chiến dịch', 'Creator đối tác', 'Ấn phẩm cam kết', 'Trạng thái hợp tác', 'Tiến trình', 'Hạn nộp', 'Phí đã chốt', 'Hành động']}>
    {rows.map(row => {
      const units = snapshots[row.id]?.deliverables;
      const approved = units?.filter(unit => unit.status === 'APPROVED').length;
      const deadline = units?.map(unit => unit.dueAt).filter(Boolean).sort()[0];
      return <tr key={row.id}>
        <td><strong>{row.campaignName}</strong></td>
        <td><CreatorName row={row} /></td>
        <td>{units?.length ? [...new Set(units.map(unit => unit.contentType))].join(', ') : 'Chưa có dữ liệu'}</td>
        <td><StatusTag status={row.status} /></td>
        <td>{units?.length ? <Space size={6}>
          <Progress type="line" percent={Math.round((approved ?? 0) / units.length * 100)}
            size={[64, 5]} showInfo={false} aria-hidden />
          <span>{approved}/{units.length} ấn phẩm đã duyệt</span>
        </Space> : 'Chưa có dữ liệu'}</td>
        <td>{deadline ? formatDate(deadline) : 'Chưa có dữ liệu'}</td>
        <td><strong>{formatMoney(row.agreedFee, row.currency)}</strong></td>
        <td><Link className="collab-row-link" to={'/collaboration/' + row.id} state={{ returnTo }}>Xem hợp tác</Link></td>
      </tr>;
    })}
  </OperationsTable>;
}

function BrandCollaborations({ campaigns }: { campaigns: CampaignResponse[] }) {
  const [params, setParams] = useSearchParams();
  const selectedCampaign = params.get('campaign');
  const campaignId = campaigns.find(campaign => campaign.id === selectedCampaign)?.id;
  const status = statusOptions.find(option => option.value === params.get('status'))?.value;
  const query = params.get('q') ?? params.get('campaignSearch') ?? '';
  const sort = sortOptions.find(option => option.value === params.get('campaignSort'))?.value ?? 'newest';
  const requestedPage = Number(params.get('page'));
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<{ rows: BrandCollaborationRow[]; failed: number }>();
  const [snapshots, setSnapshots] = useState<Record<string, ExecutionSnapshot>>({});
  const [summaryFailures, setSummaryFailures] = useState(false);
  const [loading, setLoading] = useState(true);
  const retry = () => setRefresh(value => value + 1);

  function updateParams(changes: Record<string, string | undefined>) {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if ('q' in changes) next.delete('campaignSearch');
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      return next;
    }, { replace: true });
  }

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const scope = campaignId ? campaigns.filter(campaign => campaign.id === campaignId) : campaigns;
    setData(undefined);
    setLoading(true);
    async function load() {
      const rows: BrandCollaborationRow[] = [];
      let failed = 0;
      // Bound requests while using the existing campaign-scoped API.
      for (let index = 0; index < scope.length && !signal.aborted; index += 5) {
        const results = await Promise.allSettled(scope.slice(index, index + 5).map(async campaign =>
          (await collaborationService.listBrand(campaign.id, signal)).map(row => ({ ...row, campaignName: campaign.name })),
        ));
        for (const result of results) {
          if (result.status === 'fulfilled') rows.push(...result.value);
          else failed++;
        }
      }
      if (!signal.aborted) {
        setData({ rows, failed });
        setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [campaigns, campaignId, refresh]);

  const rows = useMemo(() => {
    const filter = searchableName(query);
    return (data?.rows ?? []).filter(row =>
      (!status || row.status === status) && (!filter ||
        [row.campaignName, row.creatorName, row.channelName, ...(row.channels?.map(channelLabel) ?? [])]
          .some(value => value && searchableName(value).includes(filter))),
    ).sort((left, right) => compareRows(left, right, sort));
  }, [data, query, status, sort]);
  const page = Math.min(Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    Math.max(1, Math.ceil(rows.length / pageSize)));
  const visible = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page]);
  const returnParams = new URLSearchParams(params);
  if (!campaignId) returnParams.delete('campaign');
  if (page > 1) returnParams.set('page', String(page));
  else returnParams.delete('page');
  const returnTo = '/collaboration' + (returnParams.size ? '?' + returnParams : '');

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setSnapshots({});
    setSummaryFailures(false);
    async function loadProgress() {
      for (let index = 0; index < visible.length && !signal.aborted; index += 5) {
        const results = await Promise.allSettled(visible.slice(index, index + 5)
          .map(row => collaborationService.execution(row.id, signal)));
        if (signal.aborted) return;
        const available: Record<string, ExecutionSnapshot> = {};
        for (const result of results) {
          if (result.status === 'fulfilled') available[result.value.id] = result.value;
          else setSummaryFailures(true);
        }
        setSnapshots(previous => ({ ...previous, ...available }));
      }
    }
    void loadProgress();
    return () => controller.abort();
  }, [visible]);

  return <section className="collab-list-section" aria-label="Danh sách tiến độ hợp tác">
    {selectedCampaign && !campaignId &&
      <Alert showIcon type="warning" title="Chiến dịch không tồn tại hoặc bạn không có quyền truy cập." />}
    <div className="collab-list-controls">
      <Input allowClear prefix={<SearchOutlined />} className="collab-list-search"
        aria-label="Tìm chiến dịch hoặc Creator" placeholder="Tìm chiến dịch hoặc Creator" value={query}
        onChange={event => updateParams({ q: event.target.value, page: undefined })} />
      <Select allowClear showSearch optionFilterProp="label" value={campaignId} placeholder="Tất cả chiến dịch"
        aria-label="Lọc theo chiến dịch" className="collab-campaign-filter"
        options={campaigns.map(campaign => ({ value: campaign.id, label: campaign.name }))}
        onChange={value => updateParams({ campaign: value, page: undefined })} />
      <Select allowClear value={status} options={statusOptions} placeholder="Tất cả trạng thái"
        aria-label="Trạng thái hợp tác" className="collab-status-filter"
        onChange={value => updateParams({ status: value, page: undefined })} />
      <Select aria-label="Sắp xếp hợp tác" value={sort} options={[...sortOptions]} className="collab-sort-filter"
        onChange={value => updateParams({ campaignSort: value === 'newest' ? undefined : value, page: undefined })} />
    </div>
    {loading ? <Spin /> : <>
      {!!data?.failed && <RetryAlert
        error={data.rows.length ? 'Chưa tải được hợp tác của một số chiến dịch.' : 'Không tải được danh sách hợp tác.'}
        retry={retry} />}
      {summaryFailures && <Alert type="warning" showIcon title="Một số tiến trình chưa tải được."
        action={<Button size="small" onClick={retry}>Thử lại</Button>} />}
      {(!data?.failed || rows.length > 0) && <ProgressTable rows={visible} snapshots={snapshots} returnTo={returnTo}
        emptyLabel={query.trim() || status ? 'Không tìm thấy hợp tác phù hợp' : 'Chưa có hợp tác'} />}
      {rows.length > pageSize && <Pagination size="small" current={page} pageSize={pageSize}
        total={rows.length} showSizeChanger={false}
        onChange={next => updateParams({ page: next > 1 ? String(next) : undefined })} />}
    </>}
  </section>;
}

export default function CollaborationPage() {
  const permissions = useCollaborationPermissions();
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>();
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const brand = authService.getCurrentUser()?.role === 'BRAND';
  const canView = brand && permissions.has('VIEW_OWN_CAMPAIGN');
  const canManage = brand && permissions.has('MANAGE_OWN_COLLABORATION');

  useEffect(() => {
    if (!canView || !canManage) return;
    let active = true;
    setError('');
    setCampaigns(undefined);
    collaborationService.listCampaigns()
      .then(list => { if (active) setCampaigns(list); })
      .catch(error => { if (active) setError(getErrorMessage(error, 'Không tải được danh sách chiến dịch.')); });
    return () => { active = false; };
  }, [canView, canManage, refresh]);

  return <div className="collaboration-page-container">
    <header className="collab-header-row">
      <div>
        <h1 className="collab-main-title">Quản lý Vận hành & Hợp tác Creator</h1>
        <p className="collab-description">Theo dõi tiến độ, duyệt ấn phẩm và nghiệm thu kết quả theo từng hợp tác.</p>
      </div>
    </header>
    {!canView ? <Alert type="warning" showIcon title="Bạn chưa có quyền xem chiến dịch." />
      : !canManage ? <Alert type="warning" showIcon title="Bạn chưa có quyền quản lý hợp tác." />
        : error ? <RetryAlert error={error} retry={() => setRefresh(value => value + 1)} />
          : campaigns ? <BrandCollaborations campaigns={campaigns} /> : <Spin />}
  </div>;
}

export function CreatorCollaborations() {
  const permissions = useCollaborationPermissions();
  const canView = authService.getCurrentUser()?.role === 'CREATOR' && permissions.has('RESPOND_OWN_COOPERATION');
  const navigate = useNavigate();
  const [rows, setRows] = useState<CollaborationSummary[]>();
  const [assignments, setAssignments] = useState<PendingAssignment[]>([]);
  const [selected, setSelected] = useState<PendingAssignment>();
  const [assignmentError, setAssignmentError] = useState('');
  const [mustReload, setMustReload] = useState(false);
  const [saving, setSaving] = useState(false);
  const attempt = useRef<string | undefined>(undefined);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const retry = () => setRefresh(value => value + 1);

  useEffect(() => {
    if (!canView) return;
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([collaborationService.listCreator(), collaborationService.pendingAssignments()])
      .then(([result, waiting]) => { if (active) { setRows(result); setAssignments(waiting); } })
      .catch(error => { if (active) setError(getErrorMessage(error, 'Không tải được danh sách hợp tác.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [canView, refresh]);

  async function accept() {
    if (!selected || mustReload || pending.current || !canView) return;
    pending.current = true;
    setSaving(true);
    setAssignmentError('');
    attempt.current ??= crypto.randomUUID();
    try {
      const result = await collaborationService.acceptAssignment(selected.collaborationId, {
        expectedRevision: selected.dealRevision,
        proposalRevision: selected.proposalRevision,
      }, attempt.current);
      navigate('/creator/bookings/' + result.collaborationId);
    } catch (cause) {
      setAssignmentError(getErrorMessage(cause, 'Chưa thể xác nhận điều khoản.'));
      setMustReload(axios.isAxiosError(cause) && [403, 404, 409].includes(cause.response?.status ?? 0));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  const columns: TableColumnsType<CollaborationSummary> = [
    { title: 'Chiến dịch', key: 'campaign', render: (_, row) => <><strong>{row.campaignName || 'Chiến dịch'}</strong><div>{row.brandName}</div></> },
    { title: 'Kênh', key: 'channels', render: (_, row) => row.channels?.map(channelLabel).join(', ') || row.platform || '—' },
    { title: 'Phí đã chốt', key: 'fee', render: (_, row) => formatMoney(row.agreedFee, row.currency) },
    { title: 'Trạng thái', key: 'status', render: (_, row) => <StatusTag status={row.status} /> },
    { title: 'Thao tác', key: 'actions', render: (_, row) => <Link className="collab-row-link" to={'/creator/bookings/' + row.id}>Xem hợp tác</Link> },
  ];

  if (!canView) return <Alert type="warning" showIcon title="Bạn chưa có quyền xem hợp tác." />;

  return <div className="collaboration-page-container">
    {!error && assignments.length > 0 && <Card title="Hợp tác chờ bạn xác nhận">
      <div className="execution-stack">
        {assignments.map(assignment => <div className="collab-assignment-row" key={assignment.collaborationId}>
          <div><strong>{assignment.campaignName}</strong><div>{assignment.brandName}</div></div>
          <Button onClick={() => {
            attempt.current = undefined;
            setAssignmentError('');
            setMustReload(false);
            setSelected(assignment);
          }}>Xem điều khoản</Button>
        </div>)}
      </div>
    </Card>}
    <Card title="Hợp tác với nhãn hàng">
      {error ? <RetryAlert error={error} retry={retry} /> : <Spin spinning={loading}>
        {rows && <Table<CollaborationSummary> rowKey="id" columns={columns} dataSource={rows} scroll={{ x: 'max-content' }} pagination={false}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hợp tác" /> }} />}
      </Spin>}
    </Card>
    {selected && <Modal open title="Xác nhận điều khoản hợp tác" okText="Xác nhận điều khoản" cancelText="Đóng"
      confirmLoading={saving} onOk={() => void accept()} okButtonProps={{ disabled: mustReload }}
      onCancel={() => { if (!pending.current) setSelected(undefined); }}>
      <div className="execution-stack">
        {assignmentError && <Alert type="error" showIcon title={assignmentError} action={mustReload
          ? <Button onClick={() => { setSelected(undefined); retry(); }}>Tải bản mới</Button> : undefined} />}
        <div><strong>{selected.campaignName}</strong><div>{selected.brandName}</div></div>
        <div>{selected.channels.map(channelLabel).join(', ')}</div>
        <div>Phí đã chốt · {formatMoney(selected.fee, selected.currency)}</div>
        <p className="collab-agreement-terms">{selected.terms}</p>
        <ul>{selected.deliverables.map((unit, index) => {
          const channel = selected.channels.find(item => item.creatorId === unit.creatorId);
          return <li key={index}><strong>{unit.quantity} × {unit.contentType}</strong>
            {channel && <> · {channelLabel(channel)}</>} · Hạn {formatDate(unit.dueAt)} · {unit.maxRevisionRounds} vòng sửa
            <ul>{unit.acceptanceChecklist.map(check => <li key={check}>{check}</li>)}</ul>
          </li>;
        })}</ul>
      </div>
    </Modal>}
  </div>;
}
