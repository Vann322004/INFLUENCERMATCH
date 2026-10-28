import { authService } from './authService';

export const adminAuthService = {
  login: async (email: string, password: string) => {
    try {
      const loginData = await authService.login({ email, password });
      if (!authService.hasManagementAccess()) {
        authService.logout();
        return {
          success: false,
          message: 'Tài khoản không có quyền truy cập trang quản trị (chỉ dành cho ADMIN hoặc DATA_MANAGER).',
        };
      }
      return { success: true, user: loginData.user };
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Sai email/mật khẩu hoặc tài khoản chưa được cấp quyền quản trị.';
      return { success: false, message: msg };
    }
  },

  logout: () => {
    authService.logout();
  },

  isAuthenticated: () => {
    return authService.hasManagementAccess();
  },

  getCurrentUser: () => {
    return authService.getCurrentUser();
  },
};
