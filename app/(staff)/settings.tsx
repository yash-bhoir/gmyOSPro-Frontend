import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAuthContext } from '@/store/AuthContext';
import { useToast } from '@/hooks/useToast';

export default function SettingsScreen() {
  const { user, logout } = useAuthContext();
  const toast = useToast();
  const initials = user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const sections = [
    {
      title: 'Gym Settings',
      items: [
        { icon: '🏢', label: 'Gym Profile',       action: () => toast.info('Edit gym profile coming soon') },
        { icon: '📋', label: 'Membership Plans',  action: () => toast.info('Plans management coming soon') },
        { icon: '⏰', label: 'Working Hours',      action: () => toast.info('Coming soon') },
        { icon: '🏷', label: 'Fees & Charges',    action: () => toast.info('Coming soon') },
      ],
    },
    {
      title: 'My Account',
      items: [
        { icon: '👤', label: 'Edit Profile',       action: () => toast.info('Go to Profile tab to edit') },
        { icon: '🔔', label: 'Notifications',      action: () => toast.info('Notification settings coming soon') },
        { icon: '🔒', label: 'Change Password',    action: () => toast.info('Coming soon') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: '❓', label: 'Help & FAQ',          action: () => toast.info('Contact support@gymos.in') },
        { icon: '📞', label: 'Contact Support',    action: () => toast.info('Call +91-XXXX-XXXXXX') },
        { icon: '⭐', label: 'Rate GymOS',          action: () => toast.success('Thank you for your support!') },
        { icon: 'ℹ️', label: 'About',               action: () => toast.info('GymOS v1.0.0 — Built with ❤️') },
      ],
    },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Settings</Text>

        {/* Profile summary */}
        <View style={s.profileCard}>
          <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
          <View>
            <Text style={s.profileName}>{user?.fullName}</Text>
            <Text style={s.profileRole}>{user?.role?.replace('_', ' ').toUpperCase()}</Text>
            <Text style={s.profilePhone}>{user?.phone}</Text>
          </View>
        </View>

        {/* Sections */}
        {sections.map((section) => (
          <View key={section.title}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <View style={s.card}>
              {section.items.map((item, i, arr) => (
                <TouchableOpacity
                  key={item.label}
                  style={[s.row, i === arr.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={item.action}
                >
                  <Text style={s.rowIcon}>{item.icon}</Text>
                  <Text style={s.rowLabel}>{item.label}</Text>
                  <Text style={s.rowArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Text style={s.version}>GymOS v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.background },
  scroll:       { padding: 16, paddingBottom: 40 },
  title:        { fontSize: 22, fontWeight: '800', color: Colors.primary, marginBottom: 16 },
  profileCard:  { flexDirection: 'row', alignItems: 'center', gap: 14,
                  backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
                  borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  avatar:       { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accent,
                  alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 20, fontWeight: '700', color: '#fff' },
  profileName:  { fontSize: 16, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  profileRole:  { fontSize: 11, color: Colors.accent, fontWeight: '600', marginBottom: 2 },
  profilePhone: { fontSize: 13, color: Colors.textSecondary },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted,
                  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  card:         { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1,
                  borderColor: Colors.border, marginBottom: 16 },
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon:      { fontSize: 18, marginRight: 12 },
  rowLabel:     { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.primary },
  rowArrow:     { fontSize: 20, color: Colors.textMuted },
  logoutBtn:    { backgroundColor: Colors.danger, borderRadius: 14, height: 54,
                  alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoutText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  version:      { textAlign: 'center', fontSize: 12, color: Colors.textMuted },
});