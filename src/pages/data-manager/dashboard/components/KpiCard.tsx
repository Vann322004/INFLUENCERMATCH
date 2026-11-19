import type { ReactNode } from 'react';
import { Card } from 'antd';

export interface KpiCardProps {
  icon: ReactNode;
  title: string;
  value: ReactNode;
  unit?: string;
  subText?: ReactNode;
}

export default function KpiCard({ icon, title, value, unit, subText }: KpiCardProps) {
  return (
    <Card variant="borderless" className="im-dashboard-card dm-kpi-card">
      <div className="dm-kpi-heading">
        <span>{title}</span>
        <span className="dm-kpi-icon" aria-hidden="true">{icon}</span>
      </div>
      <div className="dm-kpi-value">{value}</div>
      {unit && <div className="dm-kpi-unit">{unit}</div>}
      {subText != null && <div className="dm-kpi-detail">{subText}</div>}
    </Card>
  );
}
