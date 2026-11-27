import { Alert, Spin } from 'antd';
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

function stateString(state: unknown, key: string): string | undefined {
  if (!state || typeof state !== 'object' || !(key in state)) return undefined;
  const value = (state as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}

function stateObject(state: unknown, key: string): Record<string, unknown> | undefined {
  if (!state || typeof state !== 'object' || !(key in state)) return undefined;
  const value = (state as Record<string, unknown>)[key];
  return value && typeof value === 'object' ? value as Record<string, unknown> : undefined;
}

function collaborationListLocation(state: unknown, fallbackCampaignId?: string) {
  const returnTo = stateString(state, 'returnTo');
  const returnState = stateObject(state, 'returnToState');
  let campaignId = typeof returnState?.campaignId === 'string' ? returnState.campaignId : fallbackCampaignId;
  let to = '/collaboration';
  if (returnTo === '/collaboration' || returnTo?.startsWith('/collaboration?')) {
    const url = new URL(returnTo, window.location.origin);
    campaignId = campaignId || url.searchParams.get('campaign') || url.searchParams.get('campaignId') || undefined;
    url.searchParams.delete('campaign');
    url.searchParams.delete('campaignId');
    to = url.pathname + (url.searchParams.size ? '?' + url.searchParams : '');
  }
  return { to, state: campaignId ? { campaignId } : undefined };
}

export default function CollaborationDetailPage({ brand }: { brand: boolean }) {
  const location = useLocation();
  const { collaborationId: paramId } = useParams<{ collaborationId?: string }>();
  const collaborationId = stateString(location.state, 'collaborationId') ?? paramId;
  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />;
  if (!collaborationId) return <Navigate to={brand ? '/collaboration' : '/creator/bookings?view=work'} replace />;
  if (!brand && paramId) {
    return (
      <Navigate
        to="/creator/bookings/detail"
        replace
        state={{ ...(location.state && typeof location.state === 'object' ? location.state : {}), collaborationId: paramId }}
      />
    );
  }
  return <Detail key={collaborationId} id={collaborationId} brand={brand} />;
}

function Detail({ id, brand }: { id: string; brand: boolean }) {
  const { state, search } = useLocation();
  const showResults = new URLSearchParams(search).get('tab') === 'kpi';
  const navigate = useNavigate();
  const permissions = useCollaborationPermissions();
  const page = useRef<HTMLElement>(null);
  const [detail, setDetail] = useState<CollaborationDetail>();
  const [error, setError] = useState<ReturnType<typeof collaborationReadError>>();
  const [refresh, setRefresh] = useState(0);
  const roleAllowed = authService.getCurrentUser()?.role === (brand ? 'BRAND' : 'CREATOR');
  const canRead = permissions.has(brand ? 'MANAGE_OWN_COLLABORATION' : 'RESPOND_OWN_COOPERATION');
  const validId = uuid.test(id);
  const back = brand
    ? collaborationListLocation(state, detail?.campaignId)
    : { to: '/creator/bookings?view=work', state: undefined };

  function returnAfterReview(campaignId: string) {
    const destination = collaborationListLocation(state, campaignId);
    const params = new URL(destination.to, window.location.origin).searchParams;
    const status = params.get('status');
    if (status && status !== 'COMPLETED') {
      params.set('status', 'COMPLETED');
      params.delete('page');
    }
    navigate('/collaboration' + (params.size ? '?' + params : ''), { replace: true, state: destination.state });
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
      <Link className="collab-back-link" aria-label="Quay lại danh sách" to={back.to} state={back.state}><ArrowLeftOutlined /> Quay lại danh sách</Link>
    </div>
    {!roleAllowed || !canRead ? <Alert showIcon type="warning" title="Bạn không có quyền xem hợp tác này." />
      : !validId ? <Alert showIcon type="error" title="Không tìm thấy hợp tác." />
        : error ? (error.retryable
          ? <RetryAlert error={error.message} retry={() => setRefresh(value => value + 1)} />
          : <Alert showIcon type="error" title={error.message} />)
          : detail ? <CollaborationExecutionPanel summary={detail} brand={brand} permissions={permissions} showResults={showResults}
            onReviewCompleted={returnAfterReview} />
            : <Spin />}
  </main>;
}
