/** Preserve timezone-less BE LocalDateTime; do not silently interpret it in the browser timezone. */
export function auditTimestamp(value: string | null | undefined): string {
  if (!value) return '—';
  return value.replace('T', ' ');
}

/** Display protection only. BE must sanitize payloads before persistence and return a safe DTO. */
export function safeAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(safeAuditValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
    /password|passwd|secret|token|authorization|cookie|otp|credential/i.test(key) ? '[Đã ẩn]' : safeAuditValue(item)]));
  return value;
}
