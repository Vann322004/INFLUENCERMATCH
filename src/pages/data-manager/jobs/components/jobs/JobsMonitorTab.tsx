import { collectionOutcome, collectionOutcomeLabel } from '../../../../../services/collectionDecision';
import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Input, Select, Row, Col, Button, Space, message, Alert, Grid, Pagination, Empty } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { crawlerService } from '../../../../../services/api/crawlerService';
import type { CrawlMonitorOverview } from '../../../../../types/api/crawler.types';

interface ActivityRecord {
  id: string;
  platform: string;
  username: string;
  displayName?: string;
  status: string;
  decision: string;
  primaryType?: string;
  updatedAt?: string;
}

const STATUS_COLOR_MAP: Record<string, { color: string; label: string }> = {
  INGESTED:          { color: 'default',    label: 'Đã thu thập dữ liệu' },
  DEEP_CRAWLING:     { color: 'processing', label: 'Đang cào dữ liệu' },
  DEEP_CRAWL_QUEUED: { color: 'warning',    label: 'Chờ cào sâu' },
  PREFLIGHT_DONE:    { color: 'purple',     label: 'Đã sàng lọc sơ bộ' },
  DISCOVERED:        { color: 'blue',       label: 'Vừa phát hiện' },
  FAILED:            { color: 'error',      label: 'Thất bại' },
};

const DECISION_COLOR_MAP: Record<string, { color: string; label: string }> = {
  AUTO_ACCEPT_KOC:      { color: 'green',   label: 'Đạt chuẩn Nhà sáng tạo' },
  AUTO_ACCEPT_KOL:      { color: 'purple',  label: 'Đạt chuẩn KOL' },
  ACCEPTED:             { color: 'green',   label: 'Đạt chuẩn' },
  PASS:                 { color: 'green',   label: 'Đạt chuẩn' },
  MANAGER_APPROVED:     { color: 'cyan',    label: 'Chuyên viên duyệt' },
  REJECTED:            { color: 'red', label: 'Từ chối (Không đủ điều kiện)' },
  AUTO_REJECT:          { color: 'red',     label: 'Từ chối (Bán hàng / Spam)' },
  MANAGER_REJECTED:     { color: 'volcano', label: 'Chuyên viên từ chối' },
  NEEDS_MANAGER_REVIEW: { color: 'warning', label: 'Chờ kiểm định phân loại / ngành' },
  SKIP_INSUFFICIENT:    { color: 'red', label: 'Từ chối (Không đủ dữ liệu)' },
};

function formatShortDate(value?: string) {
  if (!value) return '—';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function JobsMonitorTab() {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const [loading, setLoading] = useState<boolean>(true);
  const [overview, setOverview] = useState<CrawlMonitorOverview | null>(null);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [mobilePage, setMobilePage] = useState(1);

  const fetchRealOverview = async () => {
    setLoading(true);
    try {
      const data = await crawlerService.getOverview(50);
      setOverview(data);
      setLoadError('');
    } catch (err: any) {
      setLoadError(err.message || 'Không tải được nhật ký thu thập');
      message.error(err.message || 'Không thể tải dữ liệu giám sát từ máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealOverview();
    const timer = setInterval(fetchRealOverview, 15000);
    return () => clearInterval(timer);
  }, []);

  const items: ActivityRecord[] = overview?.activities?.items || [];
  const stats = overview?.stats || {};

  const totalCandidates = stats.total_candidates ?? items.length;
  const activeCount = items.filter(i => i.status.includes('CRAWL')).length;
  const completedCount = items.filter(i => collectionOutcome(i.decision, i.primaryType) === 'accepted').length;
  const failedCount = items.filter(i => i.status === 'FAILED' || collectionOutcome(i.decision, i.primaryType) === 'rejected').length;
  const reviewCount = items.filter(i => collectionOutcome(i.decision, i.primaryType) === 'review').length;

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      item.id.toLowerCase().includes(q) ||
      item.username.toLowerCase().includes(q) ||
      (item.displayName && item.displayName.toLowerCase().includes(q));
    const matchS = statusFilter === 'all' || collectionOutcome(item.decision, item.primaryType) === statusFilter || item.status === statusFilter;
    const matchP = platformFilter === 'all' || item.platform.toLowerCase() === platformFilter.toLowerCase();
    return matchQ && matchS && matchP;
  });

  const columns: TableColumnsType<ActivityRecord> = [
    {
      title: 'Kênh / Mã tác vụ',
      key: 'creator',
      ellipsis: true,
      render: (_, r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {r.displayName || `@${r.username}`}
          </div>
          <div style={{ fontSize: 11, color: '#7C3AED', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span>@{r.username}</span>
            <span style={{ fontFamily: 'monospace', color: '#94A3B8' }}>#{r.id.slice(0, 8)}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Nền tảng',
      dataIndex: 'platform',
      key: 'platform',
      width: 96,
      render: (plat: string) => (
        <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 700, marginInlineEnd: 0 }}>
          {plat}
        </Tag>
      ),
    },
    {
      title: 'Tiến trình',
      dataIndex: 'status',
      key: 'status',
      width: 148,
      render: (st: string) => {
        const conf = STATUS_COLOR_MAP[st] || { color: 'default', label: st || 'Chưa rõ' };
        return (
          <Tag color={conf.color} style={{ borderRadius: 6, fontWeight: 600, marginInlineEnd: 0, whiteSpace: 'normal' }}>
            {conf.label}
          </Tag>
        );
      },
    },
    {
      title: 'Kết quả sàng lọc',
      dataIndex: 'decision',
      key: 'decision',
      render: (dec: string, r: ActivityRecord) => {
        const outcome = collectionOutcome(dec, r.primaryType);
        const conf = outcome === 'accepted'
          ? { color: 'green', label: `Đạt chuẩn ${dec === 'AUTO_ACCEPT_KOL' || r.primaryType === 'KOL' ? 'KOL' : 'Nhà sáng tạo'}` }
          : outcome === 'review'
            ? { color: 'warning', label: collectionOutcomeLabel(outcome) }
            : DECISION_COLOR_MAP[dec] || { color: 'default', label: dec || 'Chờ đánh giá' };
        return (
          <Tag color={conf.color} style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px', marginInlineEnd: 0, whiteSpace: 'normal' }}>
            {conf.label}
          </Tag>
        );
      },
    },
    {
      title: 'Phân loại',
      dataIndex: 'primaryType',
      key: 'primaryType',
      width: 96,
      render: (t: string) => {
        const type = (t || '').toUpperCase();
        const isKol = type === 'KOL';
        const isKoc = type === 'KOC';
        return (
          <Tag color={isKol ? 'purple' : isKoc ? 'cyan' : 'default'} style={{ borderRadius: 6, fontWeight: 700, marginInlineEnd: 0 }}>
            {isKol ? 'KOL' : isKoc ? 'KOC' : 'Chưa rõ'}
          </Tag>
        );
      },
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 110,
      render: (time: string) => (
        <span style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
          {formatShortDate(time)}
        </span>
      ),
    },
  ];

  const pageSize = 8;
  const pagedMobileItems = filteredItems.slice((mobilePage - 1) * pageSize, mobilePage * pageSize);

  return (
    <div>
      <header className="quality-config-title">
        <h2>Nhật ký thu thập</h2>
        <p>Theo dõi tiến trình xử lý, kết quả sàng lọc và thời gian cập nhật của từng tác vụ. Dữ liệu tự làm mới sau mỗi 15 giây.</p>
      </header>
      {loadError && <Alert type="error" showIcon style={{ marginBottom: 16 }}
        message="Không tải được nhật ký thu thập" description={loadError} />}
      <div style={{ marginBottom: 12 }}>Kết quả trong {items.length} hoạt động gần nhất · Chờ kiểm định: {reviewCount}. Hoàn tất thu thập không đồng nghĩa được chấp nhận.</div>
      {/* 4 Thẻ thống kê thời gian thực */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>TỔNG TÀI KHOẢN THU THẬP</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', marginTop: 4 }}>
              {totalCandidates}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Bao gồm tài khoản chưa được chấp nhận</div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>ĐANG XỬ LÝ</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#8B5CF6', marginTop: 4 }}>
              {activeCount}
            </div>
            <div style={{ fontSize: 11, color: '#8B5CF6', marginTop: 2 }}>Đang cào dữ liệu / trong hàng đợi</div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>ĐÃ CHẤP NHẬN</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 4 }}>
              {completedCount}
            </div>
            <div style={{ fontSize: 11, color: '#10B981', marginTop: 2 }}>Đã đạt điều kiện và phân loại</div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>LỖI / TỪ CHỐI</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#EF4444', marginTop: 4 }}>
              {failedCount}
            </div>
            <div style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>Tài khoản bán hàng / Lỗi thu thập</div>
          </Card>
        </Col>
      </Row>

      {/* Bộ lọc và thao tác */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <Space wrap style={{ flex: 1 }}>
          <Input
            placeholder="Tìm theo mã tác vụ, tên tài khoản hoặc tên kênh..."
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 220, maxWidth: 320, borderRadius: 8 }}
            allowClear
          />

          <Select value={statusFilter} onChange={setStatusFilter} style={{ minWidth: 160 }}>
            <Select.Option value="all">Tất cả trạng thái quy trình</Select.Option>
            <Select.Option value="accepted">Đã chấp nhận</Select.Option>
            <Select.Option value="review">Chờ kiểm định</Select.Option>
            <Select.Option value="rejected">Từ chối</Select.Option>
            <Select.Option value="DEEP_CRAWLING">Đang cào dữ liệu</Select.Option>
            <Select.Option value="DEEP_CRAWL_QUEUED">Chờ cào sâu</Select.Option>
            <Select.Option value="PREFLIGHT_DONE">Đã sàng lọc sơ bộ</Select.Option>
            <Select.Option value="FAILED">Thất bại</Select.Option>
          </Select>

          <Select value={platformFilter} onChange={setPlatformFilter} style={{ minWidth: 130 }}>
            <Select.Option value="all">Tất cả nền tảng</Select.Option>
            <Select.Option value="tiktok">TikTok</Select.Option>
            <Select.Option value="instagram">Instagram</Select.Option>
            <Select.Option value="facebook">Facebook</Select.Option>
          </Select>
        </Space>

        <Button icon={<ReloadOutlined spin={loading} />} onClick={fetchRealOverview}>
          Làm mới danh sách
        </Button>
      </div>

      {/* Bảng tiến trình */}
      {isMobile ? (
        filteredItems.length === 0 ? (
          <Empty description="Không có tác vụ phù hợp" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pagedMobileItems.map((r) => {
              const stConf = STATUS_COLOR_MAP[r.status] || { color: 'default', label: r.status || 'Chưa rõ' };
              const outcome = collectionOutcome(r.decision, r.primaryType);
              const decConf = outcome === 'accepted'
                ? { color: 'green', label: `Đạt chuẩn ${r.decision === 'AUTO_ACCEPT_KOL' || r.primaryType === 'KOL' ? 'KOL' : 'Nhà sáng tạo'}` }
                : outcome === 'review'
                  ? { color: 'warning', label: collectionOutcomeLabel(outcome) }
                  : DECISION_COLOR_MAP[r.decision] || { color: 'default', label: r.decision || 'Chờ đánh giá' };
              const type = (r.primaryType || '').toUpperCase();
              return (
                <div key={r.id} style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 12, background: '#FAF8FF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', wordBreak: 'break-word' }}>{r.displayName || `@${r.username}`}</div>
                      <div style={{ fontSize: 11, color: '#7C3AED' }}>@{r.username} · <span style={{ fontFamily: 'monospace', color: '#94A3B8' }}>#{r.id.slice(0, 8)}</span></div>
                    </div>
                    <span style={{ fontSize: 11.5, color: '#64748B', whiteSpace: 'nowrap' }}>{formatShortDate(r.updatedAt)}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 700, marginInlineEnd: 0 }}>{r.platform}</Tag>
                    <Tag color={stConf.color} style={{ borderRadius: 6, fontWeight: 600, marginInlineEnd: 0 }}>{stConf.label}</Tag>
                    <Tag color={decConf.color} style={{ borderRadius: 6, fontWeight: 700, marginInlineEnd: 0 }}>{decConf.label}</Tag>
                    <Tag color={type === 'KOL' ? 'purple' : type === 'KOC' ? 'cyan' : 'default'} style={{ borderRadius: 6, fontWeight: 700, marginInlineEnd: 0 }}>
                      {type === 'KOL' ? 'KOL' : type === 'KOC' ? 'KOC' : 'Chưa rõ'}
                    </Tag>
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Pagination
                current={mobilePage}
                pageSize={pageSize}
                total={filteredItems.length}
                onChange={setMobilePage}
                size="small"
                showTotal={(t) => `Tổng số ${t} tác vụ`}
              />
            </div>
          </div>
        )
      ) : (
        <Table
          loading={loading}
          columns={columns}
          dataSource={filteredItems}
          rowKey="id"
          pagination={{ pageSize, showTotal: (t) => `Tổng số ${t} tác vụ` }}
          size="middle"
        />
      )}
    </div>
  );
}
