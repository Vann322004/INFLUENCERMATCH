import { useCallback, useRef, useState } from 'react';
import { Alert, App, Button, Form, Input, Modal } from 'antd';
import { authService } from '../../services/api/authService';
import { getAuthSessionId } from '../../services/apiClient';
import type { GoogleChallenge } from '../../types/api/auth.types';
import GoogleIdentityButton, { googleErrorMessage } from '../auth/GoogleIdentityButton';

export default function GoogleLinkModal({ onClose }: { onClose: () => void }) {
  const [form] = Form.useForm<{ password: string }>();
  const { message } = App.useApp();
  const [step, setStep] = useState<{ challenge: GoogleChallenge; sessionId: string }>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  const loadChallenge = useCallback(async () => {
    if (!step || getAuthSessionId() !== step.sessionId) throw new Error('Phiên đăng nhập đã thay đổi.');
    return step;
  }, [step]);

  async function start({ password }: { password: string }) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    const sessionId = getAuthSessionId();
    try {
      const challenge = await authService.startGoogleLink(password, sessionId);
      form.resetFields();
      setStep({ challenge, sessionId });
    } catch (cause) {
      setError(googleErrorMessage(cause, 'Chưa thể bắt đầu liên kết Google.'));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function confirm(challenge: GoogleChallenge, credential: string, sessionId: string) {
    if (!step || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await authService.confirmGoogleLink(challenge.sessionId, credential, sessionId);
      message.success('Đã liên kết tài khoản Google.');
      onClose();
    } catch (cause) {
      setError(googleErrorMessage(cause, 'Chưa thể liên kết Google. Vui lòng kiểm tra email.'));
      setStep(undefined);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <Modal open title="Liên kết tài khoản Google" onCancel={onClose}
    closable={!busy} keyboard={!busy} mask={{ closable: !busy }}
    footer={<Button disabled={busy} onClick={onClose}>Đóng</Button>}>
    {error && <Alert showIcon type="error" title={error} />}
    {step ? <>
      <p>Chọn tài khoản Google có cùng email với tài khoản Brand.</p>
      <GoogleIdentityButton linking start={loadChallenge} onCredential={confirm} disabled={busy} />
      <Button type="link" disabled={busy} onClick={() => setStep(undefined)}>Xác nhận lại mật khẩu</Button>
    </> : <Form layout="vertical" form={form} onFinish={start} disabled={busy}>
      <Form.Item name="password" label="Mật khẩu hiện tại"
        rules={[{ required: true, message: 'Nhập mật khẩu hiện tại.' }]}>
        <Input.Password autoComplete="current-password" maxLength={256} />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={busy}>Tiếp tục</Button>
    </Form>}
  </Modal>;
}
