import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Checkbox, Form, Input, Modal } from 'antd';
import { authService } from '../../services/api/authService';
import type { GoogleRegistration, LoginResponse } from '../../types/api/auth.types';
import { googleErrorMessage } from './GoogleIdentityButton';

type Policies = Awaited<ReturnType<typeof authService.getPolicies>>;
type RegistrationFields = { fullName: string; businessName: string; phoneNumber: string; accepted: boolean };

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
        businessName: values.businessName.trim(),
        phoneNumber: values.phoneNumber.trim(),
        policyAcceptance: { ...policies, acceptedTerms: true, acceptedPrivacy: true },
      }, sessionId);
      if (result.status === 'AUTHENTICATED') onSuccess(result);
    } catch (cause) {
      const code = (cause as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code === 'POLICY_VERSION_CHANGED') {
        form.setFieldValue('accepted', false);
        setReload(value => value + 1);
        setError('Điều khoản hoặc chính sách đã thay đổi. Vui lòng xem và xác nhận lại.');
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
    cancelText={expired ? 'Quay lại đăng nhập' : 'Hủy'} cancelButtonProps={{ disabled: busy }}
    okText="Tạo tài khoản" confirmLoading={busy}
    okButtonProps={{ disabled: !policies || expired }} onOk={() => form.submit()}>
    {expired && <Alert type="warning" showIcon title="Phiên đăng ký đã hết hạn. Hãy chọn lại tài khoản Google." />}
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
      <Form.Item name="businessName" label="Tên thương hiệu" rules={[{ required: true, whitespace: true, message: 'Nhập tên thương hiệu.' }]}>
        <Input maxLength={200} autoComplete="organization" />
      </Form.Item>
      <Form.Item name="phoneNumber" label="Số điện thoại" rules={[{
        pattern: /^(0\d{9,10}|\+[1-9]\d{7,14})$/,
        required: true, transform: (value?: string) => value?.replace(/[\s().-]/g, ''),
        message: 'Nhập số Việt Nam bắt đầu bằng 0 hoặc số quốc tế bắt đầu bằng +.',
      }]}>
        <Input maxLength={30} autoComplete="tel" inputMode="tel" />
      </Form.Item>
      <Form.Item name="accepted" valuePropName="checked" rules={[{
        validator: (_, checked) => checked ? Promise.resolve() : Promise.reject(new Error('Bạn cần đồng ý trước khi tạo tài khoản.')),
      }]}>
        <Checkbox disabled={!policies}>Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.
          {policies && <> (Điều khoản {policies.termsVersion} · Bảo mật {policies.privacyVersion})</>}
        </Checkbox>
      </Form.Item>
    </Form>
  </Modal>;
}
