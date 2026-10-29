import { apiClient, setAuthSession, clearAuthSession, getStoredUser, getAccessToken } from '../apiClient';
import { ApiResponse } from '../../types/api/common.types';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserProfile,
  UserProfileResponse,
} from '../../types/api/auth.types';
import { clearBrandCache } from './campaignService';
import { brandService } from './brandService';

export const authService = {
  /**
   * Đăng nhập người dùng bằng email và mật khẩu
   */
  async login(payload: LoginRequest): Promise<LoginResponse> {
    clearAuthSession();
    clearBrandCache();
    brandService.clearBrandCache();
    const email = payload.email?.toLowerCase().trim();
    try {
      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', payload);
      const loginData = response.data.data;

      // Lưu session token và thông tin user
      setAuthSession(loginData.accessToken, loginData.refreshToken, loginData.user);

      return loginData;
    } catch (error) {
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
    const stored = getStoredUser();
    if (getAccessToken()?.startsWith('mock_') && stored) {
      return stored as UserProfileResponse;
    }
    try {
      const response = await apiClient.get<ApiResponse<UserProfileResponse>>('/auth/me');
      const userProfile = response.data.data;

      // Cập nhật lại thông tin user trong local storage nếu có thay đổi
      setAuthSession(getAccessToken() || '', undefined, { ...stored, ...userProfile });

      return userProfile;
    } catch (err) {
      if (stored) return stored as UserProfileResponse;
      throw err;
    }
  },

  /**
   * Đăng xuất người dùng
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Bỏ qua lỗi backend khi logout để đảm bảo client luôn được dọn dẹp
    } finally {
      clearAuthSession();
      clearBrandCache();
    }
  },

  /**
   * Lấy thông tin user hiện tại đang được lưu trong LocalStorage
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
