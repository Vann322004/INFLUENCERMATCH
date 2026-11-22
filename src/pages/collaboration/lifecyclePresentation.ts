export function outcomeSourceLabel(source?: string | null) {
  return ({ MIXED: 'Nhiều nguồn', PUBLIC_POST_CRAWL: 'Dữ liệu công khai', SELF_REPORTED: 'Creator khai báo', BRAND_EXTERNAL_REPORTED: 'Brand ghi nhận bên ngoài', BRAND_ACCEPTED: 'Brand đã nghiệm thu', LEGACY_UNVERIFIED: 'Dữ liệu lịch sử chưa xác minh', LEGACY: 'Dữ liệu lịch sử' } as Record<string, string>)[source ?? ''] ?? 'Nguồn chưa xác định';
}
export function formatVndInput(value?: string | number | null) {
  if (value == null || value === '') return '';
  const [whole, fraction] = String(value).split('.');
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (fraction ? ',' + fraction : '');
}
export function parseVndInput(value?: string) {
  return (value ?? '').trim().replace(/\./g, '').replace(',', '.');
}
