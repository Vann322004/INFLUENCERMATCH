import { Card, Empty, Tag } from 'antd';
import { BarChart3, Coins, Eye, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HistoryDetail, HistoryMetric } from '../../types/api/campaignHistory.types';
import { historyMoney, historyNumber } from '../history/historyView';

function availableNumber(metric?: HistoryMetric): number | null {
  return metric && metric.availability === 'AVAILABLE' && metric.value != null ? metric.value : null;
}

function formatCompactMoney(value: number | null | undefined): string {
  if (value == null) return '—';
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} tỷ ₫`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} tr ₫`;
  return historyMoney(value, 'VND');
}

function formatRatio(metric?: HistoryMetric, suffix = '×'): string {
  const val = availableNumber(metric);
  return val == null ? '—' : `${historyNumber(val)}${suffix}`;
}

export function PerformanceOverviewSection({ detail }: { detail: HistoryDetail }) {
  const { currentCampaign, report } = detail;
  const m = report.metrics;

  const views = availableNumber(m.views);
  const engagements = availableNumber(m.engagements);
  const engagementRate = views && views > 0 && engagements != null
    ? `${((engagements / views) * 100).toFixed(2)}%`
    : '—';

  const actualCost = availableNumber(m.actualCost);
  const committedFee = availableNumber(m.committedFee);
  const gmv = availableNumber(m.gmv);
  const revenue = availableNumber(m.revenue);
  const roi = availableNumber(m.roi);
  const cpm = availableNumber(m.cpm);
  const cpe = availableNumber(m.cpe);

  const engagementChartData = [
    { name: 'Lượt thích', value: availableNumber(m.likes) ?? 0, available: availableNumber(m.likes) != null, color: '#7C3AED' },
    { name: 'Bình luận', value: availableNumber(m.comments) ?? 0, available: availableNumber(m.comments) != null, color: '#2563EB' },
    { name: 'Chia sẻ', value: availableNumber(m.shares) ?? 0, available: availableNumber(m.shares) != null, color: '#0EA5E9' },
    { name: 'Lượt nhấp', value: availableNumber(m.clicks) ?? 0, available: availableNumber(m.clicks) != null, color: '#10B981' },
  ];
  const hasEngagementChart = engagementChartData.some(item => item.available && item.value > 0);

  const financeChartData = [
    { name: 'Phí cam kết', value: committedFee ?? 0, available: committedFee != null, color: '#94A3B8' },
    { name: 'Chi phí thực tế', value: actualCost ?? 0, available: actualCost != null, color: '#F59E0B' },
    { name: 'GMV', value: gmv ?? 0, available: gmv != null, color: '#7C3AED' },
    { name: 'Doanh thu', value: revenue ?? 0, available: revenue != null, color: '#10B981' },
  ];
  const hasFinanceChart = financeChartData.some(item => item.available && item.value > 0);

  const statusData = [
    { name: 'Hoàn tất', value: report.completedCount, color: '#10B981' },
    { name: 'Đang thực hiện', value: report.unfinishedCount, color: '#7C3AED' },
    { name: 'Đã hủy', value: report.cancelledCount, color: '#EF4444' },
    { name: 'Dừng giữa chừng', value: report.terminatedCount ?? 0, color: '#F59E0B' },
  ].filter(item => item.value > 0);

  return (
    <div className="perf-analytics-stack">
      {/* 4 Marketing KPI Summary Cards */}
      <div className="perf-kpi-grid">
        <div className="perf-kpi-card">
          <div className="perf-kpi-head">
            <span>Chi phí thực tế</span>
            <span className="perf-kpi-icon perf-icon-amber"><Coins size={16} /></span>
          </div>
          <strong className="perf-kpi-value">{formatCompactMoney(actualCost ?? committedFee)}</strong>
          <div className="perf-kpi-sub">
            {currentCampaign.totalBudget != null
              ? `Ngân sách: ${formatCompactMoney(currentCampaign.totalBudget)}`
              : `Phí cam kết: ${formatCompactMoney(committedFee)}`}
          </div>
        </div>

        <div className="perf-kpi-card">
          <div className="perf-kpi-head">
            <span>Lượt xem & Tương tác</span>
            <span className="perf-kpi-icon perf-icon-blue"><Eye size={16} /></span>
          </div>
          <strong className="perf-kpi-value">{views != null ? historyNumber(views) : '—'}</strong>
          <div className="perf-kpi-sub">
            Tương tác: {engagements != null ? historyNumber(engagements) : '—'} · ER: {engagementRate}
          </div>
        </div>

        <div className="perf-kpi-card">
          <div className="perf-kpi-head">
            <span>GMV & Doanh thu</span>
            <span className="perf-kpi-icon perf-icon-purple"><BarChart3 size={16} /></span>
          </div>
          <strong className="perf-kpi-value">{formatCompactMoney(gmv ?? revenue)}</strong>
          <div className="perf-kpi-sub">
            Doanh thu: {formatCompactMoney(revenue)}
          </div>
        </div>

        <div className="perf-kpi-card">
          <div className="perf-kpi-head">
            <span>Hiệu quả (ROAS / CPM)</span>
            <span className="perf-kpi-icon perf-icon-green"><TrendingUp size={16} /></span>
          </div>
          <strong className="perf-kpi-value">{formatRatio(m.roas)}</strong>
          <div className="perf-kpi-sub">
            ROI: {roi != null ? `${(roi * 100).toFixed(1)}%` : '—'} · CPM: {cpm != null ? formatCompactMoney(cpm) : '—'} · CPE: {cpe != null ? formatCompactMoney(cpe) : '—'}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="perf-charts-grid">
        <Card
          className="perf-chart-card"
          title="Phân bổ tương tác"
          extra={<Tag color="purple">Chưa cộng trùng</Tag>}
        >
          {hasEngagementChart ? (
            <div className="perf-chart-box">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={engagementChartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} axisLine={{ stroke: '#E1E7F0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val: unknown) => [historyNumber(Number(val)), 'Số lượng']}
                    contentStyle={{ borderRadius: 10, borderColor: '#E1E7F0' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                    {engagementChartData.map(entry => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa đủ dữ liệu tương tác được nghiệm thu." />
          )}
        </Card>

        <Card
          className="perf-chart-card"
          title="Tài chính (VND)"
          extra={<Tag>{report.eligibleCount}/{report.completedCount} đạt chuẩn</Tag>}
        >
          {hasFinanceChart ? (
            <div className="perf-chart-box">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={financeChartData} margin={{ top: 10, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} axisLine={{ stroke: '#E1E7F0' }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={val => (val >= 1_000_000 ? `${(val / 1_000_000).toFixed(0)}tr` : String(val))}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [historyMoney(Number(val), 'VND'), 'Giá trị']}
                    contentStyle={{ borderRadius: 10, borderColor: '#E1E7F0' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                    {financeChartData.map(entry => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu tài chính đủ điều kiện." />
          )}
        </Card>

        <Card className="perf-chart-card" title="Cơ cấu hợp tác">
          {statusData.length ? (
            <div className="perf-donut-wrap">
              <div className="perf-chart-box perf-donut-chart">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {statusData.map(entry => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#E1E7F0' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="perf-donut-legend">
                {statusData.map(item => (
                  <div key={item.name} className="perf-legend-item">
                    <span className="perf-legend-dot" style={{ backgroundColor: item.color }} />
                    <span className="perf-legend-label">{item.name}</span>
                    <strong className="perf-legend-value">{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chiến dịch chưa có hợp tác." />
          )}
        </Card>
      </div>
    </div>
  );
}
