import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, Button, Form, Input, Skeleton, Space } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuthSessionId, getStoredUser, subscribeAuthSession } from '../../services/authSession';
import { dealService } from '../../services/api/dealService';
import { authService } from '../../services/api/authService';
import { getErrorMessage } from '../../services/apiClient';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { forgetCooperation, rememberCooperation, validCooperationToken } from '../../services/cooperationContinuation';
import './CampaignOutreachPage.css';

export default function CooperationInvitationPage() {
  const location = useLocation(), navigate = useNavigate();
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSessionId);
  const token = new URLSearchParams(location.search).get('token') ?? '';
  const valid = validCooperationToken(token);
  const query = useCallback(() => dealService.preview(token), [token]);
  const resource = useAsyncResource(query, valid);
  const user = getStoredUser();
  const creator = String(user?.role).toUpperCase() === 'CREATOR';
  const contextQuery = useCallback(() => dealService.invitationContext(token), [token, session]);
  const context = useAsyncResource(contextQuery, valid && creator && resource.status === 'success');
  const [register, setRegister] = useState(false), [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  const login = async () => {
    rememberCooperation(token);
    if (user) await authService.logout();
    navigate('/login', { state: { cooperationToken: token } });
  };
  const requestRegistration = async ({ email }: { email: string }) => {
    if (lock.current || cooldown > 0) return;
    lock.current = true; setBusy(true); setError('');
    try {
      await dealService.requestCreatorRegistration(token, email.trim());
      rememberCooperation(token); setSent(true); setCooldown(60);
    } catch (e) { setError(getErrorMessage(e, 'Chưa gửi được email đăng ký. Vui lòng thử lại sau.')); }
    finally { lock.current = false; setBusy(false); }
  };
  const proceed = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await dealService.continueInvitation(token);
      if (getAuthSessionId() !== session) return;
      forgetCooperation();
      navigate('/creator/bookings', { state: { cooperationDealId: result.dealId } });
    } catch (e) { setError(getErrorMessage(e, 'Chưa thể mở đề xuất. Kiểm tra quyền quản lý kênh hoặc liên hệ thương hiệu.')); }
    finally { lock.current = false; setBusy(false); }
  };
  return <main style={{ minHeight: '100dvh', padding: '40px 16px', background: '#faf7ff', boxSizing: 'border-box' }}><section className="contact-panel" style={{ maxWidth: 600, margin: '0 auto', display: 'grid', gap: 16 }}>
    <h1 style={{ margin: 0, fontSize: 24 }}>Lời mời hợp tác</h1>
    {!valid ? <Alert type="warning" title="Đường dẫn lời mời không hợp lệ." /> : resource.status === 'loading' ? <Skeleton active /> : resource.status === 'error' ? <Alert type="warning" title="Không mở được lời mời" description="Lời mời có thể đã hết hạn, được thay thế hoặc kết thúc. Liên hệ thương hiệu để được hỗ trợ." action={<Button onClick={() => void resource.reload()}>Thử lại</Button>} /> : resource.data && <>
      <div><strong>{resource.data.brandName}</strong><p>{resource.data.campaignName}</p></div>
      {error && <Alert type="error" title={error} />}
      {!creator ? <>
        <p>Đăng nhập tài khoản Creator để xem và phản hồi đề xuất.</p>
        <Space wrap><Button type="primary" onClick={() => void login()}>{user ? 'Đăng nhập tài khoản Creator' : 'Đăng nhập'}</Button>{!user && <Button onClick={() => setRegister(value => !value)}>Tạo tài khoản Creator</Button>}</Space>
        {register && !user && <Form layout="vertical" onFinish={requestRegistration}>
          <Form.Item name="email" label="Email nhận lời mời" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ.' }]}><Input autoComplete="email" maxLength={255} /></Form.Item>
          {sent && <Alert type="success" title="Kiểm tra hộp thư" description="Nếu email phù hợp với lời mời, bạn sẽ nhận liên kết đăng ký Creator. Nếu đã có tài khoản, hãy đăng nhập. Có thể yêu cầu lại sau 60 giây." />}
          <Button htmlType="submit" loading={busy} disabled={cooldown > 0}>{cooldown ? `Gửi lại sau ${cooldown}s` : 'Gửi liên kết đăng ký'}</Button>
        </Form>}
      </> : context.status === 'loading' ? <Skeleton active /> : context.status === 'error' ? <Alert type="warning" title="Chưa kiểm tra được quyền truy cập" description={context.error} action={<Button onClick={() => void context.reload()}>Thử lại</Button>} /> : context.data?.status === 'READY' ? <>
        <p>Kênh đã liên kết với tài khoản của bạn. Xem đề xuất trước khi quyết định đồng ý, từ chối hoặc đề xuất thay đổi.</p>
        <Button type="primary" loading={busy} onClick={() => void proceed()}>Xem đề xuất hợp tác</Button>
      </> : context.data?.status === 'NEEDS_CHANNEL_VERIFICATION' ? <>
        <Alert type="info" title="Xác minh quyền quản lý kênh" description="Bạn cần liên kết đúng kênh được mời trước khi xem và phản hồi đề xuất." />
        {context.data.channels?.map(channel => <strong key={channel.creatorId}>{channel.platform} · @{channel.username}</strong>)}
        <Button type="primary" onClick={() => { rememberCooperation(token); navigate('/creator/social-accounts'); }}>Liên kết kênh</Button>
        <Button onClick={() => void context.reload()}>Tôi đã xác minh kênh</Button>
      </> : <Alert type="warning" title={context.data?.status === 'ACCOUNT_MISMATCH' ? 'Tài khoản chưa khớp người nhận lời mời' : 'Kênh đang thuộc hồ sơ khác'} description="Dùng đúng tài khoản Creator quản lý kênh hoặc liên hệ thương hiệu để kiểm tra." action={<Button onClick={() => void login()}>Đổi tài khoản</Button>} />}
      <small>Mở lời mời và tạo tài khoản không tự liên kết kênh hoặc xác nhận hợp tác.</small>
    </>}
    <Button type="text" onClick={() => { forgetCooperation(); navigate(creator ? '/creator/dashboard' : '/'); }}>Để sau</Button>
  </section></main>;
}
