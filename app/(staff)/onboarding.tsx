import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAppContext } from '@/store/AppContext';
import { useAuthContext } from '@/store/AuthContext';
import { useToast } from '@/hooks/useToast';
import api from '@/services/api';

const STEPS = ['Gym Profile', 'Membership Plans', 'Done'];

const DEFAULT_PLANS = [
  { name: 'Monthly',     durationDays: 30,  price: '999',  active: true },
  { name: 'Quarterly',   durationDays: 90,  price: '2499', active: true },
  { name: 'Half Yearly', durationDays: 180, price: '4499', active: true },
  { name: 'Annual',      durationDays: 365, price: '7999', active: true },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { user } = useAuthContext();
  const { gym, setGym } = useAppContext();
  const toast = useToast();
  const s = makeStyles(colors);

  // If gym already exists (admin-created, setup incomplete) start at plans step
  const initialStep = gym?._id ? 1 : 0;

  const [step, setStep]           = useState(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [gymId, setGymId]         = useState(gym?._id || '');
  const [gymName, setGymName]     = useState(gym?.name || '');
  const [gymPhone, setGymPhone]   = useState(gym?.phone || '');
  const [gymCity, setGymCity]     = useState(gym?.city || '');
  const [gymAddress, setGymAddress] = useState(gym?.address || '');
  const [plans, setPlans]         = useState(DEFAULT_PLANS);

  // If not a gym_owner role — redirect away immediately
  useEffect(() => {
    const role = user?.role || 'member';
    if (role === 'staff' || role === 'member') {
      router.replace('/(staff)/dashboard' as any);
    }
  }, [user]);

  const handleCreateGym = async () => {
    if (!gymName.trim()) { toast.error('Gym name is required'); return; }
    if (!gymCity.trim()) { toast.error('City is required'); return; }
    setIsLoading(true);
    try {
      const { data } = await api.post('/gyms', {
        name:    gymName.trim(),
        phone:   gymPhone,
        city:    gymCity.trim(),
        address: gymAddress,
      });
      setGymId(data.data._id);
      setGym(data.data);
      setStep(1);
    } catch (err: any) {
      toast.error('Failed', err?.response?.data?.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlans = async () => {
    setIsLoading(true);
    try {
      const activePlans = plans.filter(p => p.active && p.name && p.price);
      for (const p of activePlans) {
        await api.post(`/gyms/${gymId}/plans`, {
          name:         p.name,
          durationDays: p.durationDays,
          price:        parseInt(p.price),
        });
      }
      await api.post(`/gyms/${gymId}/setup-complete`);
      toast.success('Gym setup complete! 🎉');
      setStep(2);
    } catch {
      toast.error('Failed to save plans');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlan = (i: number, field: string, value: any) =>
    setPlans(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Progress */}
        <View style={s.progressBar}>
          {STEPS.map((label, i) => (
            <View key={label} style={s.progressStep}>
              <View style={[
                s.progressDot,
                { backgroundColor: i <= step ? colors.accent : colors.border },
                i < step && { backgroundColor: colors.success },
              ]}>
                <Text style={[s.progressNum, { color: i <= step ? '#fff' : colors.textMuted }]}>
                  {i < step ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={[s.progressLabel, { color: i <= step ? colors.accent : colors.textMuted }]}>
                {label}
              </Text>
              {i < STEPS.length - 1 && (
                <View style={[s.progressLine, { backgroundColor: i < step ? colors.success : colors.border }]} />
              )}
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* STEP 0: Gym Profile */}
          {step === 0 && (
            <View>
              <Text style={[s.stepTitle, { color: colors.primary }]}>Set up your gym</Text>
              <Text style={[s.stepSub, { color: colors.textSecondary }]}>Tell us about your gym to get started</Text>

              <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {[
                  { label: 'Gym Name *',  value: gymName,    setter: setGymName,    placeholder: 'Iron Body Fitness', cap: 'words' as any },
                  { label: 'City *',      value: gymCity,    setter: setGymCity,    placeholder: 'Mumbai',            cap: 'words' as any },
                  { label: 'Phone',       value: gymPhone,   setter: setGymPhone,   placeholder: '9876543210',        cap: 'none' as any,     keyboard: 'phone-pad' as any },
                  { label: 'Address',     value: gymAddress, setter: setGymAddress, placeholder: 'Shop 12, MG Road',  cap: 'sentences' as any },
                ].map((f, i, arr) => (
                  <View key={f.label} style={[s.field, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                    <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{f.label}</Text>
                    <TextInput
                      style={[s.fieldInput, { color: colors.primary }]}
                      value={f.value}
                      onChangeText={f.setter}
                      placeholder={f.placeholder}
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize={f.cap}
                      keyboardType={f.keyboard}
                    />
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[s.btn, { backgroundColor: colors.accent }, (!gymName.trim() || !gymCity.trim() || isLoading) && s.btnOff]}
                onPress={handleCreateGym}
                disabled={!gymName.trim() || !gymCity.trim() || isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.btnText}>Continue → Set up Plans</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 1: Plans */}
          {step === 1 && (
            <View>
              <Text style={[s.stepTitle, { color: colors.primary }]}>Membership Plans</Text>
              <Text style={[s.stepSub, { color: colors.textSecondary }]}>Set your pricing — you can change these anytime</Text>

              {plans.map((plan, i) => (
                <View key={plan.name} style={[s.planCard, { backgroundColor: colors.surface, borderColor: colors.border }, !plan.active && { opacity: 0.5 }]}>
                  <View style={s.planHeader}>
                    <Text style={[s.planName, { color: colors.primary }]}>{plan.name}</Text>
                    <TouchableOpacity
                      style={[s.toggleBtn, { borderColor: colors.border }, plan.active && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                      onPress={() => updatePlan(i, 'active', !plan.active)}
                    >
                      <Text style={[s.toggleText, { color: plan.active ? '#fff' : colors.textMuted }]}>
                        {plan.active ? 'Active' : 'Off'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {plan.active && (
                    <View style={s.planFields}>
                      <View style={s.planField}>
                        <Text style={[s.planFieldLabel, { color: colors.textMuted }]}>Duration</Text>
                        <Text style={[s.planFieldValue, { color: colors.textSecondary }]}>{plan.durationDays} days</Text>
                      </View>
                      <View style={s.planField}>
                        <Text style={[s.planFieldLabel, { color: colors.textMuted }]}>Price (₹)</Text>
                        <TextInput
                          style={[s.planPriceInput, { color: colors.primary, borderBottomColor: colors.accent }]}
                          value={plan.price}
                          onChangeText={(v) => updatePlan(i, 'price', v.replace(/\D/g, ''))}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                    </View>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={[s.btn, { backgroundColor: colors.accent }, isLoading && s.btnOff]}
                onPress={handleSavePlans}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.btnText}>Save Plans & Finish</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={s.skipBtn}
                onPress={async () => {
                  await api.post(`/gyms/${gymId}/setup-complete`);
                  setStep(2);
                }}
              >
                <Text style={[s.skipText, { color: colors.textSecondary }]}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Done */}
          {step === 2 && (
            <View style={s.doneScreen}>
              <Text style={s.doneEmoji}>🎉</Text>
              <Text style={[s.doneTitle, { color: colors.primary }]}>You're all set!</Text>
              <Text style={[s.doneSub, { color: colors.textSecondary }]}>
                Your gym <Text style={[s.doneGymName, { color: colors.primary }]}>{gymName}</Text> is ready.{'\n'}
                Start adding members and managing your gym.
              </Text>
              <View style={[s.trialBanner, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
                <Text style={[s.trialIcon]}>🎁</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.trialTitle, { color: colors.accent }]}>30-Day Free Trial Active</Text>
                  <Text style={[s.trialSub, { color: colors.textSecondary }]}>Enjoy full access to all features. No payment required during trial.</Text>
                </View>
              </View>
              <View style={[s.doneTips, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {['✓ Gym profile created', '✓ Membership plans configured', '✓ Ready to add members'].map(tip => (
                  <Text key={tip} style={[s.doneTip, { color: colors.success }]}>{tip}</Text>
                ))}
              </View>
              <TouchableOpacity
                style={[s.btn, { backgroundColor: colors.accent }]}
                onPress={() => router.replace('/(staff)/dashboard' as any)}
              >
                <Text style={s.btnText}>Go to Dashboard →</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  safe:           { flex: 1 },
  progressBar:    { flexDirection: 'row', alignItems: 'flex-start', padding: 20, paddingBottom: 0 },
  progressStep:   { flex: 1, alignItems: 'center', position: 'relative' },
  progressDot:    { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  progressNum:    { fontSize: 12, fontWeight: '700' },
  progressLabel:  { fontSize: 10, textAlign: 'center' },
  progressLine:   { position: 'absolute', top: 16, left: '50%', right: '-50%', height: 2, zIndex: -1 },
  scroll:         { padding: 20, paddingBottom: 40 },
  stepTitle:      { fontSize: 26, fontWeight: '800', marginBottom: 6, marginTop: 20 },
  stepSub:        { fontSize: 14, marginBottom: 24 },
  card:           { borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, marginBottom: 20 },
  field:          { paddingVertical: 14 },
  fieldLabel:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  fieldInput:     { fontSize: 16 },
  planCard:       { borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1 },
  planHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planName:       { fontSize: 16, fontWeight: '700' },
  toggleBtn:      { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  toggleText:     { fontSize: 12, fontWeight: '600' },
  planFields:     { flexDirection: 'row', gap: 14 },
  planField:      { flex: 1 },
  planFieldLabel: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
  planFieldValue: { fontSize: 14 },
  planPriceInput: { fontSize: 18, fontWeight: '700', borderBottomWidth: 1.5, paddingBottom: 2 },
  btn:            { borderRadius: 14, height: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  btnOff:         { opacity: 0.4 },
  btnText:        { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn:        { alignItems: 'center', paddingVertical: 12 },
  skipText:       { fontSize: 14 },
  doneScreen:     { alignItems: 'center', paddingTop: 40 },
  doneEmoji:      { fontSize: 64, marginBottom: 20 },
  doneTitle:      { fontSize: 28, fontWeight: '800', marginBottom: 10 },
  doneSub:        { fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  doneGymName:    { fontWeight: '700' },
  trialBanner:    { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 16 },
  trialIcon:      { fontSize: 28 },
  trialTitle:     { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  trialSub:       { fontSize: 12, lineHeight: 17 },
  doneTips:       { width: '100%', borderRadius: 14, padding: 20, borderWidth: 1, marginBottom: 28, gap: 10 },
  doneTip:        { fontSize: 14, fontWeight: '500' },
});