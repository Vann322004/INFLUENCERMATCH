import { Alert, Button, Card, DatePicker, Empty, Input, Select, Space, Table } from 'antd';
import { useCallback, useEffect, useRef } from 'react';
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { authService } from '../../services/api/authService';
import { campaignHistoryService } from '../../services/api/campaignHistoryService';
import { historyPlatforms, type HistoryFilters } from '../../types/api/campaignHistory.types';
import CampaignHistoryDetail from './CampaignHistoryDetail';
import { campaignStates, canReadHistory, historyDate, HistoryReadState, readHistoryUser, StatusTag, useHistoryRead } from './historyView';
import './CampaignHistoryPage.css';

function isoDate(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && dayjs(value).format('YYYY-MM-DD') === value ? value : undefined;
}

function readFilters(params: URLSearchParams): HistoryFilters {
  const status = params.get('status') as HistoryFilters['status'];
  const platform = historyPlatforms.find(item => item === params.get('platform'));
  const page = Number(params.get('page') ?? 0);
  return {
    q: params.get('q')?.trim() || undefined,
    status: status && Object.prototype.hasOwnProperty.call(campaignStates, status) ? status : undefined,
    platform,
    createdFrom: isoDate(params.get('createdFrom')),
    createdTo: isoDate(params.get('createdTo')),
    page: Number.isSafeInteger(page) && page >= 0 && page <= 2147483647 ? page : 0,
    size: 20,
  };
}

function CampaignHistoryList() {
  const { search } = useLocation();
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const invalidRange = !!filters.createdFrom && !!filters.createdTo && filters.createdFrom > filters.createdTo;
  const load = useCallback((signal: AbortSignal) => campaignHistoryService.list(
    readFilters(new URLSearchParams(search)), signal,
  ), [search]);

  function update(changes: Record<string, string | undefined>, page?: number) {
    const next = new URLSearchParams(params);
    next.delete('page');
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (page) next.set('page', String(page));
    setParams(next);
  }

  return <>
    <div className="history-heading">
      <div><h1>Lịch sử chiến dịch</h1><p>Xem brief, quá trình hợp tác và kết quả đã ghi nhận.</p></div>
      <Link to="/performance">Về Báo cáo &amp; Hiệu suất</Link>
    </div>
    <Card>
      <div className="history-filters">
        <Input.Search key={filters.q ?? ''} aria-label="Tìm theo tên chiến dịch" placeholder="Tìm theo tên chiến dịch" maxLength={200}
          defaultValue={filters.q} allowClear onSearch={value => update({ q: value.trim() })} />
        <Select aria-label="Trạng thái chiến dịch" placeholder="Tất cả trạng thái" allowClear value={filters.status}
          options={Object.entries(campaignStates).map(([value, [label]]) => ({ value, label }))}
          onChange={value => update({ status: value })} />
        <Select aria-label="Nền tảng" placeholder="Tất cả nền tảng" allowClear value={filters.platform}
          options={historyPlatforms.map(value => ({ label: value, value }))}
          onChange={value => update({ platform: value })} />
        <DatePicker.RangePicker aria-label="Khoảng ngày tạo" format="DD/MM/YYYY" placeholder={['Ngày tạo từ', 'Đến ngày']}
          allowEmpty={[true, true]} value={[filters.createdFrom ? dayjs(filters.createdFrom) : null, filters.createdTo ? dayjs(filters.createdTo) : null]}
          onChange={dates => update({ createdFrom: dates?.[0]?.format('YYYY-MM-DD'), createdTo: dates?.[1]?.format('YYYY-MM-DD') })} />
      </div>
      {invalidRange ? <Alert showIcon type="warning" title="Ngày bắt đầu phải trước hoặc bằng ngày kết thúc."
        action={<Button size="small" onClick={() => update({ createdFrom: undefined, createdTo: undefined })}>Xóa khoảng ngày</Button>} />
        : <HistoryTable load={load} search={search} filtered={!!(filters.q || filters.status || filters.platform || filters.createdFrom || filters.createdTo)}
          changePage={page => update({}, page)} />}
    </Card>
  </>;
}

function HistoryTable({ load, search, filtered, changePage }: {
  load: (signal: AbortSignal) => ReturnType<typeof campaignHistoryService.list>;
  search: string; filtered: boolean; changePage: (page: number) => void;
}) {
  const { result, retry } = useHistoryRead(load);
  if (result.status !== 'ready') return <HistoryReadState result={result} retry={retry} />;
  const { items, page, size, totalElements } = result.data;
  return <Table rowKey="id" dataSource={items} scroll={{ x: 'max-content' }}
    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={filtered
      ? 'Không có chiến dịch phù hợp với bộ lọc.' : 'Bạn chưa có chiến dịch nào.'} /> }}
    pagination={{ current: page + 1, pageSize: size, total: totalElements, showSizeChanger: false, onChange: value => changePage(value - 1) }}
    columns={[
      { title: 'Chiến dịch', dataIndex: 'name', render: (name: string) => <strong>{name}</strong> },
      { title: 'Trạng thái', render: (_, row) => <StatusTag state={row.status} labels={campaignStates} /> },
      { title: 'Nền tảng', render: (_, row) => row.platforms?.join(', ') || '—' },
      { title: 'Ngày tạo', render: (_, row) => historyDate(row.createdAt) },
      { title: 'Hợp tác hoàn tất', render: (_, row) => `${row.completedCount} / ${row.collaborationCount}` },
      { title: 'Thao tác', render: (_, row) => <Link to={{ pathname: `/campaign-history/${row.id}`, search }}
        aria-label={`Xem lịch sử ${row.name}`}>Xem lịch sử</Link> },
    ]} />;
}

export default function CampaignHistoryPage() {
  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />;
  return <HistoryAccess />;
}

function HistoryAccess() {
  const { campaignId } = useParams();
  const page = useRef<HTMLElement>(null);
  const { result, retry } = useHistoryRead(readHistoryUser);

  useEffect(() => {
    page.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [campaignId]);

  return <main className="history-page" ref={page}>
    {result.status !== 'ready' ? <HistoryReadState result={result} retry={retry} />
      : !canReadHistory(result.data) ? <Space orientation="vertical">
        <Alert showIcon type="warning" title="Bạn không có quyền xem lịch sử chiến dịch." />
        <Link to="/performance">Về Báo cáo &amp; Hiệu suất</Link>
      </Space>
        : campaignId ? <CampaignHistoryDetail key={campaignId} campaignId={campaignId}
          canDuplicate={result.data.permissions?.includes('CREATE_CAMPAIGN') === true} />
          : <CampaignHistoryList />}
  </main>;
}
