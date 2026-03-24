import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useToast } from '@/hooks/useToast';
import api from '@/services/api';

const GYM_ID = 'default';
const PLANS = [
  { id: '1', name: 'Monthly',   duration: '30 days',  price: '₹999' },
  { id: '2', name: 'Quarterly', duration: '90 days',  price: '₹2,499' },
  { id: '3', name: 'Half Year', duration: '180 days', price: '₹4,499' },
  { id: '4', name: 'Annual',    duration: '365 days', price: '₹7,999' },
];

export default function AddMemberScreen() {
  const toast = useToast();
  const [fullName, setFullName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [plan, setPlan]           = useState(PLANS[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [healthNotes, setHealthNotes] = useState('');
  const [emergency, setEmergency] = useState({ name: '', phone: '', relation: '' });
  const [isLoading, setIsLoading] = useState(false);

  const endDate = () => {
    const d = new Date(startDate);
    const days = parseInt(plan.duration);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) { toast.error('Name required'); return; }
    if (phone.length !== 10) { toast.error('Valid 10-digit phone required'); return; }

    setIsLoading(true);
    try {
      await api.post(`/gyms/${GYM_ID}/members`, {
        fullName, phone, email,
        planName: plan.name,
        planStartDate: startDate,
        planEndDate: endDate(),
        healthNotes,
        emergencyContact: emergency.name ? emergency : undefined,
      });
      toast.success('Member added successfully!');
      router.back();
    } catch (err: any) {
      toast.error('Failed', err?.response?.data?.message || 'Please try again');
    } finally { setIsLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Add Member</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Basic info */}
        <Text style={s.sectionTitle}>Basic Information</Text>
        <View style={s.card}>
          {[
            { label: 'Full Name *', value: fullName, setter: setFullName, placeholder: 'Yash Bhoir', keyboard: 'default' as any, cap: 'words' as any },
            { label: 'Phone Number *', value: phone, setter: setPhone, placeholder: '9876543210', keyboard: 'phone-pad' as any, cap: 'none' as any, maxLen: 10 },
            { label: 'Email (optional)', value: email, setter: setEmail, placeholder: 'yash@example.com', keyboard: 'email-address' as any, cap: 'none' as any },
          ].map((field) => (
            <View key={field.label} style={s.fieldBox}>
              <Text style={s.fieldLabel}>{field.label}</Text>
              <TextInput
                style={s.fieldInput}
                value={field.value}
                onChangeText={field.setter}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.textMuted}
                keyboardType={field.keyboard}
                autoCapitalize={field.cap}
                maxLength={field.maxLen}
              />
            </View>
          ))}
        </View>

        {/* Plan selection */}
        <Text style={s.sectionTitle}>Membership Plan</Text>
        <View style={s.plansGrid}>
          {PLANS.map((p) => (
            <TouchableOpacity key={p.id} style={[s.planCard, plan.id === p.id && s.planCardActive]} onPress={() => setPlan(p)}>
              <Text style={[s.planName, plan.id === p.id && s.planTextActive]}>{p.name}</Text>
              <Text style={[s.planDuration, plan.id === p.id && s.planTextActive]}>{p.duration}</Text>
              <Text style={[s.planPrice, plan.id === p.id && s.planTextActive]}>{p.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dates */}
        <Text style={s.sectionTitle}>Dates</Text>
        <View style={s.card}>
          <View style={s.fieldBox}>
            <Text style={s.fieldLabel}>Start Date</Text>
            <TextInput style={s.fieldInput} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
          </View>
          <View style={[s.fieldBox, { borderBottomWidth: 0 }]}>
            <Text style={s.fieldLabel}>End Date (auto)</Text>
            <Text style={s.fieldInputReadonly}>{endDate()}</Text>
          </View>
        </View>

        {/* Emergency contact */}
        <Text style={s.sectionTitle}>Emergency Contact (Optional)</Text>
        <View style={s.card}>
          {[
            { label: 'Name', key: 'name' as const, placeholder: 'Contact name' },
            { label: 'Phone', key: 'phone' as const, placeholder: '9876543210' },
            { label: 'Relation', key: 'relation' as const, placeholder: 'Father / Mother / Spouse' },
          ].map((f, i, arr) => (
            <View key={f.key} style={[s.fieldBox, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.fieldLabel}>{f.label}</Text>
              <TextInput style={s.fieldInput} value={emergency[f.key]}
                onChangeText={(v) => setEmergency(prev => ({ ...prev, [f.key]: v }))}
                placeholder={f.placeholder} placeholderTextColor={Colors.textMuted} />
            </View>
          ))}
        </View>

        {/* Health notes */}
        <Text style={s.sectionTitle}>Health Notes (Optional)</Text>
        <View style={s.card}>
          <TextInput style={[s.fieldInput, s.textarea]} value={healthNotes} onChangeText={setHealthNotes}
            placeholder="Any health conditions, injuries..." placeholderTextColor={Colors.textMuted}
            multiline numberOfLines={3} />
        </View>

        {/* Submit */}
        <TouchableOpacity style={[s.submitBtn, isLoading && s.submitBtnOff]} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" size="small" /> :
            <Text style={s.submitText}>Add Member</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.background },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 },
  backBtn:           {},
  backText:          { fontSize: 15, color: Colors.textSecondary },
  title:             { fontSize: 18, fontWeight: '700', color: Colors.primary },
  scroll:            { padding: 16, paddingBottom: 40 },
  sectionTitle:      { fontSize: 13, fontWeight: '700', color: Colors.textSecondary,
                       textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  card:              { backgroundColor: Colors.surface, borderRadius: 16, paddingHorizontal: 16,
                       borderWidth: 1, borderColor: Colors.border },
  fieldBox:          { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  fieldLabel:        { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  fieldInput:        { fontSize: 15, color: Colors.primary },
  fieldInputReadonly:{ fontSize: 15, color: Colors.textSecondary },
  textarea:          { minHeight: 70, paddingTop: 4, textAlignVertical: 'top' },
  plansGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  planCard:          { width: '47%', backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
                       borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  planCardActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  planName:          { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  planDuration:      { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
  planPrice:         { fontSize: 16, fontWeight: '700', color: Colors.accent },
  planTextActive:    { color: '#fff' },
  submitBtn:         { backgroundColor: Colors.primary, borderRadius: 14, height: 56,
                       alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  submitBtnOff:      { opacity: 0.5 },
  submitText:        { color: '#fff', fontSize: 16, fontWeight: '700' },
});