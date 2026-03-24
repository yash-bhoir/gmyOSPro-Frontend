export const Colors = {
  primary:       '#0A0A0A',
  accent:        '#6366F1',
  accentLight:   '#EEF2FF',
  success:       '#22C55E',
  successLight:  '#F0FDF4',
  warning:       '#F59E0B',
  warningLight:  '#FFFBEB',
  danger:        '#EF4444',
  dangerLight:   '#FEF2F2',
  background:    '#F8F8F7',
  surface:       '#FFFFFF',
  border:        'rgba(0,0,0,0.08)',
  textPrimary:   '#0A0A0A',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  textInverse:   '#FFFFFF',
} as const;

export type ColorKey = keyof typeof Colors;