import { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '@/store/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Colors } from '@/constants/colors';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function OtpScreen() {
  const { phone, isNewUser } =
    useLocalSearchParams<{ phone: string; isNewUser: string }>();

  const [otp, setOtp]             = useState('');
  const [fullName, setFullName]   = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [isFocused, setIsFocused] = useState(false);

  const hiddenRef = useRef<TextInput>(null);
  const { login, sendOtp } = useAuthContext();
  const toast = useToast();
  const isNew = isNewUser === 'true';

  // Auto-focus on mount
  useEffect(() => {
    const t = setTimeout(() => hiddenRef.current?.focus(), 400);
    const interval = setInterval(
      () => setCountdown((c) => (c > 0 ? c - 1 : 0)),
      1000
    );
    return () => { clearTimeout(t); clearInterval(interval); };
  }, []);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otp.length === OTP_LENGTH && !isLoading) {
      Keyboard.dismiss();
      handleVerify();
    }
  }, [otp]);

  const handleVerify = useCallback(async () => {
    if (otp.length !== OTP_LENGTH) {
      hiddenRef.current?.focus();
      return;
    }
    if (isNew && !fullName.trim()) {
      toast.warning('Name required', 'Please enter your full name');
      return;
    }
    setIsLoading(true);
    try {
      await login(phone, otp, isNew ? fullName.trim() : undefined);
      toast.success('Welcome to GymOS!');
      router.replace('/');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0] ||
        'Invalid OTP. Please try again.';
      toast.error('Verification failed', msg);
      setOtp('');
      setTimeout(() => hiddenRef.current?.focus(), 300);
    } finally {
      setIsLoading(false);
    }
  }, [otp, fullName, isNew, phone, login, toast]);

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await sendOtp(phone);
      setCountdown(RESEND_SECONDS);
      setOtp('');
      toast.success('OTP resent successfully');
      setTimeout(() => hiddenRef.current?.focus(), 300);
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  const focusInput = () => hiddenRef.current?.focus();

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={s.container}>

          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <View style={s.backCircle}>
              <Text style={s.backArrow}>‹</Text>
            </View>
          </TouchableOpacity>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Verify your{'\n'}number</Text>
            <Text style={s.subtitle}>
              We sent a 6-digit code to{'\n'}
              <Text style={s.phone}>+91 {phone}</Text>
            </Text>
          </View>

          {/* Name field for new users */}
          {isNew && (
            <View style={s.nameBox}>
              <Text style={s.fieldLabel}>Your full name</Text>
              <TextInput
                style={s.nameInput}
                placeholder="Enter your name"
                placeholderTextColor={Colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={focusInput}
              />
            </View>
          )}

          {/* OTP Boxes */}
          <Text style={s.fieldLabel}>Enter OTP</Text>
          <TouchableOpacity
            activeOpacity={1}
            onPress={focusInput}
          >
            <View style={s.otpRow}>
              {Array(OTP_LENGTH).fill(0).map((_, i) => {
                const isActive  = isFocused && i === otp.length;
                const isFilled  = !!otp[i];
                return (
                  <View
                    key={i}
                    style={[
                      s.box,
                      isFilled  && s.boxFilled,
                      isActive  && s.boxActive,
                    ]}
                  >
                    {isFilled ? (
                      <View style={s.dot} />
                    ) : isActive ? (
                      <View style={s.cursor} />
                    ) : null}
                  </View>
                );
              })}
            </View>
          </TouchableOpacity>

          {/* Invisible input that captures keystrokes */}
          <TextInput
            ref={hiddenRef}
            style={s.hidden}
            value={otp}
            onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, OTP_LENGTH))}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            caretHidden
          />

          {/* Dev hint — only in development */}
          <View style={s.devBadge}>
            <Text style={s.devText}>Dev mode — OTP is </Text>
            <Text style={s.devCode}>123456</Text>
          </View>

          {/* Verify button */}
          <TouchableOpacity
            style={[s.btn, (otp.length !== OTP_LENGTH || isLoading) && s.btnDisabled]}
            onPress={handleVerify}
            disabled={otp.length !== OTP_LENGTH || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.btnText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={s.resendRow}>
            <Text style={s.resendLabel}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
              <Text style={[s.resendLink, countdown > 0 && s.resendDisabled]}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.background },
  flex:           { flex: 1 },
  container:      { flex: 1, paddingHorizontal: 24, paddingTop: 12 },

  backBtn:        { marginBottom: 32, alignSelf: 'flex-start' },
  backCircle:     {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow:      { fontSize: 26, color: Colors.primary, lineHeight: 30, marginTop: -2 },

  header:         { marginBottom: 36 },
  title:          {
    fontSize: 32, fontWeight: '800',
    color: Colors.primary, lineHeight: 40, marginBottom: 12,
  },
  subtitle:       { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  phone:          { color: Colors.primary, fontWeight: '700' },

  nameBox:        { marginBottom: 24 },
  fieldLabel:     {
    fontSize: 11, fontWeight: '700',
    color: Colors.textMuted, letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 10,
  },
  nameInput:      {
    backgroundColor: Colors.surface, borderRadius: 14,
    height: 54, paddingHorizontal: 16, fontSize: 16,
    color: Colors.primary, borderWidth: 1, borderColor: Colors.border,
  },

  otpRow:         {
    flexDirection: 'row', gap: 10,
    marginBottom: 8, justifyContent: 'space-between',
  },
  box:            {
    flex: 1, height: 60,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  boxFilled:      {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  boxActive:      {
    borderColor: Colors.primary,
    borderWidth: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  dot:            {
    width: 12, height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent,
  },
  cursor:         {
    width: 2, height: 24,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  hidden:         {
    position: 'absolute', opacity: 0,
    width: 1, height: 1, top: -999,
  },

  devBadge:       {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 6,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  devText:        { fontSize: 12, color: '#7B5800' },
  devCode:        { fontSize: 13, fontWeight: '800', color: '#7B5800', letterSpacing: 2 },

  btn:            {
    backgroundColor: Colors.primary,
    borderRadius: 14, height: 56,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled:    { opacity: 0.35, elevation: 0, shadowOpacity: 0 },
  btnText:        { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  resendRow:      {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginTop: 20,
  },
  resendLabel:    { fontSize: 14, color: Colors.textSecondary },
  resendLink:     { fontSize: 14, color: Colors.accent, fontWeight: '700' },
  resendDisabled: { color: Colors.textMuted },
});