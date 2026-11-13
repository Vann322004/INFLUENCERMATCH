import { Alert, Button, Card, DatePicker, Form, Input, InputNumber, Modal, Select, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../services/apiClient';
import { campaignHistoryService } from '../../services/api/campaignHistoryService';
import { historyPlatforms, type BriefPreview, type DuplicateBriefRequest, type HistoryBrief } from '../../types/api/campaignHistory.types';
import { BriefFacts } from './HistoryFacts';
import { HistoryReadState, problem, provenanceLabel, useHistoryRead } from './historyView';

type EditableFields = 'name' | 'totalBudget' | 'creatorFeeMin' | 'creatorFeeMax'
  | 'creatorMode' | 'targetCreatorCount' | 'deliverables';
type DraftForm = Partial<Pick<HistoryBrief, EditableFields>> & { startDate?: Dayjs | null; endDate?: Dayjs | null };
type Submission = { key: string; payload: DuplicateBriefRequest };

const editableFields = ['name', 'startDate', 'endDate', 'totalBudget', 'creatorFeeMin', 'creatorFeeMax',
  'creatorMode', 'targetCreatorCount', 'deliverables'] as const satisfies readonly (keyof DraftForm)[];
const readOnlyFields: (keyof HistoryBrief)[] = ['productService', 'objective', 'brief', 'targetAudiences',
  'contentType', 'platforms', 'niches', 'locations', 'followerMin', 'followerMax'];
const warnings: Record<string, string> = {
  LEGACY_BUDGET_NOT_CONVERTED: 'Khoảng ngân sách cũ chưa xác định là tổng ngân sách hay phí mỗi Creator. Hãy nhập lại nếu cần.',
  SOURCE_FIELDS_MISSING: 'Brief nguồn còn thiếu một số dữ liệu. Bạn có thể bổ sung sau khi tạo bản nháp.',
  HISTORICAL_CONTEXT_MISSING_CURRENT_RECORD_ONLY: 'Chiến dịch chưa có bản lưu brief. Bản xem trước dùng thông tin hiện tại.',
  CURRENT_DRAFT_NOT_A_HISTORICAL_SNAPSHOT: 'Nguồn là bản nháp hiện tại.',
};
const validName = [{ required: true, whitespace: true, message: 'Nhập tên chiến dịch.' }, { max: 200 }];
const maxCount = 2147483647;

function formValues(draft: HistoryBrief): DraftForm {
  return {
    name: draft.name ?? '', startDate: null, endDate: null, totalBudget: draft.totalBudget,
    creatorFeeMin: draft.creatorFeeMin, creatorFeeMax: draft.creatorFeeMax, creatorMode: draft.creatorMode,
    targetCreatorCount: draft.targetCreatorCount, deliverables: draft.deliverables ?? [],
  };
}

function buildDraft(source: HistoryBrief, form: DraftForm): HistoryBrief {
  return {
    name: form.name?.trim() ?? '', productService: source.productService, objective: source.objective,
    brief: source.brief, targetAudiences: source.targetAudiences, contentType: source.contentType,
    platforms: source.platforms, niches: source.niches, locations: source.locations,
    followerMin: source.followerMin, followerMax: source.followerMax,
    startDate: form.startDate?.format('YYYY-MM-DD') ?? null, endDate: form.endDate?.format('YYYY-MM-DD') ?? null,
    totalBudget: form.totalBudget ?? null, currency: form.totalBudget != null || form.creatorFeeMin != null
      || form.creatorFeeMax != null ? 'VND' : source.currency,
    creatorFeeMin: form.creatorFeeMin ?? null, creatorFeeMax: form.creatorFeeMax ?? null,
    creatorMode: form.creatorMode ?? null, targetCreatorCount: form.targetCreatorCount ?? null,
    deliverables: (form.deliverables ?? []).map(item => ({
      platform: item.platform, contentType: item.contentType.trim(), quantity: item.quantity,
    })),
  };
}

function Editor({ initial, campaignId, contextId, contextVersion, onClose }: {
  initial: BriefPreview; campaignId: string; contextId?: string; contextVersion?: number | null; onClose: () => void;
}) {
  const navigate = useNavigate();
  const [form] = Form.useForm<DraftForm>();
  const [preview, setPreview] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
  const [sourceStale, setSourceStale] = useState(false);
  const [uncertain, setUncertain] = useState<Submission>();
  const [error, setError] = useState<string>();
  const inFlight = useRef(false);
  const changed = useRef(new Set<string>());
  const lifetime = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    return () => controller.abort();
  }, []);

  async function refreshSource(signal: AbortSignal) {
    try {
      const updated = await campaignHistoryService.preview(campaignId, contextId, signal);
      if (signal.aborted) return;
      const fields = formValues(updated.draft);
      form.setFields(editableFields.filter(key => !changed.current.has(key)).map(name => ({ name, value: fields[name] })));
      setPreview(updated);
      setSourceStale(false);
      setNeedsReview(true);
      setError(undefined);
    } catch (cause) {
      if (!signal.aborted) setError(getErrorMessage(cause, 'Không tải được brief nguồn. Vui lòng thử lại.'));
    }
  }

  async function run(action: (signal: AbortSignal) => Promise<void>) {
    const signal = lifetime.current?.signal;
    if (!signal || signal.aborted || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      await action(signal);
    } finally {
      inFlight.current = false;
      if (!signal.aborted) setBusy(false);
    }
  }

  async function send(submission: Submission) {
    await run(async signal => {
      setError(undefined);
      try {
        const created = await campaignHistoryService.duplicate(campaignId, submission.payload, submission.key);
        if (signal.aborted) return;
        message.success('Đã tạo bản nháp chiến dịch.');
        navigate(`/campaigns/${created.campaign.id}`);
      } catch (cause) {
        if (signal.aborted) return;
        const response = problem(cause);
        if (response.status === 409 && response.data?.code === 'CAMPAIGN_REVISION_CONFLICT') {
          setUncertain(undefined);
          setSourceStale(true);
          await refreshSource(signal);
        } else if (!response.status || response.status >= 500 || response.status === 408) {
          setUncertain(submission);
          setError('Chưa xác nhận được kết quả tạo bản nháp. Hãy thử lại yêu cầu vừa gửi.');
        } else {
          setUncertain(undefined);
          const details = response.data?.fieldErrors ?? response.data?.errors;
          const fieldErrors = Object.entries(details ?? {}).flatMap(([path, messages]) => {
            const name = editableFields.find(field => field === path.replace(/^draft\./, ''));
            return name && Array.isArray(messages) ? [{ name, errors: messages }] : [];
          });
          if (fieldErrors.length) form.setFields(fieldErrors);
          setError(response.data?.code === 'QUOTA_EXCEEDED' ? 'Gói hiện tại đã hết lượt tạo chiến dịch.'
            : getErrorMessage(cause, response.status === 403 ? 'Bạn không có quyền tạo bản nháp từ brief này.'
              : 'Không tạo được bản nháp. Kiểm tra dữ liệu và thử lại.'));
        }
      }
    });
  }

  function submit(values: DraftForm) {
    if (sourceStale || uncertain || inFlight.current) return;
    const { source, draft } = preview;
    void send({
      key: crypto.randomUUID(),
      payload: {
        expectedSourceRevision: source.sourceRevision, sourceKind: source.sourceKind,
        sourceContextId: source.sourceContextId ?? undefined, draft: buildDraft(draft, values),
      },
    });
  }

  return <Modal open title="Dùng lại brief" width="min(760px, calc(100vw - 24px))" onCancel={busy ? undefined : onClose}
    closable={!busy} mask={{ closable: false }} keyboard={!busy} footer={[
      <Button key="close" onClick={onClose} disabled={busy}>Đóng</Button>,
      <Button key="create" type="primary" loading={busy} onClick={() => {
        if (uncertain) void send(uncertain);
        else if (sourceStale) void run(refreshSource);
        else form.submit();
      }}>{uncertain ? 'Thử lại yêu cầu' : sourceStale ? 'Tải lại brief nguồn'
        : needsReview ? 'Xác nhận và tạo bản nháp' : 'Tạo bản nháp'}</Button>,
    ]}>
    <div className="history-brief-editor">
      {error && <Alert showIcon type="error" title={error} />}
      {sourceStale && <Alert showIcon type="warning" title="Brief nguồn đã thay đổi." description="Tải lại nguồn để xem các thay đổi trước khi tạo." />}
      {needsReview && <Alert showIcon type="warning" title="Đã tải brief nguồn mới để đối chiếu."
        description="Các trường bạn đã sửa được giữ lại. Kiểm tra dữ liệu từ nguồn mới trước khi xác nhận." />}
      <div className="history-stack">
        <div className="history-copy-source">
          <strong>Nguồn brief · {preview.source.sourceKind === 'CONTEXT_SNAPSHOT'
            ? contextVersion != null ? `Bản lưu phiên bản ${contextVersion}` : contextId ? 'Bản lưu đã chọn' : 'Bản lưu mới nhất'
            : provenanceLabel(preview.source.sourceKind)}</strong>
        </div>
        {preview.warnings.length > 0 && <Alert showIcon type="info" title="Lưu ý về brief nguồn"
          description={<ul className="history-reasons">{preview.warnings.map(item =>
            <li key={item}>{warnings[item] ?? item}</li>)}</ul>} />}
        <Card size="small" title={needsReview ? 'Brief nguồn mới để đối chiếu' : 'Nội dung brief nguồn'}>
          <BriefFacts brief={preview.draft} fields={needsReview ? undefined : readOnlyFields} />
        </Card>
        <Form form={form} layout="vertical" initialValues={formValues(initial.draft)} onFinish={submit}
          disabled={busy || sourceStale || !!uncertain}
          onValuesChange={(values: Partial<DraftForm>) => Object.keys(values).forEach(key => changed.current.add(key))}>
          <div className="history-facts">
            <Form.Item className="history-wide" name="name" label="Tên chiến dịch" rules={validName}>
              <Input maxLength={200} />
            </Form.Item>
            <Form.Item name="startDate" label="Ngày bắt đầu"><DatePicker format="DD/MM/YYYY" /></Form.Item>
            <Form.Item name="endDate" label="Ngày kết thúc" dependencies={['startDate']} rules={[({ getFieldValue }) => ({
              validator: (_, value: Dayjs | null) => value && getFieldValue('startDate')?.isAfter(value, 'day')
                ? Promise.reject(new Error('Ngày kết thúc phải từ ngày bắt đầu trở đi.')) : Promise.resolve(),
            })]}><DatePicker format="DD/MM/YYYY" /></Form.Item>
            <Form.Item name="totalBudget" label="Tổng ngân sách (VND)" rules={[{
              validator: (_, value: number | null) => value == null || value > 0
                ? Promise.resolve() : Promise.reject(new Error('Tổng ngân sách phải lớn hơn 0.')),
            }]}><InputNumber min={0} precision={2} controls={false} /></Form.Item>
            <Form.Item name="creatorFeeMin" label="Phí tối thiểu mỗi Creator (VND)" rules={[{ type: 'number', min: 0 }]}>
              <InputNumber min={0} precision={2} controls={false} />
            </Form.Item>
            <Form.Item name="creatorFeeMax" label="Phí tối đa mỗi Creator (VND)" dependencies={['creatorFeeMin']} rules={[
              { type: 'number', min: 0 }, ({ getFieldValue }) => ({
                validator: (_, value: number | null) => value == null || getFieldValue('creatorFeeMin') == null || value >= getFieldValue('creatorFeeMin')
                  ? Promise.resolve() : Promise.reject(new Error('Phí tối đa phải từ phí tối thiểu trở lên.')),
              }),
            ]}><InputNumber min={0} precision={2} controls={false} /></Form.Item>
            <Form.Item name="creatorMode" label="Chế độ hợp tác">
              <Select allowClear options={[{ value: 'SINGLE', label: 'Một Creator' }, { value: 'MULTI', label: 'Nhiều Creator' }]} />
            </Form.Item>
            <Form.Item name="targetCreatorCount" label="Số Creator dự kiến" dependencies={['creatorMode']} rules={[
              { type: 'integer', min: 1, max: maxCount }, ({ getFieldValue }) => ({
                validator: (_, value: number | null) => {
                  const mode = getFieldValue('creatorMode');
                  if (value != null && ((mode === 'SINGLE' && value !== 1) || (mode === 'MULTI' && value < 2))) {
                    return Promise.reject(new Error(mode === 'SINGLE' ? 'Chế độ này yêu cầu một Creator.' : 'Nhập ít nhất hai Creator.'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}><InputNumber min={1} max={maxCount} precision={0} /></Form.Item>
          </div>
          <Form.List name="deliverables">{(fields, { add, remove }) => <div className="history-stack">
            <strong>Ấn phẩm cấp chiến dịch</strong>
            {!preview.draft.platforms?.length && <p className="history-muted">
              Brief nguồn chưa có nền tảng. Có thể bổ sung nền tảng và ấn phẩm sau khi tạo bản nháp.
            </p>}
            {fields.map(field => <div className="history-deliverable-fields" key={field.key}>
              <Form.Item name={[field.name, 'platform']} label="Nền tảng" rules={[{ required: true, message: 'Chọn nền tảng.' }, {
                validator: (_, value) => !value || preview.draft.platforms?.includes(value) ? Promise.resolve()
                  : Promise.reject(new Error('Nền tảng phải thuộc brief nguồn.')),
              }]}>
                <Select options={(preview.draft.platforms ?? []).filter(platform => historyPlatforms.includes(platform))
                  .map(value => ({ value, label: value }))} />
              </Form.Item>
              <Form.Item name={[field.name, 'contentType']} label="Loại nội dung"
                rules={[{ required: true, whitespace: true, message: 'Nhập loại nội dung.' }, { max: 100 }]}>
                <Input maxLength={100} />
              </Form.Item>
              <Form.Item name={[field.name, 'quantity']} label="Số lượng"
                rules={[{ required: true, type: 'integer', min: 1, max: maxCount, message: 'Nhập số nguyên dương.' }]}>
                <InputNumber min={1} max={maxCount} precision={0} />
              </Form.Item>
              <Button icon={<DeleteOutlined />} aria-label={`Xóa ấn phẩm ${field.name + 1}`} onClick={() => remove(field.name)} />
            </div>)}
            <Button icon={<PlusOutlined />} disabled={!preview.draft.platforms?.length || fields.length >= 100}
              onClick={() => add({ quantity: 1 })}>Thêm ấn phẩm</Button>
          </div>}</Form.List>
        </Form>
      </div>
    </div>
  </Modal>;
}

export default function DuplicateBriefModal({ campaignId, contextId, contextVersion, onClose }: {
  campaignId: string; contextId?: string; contextVersion?: number | null; onClose: () => void;
}) {
  const load = useCallback((signal: AbortSignal) => campaignHistoryService.preview(campaignId, contextId, signal),
    [campaignId, contextId]);
  const { result, retry } = useHistoryRead(load);
  if (result.status !== 'ready') return <Modal open title="Dùng lại brief" onCancel={onClose} footer={null}>
    <HistoryReadState result={result} retry={retry} missing="Không tìm thấy brief nguồn." />
  </Modal>;
  return <Editor initial={result.data} campaignId={campaignId} contextId={contextId} contextVersion={contextVersion} onClose={onClose} />;
}
