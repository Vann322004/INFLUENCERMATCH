import { useEffect, useRef, useState } from 'react';
import { Alert, Button } from 'antd';
import type { GoogleChallenge } from '../../types/api/auth.types';
import { getErrorMessage } from '../../services/apiClient';

type GoogleIdentity = {
  initialize(options: {
    client_id: string;
    nonce: string;
    ux_mode: 'popup';
    auto_select?: boolean;
    callback: (response: { credential?: string }) => void;
  }): void;
  disableAutoSelect?: () => void;
  prompt?: (momentListener?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
  renderButton(container: HTMLElement, options: {
    type: 'standard';
    theme: 'outline';
    size: 'large';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
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
    case 'IDENTITY_MISMATCH':
      return 'Hãy chọn tài khoản Google có cùng email với tài khoản Brand đang đăng nhập.';
    case 'GOOGLE_LOGIN_REPLAY':
      return 'Phiên Google đã được sử dụng. Vui lòng thử lại.';
    default:
      if (response?.status === 403 && String(response.data).trim() === 'Invalid CORS request') {
        return 'Máy chủ chưa cho phép địa chỉ trang web này sử dụng Google Login.';
      }
      return getErrorMessage(error, fallback);
  }
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
    <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
  </svg>
);

export default function GoogleIdentityButton({ start, onCredential, disabled, linking = false }: {
  start: (signal: AbortSignal) => Promise<{ challenge: GoogleChallenge; sessionId: string }>;
  onCredential: (challenge: GoogleChallenge, credential: string, sessionId: string) => void;
  disabled: boolean;
  linking?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const disabledRef = useRef(disabled);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [error, setError] = useState('');
  const activeController = useRef<AbortController | null>(null);
  const expiryTimer = useRef<number | undefined>(undefined);
  const resizeObserver = useRef<ResizeObserver | undefined>(undefined);

  useEffect(() => {
    callback.current = onCredential;
    disabledRef.current = disabled;
  }, [onCredential, disabled]);

  const cleanup = () => {
    activeController.current?.abort();
    activeController.current = null;
    resizeObserver.current?.disconnect();
    resizeObserver.current = undefined;
    window.clearTimeout(expiryTimer.current);
    expiryTimer.current = undefined;
    container.current?.replaceChildren();
  };

  useEffect(() => cleanup, []);

  const activateGoogle = async () => {
    if (disabledRef.current || phase === 'loading') return;
    cleanup();
    const element = container.current;
    if (!element) return;
    const controller = new AbortController();
    activeController.current = controller;
    let delivered = false;
    setError('');
    setPhase('loading');
    try {
      const [{ challenge, sessionId }, google] = await Promise.all([
        start(controller.signal),
        loadGoogleIdentity(),
      ]);
      if (controller.signal.aborted || !container.current) return;
      const remaining = Date.parse(challenge?.expiresAt) - Date.now();
      if (!challenge?.sessionId || !challenge.clientId || !challenge.nonce || !(remaining > 0)) {
        throw new Error('Phiên Google không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.');
      }
      google.disableAutoSelect?.();
      google.initialize({
        client_id: challenge.clientId,
        nonce: challenge.nonce,
        ux_mode: 'popup',
        auto_select: false,
        callback: ({ credential }) => {
          if (controller.signal.aborted || delivered || disabledRef.current || !credential) return;
          delivered = true;
          callback.current(challenge, credential, sessionId);
        },
      });
      let renderedWidth = 0;
      const renderButton = () => {
        const el = container.current;
        if (!el) return;
        const width = Math.min(400, Math.floor(el.clientWidth || 360));
        if (controller.signal.aborted || width <= 0 || width === renderedWidth) return;
        renderedWidth = width;
        el.replaceChildren();
        google.renderButton(el, {
          type: 'standard', theme: 'outline', size: 'large', shape: 'pill',
          text: linking ? 'continue_with' : 'signin_with', width, locale: 'vi',
        });
      };
      renderButton();
      resizeObserver.current = new ResizeObserver(renderButton);
      resizeObserver.current.observe(element);
      setPhase('ready');
      google.prompt?.();
      expiryTimer.current = window.setTimeout(() => {
        if (delivered) return;
        cleanup();
        setPhase('idle');
      }, remaining);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setPhase('idle');
        setError(googleErrorMessage(cause, 'Chưa thể kết nối với Google.'));
      }
    }
  };

  return <div className="google-identity-root">
    <div className="google-identity-control" aria-busy={phase === 'loading'} hidden={!!error}>
      <div ref={container} className="google-identity-slot" hidden={phase !== 'ready'} inert={disabled || phase !== 'ready'} />
      {phase !== 'ready' && (
        <button
          type="button"
          className="google-static-btn"
          disabled={disabled || phase === 'loading'}
          onClick={() => void activateGoogle()}
        >
          {phase === 'loading' ? (
            <>
              <span className="google-identity-spinner" aria-hidden="true" />
              Đang mở Google…
            </>
          ) : (
            <>
              <GoogleIcon />
              <span>{linking ? 'Tiếp tục với Google' : 'Đăng nhập với Google'}</span>
            </>
          )}
        </button>
      )}
    </div>
    {error && <Alert type="warning" showIcon title={error}
      action={<Button size="small" disabled={disabled} onClick={() => void activateGoogle()}>Thử lại</Button>} />}
  </div>;
}
