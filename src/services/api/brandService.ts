import { apiClient } from '../apiClient';
import type { ApiResponse, PageResponse } from '../../types/api/common.types';
import type { BrandRequest, BrandResponse } from '../../types/api/brand.types';
import type { CampaignResponse } from '../../types/api/campaign.types';

let cachedBrand: { data: BrandResponse | null; timestamp: number } | null = null;
let inFlightBrandPromise: Promise<BrandResponse | null> | null = null;
const BRAND_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export const brandService = {
  /**
   * Get the current authenticated user's brand profile with deduplication and 2-min cache.
   * Returns null if brand profile does not exist (404).
   */
  async getMyBrand(forceRefresh = false): Promise<BrandResponse | null> {
    if (!forceRefresh && cachedBrand && Date.now() - cachedBrand.timestamp < BRAND_CACHE_TTL) {
      return cachedBrand.data;
    }

    if (inFlightBrandPromise) {
      return inFlightBrandPromise;
    }

    inFlightBrandPromise = (async () => {
      try {
        const response = await apiClient.get<ApiResponse<BrandResponse>>('/brands/me');
        const data = response.data?.data || null;
        cachedBrand = { data, timestamp: Date.now() };
        if (data?.id) {
          try {
            localStorage.setItem('influencermatch_brand_id', data.id);
          } catch {}
        }
        return data;
      } catch (err: any) {
        if (err.response?.status === 404) {
          cachedBrand = { data: null, timestamp: Date.now() };
          return null;
        }
        throw err;
      } finally {
        inFlightBrandPromise = null;
      }
    })();

    return inFlightBrandPromise;
  },

  /**
   * Clear in-memory brand cache
   */
  clearBrandCache() {
    cachedBrand = null;
  },

  /**
   * Create a new brand profile.
   */
  async createBrand(payload: BrandRequest): Promise<BrandResponse> {
    cachedBrand = null;
    const response = await apiClient.post<ApiResponse<BrandResponse>>('/brands', payload);
    const data = response.data.data;
    if (data?.id) {
      try {
        localStorage.setItem('influencermatch_brand_id', data.id);
      } catch {}
    }
    return data;
  },

  /**
   * Update an existing brand profile by ID.
   */
  async updateBrand(id: string, payload: BrandRequest): Promise<BrandResponse> {
    cachedBrand = null;
    const response = await apiClient.put<ApiResponse<BrandResponse>>(`/brands/${id}`, payload);
    return response.data.data;
  },

  /**
   * Get brand profile details by brand ID.
   */
  async getBrandById(id: string): Promise<BrandResponse> {
    const response = await apiClient.get<ApiResponse<BrandResponse>>(`/brands/${id}`);
    return response.data.data;
  },

  /**
   * Get list of campaigns for a specific brand.
   */
  async getBrandCampaigns(brandId: string, page = 0, size = 10): Promise<CampaignResponse[]> {
    const response = await apiClient.get<ApiResponse<PageResponse<CampaignResponse>>>(
      `/brands/${brandId}/campaigns`,
      { params: { page, size } }
    );
    return response.data?.data?.items || [];
  },
};
