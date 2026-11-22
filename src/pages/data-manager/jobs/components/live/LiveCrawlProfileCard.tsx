import CrawlAvatar from '../../../../../components/common/CrawlAvatar';
import React from 'react';
import { Card, Row, Col, Typography, Tag, Tooltip } from 'antd';
import { SafetyCertificateOutlined, LinkOutlined } from '@ant-design/icons';
import type { LiveCrawlResult } from '../../../../../types/api/crawler.types';
import { formatViNumber, formatFullNumber } from '../../../../../utils/formatters';

const { Text, Title } = Typography;

interface LiveCrawlProfileCardProps {
  result: LiveCrawlResult;
  engagementRate: number;
}

export default function LiveCrawlProfileCard({ result, engagementRate }: LiveCrawlProfileCardProps) {
  const followersFull = formatFullNumber(result.followers);
  const heartsFull = formatFullNumber(result.heart_count);
  const videoCount = result.video_count || result.recent_posts?.length || 0;

  return (
    <Card
      style={{
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        marginBottom: 12,
        boxShadow: '0 1px 6px rgba(0,0,0,0.03)',
        overflow: 'hidden',
      }}
      bodyStyle={{ padding: '14px 18px' }}
    >
      {/* Thông tin hồ sơ chính */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
        <CrawlAvatar src={result.avatar_url || result.avatarUrl} fallbackSrc={result.avatar_fallback_url} name={result.display_name || result.username} size={56} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Title level={5} style={{ margin: 0, color: '#0F172A', wordBreak: 'break-word', fontSize: 15 }}>
                {result.display_name || result.username}
              </Title>
              {result.is_verified && (
                <Tooltip title="Tài khoản đã xác minh chính chủ">
                  <SafetyCertificateOutlined style={{ color: '#7C3AED', fontSize: 15 }} />
                </Tooltip>
              )}
              <Tag color="geekblue" style={{ borderRadius: 4, fontWeight: 600, fontSize: 11, margin: 0 }}>
                {result.platform}
              </Tag>
            </div>

            {result.profile_url && (
              <a
                href={result.profile_url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}
              >
                <LinkOutlined /> Mở trang cá nhân ↗
              </a>
            )}
          </div>

          <div style={{ color: '#6D28D9', fontWeight: 600, fontSize: 12.5, marginTop: 2 }}>
            @{result.username}
          </div>

          {result.bio && (
            <div
              style={{
                marginTop: 8,
                background: '#F8FAFC',
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                fontSize: 12,
                color: '#334155',
                lineHeight: 1.45,
                wordBreak: 'break-word',
              }}
            >
              <Text strong style={{ color: '#64748B', fontSize: 10.5, display: 'block', marginBottom: 2 }}>
                TIỂU SỬ KÊNH
              </Text>
              <div>{result.bio}</div>
            </div>
          )}
        </div>
      </div>

      {/* Lưới 4 chỉ số thống kê - Chiếm toàn bộ chiều rộng thẻ, không bị ép lệch */}
      <Row gutter={[10, 10]} style={{ marginLeft: 0, marginRight: 0, marginBottom: 12 }}>
        <Col xs={12} sm={12} md={6}>
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              padding: '8px 6px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B' }}>
              NGƯỜI THEO DÕI
            </div>
            <Tooltip title={`${followersFull} người theo dõi`}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#1E293B',
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {formatViNumber(result.followers)}
              </div>
            </Tooltip>
            <div style={{ fontSize: 10.5, color: '#10B981', marginTop: 1 }}>
              {followersFull}
            </div>
          </div>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              padding: '8px 6px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B' }}>
              LƯỢT THÍCH
            </div>
            <Tooltip title={`${heartsFull} lượt thích`}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#E11D48',
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {formatViNumber(result.heart_count)}
              </div>
            </Tooltip>
            <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 1 }}>
              {heartsFull}
            </div>
          </div>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              padding: '8px 6px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B' }}>
              TỔNG BÀI TRÊN KÊNH
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#7C3AED',
                marginTop: 2,
                whiteSpace: 'nowrap',
              }}
            >
              {formatFullNumber(videoCount)}
            </div>
            <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 1 }}>
              Đã xuất bản
            </div>
          </div>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <div
            style={{
              background: '#F0FDF4',
              borderRadius: 8,
              border: '1px solid #BBF7D0',
              padding: '8px 6px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#166534' }}>
              TƯƠNG TÁC
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#15803D',
                marginTop: 2,
                whiteSpace: 'nowrap',
              }}
            >
              {engagementRate > 0 ? `${engagementRate}%` : '—'}
            </div>
            <div style={{ fontSize: 10.5, color: '#15803D', marginTop: 1 }}>
              {result.recent_posts?.length ? 'Trung bình bài viết' : 'Chưa có bài để tính'}
            </div>
          </div>
        </Col>
      </Row>

      {/* Thông tin phụ: Mã tác giả & Thời gian thu thập */}
      <div
        style={{
          borderTop: '1px solid #F1F5F9',
          paddingTop: 8,
          fontSize: 11.5,
          color: '#64748B',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <span>
          <strong>Mã tác giả:</strong> <Text code>{result.author_id || 'Chưa có'}</Text>
        </span>
        <span>
          <strong>Thời gian thu thập:</strong>{' '}
          {result.collected_at && !Number.isNaN(Date.parse(result.collected_at))
            ? new Date(result.collected_at).toLocaleString('vi-VN')
            : 'Chưa có thời gian từ nguồn dữ liệu'}
        </span>
      </div>
    </Card>
  );
}
