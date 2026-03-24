import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAuthContext } from '@/store/AuthContext';
import { useToast } from '@/hooks/useToast';
import api from '@/services/api';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthContext();
  const toast = useToast();
  const [editing, setEditing]     = useState(false);
  const [fullName, setFullName]   = useState(user?.fullName || '');
  const [email, setEmail]         = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);

  const initials = user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleSave = async () => {
    if (!fullName.trim()) { toast.error('Name required'); return; }
    setIsLoading(true);
    try {
      const { data } = await api.patch('/auth/me', { fullName, email });
      updateUser({ fullName: data.data.fullName, email: data.data.email });
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err: any) {
      toast.error('Update failed', err?.response?.data?.message || 'Please try again');
    } finally { setIsLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.headerRow}>
          <Text style={s.title}>Profile</Text>
          <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)} style={s.editBtn} disabled={isLoading}>
            {isLoading ? <ActivityIndicator size="small" color={Colors.accent} /> :
              <Text style={s.editText}>{editing ? 'Save' : 'Edit'}</Text>}
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
          <Text style={s.userName}>{user?.fullName}</Text>
          <Text style={s.userPhone}>{user?.phone}</Text>
        </View>

        {/* Info card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Personal Information</Text>
          <View style={s.field}>
            <Text style={s.fieldLabel}>FULL NAME</Text>
            {editing ? (
              <TextInput style={s.fieldInput} value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            ) : (
              <Text style={s.fieldValue}>{user?.fullName || '—'}</Text>
            )}
          </View>
          <View style={s.field}>
            <Text style={s.fieldLabel}>PHONE</Text>
            <Text style={s.fieldValue}>{user?.phone ? `+91 ${user.phone}` : '—'}</Text>
          </View>
          <View style={s.field}>
            <Text style={s.fieldLabel}>EMAIL</Text>
            {editing ? (
              <TextInput style={s.fieldInput} value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none" placeholder="Add email" />
            ) : (
              <Text style={s.fieldValue}>{user?.email || '—'}</Text>
            )}
          </View>
          <View style={[s.field, { borderBottomWidth: 0 }]}>
            <Text style={s.fieldLabel}>ROLE</Text>
            <Text style={s.fieldValue}>{user?.role?.replace('_', ' ').toUpperCase() || '—'}</Text>
          </View>
        </View>

        {editing && (
          <TouchableOpacity style={s.cancelBtn} onPress={() => { setEditing(false); setFullName(user?.fullName || ''); setEmail(user?.email || ''); }}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}

        {/* Account actions */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Account</Text>
          {[
            { icon: '🔔', label: 'Notifications', action: () => toast.info('Coming soon') },
            { icon: '🔒', label: 'Change Password', action: () => toast.info('Coming soon') },
            { icon: '❓', label: 'Help & Support', action: () => toast.info('Contact your gym staff') },
            { icon: '⭐', label: 'Rate the App', action: () => toast.info('Thank you for your support!') },
          ].map((item, i, arr) => (
            <TouchableOpacity key={item.label} style={[s.actionRow, i === arr.length - 1 && { borderBottomWidth: 0 }]} onPress={item.action}>
              <Text style={s.actionIcon}>{item.icon}</Text>
              <Text style={s.actionLabel}>{item.label}</Text>
              <Text style={s.actionArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

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
  scroll:       { padding: 20, paddingBottom: 40 },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title:        { fontSize: 24, fontWeight: '800', color: Colors.primary },
  editBtn:      { backgroundColor: Colors.accentLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  editText:     { fontSize: 13, fontWeight: '700', color: Colors.accent },
  avatarSection:{ alignItems: 'center', marginBottom: 28 },
  avatar:       { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.accent,
                  alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:   { fontSize: 32, fontWeight: '700', color: '#fff' },
  userName:     { fontSize: 20, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  userPhone:    { fontSize: 14, color: Colors.textSecondary },
  card:         { backgroundColor: Colors.surface, borderRadius: 16, padding: 20,
                  borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  cardTitle:    { fontSize: 13, fontWeight: '700', color: Colors.textSecondary,
                  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 },
  field:        { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  fieldLabel:   { fontSize: 10, fontWeight: '700', color: Colors.textMuted,
                  letterSpacing: 1, marginBottom: 4 },
  fieldValue:   { fontSize: 15, color: Colors.primary, fontWeight: '500' },
  fieldInput:   { fontSize: 15, color: Colors.primary, borderBottomWidth: 1.5,
                  borderBottomColor: Colors.accent, paddingVertical: 4 },
  cancelBtn:    { backgroundColor: Colors.surface, borderRadius: 12, height: 48,
                  alignItems: 'center', justifyContent: 'center', borderWidth: 1,
                  borderColor: Colors.border, marginBottom: 14 },
  cancelText:   { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  actionRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  actionIcon:   { fontSize: 20 },
  actionLabel:  { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.primary },
  actionArrow:  { fontSize: 20, color: Colors.textMuted },
  logoutBtn:    { backgroundColor: Colors.danger, borderRadius: 14, height: 54,
                  alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoutText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  version:      { textAlign: 'center', fontSize: 12, color: Colors.textMuted },
});