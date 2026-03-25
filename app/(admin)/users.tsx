import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  Modal, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/services/api';

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

const fmt = (d?: string) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
  : '—';

export default function AdminUsers() {
  const [users, setUsers]       = useState<any[]>([]);
  const [gyms, setGyms]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]     = useState('');

  // Create user modal
  const [createModal, setCreateModal]   = useState(false);
  const [createType, setCreateType]     = useState<'user' | 'gym_owner'>('user');
  const [newPhone, setNewPhone]         = useState('');
  const [newName, setNewName]           = useState('');
  const [newEmail, setNewEmail]         = useState('');
  const [newRole, setNewRole]           = useState('member');
  const [newGymName, setNewGymName]     = useState('');
  const [newGymCity, setNewGymCity]     = useState('');
  const [saving, setSaving]             = useState(false);

  // Role assignment modal
  const [roleModal, setRoleModal]       = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedGymId, setSelectedGymId] = useState('');
  const [selectedStaffRole, setSelectedStaffRole] = useState('manager');
  const [assigning, setAssigning]       = useState(false);

  const fetchData = async () => {
    try {
      const [usersRes, gymsRes] = await Promise.all([
        api.get('/admin/users', { params: search ? { search } : {} }),
        api.get('/admin/gyms', { params: { limit: 100 } }),
      ]);
      setUsers(usersRes.data.data || []);
      setGyms(gymsRes.data.data?.items || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, [search]);

  const handleCreateUser = async () => {
    if (newPhone.length !== 10) { Alert.alert('Error', 'Enter valid 10-digit phone'); return; }
    if (!newName.trim()) { Alert.alert('Error', 'Name is required'); return; }
    setSaving(true);
    try {
      if (createType === 'gym_owner') {
        if (!newGymName.trim()) { Alert.alert('Error', 'Gym name is required'); setSaving(false); return; }
        if (!newGymCity.trim()) { Alert.alert('Error', 'City is required'); setSaving(false); return; }
        await api.post('/admin/gym-owners', {
          phone:    newPhone,
          fullName: newName,
          email:    newEmail || undefined,
          gymName:  newGymName,
          city:     newGymCity,
        });
        Alert.alert('Success', `Gym owner "${newName}" created with gym "${newGymName}"`);
      } else {
        await api.post('/admin/users', {
          phone:      newPhone,
          fullName:   newName,
          email:      newEmail || undefined,
          systemRole: newRole,
        });
        Alert.alert('Success', `User "${newName}" created as ${ROLE_LABELS[newRole]}`);
      }
      setCreateModal(false);
      resetCreateForm();
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create user');
    } finally { setSaving(false); }
  };

  const handleChangeRole = async (user: any, newSystemRole: string) => {
    Alert.alert('Change Role', `Change ${user.fullName} to ${ROLE_LABELS[newSystemRole]}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await api.patch(`/admin/users/${user._id}/role`, { systemRole: newSystemRole });
            fetchData();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message);
          }
        },
      },
    ]);
  };

  const handleAssignStaffRole = async () => {
    if (!selectedGymId) { Alert.alert('Error', 'Select a gym'); return; }
    setAssigning(true);
    try {
      await api.post('/admin/assign-role', {
        userId: selectedUser._id,
        gymId:  selectedGymId,
        role:   selectedStaffRole,
      });
      Alert.alert('Success', `${selectedUser.fullName} assigned as ${selectedStaffRole} to gym`);
      setRoleModal(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message);
    } finally { setAssigning(false); }
  };

  const handleDeactivate = (user: any) => {
    Alert.alert('Deactivate User', `Deactivate ${user.fullName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/admin/users/${user._id}`);
            fetchData();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message);
          }
        },
      },
    ]);
  };

  const resetCreateForm = () => {
    setNewPhone(''); setNewName(''); setNewEmail('');
    setNewRole('member'); setNewGymName(''); setNewGymCity('');
    setCreateType('user');
  };

  const renderUser = ({ item }: any) => {
    const initials   = item.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?';
    const roleColor  = ROLE_COLORS[item.systemRole] || '#6B7280';
    const isInactive = !item.isActive;

    return (
      <View style={[s.userCard, isInactive && { opacity: 0.5 }]}>
        <View style={s.userTop}>
          <View style={[s.avatar, { backgroundColor: roleColor + '22' }]}>
            <Text style={[s.avatarText, { color: roleColor }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{item.fullName}</Text>
            <Text style={s.userPhone}>{item.phone}</Text>
            {item.email && <Text style={s.userEmail}>{item.email}</Text>}
          </View>
          <View style={[s.roleBadge, { backgroundColor: roleColor + '22' }]}>
            <Text style={[s.roleText, { color: roleColor }]}>
              {ROLE_LABELS[item.systemRole] || item.systemRole}
            </Text>
          </View>
        </View>

        <View style={s.userActions}>
          {/* Change system role */}
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => Alert.alert(
              'Change Role',
              `Current: ${ROLE_LABELS[item.systemRole]}`,
              [
                { text: 'Super Admin', onPress: () => handleChangeRole(item, 'super_admin') },
                { text: 'Gym Owner',   onPress: () => handleChangeRole(item, 'gym_owner') },
                { text: 'Staff',       onPress: () => handleChangeRole(item, 'staff') },
                { text: 'Member',      onPress: () => handleChangeRole(item, 'member') },
                { text: 'Cancel', style: 'cancel' },
              ]
            )}
          >
            <Text style={s.actionBtnText}>Change Role</Text>
          </TouchableOpacity>

          {/* Assign to gym as staff */}
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => { setSelectedUser(item); setSelectedGymId(''); setRoleModal(true); }}
          >
            <Text style={s.actionBtnText}>Assign to Gym</Text>
          </TouchableOpacity>

          {/* Deactivate */}
          {item.isActive && (
            <TouchableOpacity style={s.deactivateBtn} onPress={() => handleDeactivate(item)}>
              <Text style={s.deactivateBtnText}>Deactivate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Users</Text>
          <TouchableOpacity style={s.createBtn} onPress={() => setCreateModal(true)}>
            <Text style={s.createBtnText}>+ Create</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={s.searchRow}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or phone..."
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, padding: 4 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats bar */}
        <View style={s.statsBar}>
          {Object.entries(ROLE_COLORS).map(([role, color]) => (
            <View key={role} style={s.statItem}>
              <Text style={[s.statCount, { color }]}>
                {users.filter(u => u.systemRole === role).length}
              </Text>
              <Text style={s.statLabel}>{ROLE_LABELS[role]?.split(' ')[0]}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color="#F59E0B" /></View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={i => i._id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#F59E0B" />}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyIcon}>👤</Text>
                <Text style={s.emptyText}>No users found</Text>
              </View>
            }
          />
        )}
      </View>

      {/* ── Create User Modal ── */}
      <Modal visible={createModal} transparent animationType="slide">
        <View style={s.overlay}>
          <ScrollView contentContainerStyle={{ justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
            <View style={s.modal}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>Create New User</Text>

              {/* Type switcher */}
              <View style={s.typeSwitcher}>
                <TouchableOpacity
                  style={[s.typeBtn, createType === 'user' && s.typeBtnActive]}
                  onPress={() => setCreateType('user')}
                >
                  <Text style={[s.typeBtnText, createType === 'user' && s.typeBtnTextActive]}>Regular User</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.typeBtn, createType === 'gym_owner' && s.typeBtnActive]}
                  onPress={() => setCreateType('gym_owner')}
                >
                  <Text style={[s.typeBtnText, createType === 'gym_owner' && s.typeBtnTextActive]}>Gym Owner + Gym</Text>
                </TouchableOpacity>
              </View>

              {/* Common fields */}
              {[
                { label: 'Phone *',    value: newPhone, setter: setNewPhone, placeholder: '9876543210', keyboard: 'phone-pad' as any },
                { label: 'Full Name *',value: newName,  setter: setNewName,  placeholder: 'Full name',  keyboard: 'default' as any },
                { label: 'Email',      value: newEmail, setter: setNewEmail, placeholder: 'email@example.com', keyboard: 'email-address' as any },
              ].map(f => (
                <View key={f.label} style={s.modalField}>
                  <Text style={s.modalLabel}>{f.label}</Text>
                  <TextInput
                    style={s.modalInput}
                    value={f.value}
                    onChangeText={f.setter}
                    placeholder={f.placeholder}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType={f.keyboard}
                  />
                </View>
              ))}

              {/* Role selector for regular user */}
              {createType === 'user' && (
                <View style={s.modalField}>
                  <Text style={s.modalLabel}>Role</Text>
                  <View style={s.roleGrid}>
                    {['member', 'staff', 'gym_owner', 'super_admin'].map(r => (
                      <TouchableOpacity
                        key={r}
                        style={[s.roleChip, { borderColor: ROLE_COLORS[r] }, newRole === r && { backgroundColor: ROLE_COLORS[r] + '33' }]}
                        onPress={() => setNewRole(r)}
                      >
                        <Text style={[s.roleChipText, { color: ROLE_COLORS[r] }]}>{ROLE_LABELS[r]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Gym fields for gym owner */}
              {createType === 'gym_owner' && (
                <>
                  {[
                    { label: 'Gym Name *', value: newGymName, setter: setNewGymName, placeholder: 'Iron Body Fitness' },
                    { label: 'City *',     value: newGymCity, setter: setNewGymCity, placeholder: 'Mumbai' },
                  ].map(f => (
                    <View key={f.label} style={s.modalField}>
                      <Text style={s.modalLabel}>{f.label}</Text>
                      <TextInput
                        style={s.modalInput}
                        value={f.value}
                        onChangeText={f.setter}
                        placeholder={f.placeholder}
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        autoCapitalize="words"
                      />
                    </View>
                  ))}
                </>
              )}

              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setCreateModal(false); resetCreateForm(); }}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.saveBtn, saving && { opacity: 0.5 }]}
                  onPress={handleCreateUser}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color="#000" size="small" />
                    : <Text style={s.saveBtnText}>Create</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Assign to Gym Modal ── */}
      <Modal visible={roleModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Assign to Gym</Text>
            <Text style={s.modalSub}>{selectedUser?.fullName}</Text>

            <Text style={s.modalLabel}>Select Gym</Text>
            <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
              {gyms.map(g => (
                <TouchableOpacity
                  key={g._id}
                  style={[s.gymOption, selectedGymId === g._id && s.gymOptionActive]}
                  onPress={() => setSelectedGymId(g._id)}
                >
                  <Text style={[s.gymOptionText, selectedGymId === g._id && { color: '#F59E0B' }]}>
                    {g.name} — {g.city}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[s.modalLabel, { marginTop: 14 }]}>Assign Role</Text>
            <View style={s.staffRoleGrid}>
              {['manager', 'trainer', 'front_desk', 'accounts'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[s.staffRoleChip, selectedStaffRole === r && s.staffRoleChipActive]}
                  onPress={() => setSelectedStaffRole(r)}
                >
                  <Text style={[s.staffRoleText, selectedStaffRole === r && { color: '#000' }]}>
                    {r.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setRoleModal(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, assigning && { opacity: 0.5 }]}
                onPress={handleAssignStaffRole}
                disabled={assigning}
              >
                {assigning
                  ? <ActivityIndicator color="#000" size="small" />
                  : <Text style={s.saveBtnText}>Assign</Text>
                }
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
  container:        { flex: 1, padding: 16 },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title:            { fontSize: 22, fontWeight: '800', color: '#fff' },
  createBtn:        { backgroundColor: '#F59E0B', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  createBtnText:    { color: '#000', fontSize: 13, fontWeight: '700' },
  searchRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)',
                      borderRadius: 12, paddingHorizontal: 12, height: 46, marginBottom: 12,
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchIcon:       { fontSize: 15, marginRight: 8 },
  searchInput:      { flex: 1, fontSize: 14, color: '#fff' },
  statsBar:         { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
                      padding: 12, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statItem:         { flex: 1, alignItems: 'center' },
  statCount:        { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLabel:        { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:             { paddingBottom: 20 },
  userCard:         { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14,
                      marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  userTop:          { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar:           { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText:       { fontSize: 15, fontWeight: '700' },
  userName:         { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 2 },
  userPhone:        { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  userEmail:        { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 },
  roleBadge:        { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  roleText:         { fontSize: 10, fontWeight: '700' },
  userActions:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  actionBtnText:    { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  deactivateBtn:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                      borderWidth: 1, borderColor: '#EF444440', backgroundColor: '#EF444415' },
  deactivateBtnText:{ fontSize: 11, fontWeight: '600', color: '#EF4444' },
  empty:            { alignItems: 'center', paddingTop: 60 },
  emptyIcon:        { fontSize: 40, marginBottom: 12 },
  emptyText:        { fontSize: 16, color: 'rgba(255,255,255,0.4)' },
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:            { backgroundColor: '#1A1A1A', borderRadius: 24, padding: 24, margin: 8, maxHeight: '90%' },
  modalHandle:      { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:       { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  modalSub:         { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 },
  typeSwitcher:     { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: 4, marginBottom: 16 },
  typeBtn:          { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  typeBtnActive:    { backgroundColor: '#F59E0B' },
  typeBtnText:      { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  typeBtnTextActive:{ color: '#000' },
  modalField:       { marginBottom: 14 },
  modalLabel:       { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 8 },
  modalInput:       { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10, height: 48,
                      paddingHorizontal: 14, fontSize: 15, color: '#fff',
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  roleGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  roleChipText:     { fontSize: 12, fontWeight: '600' },
  gymOption:        { padding: 12, borderRadius: 10, marginBottom: 6,
                      backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  gymOptionActive:  { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.1)' },
  gymOptionText:    { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  staffRoleGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  staffRoleChip:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                      borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  staffRoleChipActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  staffRoleText:    { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  modalBtns:        { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn:        { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  cancelText:       { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  saveBtn:          { flex: 2, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: '#F59E0B' },
  saveBtnText:      { color: '#000', fontSize: 15, fontWeight: '700' },
});