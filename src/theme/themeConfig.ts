import type { ThemeConfig } from 'antd';

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#7C3AED',
    colorInfo: '#7C3AED',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    borderRadius: 12,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    colorBgLayout: '#F6F0FF',
    colorBgContainer: '#FFFFFF',
    colorTextHeading: '#1E1B4B',
    colorText: '#334155',
    colorTextSecondary: '#64748B',
    colorBorder: '#E9D5FF',
    colorBorderSecondary: '#F3E8FF',
  },
  components: {
    Card: {
      colorBorderSecondary: '#E9D5FF',
      borderRadiusLG: 20,
      boxShadowTertiary: '0 10px 28px rgba(109, 40, 217, 0.05)',
    },
    Button: {
      borderRadius: 12,
      fontWeight: 600,
      colorPrimary: '#7C3AED',
      colorPrimaryHover: '#6D28D9',
    },
    Table: {
      borderRadius: 14,
      headerBg: '#FAF5FF',
      headerColor: '#4C1D95',
      rowHoverBg: '#FDFBFF',
    },
    Tag: {
      borderRadiusSM: 999,
      fontSizeSM: 11,
      lineHeightSM: 1.8,
    },
    Input: {
      borderRadius: 10,
      colorBgContainer: '#FFFFFF',
      colorBorder: '#E9D5FF',
    },
    Select: {
      borderRadius: 10,
    },
    Tabs: {
      inkBarColor: '#7C3AED',
      itemSelectedColor: '#7C3AED',
      itemHoverColor: '#6D28D9',
    },
    Pagination: {
      borderRadius: 8,
    },
  },
};
