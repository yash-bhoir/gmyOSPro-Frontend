import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppContext } from '@/store/AppContext';
import api from '@/services/api';

const fmt = (d?: string) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';
const fmtCurrency = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000  ? `₹${(n / 1000).toFixed(1)}K`
  : `₹${n}`;

const STATUS_COLORS: Record<string, string> = {
  active: '#22C55E', trial: '#F59E0B', suspended: '#EF4444', churned: '#6B7280',
};
const PLAN_COLORS: Record<string, string> = {
  starter: '#6366F1', growth: '#F59E0B', enterprise: '#22C55E',
};

export default function AdminGymDetail() {
  const { gymId } = useLocalSearchParams<{ gymId: string }>();
  const { setGym } = useAppContext();
  const [gym, setGymData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/gyms/${gymId}`)
      .then(({ data }) => setGymData(data.data))
      .finally(() => setLoading(false));
  }, [gymId]);

  const handleStatus = (status: string) => {
    Alert.alert('Confirm', `Set status to "${status}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', onPress: async () => {
          await api.patch(`/admin/gyms/${gymId}/status`, { status });
          const { data } = await api.get(`/admin/gyms/${gymId}`);
          setGymData(data.data);
        },
      },
    ]);
  };

  const handlePlan = (plan: string) => {
    Alert.alert('Confirm', `Change plan to "${plan}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', onPress: async () => {
          await api.patch(`/admin/gyms/${gymId}/plan`, { planTier: plan });
          const { data } = await api.get(`/admin/gyms/${gymId}`);
          setGymData(data.data);
        },
      },
    ]);
  };

  // ── Super admin manages this gym as staff ──
  const handleManageGym = () => {
    Alert.alert(
      'Manage Gym',
      `Switch to staff view for "${gym.name}"?\n\nYou will see the gym dashboard as if you were the owner.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch to Gym View',
          onPress: () => {
            // Load gym into context so staff screens work
            setGym({
              _id:             gym._id,
              name:            gym.name,
              slug:            gym.slug,
              city:            gym.city,
              phone:           gym.phone,
              address:         gym.address,
              planTier:        gym.planTier,
              planStatus:      gym.planStatus,
              isSetupComplete: gym.isSetupComplete,
              trialEndsAt:     gym.trialEndsAt,
            });
            router.replace('/(staff)/dashboard' as any);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (!gym) {
    return (
      <View style={s.loading}>
        <Text style={s.notFound}>Gym not found</Text>
      </View>
    );
  }

  const owner = gym.ownerId || {};

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Gym Detail</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* Gym card */}
        <View style={s.gymCard}>
          <View style={s.gymAvatar}>
            <Text style={s.gymAvatarText}>{gym.name?.charAt(0) || 'G'}</Text>
          </View>
          <Text style={s.gymName}>{gym.name}</Text>
          <Text style={s.gymCity}>{gym.city}</Text>
          <View style={s.badgeRow}>
            <View style={[s.badge, { backgroundColor: STATUS_COLORS[gym.planStatus] + '22' }]}>
              <Text style={[s.badgeText, { color: STATUS_COLORS[gym.planStatus] }]}>
                {gym.planStatus?.toUpperCase()}
              </Text>
            </View>
            <View style={[s.badge, { backgroundColor: PLAN_COLORS[gym.planTier] + '22' }]}>
              <Text style={[s.badgeText, { color: PLAN_COLORS[gym.planTier] }]}>
                {gym.planTier?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Manage gym button */}
        <TouchableOpacity style={s.manageBtn} onPress={handleManageGym}>
          <Text style={s.manageBtnText}>⚙️  Manage This Gym as Owner</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: 'Total Members',  value: gym.memberCount    ?? 0 },
            { label: 'Active Members', value: gym.activeMembers  ?? 0 },
            { label: 'Revenue',        value: fmtCurrency(gym.totalRevenue ?? 0), isStr: true },
          ].map(item => (
            <View key={item.label} style={s.statCard}>
              <Text style={s.statValue}>{item.value}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Owner info */}
        <Text style={s.sectionTitle}>Owner Details</Text>
        <View style={s.infoCard}>
          {[
            { label: 'Name',       value: owner.fullName },
            { label: 'Phone',      value: owner.phone },
            { label: 'Email',      value: owner.email || '—' },
            { label: 'Joined',     value: fmt(gym.createdAt) },
            { label: 'Trial ends', value: fmt(gym.trialEndsAt) },
            { label: 'Setup',      value: gym.isSetupComplete ? '✓ Complete' : '✗ Incomplete' },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={[s.infoRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }]}
            >
              <Text style={s.infoLabel}>{row.label}</Text>
              <Text style={s.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Change status */}
        <Text style={s.sectionTitle}>Change Status</Text>
        <View style={s.actionRow}>
          {['active', 'trial', 'suspended', 'churned'].map(st => (
            <TouchableOpacity
              key={st}
              style={[
                s.statusBtn,
                { borderColor: STATUS_COLORS[st] },
                gym.planStatus === st && { backgroundColor: STATUS_COLORS[st] + '22' },
              ]}
              onPress={() => handleStatus(st)}
            >
              <Text style={[s.statusBtnText, { color: STATUS_COLORS[st] }]}>
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Change plan */}
        <Text style={s.sectionTitle}>Change Plan</Text>
        <View style={s.actionRow}>
          {['starter', 'growth', 'enterprise'].map(p => (
            <TouchableOpacity
              key={p}
              style={[
                s.planBtn,
                { borderColor: PLAN_COLORS[p] },
                gym.planTier === p && { backgroundColor: PLAN_COLORS[p] + '22' },
              ]}
              onPress={() => handlePlan(p)}
            >
              <Text style={[s.planBtnText, { color: PLAN_COLORS[p] }]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#0A0A0A' },
  loading:       { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  notFound:      { color: '#fff', fontSize: 16 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  back:          { fontSize: 15, color: 'rgba(255,255,255,0.6)' },
  headerTitle:   { fontSize: 17, fontWeight: '700', color: '#fff' },
  scroll:        { padding: 16, paddingBottom: 40 },
  gymCard:       { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 24,
                   alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  gymAvatar:     { width: 72, height: 72, borderRadius: 20, backgroundColor: '#F59E0B',
                   alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  gymAvatarText: { fontSize: 32, fontWeight: '800', color: '#000' },
  gymName:       { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  gymCity:       { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 12 },
  badgeRow:      { flexDirection: 'row', gap: 8 },
  badge:         { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText:     { fontSize: 11, fontWeight: '700' },
  manageBtn:     { backgroundColor: '#F59E0B', borderRadius: 14, height: 52,
                   alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  manageBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:      { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14,
                   alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  statValue:     { fontSize: 18, fontWeight: '800', color: '#F59E0B', marginBottom: 4 },
  statLabel:     { fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  sectionTitle:  { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)',
                   textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 8 },
  infoCard:      { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, marginBottom: 16,
                   borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  infoRow:       { flexDirection: 'row', justifyContent: 'space-between',
                   paddingHorizontal: 16, paddingVertical: 12 },
  infoLabel:     { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  infoValue:     { fontSize: 13, fontWeight: '600', color: '#fff' },
  actionRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statusBtn:     { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5 },
  statusBtnText: { fontSize: 13, fontWeight: '700' },
  planBtn:       { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5 },
  planBtnText:   { fontSize: 13, fontWeight: '700' },
});