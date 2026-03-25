import { useColorScheme } from 'react-native';

const lightColors = {
  background:    '#F5F5F7',
  surface:       '#FFFFFF',
  surfaceSecond: '#F0F0F5',
  primary:       '#0A0A0A',
  textPrimary:   '#0A0A0A',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#E5E7EB',
  borderLight:   '#F3F4F6',
  accent:        '#6366F1',
  accentLight:   '#EEF2FF',
  success:       '#22C55E',
  successLight:  '#DCFCE7',
  warning:       '#F59E0B',
  warningLight:  '#FEF9C3',
  danger:        '#EF4444',
  dangerLight:   '#FEE2E2',
};

const darkColors = {
  background:    '#0A0A0A',
  surface:       '#1A1A1A',
  surfaceSecond: '#242424',
  primary:       '#F9FAFB',
  textPrimary:   '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted:     '#6B7280',
  border:        '#2A2A2A',
  borderLight:   '#222222',
  accent:        '#818CF8',
  accentLight:   '#1E1B4B',
  success:       '#4ADE80',
  successLight:  '#052E16',
  warning:       '#FCD34D',
  warningLight:  '#422006',
  danger:        '#F87171',
  dangerLight:   '#450A0A',
};

export type ThemeColors = typeof lightColors;

export const useTheme = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
  };
};