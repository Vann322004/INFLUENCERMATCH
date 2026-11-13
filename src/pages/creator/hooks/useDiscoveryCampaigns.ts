import { useState, useEffect } from 'react';
import { message } from 'antd';
import type { BrandCampaignItem } from '../components/discovery/types';
import {
  mapApiCampaignToItem,
  updateDiscoveryCache,
} from '../components/discovery/discoveryUtils';
import { campaignService } from '../../../services/api/campaignService';

interface UseDiscoveryCampaignsOptions {
  initialCampId: string | null;
  locationState: any;
  onRequestKeyBump?: () => void;
}

export function useDiscoveryCampaigns({
  initialCampId,
  locationState,
  onRequestKeyBump,
}: UseDiscoveryCampaignsOptions) {
  const [campaignsList, setCampaignsList] = useState<BrandCampaignItem[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(true);
  const [campaignRequestKey, setCampaignRequestKey] = useState(0);
  const [loadCampaignError, setLoadCampaignError] = useState('');

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    () => initialCampId || null
  );

  const [matchedCampaign, setMatchedCampaign] = useState<BrandCampaignItem | null>(() => {
    const passed = locationState?.createdCampaign;
    if (passed) return mapApiCampaignToItem(passed);
    try {
      const rawStored = localStorage.getItem('IM_MATCHED_CAMPAIGN');
      if (rawStored) {
        const parsed = JSON.parse(rawStored);
        if (parsed && parsed.id === initialCampId) {
          return {
            id: parsed.id || initialCampId,
            name: parsed.name || 'Chiến dịch mới',
            tag: parsed.category || 'Mới khởi tạo',
            target: parsed.target || parsed.targetAudience || 'Khán giả mục tiêu',
            budget: parsed.budget || '25.0M VND',
            targetAudience: parsed.targetAudience || 'Khán giả mục tiêu',
            category: parsed.category || 'Làm đẹp & Mỹ phẩm',
            channels: parsed.channels || ['tiktok'],
            status: 'ACTIVE',
            requirements: parsed.requirements || '',
            followerMin: parsed.followerMin ? Number(parsed.followerMin) : undefined,
            followerMax: parsed.followerMax ? Number(parsed.followerMax) : undefined,
          };
        }
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    let isMounted = true;
    const fetchBrandCampaigns = async () => {
      setLoadingCampaigns(true);
      setMatchedCampaign(null);
      setSelectedCampaignId(initialCampId);
      setLoadCampaignError('');
      try {
        const apiCampaigns = await campaignService.getCampaigns(0, 50);
        if (!isMounted) return;

        let mapped: BrandCampaignItem[] = [];
        if (Array.isArray(apiCampaigns) && apiCampaigns.length > 0) {
          mapped = apiCampaigns.map(mapApiCampaignToItem);
        }

        const targetId = initialCampId;
        let matched: BrandCampaignItem | undefined;
        if (targetId) {
          matched = mapped.find((c) => c.id === targetId);

          const passedCampaign = locationState?.createdCampaign;
          let storedCampaign: any = null;
          try {
            const rawStored = localStorage.getItem('IM_MATCHED_CAMPAIGN');
            if (rawStored) storedCampaign = JSON.parse(rawStored);
          } catch {}

          if (!matched) {
            if (passedCampaign && (passedCampaign.id === targetId || !passedCampaign.id)) {
              matched = mapApiCampaignToItem(passedCampaign);
            } else {
              try {
                const fetched = await campaignService.getCampaignById(targetId);
                if (fetched) {
                  matched = mapApiCampaignToItem(fetched);
                }
              } catch {
                if (storedCampaign && storedCampaign.id === targetId) {
                  matched = {
                    id: targetId,
                    name: storedCampaign.name || passedCampaign?.name || 'Chiến dịch mới',
                    tag: storedCampaign.category || 'Mới khởi tạo',
                    target: storedCampaign.target || storedCampaign.targetAudience || 'Khán giả mục tiêu',
                    budget: storedCampaign.budget || '25.0M VND',
                    targetAudience: storedCampaign.targetAudience || 'Khán giả mục tiêu',
                    category: storedCampaign.category || 'Làm đẹp & Mỹ phẩm',
                    channels: storedCampaign.channels || ['tiktok'],
                    status: 'ACTIVE',
                    requirements: storedCampaign.requirements || '',
                    followerMin: storedCampaign.followerMin ? Number(storedCampaign.followerMin) : undefined,
                    followerMax: storedCampaign.followerMax ? Number(storedCampaign.followerMax) : undefined,
                  };
                }
              }
            }
          }

          if (matched) {
            if (!matched.followerMin && passedCampaign?.followerMin) {
              matched.followerMin = Number(passedCampaign.followerMin);
            }
            if (!matched.followerMax && passedCampaign?.followerMax) {
              matched.followerMax = Number(passedCampaign.followerMax);
            }
            if (!matched.followerMin && storedCampaign?.followerMin) {
              matched.followerMin = Number(storedCampaign.followerMin);
            }
            if (!matched.followerMax && storedCampaign?.followerMax) {
              matched.followerMax = Number(storedCampaign.followerMax);
            }

            mapped = [matched, ...mapped.filter((c) => c.id !== matched!.id)];
          }
        }

        if (!isMounted) return;
        setCampaignsList(mapped);
        updateDiscoveryCache({ campaigns: mapped });

        if (matched) {
          setSelectedCampaignId(matched.id);
          setMatchedCampaign(matched);
          updateDiscoveryCache({ matchedCampaign: matched, selectedCampaignId: matched.id });
          message.success({
            content: `Đã tự động chọn dự án "${matched.name}" để đề xuất Creator!`,
            key: 'auto_selected_campaign',
            duration: 2.5,
          });
        }
        if (targetId && !matched) {
          setLoadCampaignError('Không tìm thấy chiến dịch đang được yêu cầu.');
        }
      } catch (err) {
        if (isMounted) setLoadCampaignError('Không tải được thông tin chiến dịch. Vui lòng tải lại trang.');
        console.warn('Lỗi khi tải chiến dịch thực tế từ API:', err);
      } finally {
        if (isMounted) setLoadingCampaigns(false);
      }
    };

    fetchBrandCampaigns();
    return () => {
      isMounted = false;
    };
  }, [initialCampId, locationState, campaignRequestKey]);

  const handleTriggerMatch = (targetCamp?: BrandCampaignItem) => {
    const campaign = targetCamp || campaignsList.find((item) => item.id === selectedCampaignId);
    if (!campaign) {
      message.warning('Chọn một chiến dịch trước khi tìm creator.');
      return;
    }
    setMatchedCampaign(campaign);
    setSelectedCampaignId(campaign.id);
    localStorage.setItem('IM_MATCHED_CAMPAIGN', JSON.stringify(campaign));
    localStorage.setItem('IM_SELECTED_CAMPAIGN_ID', campaign.id);
    if (onRequestKeyBump) onRequestKeyBump();
  };

  const handleClearMatch = () => {
    setSelectedCampaignId(null);
    setMatchedCampaign(null);
    localStorage.removeItem('IM_MATCHED_CAMPAIGN');
    localStorage.removeItem('IM_SELECTED_CAMPAIGN_ID');
    if (onRequestKeyBump) onRequestKeyBump();
  };

  return {
    campaignsList,
    loadingCampaigns,
    selectedCampaignId,
    matchedCampaign,
    loadCampaignError,
    campaignRequestKey,
    setCampaignRequestKey,
    setSelectedCampaignId,
    setMatchedCampaign,
    handleTriggerMatch,
    handleClearMatch,
  };
}

