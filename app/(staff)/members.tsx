import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAppContext } from '@/store/AppContext';
import { useStaffRole } from '@/hooks/useStaffRole';
import api from '@/services/api';

const STATUS_COLORS: Record<string, string> = {
  active: Colors.success, expired: Colors.danger,
  frozen: Colors.warning, cancelled: Colors.textMuted,
};

export default function MembersScreen() {
  const { gymId } = useAppContext();
  const { permissions } = useStaffRole();
  const [members, setMembers]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');

  const fetchMembers = async () => {
    if (!gymId) { setLoading(false); return; }
    try {
      const params: any = {};
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      const { data } = await api.get(`/gyms/${gymId}/members`, { params });
      setMembers(data.data?.items || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchMembers(); }, [filter, search]);

  const renderMember = ({ item }: any) => {
    const user = item.userId || {};
    const initials = user.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
    const daysLeft = item.planEndDate
      ? Math.max(0, Math.ceil((new Date(item.planEndDate).getTime() - Date.now()) / 86400000))
      : null;
    return (
      <TouchableOpacity style={s.memberCard} onPress={() => router.push({ pathname: '/(staff)/member-detail', params: { memberId: item._id } })}>
        <View style={s.memberLeft}>
          <View style={[s.avatar, { backgroundColor: STATUS_COLORS[item.status] + '33' }]}>
            <Text style={[s.avatarText, { color: STATUS_COLORS[item.status] }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.memberName}>{user.fullName || 'Unknown'}</Text>
            <Text style={s.memberPhone}>{user.phone} · {item.memberCode}</Text>
            {item.planName && <Text style={s.memberPlan}>{item.planName}</Text>}
          </View>
        </View>
        <View style={s.memberRight}>
          <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
          {daysLeft !== null && <Text style={s.daysLeft}>{daysLeft}d</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Members</Text>
          {permissions.canAddMembers && (
            <TouchableOpacity style={s.addBtn} onPress={() => router.push('/(staff)/add-member')}>
              <Text style={s.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search */}
        <View style={s.searchRow}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput style={s.searchInput} placeholder="Search by name or phone..."
            placeholderTextColor={Colors.textMuted} value={search}
            onChangeText={setSearch} />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Text style={s.clearSearch}>✕</Text></TouchableOpacity>}
        </View>

        {/* Filter tabs */}
        <View style={s.filterRow}>
          {['all', 'active', 'expired', 'frozen'].map((f) => (
            <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterBtnActive]} onPress={() => setFilter(f)}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={Colors.accent} /></View>
        ) : (
          <FlatList
            data={members}
            renderItem={renderMember}
            keyExtractor={(item) => item._id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMembers(); }} />}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyIcon}>👥</Text>
                <Text style={s.emptyText}>No members found</Text>
                {permissions.canAddMembers && (
                  <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/(staff)/add-member')}>
                    <Text style={s.emptyBtnText}>Add First Member</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.background },
  container:      { flex: 1, padding: 16 },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title:          { fontSize: 22, fontWeight: '800', color: Colors.primary },
  addBtn:         { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addBtnText:     { color: '#fff', fontSize: 13, fontWeight: '700' },
  searchRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
                    borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
                    paddingHorizontal: 12, height: 46, marginBottom: 12 },
  searchIcon:     { fontSize: 16, marginRight: 8 },
  searchInput:    { flex: 1, fontSize: 14, color: Colors.primary },
  clearSearch:    { fontSize: 13, color: Colors.textMuted, padding: 4 },
  filterRow:      { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterBtn:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterBtnActive:{ backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText:     { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive:{ color: '#fff' },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:           { paddingBottom: 20 },
  memberCard:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8,
                    borderWidth: 1, borderColor: Colors.border },
  memberLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar:         { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontSize: 16, fontWeight: '700' },
  memberName:     { fontSize: 15, fontWeight: '600', color: Colors.primary, marginBottom: 2 },
  memberPhone:    { fontSize: 12, color: Colors.textSecondary },
  memberPlan:     { fontSize: 11, color: Colors.accent, marginTop: 2 },
  memberRight:    { alignItems: 'flex-end', gap: 4 },
  statusDot:      { width: 8, height: 8, borderRadius: 4 },
  daysLeft:       { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  empty:          { alignItems: 'center', paddingTop: 60 },
  emptyIcon:      { fontSize: 40, marginBottom: 12 },
  emptyText:      { fontSize: 16, color: Colors.textSecondary, marginBottom: 20 },
  emptyBtn:       { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText:   { color: '#fff', fontSize: 14, fontWeight: '700' },
});