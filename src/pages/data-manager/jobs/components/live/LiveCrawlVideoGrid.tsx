import React, { useState, useMemo } from 'react';
import { Alert, Row, Col, Card, Typography, Tag } from 'antd';
import {
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  ShareAltOutlined,
  PlayCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { LiveCrawlResult } from '../../../../../types/api/crawler.types';

const { Text, Paragraph } = Typography;

interface LiveCrawlVideoGridProps {
  result: LiveCrawlResult;
}

function formatPostDate(iso?: string): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return null;
  }
}

function VideoCover({
  coverUrl,
  caption,
  views,
}: {
  coverUrl?: string;
  caption?: string;
  views?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const hasValidCover = Boolean(coverUrl && coverUrl.trim() && !imgError);

  return (
    <div
      style={{
        position: 'relative',
        height: 130,
        background: '#0F172A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {hasValidCover ? (
        <img
          src={coverUrl}
          alt={caption || 'Ảnh bài đăng'}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748B',
            gap: 6,
          }}
        >
          <PlayCircleOutlined style={{ fontSize: 36, color: '#475569' }} />
          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>Không có ảnh bìa</span>
        </div>
      )}

      {views != null && views > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
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
          <EyeOutlined /> {views.toLocaleString('vi-VN')} lượt xem
        </div>
      )}
    </div>
  );
}

export default function LiveCrawlVideoGrid({ result }: LiveCrawlVideoGridProps) {
  // Sắp xếp bài đăng mới nhất lên đầu nếu có trường ngày đăng (postedAt)
  const posts = useMemo(() => {
    const list = [...(result.recent_posts || [])];
    return list.sort((a, b) => {
      if (!a.postedAt || !b.postedAt) return 0;
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });
  }, [result.recent_posts]);

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
          Danh sách nội dung trích xuất: {posts.length} bài đăng
        </div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Trích xuất từ trang cá nhân - bao gồm video ghim và bài mới
        </Text>
      </div>

      {!posts.length && (
        <Alert
          type="warning"
          showIcon
          style={{ borderRadius: 8, marginBottom: 16 }}
          message="Chưa trích xuất được bài viết từ kênh này"
          description="Kênh này có thể chưa có video công khai hoặc nền tảng tạm thời giới hạn đọc bài viết. Bạn vẫn có thể đối chiếu thông tin tiểu sử và lượt theo dõi ở trên để đưa ra quyết định Duyệt hoặc Loại bỏ."
        />
      )}
      <Row gutter={[12, 12]} style={{ marginLeft: 0, marginRight: 0 }}>
        {posts.map((post, idx) => {
          const postDate = formatPostDate(post.postedAt);

          return (
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
                bodyStyle={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}
                cover={
                  <VideoCover
                    coverUrl={post.coverUrl}
                    caption={post.caption}
                    views={post.views}
                  />
                }
              >
                {postDate && (
                  <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CalendarOutlined style={{ fontSize: 11 }} /> Ngày đăng: {postDate}
                    </span>
                    {(post as any).isPinned && (
                      <Tag color="purple" style={{ fontSize: 10, padding: '0 4px', margin: 0, fontWeight: 600 }}>
                        Đã ghim
                      </Tag>
                    )}
                  </div>
                )}

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
                    <MessageOutlined style={{ color: '#8B5CF6' }} /> {(post.comments || 0).toLocaleString()}
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
                      color: '#7C3AED',
                      padding: '4px 0',
                      borderRadius: 6,
                      background: '#F3E8FF',
                    }}
                  >
                    Xem bài đăng trên {result.platform} ↗
                  </a>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
