import { Alert, Button, Collapse, Form, Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { collaborationService } from '../../services/api/collaborationService';
import { getErrorMessage } from '../../services/apiClient';
import type { PostMetricCollection } from '../../types/api/collaboration.types';
import { formatDate, formatNumber, metricLabels } from './ExecutionForms';

export function OutcomeCollectionPicker({ id, unitId, publicationId, revision }: {
  id: string; unitId: string; publicationId: string; revision?: number;
}) {
  const form = Form.useFormInstance();
  const [rows, setRows] = useState<PostMetricCollection[]>([]);
  const [crawling, setCrawling] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const requestKey = useRef<string | null>(null);

  const applyRow = (row: PostMetricCollection) => {
    form.setFieldValue('collectionId', row.id);
    const metricKeys = ['views', 'likes', 'comments', 'shares', 'clicks'] as const;
    for (const metric of metricKeys) {
      form.setFieldValue(metric, row.metrics?.[metric] == null ? undefined : String(row.metrics[metric]));
      form.setFieldValue(['unavailable', metric], row.metrics?.[metric] == null);
    }
    form.setFields(metricKeys.map(metric => ({ name: metric, errors: [] })));
    if (!form.getFieldValue('period') && (row.postedAt || row.collectedAt)) {
      const end = dayjs(row.collectedAt || row.postedAt);
      const start = dayjs(row.postedAt || row.collectedAt);
      if (start.isValid() && end.isValid()) {
        form.setFieldValue('period', [start.isAfter(end) ? end : start, end]);
      }
    }
  };

  useEffect(() => {
    let active = true;
    collaborationService.postMetricHistory(id, unitId).then(value => {
      if (!active) return;
      const list = (Array.isArray(value) ? value : [value]).filter(
        row => row && row.status === 'SUCCEEDED' && row.publicationId === publicationId,
      );
      setRows(list);
      if (list[0] && !form.getFieldValue('collectionId') && !form.getFieldValue('views')) {
        applyRow(list[0]);
      }
    }).catch(reason => { if (active) setError(getErrorMessage(reason, 'Không tải được dữ liệu thu thập.')); });
    return () => { active = false; };
  }, [id, unitId, publicationId]);

  async function crawlNow() {
    if (pending.current || revision == null) return;
    pending.current = true;
    setCrawling(true);
    setError('');
    requestKey.current ??= crypto.randomUUID();
    try {
      const raw = await collaborationService.collectPostMetrics(id, unitId, revision, requestKey.current);
      requestKey.current = null;
      const updated = Array.isArray(raw) ? raw : [raw];
      const succeeded = updated.filter(row => row && row.status === 'SUCCEEDED' && row.publicationId === publicationId);
      setRows(succeeded);
      if (succeeded[0]) {
        applyRow(succeeded[0]);
      } else {
        const failed = updated.find(row => row?.publicationId === publicationId && row.status === 'FAILED');
        setError(failed ? 'Chưa lấy được chỉ số công khai tự động từ bài đăng này. Bạn vẫn có thể nhập thủ công bên dưới.' : 'Đang xử lý thu thập dữ liệu, vui lòng thử lại sau ít giây.');
      }
    } catch (reason) {
      setError(getErrorMessage(reason, 'Không lấy được chỉ số tự động. Bạn có thể nhập thủ công bên dưới.'));
    } finally {
      pending.current = false;
      setCrawling(false);
    }
  }

  return <>
    {error && <Alert type="warning" showIcon style={{ marginBottom: 8 }} title={error} />}
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <Form.Item name="collectionId" label="Nguồn số liệu" style={{ flex: '1 1 260px', marginBottom: 4 }}>
        <Select allowClear placeholder="Nhập số liệu thủ công" options={rows.map(row => ({ value: row.id,
          label: `Dữ liệu công khai · ${formatDate(row.collectedAt)}` }))} onChange={value => {
          const row = rows.find(item => item.id === value);
          if (row) applyRow(row);
        }} />
      </Form.Item>
      {revision != null && (
        <Button loading={crawling} onClick={() => void crawlNow()} style={{ marginBottom: 4 }}>
          Lấy số liệu tự động
        </Button>
      )}
    </div>
  </>;
}

export function PostMetricsPanel({ id, unitId, publicationId, revision, canCollect }: {
  id: string; unitId: string; publicationId: string; revision: number; canCollect: boolean;
}) {
  const [rows, setRows] = useState<PostMetricCollection[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const requestKey = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    collaborationService.postMetricHistory(id, unitId).then(value => {
      if (active) setRows(value);
    }).catch(reason => { if (active) setError(getErrorMessage(reason, 'Không tải được lịch sử chỉ số.')); });
    return () => { active = false; };
  }, [id, unitId]);
  async function collect() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    requestKey.current ??= crypto.randomUUID();
    try {
      setRows(await collaborationService.collectPostMetrics(id, unitId, revision, requestKey.current));
      requestKey.current = null;
    } catch (reason) {
      setError(getErrorMessage(reason, 'Không lấy được chỉ số. Bạn có thể thử lại.'));
    } finally { pending.current = false; setBusy(false); }
  }
  const current = rows.filter(row => row.publicationId === publicationId);
  const latest = current[0];
  return <Collapse size="small" items={[{ key: 'metrics', label: 'Chỉ số bài đăng công khai', children: <Space orientation="vertical" style={{ width: '100%' }}>
    <Typography.Text type="secondary">Số liệu tại thời điểm thu thập, chưa phải kết quả đã nghiệm thu.</Typography.Text>
    {canCollect && <Button loading={busy} onClick={() => void collect()}>Lấy chỉ số bài đăng</Button>}
    {error && <Alert type="error" showIcon title={error} />}
    {latest?.status === 'PENDING' && <Alert type="info" title="Đang thu thập chỉ số."
      action={<Button onClick={() => void collaborationService.postMetricHistory(id, unitId)
        .then(setRows).catch(reason => setError(getErrorMessage(reason, 'Không tải được kết quả.')))}>Xem kết quả</Button>} />}
    {latest?.status === 'FAILED' && <Alert type="warning" showIcon
      title={latest.errorCode === 'UNSUPPORTED_CRAWLER_RESPONSE'
        ? 'Dịch vụ chưa trả dữ liệu đúng cấu trúc được hỗ trợ.'
        : latest.errorCode === 'NO_METRICS_AVAILABLE'
          ? 'Nguồn không cung cấp chỉ số công khai nào.'
          : 'Dịch vụ thu thập hiện không khả dụng.'}
      description={[
        latest.upstreamErrorCode || latest.errorCode,
        latest.retryable === false ? 'Không nên thử lại ngay.'
          : latest.retryAfterSeconds != null ? `Thử lại sau ${latest.retryAfterSeconds} giây.`
          : latest.retryable ? 'Có thể thử lại.' : '',
      ].filter(Boolean).join(' · ') || undefined} />}
    {!current.length && !error && <Typography.Text type="secondary">Chưa có lần thu thập.</Typography.Text>}
    {current.filter(row => row.status === 'SUCCEEDED').map(row => <div key={row.id} className="post-metric-observation">
      <Typography.Text type="secondary">Nhận dữ liệu {formatDate(row.collectedAt)} · Dữ liệu công khai</Typography.Text>
      {row.upstreamTrackedAt && <div><Typography.Text type="secondary">Thời điểm nguồn AI: {formatDate(row.upstreamTrackedAt)}</Typography.Text></div>}
      {row.postedAt && <div><Typography.Text type="secondary">Thời điểm bài đăng: {formatDate(row.postedAt)}</Typography.Text></div>}
      {row.collection?.cacheHit != null && <div>
        <Typography.Text type="secondary">
          {row.collection.cacheHit ? 'Nguồn AI đang dùng dữ liệu cache' : 'Nguồn AI lấy dữ liệu mới'}
          {row.collection.source ? ` · ${row.collection.source}` : ''}
          {row.collection.scope ? ` · ${row.collection.scope}` : ''}
        </Typography.Text>
      </div>}
      {row.caption && <Typography.Paragraph ellipsis={{ rows: 2, expandable: true }}>{row.caption}</Typography.Paragraph>}
      <div className="post-metric-grid">{(['views', 'likes', 'comments', 'shares'] as const).map(metric => <div key={metric}>
        <span>{metricLabels[metric]}</span><strong>{row.metrics?.[metric] == null ? 'Không có dữ liệu' : formatNumber(row.metrics[metric])}</strong>
      </div>)}</div>
    </div>)}
  </Space> }]} />;
}
