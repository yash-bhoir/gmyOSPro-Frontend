import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors } from '@/constants/colors';
import { useAppContext } from '@/store/AppContext';
import api from '@/services/api';

const W = Dimensions.get('window').width - 40;

const chartConfig = {
  backgroundColor:      Colors.surface,
  backgroundGradientFrom:Colors.surface,
  backgroundGradientTo: Colors.surface,
  decimalPlaces:        0,
  color:      (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  style:      { borderRadius: 16 },
  propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.accent },
};

const fmtCurrency = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K`
  : `₹${n}`;

const fmtDate = (d?: string) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  : '—';

export default function ReportsScreen() {
  const { gymId } = useAppContext();
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeChart, setActiveChart] = useState<'revenue' | 'members' | 'checkins'>('revenue');

  const fetchData = async () => {
    if (!gymId) { setLoading(false); return; }
    try {
      const res = await api.get(`/gyms/${gymId}/analytics`);
      setData(res.data.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, [gymId]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator size="large" color={Colors.accent} /></View>
      </SafeAreaView>
    );
  }

  const revenueChartData = data?.revenueMonths ? {
    labels:   data.revenueMonths.map((m: any) => m.label),
    datasets: [{ data: data.revenueMonths.map((m: any) => m.revenue || 0) }],
  } : null;

  const memberChartData = data?.memberMonths ? {
    labels:   data.memberMonths.map((m: any) => m.label),
    datasets: [{ data: data.memberMonths.map((m: any) => m.newMembers || 0) }],
  } : null;

  const checkinChartData = data?.dayOfWeek ? {
    labels:   data.dayOfWeek.map((d: any) => d.label),
    datasets: [{ data: data.dayOfWeek.map((d: any) => d.count || 0) }],
  } : null;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        <Text style={s.title}>Reports</Text>

        {/* KPI summary cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.kpiScroll} contentContainerStyle={s.kpiRow}>
          {[
            { label: 'Active Members',   value: data?.totalActive ?? 0,    color: Colors.success,  icon: '👥' },
            { label: 'Expired Members',  value: data?.totalExpired ?? 0,   color: Colors.danger,   icon: '✗' },
            { label: 'Check-ins Today',  value: data?.checkInsToday ?? 0,  color: Colors.accent,   icon: '✓' },
            { label: 'Expiring in 7d',   value: data?.expiring7 ?? 0,      color: Colors.warning,  icon: '⚠️' },
            { label: 'Expiring in 30d',  value: data?.expiring30 ?? 0,     color: Colors.warning,  icon: '📅' },
          ].map((k) => (
            <View key={k.label} style={s.kpiCard}>
              <Text style={s.kpiIcon}>{k.icon}</Text>
              <Text style={[s.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={s.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Chart type switcher */}
        <View style={s.chartSwitcher}>
          {([
            ['revenue', 'Revenue'],
            ['members', 'New Members'],
            ['checkins', 'Check-ins'],
          ] as [typeof activeChart, string][]).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[s.switchBtn, activeChart === key && s.switchBtnActive]}
              onPress={() => setActiveChart(key)}
            >
              <Text style={[s.switchText, activeChart === key && s.switchTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Revenue chart */}
        {activeChart === 'revenue' && revenueChartData && (
          <View style={s.chartCard}>
            <Text style={s.chartTitle}>Revenue — Last 6 Months</Text>
            <LineChart
              data={revenueChartData}
              width={W}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={s.chart}
              formatYLabel={(v) => fmtCurrency(parseInt(v))}
              withInnerLines={false}
            />
            <View style={s.chartSummary}>
              {data.revenueMonths.slice(-3).map((m: any) => (
                <View key={m.label} style={s.chartSummaryItem}>
                  <Text style={s.chartSummaryLabel}>{m.label}</Text>
                  <Text style={s.chartSummaryValue}>{fmtCurrency(m.revenue)}</Text>
                  <Text style={s.chartSummaryCount}>{m.count} invoices</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Member growth chart */}
        {activeChart === 'members' && memberChartData && (
          <View style={s.chartCard}>
            <Text style={s.chartTitle}>New Members — Last 6 Months</Text>
            <BarChart
              data={memberChartData}
              width={W}
              height={200}
              chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(34,197,94,${opacity})` }}
              style={s.chart}
              showValuesOnTopOfBars
              withInnerLines={false}
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>
        )}

        {/* Check-ins by day of week */}
        {activeChart === 'checkins' && checkinChartData && (
          <View style={s.chartCard}>
            <Text style={s.chartTitle}>Check-ins by Day of Week (last 30 days)</Text>
            <BarChart
              data={checkinChartData}
              width={W}
              height={200}
              chartConfig={chartConfig}
              style={s.chart}
              showValuesOnTopOfBars
              withInnerLines={false}
              yAxisLabel=""
              yAxisSuffix=""
            />
            {/* Peak day */}
            {data.dayOfWeek && (() => {
              const peak = [...data.dayOfWeek].sort((a: any, b: any) => b.count - a.count)[0];
              return peak?.count > 0 ? (
                <View style={s.peakDay}>
                  <Text style={s.peakDayText}>
                    🏆 Busiest day: <Text style={s.peakDayBold}>{peak.label}</Text> with {peak.count} check-ins
                  </Text>
                </View>
              ) : null;
            })()}
          </View>
        )}

        {/* Expiring members list */}
        {data?.expiringList?.length > 0 && (
          <>
            <Text style={s.sectionTitle}>⚠️ Expiring in 30 days ({data.expiringList.length})</Text>
            {data.expiringList.slice(0, 10).map((member: any) => {
              const user    = member.userId || {};
              const daysLeft = Math.max(0, Math.ceil((new Date(member.planEndDate).getTime() - Date.now()) / 86400000));
              const initials = user.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?';
              return (
                <View key={member._id} style={s.expiringRow}>
                  <View style={[s.expiringAvatar, daysLeft <= 7 && s.expiringAvatarUrgent]}>
                    <Text style={[s.expiringAvatarText, daysLeft <= 7 && s.expiringAvatarTextUrgent]}>
                      {initials}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.expiringName}>{user.fullName}</Text>
                    <Text style={s.expiringPhone}>{user.phone}</Text>
                  </View>
                  <View style={s.expiringRight}>
                    <Text style={[s.expiringDays, daysLeft <= 7 && { color: Colors.danger }]}>
                      {daysLeft}d left
                    </Text>
                    <Text style={s.expiringDate}>{fmtDate(member.planEndDate)}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Top members */}
        {data?.topMembers?.length > 0 && (
          <>
            <Text style={s.sectionTitle}>🏆 Top Members by Check-ins</Text>
            {data.topMembers.slice(0, 5).map((member: any, i: number) => {
              const user    = member.userId || {};
              const initials = user.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?';
              const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
              return (
                <View key={member._id} style={s.topMemberRow}>
                  <Text style={s.medal}>{medals[i]}</Text>
                  <View style={s.topAvatar}>
                    <Text style={s.topAvatarText}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.topName}>{user.fullName}</Text>
                    <Text style={s.topPhone}>{user.phone}</Text>
                  </View>
                  <View style={s.checkinsBox}>
                    <Text style={s.checkinsCount}>{member.totalCheckIns}</Text>
                    <Text style={s.checkinsLabel}>check-ins</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: Colors.background },
  center:             { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:             { padding: 20, paddingBottom: 40 },
  title:              { fontSize: 22, fontWeight: '800', color: Colors.primary, marginBottom: 16 },

  kpiScroll:          { marginHorizontal: -20, marginBottom: 20 },
  kpiRow:             { paddingHorizontal: 20, gap: 10 },
  kpiCard:            { width: 120, backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
                        borderWidth: 1, borderColor: Colors.border },
  kpiIcon:            { fontSize: 20, marginBottom: 6 },
  kpiValue:           { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  kpiLabel:           { fontSize: 11, color: Colors.textSecondary, lineHeight: 14 },

  chartSwitcher:      { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12,
                        padding: 4, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  switchBtn:          { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  switchBtnActive:    { backgroundColor: Colors.primary },
  switchText:         { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  switchTextActive:   { color: '#fff' },

  chartCard:          { backgroundColor: Colors.surface, borderRadius: 20, padding: 16, marginBottom: 20,
                        borderWidth: 1, borderColor: Colors.border },
  chartTitle:         { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 14 },
  chart:              { borderRadius: 12, marginLeft: -8 },
  chartSummary:       { flexDirection: 'row', marginTop: 14, gap: 0 },
  chartSummaryItem:   { flex: 1, alignItems: 'center' },
  chartSummaryLabel:  { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  chartSummaryValue:  { fontSize: 15, fontWeight: '700', color: Colors.primary },
  chartSummaryCount:  { fontSize: 10, color: Colors.textSecondary },

  peakDay:            { backgroundColor: Colors.accentLight, borderRadius: 10, padding: 10, marginTop: 12 },
  peakDayText:        { fontSize: 13, color: Colors.accent, textAlign: 'center' },
  peakDayBold:        { fontWeight: '700' },

  sectionTitle:       { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 12, marginTop: 4 },

  expiringRow:        { flexDirection: 'row', alignItems: 'center', gap: 12,
                        backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 8,
                        borderWidth: 1, borderColor: Colors.border },
  expiringAvatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.warningLight,
                        alignItems: 'center', justifyContent: 'center' },
  expiringAvatarUrgent:{ backgroundColor: Colors.dangerLight },
  expiringAvatarText: { fontSize: 14, fontWeight: '700', color: Colors.warning },
  expiringAvatarTextUrgent:{ color: Colors.danger },
  expiringName:       { fontSize: 14, fontWeight: '600', color: Colors.primary, marginBottom: 2 },
  expiringPhone:      { fontSize: 12, color: Colors.textSecondary },
  expiringRight:      { alignItems: 'flex-end' },
  expiringDays:       { fontSize: 14, fontWeight: '700', color: Colors.warning },
  expiringDate:       { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  topMemberRow:       { flexDirection: 'row', alignItems: 'center', gap: 10,
                        backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 8,
                        borderWidth: 1, borderColor: Colors.border },
  medal:              { fontSize: 22 },
  topAvatar:          { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.accentLight,
                        alignItems: 'center', justifyContent: 'center' },
  topAvatarText:      { fontSize: 13, fontWeight: '700', color: Colors.accent },
  topName:            { fontSize: 14, fontWeight: '600', color: Colors.primary, marginBottom: 2 },
  topPhone:           { fontSize: 12, color: Colors.textSecondary },
  checkinsBox:        { alignItems: 'center' },
  checkinsCount:      { fontSize: 20, fontWeight: '800', color: Colors.primary },
  checkinsLabel:      { fontSize: 10, color: Colors.textSecondary },
});