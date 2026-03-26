import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthContext } from '@/store/AuthContext';
import { useAppContext } from '@/store/AppContext';
import { useStaffRole } from '@/hooks/useStaffRole';
import api from '@/services/api';

interface Stats {
  totalActive: number; totalExpired: number; totalFrozen: number;
  checkInsToday: number; checkInsMonth: number;
  expiringThisWeek: number; totalMembers: number;
}

export default function StaffDashboard() {
  const { colors, isDark } = useTheme();
  const { user } = useAuthContext();
  const { gym, gymId, refreshGym } = useAppContext();
  const { roleLabel, permissions, isLoading: roleLoading } = useStaffRole();
  const [stats, setStats]           = useState<Stats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const s = makeStyles(colors);

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

  const kpis = [
    { label: 'Active',    value: stats?.totalActive      ?? 0, color: colors.success, icon: '👥' },
    { label: 'Check-ins', value: stats?.checkInsToday    ?? 0, color: colors.accent,  icon: '✓'  },
    { label: 'Expiring',  value: stats?.expiringThisWeek ?? 0, color: colors.warning, icon: '⚠️' },
    { label: 'Expired',   value: stats?.totalExpired     ?? 0, color: colors.danger,  icon: '❌' },
  ];

  // ── All quick actions including Classes ──
  const allActions = [
    { icon: '👤', label: 'Add Member', route: '/(staff)/add-member', show: permissions.canAddMembers },
    { icon: '👥', label: 'Members',    route: '/(staff)/members',    show: permissions.canViewMembers },
    { icon: '🏋️', label: 'Classes',   route: '/(staff)/classes',    show: true }, // everyone sees classes
    { icon: '💰', label: 'Billing',    route: '/(staff)/billing',    show: permissions.canViewBilling },
    { icon: '📈', label: 'Reports',    route: '/(staff)/reports',    show: permissions.canViewReports },
    { icon: '📋', label: 'Plans',      route: '/(staff)/plans',      show: permissions.canViewPlans },
    { icon: '👔', label: 'Staff',      route: '/(staff)/staff',      show: permissions.canViewStaff },
    { icon: '📢', label: 'Notify',     route: '/(staff)/broadcast',  show: permissions.canBroadcast },
    { icon: '⚙️', label: 'Settings',   route: '/(staff)/settings',   show: permissions.canViewSettings },
  ].filter(a => a.show);

  if (loading || roleLoading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
        <View style={s.center}><ActivityIndicator size="large" color={colors.accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); refreshGym(); }} tintColor={colors.accent} />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={[s.gymName, { color: colors.primary }]}>{gym?.name || 'My Gym'}</Text>
            <Text style={[s.greet, { color: colors.textSecondary }]}>
              {greet}, {user?.fullName?.split(' ')[0]} 👋
            </Text>
          </View>
          {permissions.canAddMembers && (
            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/(staff)/add-member' as any)}
            >
              <Text style={s.addBtnText}>+ Member</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Role badge */}
        <View style={[s.roleBadge, { backgroundColor: colors.accentLight }]}>
          <Text style={[s.roleText, { color: colors.accent }]}>
            {roleLabel} — {gym?.planStatus === 'trial'
              ? `Trial: ${Math.max(0, Math.ceil((new Date(gym.trialEndsAt || '').getTime() - Date.now()) / 86400000))} days left`
              : gym?.planTier}
          </Text>
        </View>

        {/* KPI grid */}
        <View style={s.kpiGrid}>
          {kpis.map((k) => (
            <View key={k.label} style={[s.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={s.kpiIcon}>{k.icon}</Text>
              <Text style={[s.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={[s.kpiLabel, { color: colors.textSecondary }]}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={[s.sectionTitle, { color: colors.primary }]}>Quick Actions</Text>
        {allActions.length === 0 ? (
          <View style={[s.noAccess, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.noAccessText, { color: colors.textSecondary }]}>
              Contact your gym owner for access to more features.
            </Text>
          </View>
        ) : (
          <View style={s.actionsGrid}>
            {allActions.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={[s.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push(a.route as any)}
                activeOpacity={0.75}
              >
                <Text style={s.actionIcon}>{a.icon}</Text>
                <Text style={[s.actionLabel, { color: colors.primary }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Monthly summary */}
        <Text style={[s.sectionTitle, { color: colors.primary }]}>This Month</Text>
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>Total Members</Text>
            <Text style={[s.summaryValue, { color: colors.primary }]}>{stats?.totalMembers ?? 0}</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>Check-ins</Text>
            <Text style={[s.summaryValue, { color: colors.primary }]}>{stats?.checkInsMonth ?? 0}</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>Frozen</Text>
            <Text style={[s.summaryValue, { color: colors.warning }]}>{stats?.totalFrozen ?? 0}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe:         { flex: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:       { padding: 20, paddingBottom: 32 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  gymName:      { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  greet:        { fontSize: 13, marginTop: 2 },
  addBtn:       { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  addBtnText:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  roleBadge:    { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 20, alignSelf: 'flex-start' },
  roleText:     { fontSize: 12, fontWeight: '600' },
  kpiGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  kpiCard:      { width: '47%', borderRadius: 16, padding: 16, borderWidth: 1 },
  kpiIcon:      { fontSize: 22, marginBottom: 8 },
  kpiValue:     { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  kpiLabel:     { fontSize: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  actionCard:   { width: '22%', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1 },
  actionIcon:   { fontSize: 22, marginBottom: 6 },
  actionLabel:  { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  noAccess:     { borderRadius: 14, padding: 20, borderWidth: 1, marginBottom: 24, alignItems: 'center' },
  noAccessText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  summaryRow:   { flexDirection: 'row', gap: 10 },
  summaryCard:  { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1 },
  summaryLabel: { fontSize: 11, marginBottom: 6 },
  summaryValue: { fontSize: 22, fontWeight: '700' },
});