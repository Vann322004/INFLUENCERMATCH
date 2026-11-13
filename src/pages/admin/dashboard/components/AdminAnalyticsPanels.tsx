import { Empty } from 'antd';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { AsyncResource } from '../../../../hooks/useAsyncResource';
import type { PlanRevenue, UserGrowth } from '../../../../services/api/adminDashboardService';
import ResourceState from './AdminDashboardState';

const formatMoney = (value: number, currency: string) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);

function groupRevenue(rows: PlanRevenue[]): Map<string, PlanRevenue[]> {
  const groups = new Map<string, PlanRevenue[]>();
  for (const row of rows) groups.set(row.currency, [...(groups.get(row.currency) ?? []), row]);
  return groups;
}

export function RevenueMetric({ resource, allowed }: { resource: AsyncResource<PlanRevenue[]>; allowed: boolean }) {
  return <section className="ad-panel ad-kpi" aria-label="Doanh thu thanh toán">
    <h2>Doanh thu thanh toán</h2>
    {allowed && resource.status === 'success' && resource.data
      ? resource.data.length === 0 ? <p className="ad-state">Chưa có dữ liệu</p>
        : [...groupRevenue(resource.data)].map(([currency, rows]) => <p className="ad-revenue-value" key={currency}>
          {formatMoney(rows.reduce((sum, row) => sum + row.revenue, 0), currency)}
        </p>)
      : <ResourceState resource={resource} allowed={allowed} />}
    <p className="ad-note">Tổng giao dịch PAID theo từng tiền tệ; không bao gồm giao dịch đã hoàn tiền.</p>
  </section>;
}

export function UserGrowthPanel({ resource, allowed }: { resource: AsyncResource<UserGrowth>; allowed: boolean }) {
  return <section className="ad-panel" aria-label="Tăng trưởng tài khoản trong 6 tháng">
    <h2>Tăng trưởng tài khoản trong 6 tháng</h2>
    <p className="ad-note">Tài khoản mới đăng ký theo tháng, bao gồm tháng hiện tại chưa kết thúc.</p>
    {allowed && resource.status === 'success' && resource.data
      ? resource.data.data.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" />
        : <>
          <div className="ad-chart" aria-hidden="true"><ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={resource.data.data} margin={{ top: 12, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip />
              <Line dataKey="newUsers" name="Tài khoản mới" stroke="#4f46e5" strokeWidth={2} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer></div>
          <details className="ad-chart-data"><summary>Xem số liệu theo tháng</summary>
            <dl className="ad-status-list">{resource.data.data.map(row => <div key={row.month}><dt>{row.month}</dt><dd>{row.newUsers.toLocaleString('vi-VN')}</dd></div>)}</dl>
          </details>
        </>
      : <ResourceState resource={resource} allowed={allowed} />}
  </section>;
}

export function RevenuePanel({ resource, allowed }: { resource: AsyncResource<PlanRevenue[]>; allowed: boolean }) {
  return <section className="ad-panel" aria-label="Doanh thu theo gói dịch vụ">
    <h2>Doanh thu theo gói dịch vụ</h2>
    <p className="ad-note">Giao dịch PAID trong toàn bộ thời gian. Các tiền tệ được thống kê riêng.</p>
    {allowed && resource.status === 'success' && resource.data
      ? resource.data.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" />
        : [...groupRevenue(resource.data)].map(([currency, rows]) => <div key={currency} className="ad-revenue-group" data-currency={currency}>
          <h3>{currency}</h3>
          <div className="ad-chart" aria-hidden="true"><ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={rows} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} /><XAxis dataKey="planName" hide />
              <YAxis width={70} tick={{ fontSize: 11 }} tickFormatter={value => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)} />
              <Tooltip formatter={value => formatMoney(Number(value), currency)} labelFormatter={(_, payload) => payload[0]?.payload?.planName ?? ''} />
              <Bar dataKey="revenue" name="Doanh thu" fill="#4f46e5" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer></div>
          <dl className="ad-status-list">{rows.map(row => <div key={row.planId}>
            <dt>{row.planName}<small>{row.paymentCount.toLocaleString('vi-VN')} giao dịch</small></dt><dd>{formatMoney(row.revenue, currency)}</dd>
          </div>)}</dl>
        </div>)
      : <ResourceState resource={resource} allowed={allowed} />}
  </section>;
}
