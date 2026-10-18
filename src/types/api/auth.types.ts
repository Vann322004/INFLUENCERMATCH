// Auth API Types based on OpenAPI specification

export type UserRole = 'ADMIN' | 'DATA_MANAGER' | 'BRAND' | 'CREATOR';
export type UserStatus = 'ACTIVE' | 'LOCKED' | 'DISABLED';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  permissions?: string[];
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}
