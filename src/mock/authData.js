// Mock Auth Data & Helpers

export const MOCK_USER = {
  id: 'usr_thevan',
  name: 'Nguyễn Thế Văn',
  username: 'thevan',
  email: 'thevan@influencermatch.com',
  password: '123456',
  role: 'brand',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  brandName: 'INFLUENCERMATCH',
  unreadMessages: 3,
};

export const MOCK_ADMIN = {
  id: 'admin_001',
  name: 'Trần Minh Khoa',
  username: 'admin',
  email: 'admin@influencermatch.vn',
  password: 'admin123',
  role: 'super_admin',
  roleLabel: 'Super Admin',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  unreadMessages: 4,
};

const STORAGE_KEY = 'influencermatch_user';

export const authService = {
  // Lấy thông tin user hiện tại từ localStorage
  getCurrentUser: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  // Giả lập đăng nhập (kiểm tra username/email và password)
  login: (usernameOrEmail, password) => {
    const input = (usernameOrEmail || '').trim().toLowerCase();

    // ── Kiểm tra tài khoản Admin ──────────────────────
    const isAdminMatch =
      input === MOCK_ADMIN.email.toLowerCase() ||
      input === MOCK_ADMIN.username.toLowerCase() ||
      input === 'admin@influencermatch.vn';

    if (isAdminMatch && (password === MOCK_ADMIN.password || password === 'admin123')) {
      const sessionUser = { ...MOCK_ADMIN };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      return { success: true, user: sessionUser };
    }

    // ── Kiểm tra tài khoản Brand ──────────────────────
    const isUsernameMatch =
      input === MOCK_USER.username.toLowerCase() ||
      input === MOCK_USER.email.toLowerCase() ||
      input === 'admin' ||
      input === 'van' ||
      input === 'van@influencermatch.com';

    if (isUsernameMatch && (password === MOCK_USER.password || password === '123456' || password === 'admin')) {
      const sessionUser = { ...MOCK_USER };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      return { success: true, user: sessionUser };
    }

    if (input && password) {
      return {
        success: false,
        message: 'Tài khoản hoặc mật khẩu không chính xác! Brand: thevan@influencermatch.com / 123456 | Admin: admin@influencermatch.vn / admin123'
      };
    }

    return {
      success: false,
      message: 'Vui lòng điền đầy đủ tài khoản và mật khẩu.'
    };
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated: () => {
    return !!localStorage.getItem(STORAGE_KEY);
  }
};

