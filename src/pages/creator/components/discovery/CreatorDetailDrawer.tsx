import React from 'react';
import { Drawer, Button, Tag, Row, Col, Tooltip } from 'antd';
import {
  SyncOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  InstagramOutlined,
  YoutubeOutlined,
  FacebookOutlined,
  TwitterOutlined,
} from '@ant-design/icons';
import type { Creator, BrandCampaignItem } from './types';
import CreatorAvatar from './CreatorAvatar';
import { computeCreatorMatch } from './discoveryUtils';

interface CreatorDetailDrawerProps {
  visible: boolean;
  creator: Creator | null;
  matchedCampaign: BrandCampaignItem | null;
  isRefreshing: boolean;
  onClose: () => void;
  onRefreshStats: () => void;
  onOpenShortlist: (creator: Creator) => void;
}

export const CreatorDetailDrawer: React.FC<CreatorDetailDrawerProps> = ({
  visible,
  creator,
  matchedCampaign,
  isRefreshing,
  onClose,
  onRefreshStats,
  onOpenShortlist,
}) => {
  const renderPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok':
        return (
          <Tooltip title="TikTok" key={platform}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#0F172A',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              🎵
            </span>
          </Tooltip>
        );
      case 'instagram':
        return (
          <Tooltip title="Instagram" key={platform}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
              }}
            >
              <InstagramOutlined />
            </span>
          </Tooltip>
        );
      case 'youtube':
        return (
          <Tooltip title="YouTube" key={platform}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#EF4444',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
              }}
            >
              <YoutubeOutlined />
            </span>
          </Tooltip>
        );
      case 'facebook':
        return (
          <Tooltip title="Facebook" key={platform}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#2563EB',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
              }}
            >
              <FacebookOutlined />
            </span>
          </Tooltip>
        );
      case 'x':
        return (
          <Tooltip title="X (Twitter)" key={platform}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#000000',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
              }}
            >
              <TwitterOutlined />
            </span>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  return (
    <Drawer
      rootClassName="cdiscovery-drawer"
      title={
        creator ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CreatorAvatar src={creator.avatar} name={creator.name} size={38} />
              <div>
                <div style={{ fontWeight: 500, fontSize: 15, color: '#0F172A' }}>
                  {creator.name}
                </div>
                <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
                  @{creator.username}
                </div>
              </div>
            </div>

            <Button
              size="small"
              icon={<SyncOutlined spin={isRefreshing} />}
              loading={isRefreshing}
              onClick={onRefreshStats}
              style={{
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 500,
                borderColor: '#818CF8',
                color: '#4F46E5',
                background: '#EEF2FF',
              }}
            >
              Làm mới số liệu
            </Button>
          </div>
        ) : (
          'Chi tiết KOC'
        )
      }
      placement="right"
      width="min(520px, 100vw)"
      onClose={onClose}
      open={visible}
    >
      {creator && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)',
              padding: '16px',
              borderRadius: 12,
              border: '1px solid #DBEAFE',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 500, fontSize: 13, color: '#1E40AF' }}>
                Độ tương thích AI
              </span>
              {matchedCampaign ? (
                <Tag color="green" style={{ fontWeight: 500, borderRadius: 6 }}>
                  {creator.matchRate}% Độ phù hợp ({matchedCampaign.name})
                </Tag>
              ) : (
                <Tag color="default" style={{ borderRadius: 6, color: '#64748B' }}>
                  Chưa chọn dự án đối soát
                </Tag>
              )}
            </div>
            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
              {matchedCampaign
                ? (creator.matchReason || computeCreatorMatch(creator, matchedCampaign).reason)
                : 'Vui lòng chọn một Dự án / Chiến dịch ở đầu trang và bấm "Tìm KOC phù hợp" để AI tính toán tỷ lệ tương thích chi tiết.'}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div>
            <div style={{ fontWeight: 500, fontSize: 13, color: '#0F172A', marginBottom: 10 }}>
              Chỉ số hiệu quả chính
            </div>
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontWeight: 500, fontSize: 16, color: '#0F172A' }}>
                    {creator.followers}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Người theo dõi</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontWeight: 500, fontSize: 16, color: '#0F172A' }}>
                    {creator.engagementRate}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Tương tác</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontWeight: 500, fontSize: 16, color: '#0F172A' }}>
                    {creator.avgPrice}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Giá TB/Bài</div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Bio & Categories */}
          <div>
            <div style={{ fontWeight: 500, fontSize: 13, color: '#0F172A', marginBottom: 6 }}>
              Giới thiệu & Lĩnh vực
            </div>
            <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, marginBottom: 10 }}>
              {creator.bio}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {creator.categories.map((cat) => (
                <Tag key={cat} color="blue" style={{ borderRadius: 6 }}>
                  {cat}
                </Tag>
              ))}
            </div>
          </div>

          {/* Location & Platforms */}
          <div>
            <div style={{ fontWeight: 500, fontSize: 13, color: '#0F172A', marginBottom: 8 }}>
              Kênh hoạt động & Địa điểm
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <EnvironmentOutlined style={{ color: '#4F46E5' }} />
              <span style={{ fontSize: 12.5, color: '#334155' }}>{creator.location}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {creator.platforms.map(renderPlatformIcon)}
            </div>
          </div>

          {/* Action Buttons inside drawer */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <Button
              type="primary"
              block
              icon={<ThunderboltOutlined />}
              onClick={() => onOpenShortlist(creator)}
              style={{
                background: '#5B5BF0',
                fontWeight: 500,
                height: 40,
                borderRadius: 10,
              }}
            >
              Mời hợp tác
            </Button>
            <Button
              onClick={() => onOpenShortlist(creator)}
              style={{
                height: 40,
                borderRadius: 10,
                fontWeight: 500,
                borderColor: creator.saved ? '#FECDD3' : '#E2E8F0',
                color: creator.saved ? '#EF4444' : '#334155',
              }}
            >
              {creator.saved ? 'Đã lưu danh sách' : 'Lưu vào danh sách'}
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default CreatorDetailDrawer;

