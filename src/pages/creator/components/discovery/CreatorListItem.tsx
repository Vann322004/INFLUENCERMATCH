import React from 'react';
import { Card, Row, Col, Space, Button, Tag } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import type { Creator, BrandCampaignItem } from './types';
import CreatorAvatar from './CreatorAvatar';

interface CreatorListItemProps {
  creator: Creator;
  index: number;
  isSelected: boolean;
  matchedCampaign: BrandCampaignItem | null;
  onToggleSelect: (id: string) => void;
  onOpenCreator: (creator: Creator) => void;
  onOpenShortlist: (creator: Creator, e?: React.MouseEvent) => void;
}

export const CreatorListItem: React.FC<CreatorListItemProps> = ({
  creator,
  isSelected,
  matchedCampaign,
  onToggleSelect,
  onOpenCreator,
  onOpenShortlist,
}) => {
  return (
    <Card
      bordered={false}
      className="cdiscovery-card"
      styles={{ body: { padding: '16px 20px' } }}
    >
      <Row align="middle" gutter={[16, 16]}>
        <Col xs={24} sm={10} md={9}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
              style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}
              onClick={() => onOpenCreator(creator)}
            >
              <CreatorAvatar src={creator.avatar} name={creator.name} size={46} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 14.5, color: '#0F172A' }}>
                    {creator.name}
                  </span>
                  {creator.isVerified && (
                    <CheckCircleFilled style={{ color: '#3B82F6', fontSize: 13 }} />
                  )}
                  {creator.isSimilarFallback && (
                    <Tag color="orange" style={{ borderRadius: 999, fontSize: 10, padding: '0 6px', margin: '0 0 0 4px', lineHeight: '18px', fontWeight: 600 }}>
                      Expanded
                    </Tag>
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
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  @{creator.username}
                </div>
              </div>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={7} md={7}>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
                {creator.followers}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>Người theo dõi</div>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
                {creator.engagementRate}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>Tương tác</div>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
                {creator.avgPrice}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>Báo giá tham khảo</div>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={7} md={8} style={{ textAlign: 'right' }}>
          <Space size="small">
            <Button
              className="cdiscovery-btn-profile-card"
              onClick={() => onOpenCreator(creator)}
            >
              Xem hồ sơ
            </Button>
            <Button
              type="primary"
              className="cdiscovery-btn-shortlist-card"
              onClick={(e) => onOpenShortlist(creator, e)}
            >
              {creator.saved ? '✓ Đã lưu danh sách' : '+ Lưu vào danh sách'}
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default CreatorListItem;

