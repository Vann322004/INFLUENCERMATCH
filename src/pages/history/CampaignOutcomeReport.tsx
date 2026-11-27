import { Alert, App, Button, Card, DatePicker, Form, Input, InputNumber, Modal, Space, Table, Tag, Typography } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { Link } from 'react-router-dom';
import { campaignHistoryService } from '../../services/api/campaignHistoryService';
import { getErrorMessage } from '../../services/apiClient';
import type { CampaignFinancialSummary, HistoryDetail, HistoryMetric } from '../../types/api/campaignHistory.types';
import { historyDate, historyMoney, historyNumber, provenanceLabel } from './historyView';
import { httpsRule } from '../collaboration/ExecutionForms';
import { formatVndInput, parseVndInput } from '../collaboration/lifecyclePresentation';
import { PerformanceOverviewSection } from '../performance/PerformanceCharts';
import { buildCampaignMetricRows, exportCampaignReportXlsx } from './exportCampaignReportXlsx';
import '../performance/PerformancePage.css';
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
  const quickSources = ['TikTok Shop toàn chiến dịch', 'Shopee Affiliate', 'Mã voucher chung', 'Google Analytics / UTM'];

  return <>
    <Card
      className="campaign-fin-card"
      title="Doanh thu tổng toàn chiến dịch (khi không tách theo từng Creator)"
      extra={canRecord && latest ? (
        <Button size="small" onClick={edit}>
          Cập nhật số tổng mới
        </Button>
      ) : undefined}
    >
      <div className="campaign-fin-note">
        <strong>Khi nào dùng mục này?</strong> Khi cả chiến dịch dùng chung 1 mã giảm giá hoặc 1 link tổng (TikTok Shop, Shopee, UTM) nên bạn không tách được đơn theo từng Creator. Hệ thống tách riêng số tổng này với doanh thu từng Creator để tránh cộng trùng 2 lần.
      </div>
      {latest ? (
        <div className="campaign-fin-content">
          <div className="campaign-fin-meta">
            <span><strong>Phiên bản {latest.revision}</strong> · {historyDate(latest.recordedAt, true)}</span>
            <span>Nguồn: <strong>{latest.sourceDescription}</strong> · Kỳ: {historyDate(latest.periodStart)} – {historyDate(latest.periodEnd)}</span>
            {latest.evidenceUrl && <a href={latest.evidenceUrl} target="_blank" rel="noreferrer">Mở bằng chứng đối soát</a>}
          </div>
          <div className="campaign-fin-kpi-grid">
            <div className="campaign-fin-kpi-tile">
              <span className="campaign-fin-kpi-label">GMV tổng Campaign</span>
              <strong className="campaign-fin-kpi-val">{historyMoney(latest.gmv, latest.currency)}</strong>
            </div>
            <div className="campaign-fin-kpi-tile campaign-fin-kpi-tile--highlight">
              <span className="campaign-fin-kpi-label">Doanh thu tổng Campaign</span>
              <strong className="campaign-fin-kpi-val" style={{ color: '#6D28D9' }}>{historyMoney(latest.revenue, latest.currency)}</strong>
            </div>
            <div className="campaign-fin-kpi-tile">
              <span className="campaign-fin-kpi-label">Chi phí hợp tác đủ điều kiện</span>
              <strong className="campaign-fin-kpi-val">{historyMoney(latest.actualCost, latest.currency)}</strong>
            </div>
            <div className="campaign-fin-kpi-tile">
              <span className="campaign-fin-kpi-label">ROAS Campaign</span>
              <strong className="campaign-fin-kpi-val">{latest.roas == null ? '—' : `${historyNumber(latest.roas)}×`}</strong>
              {latest.roas == null && ratioReason('roas') && <small className="campaign-fin-kpi-hint">{ratioReason('roas')}</small>}
            </div>
            <div className="campaign-fin-kpi-tile">
              <span className="campaign-fin-kpi-label">ROI Campaign</span>
              <strong className="campaign-fin-kpi-val">{latest.roi == null ? '—' : `${new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 2 }).format(latest.roi)}`}</strong>
              {latest.roi == null && ratioReason('roi') && <small className="campaign-fin-kpi-hint">{ratioReason('roi')}</small>}
            </div>
          </div>
          {summaries.length > 1 && (
            <details className="campaign-fin-history">
              <summary>Lịch sử {summaries.length - 1} phiên bản trước</summary>
              {summaries.slice(1).map(row => (
                <p key={row.revision}>Phiên bản {row.revision} · {historyDate(row.recordedAt, true)}{row.reason ? ` · ${row.reason}` : ''}</p>
              ))}
            </details>
          )}
        </div>
      ) : (
        <div className="campaign-fin-empty">
          <div className="campaign-fin-empty-text">
            <strong>Chưa có số liệu tổng toàn chiến dịch</strong>
            <span>Nếu chiến dịch này không tách được đơn theo từng Creator, hãy nhập 1 số tổng GMV/Doanh thu tại đây để tính ROAS &amp; ROI chung.</span>
          </div>
          {canRecord && (
            <Button type="primary" size="small" onClick={edit}>
              Nhập doanh thu tổng Campaign
            </Button>
          )}
        </div>
      )}
    </Card>
    <Modal open={open} title={latest ? 'Cập nhật doanh thu tổng toàn chiến dịch' : 'Nhập doanh thu tổng toàn chiến dịch'}
      onCancel={() => !busy && setOpen(false)} onOk={() => form.submit()} confirmLoading={busy}
      width={680} centered okText="Lưu số liệu" cancelText="Đóng" destroyOnHidden>
      {error && <Alert showIcon type="error" title={error} style={{ marginBottom: 12 }} />}
      <Form form={form} layout="vertical" onFinish={save}>
        <div className="campaign-fin-note" style={{ marginBottom: 14 }}>
          Nhập số tổng từ hệ thống bán hàng của bạn (chỉ hiển thị nội bộ cho Brand). Không cần cộng tay từ các Creator đã nhập riêng lẻ.
        </div>
        <Form.Item label="Kỳ đối soát" name="period" rules={[{ required: true, message: 'Chọn kỳ đối soát.' }]}>
          <DatePicker.RangePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
        </Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 12px' }}>
          <Form.Item label="GMV tổng toàn chiến dịch (VND)" name="gmv">
            <InputNumber<string> stringMode min="0" max={String(Number.MAX_SAFE_INTEGER)} precision={2} controls={false}
              decimalSeparator="," suffix="₫" style={{ width: '100%' }}
              formatter={(value, info) => info.userTyping ? info.input : formatVndInput(value)}
              parser={parseVndInput} placeholder="Ví dụ: 50.000.000" />
          </Form.Item>
          <Form.Item label="Doanh thu thuần tổng (VND)" name="revenue">
            <InputNumber<string> stringMode min="0" max={String(Number.MAX_SAFE_INTEGER)} precision={2} controls={false}
              decimalSeparator="," suffix="₫" style={{ width: '100%' }}
              formatter={(value, info) => info.userTyping ? info.input : formatVndInput(value)}
              parser={parseVndInput} placeholder="Ví dụ: 35.000.000" />
          </Form.Item>
        </div>
        <Form.Item label="Nguồn số liệu" name="sourceDescription" style={{ marginBottom: 8 }}
          rules={[{ required: true, whitespace: true, message: 'Nhập nguồn số liệu.' },
            ({ getFieldValue }) => ({ validator: async () => {
              if (!String(getFieldValue('gmv') ?? '').trim() && !String(getFieldValue('revenue') ?? '').trim())
                throw new Error('Nhập GMV hoặc doanh thu tổng Campaign.');
            } })]}>
          <Input maxLength={2000} placeholder="Ví dụ: Báo cáo TikTok Shop theo mã voucher chung..." />
        </Form.Item>
        <Space wrap size={6} style={{ marginBottom: 14 }}>
          {quickSources.map(src => (
            <Tag key={src} style={{ cursor: 'pointer', margin: 0 }} onClick={() => form.setFieldValue('sourceDescription', src)}>
              + {src}
            </Tag>
          ))}
        </Space>
        <Form.Item label="Link bằng chứng đối soát (tùy chọn)" name="evidenceUrl" rules={[httpsRule]}>
          <Input maxLength={2000} placeholder="https://…" />
        </Form.Item>
        {latest && <Form.Item label="Lý do cập nhật" name="reason" rules={[{ required: true, whitespace: true, message: 'Nhập lý do cập nhật.' }]}>
          <Input.TextArea rows={2} maxLength={2000} />
        </Form.Item>}
      </Form>
    </Modal>
  </>;
}

const metricGroupMeta: Record<string, { label: string; color: string }> = {
  committedFee: { label: 'Tài chính', color: 'purple' },
  actualCost: { label: 'Tài chính', color: 'purple' },
  gmv: { label: 'Tài chính', color: 'purple' },
  revenue: { label: 'Tài chính', color: 'purple' },
  views: { label: 'Truyền thông', color: 'blue' },
  clicks: { label: 'Truyền thông', color: 'blue' },
  likes: { label: 'Truyền thông', color: 'blue' },
  comments: { label: 'Truyền thông', color: 'blue' },
  shares: { label: 'Truyền thông', color: 'blue' },
  engagements: { label: 'Truyền thông', color: 'blue' },
  roas: { label: 'Hiệu quả', color: 'green' },
  roi: { label: 'Hiệu quả', color: 'green' },
  cpm: { label: 'Hiệu quả', color: 'green' },
  cpe: { label: 'Hiệu quả', color: 'green' },
};

export default function CampaignOutcomeReport({ detail, canRecordCampaignSummary = false, mode = 'full' }: {
  detail: HistoryDetail; canRecordCampaignSummary?: boolean; mode?: 'full' | 'financial' | 'metrics';
}) {
  const { message } = App.useApp();
  const [summaries, setSummaries] = useState(detail.campaignFinancialSummaries ?? []);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { report, snapshotAvailability } = detail;

  const exportRows = buildCampaignMetricRows(
    detail,
    metrics,
    key => metricGroupMeta[key]?.label ?? 'Khác',
    metricValue,
    metricReasons,
  );

  const handleDownloadXlsx = () => {
    exportCampaignReportXlsx(detail, exportRows, summaries[0]);
    setPreviewOpen(false);
    message.success('Đã xuất báo cáo chiến dịch (.xlsx)');
  };

  return <div className="history-stack">
    {mode === 'full' && (
      <>
        <div className="perf-status-strip">
          <span>Hoàn tất: <strong>{report.completedCount}</strong></span>
          <span>Đang chạy: <strong>{report.unfinishedCount}</strong></span>
          <span>Đã hủy: <strong>{report.cancelledCount}</strong></span>
          <span>Dừng giữa chừng: <strong>{report.terminatedCount ?? 0}</strong></span>
          <span>Đủ điều kiện báo cáo: <strong>{report.eligibleCount}</strong></span>
        </div>
        {snapshotAvailability === 'MISSING' && <Alert showIcon type="info" title="Chưa có bản lưu lịch sử của brief." />}
        <PerformanceOverviewSection detail={detail} />
      </>
    )}
    {(mode === 'full' || mode === 'financial') && (
      <CampaignFinancialSummaryCard campaignId={detail.currentCampaign.id} summaries={summaries}
        canRecord={canRecordCampaignSummary} onSaved={summary => setSummaries(current =>
          [summary, ...current.filter(row => row.revision !== summary.revision)])} />
    )}
    {(mode === 'full' || mode === 'metrics') && (
      <Card
        className="campaign-metrics-card"
        title="Báo cáo kết quả"
        extra={
          <Space wrap size={8}>
            <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>
              Xem trước &amp; Xuất Excel
            </Button>
          </Space>
        }
      >
        <div className="campaign-fin-note">
          Kết quả lấy từ hợp tác đã hoàn tất có Outcome được nghiệm thu và đánh giá cuối tham chiếu. Phí cam kết gồm các hợp tác chưa hủy. <strong>Nguồn số liệu:</strong> {provenanceLabel(report.metricSource)}.
        </div>
        <Table
          className="campaign-metrics-table"
          rowKey="key"
          size="middle"
          scroll={{ x: 'max-content' }}
          pagination={false}
          dataSource={Object.entries(report.metrics).map(([key, metric]) => ({ key, metric }))}
          columns={[
            {
              title: 'Chỉ số',
              render: (_, row) => {
                const group = metricGroupMeta[row.key];
                return (
                  <Space size={8} wrap>
                    {group && <Tag color={group.color} style={{ margin: 0 }}>{group.label}</Tag>}
                    <strong style={{ color: '#0F172A' }}>{metrics[row.key] ?? row.key}</strong>
                  </Space>
                );
              },
            },
            {
              title: 'Giá trị',
              render: (_, row) => {
                const formatted = metricValue(row.key, row.metric);
                const available = row.metric.availability === 'AVAILABLE' && row.metric.value != null;
                return (
                  <strong className={available ? 'campaign-metric-val--active' : 'campaign-metric-val--empty'}>
                    {formatted}
                  </strong>
                );
              },
            },
            {
              title: 'Độ phủ',
              render: (_, { metric: { coverage } }) => (
                <Tag className="campaign-coverage-pill" style={{ margin: 0 }}>
                  {coverage.includedCollaborationCount}/{coverage.requiredCollaborationCount} hợp tác
                  {coverage.distinctPostCount > 0 && ` · ${coverage.distinctPostCount} bài đăng`}
                </Tag>
              ),
            },
            {
              title: 'Dữ liệu còn thiếu',
              width: 320,
              render: (_, { metric }) => metric.unavailableReasons.length ? (
                <div className="campaign-missing-pills">
                  {metric.unavailableReasons.map(reason => (
                    <Tag key={reason} color="warning" style={{ margin: 0 }}>
                      {metricReasons[reason] ?? reason}
                    </Tag>
                  ))}
                </div>
              ) : <span style={{ color: '#10B981', fontWeight: 600 }}>Đầy đủ</span>,
            },
          ]}
        />
      </Card>
    )}

    <Modal
      open={previewOpen}
      title={`Xem trước báo cáo Excel · ${detail.currentCampaign.name}`}
      onCancel={() => setPreviewOpen(false)}
      width={880}
      centered
      footer={
        <Space>
          <Button onClick={() => setPreviewOpen(false)}>Đóng</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadXlsx}>
            Tải xuống .xlsx
          </Button>
        </Space>
      }
    >
      <div className="history-stack">
        <div className="campaign-fin-note" style={{ marginBottom: 0 }}>
          File Excel sẽ gồm <strong>Sheet 1: Chỉ số đối soát</strong> ({exportRows.length} chỉ số)
          {summaries[0] ? ' và Sheet 2: Tài chính Campaign do Brand đối soát.' : '.'}
        </div>
        <Table
          rowKey="key"
          size="small"
          pagination={false}
          scroll={{ y: 340, x: 'max-content' }}
          dataSource={exportRows}
          columns={[
            { title: 'Nhóm', dataIndex: 'group', width: 110, render: (val: string) => <Tag style={{ margin: 0 }}>{val}</Tag> },
            { title: 'Chỉ số', dataIndex: 'label', render: (val: string) => <strong>{val}</strong> },
            { title: 'Giá trị', dataIndex: 'formattedValue', render: (val: string) => <strong style={{ color: val === '—' ? '#94A3B8' : '#6D28D9' }}>{val}</strong> },
            { title: 'Độ phủ', dataIndex: 'coverageText' },
            { title: 'Ghi chú thiếu dữ liệu', dataIndex: 'missingText', width: 240 },
          ]}
        />
      </div>
    </Modal>
  </div>;
}
