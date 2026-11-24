import CrawlAvatar from '../../../../../components/common/CrawlAvatar';
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
  avatarFallbackUrl?: string;
  profileUrl?: string;
  topicKeyword: string;
  primaryType: string;
  decision?: string;
  bio?: string;
  latencyMs?: number;
  status: 'DISCOVERED' | 'QUEUED' | 'INGESTED' | 'REJECTED';
}

interface DiscoveredFeedCardProps {
  discoveredList?: DiscoveredKocItem[];
  items?: DiscoveredKocItem[];
  onImportSingle?: (item: DiscoveredKocItem) => void;
  onImportAll?: () => void;
  onInspectDetail?: (item: DiscoveredKocItem) => void;
  onInspect?: (item: DiscoveredKocItem) => void;
  onItemsChange?: (items: DiscoveredKocItem[]) => void;
}

export default function DiscoveredFeedCard({
  discoveredList: propList,
  items,
  onImportSingle,
  onImportAll,
  onInspectDetail,
  onInspect,
}: DiscoveredFeedCardProps) {
  const discoveredList = propList || items || [];
  const handleInspect = onInspectDetail || onInspect || (() => {});
  const handleImport = onImportSingle || (() => {});
  const handleImportAll = onImportAll || (() => {});

  if (!discoveredList || discoveredList.length === 0) {
    return null;
  }

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
      r.status === 'INGESTED' ? 'Đã lưu vào DB' : r.status === 'QUEUED' ? 'Đã vào hàng đợi' : 'Chờ gửi',
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
    message.success('Đã xuất danh sách nhà sáng tạo đạt chuẩn ra file CSV!');
  };

  const columns: TableColumnsType<DiscoveredKocItem> = [
    {
      title: 'Nhà sáng tạo',
      key: 'creator',
      width: 240,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CrawlAvatar src={r.avatarUrl} fallbackSrc={r.avatarFallbackUrl} name={r.displayName || r.username} size={44} />
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
            <div style={{ fontSize: 12, color: '#6D28D9', fontWeight: 600 }}>@{r.username}</div>
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
      width: 170,
      render: (_, r) => {
        if (r.status === 'REJECTED' || r.decision === 'AUTO_REJECT' || r.primaryType === 'BRAND' || r.primaryType === 'SPAM') {
          const reason = r.primaryType === 'BRAND' ? 'Thương hiệu/Brand'
            : r.primaryType === 'SPAM' ? 'Spam bán hàng'
            : 'Không đạt tiêu chí';
          return (
            <Tag color="error" style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px' }}>
              Từ chối: {reason}
            </Tag>
          );
        }
        if (r.decision === 'NEEDS_MANAGER_REVIEW' || r.status === 'QUEUED') {
          return (
            <Tag color="warning" style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px' }}>
              Chờ kiểm định
            </Tag>
          );
        }
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
      render: (st: string) => {
        if (st === 'REJECTED') {
          return (
            <Tag color="error" style={{ borderRadius: 6, fontWeight: 600 }}>
              Đã loại bỏ
            </Tag>
          );
        }
        return (
          <Tag
            color={st === 'INGESTED' ? 'success' : 'processing'}
            style={{ borderRadius: 6, fontWeight: 600 }}
          >
            {st === 'INGESTED' ? 'Đã lưu vào DB' : st === 'QUEUED' ? 'Đã vào hàng đợi' : 'Chờ gửi'}
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, r) => {
        if (r.status === 'REJECTED') {
          return (
            <Button
              size="small"
              onClick={() => handleInspect(r)}
              style={{ borderRadius: 6, color: '#64748B' }}
            >
              Xem chi tiết
            </Button>
          );
        }
        return (
          <Space size="small">
            {r.status !== 'INGESTED' ? (
              <Button
                size="small"
                type="primary"
                onClick={() => handleImport(r)}
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
                onClick={() => handleInspect(r)}
                style={{ borderRadius: 6 }}
              >
                Xem chi tiết
              </Button>
            )}
          </Space>
        );
      },
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
      styles={{ body: { padding: 20 } }}
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
            Kết quả thu thập nhà sáng tạo ({discoveredList.length} kênh)
          </div>
          <div style={{ fontSize: 12, color: '#15803D', marginTop: 2 }}>
            Hiển thị toàn bộ các kênh đã cào, kèm kết quả phân loại đạt chuẩn hoặc bị từ chối.
          </div>
        </div>

        <Space wrap>
          <Button onClick={handleExportCsv}>
            Xuất file CSV
          </Button>
          <Button
            type="primary"
            onClick={handleImportAll}
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
