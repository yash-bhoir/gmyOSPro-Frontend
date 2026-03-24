import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthContext } from '@/store/AuthContext';
import { Colors } from '@/constants/colors';
import api from '@/services/api';

interface MemberProfile {
  memberCode: string; status: string; planName?: string;
  planEndDate?: string; totalCheckIns: number;
  userId: { fullName: string; phone: string; email?: string; photoUrl?: string };
}

const daysRemaining = (endDate?: string): number => {
  if (!endDate) return 0;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function MemberHome() {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/me/member-profile');
      setProfile(data.data);
    } catch {
      // User may not be a gym member yet
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const days    = daysRemaining(profile?.planEndDate);
  const isUrgent = days <= 7 && days > 0;
  const isExpired = days === 0 && !!profile?.planEndDate;

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator size="large" color={Colors.accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting()},</Text>
            <Text style={s.name}>{user?.fullName} 👋</Text>
          </View>
          <TouchableOpacity style={s.avatarBtn} onPress={() => router.push('/(member)/profile')}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>
                {user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Membership card */}
        {profile ? (
          <View style={[s.memberCard, isExpired && s.memberCardExpired, isUrgent && s.memberCardUrgent]}>
            <View style={s.memberCardTop}>
              <View>
                <Text style={s.memberCardLabel}>MEMBERSHIP</Text>
                <Text style={s.memberCardPlan}>{profile.planName || 'Standard Plan'}</Text>
              </View>
              <View style={[s.statusBadge, profile.status === 'active' ? s.statusActive : s.statusExpired]}>
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
                <Text style={[s.memberCardDays, isExpired && { color: Colors.danger }, isUrgent && { color: Colors.warning }]}>
                  {isExpired ? '0' : days}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            {!isExpired && profile.planEndDate && (
              <View style={s.progressBg}>
                <View style={[s.progressFill, {
                  width: `${Math.min(100, (days / 30) * 100)}%` as any,
                  backgroundColor: isUrgent ? Colors.warning : Colors.success,
                }]} />
              </View>
            )}
          </View>
        ) : (
          <View style={s.noMemberCard}>
            <Text style={s.noMemberText}>No active membership</Text>
            <Text style={s.noMemberSub}>Contact your gym to get started</Text>
          </View>
        )}

        {/* Check-in button */}
        <TouchableOpacity
          style={[s.checkinBtn, (!profile || profile.status !== 'active') && s.checkinBtnDisabled]}
          onPress={() => router.push('/(member)/checkin')}
          disabled={!profile || profile.status !== 'active'}
        >
          <Text style={s.checkinIcon}>📱</Text>
          <View>
            <Text style={s.checkinTitle}>Tap to Check In</Text>
            <Text style={s.checkinSub}>Show QR code at entrance</Text>
          </View>
          <Text style={s.checkinArrow}>→</Text>
        </TouchableOpacity>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{profile?.totalCheckIns ?? 0}</Text>
            <Text style={s.statLabel}>Total Check-ins</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{days}</Text>
            <Text style={s.statLabel}>Days Left</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{profile?.status === 'active' ? '✓' : '✗'}</Text>
            <Text style={s.statLabel}>Active</Text>
          </View>
        </View>

        {/* Quick links */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.quickGrid}>
          {[
            { icon: '🗓', label: 'Classes', route: '/(member)/classes' },
            { icon: '📋', label: 'Membership', route: '/(member)/membership' },
            { icon: '📊', label: 'Attendance', route: '/(member)/checkin' },
            { icon: '👤', label: 'Profile', route: '/(member)/profile' },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={s.quickItem} onPress={() => router.push(item.route as any)}>
              <Text style={s.quickIcon}>{item.icon}</Text>
              <Text style={s.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.background },
  center:            { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:            { padding: 20, paddingBottom: 32 },
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting:          { fontSize: 14, color: Colors.textSecondary },
  name:              { fontSize: 22, fontWeight: '700', color: Colors.primary },
  avatarBtn:         {},
  avatar:            { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText:        { fontSize: 16, fontWeight: '700', color: '#fff' },
  memberCard:        { backgroundColor: Colors.primary, borderRadius: 20, padding: 20, marginBottom: 16 },
  memberCardExpired: { backgroundColor: Colors.textSecondary },
  memberCardUrgent:  { backgroundColor: Colors.warning },
  memberCardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  memberCardLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginBottom: 4 },
  memberCardPlan:    { fontSize: 18, fontWeight: '700', color: '#fff' },
  statusBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusActive:      { backgroundColor: 'rgba(34,197,94,0.2)' },
  statusExpired:     { backgroundColor: 'rgba(239,68,68,0.2)' },
  statusText:        { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  memberCardBottom:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  memberCardMeta:    { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  memberCardValue:   { fontSize: 15, fontWeight: '600', color: '#fff' },
  memberCardDays:    { fontSize: 28, fontWeight: '800', color: '#fff' },
  progressBg:        { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  progressFill:      { height: 4, borderRadius: 2 },
  noMemberCard:      { backgroundColor: Colors.surface, borderRadius: 20, padding: 24,
                       marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  noMemberText:      { fontSize: 16, fontWeight: '600', color: Colors.primary, marginBottom: 6 },
  noMemberSub:       { fontSize: 13, color: Colors.textSecondary },
  checkinBtn:        { backgroundColor: Colors.accent, borderRadius: 16, padding: 20,
                       flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  checkinBtnDisabled:{ backgroundColor: Colors.textMuted },
  checkinIcon:       { fontSize: 28 },
  checkinTitle:      { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  checkinSub:        { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  checkinArrow:      { marginLeft: 'auto', fontSize: 20, color: '#fff' },
  statsRow:          { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:          { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
                       alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statValue:         { fontSize: 22, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  statLabel:         { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  sectionTitle:      { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 12 },
  quickGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickItem:         { width: '47%', backgroundColor: Colors.surface, borderRadius: 14, padding: 18,
                       alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  quickIcon:         { fontSize: 26, marginBottom: 8 },
  quickLabel:        { fontSize: 13, fontWeight: '600', color: Colors.primary },
});