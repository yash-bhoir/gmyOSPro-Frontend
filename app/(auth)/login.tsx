import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useAuthContext } from '@/store/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Colors } from '@/constants/colors';
import api from '@/services/api';

// Static imports (this fixes the TS1323 error)
import { storage } from '@/utils/storage';
import { Config } from '@/constants/config';

const { height } = Dimensions.get('window');
type Tab = 'phone' | 'email';

export default function LoginScreen() {
  const [tab, setTab] = useState<Tab>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const { sendOtp, updateUser } = useAuthContext();
  const toast = useToast();

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      toast.error('Invalid number', 'Enter a valid 10-digit mobile number');
      return;
    }
    setIsLoading(true);
    try {
      const { isNewUser } = await sendOtp(phone);
      router.push({ pathname: '/(auth)/otp', params: { phone, isNewUser: String(isNewUser) } });
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.includes('@')) {
      toast.error('Invalid email');
      return;
    }
    if (password.length < 6) {
      toast.error('Password too short', 'Minimum 6 characters');
      return;
    }
    if (isRegister && !fullName.trim()) {
      toast.error('Name required');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isRegister ? '/auth/email/register' : '/auth/email/login';
      const payload = isRegister ? { email, password, fullName } : { email, password };

      const { data } = await api.post(endpoint, payload);

      await storage.set(Config.TOKEN_KEY, data.data.accessToken);
      await storage.set(Config.REFRESH_TOKEN_KEY, data.data.refreshToken);
      await storage.set(Config.USER_KEY, JSON.stringify(data.data.user));
      updateUser(data.data.user);

      toast.success(isRegister ? 'Account created!' : 'Welcome back!');
      router.replace('/');
    } catch (err: any) {
      toast.error('Failed', err?.response?.data?.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const f = (name: string) => ({
    onFocus: () => setFocused(name),
    onBlur: () => setFocused(null),
  });

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={s.brand}>
            <View style={s.logoBox}>
              <Text style={s.logoLetter}>G</Text>
            </View>
            <Text style={s.appName}>GymOS</Text>
            <Text style={s.tagline}>Your gym, fully managed</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>{isRegister ? 'Create account' : 'Welcome back'}</Text>
            <Text style={s.cardSub}>{isRegister ? 'Sign up to get started' : 'Sign in to continue'}</Text>

            {/* Tab switcher */}
            <View style={s.tabRow}>
              {(['phone', 'email'] as Tab[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[s.tabBtn, tab === t && s.tabActive]}
                  onPress={() => setTab(t)}
                >
                  <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                    {t === 'phone' ? '📱 Phone OTP' : '✉️ Email'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Phone tab */}
            {tab === 'phone' && (
              <>
                <Text style={s.label}>Mobile number</Text>
                <View style={[s.row, focused === 'phone' && s.rowFocused]}>
                  <View style={s.prefix}>
                    <Text style={s.flag}>🇮🇳</Text>
                    <Text style={s.prefixText}>+91</Text>
                  </View>
                  <View style={s.vline} />
                  <TextInput
                    style={s.input}
                    placeholder="98765 43210"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
                    returnKeyType="done"
                    onSubmitEditing={handleSendOTP}
                    editable={!isLoading}
                    {...f('phone')}
                  />
                  {phone.length > 0 && (
                    <TouchableOpacity onPress={() => setPhone('')} style={s.clear}>
                      <Text style={s.clearText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[s.btn, (phone.length !== 10 || isLoading) && s.btnOff]}
                  onPress={handleSendOTP}
                  disabled={phone.length !== 10 || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={s.btnInner}>
                      <Text style={s.btnText}>Send OTP</Text>
                      <Text style={s.btnArrow}>→</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Email tab */}
            {tab === 'email' && (
              <>
                {isRegister && (
                  <>
                    <Text style={s.label}>Full name</Text>
                    <View style={[s.rowSimple, focused === 'name' && s.rowFocused]}>
                      <TextInput
                        style={s.inputSimple}
                        placeholder="Yash Bhoir"
                        placeholderTextColor={Colors.textMuted}
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        {...f('name')}
                      />
                    </View>
                  </>
                )}

                <Text style={[s.label, { marginTop: isRegister ? 14 : 0 }]}>Email address</Text>
                <View style={[s.rowSimple, focused === 'email' && s.rowFocused]}>
                  <TextInput
                    style={s.inputSimple}
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    {...f('email')}
                  />
                </View>

                <Text style={[s.label, { marginTop: 14 }]}>Password</Text>
                <View style={[s.rowSimple, focused === 'pass' && s.rowFocused]}>
                  <TextInput
                    style={s.inputSimple}
                    placeholder="Enter password"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPass}
                    value={password}
                    onChangeText={setPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleEmailLogin}
                    {...f('pass')}
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.clear}>
                    <Text style={s.clearText}>{showPass ? '🙈' : '👁'}</Text>
                  </TouchableOpacity>
                </View>

                {!isRegister && (
                  <TouchableOpacity style={s.forgotBtn}>
                    <Text style={s.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[s.btn, (!email || !password || isLoading) && s.btnOff]}
                  onPress={handleEmailLogin}
                  disabled={!email || !password || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={s.btnInner}>
                      <Text style={s.btnText}>{isRegister ? 'Create Account' : 'Sign In'}</Text>
                      <Text style={s.btnArrow}>→</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={s.switchBtn} onPress={() => setIsRegister(!isRegister)}>
                  <Text style={s.switchText}>
                    {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                    <Text style={s.switchLink}>{isRegister ? 'Sign In' : 'Sign Up'}</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Divider */}
            <View style={s.orRow}>
              <View style={s.orLine} />
              <Text style={s.orText}>or</Text>
              <View style={s.orLine} />
            </View>

            {/* Google button */}
            <TouchableOpacity
              style={s.googleBtn}
              onPress={() =>
                toast.info('Google Sign In', 'Connect your Google account in Settings after logging in')
              }
            >
              <View style={s.googleIcon}>
                <Text style={s.googleLetter}>G</Text>
              </View>
              <Text style={s.googleText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.disclaimer}>
            By continuing you agree to our <Text style={s.link}>Terms</Text> and{' '}
            <Text style={s.link}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    minHeight: height * 0.9,
  },
  brand: { alignItems: 'center', marginBottom: 28 },
  logoBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  logoLetter: { fontSize: 34, fontWeight: '800', color: '#fff' },
  appName: { fontSize: 26, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  cardSub: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    height: 56,
    marginBottom: 20,
  },
  rowSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  rowFocused: { borderColor: Colors.primary },
  prefix: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6 },
  flag: { fontSize: 18 },
  prefixText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  vline: { width: 1, height: 24, backgroundColor: Colors.border, marginRight: 12 },
  input: { flex: 1, fontSize: 18, color: Colors.primary, letterSpacing: 1.5 },
  inputSimple: { flex: 1, fontSize: 15, color: Colors.primary },
  clear: { padding: 12 },
  clearText: { fontSize: 13, color: Colors.textMuted },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 18 },
  forgotText: { fontSize: 13, color: Colors.accent, fontWeight: '600' },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  btnOff: { opacity: 0.35, elevation: 0, shadowOpacity: 0 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  btnArrow: { color: '#fff', fontSize: 18 },
  switchBtn: { marginTop: 16, alignItems: 'center' },
  switchText: { fontSize: 13, color: Colors.textSecondary },
  switchLink: { color: Colors.accent, fontWeight: '700' },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  orText: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  googleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLetter: { fontSize: 15, fontWeight: '800', color: '#fff' },
  googleText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  disclaimer: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  link: { color: Colors.accent, fontWeight: '600' },
});