import type { PageResponse } from '../../types/api/common.types';

/** Both pagination DTOs currently used by the backend. Never infer totals from a page. */
export function readPage<T>(payload: unknown): PageResponse<T> {
  const envelope = payload as Record<string, unknown> | null;
  if (envelope?.success === false) throw new Error('API không thể tải dữ liệu.');
  const data = (envelope?.data ?? payload) as Record<string, unknown> | null;
  const items = data?.items ?? data?.content;
  const page = data?.page ?? data?.pageNumber ?? data?.number;
  const size = data?.size ?? data?.pageSize;
  const totalElements = data?.totalElements;
  const totalPages = data?.totalPages;
  if (!Array.isArray(items) || ![page, size, totalElements, totalPages].every(value =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)
    || (size as number) < 1 || items.length > (size as number) || items.length > (totalElements as number)) {
    throw new Error('Dữ liệu phân trang hoặc tổng số bản ghi không hợp lệ.');
  }
  return { items: items as T[], page: page as number, size: size as number,
    totalElements: totalElements as number, totalPages: totalPages as number };
}
