import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy, hh:mm a');
};

export const timeAgo = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const daysRemaining = (endDate: string | Date): number => {
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const isPlanExpired = (endDate: string | Date): boolean => {
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return isBefore(end, new Date());
};

export const isPlanExpiringSoon = (endDate: string | Date, days = 7): boolean => {
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + days);
  return isAfter(end, new Date()) && isBefore(end, threshold);
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const maskPhone = (phone: string): string => {
  return phone.replace(/(\d{2})\d{6}(\d{2})/, '$1xxxxxx$2');
};
