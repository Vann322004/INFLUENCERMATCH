import { Empty, Tag } from 'antd';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DollarOutlined, RiseOutlined, CrownOutlined } from '@ant-design/icons';
import type { AsyncResource } from '../../../../hooks/useAsyncResource';
import type { PlanRevenue, UserGrowth } from '../../../../services/api/adminDashboardService';
import ResourceState from './AdminDashboardState';

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);

function groupRevenue(rows: PlanRevenue[]): Map<string, PlanRevenue[]> {
  const groups = new Map<string, PlanRevenue[]>();
  for (const row of rows) {
    groups.set(row.currency, [...(groups.get(row.currency) ?? []), row]);
  }
  return groups;
}

export function RevenueMetric({
  resource,
  allowed,
}: {
  resource: AsyncResource<PlanRevenue[]>;
  allowed: boolean;
}) {
  const totalTxns =
    resource.status === 'success' && resource.data
      ? resource.data.reduce((s, r) => s + (r.paymentCount || 0), 0)
      : 0;

  return (
    <section className="ad-bento-card highlight" aria-label="Doanh thu thanh toán">
      <div className="ad-bento-top">
        <span className="ad-bento-label">Doanh thu thanh toán</span>
        <div className="ad-bento-icon emerald">
          <DollarOutlined />
        </div>
      </div>

      {allowed && resource.status === 'success' && resource.data ? (
        resource.data.length === 0 ? (
          <p className="ad-bento-value">0 ₫</p>
        ) : (
          [...groupRevenue(resource.data)].map(([currency, rows]) => (
            <p className="ad-bento-value accent-emerald" key={currency}>
              {formatMoney(
                rows.reduce((sum, row) => sum + row.revenue, 0),
                currency,
              )}
            </p>
          ))
        )
      ) : (
        <ResourceState resource={resource} allowed={allowed} />
      )}

      <div className="ad-bento-foot">
        <span className="ad-bento-badge emerald">
          {totalTxns.toLocaleString('vi-VN')} giao dịch PAID
        </span>
        <span className="ad-bento-note-inline">Đã trừ hoàn tiền</span>
      </div>
    </section>
  );
}

export function UserGrowthPanel({
  resource,
  allowed,
}: {
  resource: AsyncResource<UserGrowth>;
  allowed: boolean;
}) {
  const totalNewUsers =
    resource.status === 'success' && resource.data
      ? resource.data.data.reduce((sum, item) => sum + (item.newUsers || 0), 0)
      : 0;

  return (
    <section className="ad-panel ad-chart-panel" aria-label="Tăng trưởng tài khoản trong 6 tháng">
      <div className="ad-panel-head">
        <div className="ad-panel-title-wrap">
          <div className="ad-panel-icon blue">
            <RiseOutlined />
          </div>
          <div>
            <h2>Tăng trưởng tài khoản trong 6 tháng</h2>
            <p className="ad-note">
              Số lượng tài khoản mới đăng ký theo từng tháng trên toàn hệ thống
            </p>
          </div>
        </div>
        {allowed && resource.status === 'success' && resource.data && (
          <Tag color="blue" className="ad-pill-tag">
            +{totalNewUsers.toLocaleString('vi-VN')} tài khoản mới
          </Tag>
        )}
      </div>

      {allowed && resource.status === 'success' && resource.data ? (
        resource.data.data.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" />
        ) : (
          <>
            <div className="ad-chart" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart
                  data={resource.data.data}
                  margin={{ top: 12, right: 16, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="adUserGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11.5, fill: '#64748B', fontWeight: 600 }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11.5, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid #DBEAFE',
                      boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
                      fontSize: 12.5,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    name="Tài khoản mới"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fill="url(#adUserGrowthGrad)"
                    dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#FFFFFF' }}
                    activeDot={{ r: 6, fill: '#1D4ED8', stroke: '#FFFFFF', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="ad-month-chips">
              {resource.data.data.map((row) => (
                <div key={row.month} className="ad-month-chip">
                  <span className="ad-month-label">{row.month}</span>
                  <strong className="ad-month-val">+{row.newUsers.toLocaleString('vi-VN')}</strong>
                </div>
              ))}
            </div>
          </>
        )
      ) : (
        <ResourceState resource={resource} allowed={allowed} />
      )}
    </section>
  );
}

export function RevenuePanel({
  resource,
  allowed,
}: {
  resource: AsyncResource<PlanRevenue[]>;
  allowed: boolean;
}) {
  return (
    <section className="ad-panel ad-chart-panel" aria-label="Doanh thu theo gói dịch vụ">
      <div className="ad-panel-head">
        <div className="ad-panel-title-wrap">
          <div className="ad-panel-icon indigo">
            <CrownOutlined />
          </div>
          <div>
            <h2>Doanh thu theo gói dịch vụ</h2>
            <p className="ad-note">
              Tỷ trọng doanh thu từ các giao dịch thành công (PAID) theo từng gói cước
            </p>
          </div>
        </div>
        <Tag color="purple" className="ad-pill-tag">
          Toàn thời gian
        </Tag>
      </div>

      {allowed && resource.status === 'success' && resource.data ? (
        resource.data.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" />
        ) : (
          [...groupRevenue(resource.data)].map(([currency, rows]) => {
            const totalRev = rows.reduce((s, r) => s + r.revenue, 0) || 1;
            return (
              <div key={currency} className="ad-revenue-group" data-currency={currency}>
                <div className="ad-chart" aria-hidden="true">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={rows} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="adRevBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity={1} />
                          <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.85} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="planName"
                        tick={{ fontSize: 11.5, fill: '#64748B', fontWeight: 600 }}
                        axisLine={{ stroke: '#E2E8F0' }}
                        tickLine={false}
                      />
                      <YAxis
                        width={68}
                        tick={{ fontSize: 11.5, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) =>
                          new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)
                        }
                      />
                      <Tooltip
                        formatter={(value) => formatMoney(Number(value), currency)}
                        labelFormatter={(_, payload) => payload[0]?.payload?.planName ?? ''}
                        contentStyle={{
                          borderRadius: 10,
                          border: '1px solid #DBEAFE',
                          boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
                          fontSize: 12.5,
                        }}
                      />
                      <Bar
                        dataKey="revenue"
                        name="Doanh thu"
                        fill="url(#adRevBarGrad)"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={48}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="ad-plan-rev-list">
                  {rows.map((row) => {
                    const pct = Math.min(100, Math.round((row.revenue / totalRev) * 100));
                    return (
                      <div key={row.planId} className="ad-plan-rev-item">
                        <div className="ad-plan-rev-meta">
                          <div>
                            <span className="ad-plan-rev-name">{row.planName}</span>
                            <span className="ad-plan-rev-txns">
                              {row.paymentCount.toLocaleString('vi-VN')} giao dịch
                            </span>
                          </div>
                          <strong className="ad-plan-rev-amount">
                            {formatMoney(row.revenue, currency)}
                          </strong>
                        </div>
                        <div className="ad-progress-track">
                          <div className="ad-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )
      ) : (
        <ResourceState resource={resource} allowed={allowed} />
      )}
    </section>
  );
}
