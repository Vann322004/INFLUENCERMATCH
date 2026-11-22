import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Checkbox, Form, Input, Skeleton } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { getErrorMessage } from '../../services/apiClient';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { rememberCooperation, validCooperationToken } from '../../services/cooperationContinuation';

export default function CreatorRegisterPage() {
  const [params] = useSearchParams(), navigate = useNavigate();
  const token = params.get('token') ?? '';
  const cooperationToken = params.get('cooperationToken');
  const valid = /^[A-Za-z0-9_-]{43}$/.test(token);
  const storageKey = 'im.creatorVerification.' + token;
  const [email, setEmail] = useState(() => sessionStorage.getItem(storageKey) ?? '');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const lock = useRef(false);
  const query = useCallback(() => authService.resolveCreatorInvitation(token), [token]);
  const resource = useAsyncResource(query, valid && !email);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  const login = () => {
    if (validCooperationToken(cooperationToken)) rememberCooperation(cooperationToken);
    navigate('/login', { state: { cooperationToken } });
  };
  const perform = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await action(); }
    catch (e) { setError(getErrorMessage(e, 'Không thực hiện được yêu cầu. Vui lòng thử lại.')); }
    finally { lock.current = false; setBusy(false); }
  };
  return <div style={{ width: '100%', maxWidth: 440, margin: '0 auto' }}>
    <h1>Tạo tài khoản Creator</h1>
    {error && <Alert type="error" title={error} style={{ marginBottom: 16 }} />}
    {!valid ? <Alert type="warning" title="Liên kết đăng ký không hợp lệ" description="Mở lại email đăng ký hoặc yêu cầu liên kết mới từ lời mời hợp tác." /> : email ? <>
      <p>Nhập mã xác minh đã gửi đến <strong>{email}</strong>.</p>
      <Form layout="vertical" onFinish={({ otp }) => void perform(async () => {
        await authService.verifyEmail(email, otp);
        sessionStorage.removeItem(storageKey); login();
      })}>
        <Form.Item name="otp" label="Mã xác minh" rules={[{ required: true, pattern: /^\d{6}$/, message: 'Nhập mã gồm 6 chữ số.' }]}><Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} /></Form.Item>
        <Button type="primary" htmlType="submit" block loading={busy}>Xác minh email</Button>
      </Form>
      <Button type="link" disabled={busy || cooldown > 0} onClick={() => void perform(async () => { await authService.resendVerification(email); setCooldown(60); })}>{cooldown ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã'}</Button>
    </> : resource.status === 'loading' ? <Skeleton active /> : resource.status === 'error' || !resource.data ? <Alert type="warning" title="Liên kết đã dùng, hết hạn hoặc chưa tải được" description="Nếu đã tạo tài khoản, hãy đăng nhập để tiếp tục. Nếu chưa, mở lại lời mời hợp tác và yêu cầu email đăng ký mới." action={<Button onClick={() => void resource.reload()}>Thử lại</Button>} /> : <>
      <p>Email: <strong>{resource.data.email}</strong></p>
      <Form layout="vertical" onFinish={values => void perform(async () => {
        const policies = await authService.getPolicies();
        await authService.registerCreator({ invitationToken: token, fullName: values.fullName.trim(), password: values.password,
          policyAcceptance: { acceptedTerms: values.agreement === true, acceptedPrivacy: values.agreement === true, ...policies } });
        sessionStorage.setItem(storageKey, resource.data!.email);
        if (validCooperationToken(cooperationToken)) rememberCooperation(cooperationToken);
        setEmail(resource.data!.email); setCooldown(60);
      })}>
        <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, whitespace: true, max: 150 }]}><Input autoComplete="name" maxLength={150} /></Form.Item>
        <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 8 }]}><Input.Password autoComplete="new-password" /></Form.Item>
        <Form.Item name="confirm" label="Nhập lại mật khẩu" dependencies={['password']} rules={[{ required: true }, ({ getFieldValue }) => ({ validator: (_, value) => value === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error('Mật khẩu chưa khớp.')) })]}><Input.Password autoComplete="new-password" /></Form.Item>
        <Form.Item name="agreement" valuePropName="checked" rules={[{ validator: (_, value) => value === true ? Promise.resolve() : Promise.reject(new Error('Vui lòng đồng ý các chính sách.')) }]}><Checkbox>Tôi đồng ý <Link to="/terms-of-service" target="_blank" rel="noopener noreferrer">Điều khoản</Link> và <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">Chính sách bảo mật</Link>.</Checkbox></Form.Item>
        <Button htmlType="submit" type="primary" block loading={busy}>Tạo tài khoản</Button>
      </Form>
    </>}
    <Button type="link" disabled={busy} onClick={login}>Đã có tài khoản? Đăng nhập</Button>
  </div>;
}
