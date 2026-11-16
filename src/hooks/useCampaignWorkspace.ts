import { useCallback, useSyncExternalStore } from 'react';
import { useLocation, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { campaignService } from '../services/api/campaignService';
import { getAuthSessionId, getStoredUser, subscribeAuthSession } from '../services/authSession';
import { activeCampaignId, rememberCampaign } from '../services/campaignContext';
import { useAsyncResource } from './useAsyncResource';
const scope = () => JSON.stringify([getAuthSessionId(), getStoredUser()?.id, getStoredUser()?.permissions]);
export function useCampaignWorkspace() {
  const session = useSyncExternalStore(subscribeAuthSession, scope);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams(); const location = useLocation(); const route = useParams();
  const id = route.id || params.get('campaignId') || params.get('campaign') || location.state?.campaignId || activeCampaignId();
  const catalogQuery = useCallback(() => { if (session !== scope()) throw new Error('Session changed'); return campaignService.getAllCampaigns(); }, [session]);
  const catalog = useAsyncResource(catalogQuery);
  const detailQuery = useCallback(() => { if (session !== scope()) throw new Error('Session changed'); return campaignService.getCampaignById(id); }, [id, session]);
  const detail = useAsyncResource(detailQuery, !!id);
  const choose = (value: string) => { rememberCampaign(value); if (route.id) { navigate('/campaigns/' + value); return; } setParams(previous => { const next = new URLSearchParams(previous); next.set('campaignId', value); next.delete('campaign'); next.delete('page'); return next; }); };
  return { id, catalog, detail, campaign: detail.data, choose };
}
