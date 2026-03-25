import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import api from '@/services/api';

const fmt = (d?: string) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const STATUS_COLORS: Record<string, string> = {
  paid: Colors.success, sent: Colors.warning,
  overdue: Colors.danger, draft: Colors.textMuted,
};

export default function MemberInvoicesScreen() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get('/me/invoices');
      setInvoices(data.data || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchInvoices(); }, []);

  if (loading) {
    return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.accent} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safe}>
      <FlatList
        data={invoices}
        keyExtractor={(i) => i._id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInvoices(); }} />}
        ListHeaderComponent={<Text style={s.title}>My Invoices</Text>}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🧾</Text>
            <Text style={s.emptyTitle}>No invoices yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardLeft}>
              <Text style={s.invoiceNum}>{item.invoiceNumber}</Text>
              <Text style={s.invoiceDate}>{fmt(item.createdAt)}</Text>
              {item.planName && <Text style={s.planName}>{item.planName}</Text>}
              {item.paidAt && <Text style={s.paidDate}>Paid: {fmt(item.paidAt)}</Text>}
            </View>
            <View style={s.cardRight}>
              <Text style={s.amount}>₹{item.totalAmount?.toLocaleString('en-IN')}</Text>
              <View style={[s.badge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
                <Text style={[s.badgeText, { color: STATUS_COLORS[item.status] }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
              {item.paymentMode && <Text style={s.payMode}>{item.paymentMode}</Text>}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.background },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:        { padding: 16, paddingBottom: 32 },
  title:       { fontSize: 22, fontWeight: '800', color: Colors.primary, marginBottom: 16 },
  card:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                 backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 8,
                 borderWidth: 1, borderColor: Colors.border },
  cardLeft:    { flex: 1 },
  invoiceNum:  { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  invoiceDate: { fontSize: 12, color: Colors.textSecondary },
  planName:    { fontSize: 12, color: Colors.accent, marginTop: 2 },
  paidDate:    { fontSize: 11, color: Colors.success, marginTop: 2 },
  cardRight:   { alignItems: 'flex-end', gap: 4 },
  amount:      { fontSize: 18, fontWeight: '800', color: Colors.primary },
  badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText:   { fontSize: 10, fontWeight: '700' },
  payMode:     { fontSize: 10, color: Colors.textMuted },
  empty:       { alignItems: 'center', paddingTop: 60 },
  emptyIcon:   { fontSize: 40, marginBottom: 12 },
  emptyTitle:  { fontSize: 16, color: Colors.textSecondary },
});