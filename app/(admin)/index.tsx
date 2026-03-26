import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthContext } from '@/store/AuthContext';
import api from '@/services/api';

const fmtCurrency = (n: number) =>
  n >= 10000000 ? `₹${(n/10000000).toFixed(1)}Cr`
  : n >= 100000 ? `₹${(n/100000).toFixed(1)}L`
  : n >= 1000   ? `₹${(n/1000).toFixed(1)}K`
  : `₹${n}`;

export default function AdminOverview() {
  const { user, logout } = useAuthContext();
  const [stats, setStats]         = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data.data);
    } catch (err: any) {
      if (err?.response?.status === 403) logout();
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) return (
    <View style={s.loading}><ActivityIndicator size="large" color="#F59E0B" /></View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} tintColor="#F59E0B" />}
      >
        <View style={s.header}>
          <View>
            <Text style={s.badge}>⚡ SUPER ADMIN</Text>
            <Text style={s.title}>GymOS Platform</Text>
            <Text style={s.sub}>Welcome, {user?.fullName}</Text>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={s.revenueCard}>
          <Text style={s.revenueLabel}>PLATFORM REVENUE</Text>
          <Text style={s.revenueValue}>{fmtCurrency(stats?.revenue?.total ?? 0)}</Text>
          <Text style={[s.growthText, { color: (stats?.revenue?.growth ?? 0) >= 0 ? '#166534' : '#991B1B' }]}>
            {(stats?.revenue?.growth ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.revenue?.growth ?? 0)}% vs last month
          </Text>
          <Text style={s.revenueMonth}>This month: {fmtCurrency(stats?.revenue?.thisMonth ?? 0)}</Text>
        </View>

        <View style={s.grid}>
          {[
            { label: 'Total Gyms',      value: stats?.gyms?.total     ?? 0, sub: `${stats?.gyms?.active ?? 0} active`,   color: '#F59E0B', icon: '🏢' },
            { label: 'Trial Gyms',      value: stats?.gyms?.trial     ?? 0, sub: 'Free trial',                            color: '#6366F1', icon: '🎁' },
            { label: 'Total Members',   value: stats?.members?.total  ?? 0, sub: `${stats?.members?.active ?? 0} active`, color: '#22C55E', icon: '👥' },
            { label: 'Check-ins Today', value: stats?.checkins?.today ?? 0, sub: `${stats?.checkins?.total ?? 0} total`,  color: '#3B82F6', icon: '✓'  },
            { label: 'Suspended Gyms',  value: stats?.gyms?.suspended ?? 0, sub: 'Need attention',                        color: '#EF4444', icon: '🚫' },
            { label: 'Last Month',      value: fmtCurrency(stats?.revenue?.lastMonth ?? 0), sub: 'Revenue', color: '#8B5CF6', icon: '📊', str: true },
          ].map((k) => (
            <View key={k.label} style={s.kpiCard}>
              <Text style={s.kpiIcon}>{k.icon}</Text>
              <Text style={[s.kpiValue, { color: k.color }]}>
                {k.str ? k.value : (k.value as number).toLocaleString('en-IN')}
              </Text>
              <Text style={s.kpiLabel}>{k.label}</Text>
              <Text style={s.kpiSub}>{k.sub}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          {[
            { icon: '🏢', label: 'All Gyms',      onPress: () => router.push('/(admin)/gyms' as any) },
            { icon: '📊', label: 'Revenue',        onPress: () => router.push('/(admin)/revenue' as any) },
            { icon: '👤', label: 'Users',          onPress: () => router.push('/(admin)/users' as any) },
            { icon: '🚫', label: 'Suspended Gyms', onPress: () => router.push({ pathname: '/(admin)/gyms', params: { filter: 'suspended' } } as any) },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={s.actionCard} onPress={a.onPress}>
              <Text style={s.actionIcon}>{a.icon}</Text>
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0A0A0A' },
  loading:      { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  scroll:       { padding: 20, paddingBottom: 32 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  badge:        { fontSize: 10, fontWeight: '700', color: '#F59E0B', letterSpacing: 1.5, marginBottom: 4 },
  title:        { fontSize: 24, fontWeight: '800', color: '#fff' },
  sub:          { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  logoutBtn:    { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  logoutText:   { color: '#fff', fontSize: 13, fontWeight: '600' },
  revenueCard:  { backgroundColor: '#F59E0B', borderRadius: 20, padding: 22, marginBottom: 16 },
  revenueLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(0,0,0,0.5)', letterSpacing: 1.5, marginBottom: 6 },
  revenueValue: { fontSize: 42, fontWeight: '800', color: '#000', marginBottom: 6 },
  growthText:   { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  revenueMonth: { fontSize: 13, color: 'rgba(0,0,0,0.5)' },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  kpiCard:      { width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
                  padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  kpiIcon:      { fontSize: 20, marginBottom: 8 },
  kpiValue:     { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  kpiLabel:     { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  kpiSub:       { fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 12 },
  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard:   { width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
                  padding: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  actionIcon:   { fontSize: 26, marginBottom: 8 },
  actionLabel:  { fontSize: 12, fontWeight: '600', color: '#fff' },
});