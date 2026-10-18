import React from 'react';
import { Table, Tag, Progress, Row, Col, Card, Typography, Tooltip } from 'antd';
import type { TableColumnsType } from 'antd';
import { CheckCircleOutlined, ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { SCORING_PREVIEW_CREATORS } from '../../../../mock/adminData';

const { Text } = Typography;

interface Props {
  weights: Record<string, number>;
}

// Function to calculate synthetic score based on weights
function computeScore(
  creator: { er: number; followers: number; growth: number; quality: number; consistency: number; brandSafety: number },
  w: Record<string, number>
) {
  // Normalize factors (0 - 100 scale)
  const normER = Math.min(creator.er * 10, 100);
  const normFollowers = Math.min((creator.followers / 3000000) * 100, 100);
  const normGrowth = Math.min(creator.growth * 5, 100);
  const normQuality = creator.quality;
  const normConsistency = creator.consistency;
  const normSafety = creator.brandSafety;

  const totalWeight = Object.values(w).reduce((a, b) => a + b, 0) || 100;

  const weightedSum =
    normER * (w.engagementRate || 0) +
    normFollowers * (w.followerCount || 0) +
    normGrowth * (w.growthRate || 0) +
    normQuality * (w.contentQuality || 0) +
    normConsistency * (w.consistency || 0) +
    normSafety * (w.brandSafety || 0);

  return Math.round(weightedSum / totalWeight);
}

export default function PreviewTab({ weights }: Props) {
  const dataSource = SCORING_PREVIEW_CREATORS.map(c => {
    const baselineScore = computeScore(c, {
      engagementRate: 30,
      followerCount: 25,
      growthRate: 15,
      contentQuality: 15,
      consistency: 10,
      brandSafety: 5,
    });
    const newScore = computeScore(c, weights);
    const diff = newScore - baselineScore;

    return {
      ...c,
      baselineScore,
      newScore,
      diff,
    };
  });

  const columns: TableColumnsType<typeof dataSource[0]> = [
    {
      title: 'Creator Handle',
      dataIndex: 'handle',
      key: 'handle',
      render: (h: string) => <strong style={{ color: '#0F172A' }}>{h}</strong>,
    },
    {
      title: 'Chỉ số thực tế (Raw Metrics)',
      key: 'raw',
      render: (_, r) => (
        <div style={{ fontSize: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>ER: <strong>{r.er}%</strong></span>
          <span>Followers: <strong>{(r.followers / 1e6).toFixed(1)}M</strong></span>
          <span>Growth: <strong>+{r.growth}%</strong></span>
          <span>Quality: <strong>{r.quality}/100</strong></span>
        </div>
      ),
    },
    {
      title: 'Điểm gốc (v2.3)',
      dataIndex: 'baselineScore',
      key: 'baselineScore',
      render: (sc: number) => (
        <Tag color="default" style={{ fontSize: 13, fontWeight: 700, padding: '2px 8px' }}>
          {sc} / 100
        </Tag>
      ),
    },
    {
      title: 'Điểm tính theo Trọng số mới',
      dataIndex: 'newScore',
      key: 'newScore',
      render: (sc: number, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress
            type="circle"
            percent={sc}
            width={40}
            strokeColor={sc >= 85 ? '#10B981' : sc >= 70 ? '#6366F1' : '#F59E0B'}
            format={() => <span style={{ fontSize: 11, fontWeight: 800 }}>{sc}</span>}
          />
          {r.diff !== 0 && (
            <Tag
              color={r.diff > 0 ? 'success' : 'error'}
              icon={r.diff > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              style={{ fontWeight: 700, borderRadius: 6 }}
            >
              {r.diff > 0 ? `+${r.diff}` : r.diff}
            </Tag>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Text style={{ color: '#64748B', fontSize: 13 }}>
          Xem trước ảnh hưởng của bộ trọng số đang chỉnh sửa lên tập Creator đại diện (Sample Dataset):
        </Text>
      </div>

      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        pagination={false}
        size="middle"
      />
    </div>
  );
}
