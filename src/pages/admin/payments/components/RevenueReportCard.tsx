import { Alert, Button, Card, Empty, Select, Spin } from 'antd';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { RevenueReport } from '../../../../services/api/adminService';

interface Props {
  report: RevenueReport | null;
  loading: boolean;
  error: string;
  groupBy: 'day' | 'month';
  onGroupChange: (value: 'day' | 'month') => void;
  onRetry: () => void;
}
export default function RevenueReportCard({ report, loading, error, groupBy, onGroupChange, onRetry }: Props) {
  const total = (report?.items || []).reduce((sum, point) => sum + point.revenue, 0);
  return <Card style={{ borderRadius: 14, marginBottom: 20 }}
    title="Doanh thu theo thời gian"
    extra={<Select aria-label="Nhóm doanh thu" value={groupBy} onChange={onGroupChange} style={{ width: 140 }}
      options={[{ value: 'day', label: 'Theo ngày' }, { value: 'month', label: 'Theo tháng' }]} />}>
    <p style={{ color: '#64748b', marginTop: 0 }}>Theo ngày thanh toán được xác nhận · VNĐ · Tổng kỳ: <strong>{total.toLocaleString('vi-VN')} đ</strong></p>
    {error ? <Alert type="error" showIcon title={error} action={<Button onClick={onRetry}>Thử lại</Button>} />
      : <Spin spinning={loading}>{report?.items.length ? <div style={{ height: 250, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%"><AreaChart data={report.items} margin={{ top: 12, right: 18, left: 12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="period" tickFormatter={value => groupBy === 'month' ? String(value).slice(0, 7) : String(value).slice(5)} />
          <YAxis tickFormatter={value => Number(value) >= 1e6 ? `${Number(value) / 1e6}tr` : Number(value).toLocaleString('vi-VN')} />
          <Tooltip formatter={value => [`${Number(value).toLocaleString('vi-VN')} đ`, 'Doanh thu']} />
          <Area isAnimationActive={false} type="monotone" dataKey="revenue" stroke="#6366f1" fill="#e0e7ff" strokeWidth={2} />
        </AreaChart></ResponsiveContainer></div> : <Empty description="Chưa có dữ liệu doanh thu" />}</Spin>}
  </Card>;
}
