import { apiClient, setAuthSession, clearAuthSession, getStoredUser, getAccessToken } from '../apiClient';
import { ApiResponse } from '../../types/api/common.types';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserProfile,
  UserProfileResponse,
} from '../../types/api/auth.types';

export const authService = {
  /**
   * Đăng nhập người dùng bằng email và mật khẩu
   */
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', payload);
    const loginData = response.data.data;

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

  /**
   * Lấy thông tin chi tiết của người dùng hiện tại từ backend
   */
  async getMe(): Promise<UserProfileResponse> {
    const response = await apiClient.get<ApiResponse<UserProfileResponse>>('/auth/me');
    const userProfile = response.data.data;

    // Cập nhật lại thông tin user trong local storage nếu có thay đổi
    const stored = getStoredUser();
    setAuthSession(getAccessToken() || '', undefined, { ...stored, ...userProfile });

    return userProfile;
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
   * Kiểm tra người dùng có quyền Admin / Super Admin / Data Manager hay không
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    const adminRoles = ['ADMIN', 'DATA_MANAGER', 'super_admin', 'admin'];
    return adminRoles.includes(user.role);
  },
};
