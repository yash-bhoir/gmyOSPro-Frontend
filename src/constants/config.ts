const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'development';

export const Config = {
  API_URL:          process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.212:5000/api/v1',
  APP_ENV:          appEnv,
  isDev:            appEnv === 'development',
  TOKEN_KEY:         'gymos_access_token',
  REFRESH_TOKEN_KEY: 'gymos_refresh_token',
  USER_KEY:          'gymos_user',
} as const;
