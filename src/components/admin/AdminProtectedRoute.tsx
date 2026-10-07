import React from 'react';
import { Navigate } from 'react-router-dom';
import { adminAuthService } from '../../mock/adminData';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  if (!adminAuthService.isAuthenticated()) {
    return <Navigate to={ADMIN_ROUTES.LOGIN} replace />;
  }
  return <>{children}</>;
}
