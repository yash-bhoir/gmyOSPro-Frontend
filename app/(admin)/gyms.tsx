import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import api from '@/services/api';

const STATUS_COLORS: Record<string, string> = {
  active: '#22C55E', trial: '#F59E0B', suspended: '#EF4444', churned: '#6B7280',
};

const fmtCurrency = (n: number) =>
  n >= 100000 ? `₹${(n/100000).toFixed(1)}L`
  : n >= 1000  ? `₹${(n/1000).toFixed(1)}K`
  : `₹${n}`;

export default function AdminGyms() {
  const params = useLocalSearchParams<{ filter?: string }>();
  const insets = useSafeAreaInsets();
  const [gyms, setGyms]             = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState(params.filter || '');

  const fetchGyms = async () => {
    try {
      const p: any = { limit: 100 };
      if (statusFilter) p.status = statusFilter;
      if (search)       p.search = search;
      const { data } = await api.get('/admin/gyms', { params: p });
      setGyms(data.data?.items || []);
      setTotal(data.data?.total || 0);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchGyms(); }, [statusFilter, search]);

  const handleQuickStatus = (gym: any, status: string) => {
    const label = status === 'active' ? 'Activate' : 'Suspend';
    Alert.alert(label, `${label} "${gym.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: label, style: status === 'suspended' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await api.patch(`/admin/gyms/${gym._id}/status`, { status });
            fetchGyms();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message);
          }
        },
      },
    ]);
  };

  const renderGym = ({ item }: any) => {
    const statusColor = STATUS_COLORS[item.planStatus] || '#6B7280';
    const owner       = item.ownerId || {};
    const isSuspended = item.planStatus === 'suspended';

    return (
      <TouchableOpacity
        style={s.gymCard}
        onPress={() => router.push({ pathname: '/(admin)/gym-detail', params: { gymId: item._id } } as any)}
        activeOpacity={0.75}
      >
        <View style={s.gymTop}>
          <View style={[s.gymAvatar, { backgroundColor: statusColor + '22' }]}>
            <Text style={[s.gymAvatarText, { color: statusColor }]}>{item.name?.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.gymName} numberOfLines={1}>{item.name}</Text>
            <Text style={s.gymCity}>{item.city} · {owner.phone}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[s.statusText, { color: statusColor }]}>{item.planStatus?.toUpperCase()}</Text>
          </View>
        </View>

        <View style={s.gymStats}>
          <View style={s.gymStat}>
            <Text style={s.gymStatValue}>{item.memberCount ?? 0}</Text>
            <Text style={s.gymStatLabel}>Members</Text>
          </View>
          <View style={s.gymStat}>
            <Text style={[s.gymStatValue, { color: '#F59E0B' }]}>{fmtCurrency(item.totalRevenue ?? 0)}</Text>
            <Text style={s.gymStatLabel}>Revenue</Text>
          </View>
          <View style={s.gymStat}>
            <Text style={s.gymStatValue}>{item.planTier}</Text>
            <Text style={s.gymStatLabel}>Plan</Text>
          </View>
        </View>

        <View style={s.gymActions}>
          {isSuspended ? (
            <TouchableOpacity style={s.activateBtn} onPress={() => handleQuickStatus(item, 'active')}>
              <Text style={s.activateBtnText}>✓ Activate</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.suspendBtn} onPress={() => handleQuickStatus(item, 'suspended')}>
              <Text style={s.suspendBtnText}>Suspend</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={s.detailBtn}
            onPress={() => router.push({ pathname: '/(admin)/gym-detail', params: { gymId: item._id } } as any)}
          >
            <Text style={s.detailBtnText}>Details →</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header — has own padding */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Gyms</Text>
          <Text style={s.subtitle}>{total} total</Text>
        </View>
      </View>

      {/* Filter chips — full width, padding inside content */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterRow}
        contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 24 }}
      >
        {[
          { val: '',          label: `All (${total})` },
          { val: 'trial',     label: 'Trial' },
          { val: 'active',    label: 'Active' },
          { val: 'suspended', label: 'Suspended' },
          { val: 'churned',   label: 'Churned' },
        ].map(f => (
          <TouchableOpacity
            key={f.val}
            style={[
              s.chip,
              statusFilter === f.val && s.chipActive,
              f.val === 'suspended' && statusFilter === 'suspended' && { backgroundColor: '#EF444420', borderColor: '#EF4444' },
            ]}
            onPress={() => setStatusFilter(f.val)}
          >
            <Text style={[
              s.chipText,
              statusFilter === f.val && s.chipTextActive,
              f.val === 'suspended' && statusFilter === 'suspended' && { color: '#EF4444' },
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Body — search + list with padding */}
      <View style={s.body}>
        <View style={s.searchBox}>
          <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search gym name..."
            placeholderTextColor="rgba(255,255,255,0.25)"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={s.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color="#F59E0B" /></View>
        ) : (
          <FlatList
            data={gyms}
            renderItem={renderGym}
            keyExtractor={i => i._id}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGyms(); }} tintColor="#F59E0B" />
            }
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={{ fontSize: 36, marginBottom: 10 }}>🏢</Text>
                <Text style={s.emptyText}>No gyms found</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#0A0A0A' },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                     paddingHorizontal: 16, paddingTop: 16, marginBottom: 12 },
  title:           { fontSize: 24, fontWeight: '800', color: '#fff' },
  subtitle:        { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 },
  filterRow:       { flexGrow: 0, marginBottom: 12 },
  chip:            { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
                     backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipActive:      { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  chipText:        { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  chipTextActive:  { color: '#000' },
  body:            { flex: 1, paddingHorizontal: 16 },
  searchBox:       { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)',
                     borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 14,
                     borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchInput:     { flex: 1, fontSize: 14, color: '#fff' },
  clearBtn:        { color: 'rgba(255,255,255,0.4)', fontSize: 15, paddingLeft: 8 },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:           { alignItems: 'center', paddingTop: 80 },
  emptyText:       { fontSize: 15, color: 'rgba(255,255,255,0.3)' },
  gymCard:         { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14,
                     marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  gymTop:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  gymAvatar:       { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  gymAvatarText:   { fontSize: 20, fontWeight: '800' },
  gymName:         { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  gymCity:         { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  statusBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:      { fontSize: 10, fontWeight: '700' },
  gymStats:        { flexDirection: 'row', marginBottom: 12, paddingTop: 10,
                     borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  gymStat:         { flex: 1, alignItems: 'center' },
  gymStatValue:    { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  gymStatLabel:    { fontSize: 10, color: 'rgba(255,255,255,0.35)' },
  gymActions:      { flexDirection: 'row', gap: 8 },
  activateBtn:     { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                     backgroundColor: '#22C55E20', borderWidth: 1, borderColor: '#22C55E' },
  activateBtnText: { fontSize: 12, fontWeight: '700', color: '#22C55E' },
  suspendBtn:      { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                     backgroundColor: '#EF444415', borderWidth: 1, borderColor: '#EF444440' },
  suspendBtnText:  { fontSize: 12, fontWeight: '700', color: '#EF4444' },
  detailBtn:       { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                     borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  detailBtnText:   { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
});