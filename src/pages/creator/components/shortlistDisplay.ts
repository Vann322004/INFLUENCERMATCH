export const shortlistNumber = (value: number | null | undefined) => value == null ? 'Chưa có dữ liệu' : value.toLocaleString('vi-VN', { maximumFractionDigits: 6 });
export const shortlistDate = (value: string | null | undefined) => value ? value.replace('T', ' ').replace(/(\.\d{3})\d+/, '$1') : 'Chưa có dữ liệu';

const labels: Record<string, string> = {
  SAVED: 'Đã lưu', READY_TO_CONTACT: 'Sẵn sàng liên hệ', CONTACTED: 'Đã chuyển bước liên hệ', REMOVED: 'Đã xóa',
  HIGH: 'Cao', MEDIUM: 'Trung bình', LOW: 'Thấp',
  FRESH: 'Mới cập nhật', STALE: 'Cần cập nhật', REFRESH_FAILED: 'Cập nhật chưa thành công',
  VERIFIED: 'Đã xác minh', UNVERIFIED: 'Chưa xác minh', PENDING: 'Đang chờ xử lý', REJECTED: 'Đã từ chối', REVOKED: 'Đã thu hồi',
  PUBLIC: 'Dữ liệu công khai', AUTHORIZED: 'Đã được ủy quyền',
  UNAVAILABLE: 'Chưa khả dụng', READY: 'Sẵn sàng', MANUAL_CONTACT: 'Cần liên hệ trực tiếp', ALREADY_CONTACTED: 'Đã có hồ sơ tiếp cận',
  IN_APP_PORTAL: 'Thông báo trong hệ thống', SYSTEM_EMAIL_OUTBOX: 'Thư điện tử của hệ thống',
  MANUAL_SOCIAL_LINK: 'Trang cá nhân công khai', EXISTING_INVITATION: 'Hồ sơ liên hệ hiện có', NONE: 'Chưa có cách liên hệ',
  ADDED: 'Đã thêm', ALREADY_EXISTS: 'Đã có trong danh sách', RESTORED: 'Đã khôi phục', INVALID: 'Kênh không còn khả dụng', FAILED: 'Chưa thực hiện được',
  NEEDS_PROPOSAL: 'Đã tạo bản nháp, cần hoàn thiện đề xuất', QUEUED: 'Đang chờ gửi', SENT: 'Đã gửi',
  DEAL_STATE_CONFLICT: 'Trạng thái thỏa thuận đã thay đổi', DEAL_REVISION_CONFLICT: 'Thỏa thuận có phiên bản mới',
  FORBIDDEN: 'Không đủ quyền thực hiện', RESOURCE_NOT_FOUND: 'Không tìm thấy kênh', NOT_FOUND: 'Không tìm thấy kênh',
  INTERNAL_ERROR: 'Lỗi xử lý từ hệ thống', ACCESS_DENIED: 'Không đủ quyền thực hiện', UNAUTHENTICATED: 'Cần đăng nhập lại',
};
export function shortlistLabel(value: string | null | undefined, missing = 'Chưa có dữ liệu'): string {
  return value == null || value === '' ? missing : labels[value] ?? 'Chưa xác định';
}
const readinessReasons: Record<string, string> = {
  READY: 'Có cách liên hệ khả dụng theo kiểm tra của hệ thống.',
  MANUAL_CONTACT: 'Cần liên hệ trực tiếp qua trang cá nhân công khai.',
  UNAVAILABLE: 'Chưa tìm thấy thông tin liên hệ phù hợp.',
  ALREADY_CONTACTED: 'Đã có hồ sơ tiếp cận trong chiến dịch. Kiểm tra để tránh tạo trùng.',
};
export const readinessReason = (status: string) => readinessReasons[status] ?? 'Chưa xác định khả năng liên hệ.';
export const outreachLabel = (status: string) => status === 'ALREADY_EXISTS' ? 'Đã có hồ sơ tiếp cận, sử dụng thỏa thuận hiện có' : shortlistLabel(status);
