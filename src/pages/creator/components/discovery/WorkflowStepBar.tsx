import { Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { campaignPath } from '../../../../services/campaignContext';
export default function WorkflowStepBar({ selectedCampaignId }: { selectedCampaignId: string | null }) {
  const navigate = useNavigate(); const id = selectedCampaignId || '';
  return <nav aria-label="Điều hướng chiến dịch"><Space wrap>
    <Button disabled={!id} onClick={() => navigate('/campaigns/' + id)}>Thông tin chiến dịch</Button>
    <Button disabled={!id} onClick={() => navigate(campaignPath('/creators/shortlist', id))}>Danh sách đã chọn</Button>
    <Button disabled={!id} onClick={() => navigate(campaignPath('/campaign-management', id, { tab: 'recommendation' }))}>Gợi ý</Button>
    <Button disabled={!id} onClick={() => navigate(campaignPath('/crm', id))}>Tiếp cận và thỏa thuận</Button>
  </Space></nav>;
}
