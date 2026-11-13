import React from 'react';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import NicheManagementPanel from './components/NicheManagementPanel';

export default function DataSourcesPage() {
  return (
    <ConfigProvider locale={viVN}>
      <div style={{ paddingBottom: 24 }}>
        <NicheManagementPanel />
      </div>
    </ConfigProvider>
  );
}
