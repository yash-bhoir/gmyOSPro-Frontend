import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isSecureAvailable = Platform.OS !== 'web';

export const storage = {
  async set(key: string, value: string): Promise<void> {
    try {
      if (isSecureAvailable) await SecureStore.setItemAsync(key, value);
      else await AsyncStorage.setItem(key, value);
    } catch (err) { console.error(`[Storage] set error "${key}":`, err); }
  },

  async get(key: string): Promise<string | null> {
    try {
      if (isSecureAvailable) return await SecureStore.getItemAsync(key);
      return await AsyncStorage.getItem(key);
    } catch (err) { console.error(`[Storage] get error "${key}":`, err); return null; }
  },

  async remove(key: string): Promise<void> {
    try {
      if (isSecureAvailable) await SecureStore.deleteItemAsync(key);
      else await AsyncStorage.removeItem(key);
    } catch (err) { console.error(`[Storage] remove error "${key}":`, err); }
  },

  async clearAll(): Promise<void> {
    const keys = ['gymos_access_token', 'gymos_refresh_token', 'gymos_user', 'gymos_gym'];
    await Promise.all(keys.map(k => this.remove(k)));
  },
};