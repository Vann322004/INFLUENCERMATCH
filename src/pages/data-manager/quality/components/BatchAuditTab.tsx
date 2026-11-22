import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  InputNumber,
  Radio,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { crawlerService } from '../../../../services/api/crawlerService';
import { PLATFORM_COLOR_MAP } from '../types';
import AuditEvidenceModal, { formatReason } from './AuditEvidenceModal';
import { auditOutcome } from '../../../../services/auditPresentation';

const { Text } = Typography;

export interface AuditItem {
  creatorId: string;
  platform: string;
  username: string;
  displayName: string;
  followers: number;
  oldConfidence: number;
  newConfidence: number;
  oldType: string;
  verdict: string;
  status: string;
  creatorType: string;
  isJunk: boolean;
  decision: string;
  reasonCodes: string[];
  postsChecked: number;
  actionTaken: string;
  profileUrl?: string;
  posts?: any[];
  bio?: string;
  contentSummary?: string;
}

interface AuditReport {
  runId: string;
  executedAt: string;
  dryRun: boolean;
  totalAudited: number;
  validCreators: number;
  kocCount: number;
  kolCount: number;
  junkOrShopCount: number;
  needsReviewCount?: number;
  cleanRate: number;
  averageDataConfidence: number;
  filter: {
    limit: number;
    offset: number;
    platform: string;
    category: string;
  };
  items: AuditItem[];
}

export function isJunkItem(r: AuditItem): boolean {
  if (r.isJunk) return true;
  if (r.status === 'JUNK_SHOP_CATALOG') return true;
  if (['BRAND', 'SPAM', 'ORGANIZATION'].includes(r.creatorType?.toUpperCase() || '')) return true;
  if (auditOutcome(r) === 'excluded') return true;
  return false;
}

export function isValidCreator(r: AuditItem): boolean {
  if (isJunkItem(r)) return false;
  if (r.status === 'VALID_KOC' || r.status === 'VALID_KOL') return true;
  if (r.verdict === 'KOC' || r.verdict === 'KOL') return true;
  if (auditOutcome(r) === 'valid') return true;
  return false;
}

export default function BatchAuditTab() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [platform, setPlatform] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [dryRun, setDryRun] = useState(false);
  const [autoQuarantine, setAutoQuarantine] = useState(true);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string>('');
  const [selected, setSelected] = useState<AuditItem | null>(null);
  const [tableFilter, setTableFilter] = useState<'all' | 'junk' | 'valid' | 'review'>('all');

  // Tải báo cáo thẩm định gần nhất
  const fetchLatestReport = async () => {
    try {
      const res = await crawlerService.getAuditReport();
      if (res && res.totalAudited) {
        setReport(res);
        if (typeof res.filter?.offset === 'number') {
          setOffset(res.filter.offset);
        }
        if (typeof res.filter?.limit === 'number') {
          setLimit(res.filter.limit);
        }
      }
    } catch {
      // Chưa có report trước đó thì bỏ qua
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestReport();
  }, []);

  const handleRunAudit = async (targetOffset: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await crawlerService.batchReclassify({
        limit,
        offset: targetOffset,
        platform: platform === 'ALL' ? undefined : platform,
        category: category === 'ALL' ? undefined : category,
        dry_run: dryRun,
        auto_quarantine: autoQuarantine,
      });

      setReport(res);
      setOffset(targetOffset);
      message.success(
        `Đã hoàn thành quét ${res.totalAudited} hồ sơ - Tỷ lệ sạch: ${res.cleanRate}% - Phát hiện ${res.junkOrShopCount || 0} tài khoản rác hoặc bán hàng`
      );
    } catch (err: any) {
      const msg = err.message || 'Lỗi khi kích hoạt quét dữ liệu hệ thống.';
      setError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const junkCount = useMemo(() => (report?.items || []).filter(isJunkItem).length, [report]);
  const validCount = useMemo(() => (report?.items || []).filter(isValidCreator).length, [report]);
  const reviewCount = useMemo(
    () => (report?.items || []).filter((r) => !isJunkItem(r) && !isValidCreator(r)).length,
    [report]
  );

  const displayedItems = useMemo(() => {
    if (!report?.items) return [];
    if (tableFilter === 'junk') return report.items.filter(isJunkItem);
    if (tableFilter === 'valid') return report.items.filter(isValidCreator);
    if (tableFilter === 'review') return report.items.filter((r) => !isJunkItem(r) && !isValidCreator(r));
    return report.items;
  }, [report, tableFilter]);

  const columns = [
    {
      title: 'Nhà sáng tạo',
      key: 'creator',
      width: 260,
      render: (_: any, r: AuditItem) => {
        const plat = (r.platform || 'TIKTOK').toLowerCase();
        const junk = isJunkItem(r);
        const valid = isValidCreator(r);

        return (
          <Space align="center" size={10}>
            <Avatar
              size={36}
              style={{
                backgroundColor: junk ? '#ef4444' : valid ? '#22c55e' : '#f59e0b',
                color: '#fff',
                fontWeight: 'bold',
              }}
            >
              {(r.displayName || r.username || '?').charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <Space size={4}>
                <Text strong style={{ fontSize: 13 }}>
                  @{r.username}
                </Text>
                <Tag color={PLATFORM_COLOR_MAP[plat] || 'blue'} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                  {r.platform}
                </Tag>
              </Space>
              <div
                style={{
                  color: '#64748b',
                  fontSize: 12,
                  maxWidth: 180,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.displayName || 'Không có tên hiển thị'}
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Người theo dõi',
      dataIndex: 'followers',
      key: 'followers',
      width: 120,
      render: (followers: number) => (
        <Text strong style={{ fontSize: 12 }}>
          {Number(followers || 0).toLocaleString('vi-VN')}
        </Text>
      ),
    },
    {
      title: 'Kết quả thẩm định',
      key: 'verdict',
      width: 200,
      render: (_: any, r: AuditItem) => {
        const junk = isJunkItem(r);
        const valid = isValidCreator(r);
        const reasonText = (r.reasonCodes || []).map(formatReason).join(', ') || 'Chưa có chi tiết';

        if (junk) {
          return (
            <Tooltip title={`Lý do: ${reasonText}`}>
              <Tag color="error" style={{ fontWeight: 600 }}>
                {r.creatorType === 'BRAND'
                  ? 'Gian hàng / Nhãn hàng'
                  : r.creatorType === 'ORGANIZATION'
                    ? 'Tài khoản tổ chức'
                    : 'Rác / Kênh bán hàng'}
              </Tag>
            </Tooltip>
          );
        }

        if (valid) {
          return (
            <Tag color="success" style={{ fontWeight: 600 }}>
              Đạt chuẩn
            </Tag>
          );
        }

        return (
          <Tooltip title={`Cần đối chiếu: ${reasonText}`}>
            <Tag color="warning" style={{ fontWeight: 600 }}>
              Cần xem xét
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Độ tin cậy dữ liệu',
      key: 'confidence',
      width: 170,
      render: (_: any, r: AuditItem) => {
        const oldPct = Math.round((r.oldConfidence || 0) * 100);
        const newPct = Math.round((r.newConfidence || 0) * 100);
        const diff = newPct - oldPct;
        return (
          <Space size={6}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {oldPct}%
            </Text>
            <span style={{ color: '#94a3b8' }}>→</span>
            <Text
              strong
              style={{
                fontSize: 13,
                color: newPct >= 70 ? '#16a34a' : newPct >= 40 ? '#d97706' : '#dc2626',
              }}
            >
              {newPct}%
            </Text>
            {diff !== 0 && (
              <Tag
                color={diff > 0 ? 'green' : 'red'}
                style={{ fontSize: 10, padding: '0 4px', margin: 0 }}
              >
                {diff > 0 ? `+${diff}%` : `${diff}%`}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Mẫu bài kiểm tra',
      dataIndex: 'postsChecked',
      key: 'postsChecked',
      width: 130,
      render: (count: number) => (
        <span style={{ fontSize: 12, color: '#475569' }}>
          {count > 0 ? `${count} bài gần nhất` : 'Chưa có bài'}
        </span>
      ),
    },
    {
      title: 'Trạng thái xử lý',
      dataIndex: 'actionTaken',
      key: 'actionTaken',
      width: 170,
      render: (act: string, row: AuditItem) => {
        if (report?.dryRun) {
          return <Tag color="purple">Chạy thử</Tag>;
        }
        if (act === 'QUARANTINED_IN_STAGING') {
          return (
            <Tag color="red" style={{ fontWeight: 600 }}>
              Đã cách ly
            </Tag>
          );
        }
        if (act === 'UPDATED_JAVA_BACKEND') {
          return <Tag color="cyan">Đã đồng bộ chuẩn</Tag>;
        }
        if (act === 'QUEUED_FOR_MANAGER_REVIEW') {
          return <Tag color="orange">Chờ duyệt</Tag>;
        }
        if (act === 'PRESERVED_MANAGER_DECISION') {
          return <Tag color="blue">Giữ quyết định cũ</Tag>;
        }
        return <Tag>{act || 'Đã kiểm tra'}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      render: (_: any, row: AuditItem) => (
        <Button size="small" onClick={() => setSelected(row)}>
          Xem bằng chứng
        </Button>
      ),
    },
  ];

  return (
    <section className="quality-crawler-box quality-batch-audit">
      <AuditEvidenceModal
        item={selected}
        runId={report?.runId || ''}
        onClose={() => setSelected(null)}
      />

      <header className="quality-config-title quality-batch-header" style={{ marginBottom: 20 }}>
        <div>
          <h2>Thanh lọc dữ liệu</h2>
          <p>
            Quét lại các tài khoản đã lưu trong hệ thống để phát hiện kênh bán hàng, quảng cáo rác hoặc nội dung sao chép,
            tự động cách ly và bảo vệ chất lượng dữ liệu trên sàn.
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchLatestReport} loading={loading}>
          Làm mới báo cáo
        </Button>
      </header>

      {/* Bộ điều khiển quét lọc rác */}
      <Card
        size="small"
        title={<span style={{ fontWeight: 600 }}>Cấu hình đợt quét & thanh lọc dữ liệu</span>}
        style={{
          marginBottom: 20,
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
        }}
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Quy mô mỗi đợt quét:
                </Text>
                <Select size="middle" value={limit} onChange={setLimit} style={{ width: '100%' }}>
                  <Select.Option value={20}>20 hồ sơ - Nhanh</Select.Option>
                  <Select.Option value={50}>50 hồ sơ - Tiêu chuẩn</Select.Option>
                  <Select.Option value={100}>100 hồ sơ - Quét sâu</Select.Option>
                  <Select.Option value={200}>200 hồ sơ - Đợt lớn</Select.Option>
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Vị trí bắt đầu quét:
                </Text>
                <Space.Compact style={{ width: '100%' }}>
                  <InputNumber
                    size="middle"
                    min={0}
                    value={offset}
                    onChange={(v) => setOffset(v || 0)}
                    style={{ width: '65%' }}
                    addonBefore="Hồ sơ #"
                  />
                  <Button size="middle" onClick={() => setOffset(0)} style={{ width: '35%' }}>
                    Về đầu
                  </Button>
                </Space.Compact>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Nền tảng mục tiêu:
                </Text>
                <Select size="middle" value={platform} onChange={setPlatform} style={{ width: '100%' }}>
                  <Select.Option value="ALL">Tất cả nền tảng</Select.Option>
                  <Select.Option value="TIKTOK">TikTok</Select.Option>
                  <Select.Option value="FACEBOOK">Facebook</Select.Option>
                  <Select.Option value="INSTAGRAM">Instagram</Select.Option>
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Ngành hàng cần rà soát:
                </Text>
                <Select size="middle" value={category} onChange={setCategory} style={{ width: '100%' }}>
                  <Select.Option value="ALL">Tất cả ngành hàng</Select.Option>
                  <Select.Option value="Beauty">Làm đẹp & Mỹ phẩm</Select.Option>
                  <Select.Option value="Fashion">Thời trang & Phụ kiện</Select.Option>
                  <Select.Option value="Food">Ẩm thực & Ăn uống</Select.Option>
                  <Select.Option value="Tech">Công nghệ & Điện thoại</Select.Option>
                  <Select.Option value="Lifestyle">Đời sống & Gia đình</Select.Option>
                </Select>
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col xs={24} md={13}>
              <Space wrap size="large">
                <Checkbox
                  checked={autoQuarantine}
                  onChange={(e) => setAutoQuarantine(e.target.checked)}
                >
                  <Tooltip title="Tài khoản bị phát hiện là kênh bán hàng, quảng cáo rác hoặc sao chép sẽ được chuyển trạng thái cách ly và ẩn khỏi sàn tìm kiếm.">
                    <Text strong style={{ color: '#dc2626' }}>
                      Tự động cách ly tài khoản rác
                    </Text>
                  </Tooltip>
                </Checkbox>
                <Checkbox checked={dryRun} onChange={(e) => setDryRun(e.target.checked)}>
                  <Tooltip title="Chỉ phân tích và hiển thị kết quả kiểm định, không cập nhật thay đổi vào hệ thống.">
                    <Text>Chạy thử nghiệm</Text>
                  </Tooltip>
                </Checkbox>
              </Space>
            </Col>

            <Col xs={24} md={11} style={{ textAlign: 'right' }}>
              <Space wrap>
                <Tag color="blue" style={{ fontSize: 12, padding: '4px 8px' }}>
                  Phạm vi: #{offset} → #{offset + limit}
                </Tag>
                <Button
                  type="primary"
                  loading={loading}
                  onClick={() => handleRunAudit(offset)}
                  style={{ backgroundColor: '#2563eb', fontWeight: 600 }}
                >
                  {dryRun ? `Chạy thử ${limit} hồ sơ` : `Quét & Lọc ${limit} hồ sơ`}
                </Button>
                <Button
                  disabled={loading}
                  onClick={() => handleRunAudit(offset + limit)}
                >
                  Đợt tiếp theo
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      {error && <Alert type="error" message={error} showIcon closable style={{ marginBottom: 16 }} />}

      {/* Kết quả tổng quan đợt quét */}
      {initialLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : report ? (
        <>
          {report.junkOrShopCount > 0 && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              message={`Phát hiện ${report.junkOrShopCount} tài khoản rác hoặc bán hàng trong đợt quét này!`}
              description={
                report.dryRun
                  ? 'Chế độ chạy thử nghiệm: Các tài khoản này chưa bị thay đổi trạng thái trong hệ thống.'
                  : autoQuarantine
                    ? 'Hệ thống đã tự động cách ly các tài khoản này để không hiển thị trên sàn tìm kiếm.'
                    : 'Tùy chọn tự động cách ly đang tắt. Các tài khoản này vẫn giữ nguyên trong hệ thống.'
              }
            />
          )}

          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={8} md={5}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
                <Statistic
                  title="Tổng hồ sơ đã quét"
                  value={report.totalAudited}
                  valueStyle={{ fontWeight: 700 }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={8} md={4}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
                <Statistic
                  title="Tỷ lệ sạch"
                  value={report.cleanRate}
                  suffix="%"
                  valueStyle={{
                    color: report.cleanRate >= 75 ? '#16a34a' : report.cleanRate >= 50 ? '#d97706' : '#dc2626',
                    fontWeight: 800,
                  }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
                <Statistic
                  title="Hồ sơ đạt chuẩn"
                  value={report.validCreators || (report.kocCount + report.kolCount)}
                  valueStyle={{ color: '#16a34a', fontWeight: 700 }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <Card
                size="small"
                style={{
                  borderRadius: 10,
                  textAlign: 'center',
                  backgroundColor: report.junkOrShopCount > 0 ? '#fef2f2' : '#fff',
                  borderColor: report.junkOrShopCount > 0 ? '#fecaca' : undefined,
                }}
              >
                <Statistic
                  title="Tài khoản rác & bán hàng"
                  value={report.junkOrShopCount}
                  valueStyle={{ color: '#dc2626', fontWeight: 800 }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
                <Statistic
                  title="Cần xem xét thêm"
                  value={report.needsReviewCount ?? reviewCount}
                  valueStyle={{ color: '#d97706', fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Bảng chi tiết kết quả kèm bộ lọc gọn gàng */}
          <Card
            title={
              <Space wrap size="middle">
                <span style={{ fontWeight: 600 }}>Chi tiết kết quả đợt quét:</span>
                <Tag color="blue">{report.runId}</Tag>
                {report.dryRun && <Tag color="purple">Chạy thử nghiệm</Tag>}
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Hồ sơ #{report.filter?.offset || 0} đến #{(report.filter?.offset || 0) + report.totalAudited}
                </span>
              </Space>
            }
            extra={
              <Radio.Group
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                size="small"
                buttonStyle="solid"
              >
                <Radio.Button value="all">Tất cả</Radio.Button>
                <Radio.Button value="junk">Rác & Bán hàng</Radio.Button>
                <Radio.Button value="valid">Đạt chuẩn</Radio.Button>
                {reviewCount > 0 && (
                  <Radio.Button value="review">Cần xem xét</Radio.Button>
                )}
              </Radio.Group>
            }
            size="small"
            style={{ borderRadius: 12, overflow: 'hidden' }}
          >
            <Table
              dataSource={displayedItems}
              columns={columns}
              rowKey="creatorId"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                locale: {
                  items_per_page: '/ trang',
                  jump_to: 'Đến trang',
                  page: '',
                  prev_page: 'Trang trước',
                  next_page: 'Trang sau',
                },
              }}
              scroll={{ x: 1000 }}
              size="middle"
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={`Không có hồ sơ nào trong mục "${tableFilter === 'junk'
                      ? 'Rác & Bán hàng'
                      : tableFilter === 'valid'
                        ? 'Đạt chuẩn'
                        : tableFilter === 'review'
                          ? 'Cần xem xét'
                          : 'Tất cả'
                      }"`}
                  />
                ),
              }}
            />
          </Card>
        </>
      ) : (
        <div className="quality-batch-empty" role="status">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu đợt quét nào" />
          <p style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
            Chọn số lượng hồ sơ và nhấn <strong>Quét & Lọc rác</strong> để bắt đầu thanh lọc dữ liệu.
          </p>
        </div>
      )}
    </section>
  );
}
