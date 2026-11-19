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
      <div className="dm-bento-row">
        <span className="dm-kpi-icon" aria-hidden="true">
          {icon}
        </span>
        <div className="dm-bento-body">
          <div className="dm-kpi-heading">{title}</div>
          <div className="dm-kpi-value">{value}</div>
          {unit && <span className="dm-kpi-badge">{unit}</span>}
          {subText != null && <div className="dm-kpi-detail">{subText}</div>}
        </div>
      </div>
    </Card>
  );
}
