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
        marginBottom: 20,
        boxShadow: '0 1px 6px rgba(0,0,0,0.03)',
      }}
      bodyStyle={{ padding: 22 }}
    >
      <Row gutter={[20, 20]} align="top">
        {/* Avatar + Main Info */}
        <Col xs={24} md={10}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <img
              src={result.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.username}`}
              alt={result.display_name}
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #EEF2FF',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Title level={5} style={{ margin: 0, color: '#0F172A', wordBreak: 'break-word' }}>
                  {result.display_name || result.username}
                </Title>
                {result.is_verified && (
                  <Tooltip title="Tài khoản đã xác minh chính chủ">
                    <SafetyCertificateOutlined style={{ color: '#2563EB', fontSize: 16 }} />
                  </Tooltip>
                )}
                <Tag color="geekblue" style={{ borderRadius: 4, fontWeight: 600, fontSize: 11, margin: 0 }}>
                  {result.platform}
                </Tag>
              </div>

              <div style={{ color: '#4F46E5', fontWeight: 600, fontSize: 13, marginTop: 2 }}>
                @{result.username}
              </div>

              {result.profile_url && (
                <div style={{ marginTop: 4 }}>
                  <a
                    href={result.profile_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <LinkOutlined /> Mở trang cá nhân ↗
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {result.bio && (
            <div
              style={{
                marginTop: 14,
                background: '#F8FAFC',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                fontSize: 12,
                color: '#334155',
                lineHeight: 1.5,
              }}
            >
              <Text strong style={{ color: '#64748B', fontSize: 11, display: 'block', marginBottom: 2 }}>
                TIỂU SỬ KÊNH
              </Text>
              <div style={{ wordBreak: 'break-word' }}>{result.bio}</div>
            </div>
          )}
        </Col>

        {/* Statistics Grid */}
        <Col xs={24} md={14}>
          <Row gutter={[12, 12]}>
            <Col xs={12} sm={12} md={6}>
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  padding: '12px 8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>
                  NGƯỜI THEO DÕI
                </div>
                <Tooltip title={`${followersFull} người theo dõi`}>
                  <div
                    style={{
                      fontSize: 19,
                      fontWeight: 800,
                      color: '#1E293B',
                      marginTop: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {formatViNumber(result.followers)}
                  </div>
                </Tooltip>
                <div style={{ fontSize: 10.5, color: '#10B981', marginTop: 2, whiteSpace: 'nowrap' }}>
                  {followersFull}
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} md={6}>
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  padding: '12px 8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>
                  LƯỢT THÍCH
                </div>
                <Tooltip title={`${heartsFull} lượt thích`}>
                  <div
                    style={{
                      fontSize: 19,
                      fontWeight: 800,
                      color: '#E11D48',
                      marginTop: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {formatViNumber(result.heart_count)}
                  </div>
                </Tooltip>
                <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2, whiteSpace: 'nowrap' }}>
                  {heartsFull}
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} md={6}>
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  padding: '12px 8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>
                  SỐ BÀI ĐĂNG
                </div>
                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 800,
                    color: '#2563EB',
                    marginTop: 4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatFullNumber(videoCount)}
                </div>
                <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2, whiteSpace: 'nowrap' }}>
                  Đã xuất bản
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} md={6}>
              <div
                style={{
                  background: '#F0FDF4',
                  borderRadius: 10,
                  border: '1px solid #BBF7D0',
                  padding: '12px 8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', whiteSpace: 'nowrap' }}>
                  TƯƠNG TÁC
                </div>
                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 800,
                    color: '#15803D',
                    marginTop: 4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {engagementRate > 0 ? `${engagementRate}%` : '—'}
                </div>
                <div style={{ fontSize: 10.5, color: '#15803D', marginTop: 2, whiteSpace: 'nowrap' }}>
                  Trung bình
                </div>
              </div>
            </Col>
          </Row>

          {/* Metadata */}
          <div style={{ marginTop: 14, fontSize: 12, color: '#64748B', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>
              <strong>Mã tác giả:</strong> <Text code>{result.author_id || 'Chưa có'}</Text>
            </span>
            <span>
              <strong>Thời gian cào:</strong> {new Date().toLocaleTimeString('vi-VN')}
            </span>
            <span>
              <strong>Chế độ:</strong> Trực tiếp thời gian thực
            </span>
          </div>
        </Col>
      </Row>
    </Card>
  );
}
