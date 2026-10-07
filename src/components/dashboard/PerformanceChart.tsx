import React, { useState } from 'react';
import { Card, Space, Select, Typography } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { PERFORMANCE_CHART_DATA } from '../../data/mockData';

const { Title, Text } = Typography;

export default function PerformanceChart() {
  const [timeRange, setTimeRange] = useState('30d');

  const series = [
    { key: 'reach', name: 'Tiếp cận', color: '#6366F1' },
    { key: 'engagement', name: 'Tương tác', color: '#38BDF8' },
    { key: 'conversion', name: 'Chuyển đổi', color: '#F43F5E' },
    { key: 'cost', name: 'Chi phí', color: '#10B981' },
  ];

  return (
    <Card
      bordered
      style={{
        borderRadius: 14,
        borderColor: '#EEF0F6',
        height: '100%',
      }}
      bodyStyle={{ padding: '20px 20px 14px 20px' }}
    >
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Space size={8}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: '#EEF2FF',
              color: '#5B5BF0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}
          >
            <BarChartOutlined />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
            Hiệu quả chiến dịch
          </span>
        </Space>

        {/* Legend & Select */}
        <Space size={16} wrap>
          <Space size={12}>
            {series.map((s) => (
              <Space key={s.key} size={6} align="center">
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: s.color,
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                  {s.name}
                </span>
              </Space>
            ))}
          </Space>

          <Select
            value={timeRange}
            onChange={setTimeRange}
            size="small"
            style={{ width: 110 }}
            options={[
              { value: '7d', label: '7 ngày qua' },
              { value: '30d', label: '30 ngày qua' },
              { value: '90d', label: '90 ngày qua' },
            ]}
          />
        </Space>
      </div>

      {/* Chart Area */}
      <div style={{ width: '100%', height: 235 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={PERFORMANCE_CHART_DATA}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              dy={6}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              domain={[0, 200]}
              tickFormatter={(val) => (val === 0 ? '0' : `${val}K`)}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderRadius: 8,
                border: 'none',
                color: '#fff',
                fontSize: 12,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
              }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: any, name: any) => {
                const label = series.find((s) => s.key === name)?.name || name;
                return [`${value}K`, label];
              }}
            />

            <Area
              type="monotone"
              dataKey="reach"
              stroke="#6366F1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorReach)"
            />
            <Area
              type="monotone"
              dataKey="engagement"
              stroke="#38BDF8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEngagement)"
            />
            <Area
              type="monotone"
              dataKey="conversion"
              stroke="#F43F5E"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorConversion)"
            />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCost)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
