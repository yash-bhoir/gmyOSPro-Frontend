import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAppContext } from '@/store/AppContext';
import { useToast } from '@/hooks/useToast';
import api from '@/services/api';

type Tab = 'dues' | 'invoices' | 'revenue';
const PAYMENT_MODES = [
  { key: 'cash',     icon: '💵', label: 'Cash' },
  { key: 'upi',      icon: '📲', label: 'UPI' },
  { key: 'card',     icon: '💳', label: 'Card' },
  { key: 'bank',     icon: '🏦', label: 'Bank' },
  { key: 'razorpay', icon: '⚡', label: 'Razorpay' },
];

const fmt = (d?: string) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const STATUS_COLORS: Record<string, string> = {
  paid:    Colors.success,
  sent:    Colors.warning,
  overdue: Colors.danger,
  draft:   Colors.textMuted,
  void:    Colors.textMuted,
};

export default function BillingScreen() {
  const { gymId } = useAppContext();
  const toast = useToast();

  const [tab, setTab]           = useState<Tab>('dues');
  const [dues, setDues]         = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [revenue, setRevenue]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Payment modal
  const [selected, setSelected] = useState<any>(null);
  const [amount, setAmount]     = useState('');
  const [mode, setMode]         = useState('cash');
  const [extendDays, setExtendDays] = useState('30');
  const [paying, setPaying]     = useState(false);

  const fetchAll = async () => {
    if (!gymId) { setLoading(false); return; }
    try {
      const [duesRes, invRes, revRes] = await Promise.all([
        api.get(`/gyms/${gymId}/members`, { params: { status: 'expired' } }),
        api.get(`/gyms/${gymId}/invoices`, { params: { limit: 30 } }),
        api.get(`/gyms/${gymId}/revenue`),
      ]);
      setDues(duesRes.data.data?.items || []);
      setInvoices(invRes.data.data?.items || []);
      setRevenue(revRes.data.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchAll(); }, [gymId]);

  const openCollect = (member: any) => {
    setSelected(member);
    setAmount('');
    setMode('cash');
    setExtendDays('30');
  };

  const handleCollect = async () => {
    if (!amount || isNaN(Number(amount))) { toast.error('Enter valid amount'); return; }
    if (!gymId) return;
    setPaying(true);
    try {
      if (mode === 'razorpay') {
        // Create Razorpay order
        const { data } = await api.post(`/gyms/${gymId}/razorpay/order`, {
          memberId:   selected._id,
          amount:     parseInt(amount),
          planName:   selected.planName || 'Membership Renewal',
          extendDays: parseInt(extendDays),
        });
        toast.info('Razorpay', `Order created: ${data.data.orderId}\nShare payment link with member`);
        setSelected(null);
        fetchAll();
      } else {
        // Create invoice + record offline payment
        const invRes = await api.post(`/gyms/${gymId}/invoices`, {
          memberId:   selected._id,
          subtotal:   parseInt(amount),
          planName:   selected.planName || 'Membership Renewal',
          extendDays: parseInt(extendDays),
        });
        await api.post(`/gyms/${gymId}/invoices/${invRes.data.data._id}/pay`, {
          paymentMode: mode,
          extendDays:  parseInt(extendDays),
        });
        toast.success('Payment recorded! Member reactivated.');
        setSelected(null);
        fetchAll();
      }
    } catch (err: any) {
      toast.error('Failed', err?.response?.data?.message || 'Please try again');
    } finally { setPaying(false); }
  };

  const renderDueItem = ({ item }: any) => {
    const user = item.userId || {};
    const initials = user.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?';
    return (
      <View style={s.dueCard}>
        <View style={s.dueLeft}>
          <View style={s.dueAvatar}>
            <Text style={s.dueAvatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.dueName}>{user.fullName}</Text>
            <Text style={s.duePhone}>{user.phone}</Text>
            <Text style={s.duePlan}>{item.planName || 'Plan'} · Expired {fmt(item.planEndDate)}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.collectBtn} onPress={() => openCollect(item)}>
          <Text style={s.collectText}>Collect</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderInvoice = ({ item }: any) => (
    <View style={s.invoiceCard}>
      <View style={s.invoiceLeft}>
        <Text style={s.invoiceNum}>{item.invoiceNumber}</Text>
        <Text style={s.invoiceDate}>{fmt(item.createdAt)}</Text>
        {item.planName && <Text style={s.invoicePlan}>{item.planName}</Text>}
      </View>
      <View style={s.invoiceRight}>
        <Text style={s.invoiceAmount}>₹{item.totalAmount?.toLocaleString('en-IN')}</Text>
        <View style={[s.statusChip, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
          <Text style={[s.statusChipText, { color: STATUS_COLORS[item.status] }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
        {item.paymentMode && (
          <Text style={s.payMode}>{item.paymentMode}</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>Billing</Text>

        {/* Tabs */}
        <View style={s.tabRow}>
          {([['dues','Dues'], ['invoices','Invoices'], ['revenue','Revenue']] as [Tab, string][]).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[s.tabBtn, tab === key && s.tabBtnActive]}
              onPress={() => setTab(key)}
            >
              <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
              {key === 'dues' && dues.length > 0 && (
                <View style={s.tabBadge}>
                  <Text style={s.tabBadgeText}>{dues.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={Colors.accent} /></View>
        ) : (
          <>
            {/* DUES TAB */}
            {tab === 'dues' && (
              <FlatList
                data={dues}
                renderItem={renderDueItem}
                keyExtractor={(i) => i._id}
                contentContainerStyle={s.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}
                ListEmptyComponent={
                  <View style={s.empty}>
                    <Text style={s.emptyIcon}>✅</Text>
                    <Text style={s.emptyTitle}>All clear!</Text>
                    <Text style={s.emptySub}>No pending dues</Text>
                  </View>
                }
              />
            )}

            {/* INVOICES TAB */}
            {tab === 'invoices' && (
              <FlatList
                data={invoices}
                renderItem={renderInvoice}
                keyExtractor={(i) => i._id}
                contentContainerStyle={s.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}
                ListEmptyComponent={
                  <View style={s.empty}>
                    <Text style={s.emptyIcon}>🧾</Text>
                    <Text style={s.emptyTitle}>No invoices yet</Text>
                    <Text style={s.emptySub}>Collect payments to generate invoices</Text>
                  </View>
                }
              />
            )}

            {/* REVENUE TAB */}
            {tab === 'revenue' && (
              <ScrollView
                contentContainerStyle={s.revenueScroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}
              >
                <View style={s.revenueCard}>
                  <Text style={s.revenueLabel}>Total Revenue</Text>
                  <Text style={s.revenueTotal}>
                    ₹{(revenue?.totalRevenue ?? 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={s.revenueGrid}>
                  {[
                    { label: 'This Month', value: revenue?.thisMonthRevenue ?? 0,  color: Colors.success },
                    { label: 'Last Month', value: revenue?.lastMonthRevenue ?? 0,  color: Colors.accent },
                    { label: 'Total Invoices', value: revenue?.totalInvoices ?? 0, color: Colors.primary, isCount: true },
                    { label: 'Collection Rate', value: revenue?.collectionRate ?? 0, color: Colors.warning, isPct: true },
                  ].map((item) => (
                    <View key={item.label} style={s.revenueStatCard}>
                      <Text style={[s.revenueStatValue, { color: item.color }]}>
                        {item.isCount ? item.value : item.isPct ? `${item.value}%` : `₹${item.value.toLocaleString('en-IN')}`}
                      </Text>
                      <Text style={s.revenueStatLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </>
        )}
      </View>

      {/* Payment modal */}
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={s.overlay}>
          <ScrollView contentContainerStyle={s.modalWrap} keyboardShouldPersistTaps="handled">
            <View style={s.modal}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>Collect Payment</Text>
              <Text style={s.modalSub}>
                {selected?.userId?.fullName} · {selected?.planName || 'Renewal'}
              </Text>

              {/* Amount */}
              <Text style={s.modalLabel}>AMOUNT (₹)</Text>
              <TextInput
                style={s.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={Colors.textMuted}
              />

              {/* Extend days */}
              <Text style={s.modalLabel}>EXTEND MEMBERSHIP BY</Text>
              <View style={s.daysRow}>
                {['30','60','90','180','365'].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[s.dayChip, extendDays === d && s.dayChipActive]}
                    onPress={() => setExtendDays(d)}
                  >
                    <Text style={[s.dayChipText, extendDays === d && s.dayChipTextActive]}>
                      {d === '365' ? '1 Year' : `${d}d`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Payment mode */}
              <Text style={s.modalLabel}>PAYMENT MODE</Text>
              <View style={s.modeGrid}>
                {PAYMENT_MODES.map((m) => (
                  <TouchableOpacity
                    key={m.key}
                    style={[s.modeBtn, mode === m.key && s.modeBtnActive]}
                    onPress={() => setMode(m.key)}
                  >
                    <Text style={s.modeIcon}>{m.icon}</Text>
                    <Text style={[s.modeLabel, mode === m.key && s.modeLabelActive]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Summary */}
              {amount ? (
                <View style={s.summary}>
                  <Text style={s.summaryText}>
                    ₹{parseInt(amount || '0').toLocaleString('en-IN')} via {mode.toUpperCase()} · extend {extendDays} days
                  </Text>
                </View>
              ) : null}

              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setSelected(null)}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.payBtn, (!amount || paying) && s.payBtnOff]}
                  onPress={handleCollect}
                  disabled={!amount || paying}
                >
                  {paying ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={s.payText}>
                      {mode === 'razorpay' ? 'Create Order' : `Confirm ₹${amount || '0'}`}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.background },
  container:        { flex: 1, padding: 16 },
  title:            { fontSize: 22, fontWeight: '800', color: Colors.primary, marginBottom: 14 },
  tabRow:           { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12,
                      padding: 4, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  tabBtn:           { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
                      flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabBtnActive:     { backgroundColor: Colors.primary },
  tabText:          { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive:    { color: '#fff' },
  tabBadge:         { backgroundColor: Colors.danger, borderRadius: 10, minWidth: 18,
                      height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeText:     { fontSize: 10, fontWeight: '700', color: '#fff' },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:             { paddingBottom: 20 },

  // Dues
  dueCard:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8,
                      borderWidth: 1, borderColor: Colors.border },
  dueLeft:          { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dueAvatar:        { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.dangerLight,
                      alignItems: 'center', justifyContent: 'center' },
  dueAvatarText:    { fontSize: 15, fontWeight: '700', color: Colors.danger },
  dueName:          { fontSize: 14, fontWeight: '600', color: Colors.primary, marginBottom: 2 },
  duePhone:         { fontSize: 12, color: Colors.textSecondary },
  duePlan:          { fontSize: 11, color: Colors.danger, marginTop: 2 },
  collectBtn:       { backgroundColor: Colors.success, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  collectText:      { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Invoices
  invoiceCard:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8,
                      borderWidth: 1, borderColor: Colors.border },
  invoiceLeft:      { flex: 1 },
  invoiceNum:       { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  invoiceDate:      { fontSize: 12, color: Colors.textSecondary },
  invoicePlan:      { fontSize: 11, color: Colors.accent, marginTop: 2 },
  invoiceRight:     { alignItems: 'flex-end', gap: 4 },
  invoiceAmount:    { fontSize: 16, fontWeight: '800', color: Colors.primary },
  statusChip:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusChipText:   { fontSize: 10, fontWeight: '700' },
  payMode:          { fontSize: 10, color: Colors.textMuted },

  // Revenue
  revenueScroll:    { paddingBottom: 20 },
  revenueCard:      { backgroundColor: Colors.primary, borderRadius: 20, padding: 24, marginBottom: 14, alignItems: 'center' },
  revenueLabel:     { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  revenueTotal:     { fontSize: 36, fontWeight: '800', color: '#fff' },
  revenueGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  revenueStatCard:  { width: '47%', backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
                      borderWidth: 1, borderColor: Colors.border },
  revenueStatValue: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  revenueStatLabel: { fontSize: 12, color: Colors.textSecondary },

  // Empty
  empty:            { alignItems: 'center', paddingTop: 60 },
  emptyIcon:        { fontSize: 48, marginBottom: 12 },
  emptyTitle:       { fontSize: 18, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  emptySub:         { fontSize: 14, color: Colors.textSecondary },

  // Modal
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalWrap:        { justifyContent: 'flex-end' },
  modal:            { backgroundColor: Colors.surface, borderRadius: 24, padding: 24, margin: 8 },
  modalHandle:      { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:       { fontSize: 20, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  modalSub:         { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  modalLabel:       { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1,
                      textTransform: 'uppercase', marginBottom: 8 },
  amountInput:      { backgroundColor: Colors.background, borderRadius: 12, height: 56,
                      paddingHorizontal: 16, fontSize: 22, fontWeight: '700', color: Colors.primary,
                      borderWidth: 1.5, borderColor: Colors.border, marginBottom: 20 },
  daysRow:          { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  dayChip:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                      borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  dayChipActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayChipText:      { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  dayChipTextActive:{ color: '#fff' },
  modeGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  modeBtn:          { width: '30%', paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                      borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  modeBtnActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeIcon:         { fontSize: 20, marginBottom: 4 },
  modeLabel:        { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  modeLabelActive:  { color: '#fff' },
  summary:          { backgroundColor: Colors.accentLight, borderRadius: 10, padding: 12, marginBottom: 16 },
  summaryText:      { fontSize: 13, color: Colors.accent, fontWeight: '600', textAlign: 'center' },
  modalBtns:        { flexDirection: 'row', gap: 10 },
  cancelBtn:        { flex: 1, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                      borderWidth: 1, borderColor: Colors.border },
  cancelText:       { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  payBtn:           { flex: 2, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: Colors.success },
  payBtnOff:        { opacity: 0.4 },
  payText:          { color: '#fff', fontSize: 15, fontWeight: '700' },
});