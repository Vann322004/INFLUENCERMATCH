import { apiClient } from '../apiClient';
import type { ApiResponse } from '../../types/api/common.types';

export interface StoredImage {
  url: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
}

export function validateImageFile(file: File, maxMB = 10) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > maxMB * 1024 * 1024) {
    throw new Error(`Chọn ảnh JPG, PNG hoặc WEBP, tối đa ${maxMB} MB.`);
  }
}

/** All image bytes go through the authenticated BE API. No cloud credentials in the browser. */
export async function uploadImage<T>(path: string, file: File, signal?: AbortSignal,
  headers?: Record<string, string>): Promise<T> {
  validateImageFile(file);
  const body = new FormData();
  body.append('file', file);
  const response = await apiClient.post<ApiResponse<T>>(path, body, {
    headers: { 'Content-Type': undefined, ...headers }, signal, timeout: 60000,
  });
  if (response.data?.success === false || !response.data?.data) {
    throw new Error('Máy chủ chưa xác nhận ảnh đã tải lên. Ảnh cũ được giữ nguyên.');
  }
  return response.data.data;
}
