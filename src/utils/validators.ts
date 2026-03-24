import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

export const otpSchema = z
  .string()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d+$/, 'OTP must contain only numbers');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name is too long');

export const emailSchema = z
  .string()
  .email('Enter a valid email address')
  .optional()
  .or(z.literal(''));

export const loginSchema = z.object({
  phone: phoneSchema,
});

export const otpVerifySchema = z.object({
  otp: otpSchema,
  fullName: nameSchema.optional(),
});

export const profileSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
});
