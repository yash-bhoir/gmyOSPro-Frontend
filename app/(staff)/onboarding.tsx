import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAppContext } from '@/store/AppContext';
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
  const [step, setStep]           = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [gymId, setGymId]         = useState('');
  const { setGym } = useAppContext();
  const toast = useToast();

  // Step 1 — Gym profile
  const [gymName, setGymName]     = useState('');
  const [gymPhone, setGymPhone]   = useState('');
  const [gymCity, setGymCity]     = useState('');
  const [gymAddress, setGymAddress] = useState('');

  // Step 2 — Plans
  const [plans, setPlans] = useState(DEFAULT_PLANS);

  const handleCreateGym = async () => {
    if (!gymName.trim()) { toast.error('Gym name is required'); return; }
    setIsLoading(true);
    try {
      const { data } = await api.post('/gyms', {
        name: gymName.trim(),
        phone: gymPhone,
        city: gymCity,
        address: gymAddress,
      });
      setGymId(data.data._id);
      setGym(data.data);
      setStep(1);
    } catch (err: any) {
      toast.error('Failed', err?.response?.data?.message || 'Please try again');
    } finally { setIsLoading(false); }
  };

  const handleSavePlans = async () => {
    setIsLoading(true);
    try {
      const activePlans = plans.filter(p => p.active && p.name && p.price);
      for (const p of activePlans) {
        await api.post(`/gyms/${gymId}/plans`, {
          name: p.name,
          durationDays: p.durationDays,
          price: parseInt(p.price),
        });
      }
      await api.post(`/gyms/${gymId}/setup-complete`);
      toast.success('Gym setup complete! 🎉');
      setStep(2);
    } catch (err: any) {
      toast.error('Failed to save plans');
    } finally { setIsLoading(false); }
  };

  const updatePlan = (index: number, field: string, value: any) => {
    setPlans(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Progress bar */}
        <View style={s.progressBar}>
          {STEPS.map((label, i) => (
            <View key={label} style={s.progressStep}>
              <View style={[s.progressDot, i <= step && s.progressDotActive, i < step && s.progressDotDone]}>
                <Text style={[s.progressNum, i <= step && s.progressNumActive]}>
                  {i < step ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={[s.progressLabel, i <= step && s.progressLabelActive]}>{label}</Text>
              {i < STEPS.length - 1 && <View style={[s.progressLine, i < step && s.progressLineDone]} />}
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── STEP 0: GYM PROFILE ── */}
          {step === 0 && (
            <View>
              <Text style={s.stepTitle}>Set up your gym</Text>
              <Text style={s.stepSub}>Enter your gym details to get started</Text>

              <View style={s.card}>
                {[
                  { label: 'Gym Name *', value: gymName, setter: setGymName, placeholder: 'Fitness First Mumbai', cap: 'words' as any },
                  { label: 'City *',     value: gymCity, setter: setGymCity, placeholder: 'Mumbai', cap: 'words' as any },
                  { label: 'Phone',      value: gymPhone, setter: setGymPhone, placeholder: '9876543210', cap: 'none' as any, keyboard: 'phone-pad' as any },
                  { label: 'Address',    value: gymAddress, setter: setGymAddress, placeholder: 'Shop 12, MG Road...', cap: 'sentences' as any },
                ].map((f, i, arr) => (
                  <View key={f.label} style={[s.field, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={s.fieldLabel}>{f.label}</Text>
                    <TextInput style={s.fieldInput} value={f.value} onChangeText={f.setter}
                      placeholder={f.placeholder} placeholderTextColor={Colors.textMuted}
                      autoCapitalize={f.cap} keyboardType={f.keyboard} />
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[s.btn, (!gymName.trim() || !gymCity.trim() || isLoading) && s.btnOff]}
                onPress={handleCreateGym}
                disabled={!gymName.trim() || !gymCity.trim() || isLoading}
              >
                {isLoading ? <ActivityIndicator color="#fff" size="small" /> :
                  <Text style={s.btnText}>Continue → Set up Plans</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 1: PLANS ── */}
          {step === 1 && (
            <View>
              <Text style={s.stepTitle}>Membership Plans</Text>
              <Text style={s.stepSub}>Set your pricing — you can change these anytime</Text>

              {plans.map((plan, i) => (
                <View key={plan.name} style={[s.planCard, !plan.active && s.planCardOff]}>
                  <View style={s.planHeader}>
                    <Text style={s.planName}>{plan.name}</Text>
                    <TouchableOpacity
                      style={[s.toggleBtn, plan.active && s.toggleBtnActive]}
                      onPress={() => updatePlan(i, 'active', !plan.active)}
                    >
                      <Text style={[s.toggleText, plan.active && s.toggleTextActive]}>
                        {plan.active ? 'Active' : 'Off'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {plan.active && (
                    <View style={s.planFields}>
                      <View style={s.planField}>
                        <Text style={s.planFieldLabel}>Duration</Text>
                        <Text style={s.planFieldValue}>{plan.durationDays} days</Text>
                      </View>
                      <View style={s.planField}>
                        <Text style={s.planFieldLabel}>Price (₹)</Text>
                        <TextInput
                          style={s.planPriceInput}
                          value={plan.price}
                          onChangeText={(v) => updatePlan(i, 'price', v.replace(/\D/g, ''))}
                          keyboardType="numeric"
                          placeholder="0"
                        />
                      </View>
                    </View>
                  )}
                </View>
              ))}

              <TouchableOpacity style={[s.btn, isLoading && s.btnOff]} onPress={handleSavePlans} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" size="small" /> :
                  <Text style={s.btnText}>Save Plans & Finish</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={s.skipBtn} onPress={async () => {
                await api.post(`/gyms/${gymId}/setup-complete`);
                setStep(2);
              }}>
                <Text style={s.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2: DONE ── */}
          {step === 2 && (
            <View style={s.doneScreen}>
              <Text style={s.doneEmoji}>🎉</Text>
              <Text style={s.doneTitle}>You're all set!</Text>
              <Text style={s.doneSub}>
                Your gym <Text style={s.doneGymName}>{gymName}</Text> is ready.{'\n'}
                Start adding members and managing your gym.
              </Text>
              <View style={s.doneTips}>
                {[
                  '✓ Gym profile created',
                  '✓ Membership plans configured',
                  '✓ Ready to add members',
                ].map(tip => (
                  <Text key={tip} style={s.doneTip}>{tip}</Text>
                ))}
              </View>
              <TouchableOpacity style={s.btn} onPress={() => router.replace('/(staff)/dashboard')}>
                <Text style={s.btnText}>Go to Dashboard →</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: Colors.background },
  flex:               { flex: 1 },
  progressBar:        { flexDirection: 'row', alignItems: 'flex-start', padding: 20, paddingBottom: 0, gap: 0 },
  progressStep:       { flex: 1, alignItems: 'center', flexDirection: 'column', position: 'relative' },
  progressDot:        { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.border,
                        alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  progressDotActive:  { backgroundColor: Colors.primary },
  progressDotDone:    { backgroundColor: Colors.success },
  progressNum:        { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  progressNumActive:  { color: '#fff' },
  progressLabel:      { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  progressLabelActive:{ color: Colors.primary, fontWeight: '600' },
  progressLine:       { position: 'absolute', top: 16, left: '50%', right: '-50%',
                        height: 2, backgroundColor: Colors.border, zIndex: -1 },
  progressLineDone:   { backgroundColor: Colors.success },
  scroll:             { padding: 20, paddingBottom: 40 },
  stepTitle:          { fontSize: 26, fontWeight: '800', color: Colors.primary, marginBottom: 6, marginTop: 20 },
  stepSub:            { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
  card:               { backgroundColor: Colors.surface, borderRadius: 16, paddingHorizontal: 16,
                        borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  field:              { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  fieldLabel:         { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  fieldInput:         { fontSize: 16, color: Colors.primary },
  planCard:           { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 10,
                        borderWidth: 1, borderColor: Colors.border },
  planCardOff:        { opacity: 0.5 },
  planHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planName:           { fontSize: 16, fontWeight: '700', color: Colors.primary },
  toggleBtn:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                        borderWidth: 1, borderColor: Colors.border },
  toggleBtnActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleText:         { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  toggleTextActive:   { color: '#fff' },
  planFields:         { flexDirection: 'row', gap: 14 },
  planField:          { flex: 1 },
  planFieldLabel:     { fontSize: 10, color: Colors.textMuted, fontWeight: '600', marginBottom: 4 },
  planFieldValue:     { fontSize: 14, color: Colors.textSecondary },
  planPriceInput:     { fontSize: 18, fontWeight: '700', color: Colors.primary,
                        borderBottomWidth: 1.5, borderBottomColor: Colors.accent, paddingBottom: 2 },
  btn:                { backgroundColor: Colors.primary, borderRadius: 14, height: 56,
                        alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  btnOff:             { opacity: 0.4 },
  btnText:            { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn:            { alignItems: 'center', paddingVertical: 12 },
  skipText:           { fontSize: 14, color: Colors.textSecondary },
  doneScreen:         { alignItems: 'center', paddingTop: 40 },
  doneEmoji:          { fontSize: 64, marginBottom: 20 },
  doneTitle:          { fontSize: 28, fontWeight: '800', color: Colors.primary, marginBottom: 10 },
  doneSub:            { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  doneGymName:        { color: Colors.primary, fontWeight: '700' },
  doneTips:           { width: '100%', backgroundColor: Colors.surface, borderRadius: 14, padding: 20,
                        borderWidth: 1, borderColor: Colors.border, marginBottom: 28, gap: 10 },
  doneTip:            { fontSize: 14, color: Colors.success, fontWeight: '500' },
});