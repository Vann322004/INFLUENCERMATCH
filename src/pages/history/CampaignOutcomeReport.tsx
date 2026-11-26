import { Alert, App, Button, Card, DatePicker, Form, Input, InputNumber, Modal, Space, Table, Typography } from 'antd';
import { useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { Link } from 'react-router-dom';
import { campaignHistoryService } from '../../services/api/campaignHistoryService';
import { getErrorMessage } from '../../services/apiClient';
import type { CampaignFinancialSummary, HistoryDetail, HistoryMetric } from '../../types/api/campaignHistory.types';
import { historyDate, historyMoney, historyNumber, provenanceLabel } from './historyView';
import { httpsRule } from '../collaboration/ExecutionForms';
import './CampaignHistoryPage.css';

const metrics: Record<string, string> = {
  committedFee: 'Phí cam kết', actualCost: 'Chi phí thực tế', gmv: 'Tổng giá trị đơn hàng (GMV)',
  revenue: 'Doanh thu', views: 'Lượt xem', clicks: 'Lượt nhấp', likes: 'Lượt thích', comments: 'Bình luận',
  shares: 'Lượt chia sẻ', engagements: 'Lượt tương tác', roas: 'ROAS', roi: 'ROI', cpm: 'CPM', cpe: 'CPE',
};

const metricReasons: Record<string, string> = {
  NO_COMPLETED_COLLABORATIONS: 'Chưa có hợp tác hoàn tất.',
  MISSING_ACCEPTED_REVIEWED_SOURCE: 'Có hợp tác thiếu Outcome được nghiệm thu và đánh giá cuối tham chiếu.',
  UNSUPPORTED_CURRENCY: 'Dữ liệu tiền tệ chưa thể đối chiếu bằng VND.',
  MISSING_COMMITMENT: 'Thiếu phí cam kết.',
  INVALID_OR_MISSING_ACTUAL_COST: 'Chi phí thực tế thiếu hoặc chưa hợp lệ.',
  UNSUPPORTED_FINANCIAL_POLICY: 'Phiên bản tính tài chính chưa tương thích.',
  MISSING_POSTS: 'Chưa có dữ liệu bài đăng.',
  MISSING_PUBLICATION_REFERENCE: 'Thiếu tham chiếu bài đăng.',
  MISSING_MEASUREMENT_PERIOD: 'Thiếu kỳ đo.',
  INCONSISTENT_FINANCIAL_PERIOD: 'Kỳ tài chính và kỳ đo chưa nhất quán.',
  MISSING_METRIC_INPUT: 'Thiếu đầu vào của chỉ số.',
  DUPLICATE_POST_CONFLICT: 'Số liệu của cùng một bài đăng mâu thuẫn.',
  INVALID_METRIC_INPUT: 'Đầu vào của chỉ số chưa hợp lệ.',
  INCONSISTENT_MEASUREMENT_PERIOD: 'Kỳ đo giữa các bài chưa nhất quán.',
  ATTRIBUTION_NOT_ESTABLISHED: 'Chưa xác định được phạm vi ghi nhận doanh thu giữa các hợp tác.',
  INVALID_FINANCIAL_INPUT: 'Dữ liệu tài chính chưa hợp lệ.',
  MISSING_FINANCIAL_INPUT: 'Thiếu dữ liệu tài chính.',
  INVALID_DENOMINATOR: 'Mẫu số bằng 0 hoặc chưa hợp lệ.',
};

function metricValue(key: string, metric: HistoryMetric) {
  const { value, unit, availability } = metric;
  if (availability !== 'AVAILABLE' || value == null) return '—';
  if (key === 'roi') return new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 2 }).format(value);
  if (unit === 'RATIO') return `${historyNumber(value)}×`;
  if (unit === 'VND_PER_1000_VIEWS') return `${historyMoney(value, 'VND')} / 1.000 lượt xem`;
  if (unit === 'VND_PER_ENGAGEMENT') return `${historyMoney(value, 'VND')} / lượt tương tác`;
  return unit === 'VND' ? historyMoney(value, 'VND') : historyNumber(value);
}

type SummaryForm = {
  gmv?: string;
  revenue?: string;
  period: [Dayjs, Dayjs];
  sourceDescription: string;
  evidenceUrl?: string;
  reason?: string;
};

function CampaignFinancialSummaryCard({ campaignId, summaries, canRecord, onSaved }: {
  campaignId: string;
  summaries: CampaignFinancialSummary[];
  canRecord: boolean;
  onSaved: (summary: CampaignFinancialSummary) => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<SummaryForm>();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const latest = summaries[0];
  function edit() {
    setError('');
    form.setFieldsValue({
      gmv: latest?.gmv == null ? undefined : String(latest.gmv),
      revenue: latest?.revenue == null ? undefined : String(latest.revenue),
      period: latest ? [dayjs(latest.periodStart), dayjs(latest.periodEnd)] : undefined,
      sourceDescription: latest?.sourceDescription,
      evidenceUrl: latest?.evidenceUrl || undefined,
      reason: undefined,
    } as Partial<SummaryForm>);
    setOpen(true);
  }
  async function save(values: SummaryForm) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const saved = await campaignHistoryService.saveFinancialSummary(campaignId, {
        expectedRevision: latest?.revision ?? 0,
        gmv: values.gmv?.trim() ? Number(values.gmv) : undefined,
        revenue: values.revenue?.trim() ? Number(values.revenue) : undefined,
        periodStart: values.period[0].toISOString(),
        periodEnd: values.period[1].toISOString(),
        sourceDescription: values.sourceDescription.trim(),
        evidenceUrl: values.evidenceUrl?.trim() || undefined,
        reason: values.reason?.trim() || undefined,
      }, crypto.randomUUID());
      onSaved(saved);
      setOpen(false);
      message.success('Đã lưu phiên bản tổng GMV/doanh thu Campaign.');
    } catch (reason) {
      setError(getErrorMessage(reason, 'Không lưu được tổng GMV/doanh thu Campaign.'));
    } finally { setBusy(false); }
  }
  const reasonLabels: Record<string, string> = {
    MISSING_ACTUAL_COST: 'Thiếu chi phí thực tế đã xác nhận',
    INCONSISTENT_FINANCIAL_PERIOD: 'Kỳ đo khác với kỳ tài chính của hợp tác',
    MISSING_CAMPAIGN_GMV: 'Chưa có GMV tổng từ nguồn Campaign',
    MISSING_CAMPAIGN_REVENUE: 'Chưa có doanh thu tổng từ nguồn Campaign',
    INVALID_DENOMINATOR: 'Chi phí thực tế phải lớn hơn 0',
    INVALID_OR_MISSING_ACTUAL_COST: 'Chi phí thực tế chưa đủ điều kiện',
    MISSING_ACCEPTED_REVIEWED_SOURCE: 'Thiếu Outcome đủ điều kiện',
  };
  const ratioReason = (metric: 'roas' | 'roi') =>
    latest?.unavailableReasons?.[metric]?.map(reason => reasonLabels[reason] ?? reason).join(' · ');
  return <>
    <Card title="Tổng tài chính Campaign do Brand đối soát">
      <Space wrap>
        <Typography.Text type="secondary">
          Số liệu này tách riêng khỏi GMV/doanh thu từng Creator; không cộng hai nguồn với nhau.
        </Typography.Text>
        {canRecord && <Button onClick={edit}>{latest ? 'Ghi nhận phiên bản mới' : 'Ghi nhận tổng Campaign'}</Button>}
      </Space>
      {latest ? <div className="history-stack" style={{ marginTop: 16 }}>
        <Typography.Text>Phiên bản {latest.revision} · {historyDate(latest.recordedAt, true)}</Typography.Text>
        <Typography.Text>Nguồn: {latest.sourceDescription} · Kỳ: {historyDate(latest.periodStart)} – {historyDate(latest.periodEnd)}</Typography.Text>
        <Typography.Text>GMV: {historyMoney(latest.gmv, latest.currency)} · Doanh thu: {historyMoney(latest.revenue, latest.currency)}</Typography.Text>
        {latest.evidenceUrl && <a href={latest.evidenceUrl} target="_blank" rel="noreferrer">Mở bằng chứng đối soát</a>}
        <Typography.Text>Chi phí hợp tác đủ điều kiện: {historyMoney(latest.actualCost, latest.currency)}</Typography.Text>
        <Typography.Text>ROAS Campaign: {latest.roas == null ? `—${ratioReason('roas') ? ` · ${ratioReason('roas')}` : ''}` : `${historyNumber(latest.roas)}×`}</Typography.Text>
        <Typography.Text>ROI Campaign: {latest.roi == null ? `—${ratioReason('roi') ? ` · ${ratioReason('roi')}` : ''}` : `${new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 2 }).format(latest.roi)}`}</Typography.Text>
        {summaries.length > 1 && <details>
          <summary>Lịch sử {summaries.length - 1} phiên bản trước</summary>
          {summaries.slice(1).map(row => <p key={row.revision}>Phiên bản {row.revision} · {historyDate(row.recordedAt, true)} · {row.reason}</p>)}
        </details>}
      </div> : <p className="history-muted">Chưa có tổng GMV/doanh thu Campaign riêng từ Brand.</p>}
    </Card>
    <Modal open={open} title={latest ? 'Ghi nhận tổng Campaign mới' : 'Ghi nhận tổng Campaign'}
      onCancel={() => !busy && setOpen(false)} onOk={() => form.submit()} confirmLoading={busy}
      okText="Lưu phiên bản" cancelText="Hủy" destroyOnHidden>
      {error && <Alert showIcon type="error" title={error} />}
      <Form form={form} layout="vertical" onFinish={save}>
        <Typography.Paragraph type="secondary">
          Nhập số tổng độc lập từ báo cáo Campaign (ví dụ TikTok Shop/UTM). Không nhập tổng bằng cách cộng lại GMV từng Creator.
        </Typography.Paragraph>
        <Form.Item label="Kỳ đối soát" name="period" rules={[{ required: true, message: 'Chọn kỳ đối soát.' }]}>
          <DatePicker.RangePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="GMV tổng Campaign (VND)" name="gmv">
          <InputNumber stringMode min="0" max={String(Number.MAX_SAFE_INTEGER)} precision={2} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Doanh thu tổng Campaign (VND)" name="revenue">
          <InputNumber stringMode min="0" max={String(Number.MAX_SAFE_INTEGER)} precision={2} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Nguồn số liệu" name="sourceDescription" rules={[{ required: true, whitespace: true, message: 'Nhập nguồn số liệu.' },
          ({ getFieldValue }) => ({ validator: async () => {
            if (!String(getFieldValue('gmv') ?? '').trim() && !String(getFieldValue('revenue') ?? '').trim())
              throw new Error('Nhập GMV hoặc doanh thu tổng Campaign.');
          } })]}>
          <Input maxLength={2000} placeholder="Ví dụ: Báo cáo TikTok Shop theo mã UTM ..." />
        </Form.Item>
        <Form.Item label="Link bằng chứng (khuyến nghị)" name="evidenceUrl" rules={[httpsRule]}>
          <Input maxLength={2000} placeholder="https://…" />
        </Form.Item>
        {latest && <Form.Item label="Lý do cập nhật" name="reason" rules={[{ required: true, whitespace: true, message: 'Nhập lý do cập nhật.' }]}>
          <Input.TextArea maxLength={2000} />
        </Form.Item>}
      </Form>
    </Modal>
  </>;
}

export default function CampaignOutcomeReport({ detail, canRecordCampaignSummary = false, mode = 'full' }: {
  detail: HistoryDetail; canRecordCampaignSummary?: boolean; mode?: 'full' | 'financial' | 'metrics';
}) {
  const [summaries, setSummaries] = useState(detail.campaignFinancialSummaries ?? []);
  const { report, copyOrigin, latestContext, snapshotAvailability } = detail;
  return <div className="history-stack">
    {mode === 'full' && (
      <>
        <div className="history-grid">{[
          ['Đã hoàn tất', report.completedCount], ['Chưa hoàn tất', report.unfinishedCount],
          ['Đã hủy', report.cancelledCount], ['Có nguồn đủ điều kiện báo cáo', report.eligibleCount],
          ['Kết thúc giữa chừng', report.terminatedCount ?? 0],
        ].map(([label, value]) => <Card key={label}><div className="history-summary"><span>{label}</span><strong>{value}</strong></div></Card>)}</div>
        {snapshotAvailability === 'MISSING' && <Alert showIcon type="info" title="Chưa có bản lưu lịch sử của brief." />}
        {latestContext && <p className="history-muted">Bản lưu brief mới nhất · Phiên bản {latestContext.version ?? '—'} · {historyDate(latestContext.createdAt, true)}</p>}
        {copyOrigin && <p className="history-muted">Chiến dịch được tạo bằng cách dùng lại brief từ <Link
          to={`/campaign-history/${copyOrigin.sourceCampaignId}`}>chiến dịch nguồn</Link>.</p>}
      </>
    )}
    {(mode === 'full' || mode === 'financial') && (
      <CampaignFinancialSummaryCard campaignId={detail.currentCampaign.id} summaries={summaries}
        canRecord={canRecordCampaignSummary} onSaved={summary => setSummaries(current =>
          [summary, ...current.filter(row => row.revision !== summary.revision)])} />
    )}
    {(mode === 'full' || mode === 'metrics') && (
      <Card title="Báo cáo kết quả">
        <p className="history-muted">Kết quả lấy từ hợp tác đã hoàn tất có Outcome được nghiệm thu và đánh giá cuối tham chiếu.
          Phí cam kết gồm các hợp tác chưa hủy. Nguồn số liệu: {provenanceLabel(report.metricSource)}.</p>
        <Table rowKey="key" size="middle" scroll={{ x: 'max-content' }} pagination={false}
          dataSource={Object.entries(report.metrics).map(([key, metric]) => ({ key, metric }))}
          columns={[
            { title: 'Chỉ số', render: (_, row) => metrics[row.key] ?? row.key },
            { title: 'Giá trị', render: (_, row) => <strong>{metricValue(row.key, row.metric)}</strong> },
            { title: 'Độ phủ', render: (_, { metric: { coverage } }) => <span>
              {coverage.includedCollaborationCount}/{coverage.requiredCollaborationCount} hợp tác
              {coverage.distinctPostCount > 0 && ` · ${coverage.distinctPostCount} bài đăng`}
            </span> },
            { title: 'Dữ liệu còn thiếu', width: 320, render: (_, { metric }) => metric.unavailableReasons.length
              ? <ul className="history-reasons">{metric.unavailableReasons.map(reason =>
                <li key={reason}>{metricReasons[reason] ?? reason}</li>)}</ul> : '—' },
          ]} />
      </Card>
    )}
  </div>;
}
