import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal,
  TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAppContext } from '@/store/AppContext';
import { useStaffRole } from '@/hooks/useStaffRole';
import { useToast } from '@/hooks/useToast';
import api from '@/services/api';

type StaffRole = 'manager' | 'trainer' | 'front_desk' | 'accounts';

const ROLES: { key: StaffRole; label: string; icon: string; desc: string }[] = [
  { key: 'manager',    label: 'Manager',     icon: '👔', desc: 'Full access except owner settings' },
  { key: 'trainer',    label: 'Trainer',     icon: '💪', desc: 'View members, manage classes, check-in' },
  { key: 'front_desk', label: 'Front Desk',  icon: '🖥️', desc: 'Check-in, collect payments, view members' },
  { key: 'accounts',   label: 'Accounts',    icon: '📊', desc: 'Billing, invoices, revenue reports' },
];

const ROLE_COLORS: Record<string, string> = {
  owner:      Colors.primary,
  manager:    Colors.accent,
  trainer:    Colors.success,
  front_desk: Colors.warning,
  accounts:   '#8B5CF6',
};

const fmtDate = (d?: string) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

export default function StaffListScreen() {
  const { gymId } = useAppContext();
  const { permissions } = useStaffRole();
  const toast = useToast();

  const [staff, setStaff]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal]         = useState(false);

  // Invite form
  const [phone, setPhone]         = useState('');
  const [name, setName]           = useState('');
  const [role, setRole]           = useState<StaffRole>('front_desk');
  const [inviting, setInviting]   = useState(false);

  const fetchStaff = async () => {
    if (!gymId) { setLoading(false); return; }
    try {
      const { data } = await api.get(`/gyms/${gymId}/staff`);
      setStaff(data.data || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchStaff(); }, [gymId]);

  const handleInvite = async () => {
    if (phone.length !== 10) { toast.error('Enter valid 10-digit phone'); return; }
    if (!gymId) return;
    setInviting(true);
    try {
      await api.post(`/gyms/${gymId}/staff`, { phone, role, fullName: name || undefined });
      toast.success('Staff member invited!');
      setModal(false);
      setPhone(''); setName(''); setRole('front_desk');
      fetchStaff();
    } catch (err: any) {
      toast.error('Failed', err?.response?.data?.message || 'Please try again');
    } finally { setInviting(false); }
  };

  const handleChangeRole = (staffMember: any) => {
    Alert.alert(
      'Change Role',
      `Change role for ${staffMember.userId?.fullName}`,
      [
        ...ROLES.map(r => ({
          text: `${r.icon} ${r.label}`,
          onPress: async () => {
            try {
              await api.patch(`/gyms/${gymId}/staff/${staffMember._id}`, { role: r.key });
              toast.success('Role updated');
              fetchStaff();
            } catch { toast.error('Failed to update role'); }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRemove = (staffMember: any) => {
    Alert.alert(
      'Remove Staff',
      `Remove ${staffMember.userId?.fullName} from your gym?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/gyms/${gymId}/staff/${staffMember._id}`);
              toast.success('Staff member removed');
              fetchStaff();
            } catch { toast.error('Failed to remove staff'); }
          },
        },
      ]
    );
  };

  const renderStaff = ({ item }: any) => {
    const user     = item.userId || {};
    const roleInfo = ROLES.find(r => r.key === item.role);
    const initials = user.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?';
    const color    = ROLE_COLORS[item.role] || Colors.accent;

    return (
      <View style={s.staffCard}>
        <View style={s.staffLeft}>
          <View style={[s.avatar, { backgroundColor: color + '22' }]}>
            <Text style={[s.avatarText, { color }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.staffName}>{user.fullName}</Text>
            <Text style={s.staffPhone}>{user.phone}</Text>
            <View style={s.staffMeta}>
              <View style={[s.roleBadge, { backgroundColor: color + '22' }]}>
                <Text style={[s.roleText, { color }]}>
                  {roleInfo?.icon} {roleInfo?.label || item.role}
                </Text>
              </View>
              <Text style={s.joinDate}>Since {fmtDate(item.joinedAt)}</Text>
            </View>
          </View>
        </View>
        {permissions.canManageStaff && (
          <View style={s.staffActions}>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleChangeRole(item)}>
              <Text style={s.actionBtnText}>Role</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.removeBtn} onPress={() => handleRemove(item)}>
              <Text style={s.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Staff</Text>
            <Text style={s.sub}>{staff.filter(s => s.isActive).length} active members</Text>
          </View>
          {permissions.canManageStaff && (
            <TouchableOpacity style={s.inviteBtn} onPress={() => setModal(true)}>
              <Text style={s.inviteBtnText}>+ Invite</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Role legend */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={s.legendScroll} contentContainerStyle={s.legendRow}>
          {ROLES.map(r => (
            <View key={r.key} style={s.legendChip}>
              <Text style={s.legendIcon}>{r.icon}</Text>
              <Text style={s.legendLabel}>{r.label}</Text>
            </View>
          ))}
        </ScrollView>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={Colors.accent} /></View>
        ) : (
          <FlatList
            data={staff.filter((s: any) => s.isActive)}
            renderItem={renderStaff}
            keyExtractor={(i) => i._id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStaff(); }} />}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyIcon}>👔</Text>
                <Text style={s.emptyTitle}>No staff yet</Text>
                <Text style={s.emptySub}>Invite your team to get started</Text>
                {permissions.canManageStaff && (
                  <TouchableOpacity style={s.emptyBtn} onPress={() => setModal(true)}>
                    <Text style={s.emptyBtnText}>Invite Staff</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>

      {/* Invite Modal — only rendered for users with canManageStaff */}
      <Modal visible={modal && permissions.canManageStaff} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalWrap}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Invite Staff Member</Text>
            <Text style={s.modalSub}>They'll be able to log in with their phone number</Text>

            {/* Phone */}
            <Text style={s.fieldLabel}>PHONE NUMBER *</Text>
            <View style={s.phoneRow}>
              <Text style={s.phonePrefix}>+91</Text>
              <View style={s.phoneDivider} />
              <TextInput
                style={s.phoneInput}
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* Name */}
            <Text style={s.fieldLabel}>FULL NAME (optional)</Text>
            <TextInput
              style={s.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Staff member's name"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
            />

            {/* Role selection */}
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>ASSIGN ROLE</Text>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[s.roleOption, role === r.key && s.roleOptionActive]}
                onPress={() => setRole(r.key)}
              >
                <Text style={s.roleOptionIcon}>{r.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.roleOptionLabel, role === r.key && s.roleOptionLabelActive]}>
                    {r.label}
                  </Text>
                  <Text style={s.roleOptionDesc}>{r.desc}</Text>
                </View>
                {role === r.key && <Text style={s.roleCheck}>✓</Text>}
              </TouchableOpacity>
            ))}

            {/* Buttons */}
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setModal(false); setPhone(''); setName(''); }}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.sendBtn, (phone.length !== 10 || inviting) && s.sendBtnOff]}
                onPress={handleInvite}
                disabled={phone.length !== 10 || inviting}
              >
                {inviting ? <ActivityIndicator color="#fff" size="small" /> :
                  <Text style={s.sendBtnText}>Send Invite</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.background },
  container:         { flex: 1, padding: 16 },
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title:             { fontSize: 22, fontWeight: '800', color: Colors.primary },
  sub:               { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  inviteBtn:         { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  inviteBtnText:     { color: '#fff', fontSize: 13, fontWeight: '700' },
  legendScroll:      { marginHorizontal: -4, marginBottom: 14, maxHeight: 40 },
  legendRow:         { paddingHorizontal: 4, gap: 8, alignItems: 'center' },
  legendChip:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface,
                       paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
                       borderWidth: 1, borderColor: Colors.border },
  legendIcon:        { fontSize: 14 },
  legendLabel:       { fontSize: 11, fontWeight: '600', color: Colors.primary },
  center:            { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:              { paddingBottom: 20 },
  staffCard:         { backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginBottom: 10,
                       borderWidth: 1, borderColor: Colors.border },
  staffLeft:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar:            { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText:        { fontSize: 16, fontWeight: '700' },
  staffName:         { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  staffPhone:        { fontSize: 12, color: Colors.textSecondary, marginBottom: 6 },
  staffMeta:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleBadge:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  roleText:          { fontSize: 11, fontWeight: '700' },
  joinDate:          { fontSize: 11, color: Colors.textMuted },
  staffActions:      { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  actionBtn:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
                       borderWidth: 1, borderColor: Colors.border },
  actionBtnText:     { fontSize: 12, fontWeight: '600', color: Colors.primary },
  removeBtn:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
                       backgroundColor: Colors.dangerLight, borderWidth: 1, borderColor: Colors.dangerLight },
  removeBtnText:     { fontSize: 12, fontWeight: '600', color: Colors.danger },
  empty:             { alignItems: 'center', paddingTop: 60 },
  emptyIcon:         { fontSize: 48, marginBottom: 12 },
  emptyTitle:        { fontSize: 18, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  emptySub:          { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  emptyBtn:          { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText:      { color: '#fff', fontSize: 14, fontWeight: '700' },
  overlay:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalWrap:         { backgroundColor: Colors.surface, borderRadius: 24, padding: 24, margin: 8, maxHeight: '90%' },
  modalHandle:       { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:        { fontSize: 20, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  modalSub:          { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  fieldLabel:        { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1,
                       textTransform: 'uppercase', marginBottom: 8 },
  phoneRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background,
                       borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
                       height: 52, marginBottom: 16 },
  phonePrefix:       { paddingHorizontal: 14, fontSize: 15, fontWeight: '700', color: Colors.primary },
  phoneDivider:      { width: 1, height: 24, backgroundColor: Colors.border, marginRight: 12 },
  phoneInput:        { flex: 1, fontSize: 16, color: Colors.primary },
  nameInput:         { backgroundColor: Colors.background, borderRadius: 12, height: 52,
                       paddingHorizontal: 14, fontSize: 15, color: Colors.primary,
                       borderWidth: 1.5, borderColor: Colors.border, marginBottom: 4 },
  roleOption:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
                       borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
                       marginBottom: 8, backgroundColor: Colors.background },
  roleOptionActive:  { borderColor: Colors.primary, backgroundColor: Colors.surface },
  roleOptionIcon:    { fontSize: 22 },
  roleOptionLabel:   { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 2 },
  roleOptionLabelActive: { color: Colors.primary },
  roleOptionDesc:    { fontSize: 11, color: Colors.textMuted },
  roleCheck:         { fontSize: 16, color: Colors.primary, fontWeight: '700' },
  modalBtns:         { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn:         { flex: 1, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                       borderWidth: 1, borderColor: Colors.border },
  cancelText:        { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  sendBtn:           { flex: 2, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                       backgroundColor: Colors.primary },
  sendBtnOff:        { opacity: 0.4 },
  sendBtnText:       { color: '#fff', fontSize: 15, fontWeight: '700' },
});