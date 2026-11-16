import { Table } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Comparison, CompareItem } from '../../../types/api/shortlist.types';
import { shortlistNumber, shortlistDate, shortlistLabel } from './shortlistDisplay';

const text = (value: string | null | undefined) => value == null || value === '' ? 'Chưa có dữ liệu' : value;
interface Row { key: string; label: string; value: (item: CompareItem) => string }
const fields: Row[] = [
  { key: 'platform', label: 'Nền tảng', value: item => text(item.platform) },
  { key: 'followers', label: 'Người theo dõi', value: item => shortlistNumber(item.metrics?.followers) },
  { key: 'engagementRate', label: 'Tỷ lệ tương tác', value: item => shortlistNumber(item.metrics?.engagementRate) },
  ...(['avgViews','avgLikes','avgComments','avgShares'] as const).map((key, index) => ({ key, label: ['Lượt xem trung bình','Lượt thích trung bình','Bình luận trung bình','Chia sẻ trung bình'][index], value: (item: CompareItem) => shortlistNumber(item.metrics?.[key]) })),
  { key: 'niche', label: 'Ngành hàng', value: item => text(item.metrics?.niche) },
  { key: 'freshness', label: 'Độ mới dữ liệu', value: item => shortlistLabel(item.metrics?.freshnessStatus) },
  { key: 'collected', label: 'Thời điểm thu thập', value: item => shortlistDate(item.metrics?.collectedAt) },
  { key: 'confidence', label: 'Độ tin cậy dữ liệu', value: item => shortlistNumber(item.metrics?.dataConfidence) },
  { key: 'master', label: 'Mã nhà sáng tạo', value: item => text(item.masterId) },
  { key: 'verified', label: 'Kênh đã xác minh', value: item => item.verifiedByInfluencerMatch ? 'Có' : 'Không' },
  { key: 'verification', label: 'Trạng thái xác minh chi tiết', value: item => shortlistLabel(item.verification?.status) },
  { key: 'verifiedAt', label: 'Thời điểm xác minh', value: item => shortlistDate(item.verification?.verifiedAt) },
  { key: 'source', label: 'Nguồn kênh', value: item => shortlistLabel(item.sourceType) },
  { key: 'authorized', label: 'Thời điểm ủy quyền', value: item => shortlistDate(item.authorizedAt) },
  { key: 'fee', label: 'Đánh giá chi phí', value: item => item.feeAssessmentStatus === 'UNAVAILABLE' ? 'Chưa hỗ trợ đánh giá phí' : shortlistLabel(item.feeAssessmentStatus) },
  { key: 'status', label: 'Trạng thái lưu', value: item => shortlistLabel(item.status) },
  { key: 'note', label: 'Ghi chú', value: item => text(item.note) },
];

export default function ShortlistComparison({ data }: { data: Comparison }) {
  const columns: TableColumnsType<Row> = [{ title: 'Thông tin', dataIndex: 'label', width: 190 }, ...data.creators.map(item => ({
    title: <span>{item.displayName || item.userName || item.creatorId}<small className="sl-secondary">{item.creatorId}</small></span>,
    key: item.creatorId, width: 230, render: (_: unknown, row: Row) => row.value(item),
  }))];
  return <Table className="sl-compare-table" rowKey="key" columns={columns} dataSource={fields} pagination={false} scroll={{ x: 190 + 230 * data.creators.length }} size="middle" />;
}
