import React from 'react';
import { Navigate } from 'react-router-dom';
import { adminAuthService } from '../../services/api/adminAuthService';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import { authService } from '../../services/api/authService';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AdminProtectedRoute({ children, requireAdmin = false }: AdminProtectedRouteProps) {
  if (!adminAuthService.isAuthenticated()) {
    return <Navigate to={ADMIN_ROUTES.LOGIN} replace />;
  }
  if (requireAdmin && !authService.isAdmin()) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <>{children}</>;
}
