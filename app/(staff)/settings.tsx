import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthContext } from '@/store/AuthContext';
import { useAppContext } from '@/store/AppContext';
import { useStaffRole } from '@/hooks/useStaffRole';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuthContext();
  const { gym } = useAppContext();
  const { roleLabel, permissions, isOwner } = useStaffRole();
  const s = makeStyles(colors);

  const initials = user?.fullName
    ?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  // Build sections based on permissions
  const gymSection = [
    permissions.canViewPlans  && { icon: '📋', label: 'Membership Plans', onPress: () => router.push('/(staff)/plans' as any) },
    permissions.canViewStaff  && { icon: '👔', label: 'Staff Members',    onPress: () => router.push('/(staff)/staff' as any) },
    permissions.canBroadcast  && { icon: '📢', label: 'Send Notification',onPress: () => router.push('/(staff)/broadcast' as any) },
    permissions.canAccessKiosk&& { icon: '📱', label: 'Kiosk Mode',       onPress: () => router.replace('/(kiosk)/idle' as any) },
  ].filter(Boolean) as any[];

  const reportsSection = [
    permissions.canViewReports && { icon: '📈', label: 'View Reports',      onPress: () => router.push('/(staff)/reports' as any) },
    permissions.canViewBilling && { icon: '💰', label: 'Billing & Invoices',onPress: () => router.push('/(staff)/billing' as any) },
  ].filter(Boolean) as any[];

  const sections = [
    gymSection.length     > 0 && { title: 'Gym Management',      items: gymSection },
    reportsSection.length > 0 && { title: 'Reports & Analytics', items: reportsSection },
    { title: 'Support', items: [
      { icon: '❓', label: 'Help & FAQ',     onPress: () => Alert.alert('Support', 'Email: support@gymos.in') },
      { icon: '⭐', label: 'Rate GymOS',      onPress: () => Alert.alert('Thank you!', 'Your support means a lot 🙏') },
      { icon: 'ℹ️', label: 'About GymOS v1.0',onPress: () => Alert.alert('GymOS v1.0.0', 'Built for Indian gyms ❤️') },
    ]},
  ].filter(Boolean) as any[];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[s.title, { color: colors.primary }]}>Settings</Text>

        {/* Profile card */}
        <View style={[s.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[s.avatar, { backgroundColor: colors.accent }]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.profileName, { color: colors.primary }]}>{user?.fullName}</Text>
            <Text style={[s.profileRole, { color: colors.accent }]}>{roleLabel.toUpperCase()}</Text>
            <Text style={[s.profilePhone, { color: colors.textSecondary }]}>{user?.phone}</Text>
          </View>
          {gym && (
            <View style={[s.gymBadge, { backgroundColor: colors.accentLight }]}>
              <Text style={[s.gymBadgeText, { color: colors.accent }]} numberOfLines={1}>{gym.name}</Text>
            </View>
          )}
        </View>

        {/* Sections — filtered by role */}
        {sections.map((section) => (
          <View key={section.title} style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.textMuted }]}>{section.title.toUpperCase()}</Text>
            <View style={[s.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {section.items.map((item: any, i: number, arr: any[]) => (
                <TouchableOpacity
                  key={item.label}
                  style={[s.row, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  onPress={item.onPress}
                  activeOpacity={0.6}
                >
                  <Text style={s.rowIcon}>{item.icon}</Text>
                  <Text style={[s.rowLabel, { color: colors.primary }]}>{item.label}</Text>
                  <Text style={[s.rowArrow, { color: colors.textMuted }]}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={[s.logoutBtn, { backgroundColor: colors.danger }]} onPress={handleLogout}>
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Text style={[s.version, { color: colors.textMuted }]}>GymOS v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  safe:         { flex: 1 },
  scroll:       { padding: 16, paddingBottom: 40 },
  title:        { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  profileCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 20 },
  avatar:       { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 20, fontWeight: '700', color: '#fff' },
  profileName:  { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  profileRole:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  profilePhone: { fontSize: 13 },
  gymBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, maxWidth: 100 },
  gymBadgeText: { fontSize: 10, fontWeight: '700' },
  section:      { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4 },
  sectionCard:  { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon:      { fontSize: 18, marginRight: 12 },
  rowLabel:     { flex: 1, fontSize: 14, fontWeight: '500' },
  rowArrow:     { fontSize: 20 },
  logoutBtn:    { borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoutText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  version:      { textAlign: 'center', fontSize: 12 },
});