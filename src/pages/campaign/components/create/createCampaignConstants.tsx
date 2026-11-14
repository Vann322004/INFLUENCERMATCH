import React from 'react';

export const AI_SAMPLE_PROMPTS = [
  {
    label: 'Kem chống nắng nâng tone HS-SV (<200k)',
    prompt: 'Dòng kem chống nắng nâng tone kiềm dầu cho học sinh sinh viên, giá dưới 200k',
  },
  {
    label: 'Serum B5 phục hồi da dầu mụn',
    prompt: 'Quảng bá serum B5 phục hồi da dầu mụn dành cho giới trẻ 18-24 tuổi trên TikTok và Instagram, ngân sách 20 triệu',
  },
  {
    label: 'Củ sạc nhanh GaN 65W công nghệ',
    prompt: 'Tìm kiếm creator review củ sạc nhanh công nghệ GaN 65W cho người trẻ và game thủ 18-35 tuổi, ngân sách 30 triệu trên TikTok và Facebook',
  },
  {
    label: 'Thời trang dạo phố OOTD hè',
    prompt: 'Quảng bá BST thời trang dạo phố năng động hè cho nữ giới 18-24 tuổi tại Hà Nội và TP.HCM, ngân sách 20 triệu trên Instagram và TikTok',
  },
];

export const TikTokBrandIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color || 'currentColor'} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.47V10.7a8.21 8.21 0 0 0 5.73 2.19V9.44a4.8 4.8 0 0 1-3-.75v-2z" />
  </svg>
);

export const InstagramBrandIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color || 'currentColor'} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

export const FacebookBrandIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color || 'currentColor'} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export const AGE_GROUPS = ['13-17', '18-24', '25-34', '35-44', '45+'];

export const GENDERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'male', label: 'Nam' },
  { key: 'female', label: 'Nữ' },
  { key: 'other', label: 'Khác' },
];

export const getStatusBadge = (st: string) => {
  switch (st) {
    case 'ACTIVE':
      return { label: 'Đang triển khai', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', text: 'Chiến dịch đang chạy thực tế' };
    case 'READY_FOR_DISCOVERY':
      return { label: 'Sẵn sàng đề xuất', color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', text: 'Đang tìm kiếm & kết nối KOC' };
    case 'COMPLETED':
      return { label: 'Đã hoàn thành', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', text: 'Chiến dịch đã kết thúc' };
    case 'ARCHIVED':
      return { label: 'Đã lưu trữ', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', text: 'Chiến dịch đã lưu trữ' };
    default:
      return { label: 'Bản nháp', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', text: 'Chưa khởi chạy chính thức' };
  }
};

