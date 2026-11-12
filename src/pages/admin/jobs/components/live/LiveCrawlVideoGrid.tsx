import React from 'react';
import { Row, Col, Card, Typography } from 'antd';
import { EyeOutlined, LikeOutlined, MessageOutlined, ShareAltOutlined } from '@ant-design/icons';
import type { LiveCrawlResult } from '../../../../../types/api/crawler.types';

const { Text, Paragraph } = Typography;

interface LiveCrawlVideoGridProps {
  result: LiveCrawlResult;
}

export default function LiveCrawlVideoGrid({ result }: LiveCrawlVideoGridProps) {
  const posts = result.recent_posts || [];

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
          Danh sách nội dung trích xuất ({posts.length} bài đăng gần nhất)
        </div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Dữ liệu bài đăng thực tế thu thập từ kênh công khai
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {posts.map((post, idx) => (
          <Col xs={24} sm={12} md={8} lg={6} key={post.platformPostId || idx}>
            <Card
              hoverable
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid #E2E8F0',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
              bodyStyle={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}
              cover={
                <div style={{ position: 'relative', height: 160, background: '#1E293B' }}>
                  <img
                    src={post.coverUrl || `https://picsum.photos/seed/${result.username}_${idx}/300/200`}
                    alt={post.caption}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      background: 'rgba(0,0,0,0.7)',
                      color: '#FFFFFF',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <EyeOutlined /> {(post.views || 0).toLocaleString()} lượt xem
                  </div>
                </div>
              }
            >
              <Paragraph
                ellipsis={{ rows: 2, tooltip: post.caption }}
                style={{ fontSize: 12.5, fontWeight: 600, color: '#1E293B', marginBottom: 10, flex: 1 }}
              >
                {post.caption || `Nội dung bài đăng #${idx + 1}`}
              </Paragraph>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 11.5,
                  color: '#64748B',
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: 8,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <LikeOutlined style={{ color: '#E11D48' }} /> {(post.likes || 0).toLocaleString()}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MessageOutlined style={{ color: '#3B82F6' }} /> {(post.comments || 0).toLocaleString()}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShareAltOutlined style={{ color: '#10B981' }} /> {(post.shares || 0).toLocaleString()}
                </span>
              </div>

              {post.postUrl && (
                <a
                  href={post.postUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'block',
                    marginTop: 10,
                    textAlign: 'center',
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: '#6366F1',
                    padding: '4px 0',
                    borderRadius: 6,
                    background: '#EEF2FF',
                  }}
                >
                  Xem bài đăng trên {result.platform} ↗
                </a>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
