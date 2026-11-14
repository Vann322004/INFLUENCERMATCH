// Auth API Types based on OpenAPI specification

export type UserRole = 'ADMIN' | 'MANAGER' | 'DATA_MANAGER' | 'BRAND' | 'CREATOR';
export type UserStatus = 'ACTIVE' | 'LOCKED' | 'DISABLED';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  permissions?: string[];
  onboardingStatus?: 'PENDING' | 'COMPLETED';
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
  businessName: string;
  phoneNumber: string;
  policyAcceptance: {
    acceptedTerms: boolean;
    termsVersion: string;
    acceptedPrivacy: boolean;
    privacyVersion: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface GoogleChallenge {
  sessionId: string;
  clientId: string;
  nonce: string;
  expiresAt: string;
}

export interface GoogleRegistration {
  status: 'REGISTRATION_REQUIRED';
  sessionId: string;
  email: string;
  fullName: string;
  expiresAt: string;
}

export type GoogleRegistrationRequest = Pick<RegisterRequest,
  'fullName' | 'businessName' | 'phoneNumber' | 'policyAcceptance'> & { sessionId: string };

export type GoogleLoginResult = GoogleRegistration | (LoginResponse & { status: 'AUTHENTICATED' });

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
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
