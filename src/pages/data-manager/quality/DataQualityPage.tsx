import CrawlerReviewList from './CrawlerReviewList';
import BatchAuditTab from './components/BatchAuditTab';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Checkbox,
  Empty,
  Form,
  Grid,
  Input,
  Pagination,
  Radio,
  Select,
  Skeleton,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { ExportOutlined, SearchOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { DATA_MANAGER_ROUTES } from '../../../constants/adminRoutes';
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
    ? `${Math.round(item.dataConfidence * 100)}%`
    : 'Chưa có';
}

function confidenceNumber(item: QualityItem) {
  return typeof item.dataConfidence === 'number' && Number.isFinite(item.dataConfidence)
    ? Math.round(item.dataConfidence * 100)
    : null;
}

/** Trả về string ngành hàng sạch (bỏ UNKNOWN), hỗ trợ cả chuỗi CSV */
function reviewedNiche(value?: string) {
  const niche = value?.trim() || '';
  return niche.toUpperCase() === 'UNKNOWN' ? '' : niche;
}

/** Parse CSV niche string → array (loại UNKNOWN, bỏ trống) */
function parseNiches(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s.toUpperCase() !== 'UNKNOWN');
}

/** Join array → CSV string để gửi lên backend */
function joinNiches(values: string[]): string {
  return values.join(', ');
}

function creatorTypeLabel(type?: string) {
  const normalized = (type || '').trim().toUpperCase();
  if (!normalized || normalized === 'KOC' || normalized === 'KOL') return 'Nhà sáng tạo';
  if (normalized === 'BRAND') return 'Nhãn hàng / Thương mại';
  return 'Nhà sáng tạo';
}

function collectedAt(value: string) {
  if (!value || Number.isNaN(Date.parse(value))) return 'Chưa có thời gian thu thập';
  return new Date(value).toLocaleString('vi-VN');
}

function channelUrl(item: QualityItem) {
  try {
    const url = new URL(item.profileUrl);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function CreatorIdentity({ item, showRole = false }: { item: QualityItem; showRole?: boolean }) {
  const handle = item.userName?.replace(/^@+/, '');
  const platformKey = item.platform?.toLowerCase() || '';

  return (
    <div className="quality-creator">
      <Avatar size={38} src={item.avatarUrl || undefined}>
        {(item.displayName || item.userName || '?').charAt(0)}
      </Avatar>
      <div>
        <strong>{item.displayName || item.userName}</strong>
        <div className="quality-creator-meta">
          <span>@{handle}</span>
          {item.platform && (
            <Tag color={PLATFORM_COLOR_MAP[platformKey]} className="quality-platform-tag">
              {item.platform}
            </Tag>
          )}
          {showRole && <span className="quality-role-chip">{creatorTypeLabel(item.creatorType)}</span>}
        </div>
      </div>
    </div>
  );
}

export default function DataQualityPage() {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();

  const [activeTab, setActiveTab] = useState<'pending' | 'crawler' | 'batch-audit'>('pending');
  const [items, setItems] = useState<QualityItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<QualityItem | null>(null);
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  const [saving, setSaving] = useState(false);
  const [niches, setNiches] = useState<string[]>([]);
  const [nichesError, setNichesError] = useState('');
  const [nichesLoading, setNichesLoading] = useState(false);
  const [nichesRetry, setNichesRetry] = useState(0);
  const [form] = Form.useForm();
  const requestVersion = useRef(0);
  const savingRef = useRef(false);

  const selectProfile = useCallback(
    (item: QualityItem) => {
      if (savingRef.current) return;
      setNichesError('');
      form.resetFields();
      form.setFieldsValue({
        niches: parseNiches(item.niche),
        reclassifiedType: 'REJECTED',
        reason: '',
        checked: false,
      });
      setDecision('approve');
      setSelected(item);
    },
    [form]
  );

  useEffect(() => {
    let active = true;
    const version = ++requestVersion.current;
    setLoading(true);
    setError('');
    dataQualityService
      .pending(page - 1, pageSize)
      .then((result) => {
        if (!active || version !== requestVersion.current) return;
        if (!result.items.length && result.totalElements > 0 && page > result.totalPages) {
          setPage(Math.max(1, result.totalPages));
          return;
        }
        setItems(result.items);
        setTotal(result.totalElements);
      })
      .catch((err) => {
        if (!active || version !== requestVersion.current) return;
        setItems([]);
        setTotal(null);
        setError(errorText(err));
      })
      .finally(() => {
        if (active && version === requestVersion.current) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, pageSize, refreshKey]);

  const normalizedQuery = searchQuery.trim().toLowerCase().replace(/^@+/, '');
  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        if (platformFilter !== 'ALL' && (item.platform || '').toUpperCase() !== platformFilter) {
          return false;
        }
        if (!normalizedQuery) return true;
        return (
          (item.displayName || '').toLowerCase().includes(normalizedQuery) ||
          (item.userName || '').toLowerCase().includes(normalizedQuery) ||
          reviewedNiche(item.niche).toLowerCase().includes(normalizedQuery) ||
          parseNiches(item.niche).some((n) => n.toLowerCase().includes(normalizedQuery))
        );
      }),
    [items, platformFilter, normalizedQuery]
  );

  useEffect(() => {
    if (loading) return;
    if (!visibleItems.length) {
      if (selected) setSelected(null);
      return;
    }
    if (!selected || !visibleItems.some((item) => item.metricId === selected.metricId)) {
      selectProfile(visibleItems[0]);
    }
  }, [loading, visibleItems, selected, selectProfile]);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    setNichesError('');
    setNichesLoading(true);
    nicheService.list.invalidate();
    nicheService
      .list()
      .then((records) => {
        if (!active) return;
        if (
          !Array.isArray(records) ||
          !records.every((item) => typeof item.name === 'string' && typeof item.active === 'boolean')
        ) {
          throw new Error('Invalid taxonomy response');
        }
        const names = records.filter((item) => item.active && reviewedNiche(item.name)).map((item) => item.name);
        setNiches(names);
        const currentValues: string[] = form.getFieldValue('niches') || [];
        const validValues = currentValues.filter((v) => names.includes(v));
        form.setFieldValue('niches', validValues.length ? validValues : undefined);
      })
      .catch((err) => {
        if (!active) return;
        setNiches([]);
        const status = err?.response?.status;
        setNichesError(
          status === 403
            ? 'Tài khoản chưa có quyền đọc danh mục ngành hàng.'
            : status === 404
              ? 'Máy chủ chưa hỗ trợ API danh mục ngành hàng.'
              : 'Không kết nối được danh mục ngành hàng. Vui lòng thử lại.'
        );
      })
      .finally(() => {
        if (active) setNichesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selected, form, nichesRetry]);

  const startDecision = (next: 'approve' | 'reject') => {
    form.setFieldValue('checked', false);
    setDecision(next);
  };

  const submitDecision = async () => {
    if (!selected || savingRef.current) return;
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      if (decision === 'approve') await dataQualityService.approve(selected.metricId, joinNiches(values.niches));
      else await dataQualityService.reject(selected.metricId, values.reason, values.reclassifiedType);
      message.success(
        decision === 'approve'
          ? `Đã duyệt hồ sơ @${selected.userName} với ngành hàng: ${joinNiches(values.niches)}.`
          : `Đã ghi nhận kết quả kiểm định hồ sơ @${selected.userName}.`
      );
      setSelected(null);
      if (items.length === 1 && page > 1) setPage((current) => current - 1);
      else setRefreshKey((current) => current + 1);
    } catch (err: any) {
      message.error(errorText(err));
      if (err?.response?.status === 409) {
        setSelected(null);
        setRefreshKey((current) => current + 1);
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const columns: TableColumnsType<QualityItem> = [
    {
      title: 'Nhà sáng tạo',
      key: 'creator',
      render: (_, item) => <CreatorIdentity item={item} />,
    },
    {
      title: 'Ngành & Tin cậy',
      dataIndex: 'niche',
      width: 155,
      render: (value, item) => {
        const parts = parseNiches(value);
        const score = confidenceNumber(item);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
            {parts.length > 0 ? (
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {parts.map((p) => (
                  <span key={p} className="quality-niche-pill">{p}</span>
                ))}
              </span>
            ) : (
              <span className="quality-niche-pill is-empty">Chưa phân loại</span>
            )}
            <span className={`quality-confidence-badge ${score !== null && score < 70 ? 'is-low' : ''}`}>
              {score !== null ? `Tin cậy ${score}%` : 'Chưa có'}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Nội dung thu thập',
      dataIndex: 'contentSummary',
      render: (value) => (
        <Typography.Paragraph
          ellipsis={{ rows: 2, tooltip: true }}
          className={`quality-content-preview ${value ? '' : 'is-empty'}`}
        >
          {value || 'Chưa có nội dung'}
        </Typography.Paragraph>
      ),
    },
  ];

  const selectedUrl = selected ? channelUrl(selected) : undefined;
  const selectedNiches = selected ? parseNiches(selected.niche) : [];

  return (
    <div className="data-quality-page">
      {/* Header matching CollectionJobsPage */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Kiểm định chất lượng nhà sáng tạo</span>
          </div>
          <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
            Xem dữ liệu thu thập, đối chiếu nội dung kênh và xác nhận phân loại cho từng hồ sơ.
          </div>
        </div>

        <Space wrap>
          <Button
            loading={loading}
            disabled={saving}
            onClick={() => setRefreshKey((current) => current + 1)}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            Làm mới dữ liệu
          </Button>
        </Space>
      </div>

      {/* Outer Card + Tabs matching CollectionJobsPage */}
      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{ borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as typeof activeTab)}
          size="middle"
          tabBarStyle={{
            padding: '0 20px',
            marginBottom: 0,
            borderBottom: '1px solid #EEF0F6',
            background: '#FAFAFD',
          }}
          items={[
            {
              key: 'pending',
              label: <span style={{ fontWeight: 700, fontSize: 14 }}>Hồ sơ chờ duyệt ngành</span>,
              children: (
                <div style={{ padding: '24px 24px 32px' }}>
                  <section className="quality-workspace">
                    {/* Left Main Column */}
                    <div className="quality-config-main">
                      <header className="quality-config-title">
                        <h2>Hồ sơ chờ phân loại & duyệt ngành</h2>
                        <p>
                          Các hồ sơ nhà sáng tạo đã thu thập đủ dữ liệu. Quản lý kiểm tra và duyệt ngành hàng để chính
                          thức đưa nhà sáng tạo lên sàn tìm kiếm.
                        </p>
                      </header>

                      <div className="quality-filter-box">
                        <Select
                          aria-label="Lọc nền tảng"
                          value={platformFilter}
                          onChange={setPlatformFilter}
                          size="large"
                          className="quality-filter-platform"
                          options={[
                            { value: 'ALL', label: 'Tất cả nền tảng' },
                            { value: 'TIKTOK', label: 'TikTok' },
                            { value: 'FACEBOOK', label: 'Facebook' },
                            { value: 'INSTAGRAM', label: 'Instagram' },
                          ]}
                        />
                        <Input
                          allowClear
                          size="large"
                          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                          placeholder="Tìm theo tên, @username hoặc ngành hàng…"
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          disabled={loading && !items.length}
                          className="quality-filter-search"
                        />
                      </div>

                      <div className="quality-table-area">
                        {error ? (
                          <Alert
                            type="error"
                            showIcon
                            title="Không tải được danh sách kiểm định"
                            description={error}
                            action={<Button onClick={() => setRefreshKey((current) => current + 1)}>Thử lại</Button>}
                          />
                        ) : loading ? (
                          <Skeleton active paragraph={{ rows: 6 }} />
                        ) : !items.length ? (
                          <Empty description="Không có hồ sơ đang chờ kiểm định">
                            <Link to={DATA_MANAGER_ROUTES.JOBS}>Đến trang thu thập dữ liệu</Link>
                          </Empty>
                        ) : !visibleItems.length ? (
                          <Empty description="Không tìm thấy hồ sơ khớp bộ lọc hiện tại.">
                            <Button
                              onClick={() => {
                                setSearchQuery('');
                                setPlatformFilter('ALL');
                              }}
                            >
                              Xóa bộ lọc
                            </Button>
                          </Empty>
                        ) : screens.xl ? (
                          <Table
                            rowKey="metricId"
                            columns={columns}
                            dataSource={visibleItems}
                            pagination={false}
                            size="middle"
                            rowClassName={(record) =>
                              selected?.metricId === record.metricId ? 'quality-row is-selected-row' : 'quality-row'
                            }
                            onRow={(record) => ({
                              onClick: () => {
                                if (selected?.metricId !== record.metricId) {
                                  selectProfile(record);
                                }
                              },
                            })}
                          />
                        ) : (
                          <div className="quality-profile-cards">
                            {visibleItems.map((item) => {
                              const nicheParts = parseNiches(item.niche);
                              const score = confidenceNumber(item);
                              const isSelected = selected?.metricId === item.metricId;
                              return (
                                <article
                                  key={item.metricId}
                                  className={`quality-profile-card ${isSelected ? 'is-selected' : ''}`}
                                  onClick={() => {
                                    if (!isSelected) selectProfile(item);
                                  }}
                                >
                                  <CreatorIdentity item={item} />
                                  <div className="quality-card-facts">
                                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                      {nicheParts.length > 0
                                        ? nicheParts.slice(0, 2).map((p) => (
                                            <span key={p} className="quality-niche-pill" style={{ fontSize: 11 }}>{p}</span>
                                          ))
                                        : <span className="quality-niche-pill is-empty">Chưa phân loại</span>}
                                    </span>
                                    <span className={`quality-confidence-badge ${score !== null && score < 70 ? 'is-low' : ''}`}>
                                      Tin cậy AI: {score !== null ? `${score}%` : 'Chưa có'}
                                    </span>
                                  </div>
                                  <p>{item.contentSummary || 'Chưa có nội dung thu thập.'}</p>
                                  <div className="quality-card-footer">
                                    <Typography.Text type="secondary">{collectedAt(item.collectedAt)}</Typography.Text>
                                    <span className="quality-card-select-hint">
                                      {isSelected ? 'Đang chọn' : 'Chọn kiểm định'}
                                    </span>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        )}

                        {!error && total !== null && total > 0 && (
                          <Pagination
                            className="quality-pagination"
                            current={page}
                            pageSize={pageSize}
                            total={total}
                            showSizeChanger={false}
                            disabled={loading || saving}
                            onChange={setPage}
                            showTotal={(count) => `${count} hồ sơ`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Right Sidebar Column */}
                    <aside className="quality-config-sidebar">
                      <div className="quality-sidebar-body">
                        <div className="quality-sidebar-heading">
                          <h3>Kiểm định hồ sơ</h3>
                          <p className="quality-sidebar-copy">Đối chiếu kênh và xác nhận kết quả phân loại.</p>
                        </div>

                        {!selected ? (
                          <div className="quality-scope-card quality-scope-empty">
                            <p>
                              Chọn một hồ sơ ở danh sách bên trái để xem nội dung thu thập và ghi nhận quyết định kiểm
                              định.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="quality-scope-card">
                              <div className="quality-scope-top">
                                <CreatorIdentity item={selected} showRole />
                                {selectedUrl ? (
                                  <Button
                                    size="small"
                                    href={selectedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    icon={<ExportOutlined />}
                                  >
                                    Mở kênh
                                  </Button>
                                ) : (
                                  <span className="quality-no-url">Chưa có link</span>
                                )}
                              </div>
                              <div className="quality-evidence-snippet">
                                {selected.contentSummary || 'Chưa có nội dung thu thập. Mở kênh để kiểm tra trực tiếp.'}
                              </div>
                            </div>

                            <div className="quality-summary-list">
                              <div className="quality-summary-row">
                                <span>Ngành hàng AI gợi ý</span>
                                <strong className={selectedNiches.length ? '' : 'is-muted'} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                  {selectedNiches.length
                                    ? selectedNiches.map((n) => <span key={n} className="quality-niche-pill" style={{ fontSize: 12 }}>{n}</span>)
                                    : 'Chưa phân loại'}
                                </strong>
                              </div>
                              <div className="quality-summary-row">
                                <span>Độ tin cậy AI</span>
                                <strong>{confidence(selected)}</strong>
                              </div>
                              <div className="quality-summary-row">
                                <span>Thời gian thu thập</span>
                                <strong>{collectedAt(selected.collectedAt)}</strong>
                              </div>
                            </div>

                            <div className="quality-decision-card">
                              <Radio.Group
                                className="quality-decision-toggle"
                                value={decision}
                                disabled={saving}
                                onChange={(event) => startDecision(event.target.value)}
                                optionType="button"
                                buttonStyle="solid"
                                options={[
                                  { value: 'approve', label: 'Duyệt hồ sơ' },
                                  { value: 'reject', label: 'Từ chối' },
                                ]}
                              />

                              <Form form={form} layout="vertical" disabled={saving} key={selected.metricId}>
                                {decision === 'approve' ? (
                                  <>
                                    <Form.Item
                                      name="niches"
                                      label="Ngành hàng đã đối chiếu"
                                      extra="Có thể chọn nhiều ngành (ví dụ: Lifestyle + Công nghệ)"
                                      rules={[
                                        {
                                          required: true,
                                          type: 'array',
                                          min: 1,
                                          message: 'Chọn ít nhất 1 ngành hàng sau khi kiểm tra.',
                                        },
                                        {
                                          validator: (_, values: string[]) => {
                                            const invalid = (values || []).filter((v) => !niches.includes(v));
                                            return invalid.length
                                              ? Promise.reject(new Error(`Ngành hàng không hợp lệ: ${invalid.join(', ')}`))
                                              : Promise.resolve();
                                          },
                                        },
                                      ]}
                                    >
                                      <Select
                                        mode="multiple"
                                        showSearch
                                        allowClear
                                        loading={nichesLoading}
                                        options={niches.map((name) => ({ value: name, label: name }))}
                                        placeholder={nichesLoading ? 'Đang tải ngành hàng…' : 'Chọn 1 hoặc nhiều ngành hàng…'}
                                        disabled={saving || nichesLoading || !niches.length}
                                        optionFilterProp="label"
                                        notFoundContent="Không có ngành hàng phù hợp"
                                        maxTagCount="responsive"
                                      />
                                    </Form.Item>
                                    {!nichesLoading && !nichesError && !niches.length && (
                                      <p className="quality-niche-fallback">
                                        Chưa có ngành hàng. Kiểm tra tại{' '}
                                        <Link to={DATA_MANAGER_ROUTES.TAXONOMY}>Quản lý lĩnh vực</Link>.
                                      </p>
                                    )}
                                    {nichesError && (
                                      <Alert
                                        type="warning"
                                        showIcon
                                        style={{ marginBottom: 12 }}
                                        title={nichesError}
                                        action={
                                          <Button
                                            size="small"
                                            loading={nichesLoading}
                                            onClick={() => setNichesRetry((value) => value + 1)}
                                          >
                                            Thử lại
                                          </Button>
                                        }
                                      />
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <Form.Item
                                      name="reclassifiedType"
                                      label="Kết quả phân loại"
                                      rules={[{ required: true, message: 'Chọn kết quả kiểm định.' }]}
                                    >
                                      <Select
                                        options={[
                                          { value: 'REJECTED', label: 'Từ chối — không đủ điều kiện nhà sáng tạo' },
                                          { value: 'BRAND', label: 'Tài khoản thương mại / Nhãn hàng' },
                                        ]}
                                      />
                                    </Form.Item>
                                    <Form.Item
                                      name="reason"
                                      label="Lý do từ chối"
                                      rules={[
                                        { required: true, whitespace: true, message: 'Ghi rõ lý do từ chối.' },
                                        { max: 255, message: 'Tối đa 255 ký tự.' },
                                      ]}
                                    >
                                      <Input.TextArea
                                        rows={3}
                                        maxLength={255}
                                        showCount
                                        placeholder="Ví dụ: Kênh bán hàng, nội dung chủ yếu quảng cáo sản phẩm…"
                                      />
                                    </Form.Item>
                                  </>
                                )}
                                <Form.Item
                                  name="checked"
                                  valuePropName="checked"
                                  rules={[
                                    {
                                      validator: (_, value) =>
                                        value
                                          ? Promise.resolve()
                                          : Promise.reject(new Error('Xác nhận đã đối chiếu hồ sơ.')),
                                    },
                                  ]}
                                >
                                  <Checkbox>Tôi đã đối chiếu kênh và nội dung hồ sơ này.</Checkbox>
                                </Form.Item>
                              </Form>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="quality-start-section">
                        <Button
                          type="primary"
                          danger={decision === 'reject'}
                          size="large"
                          block
                          loading={saving}
                          disabled={!selected || loading}
                          onClick={submitDecision}
                        >
                          {saving
                            ? 'Đang lưu…'
                            : decision === 'reject'
                              ? 'Xác nhận từ chối'
                              : 'Xác nhận duyệt hồ sơ'}
                        </Button>
                        <p className={selected ? 'quality-ready-hint' : 'quality-start-hint'} aria-live="polite">
                          {!selected
                            ? 'Chọn một hồ sơ bên trái để bắt đầu.'
                            : decision === 'reject'
                              ? 'Hồ sơ sẽ rời danh sách chờ kiểm định.'
                              : 'Lưu ngành hàng và duyệt hồ sơ vào hệ thống.'}
                        </p>
                      </div>
                    </aside>
                  </section>
                </div>
              ),
            },
            {
              key: 'crawler',
              label: <span style={{ fontWeight: 700, fontSize: 14 }}>Kênh mới phát hiện</span>,
              children: (
                <div style={{ padding: '24px 24px 32px' }}>
                  <CrawlerReviewList refreshKey={refreshKey} />
                </div>
              ),
            },
            {
              key: 'batch-audit',
              label: <span style={{ fontWeight: 700, fontSize: 14 }}>Thanh lọc dữ liệu</span>,
              children: (
                <div style={{ padding: '24px 24px 32px' }}>
                  <BatchAuditTab />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
