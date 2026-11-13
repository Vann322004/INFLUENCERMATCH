import CrawlerReviewList from './CrawlerReviewList';
import { useEffect, useRef, useState } from 'react';
import { Alert, App, AutoComplete, Avatar, Button, Card, Descriptions, Drawer, Empty, Form, Grid, Input, Modal, Pagination, Select, Skeleton, Steps, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { CheckOutlined, CloseOutlined, ExportOutlined, ReloadOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { dataQualityService } from '../../../services/api/dataQualityService';
import apiClient from '../../../services/apiClient';
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
      <div className="quality-creator-meta"><span>@{item.userName}</span><Tag color={PLATFORM_COLOR_MAP[item.platform?.toLowerCase()]}>{item.platform}</Tag></div>
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
  const [form] = Form.useForm();
  const requestVersion = useRef(0);

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
    apiClient.get('/taxonomies/niches').then(response => {
      if (!active) return;
      const names = response.data?.data ?? response.data;
      if (!Array.isArray(names) || !names.every(name => typeof name === 'string')) throw new Error('Invalid taxonomy response');
      setNiches(names);
    }).catch(() => {
      if (!active) return;
      setNiches([]);
      setNichesError('Không tải được gợi ý ngành hàng. Bạn vẫn có thể nhập kết quả sau khi đối chiếu kênh.');
    });
    return () => { active = false; };
  }, [selected]);

  const startDecision = (next: 'approve' | 'reject') => {
    form.resetFields();
    form.setFieldsValue({ niche: selected?.niche || '', reclassifiedType: 'REJECTED', reason: '' });
    setDecision(next);
  };

  const submitDecision = async () => {
    if (!selected || !decision || saving) return;
    let values;
    try { values = await form.validateFields(); } catch { return; }
    setSaving(true);
    try {
      if (decision === 'approve') await dataQualityService.approve(selected.metricId, values.niche);
      else await dataQualityService.reject(selected.metricId, values.reason, values.reclassifiedType);
      message.success(decision === 'approve' ? `Đã duyệt phân loại KOC cho @${selected.userName}.` : `Đã ghi nhận từ chối hồ sơ @${selected.userName}.`);
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
    } finally { setSaving(false); }
  };

  const columns: TableColumnsType<QualityItem> = [
    { title: 'Nhà sáng tạo', key: 'creator', width: 280, render: (_, item) => <CreatorIdentity item={item} /> },
    { title: 'Ngành hàng AI gợi ý', dataIndex: 'niche', width: 180, render: value => value || 'Chưa phân loại' },
    { title: 'Độ tin cậy AI', key: 'confidence', width: 130, render: (_, item) => <Tag color="orange">{confidence(item)}</Tag> },
    { title: 'Nội dung thu thập', dataIndex: 'contentSummary', render: value => <Typography.Paragraph ellipsis={{ rows: 2, tooltip: true }} style={{ margin: 0 }}>{value || 'Chưa có nội dung'}</Typography.Paragraph> },
    { title: 'Thao tác', key: 'action', width: 130, render: (_, item) => <Button type="primary" onClick={() => setSelected(item)}>Kiểm định</Button> },
  ];

  return <div className="data-quality-page">
    <div className="quality-page-heading">
      <div><Typography.Title level={3}>Kiểm định chất lượng KOC</Typography.Title>
        <Typography.Paragraph type="secondary">Xem dữ liệu thu thập, kiểm tra phân loại AI và ghi nhận quyết định cho từng hồ sơ.</Typography.Paragraph></div>
      <Button icon={<ReloadOutlined />} loading={loading} disabled={saving} onClick={() => setRefreshKey(current => current + 1)}>Làm mới</Button>
    </div>
    <CrawlerReviewList refreshKey={refreshKey} />
    <Card className="quality-workflow">
      <Steps size="small" responsive items={[{ title: 'Chọn hồ sơ' }, { title: 'Đối chiếu nội dung kênh' }, { title: 'Duyệt hoặc từ chối' }]} />
    </Card>
    <Card className="quality-review-list">
      <div className="quality-list-heading"><div><Typography.Title level={4}>Hồ sơ chờ kiểm định</Typography.Title>
        <Typography.Text type="secondary">Các bản thu thập mới nhất được AI phân loại KOC với độ tin cậy dưới 70%, chưa được kiểm định.</Typography.Text></div>
        <Tag color="orange">{total === null ? 'Chưa tải dữ liệu' : `${total} hồ sơ`}</Tag></div>
      {error ? <Alert type="error" showIcon title="Không tải được danh sách kiểm định" description={error} action={<Button onClick={() => setRefreshKey(current => current + 1)}>Thử lại</Button>} />
        : loading ? <Skeleton active paragraph={{ rows: 6 }} />
        : !items.length ? <Empty description="Không có hồ sơ đang chờ kiểm định"><Link to={`${basePath}/jobs`}>Đến trang thu thập dữ liệu</Link></Empty>
        : screens.xl ? <Table rowKey="metricId" columns={columns} dataSource={items} pagination={false} tableLayout="fixed" scroll={{ x: 900 }} />
        : <div className="quality-profile-cards">{items.map(item => <article className="quality-profile-card" key={item.metricId}>
          <CreatorIdentity item={item} />
          <div className="quality-card-facts"><span>{item.niche || 'Chưa phân loại'}</span><Tag color="orange">Tin cậy AI: {confidence(item)}</Tag></div>
          <p>{item.contentSummary || 'Chưa có nội dung thu thập.'}</p>
          <div className="quality-card-footer"><Typography.Text type="secondary">{collectedAt(item.collectedAt)}</Typography.Text><Button type="primary" onClick={() => setSelected(item)}>Kiểm định</Button></div>
        </article>)}</div>}
      {!error && total !== null && total > 0 && <Pagination className="quality-pagination" current={page} pageSize={pageSize} total={total} showSizeChanger={false} disabled={loading || saving} onChange={setPage} showTotal={count => `${count} hồ sơ`} />}
    </Card>
    <Drawer title="Kiểm định hồ sơ KOC" open={!!selected} onClose={() => { if (!saving && !decision) setSelected(null); }} size={screens.md ? 620 : '100%'}
      footer={<div className="quality-review-actions"><Button danger icon={<CloseOutlined />} disabled={saving} onClick={() => startDecision('reject')}>Từ chối / Phân loại lại</Button><Button type="primary" icon={<CheckOutlined />} disabled={saving} onClick={() => startDecision('approve')}>Duyệt KOC</Button></div>}>
      {selected && <div className="quality-review-detail">
        <CreatorIdentity item={selected} />
        {channelUrl(selected) ? <Button href={channelUrl(selected)} target="_blank" rel="noopener noreferrer" icon={<ExportOutlined />}>Mở kênh để đối chiếu</Button> : <Alert type="warning" title="Hồ sơ chưa có đường dẫn kênh hợp lệ." />}
        <Descriptions column={1} bordered size="small" items={[
          { key: 'niche', label: 'Ngành hàng AI gợi ý', children: selected.niche || 'Chưa phân loại' },
          { key: 'confidence', label: 'Độ tin cậy AI', children: confidence(selected) },
          { key: 'collected', label: 'Thu thập lúc', children: collectedAt(selected.collectedAt) },
        ]} />
        <section><Typography.Title level={5}>Nội dung đã thu thập</Typography.Title><p className="quality-evidence">{selected.contentSummary || 'Chưa có nội dung. Mở kênh để kiểm tra trước khi quyết định.'}</p></section>
        <Alert type="info" showIcon title="Kiểm tra trước khi duyệt" description="Đối chiếu kênh và nội dung với ngành hàng được đề xuất. Nếu là tài khoản thương mại hoặc phân loại sai, chọn từ chối và ghi rõ lý do." />
      </div>}
    </Drawer>
    <Modal title={decision === 'approve' ? 'Xác nhận duyệt KOC' : 'Từ chối hoặc phân loại lại'} open={!!decision} onCancel={() => { if (!saving) setDecision(null); }} onOk={submitDecision} confirmLoading={saving} okText={decision === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'} cancelText="Quay lại" cancelButtonProps={{ disabled: saving }} closable={!saving} maskClosable={!saving} okButtonProps={{ danger: decision === 'reject' }}>
      <Typography.Paragraph>Hồ sơ: <strong>@{selected?.userName}</strong></Typography.Paragraph>
      <Form form={form} layout="vertical" disabled={saving}>
        {decision === 'approve' ? <>
          <Form.Item name="niche" label="Ngành hàng đã đối chiếu" rules={[{ required: true, whitespace: true, message: 'Chọn hoặc nhập ngành hàng sau khi kiểm tra.' }, { max: 120, message: 'Tối đa 120 ký tự.' }]}>
            <AutoComplete options={niches.map(name => ({ value: name }))} placeholder="Chọn hoặc nhập ngành hàng" filterOption={(input, option) => String(option?.value || '').toLowerCase().includes(input.toLowerCase())} />
          </Form.Item>
          {nichesError && <Typography.Paragraph type="secondary">{nichesError}</Typography.Paragraph>}
          <Typography.Paragraph type="secondary">Quyết định được lưu cho bản thu thập này; điểm tin cậy AI được giữ nguyên.</Typography.Paragraph>
        </> : <>
          <Form.Item name="reclassifiedType" label="Kết quả phân loại" rules={[{ required: true }]}><Select options={[{ value: 'REJECTED', label: 'Không đủ điều kiện KOC' }, { value: 'BRAND', label: 'Tài khoản thương mại / Nhãn hàng' }, { value: 'KOL', label: 'Phân loại lại thành KOL' }]} /></Form.Item>
          <Form.Item name="reason" label="Lý do từ chối" rules={[{ required: true, whitespace: true, message: 'Nhập lý do để lưu kết quả kiểm định.' }, { max: 255, message: 'Tối đa 255 ký tự.' }]}><Input.TextArea rows={3} maxLength={255} showCount placeholder="Ghi rõ kết quả đối chiếu nội dung kênh" /></Form.Item>
        </>}
      </Form>
    </Modal>
  </div>;
}
