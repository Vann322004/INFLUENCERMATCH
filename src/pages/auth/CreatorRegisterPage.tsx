import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Button, Checkbox, Col, Form, Input, Row, Skeleton } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { getErrorMessage } from '../../services/apiClient';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { cooperationPath, pendingCooperation, rememberCooperation, validCooperationToken } from '../../services/cooperationContinuation';
import './RegisterPage.css';

const registrationContextKey = 'im.creatorRegistrationContext';
const validRegistrationToken = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
function readRegistrationContext(): { token: string; cooperationToken: string | null } | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(registrationContextKey) ?? 'null');
    return validRegistrationToken(value?.token) ? { token: value.token, cooperationToken: validCooperationToken(value.cooperationToken) ? value.cooperationToken : null } : null;
  } catch { return null; }
}

export default function CreatorRegisterPage() {
  const location = useLocation(), navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const incoming = params.get('token');
  const saved = readRegistrationContext();
  const token = incoming !== null ? incoming : saved?.token ?? '';
  const cooperationToken = incoming !== null ? params.get('cooperationToken') : saved?.cooperationToken ?? null;
  useLayoutEffect(() => {
    if (incoming === null || !validRegistrationToken(incoming)) return;
    const continuation = validCooperationToken(cooperationToken) ? cooperationToken : null;
    sessionStorage.setItem(registrationContextKey, JSON.stringify({ token: incoming, cooperationToken: continuation }));
    if (continuation) rememberCooperation(continuation);
    const clean = new URLSearchParams(location.search);
    clean.delete('token'); clean.delete('cooperationToken');
    navigate({ pathname: location.pathname, search: clean.toString(), hash: '' }, { replace: true });
  }, [incoming, cooperationToken, location.pathname, location.search, navigate]);
  return <CreatorRegistrationForm key={token} token={token} cooperationToken={cooperationToken} />;
}

function CreatorRegistrationForm({ token, cooperationToken }: { token: string; cooperationToken: string | null }) {
  const navigate = useNavigate();
  const valid = validRegistrationToken(token);
  const storageKey = 'im.creatorVerification.' + token;
  const [email, setEmail] = useState(() => sessionStorage.getItem(storageKey) ?? '');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const lock = useRef(false);
  const pendingPasswordRef = useRef('');
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
  return <div className="register-card-inner">
    <div className="register-heading-group">
      <h2 className="register-title">{email ? 'Xác minh email' : 'Đăng ký tài khoản Creator'}</h2>
      <p className="register-subtitle">{email ? 'Hoàn tất xác minh để tiếp tục lời mời hợp tác' : 'Dành cho nhà sáng tạo nhận lời mời hợp tác'}</p>
    </div>
    {error && <Alert type="error" title={error} style={{ marginBottom: 16 }} />}
    {!valid ? <Alert type="warning" title="Liên kết đăng ký không hợp lệ" description="Mở lại email đăng ký hoặc yêu cầu liên kết mới từ lời mời hợp tác." /> : email ? <>
      <p>Nhập mã xác minh đã gửi đến <strong>{email}</strong>.</p>
      <Form layout="vertical" requiredMark={false} size="large" disabled={busy} onFinish={({ otp }) => void perform(async () => {
        await authService.verifyEmail(email, otp);
        sessionStorage.removeItem(storageKey); sessionStorage.removeItem(registrationContextKey);
        const savedPassword = pendingPasswordRef.current;
        pendingPasswordRef.current = '';
        if (savedPassword) {
          try {
            await authService.login({ email, password: savedPassword });
            const invitation = validCooperationToken(cooperationToken) ? cooperationToken : pendingCooperation();
            if (invitation) rememberCooperation(invitation);
            navigate(invitation ? cooperationPath() : '/creator/dashboard', { replace: true });
            return;
          } catch {
            // Fallback to login page if auto-login fails
          }
        }
        login();
      })}>
        <Form.Item name="otp" label="Mã xác minh" rules={[{ required: true, pattern: /^\d{6}$/, message: 'Nhập mã gồm 6 chữ số.' }]}><Input className="luxe-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} /></Form.Item>
        <Button className="luxe-primary-btn" type="primary" htmlType="submit" block loading={busy}>Xác minh email <ArrowRightOutlined /></Button>
      </Form>
      <Button type="link" disabled={busy || cooldown > 0} onClick={() => void perform(async () => { await authService.resendVerification(email); setCooldown(60); })}>{cooldown ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã'}</Button>
    </> : resource.status === 'loading' ? <Skeleton active /> : resource.status === 'error' || !resource.data ? <Alert type="warning" title="Liên kết đã dùng, hết hạn hoặc chưa tải được" description="Nếu đã tạo tài khoản, hãy đăng nhập để tiếp tục. Nếu chưa, mở lại lời mời hợp tác và yêu cầu email đăng ký mới." action={<Button onClick={() => void resource.reload()}>Thử lại</Button>} /> : <>
      <Form layout="vertical" requiredMark={false} size="large" disabled={busy} onFinish={values => void perform(async () => {
        const policies = await authService.getPolicies();
        await authService.registerCreator({ invitationToken: token, fullName: values.fullName.trim(), password: values.password,
          policyAcceptance: { acceptedTerms: values.agreement === true, acceptedPrivacy: values.agreement === true, ...policies } });
        pendingPasswordRef.current = values.password || '';
        sessionStorage.setItem(storageKey, resource.data!.email);
        if (validCooperationToken(cooperationToken)) rememberCooperation(cooperationToken);
        setEmail(resource.data!.email); setCooldown(60);
      })}>
        <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ tên.' }, { max: 150, message: 'Tối đa 150 ký tự.' }]}><Input className="luxe-input" autoComplete="name" placeholder="VD: Nguyễn Văn A" maxLength={150} /></Form.Item>
        <Form.Item label="Email nhận lời mời"><Input className="luxe-input" value={resource.data.email} readOnly autoComplete="email" /></Form.Item>
        <Row gutter={[12, 0]}>
          <Col xs={24} sm={12}><Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu.' }, { min: 8, message: 'Tối thiểu 8 ký tự.' }]}><Input.Password className="luxe-input" autoComplete="new-password" placeholder="Mật khẩu (≥ 8 ký tự)" /></Form.Item></Col>
          <Col xs={24} sm={12}><Form.Item name="confirm" label="Xác nhận mật khẩu" dependencies={['password']} rules={[{ required: true, message: 'Vui lòng nhập lại mật khẩu.' }, ({ getFieldValue }) => ({ validator: (_, value) => !value || value === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error('Mật khẩu chưa khớp.')) })]}><Input.Password className="luxe-input" autoComplete="new-password" placeholder="Nhập lại mật khẩu" /></Form.Item></Col>
        </Row>
        <Form.Item name="agreement" valuePropName="checked" className="register-checkbox-item" rules={[{ validator: (_, value) => value === true ? Promise.resolve() : Promise.reject(new Error('Vui lòng đồng ý các chính sách.')) }]}><Checkbox className="luxe-checkbox">Tôi đồng ý với <Link className="register-legal-link" to="/terms-of-service" target="_blank" rel="noopener noreferrer">Điều khoản dịch vụ</Link> và <Link className="register-legal-link" to="/privacy-policy" target="_blank" rel="noopener noreferrer">Chính sách bảo mật</Link>.</Checkbox></Form.Item>
        <Form.Item style={{ marginBottom: 0 }}><Button className="luxe-primary-btn" htmlType="submit" type="primary" block loading={busy}>Tạo tài khoản {!busy && <ArrowRightOutlined />}</Button></Form.Item>
      </Form>
    </>}
    <div className="register-login-banner"><span className="prompt">Đã có tài khoản?</span><Link className="link" to="/login" state={{ cooperationToken }} onClick={event => { event.preventDefault(); if (!busy) login(); }}>Đăng nhập ngay <ArrowRightOutlined style={{ fontSize: 11, marginLeft: 4 }} /></Link></div>
  </div>;
}
