import React from 'react';
import { Drawer, Button, Tag } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import type { Creator, BrandCampaignItem } from './types';
import CreatorAvatar from './CreatorAvatar';

interface CreatorDetailDrawerProps {
  visible: boolean;
  creator: Creator | null;
  matchedCampaign: BrandCampaignItem | null;
  isRefreshing?: boolean;
  onClose: () => void;
  onRefreshStats?: () => void;
  onOpenShortlist: (creator: Creator) => void;
  showMatch?: boolean;
  actionLabel?: string;
  actionDisabled?: boolean;
}

export const CreatorDetailDrawer: React.FC<CreatorDetailDrawerProps> = ({
  visible, creator, matchedCampaign, isRefreshing = false, onClose, onRefreshStats,
  onOpenShortlist, showMatch = true, actionLabel, actionDisabled,
}) => {
  const hasMatch = showMatch && matchedCampaign && creator && Number.isFinite(creator.matchRate)
    && (creator.matchRate > 0 || !!creator.matchReason?.trim());
  const bio = creator?.bio?.trim();
  const hasBio = !!bio && !/^(creator|koc|kol)$/i.test(bio);
  const categories = [...new Set(creator?.categories.filter(Boolean) ?? [])];
  const platformNames: Record<string, string> = { tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', facebook: 'Facebook', x: 'X' };

  return (
    <Drawer rootClassName="cdiscovery-drawer creator-profile-drawer" title="Hồ sơ nhà sáng tạo"
      placement="right" size="min(560px, 100vw)" onClose={onClose} open={visible}
      extra={onRefreshStats && <Button type="text" size="small" icon={<SyncOutlined />} loading={isRefreshing} onClick={onRefreshStats}>Tải lại hồ sơ</Button>}
      footer={creator && <div className="creator-profile-footer"><Button onClick={onClose}>Đóng</Button><Button type="primary"
        disabled={actionDisabled ?? (!actionLabel && creator.saved === true)}
        onClick={() => onOpenShortlist(creator)}>{actionLabel || (creator.saved ? 'Đã trong danh sách chọn' : 'Lưu vào danh sách')}</Button></div>}
    >
      {creator && <div className="creator-profile-content">
        <header className="creator-profile-identity">
          <CreatorAvatar src={creator.avatar} name={creator.name} size={60} />
          <div><h2>{creator.name || 'Kênh chưa có tên'}</h2><p>{creator.username ? '@' + creator.username.replace(/^@+/, '') : 'Chưa có tên tài khoản'}</p>
            <div className="creator-profile-tags">{creator.platforms.map(platform => <Tag key={platform}>{platformNames[platform] || platform}</Tag>)}{creator.isVerified && <Tag>Đã xác minh</Tag>}</div>
          </div>
        </header>

        <section className="creator-profile-section"><h3>Thông tin kênh</h3>
          <dl className="creator-profile-metrics">
            <div><dt>Người theo dõi</dt><dd>{creator.followers || 'Chưa có dữ liệu'}</dd></div>
            <div><dt>Tỷ lệ tương tác</dt><dd>{creator.engagementRate || 'Chưa có dữ liệu'}</dd></div>
          </dl>
          <div className="creator-profile-fee"><span>Báo giá tham khảo</span><strong>{creator.avgPrice || 'Chưa có báo giá'}</strong>{creator.priceSource && <small>{creator.priceSource}</small>}</div>
        </section>

        <section className="creator-profile-section"><h3>Giới thiệu</h3><p>{hasBio ? bio : 'Chưa có giới thiệu về kênh.'}</p></section>
        <section className="creator-profile-section"><h3>Lĩnh vực nội dung</h3>{categories.length ? <div className="creator-profile-categories">{categories.map(category => <Tag key={category}>{category}</Tag>)}</div> : <p>Chưa có thông tin lĩnh vực.</p>}</section>
        <section className="creator-profile-section"><h3>Địa điểm</h3><p>{creator.location || 'Chưa có thông tin địa điểm.'}</p></section>

        {hasMatch && <section className="creator-profile-section creator-profile-match"><h3>Đánh giá với chiến dịch</h3><p className="creator-profile-campaign">{matchedCampaign.name}</p><div><span>Điểm phù hợp</span><strong>{creator.matchRate.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} / 100</strong></div>{creator.matchReason && <p>{creator.matchReason}</p>}</section>}
      </div>}
    </Drawer>
  );
};

export default CreatorDetailDrawer;
