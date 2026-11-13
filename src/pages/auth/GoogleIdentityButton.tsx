import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Spin } from 'antd';
import type { GoogleChallenge } from '../../types/api/auth.types';
import { getErrorMessage } from '../../services/apiClient';

type GoogleIdentity = {
  initialize(options: {
    client_id: string;
    nonce: string;
    ux_mode: 'popup';
    callback: (response: { credential?: string }) => void;
  }): void;
  renderButton(container: HTMLElement, options: {
    type: 'standard';
    theme: 'outline';
    size: 'large';
    text: 'signin_with' | 'continue_with';
    width: number;
    locale: 'vi';
  }): void;
};

function identity() {
  return (window as Window & { google?: { accounts?: { id?: GoogleIdentity } } }).google?.accounts?.id;
}

let scriptRequest: Promise<GoogleIdentity> | undefined;

function loadGoogleIdentity() {
  const available = identity();
  if (available) return Promise.resolve(available);
  scriptRequest ??= new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script');
    const fail = () => {
      script.remove();
      reject(new Error('Không tải được nút Google. Vui lòng thử lại.'));
    };
    const timeout = window.setTimeout(fail, 15000);
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      window.clearTimeout(timeout);
      const loaded = identity();
      if (loaded) resolve(loaded);
      else fail();
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      fail();
    };
    document.head.append(script);
  }).catch(error => {
    scriptRequest = undefined;
    throw error;
  });
  return scriptRequest;
}

export function googleErrorMessage(error: unknown, fallback: string) {
  const { response } = (error ?? {}) as { response?: { status?: number; data?: { code?: string } } };
  switch (response?.data?.code) {
    case 'GOOGLE_LOGIN_UNAVAILABLE':
      return 'Đăng nhập Google chưa được bật trên máy chủ.';
    case 'GOOGLE_ACCOUNT_LINK_REQUIRED':
      return 'Email này đã có tài khoản. Hãy đăng nhập bằng mật khẩu, rồi liên kết Google trong Hồ sơ thương hiệu.';
    case 'EMAIL_NOT_VERIFIED':
      return 'Hãy xác minh email của tài khoản hiện có trước khi liên kết Google.';
    case 'GOOGLE_LOGIN_REPLAY':
      return 'Phiên Google đã được sử dụng. Vui lòng thử lại.';
    default:
      if (response?.status === 403 && String(response.data).trim() === 'Invalid CORS request') {
        return 'Máy chủ chưa cho phép địa chỉ trang web này sử dụng Google Login.';
      }
      return getErrorMessage(error, fallback);
  }
}

export default function GoogleIdentityButton({ start, onCredential, disabled, linking = false }: {
  start: (signal: AbortSignal) => Promise<{ challenge: GoogleChallenge; sessionId: string }>;
  onCredential: (challenge: GoogleChallenge, credential: string, sessionId: string) => void;
  disabled: boolean;
  linking?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const disabledRef = useRef(disabled);
  const [retry, setRetry] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  callback.current = onCredential;
  disabledRef.current = disabled;

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const controller = new AbortController();
    let expiryTimer: number | undefined;
    let delivered = false;
    setError('');
    setReady(false);
    async function render() {
      try {
        const { challenge, sessionId } = await start(controller.signal);
        if (controller.signal.aborted) return;
        const google = await loadGoogleIdentity();
        if (controller.signal.aborted || !element) return;
        const remaining = Date.parse(challenge?.expiresAt) - Date.now();
        if (!challenge?.sessionId || !challenge.clientId || !challenge.nonce || !(remaining > 0)) {
          throw new Error('Phiên Google không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.');
        }
        google.initialize({
          client_id: challenge.clientId,
          nonce: challenge.nonce,
          ux_mode: 'popup',
          callback: ({ credential }) => {
            if (controller.signal.aborted || delivered || disabledRef.current || !credential) return;
            delivered = true;
            callback.current(challenge, credential, sessionId);
          },
        });
        const width = element.clientWidth;
        google.renderButton(element, {
          type: 'standard', theme: 'outline', size: 'large',
          text: linking ? 'continue_with' : 'signin_with',
          width: Math.min(400, Math.floor(width) || 240), locale: 'vi',
        });
        setReady(true);
        expiryTimer = window.setTimeout(() => {
          if (delivered) return;
          element.replaceChildren();
          setReady(false);
          setError('Phiên Google đã hết hạn. Vui lòng thử lại.');
        }, remaining);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(googleErrorMessage(cause, 'Chưa thể kết nối với Google.'));
        }
      }
    }
    void render();
    return () => {
      controller.abort();
      window.clearTimeout(expiryTimer);
      element.replaceChildren();
    };
  }, [start, linking, retry]);

  return <div>
    <div ref={container} inert={disabled || !ready} />
    {!ready && !error && <Spin size="small" aria-label="Đang tải đăng nhập Google" />}
    {error && <Alert type="warning" showIcon title={error}
      action={<Button size="small" disabled={disabled} onClick={() => setRetry(value => value + 1)}>Thử lại</Button>} />}
  </div>;
}
