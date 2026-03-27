import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/services/api';

const { height: SCREEN_H } = Dimensions.get('window');

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#F59E0B',
  gym_owner:   '#6366F1',
  staff:       '#22C55E',
  member:      '#3B82F6',
};
const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  gym_owner:   'Gym Owner',
  staff:       'Staff',
  member:      'Member',
};

export default function AdminUsers() {
  const insets = useSafeAreaInsets();
  const [allUsers, setAllUsers]     = useState<any[]>([]);
  const [gyms, setGyms]             = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [createModal, setCreateModal] = useState(false);
  const [createType, setCreateType]   = useState<'user' | 'gym_owner'>('user');
  const [newPhone, setNewPhone]       = useState('');
  const [newName, setNewName]         = useState('');
  const [newEmail, setNewEmail]       = useState('');
  const [newRole, setNewRole]         = useState('member');
  const [newGymName, setNewGymName]   = useState('');
  const [newGymCity, setNewGymCity]   = useState('');
  const [saving, setSaving]           = useState(false);

  const [editModal, setEditModal]   = useState(false);
  const [editUser, setEditUser]     = useState<any>(null);
  const [editName, setEditName]     = useState('');
  const [editEmail, setEditEmail]   = useState('');
  const [editRole, setEditRole]     = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [assignModal, setAssignModal]     = useState(false);
  const [selectedUser, setSelectedUser]   = useState<any>(null);
  const [selectedGymId, setSelectedGymId] = useState('');
  const [staffRole, setStaffRole]         = useState('manager');
  const [assigning, setAssigning]         = useState(false);

  const fetchData = async () => {
    try {
      const [uRes, gRes] = await Promise.all([
        api.get('/admin/users', { params: { limit: 500 } }),
        api.get('/admin/gyms',  { params: { limit: 100 } }),
      ]);
      const raw = uRes.data.data;
      setAllUsers(Array.isArray(raw) ? raw : (raw?.items || []));
      setGyms(gRes.data.data?.items || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = allUsers.filter(u => {
    const matchRole   = !roleFilter || u.systemRole === roleFilter;
    const matchSearch = !search ||
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    return matchRole && matchSearch;
  });

  const counts: Record<string, number> = allUsers.reduce((acc: any, u) => {
    const r = u.systemRole || 'member';
    acc[r]  = (acc[r] || 0) + 1;
    return acc;
  }, {});

  const handleCreate = async () => {
    if (newPhone.length !== 10) { Alert.alert('Error', 'Enter valid 10-digit phone'); return; }
    if (!newName.trim())        { Alert.alert('Error', 'Name is required'); return; }
    setSaving(true);
    try {
      if (createType === 'gym_owner') {
        if (!newGymName.trim()) { Alert.alert('Error', 'Gym name required'); setSaving(false); return; }
        if (!newGymCity.trim()) { Alert.alert('Error', 'City required');     setSaving(false); return; }
        await api.post('/admin/gym-owners', { phone: newPhone, fullName: newName, email: newEmail || undefined, gymName: newGymName, city: newGymCity });
        Alert.alert('Success', `Gym owner "${newName}" created`);
      } else {
        await api.post('/admin/users', { phone: newPhone, fullName: newName, email: newEmail || undefined, systemRole: newRole });
        Alert.alert('Success', `"${newName}" created as ${ROLE_LABELS[newRole]}`);
      }
      setCreateModal(false);
      resetCreate();
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setEditName(user.fullName || '');
    setEditEmail(user.email   || '');
    setEditRole(user.systemRole || 'member');
    setEditModal(true);
  };

  const handleEdit = async () => {
    if (!editName.trim()) { Alert.alert('Error', 'Name is required'); return; }
    setEditSaving(true);
    try {
      await api.patch(`/admin/users/${editUser._id}/role`, { systemRole: editRole, fullName: editName, email: editEmail || undefined });
      Alert.alert('Success', 'User updated');
      setEditModal(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message);
    } finally { setEditSaving(false); }
  };

  const openAssign = (user: any) => {
    if (user.systemRole === 'gym_owner') {
      Alert.alert('Info', 'Gym owners are linked to their gym automatically.');
      return;
    }
    setSelectedUser(user);
    setSelectedGymId('');
    setStaffRole('manager');
    setAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedGymId) { Alert.alert('Error', 'Select a gym'); return; }
    setAssigning(true);
    try {
      await api.post('/admin/assign-role', { userId: selectedUser._id, gymId: selectedGymId, role: staffRole });
      Alert.alert('Success', `${selectedUser.fullName} assigned as ${staffRole}`);
      setAssignModal(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message);
    } finally { setAssigning(false); }
  };

  const handleToggleActive = (user: any) => {
    const action = user.isActive ? 'Deactivate' : 'Activate';
    Alert.alert(action, `${action} ${user.fullName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: action, style: user.isActive ? 'destructive' : 'default',
        onPress: async () => {
          try {
            if (user.isActive) {
              await api.delete(`/admin/users/${user._id}`);
            } else {
              await api.patch(`/admin/users/${user._id}/role`, { systemRole: user.systemRole, isActive: true });
            }
            fetchData();
          } catch (err: any) { Alert.alert('Error', err?.response?.data?.message); }
        },
      },
    ]);
  };

  const resetCreate = () => {
    setNewPhone(''); setNewName(''); setNewEmail('');
    setNewRole('member'); setNewGymName(''); setNewGymCity('');
    setCreateType('user');
  };

  const renderUser = ({ item }: any) => {
    const initials  = item.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?';
    const roleColor = ROLE_COLORS[item.systemRole] || '#6B7280';
    return (
      <View style={[s.card, !item.isActive && { opacity: 0.4 }]}>
        <View style={s.cardTop}>
          <View style={[s.avatar, { backgroundColor: roleColor + '22' }]}>
            <Text style={[s.avatarText, { color: roleColor }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName} numberOfLines={1}>{item.fullName}</Text>
            <Text style={s.userPhone}>{item.phone}{item.email ? ` · ${item.email}` : ''}</Text>
          </View>
          <View style={[s.roleBadge, { backgroundColor: roleColor + '22' }]}>
            <Text style={[s.roleText, { color: roleColor }]}>{ROLE_LABELS[item.systemRole] || item.systemRole || 'member'}</Text>
          </View>
        </View>
        <View style={s.cardActions}>
          <TouchableOpacity style={s.actionBtn} onPress={() => openEdit(item)}>
            <Text style={s.actionText}>Edit</Text>
          </TouchableOpacity>
          {item.systemRole !== 'gym_owner' && (
            <TouchableOpacity style={s.actionBtn} onPress={() => openAssign(item)}>
              <Text style={s.actionText}>Assign to Gym</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[s.actionBtn, item.isActive ? s.deactivateBtn : s.activateBtn]}
            onPress={() => handleToggleActive(item)}
          >
            <Text style={[s.actionText, item.isActive ? { color: '#EF4444' } : { color: '#22C55E' }]}>
              {item.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header + search have horizontal padding */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Users</Text>
          <Text style={s.subtitle}>{allUsers.length} total · {filtered.length} shown</Text>
        </View>
        <TouchableOpacity style={s.createBtn} onPress={() => setCreateModal(true)}>
          <Text style={s.createBtnText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips — full width scroll, padding inside content */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterRow}
        contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 24 }}
      >
        {[
          { val: '',            label: `All (${allUsers.length})` },
          { val: 'super_admin', label: `Admins (${counts.super_admin || 0})` },
          { val: 'gym_owner',   label: `Owners (${counts.gym_owner   || 0})` },
          { val: 'staff',       label: `Staff (${counts.staff        || 0})` },
          { val: 'member',      label: `Members (${counts.member     || 0})` },
        ].map(f => (
          <TouchableOpacity key={f.val} style={[s.chip, roleFilter === f.val && s.chipActive]} onPress={() => setRoleFilter(f.val)}>
            <Text style={[s.chipText, roleFilter === f.val && s.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search + list have horizontal padding */}
      <View style={s.body}>
        <View style={s.searchBox}>
          <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
          <TextInput style={s.searchInput} value={search} onChangeText={setSearch}
            placeholder="Search name or phone..." placeholderTextColor="rgba(255,255,255,0.25)" />
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
            data={filtered}
            renderItem={renderUser}
            keyExtractor={i => i._id}
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#F59E0B" />}
            ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>No users found</Text></View>}
          />
        )}
      </View>

      {/* ── Create Modal ── */}
      <Modal visible={createModal} transparent animationType="slide" onRequestClose={() => { setCreateModal(false); resetCreate(); }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => { setCreateModal(false); resetCreate(); }} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{
              backgroundColor: '#161616',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: Platform.OS === 'ios' ? 40 : 24,
              height: SCREEN_H * 0.82,
            }}>
              <View style={s.handle} />
              <Text style={s.sheetTitle}>Create New User</Text>
              <View style={s.typeSwitcher}>
                <TouchableOpacity style={[s.typeBtn, createType === 'user' && s.typeBtnActive]} onPress={() => setCreateType('user')}>
                  <Text style={[s.typeBtnText, createType === 'user' && s.typeBtnActiveText]}>Regular User</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.typeBtn, createType === 'gym_owner' && s.typeBtnActive]} onPress={() => setCreateType('gym_owner')}>
                  <Text style={[s.typeBtnText, createType === 'gym_owner' && s.typeBtnActiveText]}>Gym Owner + Gym</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {[
                  { label: 'Phone *',    value: newPhone, set: setNewPhone, placeholder: '9876543210', kb: 'phone-pad' as any },
                  { label: 'Full Name *',value: newName,  set: setNewName,  placeholder: 'Full name',  kb: 'default' as any },
                  { label: 'Email',      value: newEmail, set: setNewEmail, placeholder: 'email (optional)', kb: 'email-address' as any },
                ].map(f => (
                  <View key={f.label} style={s.field}>
                    <Text style={s.fieldLabel}>{f.label}</Text>
                    <TextInput style={s.fieldInput} value={f.value} onChangeText={f.set}
                      placeholder={f.placeholder} placeholderTextColor="rgba(255,255,255,0.25)"
                      keyboardType={f.kb} autoCapitalize="none" />
                  </View>
                ))}
                {createType === 'user' && (
                  <View style={s.field}>
                    <Text style={s.fieldLabel}>Role</Text>
                    <View style={s.roleGrid}>
                      {['member','staff','gym_owner','super_admin'].map(r => (
                        <TouchableOpacity key={r}
                          style={[s.roleChip, { borderColor: ROLE_COLORS[r] }, newRole === r && { backgroundColor: ROLE_COLORS[r] + '30' }]}
                          onPress={() => setNewRole(r)}>
                          <Text style={[s.roleChipText, { color: ROLE_COLORS[r] }]}>{ROLE_LABELS[r]}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                {createType === 'gym_owner' && (
                  <>
                    {[
                      { label: 'Gym Name *', value: newGymName, set: setNewGymName, placeholder: 'Iron Body Fitness' },
                      { label: 'City *',     value: newGymCity, set: setNewGymCity, placeholder: 'Mumbai' },
                    ].map(f => (
                      <View key={f.label} style={s.field}>
                        <Text style={s.fieldLabel}>{f.label}</Text>
                        <TextInput style={s.fieldInput} value={f.value} onChangeText={f.set}
                          placeholder={f.placeholder} placeholderTextColor="rgba(255,255,255,0.25)" autoCapitalize="words" />
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
              <View style={s.sheetBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setCreateModal(false); resetCreate(); }}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.5 }]} onPress={handleCreate} disabled={saving}>
                  {saving ? <ActivityIndicator color="#000" size="small" /> : <Text style={s.saveBtnText}>Create</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={s.overlayBg} activeOpacity={1} onPress={() => setEditModal(false)} />
          <View style={[s.sheet, { maxHeight: SCREEN_H * 0.75 }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>Edit User</Text>
            <Text style={s.sheetSub}>{editUser?.phone}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Full Name</Text>
                <TextInput style={s.fieldInput} value={editName} onChangeText={setEditName}
                  placeholder="Full name" placeholderTextColor="rgba(255,255,255,0.25)" autoCapitalize="words" />
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Email</Text>
                <TextInput style={s.fieldInput} value={editEmail} onChangeText={setEditEmail}
                  placeholder="email (optional)" placeholderTextColor="rgba(255,255,255,0.25)"
                  keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Phone (cannot change)</Text>
                <View style={[s.fieldInput, { justifyContent: 'center', opacity: 0.4 }]}>
                  <Text style={{ color: '#fff', fontSize: 15 }}>{editUser?.phone}</Text>
                </View>
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Role</Text>
                <View style={s.roleGrid}>
                  {['member','staff','gym_owner','super_admin'].map(r => (
                    <TouchableOpacity key={r}
                      style={[s.roleChip, { borderColor: ROLE_COLORS[r] }, editRole === r && { backgroundColor: ROLE_COLORS[r] + '30' }]}
                      onPress={() => setEditRole(r)}>
                      <Text style={[s.roleChipText, { color: ROLE_COLORS[r] }]}>{ROLE_LABELS[r]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            <View style={s.sheetBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setEditModal(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn, editSaving && { opacity: 0.5 }]} onPress={handleEdit} disabled={editSaving}>
                {editSaving ? <ActivityIndicator color="#000" size="small" /> : <Text style={s.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Assign to Gym Modal ── */}
      <Modal visible={assignModal} transparent animationType="slide" onRequestClose={() => setAssignModal(false)}>
        <View style={s.overlay}>
          <TouchableOpacity style={s.overlayBg} activeOpacity={1} onPress={() => setAssignModal(false)} />
          <View style={[s.sheet, { maxHeight: SCREEN_H * 0.72 }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>Assign to Gym</Text>
            <Text style={s.sheetSub}>{selectedUser?.fullName} · {selectedUser?.phone}</Text>
            <Text style={[s.fieldLabel, { marginBottom: 8 }]}>Select Gym</Text>
            <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
              {gyms.map(g => (
                <TouchableOpacity key={g._id}
                  style={[s.gymOption, selectedGymId === g._id && s.gymOptionActive]}
                  onPress={() => setSelectedGymId(g._id)}>
                  <Text style={[s.gymOptionName, selectedGymId === g._id && { color: '#F59E0B' }]}>{g.name}</Text>
                  <Text style={[s.gymOptionCity, selectedGymId === g._id && { color: '#F59E0B80' }]}>{g.city}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[s.fieldLabel, { marginTop: 14, marginBottom: 10 }]}>Staff Role</Text>
            <View style={s.staffRoleRow}>
              {['manager','trainer','front_desk','accounts'].map(r => (
                <TouchableOpacity key={r}
                  style={[s.staffChip, staffRole === r && s.staffChipActive]}
                  onPress={() => setStaffRole(r)}>
                  <Text style={[s.staffChipText, staffRole === r && { color: '#000' }]}>{r.replace('_',' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[s.sheetBtns, { marginTop: 16 }]}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setAssignModal(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn, assigning && { opacity: 0.5 }]} onPress={handleAssign} disabled={assigning}>
                {assigning ? <ActivityIndicator color="#000" size="small" /> : <Text style={s.saveBtnText}>Assign</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#0A0A0A' },
  // header and body have their own horizontal padding
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      paddingHorizontal: 16, paddingTop: 16, marginBottom: 12 },
  title:            { fontSize: 24, fontWeight: '800', color: '#fff' },
  subtitle:         { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 },
  createBtn:        { backgroundColor: '#F59E0B', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  createBtnText:    { color: '#000', fontSize: 13, fontWeight: '700' },
  // filter row is full width — padding is inside contentContainerStyle
  filterRow:        { flexGrow: 0, marginBottom: 12 },
  chip:             { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
                      backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipActive:       { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  chipText:         { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  chipTextActive:   { color: '#000' },
  // body wraps search + list with horizontal padding
  body:             { flex: 1, paddingHorizontal: 16 },
  searchBox:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)',
                      borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 14,
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchInput:      { flex: 1, fontSize: 14, color: '#fff' },
  clearBtn:         { color: 'rgba(255,255,255,0.4)', fontSize: 15, paddingLeft: 8 },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:            { alignItems: 'center', paddingTop: 80 },
  emptyText:        { fontSize: 15, color: 'rgba(255,255,255,0.3)' },
  card:             { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14,
                      marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardTop:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar:           { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText:       { fontSize: 15, fontWeight: '700' },
  userName:         { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 2 },
  userPhone:        { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  roleBadge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleText:         { fontSize: 10, fontWeight: '700' },
  cardActions:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn:        { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  actionText:       { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  deactivateBtn:    { borderColor: '#EF444440', backgroundColor: '#EF444412' },
  activateBtn:      { borderColor: '#22C55E40', backgroundColor: '#22C55E12' },
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  overlayBg:        { flex: 1 },
  sheet:            { backgroundColor: '#161616', borderTopLeftRadius: 24, borderTopRightRadius: 24,
                      paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  handle:           { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle:       { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sheetSub:         { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 18 },
  sheetBtns:        { flexDirection: 'row', gap: 10, marginTop: 4 },
  typeSwitcher:     { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 4, marginBottom: 18 },
  typeBtn:          { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  typeBtnActive:    { backgroundColor: '#F59E0B' },
  typeBtnText:      { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  typeBtnActiveText:{ color: '#000' },
  field:            { marginBottom: 16 },
  fieldLabel:       { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  fieldInput:       { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, height: 50,
                      paddingHorizontal: 14, fontSize: 15, color: '#fff',
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  roleGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip:         { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5 },
  roleChipText:     { fontSize: 12, fontWeight: '600' },
  gymOption:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      padding: 12, borderRadius: 12, marginBottom: 6,
                      backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  gymOptionActive:  { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.08)' },
  gymOptionName:    { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  gymOptionCity:    { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  staffRoleRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  staffChip:        { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  staffChipActive:  { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  staffChipText:    { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  cancelBtn:        { flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  cancelText:       { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  saveBtn:          { flex: 2, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F59E0B' },
  saveBtnText:      { color: '#000', fontSize: 15, fontWeight: '700' },
});