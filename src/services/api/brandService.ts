import { apiClient } from '../apiClient';
import type { ApiResponse, PageResponse } from '../../types/api/common.types';
import type { BrandRequest, BrandResponse } from '../../types/api/brand.types';
import type { CampaignResponse } from '../../types/api/campaign.types';

export const brandService = {
  /**
   * Get the current authenticated user's brand profile.
   * Returns null if brand profile does not exist (404).
   */
  async getMyBrand(): Promise<BrandResponse | null> {
    try {
      const response = await apiClient.get<ApiResponse<BrandResponse>>('/brands/me');
      return response.data?.data || null;
    } catch (err: any) {
      if (err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Create a new brand profile.
   */
  async createBrand(payload: BrandRequest): Promise<BrandResponse> {
    const response = await apiClient.post<ApiResponse<BrandResponse>>('/brands', payload);
    return response.data.data;
  },

  /**
   * Update an existing brand profile by ID.
   */
  async updateBrand(id: string, payload: BrandRequest): Promise<BrandResponse> {
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
