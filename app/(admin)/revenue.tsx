import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/services/api';

const SCREEN_W = Dimensions.get('window').width;
const fmtCurrency = (n: number) =>
  n >= 100000 ? `₹${(n/100000).toFixed(1)}L`
  : n >= 1000  ? `₹${(n/1000).toFixed(1)}K`
  : `₹${n}`;

export default function AdminRevenue() {
  const [months, setMonths]       = useState<any[]>([]);
  const [stats, setStats]         = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [revRes, statsRes] = await Promise.all([
        api.get('/admin/revenue'),
        api.get('/admin/stats'),
      ]);
      setMonths(revRes.data.data || []);
      setStats(statsRes.data.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <View style={s.loading}><ActivityIndicator size="large" color="#F59E0B" /></View>
  );

  const totalRevenue  = months.reduce((a, m) => a + (m.revenue || 0), 0);
  const totalInvoices = months.reduce((a, m) => a + (m.count   || 0), 0);
  const maxRevenue    = Math.max(...months.map(m => m.revenue || 0), 1);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#F59E0B" />}
      >
        <Text style={s.title}>Revenue</Text>

        {/* Total card */}
        <View style={s.totalCard}>
          <Text style={s.totalLabel}>6-MONTH REVENUE</Text>
          <Text style={s.totalValue}>{fmtCurrency(totalRevenue)}</Text>
          <Text style={s.totalSub}>{totalInvoices} invoices paid</Text>
        </View>

        {/* Custom bar chart — no library, no overflow */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>Monthly Breakdown</Text>
          <View style={s.chartArea}>
            {months.map((m, i) => {
              const pct = maxRevenue > 0 ? (m.revenue / maxRevenue) : 0;
              const barH = Math.max(4, pct * 120);
              return (
                <View key={i} style={s.barCol}>
                  <Text style={s.barValue}>{m.revenue > 0 ? fmtCurrency(m.revenue) : ''}</Text>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { height: barH, opacity: i === months.length - 1 ? 1 : 0.6 }]} />
                  </View>
                  <Text style={s.barLabel}>{m.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Month-by-month table */}
        <View style={s.tableCard}>
          <Text style={s.chartTitle}>Month Details</Text>
          {months.map((m, i) => (
            <View key={i} style={[s.tableRow, i < months.length - 1 && { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }]}>
              <Text style={s.tableMonth}>{m.label}</Text>
              <Text style={s.tableCount}>{m.count} invoices</Text>
              <Text style={[s.tableRevenue, m.revenue > 0 && { color: '#F59E0B' }]}>{fmtCurrency(m.revenue)}</Text>
            </View>
          ))}
        </View>

        {/* Platform summary */}
        <View style={s.summaryGrid}>
          {[
            { label: 'Total Gyms',    value: stats?.gyms?.total    ?? 0, color: '#F59E0B' },
            { label: 'Active Gyms',   value: stats?.gyms?.active   ?? 0, color: '#22C55E' },
            { label: 'Trial Gyms',    value: stats?.gyms?.trial    ?? 0, color: '#6366F1' },
            { label: 'Total Members', value: stats?.members?.total ?? 0, color: '#3B82F6' },
          ].map((item) => (
            <View key={item.label} style={s.summaryCard}>
              <Text style={[s.summaryValue, { color: item.color }]}>{item.value}</Text>
              <Text style={s.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#0A0A0A' },
  loading:       { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  scroll:        { padding: 20, paddingBottom: 32 },
  title:         { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 16 },
  totalCard:     { backgroundColor: '#F59E0B', borderRadius: 20, padding: 22, marginBottom: 14 },
  totalLabel:    { fontSize: 10, fontWeight: '700', color: 'rgba(0,0,0,0.5)', letterSpacing: 1.5, marginBottom: 6 },
  totalValue:    { fontSize: 40, fontWeight: '800', color: '#000', marginBottom: 4 },
  totalSub:      { fontSize: 13, color: 'rgba(0,0,0,0.5)' },
  chartCard:     { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16,
                   marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  chartTitle:    { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  chartArea:     { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 160 },
  barCol:        { flex: 1, alignItems: 'center' },
  barValue:      { fontSize: 8, color: '#F59E0B', marginBottom: 4, textAlign: 'center' },
  barTrack:      { width: '60%', height: 120, justifyContent: 'flex-end' },
  barFill:       { width: '100%', backgroundColor: '#F59E0B', borderRadius: 4 },
  barLabel:      { fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 6, textAlign: 'center' },
  tableCard:     { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16,
                   marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  tableRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  tableMonth:    { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  tableCount:    { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginRight: 12 },
  tableRevenue:  { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.5)', minWidth: 60, textAlign: 'right' },
  summaryGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard:   { width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
                   padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  summaryValue:  { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  summaryLabel:  { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
});