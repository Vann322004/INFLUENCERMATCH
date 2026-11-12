import { apiClient, cookieAuthClient, getCsrfRequestConfig, setAuthSession, clearAuthSession, getStoredUser, getAccessToken, getAuthSessionId } from '../apiClient';
import { claimRefreshCookie, ownsRefreshCookie, hasRefreshCookieOwner, withAuthCookieLock, publishAccountLogout } from '../authSession';
import type { ApiResponse } from '../../types/api/common.types';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserProfile,
  UserProfileResponse,
} from '../../types/api/auth.types';
import { clearBrandCache } from './campaignService';
import { brandService } from './brandService';

async function requestLogin(path: string, payload: unknown, sessionId: string) {
  return withAuthCookieLock(async () => {
    if (getAuthSessionId() !== sessionId) throw new Error('Yêu cầu đăng nhập đã được thay thế.');
    const csrfConfig = await getCsrfRequestConfig();
    if (getAuthSessionId() !== sessionId) throw new Error('Yêu cầu đăng nhập đã được thay thế.');
    const response = await apiClient.post<ApiResponse<LoginResponse>>(path, payload, csrfConfig);
    if (getAuthSessionId() !== sessionId) throw new Error('Yêu cầu đăng nhập đã được thay thế.');
    claimRefreshCookie();
    return response;
  });
}

export const authService = {
  /**
   * Đăng nhập người dùng bằng email và mật khẩu
   */
  async login(payload: LoginRequest): Promise<LoginResponse> {
    clearAuthSession();
    clearBrandCache();
    brandService.clearBrandCache();
    const sessionId = getAuthSessionId();
    const response = await requestLogin('/auth/login', payload, sessionId);
    if (getAuthSessionId() !== sessionId) throw new Error('Yêu cầu đăng nhập đã được thay thế.');
    const loginData = (response.data as any)?.data ?? response.data;

    // Lưu session token và thông tin user
    setAuthSession(loginData.accessToken, loginData.refreshToken, loginData.user);

    return loginData;
  },

  /**
   * Đăng ký tài khoản người dùng mới
   */
  async register(payload: RegisterRequest): Promise<void> {
    await apiClient.post<ApiResponse<null>>('/auth/register', payload);
  },

  async getPolicies(): Promise<{ termsVersion: string; privacyVersion: string }> {
    const response = await apiClient.get('/auth/policies');
    return response.data.data;
  },

  async verifyEmail(email: string, otp: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { email, otp });
  },

  async resendVerification(email: string): Promise<void> {
    await apiClient.post('/auth/resend-verification', { email });
  },

  /**
   * Lấy thông tin chi tiết của người dùng hiện tại từ backend
   */
  async getMe(): Promise<UserProfileResponse> {
    const sessionId = getAuthSessionId();
    const stored = getStoredUser();
    try {
      const response = await apiClient.get<ApiResponse<UserProfileResponse>>('/auth/me');
      const userProfile = response.data.data;
      if (getAuthSessionId() !== sessionId) throw new Error('Phiên đăng nhập đã thay đổi.');
      if (stored?.id && userProfile.id !== stored.id) throw new Error('Thông tin tài khoản không khớp phiên đăng nhập.');

      // Cập nhật thông tin của phiên đăng nhập hiện tại.
      setAuthSession(getAccessToken() || '', undefined, { ...getStoredUser(), ...userProfile });

      return userProfile;
    } catch (err) {
      if (getAuthSessionId() !== sessionId) throw err;
      if (stored) return stored as UserProfileResponse;
      throw err;
    }
  },

  /**
   * Đổi mã Google OAuth code lấy token đăng nhập
   */
  async googleExchange(code: string): Promise<LoginResponse> {
    clearAuthSession();
    clearBrandCache();
    brandService.clearBrandCache();
    const sessionId = getAuthSessionId();
    const response = await requestLogin('/auth/google/exchange', {
      code,
    }, sessionId);
    if (getAuthSessionId() !== sessionId) throw new Error('Yêu cầu đăng nhập đã được thay thế.');
    const loginData = (response.data as any)?.data ?? response.data;
    setAuthSession(loginData.accessToken, loginData.refreshToken, loginData.user);
    return loginData;
  },

  /**
   * Đăng xuất người dùng
   */
  async logout(): Promise<void> {
    const revokeCookie = ownsRefreshCookie() && !getAccessToken()?.startsWith('mock_');
    publishAccountLogout();
    // Clear immediately, before navigation or any pending network response.
    clearAuthSession();
    clearBrandCache();
    brandService.clearBrandCache();
    const loggedOutSessionId = getAuthSessionId();
    if (!revokeCookie) return;
    try {
      await withAuthCookieLock(async () => {
        if (getAuthSessionId() !== loggedOutSessionId || hasRefreshCookieOwner()) return;
        const csrfConfig = await getCsrfRequestConfig();
        if (getAuthSessionId() !== loggedOutSessionId || hasRefreshCookieOwner()) return;
        await cookieAuthClient.post('/auth/logout', undefined, csrfConfig);
      });
    } catch {
      // Bỏ qua lỗi backend khi logout để đảm bảo client luôn được dọn dẹp
    }
  },

  /**
   * Lấy thông tin tài khoản của phiên đăng nhập trong tab hiện tại
   */
  getCurrentUser(): UserProfile | null {
    return getStoredUser() as UserProfile | null;
  },

  /**
   * Kiểm tra người dùng đã đăng nhập hay chưa
   */
  isAuthenticated(): boolean {
    return !!getAccessToken();
  },

  /**
   * Kiểm tra người dùng có quyền Admin / Super Admin (Quản trị viên toàn hệ thống)
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    const adminRoles = ['ADMIN', 'super_admin', 'admin'];
    return adminRoles.includes(user.role);
  },

  /**
   * Kiểm tra người dùng có quyền Manager / Data Manager (Quản lý nghiệp vụ & Creator)
   */
  isManager(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    const managerRoles = ['MANAGER', 'DATA_MANAGER', 'manager'];
    return managerRoles.includes(user.role);
  },

  /**
   * Kiểm tra người dùng có quyền truy cập vào khu vực quản trị/vận hành (Admin hoặc Manager)
   */
  hasManagementAccess(): boolean {
    return this.isAuthenticated() && (this.isAdmin() || this.isManager());
  },

  /**
   * Kiểm tra người dùng có vai trò là Creator / KOC / KOL
   */
  isCreator(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    const creatorRoles = ['CREATOR', 'creator', 'INFLUENCER', 'influencer'];
    return creatorRoles.includes(user.role);
  },
};
