import { Button, Checkbox, DatePicker, Form, Input, InputNumber, Radio, Rate, Select, Typography } from 'antd';
import { CalculatorOutlined, LockOutlined } from '@ant-design/icons';
import type { FormRule } from 'antd';
import { useState } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { formatVndInput, parseVndInput } from './lifecyclePresentation';
import type {
  CollaborationChannel, Deliverable, LegacyPlan, Measurement, MetricName, OutcomeValues, ReviewValues,
} from '../../types/api/collaboration.types';

export const metricLabels: Record<MetricName, string> = {
  views: 'Lượt xem', clicks: 'Lượt nhấp', likes: 'Lượt thích', comments: 'Bình luận', shares: 'Chia sẻ',
};
export const metrics = Object.keys(metricLabels) as MetricName[];

export const required = { required: true, message: 'Vui lòng nhập trường này.' } satisfies FormRule;
export const requiredText = { ...required, whitespace: true } satisfies FormRule;
export const httpsRule: FormRule = {
  validator: async (_, value?: string) => {
    if (!value?.trim()) return;
    try {
      const url = new URL(value.trim());
      if (url.protocol === 'https:' && url.hostname && !url.username && !url.password) return;
    } catch {
      // Report malformed and non-HTTPS URLs in the same way.
    }
    throw new Error('Nhập URL HTTPS hợp lệ.');
  },
};

export const formatNumber = (value?: number | null) =>
  value == null ? '—' : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(value);

export const formatMoney = (value?: number | null, currency?: string | null) =>
  value == null ? '—' : [formatNumber(value), currency].filter(Boolean).join(' ');

export function formatDate(value?: string | null) {
  return value && dayjs(value).isValid() ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—';
}

export function channelLabel(channel: CollaborationChannel) {
  return [channel.platform, channel.username && '@' + channel.username].filter(Boolean).join(' · ') || channel.creatorId;
}

export const currentPublication = (unit: Deliverable) =>
  unit.publications.find(publication => publication.submissionRevision === unit.submissionRevision);

const isoPeriod = ([start, end]: [Dayjs, Dayjs]) => [start.toISOString(), end.toISOString()] as const;
const numericText = (value?: number | null) => value == null ? undefined : String(value);
const moneyValue = (value?: string) => value?.trim() ? Number(value) : undefined;
const nonnegativeNumberRule = (integer: boolean): FormRule => ({
  validator: async (_, input?: string) => {
    const value = input?.trim();
    if (!value) return;
    const valid = integer ? /^\d+$/.test(value) : /^\d+(?:\.\d{1,2})?$/.test(value);
    if (!valid || Number(value) > Number.MAX_SAFE_INTEGER) {
      throw new Error(integer ? 'Nhập số nguyên không âm.' : 'Nhập số tiền không âm, tối đa hai chữ số thập phân.');
    }
  },
});
const integerRule = nonnegativeNumberRule(true);
const moneyRule = nonnegativeNumberRule(false);

const dateRange = (start?: string, end?: string) => start && end ? [dayjs(start), dayjs(end)] : undefined;

export type OutcomeForm = Partial<Record<MetricName, string>> & {
  collectionId?: string;
  period: [Dayjs, Dayjs];
  unavailable?: Partial<Record<MetricName, boolean>>;
  evidenceUrl?: string;
  reason?: string;
};

export interface FinanceForm {
  reason?: string;
  costs?: { description: string; amount: string }[];
  gmv?: string;
  revenue?: string;
  financialPeriod?: [Dayjs, Dayjs];
  financialEvidence?: string;
  financialConfirmed?: boolean;
}

const hasCostInput = (cost?: NonNullable<FinanceForm['costs']>[number]) =>
  Boolean(cost?.description?.trim() || cost?.amount?.trim());

export function measurementFor(outcome: OutcomeValues | undefined, unit: Deliverable) {
  return outcome?.posts.find(post => post.deliverableId === unit.id && post.submissionRevision === unit.submissionRevision);
}

export function measurementMetric(post: Measurement | undefined, metric: MetricName) {
  const value = post?.[metric];
  if (value != null) return formatNumber(value);
  return post?.unavailableMetrics?.includes(metric) ? 'Không cung cấp' : 'Chưa khai';
}

export function initialOutcome(post?: Measurement): Partial<OutcomeForm> {
  const unavailable: OutcomeForm['unavailable'] = {};
  const values: Partial<OutcomeForm> = {
    collectionId: post?.collectionId,
    period: dateRange(post?.periodStart, post?.periodEnd) as [Dayjs, Dayjs] | undefined,
    evidenceUrl: post?.evidenceUrl,
    unavailable,
  };
  for (const metric of metrics) {
    values[metric] = numericText(post?.[metric]);
    unavailable[metric] = post?.unavailableMetrics?.includes(metric);
  }
  return values;
}

export function initialFinance(previous?: OutcomeValues, agreedFee?: number | null): Partial<FinanceForm> {
  const defaultPeriodStart = previous?.periodStart ?? previous?.posts?.[0]?.periodStart;
  const defaultPeriodEnd = previous?.periodEnd ?? previous?.posts?.[0]?.periodEnd;
  return {
    costs: previous?.costs?.length
      ? previous.costs.map(cost => ({ ...cost, amount: String(cost.amount) }))
      : agreedFee && agreedFee > 0
        ? [{ description: 'Phí hợp tác đã chốt', amount: String(agreedFee) }]
        : [{ description: '', amount: '' }],
    gmv: numericText(previous?.gmv),
    revenue: numericText(previous?.revenue),
    financialPeriod: dateRange(defaultPeriodStart, defaultPeriodEnd) as [Dayjs, Dayjs] | undefined,
    financialEvidence: previous?.financialEvidence,
    financialConfirmed: previous?.financialConfirmed ?? false,
  };
}

export function outcomePayload(values: OutcomeForm & { url?: string }, unit: Deliverable) {
  const [periodStart, periodEnd] = isoPeriod(values.period);
  const unavailableMetrics = metrics.filter(metric => values.unavailable?.[metric]);
  const post: Omit<Measurement, 'deliverableId'> = {
    collectionId: values.collectionId,
    submissionRevision: unit.submissionRevision, periodStart, periodEnd, unavailableMetrics,
    evidenceUrl: values.evidenceUrl?.trim() || undefined,
  };
  for (const metric of metrics) {
    if (!values.unavailable?.[metric]) post[metric] = Number(values[metric]);
  }
  return { ...post, url: values.url?.trim() || undefined, reason: values.reason?.trim() || undefined };
}

export function financePayload(values: FinanceForm) {
  const [periodStart, periodEnd] = values.financialPeriod ? isoPeriod(values.financialPeriod) : [];
  const costs = values.costs?.filter(hasCostInput);
  return {
    reason: values.reason?.trim() || undefined,
    costs: costs?.length ? costs.map(cost => ({ description: cost.description.trim(), amount: Number(cost.amount) })) : undefined,
    currency: 'VND' as const,
    gmv: moneyValue(values.gmv), revenue: moneyValue(values.revenue),
    periodStart, periodEnd, financialConfirmed: values.financialConfirmed ?? false,
    financialEvidence: values.financialEvidence?.trim() || undefined,
  };
}

function EditReason() {
  return <Form.Item name="reason" label="Lý do chỉnh sửa" rules={[requiredText]}>
    <Input.TextArea maxLength={2000} />
  </Form.Item>;
}

export function OutcomeFields({ unit, label, editing }: { unit: Deliverable; label: string; editing: boolean }) {
  const publication = currentPublication(unit);
  return <>
    <div className="outcome-unit-summary">
      <strong>{label} · Bản {unit.submissionRevision}</strong>
      {publication && (
        <a href={publication.url} target="_blank" rel="noopener noreferrer" className="outcome-pub-link">
          Mở bài đăng
        </a>
      )}
    </div>
    {!publication && (
      <Form.Item name="url" label="Link bài đăng" rules={[requiredText, httpsRule]}>
        <Input maxLength={2000} placeholder="https://…" />
      </Form.Item>
    )}
    <div className="outcome-meta-row">
      <Form.Item name="period" label="Kỳ đo (giờ địa phương)" rules={[required]}>
        <DatePicker.RangePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="evidenceUrl" label="Link bằng chứng (tùy chọn)" rules={[httpsRule]}>
        <Input maxLength={2000} placeholder="https://…" />
      </Form.Item>
    </div>
    <div className="execution-grid">
      {metrics.map(metric => {
        const unavailable = ['unavailable', metric];
        return <div key={metric} className="execution-metric">
          <Form.Item noStyle dependencies={[unavailable]}>
            {({ getFieldValue }) => {
              const missing = Boolean(getFieldValue(unavailable));
              return <Form.Item
                name={metric}
                label={metricLabels[metric]}
                dependencies={[unavailable]}
                rules={[
                  ({ getFieldValue: getLatest }) => ({
                    validator(_, value) {
                      if (getLatest(unavailable)) return Promise.resolve();
                      const text = value == null ? '' : String(value).trim();
                      if (!text) return Promise.reject(new Error('Vui lòng nhập trường này.'));
                      if (!/^(0|[1-9][0-9]*)$/.test(text) || !Number.isSafeInteger(Number(text))) {
                        return Promise.reject(new Error('Nhập số nguyên không âm hợp lệ.'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input inputMode="numeric" disabled={missing} placeholder={missing ? 'Không áp dụng' : undefined} />
              </Form.Item>;
            }}
          </Form.Item>
          <Form.Item name={unavailable} valuePropName="checked" style={{ marginBottom: 0 }}>
            <Checkbox aria-label={metricLabels[metric] + ' · Nền tảng không cung cấp'}>Không cung cấp</Checkbox>
          </Form.Item>
        </div>;
      })}
    </div>
    {editing && <EditReason />}
  </>;
}

export function hasFinance(outcome?: OutcomeValues) {
  return !!outcome && [outcome.currency, outcome.costs, outcome.gmv, outcome.revenue, outcome.periodStart,
  outcome.periodEnd, outcome.financialEvidence, outcome.financialConfirmed].some(value => value !== undefined);
}

export const gmvLabel = 'Tổng giá trị đơn hàng (GMV, VND)';

export function FinanceFields({ editing }: { editing: boolean }) {
  const form = Form.useFormInstance<FinanceForm>();
  const watchedCosts = Form.useWatch('costs', form);
  const watchedGmv = Form.useWatch('gmv', form);
  const watchedRevenue = Form.useWatch('revenue', form);
  const costCount = watchedCosts?.length ?? 0;

  const [brandingOnly, setBrandingOnly] = useState(false);
  const [showGmvCalc, setShowGmvCalc] = useState(false);
  const [estOrders, setEstOrders] = useState<number | null>(null);
  const [avgOrderValue, setAvgOrderValue] = useState<number | null>(null);

  const actualCost = (watchedCosts ?? []).reduce((sum, item) => {
    const val = Number(item?.amount);
    return Number.isFinite(val) && val > 0 ? sum + val : sum;
  }, 0);
  const gmvNum = moneyValue(watchedGmv);
  const revenueNum = moneyValue(watchedRevenue);
  const previewRoas = actualCost > 0 && gmvNum != null && gmvNum >= 0 ? gmvNum / actualCost : null;
  const previewRoi = actualCost > 0 && revenueNum != null ? ((revenueNum - actualCost) / actualCost) * 100 : null;

  const toggleBrandingOnly = (checked: boolean) => {
    setBrandingOnly(checked);
    if (checked) {
      setShowGmvCalc(false);
      form.setFieldsValue({ gmv: undefined, revenue: undefined });
    }
  };

  const applyQuickGmv = () => {
    if (!estOrders || !avgOrderValue || estOrders <= 0 || avgOrderValue <= 0) return;
    form.setFieldValue('gmv', String(Math.round(estOrders * avgOrderValue)));
    setShowGmvCalc(false);
  };

  return <div className="finance-fields-stack">
    <div className="finance-privacy-banner">
      <LockOutlined className="finance-privacy-icon" />
      <span>
        <strong>Bảo mật nội bộ:</strong> Số liệu doanh thu &amp; GMV chỉ hiển thị riêng cho Brand (Creator không xem được) và dùng để tính ROAS/ROI khi xuất báo cáo Excel.
      </span>
    </div>
    {editing && <EditReason />}
    <fieldset className="execution-fieldset finance-fieldset">
      <legend>Chi phí thực tế (VND)</legend>
      <Form.List name="costs">
        {(fields, { add, remove }) => <>
          {fields.map(({ key, name }) => {
            const description = ['costs', name, 'description'];
            const amount = ['costs', name, 'amount'];
            const requiredWhenEntered: FormRule = ({ getFieldValue }) =>
              hasCostInput(getFieldValue(['costs', name])) ? requiredText : {};
            return <div key={key} className="finance-cost-row">
              <Form.Item name={[name, 'description']} label="Khoản chi" dependencies={[amount]} rules={[requiredWhenEntered]}>
                <Input maxLength={500} placeholder="Ví dụ: Sản xuất nội dung" />
              </Form.Item>
              <Form.Item name={[name, 'amount']} label="Số tiền (VND)" dependencies={[description]}
                rules={[requiredWhenEntered, moneyRule]}>
                <InputNumber<string> stringMode min="0" max={String(Number.MAX_SAFE_INTEGER)} precision={2} controls={false} decimalSeparator="," suffix="₫" style={{ width: '100%' }} formatter={(value, info) => info.userTyping ? info.input : formatVndInput(value)} parser={parseVndInput} placeholder="Ví dụ: 1.000.000" />
              </Form.Item>
              <Button danger onClick={() => remove(name)} style={{ marginBottom: 10 }}>Bỏ</Button>
            </div>;
          })}
          <Button type="dashed" onClick={() => add()} disabled={fields.length >= 100} style={{ borderColor: '#C4B5FD', color: '#6D28D9' }}>
            + Thêm khoản chi
          </Button>
        </>}
      </Form.List>
      <Form.Item name="financialConfirmed" valuePropName="checked"
        className="execution-cost-confirmation finance-confirm-box"
        dependencies={['costs', ...Array.from({ length: costCount }, (_, index) => ['costs', index, 'amount'])]}
        rules={[({ getFieldValue }) => ({
          validator: async (_, confirmed?: boolean) => {
            const costs: FinanceForm['costs'] = getFieldValue('costs');
            if (confirmed && !costs?.some(cost => Number(cost?.amount) > 0)) {
              throw new Error('Cần ít nhất một khoản chi có số tiền lớn hơn 0 VND để xác nhận.');
            }
          },
        })]}>
        <Checkbox>Tôi xác nhận các khoản chi thực tế (cần ít nhất 1 khoản &gt; 0 ₫).</Checkbox>
      </Form.Item>
    </fieldset>
    <fieldset className="execution-fieldset finance-fieldset finance-fieldset--purple">
      <legend>Doanh thu và đối soát (tùy chọn)</legend>
      <div className="finance-branding-toggle">
        <Checkbox checked={brandingOnly} onChange={event => toggleBrandingOnly(event.target.checked)}>
          <span><strong>Chiến dịch nhận diện</strong> — không đo doanh thu / GMV (chỉ nghiệm thu theo View, Tương tác, CPM/CPE)</span>
        </Checkbox>
        {!brandingOnly && (
          <Button
            type="link"
            size="small"
            icon={<CalculatorOutlined />}
            onClick={() => setShowGmvCalc(prev => !prev)}
            style={{ paddingInline: 4, color: '#6D28D9', fontWeight: 600 }}
          >
            {showGmvCalc ? 'Ẩn tính nhanh GMV' : 'Tính nhanh GMV từ số đơn'}
          </Button>
        )}
      </div>

      {!brandingOnly && showGmvCalc && (
        <div className="finance-gmv-calc">
          <InputNumber
            min={1}
            precision={0}
            controls={false}
            placeholder="Số đơn ước tính"
            value={estOrders}
            onChange={val => setEstOrders(val)}
            style={{ width: '100%' }}
          />
          <span className="finance-gmv-calc-x">×</span>
          <InputNumber
            min={1000}
            precision={0}
            controls={false}
            suffix="₫"
            placeholder="Giá trị đơn TB (VND)"
            value={avgOrderValue}
            onChange={val => setAvgOrderValue(val)}
            style={{ width: '100%' }}
          />
          <Button
            type="primary"
            size="small"
            disabled={!estOrders || !avgOrderValue}
            onClick={applyQuickGmv}
          >
            Điền GMV
          </Button>
        </div>
      )}

      <div className="finance-revenue-grid">
        <Form.Item name="gmv" label={gmvLabel} rules={[moneyRule]}>
          <InputNumber<string> disabled={brandingOnly} stringMode min="0" max={String(Number.MAX_SAFE_INTEGER)} precision={2} controls={false} decimalSeparator="," suffix="₫" style={{ width: '100%' }} formatter={(value, info) => info.userTyping ? info.input : formatVndInput(value)} parser={parseVndInput} placeholder={brandingOnly ? 'Không áp dụng' : '0'} />
        </Form.Item>
        <Form.Item name="revenue" label="Doanh thu (VND)" rules={[moneyRule]}>
          <InputNumber<string> disabled={brandingOnly} stringMode min="0" max={String(Number.MAX_SAFE_INTEGER)} precision={2} controls={false} decimalSeparator="," suffix="₫" style={{ width: '100%' }} formatter={(value, info) => info.userTyping ? info.input : formatVndInput(value)} parser={parseVndInput} placeholder={brandingOnly ? 'Không áp dụng' : '0'} />
        </Form.Item>
        <Form.Item name="financialPeriod" label="Kỳ tài chính (giờ địa phương)" style={{ marginBottom: 0 }}>
          <DatePicker.RangePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="financialEvidence" label="Link đối soát" rules={[httpsRule]} style={{ marginBottom: 0 }}>
          <Input maxLength={2000} placeholder="https://…" />
        </Form.Item>
      </div>

      {!brandingOnly && (
        <div className="finance-live-preview" aria-live="polite">
          <span className="finance-live-preview-title">Xem trước hiệu quả:</span>
          <span>
            Chi phí: <strong>{actualCost > 0 ? `${formatNumber(actualCost)} ₫` : '—'}</strong>
          </span>
          <span>
            ROAS: <strong>{previewRoas != null ? `${formatNumber(Number(previewRoas.toFixed(2)))}x` : '—'}</strong>
          </span>
          <span>
            ROI: <strong>{previewRoi != null ? `${previewRoi > 0 ? '+' : ''}${formatNumber(Number(previewRoi.toFixed(1)))}%` : '—'}</strong>
          </span>
        </div>
      )}
    </fieldset>
  </div>;
}

export interface LegacyPlanForm {
  sourceDescription: string;
  deliverables: (Omit<LegacyPlan['deliverables'][number], 'dueAt' | 'acceptanceChecklist'> & {
    dueAt: Dayjs;
    checklist: string;
  })[];
}

export function legacyPlanPayload(values: LegacyPlanForm): LegacyPlan {
  return {
    sourceDescription: values.sourceDescription.trim(),
    deliverables: values.deliverables.map(({ dueAt, checklist, ...unit }) => ({
      ...unit, contentType: unit.contentType.trim(), dueAt: dueAt.toISOString(),
      acceptanceChecklist: [...new Set(checklist.split(/\r?\n/).map(item => item.trim()).filter(Boolean))],
    })),
  };
}

export function LegacyPlanFields({ channels }: { channels: CollaborationChannel[] }) {
  return <>
    <Form.Item name="sourceDescription" label="Nguồn điều khoản đã có" rules={[requiredText]}>
      <Input.TextArea maxLength={2000} />
    </Form.Item>
    <Form.List name="deliverables" initialValue={[{ quantity: 1, maxRevisionRounds: 0 }]}>
      {(fields, { add, remove }) => <>
        {fields.map(({ key, name }, index) => (
          <fieldset key={key} className="execution-fieldset">
            <legend>Hạng mục {index + 1}</legend>
            <div className="execution-grid">
              <Form.Item name={[name, 'creatorId']} label="Kênh" rules={[required]}>
                <Select options={channels.map(channel => ({ value: channel.creatorId, label: channelLabel(channel) }))} />
              </Form.Item>
              <Form.Item name={[name, 'contentType']} label="Loại nội dung" rules={[requiredText]}><Input maxLength={100} /></Form.Item>
              <Form.Item name={[name, 'quantity']} label="Số lượng" rules={[required]}><InputNumber min={1} max={100} precision={0} /></Form.Item>
              <Form.Item name={[name, 'dueAt']} label="Hạn nộp (giờ địa phương)" rules={[required]}>
                <DatePicker showTime format="DD/MM/YYYY HH:mm" />
              </Form.Item>
              <Form.Item name={[name, 'maxRevisionRounds']} label="Số vòng sửa tối đa" rules={[required]}>
                <InputNumber min={0} max={10} precision={0} />
              </Form.Item>
            </div>
            <Form.Item name={[name, 'checklist']} label="Checklist, mỗi dòng một mục" rules={[requiredText]}>
              <Input.TextArea rows={3} />
            </Form.Item>
            {fields.length > 1 && <Button onClick={() => remove(name)}>Bỏ hạng mục</Button>}
          </fieldset>
        ))}
        <Button onClick={() => add({ quantity: 1, maxRevisionRounds: 0 })}>Thêm hạng mục</Button>
      </>}
    </Form.List>
  </>;
}

const suggestedReviewTags = [
  'Đúng hạn',
  'Sáng tạo',
  'Dễ phối hợp',
  'Chuyên nghiệp',
  'Nội dung chất lượng',
  'Giao tiếp tốt',
  'Tương tác tốt',
  'Đạt KPI',
].map(tag => ({ value: tag, label: tag }));

export function ReviewFields() {
  return <div className="review-fields-stack">
    <div className="review-recommend-banner">
      <strong>Khuyến nghị hoàn tất kèm đánh giá:</strong> Chỉ mất ~15 giây để chấm điểm trải nghiệm thực tế, giúp hệ thống cập nhật uy tín Creator và gợi ý AI chính xác hơn cho chiến dịch sau.
    </div>
    <div className="review-ratings-grid">
      <Form.Item name="overallRating" label="Đánh giá tổng thể (1–5)" rules={[required]} style={{ marginBottom: 0 }}>
        <Rate allowClear={false} />
      </Form.Item>
      <Form.Item name="brandFitRating" label="Mức phù hợp thương hiệu (1–5)" rules={[required]} style={{ marginBottom: 0 }}>
        <Rate allowClear={false} />
      </Form.Item>
      <Form.Item name="wouldCollaborateAgain" label="Bạn có muốn hợp tác lại?" rules={[required]} style={{ marginBottom: 0 }}>
        <Radio.Group options={[{ value: true, label: 'Có' }, { value: false, label: 'Không' }]} />
      </Form.Item>
    </div>
    <div className="review-details-grid">
      <Form.Item name="note" label="Ghi chú (tối đa 2.000 ký tự)" style={{ marginBottom: 0 }}>
        <Input.TextArea rows={3} maxLength={2000} placeholder="Nhận xét nhanh về tác phong, chất lượng nội dung, đúng hạn…" />
      </Form.Item>
      <Form.Item name="reviewTags" label="Nhãn đánh giá" style={{ marginBottom: 0 }}
        rules={[{
          validator: async (_, tags?: string[]) => {
            if (tags?.some(tag => !tag.trim() || tag.trim().length > 100)) throw new Error('Mỗi nhãn có từ 1 đến 100 ký tự.');
          }
        }]}>
        <Select
          mode="tags"
          maxCount={20}
          notFoundContent={null}
          options={suggestedReviewTags}
          placeholder="Chọn hoặc gõ nhãn rồi nhấn Enter…"
        />
      </Form.Item>
    </div>
  </div>;
}

export function reviewPayload(values: ReviewValues): ReviewValues {
  return {
    overallRating: values.overallRating,
    brandFitRating: values.brandFitRating,
    wouldCollaborateAgain: values.wouldCollaborateAgain,
    note: values.note?.trim() || undefined,
    reviewTags: [...new Set((values.reviewTags ?? []).map(tag => tag.trim()))],
  };
}
