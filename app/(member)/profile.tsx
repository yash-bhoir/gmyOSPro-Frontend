import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuthContext } from '@/store/AuthContext';
import { useToast } from '@/hooks/useToast';
import api from '@/services/api';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout, updateUser } = useAuthContext();
  const toast = useToast();
  const s = makeStyles(colors);

  const [editing, setEditing]     = useState(false);
  const [fullName, setFullName]   = useState(user?.fullName || '');
  const [email, setEmail]         = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);

  const initials = user?.fullName
    ?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleSave = async () => {
    if (!fullName.trim()) { toast.error('Name required'); return; }
    setIsLoading(true);
    try {
      const { data } = await api.patch('/auth/me', { fullName, email });
      updateUser({ fullName: data.data.fullName, email: data.data.email });
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err: any) {
      toast.error('Update failed', err?.response?.data?.message);
    } finally { setIsLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.headerRow}>
          <Text style={[s.title, { color: colors.primary }]}>Profile</Text>
          <TouchableOpacity
            style={[s.editBtn, { backgroundColor: colors.accentLight }]}
            onPress={() => editing ? handleSave() : setEditing(true)}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator size="small" color={colors.accent} />
              : <Text style={[s.editText, { color: colors.accent }]}>{editing ? 'Save' : 'Edit'}</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={[s.avatar, { backgroundColor: colors.accent }]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={[s.userName, { color: colors.primary }]}>{user?.fullName}</Text>
          <Text style={[s.userPhone, { color: colors.textSecondary }]}>{user?.phone}</Text>
        </View>

        {/* Info card */}
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.cardTitle, { color: colors.textMuted }]}>Personal Information</Text>

          <View style={[s.field, { borderBottomColor: colors.border }]}>
            <Text style={[s.fieldLabel, { color: colors.textMuted }]}>FULL NAME</Text>
            {editing
              ? <TextInput
                  style={[s.fieldInput, { color: colors.primary, borderBottomColor: colors.accent }]}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              : <Text style={[s.fieldValue, { color: colors.primary }]}>{user?.fullName || '—'}</Text>
            }
          </View>

          <View style={[s.field, { borderBottomColor: colors.border }]}>
            <Text style={[s.fieldLabel, { color: colors.textMuted }]}>PHONE</Text>
            <Text style={[s.fieldValue, { color: colors.primary }]}>
              {user?.phone ? `+91 ${user.phone}` : '—'}
            </Text>
          </View>

          <View style={[s.field, { borderBottomColor: colors.border }]}>
            <Text style={[s.fieldLabel, { color: colors.textMuted }]}>EMAIL</Text>
            {editing
              ? <TextInput
                  style={[s.fieldInput, { color: colors.primary, borderBottomColor: colors.accent }]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Add email"
                  placeholderTextColor={colors.textMuted}
                />
              : <Text style={[s.fieldValue, { color: colors.primary }]}>{user?.email || '—'}</Text>
            }
          </View>

          <View style={s.fieldLast}>
            <Text style={[s.fieldLabel, { color: colors.textMuted }]}>ROLE</Text>
            <Text style={[s.fieldValue, { color: colors.primary }]}>
              {user?.role?.replace('_', ' ').toUpperCase() ?? 'MEMBER'}
            </Text>
          </View>
        </View>

        {editing && (
          <TouchableOpacity
            style={[s.cancelBtn, { borderColor: colors.border }]}
            onPress={() => {
              setEditing(false);
              setFullName(user?.fullName || '');
              setEmail(user?.email || '');
            }}
          >
            <Text style={[s.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        )}

        {/* Account actions */}
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.cardTitle, { color: colors.textMuted }]}>Account</Text>
          {[
            { icon: '🧾', label: 'My Invoices',    onPress: () => Alert.alert('Invoices', 'Payment history will be available soon') },
            { icon: '🔔', label: 'Notifications',  onPress: () => Alert.alert('Notifications', 'Notification settings coming soon') },
            { icon: '❓', label: 'Help & Support', onPress: () => Alert.alert('Support', 'Email: support@gymos.in') },
            { icon: '⭐', label: 'Rate the App',    onPress: () => Alert.alert('Thank you!', 'Your support means a lot 🙏') },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[
                s.actionRow,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
              onPress={item.onPress}
            >
              <Text style={s.actionIcon}>{item.icon}</Text>
              <Text style={[s.actionLabel, { color: colors.primary }]}>{item.label}</Text>
              <Text style={[s.actionArrow, { color: colors.textMuted }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[s.logoutBtn, { backgroundColor: colors.danger }]}
          onPress={handleLogout}
        >
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={[s.version, { color: colors.textMuted }]}>GymOS v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe:          { flex: 1 },
  scroll:        { padding: 20, paddingBottom: 40 },
  headerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title:         { fontSize: 24, fontWeight: '800' },
  editBtn:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  editText:      { fontSize: 13, fontWeight: '700' },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar:        { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:    { fontSize: 32, fontWeight: '700', color: '#fff' },
  userName:      { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  userPhone:     { fontSize: 14 },
  card:          { borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 14 },
  cardTitle:     { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 },
  field:         { paddingVertical: 12, borderBottomWidth: 1 },
  fieldLast:     { paddingVertical: 12 },
  fieldLabel:    { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  fieldValue:    { fontSize: 15, fontWeight: '500' },
  fieldInput:    { fontSize: 15, borderBottomWidth: 1.5, paddingVertical: 4 },
  cancelBtn:     { borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 14 },
  cancelText:    { fontSize: 14, fontWeight: '600' },
  actionRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  actionIcon:    { fontSize: 20, marginRight: 12 },
  actionLabel:   { flex: 1, fontSize: 14, fontWeight: '500' },
  actionArrow:   { fontSize: 20 },
  logoutBtn:     { borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoutText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  version:       { textAlign: 'center', fontSize: 12 },
});