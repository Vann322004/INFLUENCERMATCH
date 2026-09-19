import React from 'react';
import { Card, Typography, Space } from 'antd';
import {
  ArrowUpOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import type { StatItem } from '../../data/mockData';

const { Text, Title } = Typography;

interface StatCardProps {
  item: StatItem;
}

const getIcon = (id: string, color: string) => {
  const iconStyle = { fontSize: 16, color };
  switch (id) {
    case 'running-campaigns':
      return <ThunderboltOutlined style={iconStyle} />;
    case 'participating-creators':
      return <TeamOutlined style={iconStyle} />;
    case 'total-campaign-cost':
      return <DollarOutlined style={iconStyle} />;
    case 'average-roi':
      return <RiseOutlined style={iconStyle} />;
    default:
      return <RiseOutlined style={iconStyle} />;
  }
};

export default function StatCard({ item }: StatCardProps) {
  // Generate sparkline SVG path from data
  const data = item.sparklineData;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 85;
  const height = 32;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });

  // Create smooth curved path
  const pathData = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point}`;
    const [currX, currY] = point.split(',').map(Number);
    const [prevX, prevY] = arr[i - 1].split(',').map(Number);
    const cpX = (prevX + currX) / 2;
    return `${acc} C ${cpX},${prevY} ${cpX},${currY} ${currX},${currY}`;
  }, '');

  return (
    <Card
      bordered
      style={{
        borderRadius: 14,
        borderColor: '#EEF0F6',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        height: '100%',
      }}
      bodyStyle={{ padding: '18px 20px' }}
    >
      {/* Header: Icon + Title */}
      <Space size={10} align="center" style={{ marginBottom: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: item.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {getIcon(item.id, item.color)}
        </div>
        <Text style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>
          {item.title}
        </Text>
      </Space>

      {/* Value and Sparkline Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: -0.5,
            lineHeight: 1.1,
          }}
        >
          {item.value}
        </div>

        {/* Sparkline Graphic */}
        <div style={{ width, height, overflow: 'visible' }}>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <defs>
              <linearGradient id={`grad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={item.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={item.color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`${pathData} L ${width},${height} L 0,${height} Z`}
              fill={`url(#grad-${item.id})`}
            />
            <path
              d={pathData}
              fill="none"
              stroke={item.color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Trend Percentage */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <ArrowUpOutlined style={{ fontSize: 11, color: '#10B981' }} />
        <Text style={{ fontSize: 11.5, fontWeight: 700, color: '#10B981' }}>
          {item.trend}
        </Text>
      </div>
    </Card>
  );
}
