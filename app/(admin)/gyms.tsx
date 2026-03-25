import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import api from '@/services/api';

const STATUS_COLORS: Record<string, string> = {
  active: '#22C55E', trial: '#F59E0B',
  suspended: '#EF4444', churned: '#6B7280',
};
const PLAN_COLORS: Record<string, string> = {
  starter: '#6366F1', growth: '#F59E0B', enterprise: '#22C55E',
};
const fmt = (d?: string) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';
const fmtCurrency = (n: number) =>
  n >= 100000 ? `₹${(n/100000).toFixed(1)}L`
  : n >= 1000  ? `₹${(n/1000).toFixed(1)}K`
  : `₹${n}`;

export default function AdminGyms() {
  const [gyms, setGyms]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');

  const fetchGyms = async () => {
    try {
      const params: any = {};
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      const { data } = await api.get('/admin/gyms', { params });
      setGyms(data.data?.items || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchGyms(); }, [filter, search]);

  const handleStatusChange = (gym: any) => {
    const options = ['active', 'trial', 'suspended', 'churned']
      .filter(s => s !== gym.planStatus)
      .map(s => ({
        text: s.charAt(0).toUpperCase() + s.slice(1),
        style: s === 'suspended' ? 'destructive' as const : 'default' as const,
        onPress: async () => {
          try {
            await api.patch(`/admin/gyms/${gym._id}/status`, { status: s });
            fetchGyms();
          } catch {}
        },
      }));
    Alert.alert(`Update ${gym.name}`, 'Change gym status to:', [
      ...options, { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handlePlanChange = (gym: any) => {
    Alert.alert(`${gym.name} Plan`, 'Change subscription tier:', [
      ...['starter', 'growth', 'enterprise'].map(p => ({
        text: p.charAt(0).toUpperCase() + p.slice(1),
        onPress: async () => {
          try {
            await api.patch(`/admin/gyms/${gym._id}/plan`, { planTier: p });
            fetchGyms();
          } catch {}
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderGym = ({ item }: any) => {
    const owner = item.ownerId || {};
    return (
      <View style={s.gymCard}>
        <TouchableOpacity
          style={s.gymTop}
          onPress={() => router.push({ pathname: '/(admin)/gym-detail' as any, params: { gymId: item._id } })}
        >
          <View style={s.gymLeft}>
            <View style={s.gymAvatar}>
              <Text style={s.gymAvatarText}>{item.name?.charAt(0) || 'G'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.gymName}>{item.name}</Text>
              <Text style={s.gymCity}>{item.city} · {owner.phone}</Text>
              <Text style={s.gymOwner}>Owner: {owner.fullName}</Text>
            </View>
          </View>
          <View style={s.gymRight}>
            <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[item.planStatus] + '22' }]}>
              <Text style={[s.statusText, { color: STATUS_COLORS[item.planStatus] }]}>
                {item.planStatus?.toUpperCase()}
              </Text>
            </View>
            <Text style={s.gymArrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Stats row */}
        <View style={s.gymStats}>
          <View style={s.gymStat}>
            <Text style={s.gymStatValue}>{item.memberCount ?? 0}</Text>
            <Text style={s.gymStatLabel}>Members</Text>
          </View>
          <View style={s.gymStat}>
            <Text style={s.gymStatValue}>{fmtCurrency(item.totalRevenue ?? 0)}</Text>
            <Text style={s.gymStatLabel}>Revenue</Text>
          </View>
          <View style={s.gymStat}>
            <View style={[s.planBadge, { backgroundColor: PLAN_COLORS[item.planTier] + '22' }]}>
              <Text style={[s.planText, { color: PLAN_COLORS[item.planTier] }]}>
                {item.planTier?.toUpperCase()}
              </Text>
            </View>
            <Text style={s.gymStatLabel}>Plan</Text>
          </View>
          <View style={s.gymStat}>
            <Text style={s.gymStatValue}>{fmt(item.createdAt)}</Text>
            <Text style={s.gymStatLabel}>Joined</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={s.gymActions}>
          <TouchableOpacity style={s.gymActionBtn} onPress={() => handleStatusChange(item)}>
            <Text style={s.gymActionText}>Change Status</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.gymActionBtn} onPress={() => handlePlanChange(item)}>
            <Text style={s.gymActionText}>Change Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.gymActionBtn, item.planStatus === 'suspended' ? s.activateBtn : s.suspendBtn]}
            onPress={async () => {
              const newStatus = item.planStatus === 'suspended' ? 'active' : 'suspended';
              try {
                await api.patch(`/admin/gyms/${item._id}/status`, { status: newStatus });
                fetchGyms();
              } catch {}
            }}
          >
            <Text style={[s.gymActionText, { color: item.planStatus === 'suspended' ? '#22C55E' : '#EF4444' }]}>
              {item.planStatus === 'suspended' ? 'Activate' : 'Suspend'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>All Gyms</Text>

        {/* Search */}
        <View style={s.searchRow}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search gym name..."
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
        </View>

        {/* Filter tabs */}
        <View style={s.filterRow}>
          {['all', 'active', 'trial', 'suspended'].map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterBtn, filter === f && s.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color="#F59E0B" /></View>
        ) : (
          <FlatList
            data={gyms}
            renderItem={renderGym}
            keyExtractor={i => i._id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGyms(); }} tintColor="#F59E0B" />}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyIcon}>🏢</Text>
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
  safe:           { flex: 1, backgroundColor: '#0A0A0A' },
  container:      { flex: 1, padding: 16 },
  title:          { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 14 },
  searchRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)',
                    borderRadius: 12, paddingHorizontal: 12, height: 46, marginBottom: 12,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchIcon:     { fontSize: 15, marginRight: 8 },
  searchInput:    { flex: 1, fontSize: 14, color: '#fff' },
  filterRow:      { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterBtn:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filterBtnActive:{ backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  filterText:     { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  filterTextActive:{ color: '#000' },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:           { paddingBottom: 20 },
  gymCard:        { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, marginBottom: 12,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  gymTop:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 14 },
  gymLeft:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  gymAvatar:      { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F59E0B',
                    alignItems: 'center', justifyContent: 'center' },
  gymAvatarText:  { fontSize: 18, fontWeight: '800', color: '#000' },
  gymName:        { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  gymCity:        { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  gymOwner:       { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  gymRight:       { alignItems: 'flex-end', gap: 6 },
  statusBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText:     { fontSize: 10, fontWeight: '700' },
  gymArrow:       { fontSize: 18, color: 'rgba(255,255,255,0.3)' },
  gymStats:       { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
                    paddingHorizontal: 14, paddingVertical: 10 },
  gymStat:        { flex: 1, alignItems: 'center' },
  gymStatValue:   { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 },
  gymStatLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  planBadge:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  planText:       { fontSize: 9, fontWeight: '700' },
  gymActions:     { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  gymActionBtn:   { flex: 1, paddingVertical: 10, alignItems: 'center',
                    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)' },
  gymActionText:  { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  suspendBtn:     {},
  activateBtn:    {},
  empty:          { alignItems: 'center', paddingTop: 60 },
  emptyIcon:      { fontSize: 40, marginBottom: 12 },
  emptyText:      { fontSize: 16, color: 'rgba(255,255,255,0.4)' },
});