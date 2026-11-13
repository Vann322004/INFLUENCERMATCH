import { adminService } from '../../../../services/api/adminService';
import { useAsyncResource } from '../../../../hooks/useAsyncResource';

export function useRecommendationConfig(enabled = true) {
  const resource = useAsyncResource(adminService.getRecommendationConfig, enabled);
  return { config: resource.data, loading: resource.status === 'loading', error: resource.error, fetchConfig: resource.reload };
}
