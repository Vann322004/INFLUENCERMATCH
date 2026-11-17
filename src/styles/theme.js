export const themeConfig = {
  token: {
    colorPrimary: '#2563EB',
    colorPrimaryHover: '#1D4ED8',
    colorLink: '#2563EB',
    colorLinkHover: '#1D4ED8',
    borderRadius: 12,
    fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    colorTextHeading: '#0F172A',
    colorTextBody: '#475569',
    colorBgContainer: '#ffffff',
  },
  components: {
    Button: {
      colorPrimary: '#2563EB',
      algorithm: true,
      fontWeight: 700,
      borderRadiusLG: 12,
      controlHeightLG: 46,
    },
    Input: {
      paddingBlockLG: 12,
      activeBorderColor: '#2563EB',
      hoverBorderColor: '#3B82F6',
      borderRadiusLG: 12,
      colorBgContainer: '#F8FAFC',
    },
    Card: {
      borderRadiusLG: 24,
    },
    Checkbox: {
      colorPrimary: '#2563EB',
    }
  },
};
