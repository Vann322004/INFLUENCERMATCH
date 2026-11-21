import { useCallback, useSyncExternalStore } from 'react';
import { Alert, Button, Skeleton } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuthSessionId, getStoredUser, subscribeAuthSession } from '../../services/authSession';
import { dealService } from '../../services/api/dealService';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import './CampaignOutreachPage.css';

export default function CooperationInvitationPage() {
  const location = useLocation(), navigate = useNavigate();
  useSyncExternalStore(subscribeAuthSession, getAuthSessionId);
  const token = new URLSearchParams(location.search).get('token') ?? '';
  const valid = /^[a-f0-9]{64}$/.test(token);
  const query = useCallback(() => dealService.preview(token), [token]);
  const resource = useAsyncResource(query, valid);
  const creator = String(getStoredUser()?.role).toUpperCase() === 'CREATOR';
  return <main style={{ minHeight: '100dvh', padding: '40px 16px', background: '#faf7ff', boxSizing: 'border-box' }}><section className="contact-panel" style={{ maxWidth: 600, margin: '0 auto' }}>
    <h1 style={{ margin: 0, fontSize: 24 }}>Lời mời hợp tác</h1>
    {!valid ? <Alert type="warning" title="Đường dẫn lời mời không hợp lệ." /> : resource.status === 'loading' ? <Skeleton active /> : resource.status === 'error' ? <Alert type="warning" title="Không mở được lời mời" description="Lời mời có thể đã hết hạn, được thay thế hoặc tạm thời chưa tải được. Liên hệ thương hiệu hoặc thử lại." action={<Button onClick={() => void resource.reload()}>Thử lại</Button>} /> : resource.data && <>
      <strong>{resource.data.brandName}</strong><p>{resource.data.campaignName}</p><p>Đăng nhập tài khoản Creator quản lý kênh để xem và phản hồi đề xuất. Mở đường dẫn không xác nhận hợp tác hoặc chuyển quyền sở hữu kênh.</p>
      <Button type="primary" onClick={() => creator ? navigate('/creator/bookings') : navigate('/login', { state: { cooperationReturnTo: '/creator/bookings' } })}>{creator ? 'Xem lời mời của tôi' : 'Đăng nhập để tiếp tục'}</Button>
      <small>Chỉ tài khoản có quyền với kênh được mời mới xem được nội dung chi tiết.</small>
    </>}
  </section></main>;
}
