import type { ReactNode } from 'react';
import type { HistoryBrief, HistoryChannel } from '../../types/api/campaignHistory.types';
import { historyDate, historyMoney } from './historyView';

export const briefFields: Record<keyof HistoryBrief, string> = {
  name: 'Tên chiến dịch', productService: 'Sản phẩm / Dịch vụ', objective: 'Mục tiêu',
  brief: 'Brief chiến dịch', targetAudiences: 'Đối tượng mục tiêu', contentType: 'Loại nội dung',
  startDate: 'Ngày bắt đầu', endDate: 'Ngày kết thúc', platforms: 'Nền tảng', niches: 'Ngành hàng',
  locations: 'Khu vực', followerMin: 'Follower tối thiểu', followerMax: 'Follower tối đa',
  totalBudget: 'Tổng ngân sách', currency: 'Đơn vị tiền tệ', creatorFeeMin: 'Phí tối thiểu mỗi Creator',
  creatorFeeMax: 'Phí tối đa mỗi Creator', creatorMode: 'Chế độ hợp tác',
  targetCreatorCount: 'Số Creator dự kiến', deliverables: 'Ấn phẩm cấp chiến dịch',
};

const objectiveLabels: Record<string, string> = {
  AWARENESS: 'Nhận diện', ENGAGEMENT: 'Tương tác', TRAFFIC: 'Lượt truy cập', CONVERSION: 'Chuyển đổi',
};

export function Facts({ items }: { items: { label: string; value: ReactNode; wide?: boolean }[] }) {
  return <dl className="history-facts">{items.map(({ label, value, wide }) =>
    <div key={label} className={wide ? 'history-wide' : undefined}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>;
}

export function BriefFacts({ brief, fields = Object.keys(briefFields) as (keyof HistoryBrief)[] }: {
  brief: HistoryBrief; fields?: (keyof HistoryBrief)[];
}) {
  const formatted = {
    ...brief,
    objective: brief.objective && (objectiveLabels[brief.objective] ?? brief.objective),
    creatorMode: brief.creatorMode === 'SINGLE' ? 'Một Creator' : brief.creatorMode === 'MULTI' ? 'Nhiều Creator' : null,
    startDate: historyDate(brief.startDate), endDate: historyDate(brief.endDate),
    totalBudget: historyMoney(brief.totalBudget, brief.currency),
    creatorFeeMin: historyMoney(brief.creatorFeeMin, brief.currency),
    creatorFeeMax: historyMoney(brief.creatorFeeMax, brief.currency),
    deliverables: brief.deliverables?.map(item => [item.platform, item.contentType,
      item.quantity != null ? `× ${item.quantity}` : null].filter(Boolean).join(' · ')).filter(Boolean).join('\n'),
  };
  return <Facts items={fields.map(key => {
    const value = formatted[key];
    return { label: briefFields[key], value: Array.isArray(value) ? value.join(', ') || '—' : value === '' ? '—' : value ?? '—',
      wide: key === 'brief' || key === 'deliverables' };
  })} />;
}

export function ChannelNames({ channels }: { channels: HistoryChannel[] }) {
  return channels.length ? <span className="history-channels">{channels.map(channel => <span key={channel.creatorId}>
    {[channel.displayName, channel.username, channel.platform].filter(Boolean).join(' · ') || 'Kênh chưa có tên'}
  </span>)}</span> : '—';
}
