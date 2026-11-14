import { Table } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Comparison, CompareItem } from '../../../types/api/shortlist.types';

export const shortlistNumber = (value: number | null | undefined) => value == null ? 'Chưa có dữ liệu' : value.toLocaleString('vi-VN', { maximumFractionDigits: 6 });
const text = (value: string | null | undefined) => value == null || value === '' ? 'Chưa có dữ liệu' : value;
interface Row { key: string; label: string; value: (item: CompareItem) => string }
const fields: Row[] = [
  { key: 'platform', label: 'Nền tảng', value: item => text(item.platform) },
  { key: 'followers', label: 'Followers', value: item => shortlistNumber(item.metrics?.followers) },
  { key: 'engagementRate', label: 'Engagement rate · giá trị API', value: item => shortlistNumber(item.metrics?.engagementRate) },
  ...(['avgViews','avgLikes','avgComments','avgShares'] as const).map((key, index) => ({ key, label: ['Lượt xem trung bình','Lượt thích trung bình','Bình luận trung bình','Chia sẻ trung bình'][index], value: (item: CompareItem) => shortlistNumber(item.metrics?.[key]) })),
  { key: 'niche', label: 'Ngành hàng', value: item => text(item.metrics?.niche) },
  { key: 'freshness', label: 'Độ mới dữ liệu', value: item => text(item.metrics?.freshnessStatus) },
  { key: 'collected', label: 'Thu thập lúc · giờ Backend', value: item => text(item.metrics?.collectedAt).replace('T', ' ') },
  { key: 'confidence', label: 'Data confidence · giá trị API', value: item => shortlistNumber(item.metrics?.dataConfidence) },
  { key: 'metric', label: 'Metric ID', value: item => text(item.metrics?.metricId) },
  { key: 'master', label: 'Master ID', value: item => text(item.masterId) },
  { key: 'verified', label: 'Xác minh InfluencerMatch · cờ API', value: item => item.verifiedByInfluencerMatch ? 'Có' : 'Không' },
  { key: 'verification', label: 'Trạng thái xác minh chi tiết', value: item => text(item.verification?.status) },
  { key: 'method', label: 'Phương thức / nguồn bằng chứng', value: item => item.verification ? [item.verification.method, item.verification.evidenceSource].filter(Boolean).join(' · ') || 'Chưa có dữ liệu' : 'Chưa có dữ liệu' },
  { key: 'verifiedAt', label: 'Xác minh lúc', value: item => text(item.verification?.verifiedAt) },
  { key: 'environment', label: 'Môi trường xác minh', value: item => text(item.verification?.environment) },
  { key: 'source', label: 'Nguồn kênh', value: item => text(item.sourceType) },
  { key: 'authorized', label: 'Ủy quyền lúc', value: item => text(item.authorizedAt) },
  { key: 'fee', label: 'Trạng thái đánh giá phí', value: item => item.feeAssessmentStatus === 'UNAVAILABLE' ? 'Chưa hỗ trợ đánh giá phí' : text(item.feeAssessmentStatus) },
  { key: 'status', label: 'Trạng thái shortlist', value: item => text(item.status) },
  { key: 'note', label: 'Ghi chú', value: item => text(item.note) },
];

export default function ShortlistComparison({ data }: { data: Comparison }) {
  const columns: TableColumnsType<Row> = [{ title: 'Thông tin', dataIndex: 'label', width: 190 }, ...data.creators.map(item => ({
    title: <span>{item.displayName || item.userName || item.creatorId}<small className="sl-secondary">{item.creatorId}</small></span>,
    key: item.creatorId, width: 230, render: (_: unknown, row: Row) => row.value(item),
  }))];
  return <Table className="sl-compare-table" rowKey="key" columns={columns} dataSource={fields} pagination={false} scroll={{ x: 190 + 230 * data.creators.length }} size="middle" />;
}
