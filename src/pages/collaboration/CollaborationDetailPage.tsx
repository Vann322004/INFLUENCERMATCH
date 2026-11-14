import { Alert, Breadcrumb, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { collaborationService } from '../../services/api/collaborationService';
import type { CollaborationDetail } from '../../types/api/collaboration.types';
import CollaborationExecutionPanel, { collaborationReadError, RetryAlert } from './CollaborationExecutionPanel';
import { useCollaborationPermissions } from './useCollaborationPermissions';
import './CollaborationPage.css';

const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;

export default function CollaborationDetailPage({ brand }: { brand: boolean }) {
  const { collaborationId } = useParams();
  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />;
  return <Detail key={collaborationId} id={collaborationId ?? ''} brand={brand} />;
}

function Detail({ id, brand }: { id: string; brand: boolean }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const permissions = useCollaborationPermissions();
  const page = useRef<HTMLElement>(null);
  const [detail, setDetail] = useState<CollaborationDetail>();
  const [error, setError] = useState<ReturnType<typeof collaborationReadError>>();
  const [refresh, setRefresh] = useState(0);
  const roleAllowed = authService.getCurrentUser()?.role === (brand ? 'BRAND' : 'CREATOR');
  const canRead = permissions.has(brand ? 'MANAGE_OWN_COLLABORATION' : 'RESPOND_OWN_COOPERATION');
  const validId = uuid.test(id);
  const remembered = state?.returnTo;
  const brandListPath = '/collaboration';
  const brandListPrefix = brandListPath + '?';
  const backTo = brand
    ? typeof remembered === 'string' && (remembered === brandListPath || remembered.startsWith(brandListPrefix))
      ? remembered
      : detail?.campaignId ? brandListPrefix + new URLSearchParams({ campaign: detail.campaignId }) : brandListPath
    : '/creator/bookings';

  function returnAfterReview(campaignId: string) {
    const params = new URLSearchParams(backTo.startsWith(brandListPrefix) ? backTo.slice(brandListPrefix.length) : '');
    if (backTo !== brandListPath && params.has('campaign')) params.set('campaign', campaignId);
    const status = params.get('status');
    if (status && status !== 'COMPLETED') {
      params.set('status', 'COMPLETED');
      params.delete('page');
    }
    navigate(params.size ? brandListPrefix + params : brandListPath, { replace: true });
  }

  useEffect(() => {
    page.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (!roleAllowed || !canRead || !validId) return;
    let active = true;
    setError(undefined);
    collaborationService.detail(id)
      .then(data => { if (active) setDetail(data); })
      .catch(cause => { if (active) setError(collaborationReadError(cause)); });
    return () => { active = false; };
  }, [id, roleAllowed, canRead, validId, refresh]);

  return <main ref={page} className="collaboration-page-container collab-detail-page">
    <div className="collab-detail-nav">
      {!brand && <Breadcrumb items={[
        { title: <Link to={backTo}>Hợp tác</Link> },
        { title: 'Chi tiết' },
      ]} />}
      <Link className="collab-back-link" to={backTo}><ArrowLeftOutlined /> Quay lại danh sách</Link>
    </div>
    {!roleAllowed || !canRead ? <Alert showIcon type="warning" title="Bạn không có quyền xem hợp tác này." />
      : !validId ? <Alert showIcon type="error" title="Không tìm thấy hợp tác." />
        : error ? (error.retryable
          ? <RetryAlert error={error.message} retry={() => setRefresh(value => value + 1)} />
          : <Alert showIcon type="error" title={error.message} />)
          : detail ? <CollaborationExecutionPanel summary={detail} brand={brand} permissions={permissions}
            onReviewCompleted={returnAfterReview} />
            : <Spin />}
  </main>;
}
