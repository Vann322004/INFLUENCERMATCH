import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiProblemDetails } from '../types/api/common.types';
import { invalidateDataManagerCacheForMutation, invalidateAdminCacheForMutation } from './requestCache';
import { getAccessToken, getStoredUser, getAuthSessionId, setAuthSession, clearAuthSession, ownsRefreshCookie, withAuthCookieLock, consumeAccountLogout, redirectToCurrentAccount } from './authSession';
export { STORAGE_KEYS, getAccessToken, getRefreshToken, getStoredUser, getAuthSessionId, setAuthSession, clearAuthSession } from './authSession';

function resolveApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (!envUrl) return '/api/v1';
  if (typeof window !== 'undefined' && /^https?:\/\//i.test(envUrl)) {
    try {
      const targetOrigin = new URL(envUrl).origin;
      if (window.location.origin !== targetOrigin) {
        return '/api/v1';
      }
    } catch {
      return '/api/v1';
    }
  }
  return envUrl;
}

const BASE_URL = resolveApiBaseUrl();

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
  const previousToken = getAccessToken();
  const user = getStoredUser();
  const expectedUserId = user?.id || user?.userId || user?.email;
  const promise = withAuthCookieLock(async () => {
    if (getAuthSessionId() !== sessionId) throw staleSession();
    // Another tab may have rotated the shared cookie while this one waited.
    if (consumeAccountLogout()) throw staleSession();
    if (getAccessToken() && getAccessToken() !== previousToken) return getAccessToken()!;
    // All tabs share the same session and serialize cookie rotation.
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
      redirectToCurrentAccount();
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
      redirectToCurrentAccount();
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
      redirectToCurrentAccount();
      throw staleSession();
    }
    const config = response.config as SessionRequest;
    if (config._sessionId !== getAuthSessionId()) throw staleSession();
    if ((response.data as { success?: boolean })?.success !== false) {
      invalidateDataManagerCacheForMutation(config.method, config.url);
      invalidateAdminCacheForMutation(config.method, config.url);
    }
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

