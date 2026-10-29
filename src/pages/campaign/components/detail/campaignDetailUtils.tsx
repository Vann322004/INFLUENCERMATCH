import React from 'react';
import { Tag, Avatar } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { InstagramOutlined } from '@ant-design/icons';
import type { CampaignCreatorRow, CampaignDetailCacheEntry } from './campaignDetailTypes';

// ── Bộ chuyển dịch & chuẩn hóa Tiếng Việt ──
export const translateObjective = (obj?: string): string => {
  if (!obj) return 'NHẬN DIỆN THƯƠNG HIỆU';
  const upper = obj.toUpperCase();
  if (upper.includes('AWARE')) return 'NHẬN DIỆN THƯƠNG HIỆU';
  if (upper.includes('CONVERT') || upper.includes('SALE')) return 'CHUYỂN ĐỔI BÁN HÀNG';
  if (upper.includes('ENGAGE')) return 'TĂNG TƯƠNG TÁC';
  if (upper.includes('CONSIDER')) return 'CÂN NHẮC MUA HÀNG';
  return obj;
};

export const translateNiche = (niche?: string): string => {
  if (!niche) return '';
  const lower = niche.toLowerCase();
  if (lower.includes('beauty') || lower.includes('mỹ phẩm') || lower.includes('làm đẹp')) return 'Làm đẹp';
  if (lower.includes('skin') || lower.includes('chăm sóc da')) return 'Chăm sóc da';
  if (lower.includes('lifestyle') || lower.includes('phong cách') || lower.includes('đời sống')) return 'Phong cách sống';
  if (lower.includes('fashion') || lower.includes('thời trang')) return 'Thời trang';
  if (lower.includes('food') || lower.includes('ẩm thực') || lower.includes('ăn uống')) return 'Ẩm thực';
  if (lower.includes('tech') || lower.includes('công nghệ')) return 'Công nghệ';
  if (lower.includes('travel') || lower.includes('du lịch')) return 'Du lịch';
  if (lower.includes('fitness') || lower.includes('thể thao')) return 'Thể thao & Fitness';
  if (lower.includes('family') || lower.includes('mẹ bé')) return 'Mẹ & Bé';
  return niche;
};

export const getNicheClass = (niche?: string): string => {
  if (!niche) return '';
  const lower = niche.toLowerCase();
  if (lower.includes('beauty') || lower.includes('làm đẹp')) return 'beauty';
  if (lower.includes('skin') || lower.includes('da')) return 'skincare';
  if (lower.includes('life') || lower.includes('sống')) return 'lifestyle';
  if (lower.includes('fashion') || lower.includes('thời trang')) return 'fashion';
  if (lower.includes('tech') || lower.includes('công nghệ')) return 'tech';
  return '';
};

export const VERIFIED_CREATOR_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
];

export const getStageInfo = (stage?: string) => {
  switch (stage) {
    case 'OUTREACHED':
      return { text: 'Đã gửi lời mời', color: '#F59E0B', deliverable: 'Chờ KOC phản hồi', delColor: 'gold' };
    case 'REPLIED':
      return { text: 'Đã phản hồi', color: '#0284C7', deliverable: 'Đang thảo luận', delColor: 'cyan' };
    case 'NEGOTIATING':
      return { text: 'Đang đàm phán', color: '#6366F1', deliverable: 'Thương lượng cát-xê', delColor: 'blue' };
    case 'AGREED':
    case 'CONTRACT_SIGNED':
      return { text: 'Đã ký hợp đồng', color: '#10B981', deliverable: 'Đã chốt hợp tác', delColor: 'green' };
    case 'CONTENT_PENDING':
      return { text: 'Đang chờ nội dung', color: '#8B5CF6', deliverable: 'Đang sản xuất video', delColor: 'purple' };
    case 'CONTENT_APPROVED':
      return { text: 'Nội dung đã duyệt', color: '#10B981', deliverable: 'Sẵn sàng đăng bài', delColor: 'green' };
    case 'POSTED':
      return { text: 'Đã lên bài', color: '#059669', deliverable: 'Đang đo lường KPI', delColor: 'green' };
    case 'PAID':
    case 'COMPLETED':
      return { text: 'Đã hoàn tất', color: '#10B981', deliverable: 'Đã nghiệm thu', delColor: 'green' };
    case 'REJECTED':
    case 'NOT_INTERESTED':
      return { text: 'Từ chối', color: '#EF4444', deliverable: 'Dừng hợp tác', delColor: 'red' };
    default:
      return { text: stage || 'Đang kết nối', color: '#6366F1', deliverable: 'Đang triển khai', delColor: 'blue' };
  }
};

// Global In-Memory Cache (loại bỏ hoàn toàn reload flash và giật lag khi chuyển trang qua lại)
export const campaignDetailCache = new Map<string, CampaignDetailCacheEntry>();

export const getCreatorTableColumns = (): ColumnsType<CampaignCreatorRow> => [
  {
    title: 'Nhà sáng tạo / KOC',
    dataIndex: 'name',
    key: 'name',
    render: (text, record) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar src={record.avatar} size={40} />
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>{record.username}</div>
        </div>
      </div>
    ),
  },
  {
    title: 'Nền tảng',
    dataIndex: 'platform',
    key: 'platform',
    render: (platform) => {
      const isTikTok = platform === 'tiktok';
      return (
        <span className={`cdetail-platform-badge ${isTikTok ? 'tiktok' : ''}`}>
          {isTikTok ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
            </svg>
          ) : (
            <InstagramOutlined style={{ fontSize: 12, color: '#E1306C' }} />
          )}
          {platform.toUpperCase()}
        </span>
      );
    },
  },
  {
    title: 'Người theo dõi',
    dataIndex: 'followers',
    key: 'followers',
    render: (val) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{val}</span>,
  },
  {
    title: 'Chi phí thỏa thuận',
    dataIndex: 'fee',
    key: 'fee',
    render: (val) => <span style={{ fontWeight: 700, color: '#4F46E5' }}>{val}</span>,
  },
  {
    title: 'Tiến độ hợp tác',
    dataIndex: 'stageText',
    key: 'stageText',
    render: (text) => (
      <span className="cdetail-creator-status confirmed">{text}</span>
    ),
  },
  {
    title: 'Nội dung cam kết',
    dataIndex: 'deliverableStatus',
    key: 'deliverableStatus',
    render: (text, record) => <Tag color={record.deliverableColor}>{text}</Tag>,
  },
];
