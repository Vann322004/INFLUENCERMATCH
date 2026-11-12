import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Modal, message } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import type { LiveCrawlResult, BatchCrawlResponse } from '../../../../../types/api/crawler.types';
import { formatViNumber, formatFullNumber } from '../../../../../utils/formatters';

interface BatchCrawlTableProps {
  batchResponse: BatchCrawlResponse;
  onImportAll?: () => void;
}

export default function BatchCrawlTable({ batchResponse, onImportAll }: BatchCrawlTableProps) {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<LiveCrawlResult | null>(null);

  const results = batchResponse?.results || [];
  const summary = batchResponse?.summary || {
    total_requested: results.length,
    success_count: results.filter((r) => r.status === 'success').length,
    failed_count: results.filter((r) => r.status !== 'success').length,
    avg_latency_ms: 0,
  };

  const handleExportCsv = () => {
    if (results.length === 0) return;
    const headers = ['NenTang', 'TenNguoiDung', 'TenKenh', 'NguoiTheoDoi', 'TongLuotThich', 'SoBaiDang', 'DanhGia', 'DoTreMiliGiay'];
    const rows = results.map((r) => [
      r.platform || 'TIKTOK',
      r.username || '',
      `"${r.display_name || ''}"`,
      r.followers || 0,
      r.heart_count || 0,
      r.video_count || 0,
      r.decision || 'ACCEPTED',
      r.latency_ms || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `danh_sach_koc_cao_duoc_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Đã tải xuống tệp CSV kết quả cào!');
  };

  const columns: TableColumnsType<LiveCrawlResult> = [
    {
      title: 'Nhà sáng tạo (KOC)',
      key: 'creator',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={r.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.username}`}
            alt={r.display_name}
            style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>
              {r.display_name || r.username}
            </div>
            <div style={{ fontSize: 11, color: '#6366F1' }}>@{r.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Nền tảng',
      dataIndex: 'platform',
      key: 'platform',
      render: (plat: string) => (
        <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 700 }}>
          {plat || 'TIKTOK'}
        </Tag>
      ),
    },
    {
      title: 'Người theo dõi',
      dataIndex: 'followers',
      key: 'followers',
      render: (fl: number) => (
        <span style={{ fontWeight: 700, color: '#1E293B' }}>
          {formatFullNumber(fl)}
        </span>
      ),
    },
    {
      title: 'Lượt thích',
      dataIndex: 'heart_count',
      key: 'heart_count',
      render: (hc: number) => (hc ? formatViNumber(hc) : '—'),
    },
    {
      title: 'Phân loại',
      dataIndex: 'primary_type',
      key: 'primary_type',
      render: (type: string) => (
        <Tag color={type === 'KOL' ? 'purple' : 'cyan'} style={{ borderRadius: 6, fontWeight: 700 }}>
          {type || 'KOC'}
        </Tag>
      ),
    },
    {
      title: 'Thời gian phản hồi',
      dataIndex: 'latency_ms',
      key: 'latency_ms',
      render: (lat: number) => (
        <span style={{ fontSize: 11.5, color: '#64748B' }}>
          {lat ? `${lat} ms` : 'Tức thì'}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, r) => (
        <Tag
          color={r.status === 'success' ? 'success' : 'error'}
          icon={r.status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          style={{ borderRadius: 6, fontWeight: 700 }}
        >
          {r.status === 'success' ? 'Thành công' : 'Lỗi'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, r) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedDetail(r);
            setDetailModalOpen(true);
          }}
          style={{ borderRadius: 6, fontWeight: 600 }}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <Card
      style={{
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      }}
      bodyStyle={{ padding: 20 }}
    >
      {/* Thanh tổng quan */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 16,
          padding: '14px 18px',
          background: '#F8FAFC',
          borderRadius: 10,
          border: '1px solid #E2E8F0',
        }}
      >
        <Space size="large" wrap>
          <div>
            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>TỔNG YÊU CẦU:</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginLeft: 6 }}>
              {summary.total_requested ?? 0}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>THÀNH CÔNG:</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#10B981', marginLeft: 6 }}>
              {summary.success_count ?? 0}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700 }}>THẤT BẠI:</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#EF4444', marginLeft: 6 }}>
              {summary.failed_count ?? 0}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#6366F1', fontWeight: 700 }}>TỐC ĐỘ TRUNG BÌNH:</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#6366F1', marginLeft: 6 }}>
              {summary.avg_latency_ms ?? 0} mili-giây/kênh
            </span>
          </div>
        </Space>

        <Space wrap>
          <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
            Xuất tệp CSV
          </Button>
          <Button
            type="primary"
            icon={<ImportOutlined />}
            onClick={onImportAll}
            style={{ background: '#10B981', border: 'none', fontWeight: 700 }}
          >
            Lưu tất cả vào Danh mục
          </Button>
        </Space>
      </div>

      {/* Bảng kết quả */}
      <Table
        columns={columns}
        dataSource={results}
        rowKey={(r) => r.username || r.author_id || String(Math.random())}
        pagination={{ pageSize: 6 }}
        size="middle"
        scroll={{ x: 1000 }}
      />

      {/* Modal xem chi tiết */}
      <Modal
        title={`Chi tiết KOC: @${selectedDetail?.username}`}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={720}
      >
        {selectedDetail && (
          <div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
              <img
                src={selectedDetail.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDetail.username}`}
                alt={selectedDetail.display_name}
                style={{ width: 60, height: 60, borderRadius: '50%' }}
              />
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{selectedDetail.display_name}</div>
                <div style={{ color: '#6366F1' }}>@{selectedDetail.username}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  {(selectedDetail.followers || 0).toLocaleString()} người theo dõi • {(selectedDetail.heart_count || 0).toLocaleString()} lượt thích
                </div>
              </div>
            </div>

            {selectedDetail.bio && (
              <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                <strong>Tiểu sử:</strong> {selectedDetail.bio}
              </div>
            )}

            <div style={{ fontWeight: 700, marginBottom: 8 }}>Các bài đăng trích xuất gần nhất:</div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {(selectedDetail.recent_posts || []).map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '8px 0',
                    borderBottom: '1px solid #F1F5F9',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1, fontSize: 12 }}>
                    <div style={{ fontWeight: 600 }}>{p.caption || `Bài đăng #${idx + 1}`}</div>
                    <div style={{ color: '#64748B', fontSize: 11 }}>
                      {(p.views || 0).toLocaleString()} lượt xem • {(p.likes || 0).toLocaleString()} thích • {(p.comments || 0).toLocaleString()} bình luận
                    </div>
                  </div>
                  {p.postUrl && (
                    <a href={p.postUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11.5 }}>
                      Xem bài đăng ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
