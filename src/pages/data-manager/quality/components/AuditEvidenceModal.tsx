import { useEffect, useState } from 'react';
import { Alert, Avatar, Button, Card, Descriptions, Empty, Modal, Skeleton, Space, Table, Tag, Typography } from 'antd';
import { GlobalOutlined, LinkOutlined } from '@ant-design/icons';
import { crawlerService } from '../../../../services/api/crawlerService';
import { auditHttpUrl, auditProfileUrl } from '../../../../services/auditPresentation';
import { PLATFORM_COLOR_MAP } from '../types';
import type { AuditItem } from './BatchAuditTab';

const { Text } = Typography;

const REASON_LABELS: Record<string, string> = {
  BR01_REJECT_COMMERCIAL_STORE: 'Kênh bán hàng / Gian hàng thương mại',
  BR01_REJECT_ORGANIZATION: 'Cơ quan / Báo chí / Tổ chức không phải cá nhân',
  BR01_REJECT_SPAM_CATALOG: 'Nội dung quảng cáo / Sao chép video',
  TIER0_REJECT_LOW_FOLLOWERS: 'Lượng người theo dõi quá thấp - dưới 1.000',
  TIER0_STORE_HANDLE_REQUIRES_POST_EVIDENCE: 'Tên kênh chứa từ khóa bán hàng',
  BR08_INSUFFICIENT_DATA: 'Thiếu dữ liệu bài đăng để xác minh',
  AUDIT_REQUIRES_REVIEW: 'Cần người duyệt đối chiếu thêm',
  REJECTED_BY_DATA_MANAGER: 'Quản lý từ chối thủ công',
  DATA_MANAGER_REJECTED: 'Quản lý đã loại bỏ hồ sơ',
  TIER0_AUTO_ACCEPT_KOC: 'Đạt chuẩn KOC',
  TIER0_AUTO_ACCEPT_KOL: 'Đạt chuẩn KOL',
  TIER0_KOL_MET: 'Đạt tiêu chuẩn KOL có uy tín hoặc chứng nhận',
};

export function formatReason(code: string): string {
  return REASON_LABELS[code] || code;
}

export default function AuditEvidenceModal({
  item,
  runId,
  onClose,
}: {
  item: AuditItem | null;
  runId: string;
  onClose: () => void;
}) {
  const [evidence, setEvidence] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!item) return;
    let active = true;
    setEvidence(null);
    setError('');
    setLoading(true);

    const request =
      item.posts !== undefined
        ? Promise.resolve({ ...item, evidenceSource: 'AUDIT_SNAPSHOT' })
        : crawlerService.getAuditEvidence(item.creatorId, item.platform, item.username, runId);

    request
      .then((value) => {
        if (active) setEvidence(value);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Không tải được dữ liệu hồ sơ đã lưu.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [item, runId]);

  if (!item) return null;

  const profileUrl = auditProfileUrl({ ...item, profileUrl: evidence?.profileUrl || item?.profileUrl });
  const isJunk =
    item.isJunk ||
    item.status === 'JUNK_SHOP_CATALOG' ||
    ['BRAND', 'SPAM', 'ORGANIZATION'].includes(item.creatorType?.toUpperCase() || '');
  const isValid = !isJunk && (item.status === 'VALID_KOC' || item.status === 'VALID_KOL');

  return (
    <Modal
      open={!!item}
      title={
        <Space align="center" size={10}>
          <Avatar
            style={{
              backgroundColor: isJunk ? '#ff4d4f' : isValid ? '#52c41a' : '#faad14',
              color: '#fff',
              fontWeight: 'bold',
            }}
          >
            {(item.displayName || item.username || '?').charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {item.displayName || item.username}{' '}
              <Tag color={PLATFORM_COLOR_MAP[item.platform?.toLowerCase() || ''] || 'blue'}>
                {item.platform}
              </Tag>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>@{item.username}</div>
          </div>
        </Space>
      }
      onCancel={onClose}
      width={850}
      footer={
        <Space>
          {profileUrl && (
            <Button
              icon={<GlobalOutlined />}
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở kênh gốc
            </Button>
          )}
          <Button type="primary" onClick={onClose}>
            Đóng
          </Button>
        </Space>
      }
    >
      <div style={{ marginTop: 12 }}>
        {isJunk ? (
          <Alert
            type="error"
            showIcon
            message="Tài khoản này được xác định là Rác hoặc Kênh bán hàng"
            description={
              <div>
                <p style={{ margin: '4px 0' }}>
                  Lý do vi phạm:{' '}
                  <strong>
                    {item.reasonCodes?.length
                      ? item.reasonCodes.map(formatReason).join(', ')
                      : 'Phát hiện tín hiệu bán hàng / spam hoặc không đạt chuẩn cá nhân sáng tạo.'}
                  </strong>
                </p>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Hồ sơ này sẽ được cách ly và ẩn khỏi sàn tìm kiếm để bảo vệ chất lượng dữ liệu.
                </span>
              </div>
            }
            style={{ marginBottom: 16 }}
          />
        ) : isValid ? (
          <Alert
            type="success"
            showIcon
            message="Hồ sơ đạt chuẩn nhà sáng tạo"
            description="Tài khoản có lượng tương tác và nội dung phù hợp tiêu chuẩn nhà sáng tạo."
            style={{ marginBottom: 16 }}
          />
        ) : (
          <Alert
            type="warning"
            showIcon
            message="Hồ sơ cần người quản lý đối chiếu thêm"
            description={
              item.reasonCodes?.length
                ? `Lý do: ${item.reasonCodes.map(formatReason).join(', ')}`
                : 'Chưa đủ bài đăng để hệ thống tự động kết luận an toàn. Vui lòng kiểm tra các mẫu bài viết bên dưới.'
            }
            style={{ marginBottom: 16 }}
          />
        )}

        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2, md: 3 }}
          items={[
            {
              key: 'platform',
              label: 'Nền tảng',
              children: <Tag color={PLATFORM_COLOR_MAP[item.platform?.toLowerCase() || '']}>{item.platform}</Tag>,
            },
            {
              key: 'followers',
              label: 'Người theo dõi',
              children: <Text strong>{Number(item.followers || 0).toLocaleString('vi-VN')}</Text>,
            },
            {
              key: 'postsChecked',
              label: 'Mẫu bài kiểm tra',
              children: `${item.postsChecked || 0} bài đăng`,
            },
            {
              key: 'confidence',
              label: 'Độ tin cậy dữ liệu',
              children: (
                <Text
                  style={{
                    color: item.newConfidence >= 0.7 ? '#16a34a' : item.newConfidence >= 0.4 ? '#ca8a04' : '#dc2626',
                    fontWeight: 600,
                  }}
                >
                  {Math.round((item.newConfidence || 0) * 100)}%
                </Text>
              ),
            },
            {
              key: 'action',
              label: 'Trạng thái xử lý',
              children: (
                <Tag color={isJunk ? 'red' : isValid ? 'green' : 'orange'}>
                  {item.actionTaken === 'QUARANTINED_IN_STAGING'
                    ? 'Đã cách ly khỏi sàn'
                    : item.actionTaken === 'UPDATED_JAVA_BACKEND'
                    ? 'Đã đồng bộ chuẩn'
                    : item.actionTaken === 'QUEUED_FOR_MANAGER_REVIEW'
                    ? 'Chờ duyệt'
                    : item.actionTaken || 'Đã kiểm tra'}
                </Tag>
              ),
            },
            {
              key: 'runId',
              label: 'Mã đợt quét',
              children: <Text type="secondary" copyable style={{ fontSize: 11 }}>{runId || 'N/A'}</Text>,
            },
          ]}
        />

        {(evidence?.bio || item.bio || evidence?.contentSummary || item.contentSummary) && (
          <Card
            size="small"
            title="Tiểu sử kênh"
            style={{ marginTop: 16, backgroundColor: '#f8fafc', borderRadius: 8 }}
          >
            <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13 }}>
              {evidence?.bio || item.bio || evidence?.contentSummary || item.contentSummary}
            </Typography.Paragraph>
          </Card>
        )}

        <div style={{ marginTop: 20 }}>
          <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
            Danh sách bài đăng trích xuất dùng để đánh giá: {evidence?.posts?.length || 0} bài
          </Text>

          {loading ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : error ? (
            <Alert type="error" message={error} />
          ) : (
            <Table
              dataSource={evidence?.posts || []}
              size="small"
              pagination={{ pageSize: 5 }}
              rowKey={(row: any, idx) => row.platformPostId || row.postUrl || `post-${idx}`}
              locale={{
                emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu bài đăng trích xuất" />,
              }}
              columns={[
                {
                  title: 'Nội dung bài đăng',
                  dataIndex: 'caption',
                  render: (text: string) => (
                    <div
                      style={{
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                        maxHeight: 90,
                        overflowY: 'auto',
                        fontSize: 12,
                      }}
                    >
                      {text || <Text type="secondary">Chưa có nội dung mô tả</Text>}
                    </div>
                  ),
                },
                {
                  title: 'Lượt xem',
                  dataIndex: 'views',
                  width: 120,
                  render: (v: number) => (
                    <span style={{ fontSize: 12 }}>
                      {v != null ? Number(v).toLocaleString('vi-VN') : '—'}
                    </span>
                  ),
                },
                {
                  title: 'Bài gốc',
                  width: 100,
                  render: (_: any, row: any) =>
                    auditHttpUrl(row.postUrl) ? (
                      <Button
                        type="link"
                        size="small"
                        icon={<LinkOutlined />}
                        href={auditHttpUrl(row.postUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Xem
                      </Button>
                    ) : (
                      <Text type="secondary" style={{ fontSize: 11 }}>Không có liên kết</Text>
                    ),
                },
              ]}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
