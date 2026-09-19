// Mock Auth Data & Helpers

export const MOCK_USER = {
  id: 'usr_thevan',
  name: 'Nguyễn Thế Văn',
  username: 'thevan',
  email: 'thevan@influencermatch.com',
  password: '123456',
  role: 'Brand Admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  brandName: 'INFLUENCERMATCH',
  unreadMessages: 3,
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
    const isUsernameMatch =
      input === MOCK_USER.username.toLowerCase() ||
      input === MOCK_USER.email.toLowerCase() ||
      input === 'admin' ||
      input === 'van' ||
      input === 'van@influencermatch.com';

    // Cho phép đăng nhập nếu trùng mật khẩu '123456' hoặc bất kỳ mật khẩu nào nếu là demo
    if (isUsernameMatch && (password === MOCK_USER.password || password === '123456' || password === 'admin')) {
      const sessionUser = { ...MOCK_USER };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      return { success: true, user: sessionUser };
    }

    // Nếu người dùng nhập tài khoản bất kỳ khác, vẫn có thể tạo user mock tương ứng nếu muốn
    if (input && password) {
      // Báo lỗi sai thông tin
      return {
        success: false,
        message: 'Tài khoản hoặc mật khẩu không chính xác! Hãy dùng: thevan@influencermatch.com / 123456'
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
