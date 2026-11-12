import React from 'react';
import { Button, Tag, Dropdown } from 'antd';
import {
  CheckCircleFilled,
  MoreOutlined,
  EyeOutlined,
  SaveOutlined,
  MessageOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import type { Creator, BrandCampaignItem } from './types';
import CreatorAvatar from './CreatorAvatar';
import { getDisplayBio } from './discoveryUtils';

interface CreatorCardProps {
  creator: Creator;
  index: number;
  isSelected: boolean;
  matchedCampaign: BrandCampaignItem | null;
  safeCurrentPage: number;
  onToggleSelect: (id: string) => void;
  onOpenCreator: (creator: Creator) => void;
  onOpenShortlist: (creator: Creator, e?: React.MouseEvent) => void;
  onPreview: (creator: Creator) => void;
  onShare: (creator: Creator) => void;
  onMessage: () => void;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({
  creator,
  index,
  isSelected,
  matchedCampaign,
  safeCurrentPage,
  onToggleSelect,
  onOpenCreator,
  onOpenShortlist,
  onPreview,
  onShare,
  onMessage,
}) => {
  const displayTags = (creator.categories || [])
    .flatMap((cat) => cat.split(/[,;]/).map((s) => s.trim()))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="cdiscovery-card">
      {/* Hàng 1: Checkbox + Avatar + Tên + Badge Phù hợp + Menu ⋮ */}
      <div className="cdiscovery-card-top-row">
        <div className="cdiscovery-card-left-group">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(creator.id);
            }}
            className="cdiscovery-checkbox"
          />
          <div
            className="cdiscovery-card-avatar-wrap"
            onClick={() => onOpenCreator(creator)}
          >
            <CreatorAvatar src={creator.avatar} name={creator.name} size={44} />
          </div>
          <div
            className="cdiscovery-card-author-meta"
            onClick={() => onOpenCreator(creator)}
          >
            <div className="cdiscovery-card-name-title">
              <span>{creator.name}</span>
              {creator.isVerified && (
                <CheckCircleFilled style={{ color: '#3B82F6', fontSize: 13 }} />
              )}
              {creator.isSimilarFallback && (
                <Tag color="orange" style={{ borderRadius: 999, fontSize: 10, padding: '0 6px', margin: '0 0 0 4px', lineHeight: '18px', fontWeight: 600 }}>
                  Expanded
                </Tag>
              )}
            </div>
            <div className="cdiscovery-card-username-text">
              @{creator.username}
            </div>
          </div>
        </div>

        <div className="cdiscovery-card-right-group">
          {matchedCampaign && safeCurrentPage === 1 && index === 0 && creator.matchRate >= 70 && (
            <span style={{
              background: '#FEF9C3',
              color: '#854D0E',
              fontWeight: 800,
              fontSize: 10.5,
              padding: '2px 8px',
              borderRadius: 999,
              border: '1px solid #FDE047',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              boxShadow: '0 1px 2px rgba(234, 179, 8, 0.15)',
            }}>
              Top 1
            </span>
          )}
          {matchedCampaign && safeCurrentPage === 1 && index === 1 && creator.matchRate >= 70 && (
            <span style={{
              background: '#F1F5F9',
              color: '#475569',
              fontWeight: 800,
              fontSize: 10.5,
              padding: '2px 8px',
              borderRadius: 999,
              border: '1px solid #CBD5E1',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}>
              Top 2
            </span>
          )}
          {matchedCampaign && safeCurrentPage === 1 && index === 2 && creator.matchRate >= 70 && (
            <span style={{
              background: '#FFF7ED',
              color: '#9A3412',
              fontWeight: 800,
              fontSize: 10.5,
              padding: '2px 8px',
              borderRadius: 999,
              border: '1px solid #FDBA74',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}>
              Top 3
            </span>
          )}
          {matchedCampaign && creator.matchRate > 0 ? (
            <span className="cdiscovery-match-tag-pill">
              ✦ {creator.matchRate}% Phù hợp
            </span>
          ) : (
            <Tag
              color="default"
              style={{
                borderRadius: 12,
                margin: 0,
                fontWeight: 600,
                fontSize: 11,
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#64748B',
                textTransform: 'uppercase',
              }}
            >
              {creator.platforms[0] || 'TikTok'}
            </Tag>
          )}
          <Dropdown
            menu={{
              items: [
                { key: 'preview', label: 'Xem nhanh tóm tắt', icon: <EyeOutlined /> },
                { key: 'shortlist', label: 'Lưu vào danh sách', icon: <SaveOutlined /> },
                { key: 'message', label: 'Gửi tin nhắn', icon: <MessageOutlined /> },
                { key: 'share', label: 'Chia sẻ hồ sơ', icon: <GlobalOutlined /> },
              ],
              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation();
                if (key === 'preview') onPreview(creator);
                else if (key === 'shortlist') onOpenShortlist(creator);
                else if (key === 'share') onShare(creator);
                else if (key === 'message') onMessage();
              },
            }}
            trigger={['click']}
          >
            <button
              className="cdiscovery-card-dots-btn"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreOutlined />
            </button>
          </Dropdown>
        </div>
      </div>

      {/* Hàng 2: Tags Niche / Category pastel */}
      <div className="cdiscovery-card-tags-row">
        {displayTags.map((tag) => (
          <span key={tag} className="cdiscovery-niche-pill">
            {tag}
          </span>
        ))}
      </div>

      {/* Hàng 3: Box 3 Metrics chia cột */}
      <div className="cdiscovery-card-metrics-box">
        <div className="cdiscovery-metric-col">
          <span className="cdiscovery-metric-number">{creator.followers}</span>
          <span className="cdiscovery-metric-caption">Người theo dõi</span>
        </div>
        <div className="cdiscovery-metric-col">
          <span className="cdiscovery-metric-number">{creator.engagementRate}</span>
          <span className="cdiscovery-metric-caption">Tương tác</span>
        </div>
        <div className="cdiscovery-metric-col">
          <span className="cdiscovery-metric-number">{creator.avgPrice}</span>
          <span className="cdiscovery-metric-caption">Báo giá tham khảo</span>
        </div>
      </div>

      {/* Hàng 4: Bio ngắn */}
      <div className="cdiscovery-card-bio-text" title={getDisplayBio(creator)}>
        {getDisplayBio(creator)}
      </div>

      {/* Hàng 5: 2 Nút hành động ở chân thẻ */}
      <div className="cdiscovery-card-actions-row">
        <Button
          className="cdiscovery-btn-profile-card"
          onClick={() => onOpenCreator(creator)}
        >
          Xem hồ sơ
        </Button>
        <Button
          type="primary"
          className={`cdiscovery-btn-shortlist-card ${creator.saved ? 'saved' : ''}`}
          onClick={(e) => onOpenShortlist(creator, e)}
        >
          {creator.saved ? '✓ Đã lưu danh sách' : '+ Lưu vào danh sách'}
        </Button>
      </div>
    </div>
  );
};

export default CreatorCard;

