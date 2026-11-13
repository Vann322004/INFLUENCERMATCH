import type { ReactNode } from 'react';
import { Card } from 'antd';

export interface KpiCardProps {
  icon: ReactNode;
  title: string;
  value: ReactNode;
  unit?: string;
  badge?: ReactNode;
  subText?: ReactNode;
  color: string;
  bg: string;
}

export default function KpiCard({ icon, title, value, unit, badge, subText, color, bg }: KpiCardProps) {
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 14,
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        border: '1px solid #E2E8F0',
        height: '100%',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
      }}
      styles={{ body: { padding: '18px 20px', display: 'flex', flexDirection: 'column', height: '100%' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: '#475569', fontSize: 13.5, fontWeight: 700 }}>
          {title}
        </span>
        <div style={{
          width: 36, height: 36, background: bg, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, fontSize: 18, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <div style={{
          color: '#0F172A',
          fontSize: 26,
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}>
          {value}
        </div>
        {unit && (
          <span style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>
            {unit}
          </span>
        )}
        {badge && (
          <div style={{ marginLeft: 'auto' }}>
            {badge}
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 10, color: '#64748B', fontSize: 12, fontWeight: 500, lineHeight: 1.4 }}>
        {subText}
      </div>
    </Card>
  );
}
