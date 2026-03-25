import React, {
  createContext, useContext, useEffect,
  useState, useCallback,
} from 'react';
import { router } from 'expo-router';
import { authService } from '@/services/auth.service';
import type { AuthUser, AuthState, SendOtpResponse } from '@/types/auth.types';

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await authService.getStoredToken();
      if (token) {
        const storedUser = await authService.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        } else {
          const freshUser = await authService.getMe();
          setUser(freshUser);
        }
      }
    } catch {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = useCallback(async (phone: string): Promise<SendOtpResponse> => {
    return authService.sendOtp(phone);
  }, []);

  const login = useCallback(async (phone: string, otp: string, fullName?: string) => {
    const result = await authService.verifyOtp(phone, otp, fullName);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    // Redirect to login after clearing state
    router.replace('/(auth)/login');
  }, []);

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      sendOtp,
      login,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
};