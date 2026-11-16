import { apiClient } from '../apiClient';
import type { ApiResponse, PageResponse } from '../../types/api/common.types';
import type { BrandRequest, BrandResponse } from '../../types/api/brand.types';
import type { CampaignResponse } from '../../types/api/campaign.types';

const BRAND_CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const STORAGE_KEY_BRAND = 'im_cached_brand_profile';

let cachedBrand: { data: BrandResponse | null; timestamp: number } | null = (() => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_BRAND);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Date.now() - parsed.timestamp < BRAND_CACHE_TTL) {
      return parsed;
    }
  } catch {}
  return null;
})();
let inFlightBrandPromise: Promise<BrandResponse | null> | null = null;

export const brandService = {
  /**
   * Get the current authenticated user's brand profile with deduplication and 3-min cache.
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
        try {
          sessionStorage.setItem(STORAGE_KEY_BRAND, JSON.stringify(cachedBrand));
        } catch {}
        if (data?.id) {
          try {
            localStorage.setItem('influencermatch_brand_id', data.id);
          } catch {}
        }
        return data;
      } catch (err: any) {
        if (err.response?.status === 404) {
          cachedBrand = { data: null, timestamp: Date.now() };
          try {
            sessionStorage.setItem(STORAGE_KEY_BRAND, JSON.stringify(cachedBrand));
          } catch {}
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
   * Clear in-memory and session brand cache
   */
  clearBrandCache() {
    cachedBrand = null;
    inFlightBrandPromise = null;
    try {
      sessionStorage.removeItem(STORAGE_KEY_BRAND);
    } catch {}
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
   * Tạo chuẩn ETag revision theo contract của backend: "brand:<uuid>:r<revision>"
   */
  formatBrandRevisionTag(id: string, revision?: number | null): string {
    const rev = revision != null && !isNaN(Number(revision)) ? Number(revision) : 0;
    return `"brand:${id}:r${rev}"`;
  },

  /**
   * Chuẩn hóa bất kỳ chuỗi ETag nào từ header hoặc payload:
   * - Bỏ tiền tố weak ETag 'W/' (thường bị Cloudflare / Nginx / Proxy tự động chèn vào)
   * - Bọc ngoặc kép đúng contract \"brand:<uuid>:r<revision>\"
   * - Nếu header bị thiếu (do CORS che giấu), tự tính từ brand.id và brand.profileRevision
   */
  resolveBrandETag(rawEtag?: string | null, brand?: BrandResponse | null): string | null {
    if (rawEtag && typeof rawEtag === 'string' && rawEtag.trim()) {
      let clean = rawEtag.trim();
      if (clean.startsWith('W/')) {
        clean = clean.slice(2).trim();
      }
      if (!clean.startsWith('"')) {
        clean = `"${clean}`;
      }
      if (!clean.endsWith('"')) {
        clean = `${clean}"`;
      }
      if (/^"brand:[0-9a-fA-F-]{36}:r\d+"$/.test(clean)) {
        return clean;
      }
    }
    if (brand?.id) {
      return this.formatBrandRevisionTag(brand.id, brand.profileRevision);
    }
    return null;
  },

  async getMyBrandForEdit(): Promise<{ brand: BrandResponse; etag: string } | null> {
    try {
      const response = await apiClient.get<ApiResponse<BrandResponse>>('/brands/me');
      const data = response.data?.data;
      if (!data) return null;
      const rawHeader =
        response.headers?.['etag'] ??
        response.headers?.etag ??
        (typeof response.headers?.get === 'function' ? response.headers.get('etag') : null);
      const etag = this.resolveBrandETag(rawHeader, data);
      if (!etag) throw new Error('Không lấy được phiên bản hồ sơ. Vui lòng tải lại trang.');
      return { brand: data, etag };
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  async saveMyBrand(
    payload: BrandRequest,
    etag: string | null,
  ): Promise<{ brand: BrandResponse; etag: string }> {
    let cleanEtag: string | null = null;
    if (etag) {
      cleanEtag = this.resolveBrandETag(etag);
    }
    const response = cleanEtag
      ? await apiClient.patch<ApiResponse<BrandResponse>>('/brands/me', payload, {
          headers: { 'If-Match': cleanEtag },
        })
      : await apiClient.post<ApiResponse<BrandResponse>>('/brands', payload);
    this.clearBrandCache();
    const savedBrand = response.data.data;
    const rawHeader =
      response.headers?.['etag'] ??
      response.headers?.etag ??
      (typeof response.headers?.get === 'function' ? response.headers.get('etag') : null);
    const finalEtag = this.resolveBrandETag(rawHeader, savedBrand) || (savedBrand?.id ? this.formatBrandRevisionTag(savedBrand.id, savedBrand.profileRevision) : '');
    return { brand: savedBrand, etag: finalEtag };
  },

  async completeOnboarding(etagOrBrand: string | BrandResponse): Promise<{ brand: BrandResponse; etag: string }> {
    let finalEtag: string;
    if (typeof etagOrBrand === 'string') {
      finalEtag = this.resolveBrandETag(etagOrBrand) || etagOrBrand.trim();
    } else {
      finalEtag = this.resolveBrandETag(null, etagOrBrand) || '';
    }
    if (finalEtag.startsWith('W/')) finalEtag = finalEtag.slice(2).trim();
    if (!finalEtag.startsWith('"')) finalEtag = `"${finalEtag}"`;

    const response = await apiClient.post<ApiResponse<BrandResponse>>('/brands/me/onboarding/complete', undefined, {
      headers: { 'If-Match': finalEtag },
    });
    this.clearBrandCache();
    const completedBrand = response.data.data;
    const rawHeader =
      response.headers?.['etag'] ??
      response.headers?.etag ??
      (typeof response.headers?.get === 'function' ? response.headers.get('etag') : null);
    const finalReturnEtag = this.resolveBrandETag(rawHeader, completedBrand) || (completedBrand?.id ? this.formatBrandRevisionTag(completedBrand.id, completedBrand.profileRevision) : '');
    return { brand: completedBrand, etag: finalReturnEtag };
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
