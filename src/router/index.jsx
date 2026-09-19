import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import DashboardLayout from '../components/layout/DashboardLayout';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import { ROUTES } from '../constants/routes';
import { authService } from '../mock/authData';

// Protected Route wrapper component
function ProtectedRoute({ children }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }
  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          authService.isAuthenticated() ? (
            <Navigate to={ROUTES.DASHBOARD} replace />
          ) : (
            <Navigate to={ROUTES.AUTH.LOGIN} replace />
          )
        }
      />

      {/* Auth Routes Wrapped in AuthLayout */}
      <Route
        path={ROUTES.AUTH.LOGIN}
        element={
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        }
      />
      <Route
        path={ROUTES.AUTH.REGISTER}
        element={
          <AuthLayout>
            <RegisterPage />
          </AuthLayout>
        }
      />
      <Route
        path={ROUTES.AUTH.FORGOT_PASSWORD}
        element={
          <AuthLayout>
            <ForgotPasswordPage />
          </AuthLayout>
        }
      />
      <Route
        path={ROUTES.AUTH.RESET_PASSWORD}
        element={
          <AuthLayout>
            <ResetPasswordPage />
          </AuthLayout>
        }
      />

      {/* Dashboard Route Wrapped in DashboardLayout */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
    </Routes>
  );
}
