import { Button, Checkbox, DatePicker, Form, Input, InputNumber, Radio, Rate, Select, Typography } from 'antd';
import type { FormRule } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
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

export function initialFinance(previous?: OutcomeValues): Partial<FinanceForm> {
  return {
    costs: previous?.costs?.length
      ? previous.costs.map(cost => ({ ...cost, amount: String(cost.amount) }))
      : [{ description: '', amount: '' }],
    gmv: numericText(previous?.gmv),
    revenue: numericText(previous?.revenue),
    financialPeriod: dateRange(previous?.periodStart, previous?.periodEnd) as [Dayjs, Dayjs] | undefined,
    financialEvidence: previous?.financialEvidence,
    financialConfirmed: previous?.financialConfirmed ?? false,
  };
}

export function outcomePayload(values: OutcomeForm & { url?: string }, unit: Deliverable) {
  const [periodStart, periodEnd] = isoPeriod(values.period);
  const unavailableMetrics = metrics.filter(metric => values.unavailable?.[metric]);
  const post: Omit<Measurement, 'deliverableId'> = {
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
    <p><strong>{label}</strong> · Bản {unit.submissionRevision}</p>
    {publication
      ? <Form.Item label="Link bài đăng" htmlFor="outcome-publication-url">
          <Input id="outcome-publication-url" value={publication.url} readOnly />
        </Form.Item>
      : <Form.Item name="url" label="Link bài đăng" rules={[requiredText, httpsRule]}>
          <Input maxLength={2000} placeholder="https://…" />
        </Form.Item>}
    <Form.Item name="period" label="Kỳ đo (giờ địa phương)" rules={[required]}>
      <DatePicker.RangePicker showTime format="DD/MM/YYYY HH:mm" />
    </Form.Item>
    <div className="execution-grid">
      {metrics.map(metric => {
        const unavailable = ['unavailable', metric];
        return <div key={metric} className="execution-metric">
          <Form.Item noStyle dependencies={[unavailable]}>
            {({ getFieldValue }) => {
              const missing = getFieldValue(unavailable);
              return <Form.Item name={metric} label={metricLabels[metric]}
                rules={missing ? [] : [requiredText, integerRule]}>
                <Input inputMode="numeric" disabled={missing} />
              </Form.Item>;
            }}
          </Form.Item>
          <Form.Item name={unavailable} valuePropName="checked">
            <Checkbox aria-label={metricLabels[metric] + ' · Nền tảng không cung cấp'}>Nền tảng không cung cấp</Checkbox>
          </Form.Item>
        </div>;
      })}
    </div>
    <Form.Item name="evidenceUrl" label="Link bằng chứng (tùy chọn)" rules={[httpsRule]}>
      <Input maxLength={2000} placeholder="https://…" />
    </Form.Item>
    {editing && <EditReason />}
  </>;
}

export function hasFinance(outcome?: OutcomeValues) {
  return !!outcome && [outcome.currency, outcome.costs, outcome.gmv, outcome.revenue, outcome.periodStart,
    outcome.periodEnd, outcome.financialEvidence, outcome.financialConfirmed].some(value => value !== undefined);
}

export const gmvLabel = 'Tổng giá trị đơn hàng (GMV, VND)';

export function FinanceFields({ editing }: { editing: boolean }) {
  const costCount = Form.useWatch((values: FinanceForm) => values.costs?.length ?? 0);
  return <>
    {editing && <EditReason />}
    <fieldset className="execution-fieldset">
      <legend>Chi phí thực tế (VND)</legend>
      <Typography.Paragraph type="secondary">
        Nhập ít nhất một khoản chi lớn hơn 0 để xác nhận chi phí và nghiệm thu.
      </Typography.Paragraph>
      <Form.List name="costs">
        {(fields, { add, remove }) => <>
          {fields.map(({ key, name }) => {
            const description = ['costs', name, 'description'];
            const amount = ['costs', name, 'amount'];
            const requiredWhenEntered: FormRule = ({ getFieldValue }) =>
              hasCostInput(getFieldValue(['costs', name])) ? requiredText : {};
            return <div key={key} className="execution-grid">
              <Form.Item name={[name, 'description']} label="Khoản chi" dependencies={[amount]} rules={[requiredWhenEntered]}>
                <Input maxLength={500} placeholder="Ví dụ: Sản xuất nội dung" />
              </Form.Item>
              <Form.Item name={[name, 'amount']} label="Số tiền (VND)" dependencies={[description]}
                rules={[requiredWhenEntered, moneyRule]}>
                <Input inputMode="decimal" placeholder="Ví dụ: 150000" />
              </Form.Item>
              <Button onClick={() => remove(name)}>Bỏ khoản chi</Button>
            </div>;
          })}
          <Button onClick={() => add()} disabled={fields.length >= 100}>Thêm khoản chi</Button>
        </>}
      </Form.List>
      <Form.Item name="financialConfirmed" valuePropName="checked"
        className="execution-cost-confirmation"
        dependencies={['costs', ...Array.from({ length: costCount ?? 0 }, (_, index) => ['costs', index, 'amount'])]}
        rules={[({ getFieldValue }) => ({
          validator: async (_, confirmed?: boolean) => {
            const costs: FinanceForm['costs'] = getFieldValue('costs');
            if (confirmed && !costs?.some(cost => Number(cost?.amount) > 0)) {
              throw new Error('Cần ít nhất một khoản chi có số tiền lớn hơn 0 VND để xác nhận.');
            }
          },
        })]}>
        <Checkbox>Tôi xác nhận các khoản chi thực tế.</Checkbox>
      </Form.Item>
    </fieldset>
    <fieldset className="execution-fieldset">
      <legend>Doanh thu và đối soát (tùy chọn)</legend>
      <div className="execution-grid">
        <Form.Item name="gmv" label={gmvLabel} rules={[moneyRule]}
          extra="Tổng giá trị đơn hàng ghi nhận từ hợp tác trong kỳ đối soát.">
          <Input inputMode="decimal" />
        </Form.Item>
        <Form.Item name="revenue" label="Doanh thu" rules={[moneyRule]}><Input inputMode="decimal" /></Form.Item>
        <Form.Item name="financialPeriod" label="Kỳ tài chính (giờ địa phương)">
          <DatePicker.RangePicker showTime format="DD/MM/YYYY HH:mm" />
        </Form.Item>
        <Form.Item name="financialEvidence" label="Link đối soát" rules={[httpsRule]}>
          <Input maxLength={2000} placeholder="https://…" />
        </Form.Item>
      </div>
    </fieldset>
  </>;
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

export function ReviewFields() {
  return <>
    <Form.Item name="overallRating" label="Đánh giá tổng thể" rules={[required]}><Rate allowClear={false} /></Form.Item>
    <Form.Item name="brandFitRating" label="Mức phù hợp với thương hiệu" rules={[required]}><Rate allowClear={false} /></Form.Item>
    <Form.Item name="wouldCollaborateAgain" label="Bạn có muốn hợp tác lại?" rules={[required]}>
      <Radio.Group options={[{ value: true, label: 'Có' }, { value: false, label: 'Không' }]} />
    </Form.Item>
    <Form.Item name="note" label="Ghi chú"><Input.TextArea maxLength={2000} /></Form.Item>
    <Form.Item name="reviewTags" label="Nhãn đánh giá" extra="Nhấn Enter để thêm nhãn. Tối đa 20 nhãn."
      rules={[{ validator: async (_, tags?: string[]) => {
        if (tags?.some(tag => !tag.trim() || tag.trim().length > 100)) throw new Error('Mỗi nhãn có từ 1 đến 100 ký tự.');
      } }]}>
      <Select mode="tags" maxCount={20} />
    </Form.Item>
  </>;
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
