import type { Deal, Delivery } from '../../services/api/dealService';
export const deliveryMethodLabels: Record<string, string> = { PORTAL_EMAIL: 'Portal & email', PORTAL_ONLY: 'Thông báo Portal', EMAIL_ONLY: 'Email liên hệ', MANUAL_LINK: 'Chia sẻ link thủ công' };

export function invitationDisplay(deal: Deal, delivery: Delivery | null) {
  const accepted = !!deal.proposal && deal.acceptedRevision === deal.proposal.revision;
  const final = ['CONFIRMED', 'ACTIVE', 'COMPLETED', 'DECLINED', 'CANCELLED'].includes(deal.status);
  const route = !delivery && deal.availableDeliveryMethods?.length ? deal.availableDeliveryMethods.length > 1 ? `Brand chọn khi gửi · ${deal.availableDeliveryMethods.length} cách` : deliveryMethodLabels[deal.availableDeliveryMethods[0]] ?? 'Cần kiểm tra cách gửi'
    : delivery?.deliveryMethod && deliveryMethodLabels[delivery.deliveryMethod] ? deliveryMethodLabels[delivery.deliveryMethod] : delivery?.emailStatus === 'MANUAL_REQUIRED' ? 'Chia sẻ thủ công'
    : delivery && !['CANCELLED'].includes(delivery.emailStatus) ? deal.masterId ? 'Portal & email' : 'Email liên hệ'
    : deal.plannedContactChannel === 'IN_APP_PORTAL' || deal.masterId ? 'Portal & email'
    : deal.plannedContactChannel === 'SYSTEM_EMAIL_OUTBOX' ? 'Email liên hệ'
    : deal.plannedContactChannel === 'MANUAL_SOCIAL_LINK' ? 'Chia sẻ thủ công' : 'Cần kiểm tra cách gửi';
  let dispatch = !deal.proposal ? 'Chưa soạn nội dung' : 'Chưa gửi bản đề xuất này';
  let hint = !deal.proposal ? 'Hoàn thiện phí, điều khoản và ấn phẩm trước khi gửi.' : 'Bản đề xuất đã lưu, chưa có lời mời cho phiên bản này.';
  let action = deal.proposal ? 'Xem lại & gửi' : 'Soạn lời mời';
  if (delivery) {
    switch (delivery.emailStatus) {
      case 'QUEUED': dispatch = 'Email đang chờ gửi'; hint = 'Hệ thống đã nhận yêu cầu, chưa xác nhận email được gửi.'; break;
      case 'PROCESSING': dispatch = 'Đang gửi email'; hint = 'Kiểm tra lại trạng thái sau ít phút.'; break;
      case 'SENT': dispatch = 'Email đã gửi'; hint = 'Chưa xác nhận người nhận đã đọc hoặc đồng ý.'; break;
      case 'FAILED': dispatch = 'Gửi email thất bại'; hint = delivery.canRetry ? 'Có thể thử gửi lại email cho lời mời này.' : 'Mở lời mời để kiểm tra điều kiện thử gửi lại.'; break;
      case 'MANUAL_REQUIRED': dispatch = 'Cần bạn chia sẻ link'; hint = 'Hệ thống không tự nhắn tin mạng xã hội. Lấy link và tự gửi cho người nhận.'; break;
      case 'NOT_REQUESTED': dispatch = 'Đã tạo thông báo Portal'; hint = 'Không gửi email theo lựa chọn của Brand. Chưa xác nhận Creator đã đọc hoặc đồng ý.'; break;
      case 'CANCELLED': dispatch = 'Đã dừng gửi email'; hint = 'Kiểm tra phiên bản đề xuất hiện hành trước khi gửi lại.'; break;
      default: dispatch = 'Chưa xác định trạng thái gửi'; hint = 'Mở lời mời để kiểm tra trạng thái mới nhất.';
    }
    action = delivery.emailStatus === 'MANUAL_REQUIRED' ? 'Chia sẻ lời mời' : delivery.emailStatus === 'FAILED' ? 'Xử lý gửi lỗi' : 'Xem trạng thái gửi';
    if (delivery.active === false && !final && !accepted) { dispatch = 'Lời mời không còn hiệu lực'; hint = 'Kiểm tra phiên bản hiện hành và tạo lời mời mới khi cần.'; action = 'Kiểm tra lời mời'; }
  }
  const response = final ? ({ CONFIRMED: 'Đã xác nhận hợp tác', ACTIVE: 'Đang hợp tác', COMPLETED: 'Đã hoàn thành', DECLINED: 'Creator đã từ chối', CANCELLED: 'Đã hủy thỏa thuận' }[deal.status] ?? deal.status)
    : deal.proposal?.kind === 'COUNTEROFFER' ? 'Creator đề xuất thay đổi' : accepted ? 'Creator đã đồng ý · Chờ Brand xác nhận'
    : delivery ? 'Chưa ghi nhận Creator đồng ý' : 'Chưa yêu cầu phản hồi';
  if (final) { action = 'Xem thỏa thuận'; hint = deal.status === 'CONFIRMED' ? 'Thỏa thuận đã được xác nhận; trạng thái gửi không thay đổi kết quả này.' : 'Thỏa thuận đã kết thúc bước trao đổi. Xem chi tiết để tra cứu.'; }
  else if (deal.proposal?.kind === 'COUNTEROFFER') action = 'Xem đề xuất thay đổi';
  else if (accepted) action = 'Xác nhận hợp tác';
  return { route, dispatch, hint, response, action };
}
