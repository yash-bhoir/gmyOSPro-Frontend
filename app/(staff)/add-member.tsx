import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAppContext } from '@/store/AppContext';
import { useToast } from '@/hooks/useToast';
import api from '@/services/api';

export default function AddMemberScreen() {
  const { colors } = useTheme();
  const { gymId } = useAppContext();   // ← real gymId from context
  const toast = useToast();
  const s = makeStyles(colors);

  const [fullName, setFullName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [plans, setPlans]         = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [healthNotes, setHealthNotes] = useState('');
  const [emergency, setEmergency] = useState({ name: '', phone: '', relation: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Load real plans from DB
  useEffect(() => {
    if (!gymId) return;
    api.get(`/gyms/${gymId}/plans`)
      .then(({ data }) => {
        const p = data.data || [];
        setPlans(p);
        if (p.length > 0) setSelectedPlan(p[0]);
      })
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoadingPlans(false));
  }, [gymId]);

  const endDate = () => {
    if (!selectedPlan) return '';
    const d = new Date(startDate);
    d.setDate(d.getDate() + selectedPlan.durationDays);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    if (!gymId) { toast.error('Gym not found', 'Please complete gym setup first'); return; }
    if (!fullName.trim()) { toast.error('Name required'); return; }
    if (phone.length !== 10) { toast.error('Valid 10-digit phone required'); return; }

    setIsLoading(true);
    try {
      await api.post(`/gyms/${gymId}/members`, {
        fullName,
        phone,
        email: email || undefined,
        planId:        selectedPlan?._id,
        planName:      selectedPlan?.name,
        planStartDate: startDate,
        planEndDate:   endDate() || undefined,
        healthNotes:   healthNotes || undefined,
        emergencyContact: emergency.name ? emergency : undefined,
      });
      toast.success('Member added successfully!');
      router.back();
    } catch (err: any) {
      toast.error('Failed', err?.response?.data?.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[s.back, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.primary }]}>Add Member</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic info */}
        <Text style={[s.sectionTitle, { color: colors.textMuted }]}>Basic Information</Text>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[
            { label: 'Full Name *',      value: fullName, setter: setFullName, placeholder: 'Rahul Sharma',   keyboard: 'default' as any, cap: 'words' as any },
            { label: 'Phone Number *',   value: phone,    setter: setPhone,    placeholder: '9876543210',     keyboard: 'phone-pad' as any, cap: 'none' as any, maxLen: 10 },
            { label: 'Email (optional)', value: email,    setter: setEmail,    placeholder: 'rahul@email.com',keyboard: 'email-address' as any, cap: 'none' as any },
          ].map((f, i, arr) => (
            <View key={f.label} style={[s.field, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{f.label}</Text>
              <TextInput
                style={[s.fieldInput, { color: colors.primary }]}
                value={f.value}
                onChangeText={f.setter}
                placeholder={f.placeholder}
                placeholderTextColor={colors.textMuted}
                keyboardType={f.keyboard}
                autoCapitalize={f.cap}
                maxLength={f.maxLen}
              />
            </View>
          ))}
        </View>

        {/* Plan selection */}
        <Text style={[s.sectionTitle, { color: colors.textMuted }]}>Membership Plan</Text>
        {loadingPlans ? (
          <ActivityIndicator color={colors.accent} />
        ) : plans.length === 0 ? (
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.noPlans, { color: colors.textSecondary }]}>
              No plans found. Go to Settings → Plans to create plans first.
            </Text>
          </View>
        ) : (
          <View style={s.plansGrid}>
            {plans.map((p) => (
              <TouchableOpacity
                key={p._id}
                style={[
                  s.planCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedPlan?._id === p._id && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
                onPress={() => setSelectedPlan(p)}
              >
                <Text style={[s.planName, selectedPlan?._id === p._id && { color: '#fff' }, { color: colors.primary }]}>
                  {p.name}
                </Text>
                <Text style={[s.planDuration, { color: selectedPlan?._id === p._id ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
                  {p.durationDays} days
                </Text>
                <Text style={[s.planPrice, { color: selectedPlan?._id === p._id ? '#fff' : colors.accent }]}>
                  ₹{p.price.toLocaleString('en-IN')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Dates */}
        <Text style={[s.sectionTitle, { color: colors.textMuted }]}>Dates</Text>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[s.field, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={[s.fieldLabel, { color: colors.textMuted }]}>Start Date</Text>
            <TextInput
              style={[s.fieldInput, { color: colors.primary }]}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={s.field}>
            <Text style={[s.fieldLabel, { color: colors.textMuted }]}>End Date (auto)</Text>
            <Text style={[s.fieldValue, { color: colors.textSecondary }]}>{endDate() || '—'}</Text>
          </View>
        </View>

        {/* Emergency contact */}
        <Text style={[s.sectionTitle, { color: colors.textMuted }]}>Emergency Contact (Optional)</Text>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[
            { label: 'Name',     key: 'name' as const,     placeholder: 'Contact name' },
            { label: 'Phone',    key: 'phone' as const,    placeholder: '9876543210' },
            { label: 'Relation', key: 'relation' as const, placeholder: 'Father / Mother / Spouse' },
          ].map((f, i, arr) => (
            <View key={f.key} style={[s.field, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{f.label}</Text>
              <TextInput
                style={[s.fieldInput, { color: colors.primary }]}
                value={emergency[f.key]}
                onChangeText={(v) => setEmergency(prev => ({ ...prev, [f.key]: v }))}
                placeholder={f.placeholder}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          ))}
        </View>

        {/* Health notes */}
        <Text style={[s.sectionTitle, { color: colors.textMuted }]}>Health Notes (Optional)</Text>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[s.textarea, { color: colors.primary }]}
            value={healthNotes}
            onChangeText={setHealthNotes}
            placeholder="Any health conditions, injuries..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, { backgroundColor: colors.accent }, isLoading && s.submitBtnOff]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.submitText}>Add Member</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  safe:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 },
  back:         { fontSize: 15 },
  title:        { fontSize: 18, fontWeight: '700' },
  scroll:       { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  card:         { borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, marginBottom: 4 },
  field:        { paddingVertical: 14 },
  fieldLabel:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  fieldInput:   { fontSize: 15 },
  fieldValue:   { fontSize: 15 },
  noPlans:      { fontSize: 14, padding: 16, textAlign: 'center' },
  textarea:     { minHeight: 70, paddingTop: 14, paddingBottom: 14, fontSize: 14, textAlignVertical: 'top' },
  plansGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  planCard:     { width: '47%', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5 },
  planName:     { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  planDuration: { fontSize: 11, marginBottom: 4 },
  planPrice:    { fontSize: 16, fontWeight: '700' },
  submitBtn:    { borderRadius: 14, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  submitBtnOff: { opacity: 0.5 },
  submitText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
});