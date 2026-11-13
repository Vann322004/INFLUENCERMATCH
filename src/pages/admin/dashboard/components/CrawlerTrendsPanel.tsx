import { useMemo, useState } from 'react';
import { Card, Empty, Segmented, Skeleton } from 'antd';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dataManagerDashboardService } from '../../../../services/api/dataManagerDashboardService';
import { useDashboardResource } from '../hooks/useDashboardResource';
import DashboardResourceError from './DashboardResourceError';

export default function CrawlerTrendsPanel() {
  const [days, setDays] = useState<7 | 30>(7);
  const fetchTrends = useMemo(() => dataManagerDashboardService.getCrawlerTrendsQuery(days), [days]);
  const trends = useDashboardResource(fetchTrends);
  const points = trends.data?.items ?? [];
  const noActivity = points.length > 0 && points.every(point => point.ingestedCount === 0 && point.successCount === 0 && point.failedCount === 0);

  return <Card variant="borderless" className="im-dashboard-card dm-panel dm-trends-panel" title="Xu hướng thu thập"
    extra={<Segmented aria-label="Khoảng thời gian thu thập" value={days} onChange={value => setDays(value as 7 | 30)}
      options={[{ value: 7, label: '7 ngày' }, { value: 30, label: '30 ngày' }]} />}>
    {trends.status === 'loading' ? <Skeleton active paragraph={{ rows: 5 }} /> :
      trends.status === 'error' ? <DashboardResourceError message="Chưa tải được xu hướng thu thập." onRetry={trends.reload} /> :
      !points.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu xu hướng trong khoảng thời gian này" /> : <>
        <p className="dm-secondary dm-trends-source">
          {trends.data?.isFallback === true ? 'Có sử dụng dữ liệu dự phòng' : 'Dữ liệu tổng hợp'}
          {' · '}{trends.data?.source || 'Nguồn trực tiếp / dự phòng chưa được xác nhận'}
        </p>
        {noActivity && <p className="dm-secondary">Không có lượt thu thập trong khoảng thời gian này.</p>}
        <div className="dm-trends-chart" role="img" aria-label={'Xu hướng thu thập ' + days + ' ngày. Số liệu chi tiết có trong bảng bên dưới.'}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={points} margin={{ top: 12, right: 16, bottom: 8, left: -20 }} accessibilityLayer>
              <CartesianGrid stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" tickFormatter={date => String(date).slice(5).split('-').reverse().join('/')} tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={label => 'Ngày ' + String(label)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="linear" dataKey="ingestedCount" name="Đã thu thập" stroke="#5B5BF0" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="successCount" name="Thành công" stroke="#64748B" strokeDasharray="6 3" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="failedCount" name="Thất bại" stroke="#A5B4FC" strokeDasharray="2 3" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <details className="dm-trends-details">
          <summary>Xem số liệu theo ngày</summary>
          <div className="dm-trends-table" tabIndex={0} role="region" aria-label="Bảng xu hướng thu thập, có thể cuộn ngang">
            <table><thead><tr><th>Ngày</th><th>Đã thu thập</th><th>Thành công</th><th>Thất bại</th></tr></thead>
              <tbody>{points.map((point, index) => <tr key={point.date + index}><td>{point.date}</td><td>{point.ingestedCount}</td><td>{point.successCount}</td><td>{point.failedCount}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      </>}
  </Card>;
}
