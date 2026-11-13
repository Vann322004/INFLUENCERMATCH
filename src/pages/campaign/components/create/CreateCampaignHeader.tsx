import React from 'react';
import { Button, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getStatusBadge } from './createCampaignConstants';

interface CreateCampaignHeaderProps {
  isEditMode: boolean;
  resolvedCampaignId: string | null;
  campaignStatus: string;
  campaignName: string;
}

export const CreateCampaignHeader: React.FC<CreateCampaignHeaderProps> = ({
  isEditMode,
  resolvedCampaignId,
  campaignStatus,
  campaignName,
}) => {
  const navigate = useNavigate();

  return (
    <div className="ccreate-header">
      <div className="ccreate-title-wrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
          {isEditMode && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(resolvedCampaignId ? `/campaigns/${resolvedCampaignId}` : '/campaigns')}
              style={{ padding: '4px 8px', borderRadius: 8, color: '#4F46E5', fontWeight: 600, fontSize: 13 }}
            >
              Quay lại chi tiết
            </Button>
          )}
          <h1 style={{ margin: 0 }}>
            {isEditMode ? 'Chỉnh sửa thông tin chiến dịch' : 'Tạo chiến dịch mới'}
          </h1>
          {isEditMode && (
            <Tag
              style={{
                backgroundColor: getStatusBadge(campaignStatus).bg,
                borderColor: getStatusBadge(campaignStatus).border,
                color: getStatusBadge(campaignStatus).color,
                fontWeight: 700,
                fontSize: 12,
                padding: '2px 10px',
                borderRadius: 8,
              }}
            >
              {getStatusBadge(campaignStatus).label}
            </Tag>
          )}
        </div>
        <p>
          {isEditMode
            ? `Cập nhật thông số chiến lược, mục tiêu và ngân sách cho chiến dịch: ${campaignName}`
            : 'Thiết lập thông tin chiến dịch để AI gợi ý chiến lược, đối tượng và tối ưu hóa hiệu quả thực thi.'}
        </p>
      </div>
    </div>
  );
};

export default CreateCampaignHeader;

