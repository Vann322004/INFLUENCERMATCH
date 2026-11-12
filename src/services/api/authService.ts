import { apiClient, cookieAuthClient, setAuthSession, clearAuthSession, getStoredUser, getAccessToken, getAuthSessionId } from '../apiClient';
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
    await cookieAuthClient.get('/auth/csrf');
    if (getAuthSessionId() !== sessionId) throw new Error('Yêu cầu đăng nhập đã được thay thế.');
    const response = await apiClient.post<ApiResponse<LoginResponse>>(path, payload);
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
    const email = payload.email?.toLowerCase().trim();
    try {
      const response = await requestLogin('/auth/login', payload, sessionId);
      if (getAuthSessionId() !== sessionId) throw new Error('Yêu cầu đăng nhập đã được thay thế.');
      const loginData = (response.data as any)?.data ?? response.data;

      // Lưu session token và thông tin user
      setAuthSession(loginData.accessToken, loginData.refreshToken, loginData.user);

      return loginData;
    } catch (error) {
      if (getAuthSessionId() !== sessionId) throw error;
      // Demo fallback nếu tài khoản demo chưa có trên Backend Database
      if (email === 'manager@influencermatch.vn' && payload.password === 'manager123') {
        const mockUser: UserProfile = {
          id: 'usr_008',
          email: 'manager@influencermatch.vn',
          fullName: 'Nguyễn Hoàng Long',
          role: 'DATA_MANAGER',
          status: 'ACTIVE',
        };
        const mockData: LoginResponse = {
          accessToken: 'mock_manager_token_' + Date.now(),
          refreshToken: 'mock_manager_refresh_token',
          tokenType: 'Bearer',
          expiresIn: 86400,
          user: mockUser,
        };
        setAuthSession(mockData.accessToken, mockData.refreshToken, mockData.user);
        return mockData;
      }

      if (email === 'admin@influencermatch.vn' && payload.password === 'admin123') {
        const mockUser: UserProfile = {
          id: 'usr_001',
          email: 'admin@influencermatch.vn',
          fullName: 'Trần Minh Khoa',
          role: 'ADMIN',
          status: 'ACTIVE',
        };
        const mockData: LoginResponse = {
          accessToken: 'mock_admin_token_' + Date.now(),
          refreshToken: 'mock_admin_refresh_token',
          tokenType: 'Bearer',
          expiresIn: 86400,
          user: mockUser,
        };
        setAuthSession(mockData.accessToken, mockData.refreshToken, mockData.user);
        return mockData;
      }

      if (email === 'creator@influencermatch.vn' && payload.password === 'creator123') {
        const mockUser: UserProfile = {
          id: 'usr_creator_01',
          email: 'creator@influencermatch.vn',
          fullName: 'Châu Bùi (KOC / Creator)',
          role: 'CREATOR',
          status: 'ACTIVE',
        };
        const mockData: LoginResponse = {
          accessToken: 'mock_creator_token_' + Date.now(),
          refreshToken: 'mock_creator_refresh_token',
          tokenType: 'Bearer',
          expiresIn: 86400,
          user: mockUser,
        };
        setAuthSession(mockData.accessToken, mockData.refreshToken, mockData.user);
        return mockData;
      }

      throw error;
    }
  },

  /**
   * Đăng ký tài khoản người dùng mới
   */
  async register(payload: RegisterRequest): Promise<void> {
    await apiClient.post<ApiResponse<null>>('/auth/register', payload);
  },

  /**
   * Lấy thông tin chi tiết của người dùng hiện tại từ backend
   */
  async getMe(): Promise<UserProfileResponse> {
    const sessionId = getAuthSessionId();
    const stored = getStoredUser();
    if (getAccessToken()?.startsWith('mock_') && stored) {
      return stored as UserProfileResponse;
    }
    try {
      const response = await apiClient.get<ApiResponse<UserProfileResponse>>('/auth/me');
      const userProfile = response.data.data;
      if (getAuthSessionId() !== sessionId) throw new Error('Phiên đăng nhập đã thay đổi.');
      if (stored?.id && userProfile.id !== stored.id) throw new Error('Thông tin tài khoản không khớp phiên đăng nhập.');

      // Cập nhật lại thông tin user trong local storage nếu có thay đổi
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
        await cookieAuthClient.get('/auth/csrf');
        if (getAuthSessionId() !== loggedOutSessionId || hasRefreshCookieOwner()) return;
        await cookieAuthClient.post('/auth/logout');
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
    return this.isAdmin() || this.isManager();
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
