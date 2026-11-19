import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Checkbox, Form, Input, Modal } from 'antd';
import { authService } from '../../services/api/authService';
import type { GoogleRegistration, LoginResponse } from '../../types/api/auth.types';
import { googleErrorMessage } from './GoogleIdentityButton';

type Policies = Awaited<ReturnType<typeof authService.getPolicies>>;
type RegistrationFields = {
  fullName: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  accepted: boolean;
};

export default function GoogleRegistrationModal({ registration, sessionId, onClose, onSuccess }: {
  registration: GoogleRegistration;
  sessionId: string;
  onClose: () => void;
  onSuccess: (result: LoginResponse) => void;
}) {
  const [form] = Form.useForm<RegistrationFields>();
  const [policies, setPolicies] = useState<Policies>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [policyError, setPolicyError] = useState(false);
  const [reload, setReload] = useState(0);
  const [expired, setExpired] = useState(() => !(Date.parse(registration.expiresAt) > Date.now()));
  const pending = useRef(false);

  useEffect(() => {
    let active = true;
    setPolicyError(false);
    setPolicies(undefined);
    authService.getPolicies().then(result => {
      if (!active) return;
      if (result?.termsVersion && result?.privacyVersion) setPolicies(result);
      else setPolicyError(true);
    }).catch(() => { if (active) setPolicyError(true); });
    return () => { active = false; };
  }, [reload]);

  useEffect(() => {
    const timer = window.setTimeout(() => setExpired(true), Math.max(0, Date.parse(registration.expiresAt) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [registration.expiresAt]);

  async function save(values: RegistrationFields) {
    if (!policies || !values.accepted || pending.current || expired) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await authService.completeGoogleRegistration({
        sessionId: registration.sessionId,
        fullName: values.fullName.trim(),
        phoneNumber: values.phoneNumber.trim(),
        password: values.password,
        policyAcceptance: { ...policies, acceptedTerms: true, acceptedPrivacy: true },
      }, sessionId);
      if (result.status === 'AUTHENTICATED') onSuccess(result);
    } catch (cause) {
      const code = (cause as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code === 'POLICY_VERSION_CHANGED') {
        form.setFieldValue('accepted', false);
        setReload(value => value + 1);
        setError('Điều khoản hoặc chính sách đã thay đổi. Vui lòng xem và xác nhận lại.');
      } else if (code === 'EMAIL_ALREADY_EXISTS' || code === 'GOOGLE_LOGIN_REPLAY') {
        form.setFieldsValue({ password: '', confirmPassword: '' });
        setExpired(true);
        setError('Phiên đăng ký có thể đã hoàn tất. Hãy mở phiên Google mới để đăng nhập.');
      } else {
        setError(googleErrorMessage(cause, 'Chưa thể hoàn tất đăng ký Google.'));
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <Modal title="Hoàn tất đăng ký Brand" open onCancel={onClose}
    closable={!busy} keyboard={!busy} mask={{ closable: !busy }}
    cancelText={expired ? 'Thử lại bằng Google' : 'Hủy'} cancelButtonProps={{ disabled: busy }}
    okText="Tạo tài khoản" confirmLoading={busy}
    okButtonProps={{ disabled: !policies || expired }} onOk={() => form.submit()}>
    {expired && !error && <Alert type="warning" showIcon title="Phiên đăng ký đã hết hạn. Hãy chọn lại tài khoản Google." />}
    {error && <Alert type="error" showIcon title={error} />}
    {policyError && <Alert type="warning" showIcon title="Chưa tải được phiên bản điều khoản và chính sách."
      action={<Button size="small" onClick={() => setReload(value => value + 1)}>Tải lại</Button>} />}
    <Form form={form} layout="vertical" initialValues={{ fullName: registration.fullName }} onFinish={save}
      disabled={busy || expired}>
      <Form.Item label="Email Google" htmlFor="google-registration-email">
        <Input id="google-registration-email" value={registration.email} readOnly />
      </Form.Item>
      <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, whitespace: true, message: 'Nhập họ tên.' }]}>
        <Input maxLength={150} autoComplete="name" />
      </Form.Item>
      <Form.Item name="phoneNumber" label="Số điện thoại" rules={[{
        pattern: /^(0\d{9,10}|\+[1-9]\d{7,14})$/,
        required: true, transform: (value?: string) => value?.replace(/[\s().-]/g, ''),
        message: 'Nhập số Việt Nam bắt đầu bằng 0 hoặc số quốc tế bắt đầu bằng +.',
      }]}>
        <Input maxLength={30} autoComplete="tel" inputMode="tel" />
      </Form.Item>
      <Form.Item name="password" label="Mật khẩu" rules={[
        { required: true, whitespace: true, min: 8, message: 'Nhập mật khẩu có ít nhất 8 ký tự.' },
        { validator: (_, value) => !value || new TextEncoder().encode(value).length <= 72
          ? Promise.resolve()
          : Promise.reject(new Error('Mật khẩu không được vượt quá 72 byte UTF-8.')) },
      ]}>
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item name="confirmPassword" label="Xác nhận mật khẩu" dependencies={['password']} rules={[
        { required: true, message: 'Vui lòng xác nhận mật khẩu.' },
        ({ getFieldValue }) => ({
          validator: (_, value) => !value || value === getFieldValue('password')
            ? Promise.resolve()
            : Promise.reject(new Error('Mật khẩu xác nhận không khớp.')),
        }),
      ]}>
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item name="accepted" valuePropName="checked" rules={[{
        validator: (_, checked) => checked ? Promise.resolve() : Promise.reject(new Error('Bạn cần đồng ý trước khi tạo tài khoản.')),
      }]}>
        <Checkbox disabled={!policies}>Tôi đồng ý với Điều khoản dịch vụ và <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Chính sách bảo mật</a>.
          {policies && <> (Điều khoản {policies.termsVersion} · Bảo mật {policies.privacyVersion})</>}
        </Checkbox>
      </Form.Item>
    </Form>
  </Modal>;
}
