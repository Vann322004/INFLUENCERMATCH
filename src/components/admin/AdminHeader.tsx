import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Button } from 'antd';
import { MenuOutlined, HomeOutlined, RightOutlined } from '@ant-design/icons';
import NotificationBell from '../layout/NotificationBell';
import { ADMIN_ROUTES, DATA_MANAGER_ROUTES } from '../../constants/adminRoutes';
import { authService } from '../../services/api/authService';

const { Header } = Layout;
interface AdminHeaderProps {
  title?: string;
  mobile?: boolean;
  menuOpen?: boolean;
  onOpenMenu?: () => void;
}

export default function AdminHeader({ title, mobile, menuOpen, onOpenMenu }: AdminHeaderProps) {
  const location = useLocation();
  const isManager = authService.isManager();

  // Dynamic Breadcrumb Computation matching Brand Header
  const getPageInfo = () => {
    const p = location.pathname;
    if (title) {
      return { current: title };
    }
    if (p.includes('/data-sources') || p.includes('/taxonomy')) {
      return { current: 'Quản lý lĩnh vực' };
    }
    if (p.includes('/jobs')) {
      return { current: 'Tiến trình thu thập & Săn KOC' };
    }
    if (p.includes('/data-quality')) {
      return { current: 'Kiểm định chất lượng KOC' };
    }
    if (p.includes('/scoring')) {
      return { current: 'Cấu hình gợi ý' };
    }
    if (p.includes('/creator-claims')) {
      return { current: 'Duyệt hồ sơ xác minh' };
    }
    if (p.includes('/creators')) {
      return { current: 'Danh mục Nhà sáng tạo' };
    }
    if (p.includes('/accounts')) {
      return { current: 'Tài khoản người dùng' };
    }
    if (p.includes('/subscriptions')) {
      return { current: 'Gói đăng ký dịch vụ' };
    }
    if (p.includes('/payments')) {
      return { current: 'Giao dịch & Thanh toán' };
    }
    if (p.includes('/audit')) {
      return { current: 'Nhật ký hoạt động' };
    }
    return { current: isManager ? 'Tổng quan vận hành dữ liệu' : 'Tổng quan hệ thống' };
  };

  const pageInfo = getPageInfo();

  return (
    <>
      <Header className="app-header">
        <div className="app-header-inner" style={{ maxWidth: '100%' }}>
          {mobile && <Button className="admin-menu-trigger" aria-label="Mở menu điều hướng" aria-expanded={menuOpen}
            aria-controls="admin-navigation" icon={<MenuOutlined />} onClick={onOpenMenu} />}
          {/* Left: Breadcrumbs matching Brand layout */}
          <nav className="header-breadcrumbs" aria-label="Đường dẫn">
            <Link
              className="header-bc-root"
              to={isManager ? DATA_MANAGER_ROUTES.DASHBOARD : ADMIN_ROUTES.DASHBOARD}
            >
              <HomeOutlined style={{ marginRight: 4, fontSize: 12 }} />
              Trang chủ
            </Link>
            <RightOutlined style={{ fontSize: 9, color: '#94A3B8' }} />

            <span className="header-bc-current" aria-current="page">{pageInfo.current}</span>
          </nav>

          {/* Right: Standalone Notification Action Bell */}
          <NotificationBell />
        </div>
      </Header>

    </>
  );
}
