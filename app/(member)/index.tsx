import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthContext } from '@/store/AuthContext';
import api from '@/services/api';

const daysLeft = (d?: string) =>
  d ? Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)) : 0;

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function MemberHome() {
  const { colors, isDark } = useTheme();
  const { user } = useAuthContext();
  const [profile, setProfile]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [notMember, setNotMember] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const s = makeStyles(colors);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/me/member-profile');
      setProfile(data.data);
      setNotMember(false);
    } catch (err: any) {
      if (err?.response?.status === 404) setNotMember(true);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const days      = daysLeft(profile?.planEndDate);
  const isUrgent  = days > 0 && days <= 7;
  const isExpired = !!profile?.planEndDate && days === 0;
  const pct       = Math.min(100, (days / 30) * 100);

  const initials = user?.fullName
    ?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  if (loading) {
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} tintColor={colors.accent} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={[s.greeting, { color: colors.textSecondary }]}>{greeting()},</Text>
            <Text style={[s.name, { color: colors.primary }]}>{user?.fullName} 👋</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(member)/profile' as any)}>
            <View style={[s.avatar, { backgroundColor: colors.accent }]}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* No membership */}
        {notMember && (
          <View style={[s.noMemberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={s.noMemberEmoji}>🏋️</Text>
            <Text style={[s.noMemberTitle, { color: colors.primary }]}>No membership found</Text>
            <Text style={[s.noMemberSub, { color: colors.textSecondary }]}>
              Ask your gym staff to add you as a member.{'\n'}
              Your phone: <Text style={{ fontWeight: '700', color: colors.primary }}>{user?.phone}</Text>
            </Text>
          </View>
        )}

        {/* Membership card */}
        {profile && (
          <View style={[
            s.memberCard,
            isExpired ? { backgroundColor: colors.textMuted } :
            isUrgent  ? { backgroundColor: colors.warning } :
            { backgroundColor: colors.accent }
          ]}>
            <View style={s.memberCardTop}>
              <View>
                <Text style={s.memberCardLabel}>MEMBERSHIP</Text>
                <Text style={s.memberCardPlan}>{profile.planName || 'Standard Plan'}</Text>
              </View>
              <View style={[s.statusBadge, {
                backgroundColor: profile.status === 'active'
                  ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'
              }]}>
                <Text style={s.statusText}>{profile.status.toUpperCase()}</Text>
              </View>
            </View>
            <View style={s.memberCardBottom}>
              <View>
                <Text style={s.memberCardMeta}>Member Code</Text>
                <Text style={s.memberCardValue}>{profile.memberCode}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.memberCardMeta}>{isExpired ? 'Expired' : 'Days Left'}</Text>
                <Text style={s.memberCardDays}>{days}</Text>
              </View>
            </View>
            {!isExpired && profile.planEndDate && (
              <View style={s.progressBg}>
                <View style={[s.progressFill, {
                  width: `${pct}%` as any,
                  backgroundColor: isUrgent ? '#fff' : 'rgba(255,255,255,0.9)',
                }]} />
              </View>
            )}
          </View>
        )}

        {/* Check-in button */}
        <TouchableOpacity
          style={[
            s.checkinBtn,
            { backgroundColor: (!profile || profile.status !== 'active') ? colors.textMuted : colors.primary }
          ]}
          onPress={() => router.push('/(member)/checkin' as any)}
          disabled={!profile || profile.status !== 'active'}
          activeOpacity={0.85}
        >
          <Text style={s.checkinIcon}>📱</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.checkinTitle}>Tap to Check In</Text>
            <Text style={s.checkinSub}>Show QR code at entrance</Text>
          </View>
          <Text style={s.checkinArrow}>→</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: 'Check-ins', value: profile?.totalCheckIns ?? 0 },
            { label: 'Days Left',  value: days },
            { label: 'Status',     value: profile?.status === 'active' ? '✓' : '—' },
          ].map((stat) => (
            <View key={stat.label} style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.statValue, { color: colors.primary }]}>{stat.value}</Text>
              <Text style={[s.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick links */}
        <Text style={[s.sectionTitle, { color: colors.primary }]}>Quick Actions</Text>
        <View style={s.quickGrid}>
          {[
            { icon: '🗓', label: 'Classes',    route: '/(member)/classes' },
            { icon: '📋', label: 'Membership', route: '/(member)/membership' },
            { icon: '✓',  label: 'Attendance', route: '/(member)/checkin' },
            { icon: '👤', label: 'Profile',    route: '/(member)/profile' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[s.quickItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.75}
            >
              <Text style={s.quickIcon}>{item.icon}</Text>
              <Text style={[s.quickLabel, { color: colors.primary }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe:            { flex: 1 },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:          { padding: 20, paddingBottom: 32 },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting:        { fontSize: 14 },
  name:            { fontSize: 22, fontWeight: '700' },
  avatar:          { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText:      { fontSize: 16, fontWeight: '700', color: '#fff' },
  noMemberCard:    { borderRadius: 20, padding: 28, marginBottom: 16, alignItems: 'center', borderWidth: 1 },
  noMemberEmoji:   { fontSize: 48, marginBottom: 12 },
  noMemberTitle:   { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  noMemberSub:     { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  memberCard:      { borderRadius: 20, padding: 20, marginBottom: 16 },
  memberCardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  memberCardLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginBottom: 4 },
  memberCardPlan:  { fontSize: 18, fontWeight: '700', color: '#fff' },
  statusBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText:      { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  memberCardBottom:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  memberCardMeta:  { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  memberCardValue: { fontSize: 15, fontWeight: '600', color: '#fff' },
  memberCardDays:  { fontSize: 28, fontWeight: '800', color: '#fff' },
  progressBg:      { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  progressFill:    { height: 4, borderRadius: 2 },
  checkinBtn:      { borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  checkinIcon:     { fontSize: 28 },
  checkinTitle:    { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  checkinSub:      { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  checkinArrow:    { fontSize: 20, color: '#fff' },
  statsRow:        { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:        { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1 },
  statValue:       { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  statLabel:       { fontSize: 11, textAlign: 'center' },
  sectionTitle:    { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  quickGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickItem:       { width: '47%', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1 },
  quickIcon:       { fontSize: 26, marginBottom: 8 },
  quickLabel:      { fontSize: 13, fontWeight: '600' },
});