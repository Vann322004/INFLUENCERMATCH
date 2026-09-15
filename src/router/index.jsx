import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import { ROUTES } from '../constants/routes';

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={ROUTES.AUTH.LOGIN} replace />}
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

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
    </Routes>
  );
}
