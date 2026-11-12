import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Input, Select, Row, Col, Button, Space, message } from 'antd';
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
  INGESTED:          { color: 'success',    label: 'Đã lưu hệ thống' },
  DEEP_CRAWLING:     { color: 'processing', label: 'Đang cào dữ liệu' },
  DEEP_CRAWL_QUEUED: { color: 'warning',    label: 'Chờ cào sâu' },
  PREFLIGHT_DONE:    { color: 'purple',     label: 'Đã sàng lọc sơ bộ' },
  DISCOVERED:        { color: 'blue',       label: 'Vừa phát hiện' },
  FAILED:            { color: 'error',      label: 'Thất bại' },
};

const DECISION_COLOR_MAP: Record<string, { color: string; label: string }> = {
  AUTO_ACCEPT_KOC:      { color: 'green',   label: 'Đạt chuẩn KOC' },
  AUTO_ACCEPT_KOL:      { color: 'purple',  label: 'Đạt chuẩn KOL' },
  ACCEPTED:             { color: 'green',   label: 'Đạt chuẩn KOC' },
  PASS:                 { color: 'green',   label: 'Đạt chuẩn KOC' },
  MANAGER_APPROVED:     { color: 'cyan',    label: 'Chuyên viên duyệt' },
  AUTO_REJECT:          { color: 'red',     label: 'Từ chối (Bán hàng / Spam)' },
  MANAGER_REJECTED:     { color: 'volcano', label: 'Chuyên viên từ chối' },
  NEEDS_MANAGER_REVIEW: { color: 'warning', label: 'Cần xem xét' },
  SKIP_INSUFFICIENT:    { color: 'default', label: 'Chưa đủ dữ liệu' },
};

export default function JobsMonitorTab() {
  const [loading, setLoading] = useState<boolean>(true);
  const [overview, setOverview] = useState<CrawlMonitorOverview | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');

  const fetchRealOverview = async () => {
    setLoading(true);
    try {
      const data = await crawlerService.getOverview(50);
      setOverview(data);
    } catch (err: any) {
      message.error(err.message || 'Không thể tải dữ liệu giám sát từ máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealOverview();
  }, []);

  const items: ActivityRecord[] = overview?.activities?.items || [];
  const stats = (overview?.stats || {}) as any;

  const totalCandidates = stats.total_candidates ?? items.length;
  const activeCount = stats.active_crawls ?? items.filter((i) => i.status.includes('CRAWL')).length;
  const completedCount = stats.completed ?? items.filter((i) => i.status === 'INGESTED').length;
  const failedCount = stats.failed ?? items.filter((i) => i.status === 'FAILED').length;

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      item.id.toLowerCase().includes(q) ||
      item.username.toLowerCase().includes(q) ||
      (item.displayName && item.displayName.toLowerCase().includes(q));
    const matchS = statusFilter === 'all' || item.status === statusFilter;
    const matchP = platformFilter === 'all' || item.platform.toLowerCase() === platformFilter.toLowerCase();
    return matchQ && matchS && matchP;
  });

  const columns: TableColumnsType<ActivityRecord> = [
    {
      title: 'Mã tác vụ',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#6366F1' }}>
          #{id.slice(0, 8)}...
        </span>
      ),
    },
    {
      title: 'Nhà sáng tạo (KOC)',
      key: 'creator',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A' }}>
            {r.displayName || `@${r.username}`}
          </div>
          <div style={{ fontSize: 11, color: '#6366F1' }}>@{r.username}</div>
        </div>
      ),
    },
    {
      title: 'Nền tảng',
      dataIndex: 'platform',
      key: 'platform',
      render: (plat: string) => (
        <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 700 }}>
          {plat}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái quy trình',
      dataIndex: 'status',
      key: 'status',
      render: (st: string) => {
        const conf = STATUS_COLOR_MAP[st] || { color: 'default', label: st };
        return (
          <Tag color={conf.color} style={{ borderRadius: 6, fontWeight: 600 }}>
            {conf.label}
          </Tag>
        );
      },
    },
    {
      title: 'Đánh giá chất lượng',
      dataIndex: 'decision',
      key: 'decision',
      render: (dec: string, r: ActivityRecord) => {
        let conf = DECISION_COLOR_MAP[dec];
        if (!conf) {
          if (dec === 'ACCEPTED' || dec === 'PASS') {
            conf = r.primaryType === 'KOL'
              ? { color: 'purple', label: 'Đạt chuẩn KOL' }
              : { color: 'green', label: 'Đạt chuẩn KOC' };
          } else {
            conf = { color: 'default', label: dec || 'Chờ đánh giá' };
          }
        }
        return (
          <Tag color={conf.color} style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px' }}>
            {conf.label}
          </Tag>
        );
      },
    },
    {
      title: 'Phân loại',
      dataIndex: 'primaryType',
      key: 'primaryType',
      render: (t: string) => {
        const type = (t || '').toUpperCase();
        const isKol = type === 'KOL';
        const isKoc = type === 'KOC';
        return (
          <Tag color={isKol ? 'purple' : isKoc ? 'cyan' : 'default'} style={{ borderRadius: 6, fontWeight: 700 }}>
            {isKol ? 'KOL' : isKoc ? 'KOC' : 'Chưa rõ'}
          </Tag>
        );
      },
    },
    {
      title: 'Thời gian cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (time: string) => (
        <span style={{ fontSize: 11.5, color: '#64748B' }}>
          {time ? new Date(time).toLocaleString('vi-VN') : '—'}
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* 4 Thẻ thống kê thời gian thực */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>TỔNG KOC ĐÃ THU THẬP</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', marginTop: 4 }}>
              {totalCandidates}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Lưu trữ trong hệ thống</div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>ĐANG XỬ LÝ</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#3B82F6', marginTop: 4 }}>
              {activeCount}
            </div>
            <div style={{ fontSize: 11, color: '#3B82F6', marginTop: 2 }}>Đang cào dữ liệu / trong hàng đợi</div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>ĐÃ LƯU THÀNH CÔNG</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 4 }}>
              {completedCount}
            </div>
            <div style={{ fontSize: 11, color: '#10B981', marginTop: 2 }}>Đã hoàn tất trích xuất</div>
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
            <Select.Option value="INGESTED">Đã lưu hệ thống</Select.Option>
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
      <Table
        loading={loading}
        columns={columns}
        dataSource={filteredItems}
        rowKey="id"
        pagination={{ pageSize: 8, showTotal: (t) => `Tổng số ${t} tác vụ` }}
        size="middle"
        scroll={{ x: 950 }}
      />
    </div>
  );
}
