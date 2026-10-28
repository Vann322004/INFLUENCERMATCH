import React from 'react';
import { Table, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import type { CampaignCreatorRow } from './CampaignMetricCards';

interface CampaignCreatorsTabProps {
  participatingCreators: CampaignCreatorRow[];
  creatorColumns: ColumnsType<CampaignCreatorRow>;
  resolvedId: string;
}

export const CampaignCreatorsTab: React.FC<CampaignCreatorsTabProps> = ({
  participatingCreators,
  creatorColumns,
  resolvedId,
}) => {
  const navigate = useNavigate();

  return (
    <div className="cdetail-card-modern">
      <div className="cdetail-card-header">
        <div>
          <span className="cdetail-card-title">
            Danh sách Nhà sáng tạo tham gia ({participatingCreators.length})
          </span>
          <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>
            Quản lý thông tin, thỏa thuận chi phí và tiến độ bàn giao của từng KOC
          </div>
        </div>
        <Space>
          <Button
            type="primary"
            style={{ background: '#4F46E5', borderRadius: 8, height: 36, fontWeight: 600 }}
            onClick={() => {
              sessionStorage.setItem('current_campaign_id', resolvedId);
              navigate(`/discovery?campaignId=${resolvedId}`);
            }}
          >
            Tìm thêm KOC
          </Button>
        </Space>
      </div>

      <Table
        columns={creatorColumns}
        dataSource={participatingCreators}
        rowKey="id"
        pagination={false}
        style={{ marginTop: 12 }}
      />
    </div>
  );
};
