export const hasNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function numberLabel(value: unknown, digits = 2): string {
  return hasNumber(value) ? value.toLocaleString('vi-VN', { maximumFractionDigits: digits }) : 'Chưa cung cấp';
}

export function percentLabel(value: unknown): string {
  return hasNumber(value) ? (value * 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + '%' : '—';
}

export function textLabel(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : 'Chưa cung cấp';
}
