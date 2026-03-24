import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuthContext } from '@/store/AuthContext';
import { useAppContext } from '@/store/AppContext';
import api from '@/services/api';

interface Stats {
  totalActive: number; totalExpired: number; totalFrozen: number;
  checkInsToday: number; checkInsMonth: number;
  expiringThisWeek: number; totalMembers: number;
}

export default function StaffDashboard() {
  const { user } = useAuthContext();
  const { gym, gymId, refreshGym } = useAppContext();
  const [stats, setStats]       = useState<Stats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    if (!gymId) { setLoading(false); return; }
    try {
      const { data } = await api.get(`/gyms/${gymId}/dashboard`);
      setStats(data.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchStats(); }, [gymId]);

  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.accent} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); refreshGym(); }} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.gymName}>{gym?.name || 'My Gym'}</Text>
            <Text style={s.greet}>{greet}, {user?.fullName?.split(' ')[0]} 👋</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => router.push('/(staff)/add-member')}>
            <Text style={s.addBtnText}>+ Member</Text>
          </TouchableOpacity>
        </View>

        {/* Trial banner */}
        {gym?.planStatus === 'trial' && gym.trialEndsAt && (
          <View style={s.trialBanner}>
            <Text style={s.trialText}>
              🎁 Free trial — {Math.max(0, Math.ceil((new Date(gym.trialEndsAt).getTime() - Date.now()) / 86400000))} days remaining
            </Text>
          </View>
        )}

        {/* KPI grid */}
        <View style={s.kpiGrid}>
          {[
            { label: 'Active Members',  value: stats?.totalActive ?? 0,       color: Colors.success, icon: '👥', route: '/(staff)/members' },
            { label: 'Check-ins Today', value: stats?.checkInsToday ?? 0,      color: Colors.accent,  icon: '✓',  route: null },
            { label: 'Expiring Soon',   value: stats?.expiringThisWeek ?? 0,   color: Colors.warning, icon: '⚠️', route: '/(staff)/members' },
            { label: 'Dues Pending',    value: stats?.totalExpired ?? 0,       color: Colors.danger,  icon: '₹',  route: '/(staff)/billing' },
          ].map((k) => (
            <TouchableOpacity
              key={k.label}
              style={s.kpiCard}
              onPress={() => k.route && router.push(k.route as any)}
              activeOpacity={k.route ? 0.7 : 1}
            >
              <Text style={s.kpiIcon}>{k.icon}</Text>
              <Text style={[s.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={s.kpiLabel}>{k.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick actions */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          {[
            { icon: '👤', label: 'Add Member',  route: '/(staff)/add-member' },
            { icon: '👥', label: 'All Members', route: '/(staff)/members' },
            { icon: '💰', label: 'Collect Due', route: '/(staff)/billing' },
            { icon: '📋', label: 'Plans',       route: '/(staff)/plans' },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={s.actionCard} onPress={() => router.push(a.route as any)}>
              <Text style={s.actionIcon}>{a.icon}</Text>
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        <Text style={s.sectionTitle}>This Month</Text>
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Total Members</Text>
            <Text style={s.summaryValue}>{stats?.totalMembers ?? 0}</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Check-ins</Text>
            <Text style={s.summaryValue}>{stats?.checkInsMonth ?? 0}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.background },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:       { padding: 20, paddingBottom: 32 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  gymName:      { fontSize: 18, fontWeight: '800', color: Colors.primary },
  greet:        { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn:       { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  addBtnText:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  trialBanner:  { backgroundColor: Colors.accentLight, borderRadius: 12, padding: 12, marginBottom: 16,
                  borderWidth: 1, borderColor: Colors.accent + '40' },
  trialText:    { fontSize: 13, color: Colors.accent, fontWeight: '600', textAlign: 'center' },
  kpiGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  kpiCard:      { width: '47%', backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
                  borderWidth: 1, borderColor: Colors.border },
  kpiIcon:      { fontSize: 22, marginBottom: 8 },
  kpiValue:     { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  kpiLabel:     { fontSize: 12, color: Colors.textSecondary },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 12 },
  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  actionCard:   { width: '47%', backgroundColor: Colors.surface, borderRadius: 14, padding: 18,
                  alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  actionIcon:   { fontSize: 26, marginBottom: 8 },
  actionLabel:  { fontSize: 13, fontWeight: '600', color: Colors.primary },
  summaryRow:   { flexDirection: 'row', gap: 10 },
  summaryCard:  { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
                  borderWidth: 1, borderColor: Colors.border },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6 },
  summaryValue: { fontSize: 24, fontWeight: '700', color: Colors.primary },
});