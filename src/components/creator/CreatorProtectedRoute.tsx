import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/api/authService';

interface CreatorProtectedRouteProps {
  children: React.ReactNode;
}

export default function CreatorProtectedRoute({ children }: CreatorProtectedRouteProps) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Cho phép role CREATOR hoặc người quản lý đang test (Admin/Manager)
  const isAllowed = authService.isCreator() || authService.hasManagementAccess();
  if (!isAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
