import Constants from 'expo-constants';

export const Config = {
  API_URL: (Constants.expoConfig?.extra?.apiUrl as string) || 'http://192.168.0.106:5000/api/v1',
  APP_ENV: (Constants.expoConfig?.extra?.appEnv as string) || 'development',
  isDev:   true,
  TOKEN_KEY:         'gymos_access_token',
  REFRESH_TOKEN_KEY: 'gymos_refresh_token',
  USER_KEY:          'gymos_user',
} as const;