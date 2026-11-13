import { useState, useCallback, useEffect } from 'react';
import { adminService } from '../../../../services/api/adminService';
import type { RecommendationConfigResponseDto } from '../../../../types/api/recommendationConfig.types';

export function useRecommendationConfig() {
  const [config, setConfig] = useState<RecommendationConfigResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getRecommendationConfig();
      if (data && data.engineVersion) {
        setConfig(data);
      } else {
        throw new Error('Dữ liệu phản hồi từ Backend không đúng cấu trúc RecommendationConfigResponseDto.');
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể kết nối đến máy chủ Backend để tải cấu hình thuật toán.';
      setError(errMsg);
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);
  return { config, loading, error, fetchConfig };
}
