export type UserRole = 'super_admin' | 'gym_owner' | 'staff' | 'member';

export interface AuthUser {
  id: string;
  phone: string;
  fullName: string;
  email?: string;
  photoUrl?: string;
  role: UserRole;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface SendOtpResponse {
  isNewUser: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (phone: string) => Promise<SendOtpResponse>;
  login: (phone: string, otp: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
}
