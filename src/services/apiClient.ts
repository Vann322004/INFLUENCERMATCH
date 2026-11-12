import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiProblemDetails } from '../types/api/common.types';
import { getAccessToken, getStoredUser, getAuthSessionId, setAuthSession, clearAuthSession, ownsRefreshCookie, withAuthCookieLock, consumeAccountLogout } from './authSession';
export { STORAGE_KEYS, getAccessToken, getRefreshToken, getStoredUser, getAuthSessionId, setAuthSession, clearAuthSession } from './authSession';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const cookieAuthClient = axios.create({ baseURL: BASE_URL, timeout: 30000, withCredentials: true, withXSRFToken: true });
export const getCsrfRequestConfig = async () => {
  const { data } = await cookieAuthClient.get('/auth/csrf');
  const csrf = data?.data ?? data;
  if (typeof csrf?.token !== 'string' || typeof csrf?.headerName !== 'string') {
    throw new Error('Không lấy được mã xác thực phiên. Vui lòng thử lại.');
  }
  // Spring returns a masked CSRF token. Do not let Axios replace it with the
  // raw cookie value when constructing the request.
  return { headers: { [csrf.headerName]: csrf.token }, withXSRFToken: false };
};
type SessionRequest = InternalAxiosRequestConfig & { _retry?: boolean; _sessionId?: string };
const staleSession = () => new axios.CanceledError('Phiên đăng nhập đã thay đổi.');
const refreshes = new Map<string, Promise<string>>();

const refreshSession = (sessionId: string): Promise<string> => {
  const pending = refreshes.get(sessionId);
  if (pending) return pending;
  const user = getStoredUser();
  const expectedUserId = user?.id || user?.userId || user?.email;
  const promise = withAuthCookieLock(async () => {
    if (getAuthSessionId() !== sessionId) throw staleSession();
    // The refresh cookie is shared by the browser. Never use another tab's
    // cookie to replace this tab's identity.
    if (!ownsRefreshCookie()) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại tài khoản của tab này.');
    const csrfConfig = await getCsrfRequestConfig();
    if (getAuthSessionId() !== sessionId) throw staleSession();
    const { data } = await cookieAuthClient.post('/auth/refresh', undefined, csrfConfig);
    if (getAuthSessionId() !== sessionId) throw staleSession();
    const refreshed = data?.data ?? data;
    const refreshedId = refreshed.user?.id || refreshed.user?.userId || refreshed.user?.email;
    if (!refreshed.accessToken || !expectedUserId || refreshedId !== expectedUserId) {
      throw new Error('Phiên đăng nhập không khớp tài khoản hiện tại. Vui lòng đăng nhập lại.');
    }
    setAuthSession(refreshed.accessToken, refreshed.refreshToken, { ...user, ...refreshed.user });
    return refreshed.accessToken;
  }).catch(error => {
    if (getAuthSessionId() === sessionId) {
      clearAuthSession();
      window.location.assign('/login');
    }
    throw error;
  }).finally(() => { refreshes.delete(sessionId); });
  refreshes.set(sessionId, promise);
  return promise;
};

// ── Request Interceptor ──────────────────────────────
apiClient.interceptors.request.use(
  (config: SessionRequest) => {
    if (consumeAccountLogout()) {
      window.location.assign('/login');
      throw staleSession();
    }
    if (config._sessionId && config._sessionId !== getAuthSessionId()) throw staleSession();
    config._sessionId = getAuthSessionId();
    const token = getAccessToken();
    if (token && !token.startsWith('mock_') && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    if (consumeAccountLogout()) {
      window.location.assign('/login');
      throw staleSession();
    }
    const config = response.config as SessionRequest;
    if (config._sessionId !== getAuthSessionId()) throw staleSession();
    return response;
  },
  async (error: AxiosError<ApiProblemDetails>) => {
    const originalRequest = error.config as SessionRequest | undefined;
    if (originalRequest?._sessionId && originalRequest._sessionId !== getAuthSessionId()) throw staleSession();

    // Không xử lý refresh hoặc tự động logout nếu đang ở chế độ mock demo token
    const currentToken = getAccessToken();
    if (currentToken?.startsWith('mock_')) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized (Token expired)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Do not attempt refresh if the failed request was already login/refresh
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/logout') ||
        originalRequest.url?.includes('/auth/google/')
      ) {
        return Promise.reject(error);
      }

      if (!currentToken || !originalRequest._sessionId) return Promise.reject(error);
      originalRequest._retry = true;
      const token = await refreshSession(originalRequest._sessionId);
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);

// Helper function to extract friendly error message from API
export const getErrorMessage = (error: unknown, defaultMessage = 'Đã có lỗi xảy ra'): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiProblemDetails | undefined;
    if (data?.detail) return data.detail;
    if (data?.title) return data.title;
    if (typeof error.response?.data === 'string') return error.response.data;
  }
  if (error instanceof Error) return error.message;
  return defaultMessage;
};

export default apiClient;

