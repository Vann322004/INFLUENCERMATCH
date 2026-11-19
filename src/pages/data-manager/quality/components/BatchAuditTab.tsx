import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  InputNumber,
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
import { crawlerService } from '../../../../services/api/crawlerService';
import { PLATFORM_COLOR_MAP } from '../types';

const { Text, Title } = Typography;

interface AuditItem {
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

export default function BatchAuditTab() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [platform, setPlatform] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [dryRun, setDryRun] = useState(false);
  const [autoQuarantine, setAutoQuarantine] = useState(true);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string>('');

  // Tải báo cáo thẩm định gần nhất
  const fetchLatestReport = async () => {
    try {
      const res = await crawlerService.getAuditReport();
      if (res && res.totalAudited) {
        setReport(res);
        if (typeof res.filter?.offset === 'number') {
          setOffset(res.filter.offset);
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
        `Đã hoàn thành đợt quét ${res.totalAudited} hồ sơ (Sạch: ${res.cleanRate}%)`
      );
    } catch (err: any) {
      const msg = err.message || 'Lỗi khi kích hoạt quét thẩm định dữ liệu.';
      setError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Nhà sáng tạo',
      key: 'creator',
      width: 260,
      render: (_: any, r: AuditItem) => {
        const plat = (r.platform || 'TIKTOK').toLowerCase();
        return (
          <Space align="center">
            <Avatar
              size={36}
              style={{ backgroundColor: r.isJunk ? '#ff4d4f' : '#1890ff' }}
            >{(r.displayName || r.username || '?').charAt(0).toUpperCase()}</Avatar>
            <div>
              <Space orientation="horizontal" size={4}>
                <Text strong style={{ fontSize: 13 }}>
                  @{r.username}
                </Text>
                <Tag color={PLATFORM_COLOR_MAP[plat] || 'blue'} style={{ fontSize: 10, padding: '0 4px' }}>
                  {r.platform}
                </Tag>
              </Space>
              <div style={{ color: '#8c8c8c', fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
      width: 110,
      render: (followers: number) => (
        <Text style={{ fontSize: 12 }}>
          {Number(followers || 0).toLocaleString('vi-VN')}
        </Text>
      ),
    },
    {
      title: 'Kết quả kiểm định',
      key: 'verdict',
      width: 180,
      render: (_: any, r: AuditItem) => {
        if (r.status === 'VALID_KOC') {
          return (
            <Tag color="success">
              Người tiêu dùng có ảnh hưởng
            </Tag>
          );
        }
        if (r.status === 'VALID_KOL') {
          return (
            <Tag color="purple">
              Người có sức ảnh hưởng
            </Tag>
          );
        }
        return (
          <Tooltip title={`Lý do: ${(r.reasonCodes || []).join(', ') || 'Tài khoản bán hàng hoặc giới thiệu sản phẩm'}`}>
            <Tag color="error">
              Bán hàng / Nội dung rác
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Điểm tin cậy',
      key: 'confidence',
      width: 200,
      render: (_: any, r: AuditItem) => {
        const oldPct = Math.round((r.oldConfidence || 0) * 100);
        const newPct = Math.round((r.newConfidence || 0) * 100);
        const diff = newPct - oldPct;
        return (
          <Space orientation="horizontal" size={6}>
            <Text type="secondary" style={{ fontSize: 12 }}>{oldPct}%</Text>
            <span style={{ color: '#8c8c8c' }}>→</span>
            <Text strong style={{ fontSize: 13, color: newPct >= 70 ? '#52c41a' : newPct >= 40 ? '#faad14' : '#ff4d4f' }}>
              {newPct}%
            </Text>
            {diff !== 0 && (
              <Tag color={diff > 0 ? 'green' : 'red'} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                {diff > 0 ? `+${diff}%` : `${diff}%`}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Bài viết kiểm tra',
      dataIndex: 'postsChecked',
      key: 'postsChecked',
      width: 130,
      render: (count: number) => (
        <Tag color="default" style={{ fontSize: 11 }}>
          {count} bài gần nhất
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'actionTaken',
      key: 'actionTaken',
      width: 170,
      render: (act: string) => {
        if (act === 'UPDATED_JAVA_BACKEND') {
          return <Tag color="cyan">Đã đồng bộ dữ liệu</Tag>;
        }
        if (act === 'QUARANTINED_IN_STAGING') {
          return <Tag color="volcano">Đã chuyển vào vùng cách ly</Tag>;
        }
        return <Tag color="default">Chạy thử nghiệm</Tag>;
      },
    },
  ];

  return (
    <section className="quality-crawler-box quality-batch-audit">
      <header className="quality-config-title quality-batch-header">
        <div>
          <h2>Kiểm định hàng loạt</h2>
          <p>Kiểm tra và phân loại lại các hồ sơ đã lưu. Chọn phạm vi và số lượng hồ sơ cho mỗi đợt.</p>
        </div>
          <Button onClick={fetchLatestReport} loading={loading}>
            Làm mới báo cáo
          </Button>
      </header>
      <div className="quality-filter-box quality-batch-filters">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Số lượng mỗi đợt:
                </Text>
                <Select size="large" value={limit} onChange={setLimit} style={{ width: '100%' }}>
                  <Select.Option value={10}>10 hồ sơ (Rất nhẹ)</Select.Option>
                  <Select.Option value={20}>20 hồ sơ (Khuyến nghị)</Select.Option>
                  <Select.Option value={50}>50 hồ sơ</Select.Option>
                  <Select.Option value={100}>100 hồ sơ</Select.Option>
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Số hồ sơ bỏ qua:
                </Text>
                <Space.Compact style={{ width: '100%' }}>
                  <InputNumber
                    size="large"
                    min={0}
                    value={offset}
                    onChange={(v) => setOffset(v || 0)}
                    style={{ width: '70%' }}
                  />
                  <Button size="large" onClick={() => setOffset(0)} style={{ width: '30%' }}>
                    Đặt lại
                  </Button>
                </Space.Compact>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Nền tảng:
                </Text>
                <Select size="large" value={platform} onChange={setPlatform} style={{ width: '100%' }}>
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
                  Ngành hàng:
                </Text>
                <Select size="large" value={category} onChange={setCategory} style={{ width: '100%' }}>
                  <Select.Option value="ALL">Tất cả ngành hàng</Select.Option>
                  <Select.Option value="Beauty">Làm đẹp</Select.Option>
                  <Select.Option value="Fashion">Thời trang</Select.Option>
                  <Select.Option value="Food">Ẩm thực</Select.Option>
                  <Select.Option value="Tech">Công nghệ</Select.Option>
                  <Select.Option value="Lifestyle">Đời sống</Select.Option>
                </Select>
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col xs={24} md={14}>
              <Space wrap size="large">
                <Checkbox checked={dryRun} onChange={(e) => setDryRun(e.target.checked)}>
                  <Tooltip title="Chỉ phân tích và thống kê, không thay đổi hoặc đồng bộ dữ liệu.">
                    <Text strong>Chạy thử nghiệm</Text>
                  </Tooltip>
                </Checkbox>
                <Checkbox
                  checked={autoQuarantine}
                  onChange={(e) => setAutoQuarantine(e.target.checked)}
                >
                  <Tooltip title="Chuyển tài khoản bán hàng, nội dung rác hoặc đăng lại vào vùng cách ly và đánh dấu loại trừ.">
                    <Text>Tự động cách ly tài khoản không phù hợp</Text>
                  </Tooltip>
                </Checkbox>
              </Space>
            </Col>

            <Col xs={24} md={10} style={{ textAlign: 'right' }}>
              <Space wrap>
                <Button
                  type="primary"
                  loading={loading}
                  onClick={() => handleRunAudit(offset)}
                >
                  {dryRun ? `Chạy thử ${limit} hồ sơ` : `Kiểm định ${limit} hồ sơ`}
                </Button>
                <Button
                  disabled={loading}
                  onClick={() => handleRunAudit(offset + limit)}
                >
                  Kiểm định đợt tiếp theo (+{limit})
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </div>

      {error && <Alert type="error" message={error} showIcon closable />}

      {/* Kết quả tổng quan đợt quét */}
      {initialLoading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : report ? (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
                <Statistic
                  title="Tổng hồ sơ đã quét"
                  value={report.totalAudited}
                />
              </Card>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
                <Statistic
                  title="Tỷ lệ đạt chuẩn"
                  value={report.cleanRate}
                  suffix="%"
                  valueStyle={{
                    color: report.cleanRate >= 75 ? '#52c41a' : report.cleanRate >= 50 ? '#faad14' : '#ff4d4f',
                    fontWeight: 'bold',
                  }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
                <Statistic
                  title="Người tiêu dùng có ảnh hưởng"
                  value={report.kocCount}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
                <Statistic
                  title="Người có sức ảnh hưởng"
                  value={report.kolCount}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
                <Statistic
                  title="Tài khoản không phù hợp"
                  value={report.junkOrShopCount}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Bảng chi tiết kết quả */}
          <Card
            title={
              <Space>
                <span>Chi tiết đợt thẩm định:</span>
                <Tag color="blue">{report.runId}</Tag>
                {report.dryRun && <Tag color="purple">Chạy thử nghiệm</Tag>}
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                  (Duyệt từ {report.filter?.offset || 0} đến {(report.filter?.offset || 0) + report.totalAudited})
                </span>
              </Space>
            }
            size="small"
            style={{ borderRadius: 12, overflow: 'hidden' }}
          >
            <Table
              dataSource={report.items || []}
              columns={columns}
              rowKey="creatorId"
              pagination={{ pageSize: 10, showSizeChanger: true, locale: { items_per_page: '/ trang', jump_to: 'Đến trang', page: '', prev_page: 'Trang trước', next_page: 'Trang sau', prev_5: 'Lùi 5 trang', next_5: 'Tiến 5 trang' } }}
              scroll={{ x: 1000 }}
              size="middle"
            />
          </Card>
        </>
      ) : (
        <div className="quality-batch-empty" role="status">
          <h3>Chưa có kết quả kiểm định</h3>
          <p>Chọn phạm vi ở trên rồi nhấn <strong>Kiểm định {limit} hồ sơ</strong> để bắt đầu.</p>
          <span>Kết quả và chi tiết từng hồ sơ sẽ hiển thị tại đây.</span>
        </div>
      )}
    </section>
  );
}
