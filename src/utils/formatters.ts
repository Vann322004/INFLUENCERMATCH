/**
 * Định dạng số theo chuẩn tiếng Việt:
 * - Dưới 1.000: giữ nguyên (VD: 850)
 * - Từ 1.000 đến dưới 1.000.000: hiển thị 'N' (nghìn) (VD: 573,9 N)
 * - Từ 1.000.000 trở lên: hiển thị 'Tr' (triệu) (VD: 20,3 Tr)
 * - Từ 1.000.000.000 trở lên: hiển thị 'Tỷ' (VD: 1,2 Tỷ)
 */
export function formatViNumber(num?: number | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) {
    const val = (num / 1_000_000_000).toLocaleString('vi-VN', {
      maximumFractionDigits: 1,
    });
    return `${val} Tỷ`;
  }
  if (abs >= 1_000_000) {
    const val = (num / 1_000_000).toLocaleString('vi-VN', {
      maximumFractionDigits: 1,
    });
    return `${val} Tr`;
  }
  if (abs >= 1_000) {
    const val = (num / 1_000).toLocaleString('vi-VN', {
      maximumFractionDigits: 1,
    });
    return `${val} N`;
  }
  return num.toLocaleString('vi-VN');
}

/**
 * Định dạng số đầy đủ phân cách hàng nghìn (VD: 573900 -> 573.900)
 */
export function formatFullNumber(num?: number | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return num.toLocaleString('vi-VN');
}

