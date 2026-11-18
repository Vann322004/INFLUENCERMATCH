import CrawlerReviewList from './CrawlerReviewList';
import { useEffect, useRef, useState } from 'react';
import { Alert, App, Avatar, Button, Card, Checkbox, Descriptions, Drawer, Empty, Form, Grid, Input, Pagination, Radio, Select, Skeleton, Steps, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { CheckOutlined, CloseOutlined, ExportOutlined, ReloadOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { dataQualityService } from '../../../services/api/dataQualityService';
import { nicheService } from '../../../services/api/nicheService';
import type { QualityItem } from './types';
import { PLATFORM_COLOR_MAP } from './types';
import './DataQualityPage.css';

function errorText(error: any) {
  const status = error?.response?.status;
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Tài khoản chưa có quyền kiểm định phân loại nhà sáng tạo.';
  if (status === 404) return 'API kiểm định chưa có trên máy chủ đang kết nối. Cần cập nhật backend.';
  if (status === 409) return 'Hồ sơ đã được xử lý hoặc có dữ liệu mới. Danh sách sẽ được tải lại.';
  return error?.response?.data?.detail || error?.message || 'Không tải được dữ liệu kiểm định. Vui lòng thử lại.';
}

function confidence(item: QualityItem) {
  return typeof item.dataConfidence === 'number' && Number.isFinite(item.dataConfidence)
    ? `${Math.round(item.dataConfidence * 100)}%` : 'Chưa có';
}

function reviewedNiche(value?: string) {
  const niche = value?.trim() || '';
  return niche.toUpperCase() === 'UNKNOWN' ? '' : niche;
}

function collectedAt(value: string) {
  if (!value || Number.isNaN(Date.parse(value))) return 'Chưa có thời gian thu thập';
  return new Date(value).toLocaleString('vi-VN');
}

function channelUrl(item: QualityItem) {
  try {
    const url = new URL(item.profileUrl);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

function CreatorIdentity({ item }: { item: QualityItem }) {
  return <div className="quality-creator">
    <Avatar size={40} src={item.avatarUrl || undefined}>{(item.displayName || item.userName || '?').charAt(0)}</Avatar>
    <div>
      <strong>{item.displayName || item.userName}</strong>
      <div className="quality-creator-meta"><span>@{item.userName?.replace(/^@+/, '')}</span><Tag color={PLATFORM_COLOR_MAP[item.platform?.toLowerCase()]}>{item.platform}</Tag>{item.creatorType && <Tag color="purple">{item.creatorType}</Tag>}</div>
    </div>
  </div>;
}

export default function DataQualityPage() {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/data-manager') ? '/data-manager' : '/admin';
  const [items, setItems] = useState<QualityItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<QualityItem | null>(null);
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [saving, setSaving] = useState(false);
  const [niches, setNiches] = useState<string[]>([]);
  const [nichesError, setNichesError] = useState('');
  const [nichesLoading, setNichesLoading] = useState(false);
  const [nichesRetry, setNichesRetry] = useState(0);
  const [form] = Form.useForm();
  const requestVersion = useRef(0);
  const savingRef = useRef(false);

  const openReview = (item: QualityItem) => {
    setNiches([]);
    setNichesError('');
    form.resetFields();
    form.setFieldsValue({ niche: reviewedNiche(item.niche), reclassifiedType: 'REJECTED', reason: '', checked: false });
    setDecision('approve');
    setSelected(item);
  };

  useEffect(() => {
    let active = true;
    const version = ++requestVersion.current;
    setLoading(true);
    setError('');
    dataQualityService.pending(page - 1, pageSize).then(result => {
      if (!active || version !== requestVersion.current) return;
      if (!result.items.length && result.totalElements > 0 && page > result.totalPages) {
        setPage(Math.max(1, result.totalPages));
        return;
      }
      setItems(result.items);
      setTotal(result.totalElements);
    }).catch(err => {
      if (!active || version !== requestVersion.current) return;
      setItems([]);
      setTotal(null);
      setError(errorText(err));
    }).finally(() => { if (active && version === requestVersion.current) setLoading(false); });
    return () => { active = false; };
  }, [page, pageSize, refreshKey]);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    setNichesError('');
    setNichesLoading(true);
    nicheService.list.invalidate();
    nicheService.list().then(records => {
      if (!active) return;
      if (!Array.isArray(records) || !records.every(item => typeof item.name === 'string' && typeof item.active === 'boolean')) throw new Error('Invalid taxonomy response');
      const names = records.filter(item => item.active && reviewedNiche(item.name)).map(item => item.name);
      setNiches(names);
      if (!names.includes(form.getFieldValue('niche'))) form.setFieldValue('niche', undefined);
    }).catch(err => {
      if (!active) return;
      setNiches([]);
      const status = err?.response?.status;
      setNichesError(status === 403 ? 'Tài khoản chưa có quyền đọc danh mục ngành hàng.'
        : status === 404 ? 'Máy chủ chưa hỗ trợ API danh mục ngành hàng.'
        : 'Không kết nối được danh mục ngành hàng. Vui lòng thử lại.');
    }).finally(() => { if (active) setNichesLoading(false); });
    return () => { active = false; };
  }, [selected, form, nichesRetry]);

  const startDecision = (next: 'approve' | 'reject') => {
    form.setFieldValue('checked', false);
    setDecision(next);
  };

  const submitDecision = async () => {
    if (!selected || !decision || savingRef.current) return;
    let values;
    try { values = await form.validateFields(); } catch { return; }
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      if (decision === 'approve') await dataQualityService.approve(selected.metricId, values.niche);
      else await dataQualityService.reject(selected.metricId, values.reason, values.reclassifiedType);
      message.success(decision === 'approve' ? `Đã duyệt hồ sơ @${selected.userName} với ngành hàng ${values.niche.trim()}.` : `Đã ghi nhận kết quả kiểm định hồ sơ @${selected.userName}.`);
      setDecision(null);
      setSelected(null);
      if (items.length === 1 && page > 1) setPage(current => current - 1);
      else setRefreshKey(current => current + 1);
    } catch (err: any) {
      message.error(errorText(err));
      if (err?.response?.status === 409) {
        setDecision(null);
        setSelected(null);
        setRefreshKey(current => current + 1);
      }
    } finally { savingRef.current = false; setSaving(false); }
  };

  const columns: TableColumnsType<QualityItem> = [
    { title: 'Nhà sáng tạo', key: 'creator', width: 280, render: (_, item) => <CreatorIdentity item={item} /> },
    { title: 'Ngành hàng AI gợi ý', dataIndex: 'niche', width: 180, render: value => reviewedNiche(value) || 'Chưa phân loại' },
    { title: 'Độ tin cậy AI', key: 'confidence', width: 130, render: (_, item) => <Tag color="orange">{confidence(item)}</Tag> },
    { title: 'Nội dung thu thập', dataIndex: 'contentSummary', render: value => <Typography.Paragraph ellipsis={{ rows: 2, tooltip: true }} style={{ margin: 0 }}>{value || 'Chưa có nội dung'}</Typography.Paragraph> },
    { title: 'Thao tác', key: 'action', width: 130, render: (_, item) => <Button type="primary" onClick={() => openReview(item)}>Kiểm định</Button> },
  ];

  return <div className="data-quality-page">
    <div className="quality-page-heading">
      <div><Typography.Title level={3}>Kiểm định chất lượng nhà sáng tạo</Typography.Title>
        <Typography.Paragraph type="secondary">Xem dữ liệu thu thập, kiểm tra phân loại AI và ghi nhận quyết định cho từng hồ sơ.</Typography.Paragraph></div>
      <Button icon={<ReloadOutlined />} loading={loading} disabled={saving} onClick={() => setRefreshKey(current => current + 1)}>Làm mới</Button>
    </div>
    <Card className="quality-workflow">
      <Steps size="small" responsive items={[{ title: 'Chọn hồ sơ' }, { title: 'Đối chiếu nội dung kênh' }, { title: 'Duyệt hoặc từ chối' }]} />
    </Card>
    <CrawlerReviewList refreshKey={refreshKey} />
    <Card className="quality-review-list">
      <div className="quality-list-heading"><div><Typography.Title level={4}>Hồ sơ chờ kiểm định</Typography.Title>
        <Typography.Text type="secondary">Hồ sơ KOC/KOL mới nhất chưa được kiểm định, có độ tin cậy AI dưới 70% hoặc chưa xác định ngành hàng.</Typography.Text></div>
        <Tag color="orange">{total === null ? 'Chưa tải dữ liệu' : `${total} hồ sơ`}</Tag></div>
      {error ? <Alert type="error" showIcon title="Không tải được danh sách kiểm định" description={error} action={<Button onClick={() => setRefreshKey(current => current + 1)}>Thử lại</Button>} />
        : loading ? <Skeleton active paragraph={{ rows: 6 }} />
        : !items.length ? <Empty description="Không có hồ sơ đang chờ kiểm định"><Link to={`${basePath}/jobs`}>Đến trang thu thập dữ liệu</Link></Empty>
        : screens.xl ? <Table rowKey="metricId" columns={columns} dataSource={items} pagination={false} tableLayout="fixed" scroll={{ x: 900 }} />
        : <div className="quality-profile-cards">{items.map(item => <article className="quality-profile-card" key={item.metricId}>
          <CreatorIdentity item={item} />
          <div className="quality-card-facts"><span>{reviewedNiche(item.niche) || 'Chưa phân loại'}</span><Tag color="orange">Tin cậy AI: {confidence(item)}</Tag></div>
          <p>{item.contentSummary || 'Chưa có nội dung thu thập.'}</p>
          <div className="quality-card-footer"><Typography.Text type="secondary">{collectedAt(item.collectedAt)}</Typography.Text><Button type="primary" onClick={() => openReview(item)}>Kiểm định</Button></div>
        </article>)}</div>}
      {!error && total !== null && total > 0 && <Pagination className="quality-pagination" current={page} pageSize={pageSize} total={total} showSizeChanger={false} disabled={loading || saving} onChange={setPage} showTotal={count => `${count} hồ sơ`} />}
    </Card>
    <Drawer title="Kiểm định hồ sơ nhà sáng tạo" className="quality-review-drawer" open={!!selected}
      onClose={() => { if (!saving) { setSelected(null); setDecision(null); } }} size={screens.md ? 760 : '100%'} closable={!saving} maskClosable={!saving} keyboard={!saving}
      footer={<div className="quality-review-actions"><Button disabled={saving} onClick={() => { setSelected(null); setDecision(null); }}>Đóng</Button><Button type="primary" danger={decision === 'reject'} icon={decision === 'reject' ? <CloseOutlined /> : <CheckOutlined />} loading={saving} onClick={submitDecision}>{decision === 'reject' ? 'Xác nhận từ chối / Phân loại lại' : 'Xác nhận duyệt hồ sơ'}</Button></div>}>
      {selected && <div className="quality-review-detail">
        <CreatorIdentity item={selected} />
        {channelUrl(selected) ? <Button href={channelUrl(selected)} target="_blank" rel="noopener noreferrer" icon={<ExportOutlined />}>Mở kênh để đối chiếu</Button> : <Alert type="warning" title="Hồ sơ chưa có đường dẫn kênh hợp lệ." />}
        <Descriptions column={1} bordered size="small" items={[
          { key: 'type', label: 'Phân loại hiện tại', children: selected.creatorType || 'Chưa có dữ liệu phân loại' },
          { key: 'niche', label: 'Ngành hàng AI gợi ý', children: reviewedNiche(selected.niche) || <Tag color="warning">Chưa phân loại</Tag> },
          { key: 'confidence', label: 'Độ tin cậy AI', children: confidence(selected) },
          { key: 'collected', label: 'Thu thập lúc', children: collectedAt(selected.collectedAt) },
        ]} />
        <section><Typography.Title level={5}>Nội dung đã thu thập</Typography.Title><p className="quality-evidence">{selected.contentSummary || 'Chưa có nội dung. Mở kênh để kiểm tra trước khi quyết định.'}</p></section>
        {!reviewedNiche(selected.niche) && <Alert type="warning" showIcon title="Hồ sơ chưa có ngành hàng" description="Cần xác định ngành hàng sau khi đối chiếu kênh. Không thể duyệt khi ngành hàng chưa xác định." />}
        <section className="quality-decision-panel">
          <Typography.Title level={5}>Kết quả kiểm định</Typography.Title>
          <Typography.Paragraph type="secondary">Đối chiếu đúng kênh, nội dung đã thu thập và phân loại trước khi xác nhận.</Typography.Paragraph>
          <Radio.Group className="quality-decision-toggle" value={decision} disabled={saving} onChange={event => startDecision(event.target.value)} optionType="button" buttonStyle="solid"
            options={[{ value: 'approve', label: 'Duyệt hồ sơ' }, { value: 'reject', label: 'Từ chối / Phân loại lại' }]} />
          <Form form={form} layout="vertical" disabled={saving} key={selected.metricId}>
            {decision === 'approve' ? <>
              <Form.Item name="niche" label="Ngành hàng đã đối chiếu" extra="Chỉ chọn ngành hàng đang bật trong Quản lý lĩnh vực. Muốn bổ sung ngành hàng, hãy cập nhật danh mục tại đó."
                rules={[{ required: true, message: 'Chọn ngành hàng sau khi kiểm tra.' }, { validator: (_, value) => value && !niches.includes(value) ? Promise.reject(new Error('Vui lòng chọn ngành hàng có trong danh mục đang bật.')) : Promise.resolve() }]}>
                <Select showSearch allowClear loading={nichesLoading} options={niches.map(name => ({ value: name, label: name }))} placeholder={nichesLoading ? 'Đang tải ngành hàng…' : 'Chọn ngành hàng trong danh mục'} disabled={saving || nichesLoading || !niches.length} optionFilterProp="label" notFoundContent="Không có ngành hàng phù hợp trong danh mục" />
              </Form.Item>
              {!nichesLoading && !nichesError && !niches.length && <Typography.Paragraph type="secondary">Chưa có ngành hàng để chọn. Kiểm tra danh mục tại <Link to={`${basePath}/taxonomy`}>Quản lý lĩnh vực</Link>.</Typography.Paragraph>}
              {nichesError && <Alert type="warning" showIcon title="Không tải được danh mục ngành hàng" description={nichesError} action={<Button loading={nichesLoading} onClick={() => setNichesRetry(value => value + 1)}>Thử lại</Button>} />}
              <Alert type="info" showIcon title="Duyệt kết quả đã đối chiếu" description="Giữ nguyên phân loại KOC/KOL hiện tại và điểm tin cậy AI; lưu ngành hàng cùng người và thời điểm kiểm định. Nếu sai loại tài khoản, chọn Phân loại lại." />
            </> : <>
              <Form.Item name="reclassifiedType" label="Kết quả phân loại" rules={[{ required: true, message: 'Chọn kết quả kiểm định.' }]}>
                <Select options={[{ value: 'REJECTED', label: 'Từ chối — không đủ điều kiện nhà sáng tạo' }, { value: 'BRAND', label: 'Tài khoản thương mại / Nhãn hàng' }, ...(['KOC', 'KOL'].filter(type => type !== selected.creatorType).map(type => ({ value: type, label: `Phân loại lại thành ${type}` })))]} />
              </Form.Item>
              <Form.Item name="reason" label="Lý do và kết quả đối chiếu" rules={[{ required: true, whitespace: true, message: 'Ghi rõ lý do từ chối hoặc phân loại lại.' }, { max: 255, message: 'Tối đa 255 ký tự.' }]}>
                <Input.TextArea rows={3} maxLength={255} showCount placeholder="Ví dụ: Kênh bán hàng của thương hiệu, nội dung chủ yếu giới thiệu sản phẩm của cửa hàng…" />
              </Form.Item>
              <Alert type="warning" showIcon title="Kiểm tra kỹ kết quả trước khi lưu" description="Hồ sơ sẽ rời danh sách chờ kiểm định. Kết quả phân loại và lý do được ghi vào nhật ký; thao tác này không xóa hồ sơ gốc." />
            </>}
            <Form.Item name="checked" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Xác nhận đã kiểm tra hồ sơ trước khi lưu.')) }]}>
              <Checkbox>Tôi đã đối chiếu kênh, nội dung và kết quả phân loại của hồ sơ này.</Checkbox>
            </Form.Item>
          </Form>
        </section>
      </div>}
    </Drawer>
  </div>;
}
