import type { ThemeConfig } from 'antd';

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#5B5BF0',
    colorInfo: '#5B5BF0',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    borderRadius: 12,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    colorBgLayout: '#F5F6FA',
    colorBgContainer: '#FFFFFF',
    colorTextHeading: '#0F172A',
    colorText: '#334155',
    colorTextSecondary: '#64748B',
    colorBorder: '#EEF0F6',
    colorBorderSecondary: '#F1F5F9',
  },
  components: {
    Card: {
      colorBorderSecondary: '#EEF0F6',
      borderRadiusLG: 14,
      boxShadowTertiary: '0 2px 10px rgba(0, 0, 0, 0.02)',
    },
    Button: {
      borderRadius: 10,
      fontWeight: 600,
      colorPrimary: '#5B5BF0',
      colorPrimaryHover: '#4A4AE0',
    },
    Table: {
      borderRadius: 12,
      headerBg: '#FAFAFD',
      headerColor: '#64748B',
      rowHoverBg: '#F8FAFC',
    },
    Tag: {
      borderRadiusSM: 999,
      fontSizeSM: 11,
      lineHeightSM: 1.8,
    },
    Input: {
      borderRadius: 10,
      colorBgContainer: '#FFFFFF',
      colorBorder: '#E2E8F0',
    },
    Select: {
      borderRadius: 10,
    },
    Tabs: {
      inkBarColor: '#5B5BF0',
      itemSelectedColor: '#5B5BF0',
      itemHoverColor: '#4A4AE0',
    },
    Pagination: {
      borderRadius: 8,
    },
  },
};
