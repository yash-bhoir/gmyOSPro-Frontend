import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useToast } from '@/hooks/useToast';
import api from '@/services/api';

const GYM_ID = 'default';
const PAYMENT_MODES = ['cash', 'upi', 'card', 'bank'];
const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function BillingScreen() {
  const [members, setMembers]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected]   = useState<any>(null);
  const [amount, setAmount]       = useState('');
  const [mode, setMode]           = useState('cash');
  const [paying, setPaying]       = useState(false);
  const toast = useToast();

  const fetchExpired = async () => {
    try {
      const { data } = await api.get(`/gyms/${GYM_ID}/members`, { params: { status: 'expired' } });
      setMembers(data.data?.items || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchExpired(); }, []);

  const handleCollect = async () => {
    if (!amount || isNaN(Number(amount))) { toast.error('Enter valid amount'); return; }
    setPaying(true);
    try {
      // Update member status to active
      await api.put(`/gyms/${GYM_ID}/members/${selected._id}`, {
        status: 'active',
        planStartDate: new Date().toISOString().split('T')[0],
        planEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      });
      toast.success('Payment recorded! Member reactivated.');
      setSelected(null);
      setAmount('');
      fetchExpired();
    } catch (err: any) {
      toast.error('Failed', err?.response?.data?.message);
    } finally { setPaying(false); }
  };

  const renderItem = ({ item }: any) => {
    const user = item.userId || {};
    return (
      <View style={s.dueCard}>
        <View style={s.dueLeft}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0,2) || '?'}</Text>
          </View>
          <View>
            <Text style={s.dueName}>{user.fullName}</Text>
            <Text style={s.duePhone}>{user.phone}</Text>
            <Text style={s.duePlan}>{item.planName} · Expired {fmt(item.planEndDate)}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.collectBtn} onPress={() => { setSelected(item); setAmount(''); setMode('cash'); }}>
          <Text style={s.collectText}>Collect</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>Billing</Text>
        <Text style={s.sub}>Members with pending renewal</Text>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={Colors.accent} /></View>
        ) : (
          <FlatList
            data={members}
            renderItem={renderItem}
            keyExtractor={(i) => i._id}
            contentContainerStyle={s.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchExpired(); }} />}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyIcon}>✅</Text>
                <Text style={s.emptyTitle}>All dues cleared!</Text>
                <Text style={s.emptySub}>No pending renewals</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Payment modal */}
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Collect Payment</Text>
            <Text style={s.modalSub}>
              {selected?.userId?.fullName} · {selected?.planName}
            </Text>

            <Text style={s.label}>Amount (₹)</Text>
            <TextInput style={s.amountInput} value={amount} onChangeText={setAmount}
              keyboardType="numeric" placeholder="Enter amount" placeholderTextColor={Colors.textMuted} />

            <Text style={s.label}>Payment Mode</Text>
            <View style={s.modeRow}>
              {PAYMENT_MODES.map((m) => (
                <TouchableOpacity key={m} style={[s.modeBtn, mode === m && s.modeBtnActive]} onPress={() => setMode(m)}>
                  <Text style={[s.modeBtnText, mode === m && s.modeBtnTextActive]}>
                    {m === 'cash' ? '💵' : m === 'upi' ? '📲' : m === 'card' ? '💳' : '🏦'} {m.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setSelected(null)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.payBtn, paying && s.payBtnOff]} onPress={handleCollect} disabled={paying}>
                {paying ? <ActivityIndicator color="#fff" size="small" /> :
                  <Text style={s.payText}>Confirm ₹{amount || '0'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  container:     { flex: 1, padding: 16 },
  title:         { fontSize: 22, fontWeight: '800', color: Colors.primary, marginBottom: 2 },
  sub:           { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:          { paddingBottom: 20 },
  dueCard:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8,
                   borderWidth: 1, borderColor: Colors.border },
  dueLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar:        { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.dangerLight,
                   alignItems: 'center', justifyContent: 'center' },
  avatarText:    { fontSize: 15, fontWeight: '700', color: Colors.danger },
  dueName:       { fontSize: 15, fontWeight: '600', color: Colors.primary, marginBottom: 2 },
  duePhone:      { fontSize: 12, color: Colors.textSecondary },
  duePlan:       { fontSize: 11, color: Colors.danger, marginTop: 2 },
  collectBtn:    { backgroundColor: Colors.success, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  collectText:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  empty:         { alignItems: 'center', paddingTop: 60 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  emptySub:      { fontSize: 14, color: Colors.textSecondary },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:         { backgroundColor: Colors.surface, borderRadius: 24, padding: 24, margin: 12 },
  modalTitle:    { fontSize: 20, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  modalSub:      { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  label:         { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  amountInput:   { backgroundColor: Colors.background, borderRadius: 12, height: 54,
                   paddingHorizontal: 16, fontSize: 20, fontWeight: '700', color: Colors.primary,
                   borderWidth: 1.5, borderColor: Colors.border, marginBottom: 20 },
  modeRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  modeBtn:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                   borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  modeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeBtnText:   { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  modeBtnTextActive:{ color: '#fff' },
  modalBtns:     { flexDirection: 'row', gap: 10 },
  cancelBtn:     { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                   borderWidth: 1, borderColor: Colors.border },
  cancelText:    { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  payBtn:        { flex: 2, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                   backgroundColor: Colors.success },
  payBtnOff:     { opacity: 0.5 },
  payText:       { fontSize: 15, fontWeight: '700', color: '#fff' },
});