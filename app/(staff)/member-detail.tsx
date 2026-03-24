import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useToast } from '@/hooks/useToast';
import api from '@/services/api';

const GYM_ID = 'default';
const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const daysLeft = (d?: string) => d ? Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)) : 0;

const STATUS_COLORS: Record<string, string> = {
  active: Colors.success, expired: Colors.danger, frozen: Colors.warning, cancelled: Colors.textMuted,
};

export default function MemberDetailScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const [member, setMember]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const toast = useToast();

  useEffect(() => {
    api.get(`/gyms/${GYM_ID}/members/${memberId}`)
      .then(({ data }) => setMember(data.data))
      .catch(() => toast.error('Failed to load member'))
      .finally(() => setLoading(false));
  }, [memberId]);

  const handleCheckin = async () => {
    try {
      await api.post(`/gyms/${GYM_ID}/members/${memberId}/checkin`, { method: 'manual' });
      toast.success('Check-in recorded!');
    } catch (err: any) {
      toast.error('Check-in failed', err?.response?.data?.message);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    Alert.alert('Change Status', `Set member status to ${newStatus}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', onPress: async () => {
          try {
            const { data } = await api.put(`/gyms/${GYM_ID}/members/${memberId}`, { status: newStatus });
            setMember(data.data);
            toast.success('Status updated');
          } catch { toast.error('Failed to update status'); }
        }
      }
    ]);
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.accent} /></View></SafeAreaView>;
  if (!member) return <SafeAreaView style={s.safe}><View style={s.center}><Text>Member not found</Text></View></SafeAreaView>;

  const user    = member.userId || {};
  const days    = daysLeft(member.planEndDate);
  const initials = user.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Member Detail</Text>
        <TouchableOpacity onPress={handleCheckin} style={s.checkinBtn}>
          <Text style={s.checkinText}>Check In</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={s.profileCard}>
          <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
          <Text style={s.memberName}>{user.fullName}</Text>
          <Text style={s.memberPhone}>{user.phone}</Text>
          {user.email && <Text style={s.memberEmail}>{user.email}</Text>}
          <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[member.status] + '33' }]}>
            <Text style={[s.statusText, { color: STATUS_COLORS[member.status] }]}>
              {member.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Membership details */}
        <Text style={s.sectionTitle}>Membership Details</Text>
        <View style={s.card}>
          {[
            { label: 'Member Code', value: member.memberCode },
            { label: 'Plan',        value: member.planName || '—' },
            { label: 'Start Date',  value: fmt(member.planStartDate) },
            { label: 'End Date',    value: fmt(member.planEndDate) },
            { label: 'Days Left',   value: `${days} days` },
            { label: 'Total Check-ins', value: member.totalCheckIns?.toString() || '0' },
          ].map((row, i, arr) => (
            <View key={row.label} style={[s.row, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.rowLabel}>{row.label}</Text>
              <Text style={s.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Emergency contact */}
        {member.emergencyContact?.name && (
          <>
            <Text style={s.sectionTitle}>Emergency Contact</Text>
            <View style={s.card}>
              {[
                { label: 'Name',     value: member.emergencyContact.name },
                { label: 'Phone',    value: member.emergencyContact.phone },
                { label: 'Relation', value: member.emergencyContact.relation },
              ].map((row, i, arr) => (
                <View key={row.label} style={[s.row, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={s.rowLabel}>{row.label}</Text>
                  <Text style={s.rowValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Health notes */}
        {member.healthNotes && (
          <>
            <Text style={s.sectionTitle}>Health Notes</Text>
            <View style={[s.card, { padding: 14 }]}><Text style={s.notesText}>{member.healthNotes}</Text></View>
          </>
        )}

        {/* Status actions */}
        <Text style={s.sectionTitle}>Actions</Text>
        <View style={s.actionsCard}>
          {[
            { label: 'Mark Active',   status: 'active',    color: Colors.success },
            { label: 'Freeze',        status: 'frozen',    color: Colors.warning },
            { label: 'Mark Expired',  status: 'expired',   color: Colors.danger },
            { label: 'Cancel',        status: 'cancelled', color: Colors.textMuted },
          ].filter(a => a.status !== member.status).map((a) => (
            <TouchableOpacity key={a.status} style={[s.actionBtn, { borderColor: a.color }]} onPress={() => handleStatusChange(a.status)}>
              <Text style={[s.actionBtnText, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.background },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 },
  back:         { fontSize: 15, color: Colors.textSecondary },
  title:        { fontSize: 17, fontWeight: '700', color: Colors.primary },
  checkinBtn:   { backgroundColor: Colors.success, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  checkinText:  { color: '#fff', fontSize: 13, fontWeight: '700' },
  scroll:       { padding: 16, paddingBottom: 40 },
  profileCard:  { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, alignItems: 'center',
                  borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  avatar:       { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.accent,
                  alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:   { fontSize: 28, fontWeight: '700', color: '#fff' },
  memberName:   { fontSize: 20, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  memberPhone:  { fontSize: 14, color: Colors.textSecondary, marginBottom: 2 },
  memberEmail:  { fontSize: 13, color: Colors.textMuted, marginBottom: 10 },
  statusBadge:  { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  statusText:   { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted,
                  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 8 },
  card:         { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLabel:     { fontSize: 13, color: Colors.textSecondary },
  rowValue:     { fontSize: 13, fontWeight: '600', color: Colors.primary },
  notesText:    { fontSize: 14, color: Colors.primary, lineHeight: 22 },
  actionsCard:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn:    { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  actionBtnText:{ fontSize: 13, fontWeight: '700' },
});