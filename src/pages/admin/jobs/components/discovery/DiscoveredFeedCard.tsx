import React from 'react';
import { Card, Table, Tag, Button, Space, message, Tooltip } from 'antd';
import type { TableColumnsType } from 'antd';
import { formatViNumber, formatFullNumber } from '../../../../../utils/formatters';

export interface DiscoveredKocItem {
  id: string;
  username: string;
  displayName: string;
  platform: string;
  followers: number;
  heartCount?: number;
  videoCount?: number;
  avatarUrl?: string;
  profileUrl?: string;
  topicKeyword: string;
  primaryType: string;
  decision?: string;
  bio?: string;
  latencyMs?: number;
  status: 'DISCOVERED' | 'INGESTED' | 'REJECTED';
}

interface DiscoveredFeedCardProps {
  discoveredList: DiscoveredKocItem[];
  onImportSingle: (item: DiscoveredKocItem) => void;
  onImportAll: () => void;
  onInspectDetail: (item: DiscoveredKocItem) => void;
}

export default function DiscoveredFeedCard({
  discoveredList,
  onImportSingle,
  onImportAll,
  onInspectDetail,
}: DiscoveredFeedCardProps) {
  const handleExportCsv = () => {
    if (discoveredList.length === 0) return;
    const headers = [
      'NenTang',
      'TenNguoiDung',
      'TenKenh',
      'NguoiTheoDoi',
      'LuotThich',
      'SoVideo',
      'LinhVuc',
      'PhanLoai',
      'DanhGia',
      'TrangThai',
    ];
    const rows = discoveredList.map((r) => [
      r.platform,
      r.username,
      `"${(r.displayName || '').replace(/"/g, '""')}"`,
      r.followers || 0,
      r.heartCount || 0,
      r.videoCount || 0,
      `"${r.topicKeyword}"`,
      r.primaryType || 'KOC',
      r.decision || 'Đạt chuẩn',
      r.status === 'INGESTED' ? 'Đã lưu vào DB' : 'Chờ lưu',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `danh_sach_koc_dat_chuan_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Đã xuất danh sách KOC đạt chuẩn ra file CSV!');
  };

  const columns: TableColumnsType<DiscoveredKocItem> = [
    {
      title: 'Nhà sáng tạo KOC',
      key: 'creator',
      width: 240,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={r.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.username}`}
            alt={r.displayName}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #EEF2FF',
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                color: '#0F172A',
                fontSize: 13.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {r.displayName}
            </div>
            <div style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600 }}>@{r.username}</div>
            {r.profileUrl && (
              <a
                href={r.profileUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 11, color: '#64748B', display: 'inline-block', marginTop: 1 }}
              >
                Mở kênh ↗
              </a>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Nền tảng',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (plat: string) => {
        const isFb = (plat || '').toUpperCase() === 'FACEBOOK';
        return (
          <Tag color={isFb ? 'blue' : 'geekblue'} style={{ borderRadius: 6, fontWeight: 700 }}>
            {plat || 'TIKTOK'}
          </Tag>
        );
      },
    },
    {
      title: 'Người theo dõi',
      dataIndex: 'followers',
      key: 'followers',
      width: 130,
      render: (fl: number) => (
        <span style={{ fontWeight: 800, color: '#1E293B', fontSize: 14 }}>
          {formatFullNumber(fl)}
        </span>
      ),
    },
    {
      title: 'Tương tác & Nội dung',
      key: 'stats',
      width: 160,
      render: (_, r) => (
        <div style={{ fontSize: 12, color: '#475569' }}>
          <div>
            Lượt thích: <strong>{r.heartCount ? formatViNumber(r.heartCount) : '—'}</strong>
          </div>
          <div style={{ marginTop: 2 }}>
            Số bài: <strong>{r.videoCount ? formatFullNumber(r.videoCount) : 0} video</strong>
          </div>
        </div>
      ),
    },
    {
      title: 'Tiểu sử kênh',
      key: 'bio',
      render: (_, r) => (
        <div style={{ maxWidth: 220, fontSize: 12, color: '#334155' }}>
          <Tooltip title={r.bio || 'Chưa cập nhật tiểu sử'}>
            <div
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.4,
              }}
            >
              {r.bio && r.bio !== 'No bio yet' ? r.bio : 'Chưa cập nhật tiểu sử'}
            </div>
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'Đánh giá Tier-0',
      key: 'decision',
      width: 140,
      render: (_, r) => {
        const isKol = r.primaryType === 'KOL';
        return (
          <Tag
            color={isKol ? 'purple' : 'success'}
            style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px' }}
          >
            {isKol ? 'Đạt chuẩn KOL' : 'Đạt chuẩn KOC'}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái Database',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (st: string) => (
        <Tag
          color={st === 'INGESTED' ? 'success' : 'processing'}
          style={{ borderRadius: 6, fontWeight: 600 }}
        >
          {st === 'INGESTED' ? 'Đã lưu vào DB' : 'Chờ đồng bộ'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 110,
      render: (_, r) => (
        <Space size="small">
          {r.status !== 'INGESTED' ? (
            <Button
              size="small"
              type="primary"
              onClick={() => onImportSingle(r)}
              style={{
                background: '#10B981',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              Lưu vào DB
            </Button>
          ) : (
            <Button
              size="small"
              onClick={() => onInspectDetail(r)}
              style={{ borderRadius: 6 }}
            >
              Cào sâu
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      style={{
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 6px rgba(0,0,0,0.03)',
        marginTop: 20,
      }}
      bodyStyle={{ padding: 20 }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 16,
          padding: '12px 16px',
          background: '#F0FDF4',
          borderRadius: 8,
          border: '1px solid #BBF7D0',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#166534' }}>
            Danh sách KOC đạt chuẩn Tier-0 ({discoveredList.length} tài khoản)
          </div>
          <div style={{ fontSize: 12, color: '#15803D', marginTop: 2 }}>
            Tất cả tài khoản đều có tối thiểu 7.000 followers, đã tự động loại bỏ Shop thương mại và kho buôn.
          </div>
        </div>

        <Space wrap>
          <Button onClick={handleExportCsv}>
            Xuất file CSV
          </Button>
          <Button
            type="primary"
            onClick={onImportAll}
            style={{
              background: '#16A34A',
              border: 'none',
              fontWeight: 600,
              borderRadius: 6,
            }}
          >
            Đồng bộ tất cả vào DB
          </Button>
        </Space>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={discoveredList}
        rowKey="id"
        pagination={{ pageSize: 8 }}
        size="middle"
        scroll={{ x: 1050 }}
      />
    </Card>
  );
}
