import { useEffect, useState } from 'react';
import { Alert, Button, Descriptions, Empty, Modal, Skeleton, Space, Table, Typography } from 'antd';
import { crawlerService } from '../../../../services/api/crawlerService';
import { auditHttpUrl, auditProfileUrl } from '../../../../services/auditPresentation';
import type { AuditItem } from './BatchAuditTab';

export default function AuditEvidenceModal({ item, runId, onClose }: {
  item: AuditItem | null; runId: string; onClose: () => void;
}) {
  const [evidence, setEvidence] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!item) return;
    let active = true;
    setEvidence(null); setError(''); setLoading(true);
    const request = item.posts !== undefined
      ? Promise.resolve({ ...item, evidenceSource: 'AUDIT_SNAPSHOT' })
      : crawlerService.getAuditEvidence(item.creatorId, item.platform, item.username, runId);
    request.then(value => { if (active) setEvidence(value); })
      .catch(err => { if (active) setError(err.message || 'Không tải được dữ liệu hồ sơ đã lưu.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [item, runId]);
  const profileUrl = auditProfileUrl({ ...item, profileUrl: evidence?.profileUrl || item?.profileUrl });
  return <Modal open={!!item} title={`Xem hồ sơ @${item?.username || ''}`} onCancel={onClose}
    width={900} footer={<Space>
      {profileUrl && <Button href={profileUrl} target="_blank" rel="noopener noreferrer">Mở kênh gốc</Button>}
      <Button onClick={onClose}>Đóng</Button>
    </Space>}>
    <Alert type="info" showIcon title="Cách ly không xóa hồ sơ"
      description="Đây là dấu chặn cào tự động. Manager có thể đối chiếu lý do, bài đăng và kênh gốc. Mở hồ sơ ở đây không chạy cào lại hoặc tự duyệt tài khoản." />
    <Descriptions column={1} size="small" style={{ marginTop: 16 }} items={[
      { key: 'platform', label: 'Nền tảng', children: item?.platform },
      { key: 'verdict', label: 'Kết luận trong đợt', children: item?.status || 'Chưa rõ' },
      { key: 'reason', label: 'Lý do', children: item?.reasonCodes?.join(', ') || 'Báo cáo cũ chưa lưu lý do chi tiết' },
      { key: 'count', label: 'Số bài đã kiểm tra', children: item?.postsChecked ?? 'Chưa rõ' },
      { key: 'confidence', label: 'Chất lượng dữ liệu', children: 'Đánh giá nguồn, độ mới, độ đầy đủ và tính hợp lý của dữ liệu; không phải xác suất tài khoản là shop hoặc spam.' },
    ]} />
    {loading ? <Skeleton active /> : error ? <Alert type="error" title={error} /> : <>
      {evidence?.evidenceSource === 'CURRENT_DATABASE' && <Alert type="warning" showIcon
        title="Báo cáo cũ chưa lưu mẫu bài thẩm định"
        description="Bên dưới là dữ liệu hiện đang lưu trong hệ thống; không khẳng định đây là mẫu bài đã dùng cho kết luận cũ." />}
      {(evidence?.bio || evidence?.contentSummary) && <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginTop: 16 }}>
        {evidence.bio || evidence.contentSummary}
      </Typography.Paragraph>}
      <Table dataSource={evidence?.posts || []} size="small" pagination={{ pageSize: 5 }}
        rowKey={(row: any) => row.platformPostId || row.postUrl || row.caption}
        locale={{ emptyText: <Empty description="Chưa có bài đăng đã lưu để đối chiếu" /> }} columns={[
          { title: 'Nội dung bài đăng', dataIndex: 'caption', render: (text: string) =>
            <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{text || 'Không có caption'}</div> },
          { title: 'Lượt xem', dataIndex: 'views', width: 100, render: (v: number) => v == null ? 'Chưa có' : v.toLocaleString('vi-VN') },
          { title: 'Bài gốc', width: 100, render: (_: any, row: any) => auditHttpUrl(row.postUrl)
            ? <Button type="link" href={auditHttpUrl(row.postUrl)} target="_blank" rel="noopener noreferrer">Mở bài</Button> : 'Chưa có link' },
        ]} />
    </>}
  </Modal>;
}
