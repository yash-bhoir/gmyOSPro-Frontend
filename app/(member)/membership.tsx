import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import api from '@/services/api';

interface Profile {
  memberCode: string; status: string; planName?: string;
  planStartDate?: string; planEndDate?: string;
  totalCheckIns: number; fitnessGoals?: string[];
  healthNotes?: string;
  userId: { fullName: string; phone: string; email?: string };
}

const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const daysLeft = (d?: string) => {
  if (!d) return 0;
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
};

export default function MembershipScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const { data } = await api.get('/me/member-profile');
      setProfile(data.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetch(); }, []);

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.accent} /></View></SafeAreaView>;

  const days = daysLeft(profile?.planEndDate);
  const pct  = Math.min(100, (days / 30) * 100);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} />}
      >
        <Text style={s.title}>Membership</Text>

        {profile ? (
          <>
            {/* Plan card */}
            <View style={s.planCard}>
              <Text style={s.planCardLabel}>CURRENT PLAN</Text>
              <Text style={s.planName}>{profile.planName || 'Standard Plan'}</Text>
              <View style={[s.badge, profile.status === 'active' ? s.badgeActive : s.badgeExpired]}>
                <Text style={s.badgeText}>{profile.status.toUpperCase()}</Text>
              </View>
              <View style={s.divider} />
              <View style={s.infoGrid}>
                {[
                  { label: 'Member Code', value: profile.memberCode },
                  { label: 'Start Date',  value: fmt(profile.planStartDate) },
                  { label: 'End Date',    value: fmt(profile.planEndDate) },
                  { label: 'Days Left',   value: `${days} days` },
                ].map((item) => (
                  <View key={item.label} style={s.infoItem}>
                    <Text style={s.infoLabel}>{item.label}</Text>
                    <Text style={s.infoValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
              <View style={s.progressBg}>
                <View style={[s.progressFill, { width: `${pct}%` as any,
                  backgroundColor: days <= 7 ? Colors.warning : Colors.success }]} />
              </View>
              <Text style={s.progressLabel}>{days} days remaining</Text>
            </View>

            {/* Stats */}
            <View style={s.statsRow}>
              <View style={s.statCard}>
                <Text style={s.statValue}>{profile.totalCheckIns}</Text>
                <Text style={s.statLabel}>Total Check-ins</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statValue}>{days}</Text>
                <Text style={s.statLabel}>Days Left</Text>
              </View>
            </View>

            {/* Fitness goals */}
            {profile.fitnessGoals && profile.fitnessGoals.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Fitness Goals</Text>
                <View style={s.goalsRow}>
                  {profile.fitnessGoals.map((g) => (
                    <View key={g} style={s.goalChip}><Text style={s.goalText}>{g}</Text></View>
                  ))}
                </View>
              </>
            )}

            {/* Health notes */}
            {profile.healthNotes && (
              <>
                <Text style={s.sectionTitle}>Health Notes</Text>
                <View style={s.notesCard}>
                  <Text style={s.notesText}>{profile.healthNotes}</Text>
                </View>
              </>
            )}
          </>
        ) : (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🏋️</Text>
            <Text style={s.emptyTitle}>No active membership</Text>
            <Text style={s.emptySub}>Contact your gym staff to get started</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.background },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:       { padding: 20, paddingBottom: 32 },
  title:        { fontSize: 24, fontWeight: '800', color: Colors.primary, marginBottom: 20 },
  planCard:     { backgroundColor: Colors.primary, borderRadius: 20, padding: 22, marginBottom: 16 },
  planCardLabel:{ fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, marginBottom: 6 },
  planName:     { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 10 },
  badge:        { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 16 },
  badgeActive:  { backgroundColor: 'rgba(34,197,94,0.2)' },
  badgeExpired: { backgroundColor: 'rgba(239,68,68,0.2)' },
  badgeText:    { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  divider:      { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 16 },
  infoGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 16 },
  infoItem:     { width: '45%' },
  infoLabel:    { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  infoValue:    { fontSize: 14, fontWeight: '600', color: '#fff' },
  progressBg:   { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, marginBottom: 6 },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel:{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  statsRow:     { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:     { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
                  alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statValue:    { fontSize: 26, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  statLabel:    { fontSize: 12, color: Colors.textSecondary },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 10 },
  goalsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  goalChip:     { backgroundColor: Colors.accentLight, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  goalText:     { fontSize: 13, color: Colors.accent, fontWeight: '600' },
  notesCard:    { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
  notesText:    { fontSize: 14, color: Colors.textPrimary, lineHeight: 22 },
  empty:        { alignItems: 'center', padding: 48 },
  emptyIcon:    { fontSize: 52, marginBottom: 16 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: Colors.primary, marginBottom: 6 },
  emptySub:     { fontSize: 14, color: Colors.textSecondary },
});