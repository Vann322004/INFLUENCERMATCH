import { Alert, Button, Empty, Select, Skeleton } from 'antd';
import type { useCampaignWorkspace } from '../../hooks/useCampaignWorkspace';
import { campaignPath } from '../../services/campaignContext';
import { useNavigate } from 'react-router-dom';
import './CampaignWorkflow.css';
export default function CampaignWorkspaceBar({ workspace }: { workspace: ReturnType<typeof useCampaignWorkspace> }) {
  const navigate = useNavigate();
  return <>
    {workspace.catalog.status === 'error' ? <Alert type="error" title="Không thể tải danh sách chiến dịch." action={<Button onClick={() => void workspace.catalog.reload()}>Thử lại</Button>} />
      : workspace.catalog.status === 'loading' ? <Skeleton active paragraph={false} /> : <div className="workflow-panel workflow-context">
        <Select aria-label="Chiến dịch" placeholder="Chọn chiến dịch để tiếp tục" value={workspace.id || undefined} options={workspace.catalog.data?.map(c => ({ value: c.id, label: c.name }))} onChange={workspace.choose} />
        {workspace.campaign && <Button onClick={() => navigate(campaignPath('/creators/shortlist', workspace.id))}>Danh sách đã chọn</Button>}
      </div>}
    {!workspace.id ? <Empty description="Chọn một chiến dịch để xem dữ liệu" /> : workspace.detail.status === 'error' ? <Alert type="error" title="Không thể tải chiến dịch được yêu cầu. Không tự chuyển sang chiến dịch khác." action={<Button onClick={() => void workspace.detail.reload()}>Thử lại</Button>} /> : workspace.detail.status === 'loading' ? <Skeleton active /> : null}
  </>;
}
