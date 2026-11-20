import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import type { BrandCampaignItem } from '../components/discovery/types';
import { mapApiCampaignToItem } from '../components/discovery/discoveryUtils';
import { campaignService } from '../../../services/api/campaignService';
import { rememberCampaign, forgetCampaign } from '../../../services/campaignContext';
export function useDiscoveryCampaigns({ initialCampId, onRequestKeyBump }: { initialCampId: string | null; locationState: any; onRequestKeyBump?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const updateCampaignContext = (id: string | null) => {
    const params = new URLSearchParams(location.search);
    params.delete('campaignId');
    const search = params.toString();
    navigate(location.pathname + (search ? '?' + search : '') + location.hash, {
      replace: true,
      state: { ...location.state, campaignId: id, discoveryBreadcrumb: null },
    });
  };
  const [campaignsList, setCampaignsList] = useState<BrandCampaignItem[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(initialCampId);
  const [matchedCampaign, setMatchedCampaign] = useState<BrandCampaignItem | null>(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true), [loadCampaignError, setLoadCampaignError] = useState('');
  const [campaignRequestKey, setCampaignRequestKey] = useState(0);
  useEffect(() => { setSelectedCampaignId(initialCampId); }, [initialCampId]);
  useEffect(() => {
    let alive = true; setLoadingCampaigns(true); setLoadCampaignError(''); setMatchedCampaign(null);
    Promise.all([campaignService.getAllCampaigns(), selectedCampaignId ? campaignService.getCampaignById(selectedCampaignId) : Promise.resolve(null)])
      .then(([campaigns, selected]) => { if (!alive) return; setCampaignsList(campaigns.map(mapApiCampaignToItem)); setMatchedCampaign(selected ? mapApiCampaignToItem(selected) : null); })
      .catch(() => { if (alive) { setCampaignsList([]); setMatchedCampaign(null); setLoadCampaignError('Không thể tải chiến dịch từ hệ thống. Vui lòng thử lại.'); } })
      .finally(() => { if (alive) setLoadingCampaigns(false); });
    return () => { alive = false; };
  }, [selectedCampaignId, campaignRequestKey]);
  const handleTriggerMatch = (target?: BrandCampaignItem) => {
    const id = target?.id || selectedCampaignId;
    if (!id) { message.info('Chọn chiến dịch trước khi khám phá.'); return; }
    rememberCampaign(id); setSelectedCampaignId(id); updateCampaignContext(id);
    setCampaignRequestKey(value => value + 1); onRequestKeyBump?.();
  };
  const handleClearMatch = () => { forgetCampaign(); setSelectedCampaignId(null); setMatchedCampaign(null); updateCampaignContext(null); onRequestKeyBump?.(); };
  return { campaignsList, selectedCampaignId, matchedCampaign, loadingCampaigns, loadCampaignError, campaignRequestKey, setCampaignRequestKey, setSelectedCampaignId, setMatchedCampaign, handleTriggerMatch, handleClearMatch };
}
