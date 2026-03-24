import api from './api';
import { storage } from '@/utils/storage';
import { Config } from '@/constants/config';
import type { AuthUser, LoginResponse, SendOtpResponse } from '@/types/auth.types';

export const authService = {
  async sendOtp(phone: string): Promise<SendOtpResponse> {
    const { data } = await api.post('/auth/otp/send', { phone });
    return data.data as SendOtpResponse;
  },

  async verifyOtp(
    phone: string,
    otp: string,
    fullName?: string
  ): Promise<LoginResponse> {
    const { data } = await api.post('/auth/otp/verify', {
      phone,
      otp,
      ...(fullName ? { fullName } : {}),
    });
    const result: LoginResponse = data.data;

    // Persist tokens and user
    await storage.set(Config.TOKEN_KEY, result.accessToken);
    await storage.set(Config.REFRESH_TOKEN_KEY, result.refreshToken);
    await storage.set(Config.USER_KEY, JSON.stringify(result.user));

    return result;
  },

  async getMe(): Promise<AuthUser> {
    const { data } = await api.get('/auth/me');
    return data.data as AuthUser;
  },

  async updateProfile(payload: {
    fullName?: string;
    email?: string;
    fcmToken?: string;
  }): Promise<AuthUser> {
    const { data } = await api.patch('/auth/me', payload);
    const updated: AuthUser = data.data;
    await storage.set(Config.USER_KEY, JSON.stringify(updated));
    return updated;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore logout API errors — clear local storage regardless
    }
    await storage.clearAll();
  },

  async getStoredUser(): Promise<AuthUser | null> {
    const raw = await storage.get(Config.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  async getStoredToken(): Promise<string | null> {
    return storage.get(Config.TOKEN_KEY);
  },
};
