import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import api from '@/services/api';

const W = Dimensions.get('window').width - 40;
const fmtCurrency = (n: number) =>
  n >= 100000 ? `₹${(n/100000).toFixed(1)}L`
  : n >= 1000  ? `₹${(n/1000).toFixed(1)}K`
  : `₹${n}`;

export default function AdminRevenue() {
  const [months, setMonths]     = useState<any[]>([]);
  const [stats, setStats]       = useState<any>(null);
  const [loading, setLoading]   = useState(true);
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

  if (loading) {
    return <View style={s.loading}><ActivityIndicator size="large" color="#F59E0B" /></View>;
  }

  const chartData = {
    labels:   months.map(m => m.label),
    datasets: [{ data: months.map(m => Math.max(m.revenue || 0, 0)) }],
  };

  const totalRevenue  = months.reduce((a, m) => a + m.revenue, 0);
  const totalInvoices = months.reduce((a, m) => a + m.count, 0);
  const bestMonth     = [...months].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor="#F59E0B"
          />
        }
      >
        <Text style={s.title}>Revenue</Text>

        {/* Total revenue card */}
        <View style={s.totalCard}>
          <Text style={s.totalLabel}>6-MONTH REVENUE</Text>
          <Text style={s.totalValue}>{fmtCurrency(totalRevenue)}</Text>
          <Text style={s.totalSub}>{totalInvoices} invoices paid</Text>
        </View>

        {/* Bar chart — no formatYLabel on BarChart */}
        {months.length > 0 && (
          <View style={s.chartCard}>
            <Text style={s.chartTitle}>Monthly Revenue</Text>
            <BarChart
              data={chartData}
              width={W}
              height={200}
              yAxisLabel="₹"
              yAxisSuffix=""
              chartConfig={{
                backgroundColor:        '#111',
                backgroundGradientFrom: '#111',
                backgroundGradientTo:   '#111',
                decimalPlaces:          0,
                color:      (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.5})`,
                style: { borderRadius: 16 },
              }}
              style={{ borderRadius: 12, marginLeft: -8 }}
              showValuesOnTopOfBars
              withInnerLines={false}
            />
          </View>
        )}

        {/* Month breakdown */}
        <Text style={s.sectionTitle}>Month Breakdown</Text>
        {[...months].reverse().map((m) => (
          <View key={m.label} style={s.monthRow}>
            <View>
              <Text style={s.monthLabel}>{m.label}</Text>
              <Text style={s.monthCount}>{m.count} invoices</Text>
            </View>
            <View style={s.monthRight}>
              <Text style={s.monthRevenue}>{fmtCurrency(m.revenue)}</Text>
              {bestMonth?.label === m.label && m.revenue > 0 && (
                <Text style={s.bestBadge}>🏆 Best</Text>
              )}
            </View>
          </View>
        ))}

        {/* Platform summary */}
        <Text style={s.sectionTitle}>Platform Summary</Text>
        <View style={s.summaryGrid}>
          {[
            { label: 'Total Gyms',    value: stats?.gyms?.total    ?? 0 },
            { label: 'Active Gyms',   value: stats?.gyms?.active   ?? 0 },
            { label: 'Trial Gyms',    value: stats?.gyms?.trial    ?? 0 },
            { label: 'Total Members', value: stats?.members?.total ?? 0 },
          ].map(item => (
            <View key={item.label} style={s.summaryCard}>
              <Text style={s.summaryValue}>{item.value.toLocaleString('en-IN')}</Text>
              <Text style={s.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0A0A0A' },
  loading:      { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  scroll:       { padding: 20, paddingBottom: 40 },
  title:        { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 16 },
  totalCard:    { backgroundColor: '#F59E0B', borderRadius: 20, padding: 22, marginBottom: 16 },
  totalLabel:   { fontSize: 10, fontWeight: '700', color: 'rgba(0,0,0,0.5)', letterSpacing: 1.5, marginBottom: 6 },
  totalValue:   { fontSize: 42, fontWeight: '800', color: '#000', marginBottom: 4 },
  totalSub:     { fontSize: 13, color: 'rgba(0,0,0,0.5)' },
  chartCard:    { backgroundColor: '#111', borderRadius: 20, padding: 16, marginBottom: 20,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  chartTitle:   { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 12 },
  monthRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14,
                  marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  monthLabel:   { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 2 },
  monthCount:   { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  monthRight:   { alignItems: 'flex-end' },
  monthRevenue: { fontSize: 18, fontWeight: '800', color: '#F59E0B' },
  bestBadge:    { fontSize: 11, color: '#F59E0B', marginTop: 2 },
  summaryGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard:  { width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  summaryValue: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
});