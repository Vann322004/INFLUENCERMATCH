import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import AppRouter from './router';
import { themeConfig } from './styles/theme';
import './index.css';

export default function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <AntdApp>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}
