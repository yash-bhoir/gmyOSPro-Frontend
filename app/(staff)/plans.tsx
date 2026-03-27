import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAppContext } from '@/store/AppContext';
import { useStaffRole } from '@/hooks/useStaffRole';
import { useToast } from '@/hooks/useToast';
import api from '@/services/api';

interface Plan {
  _id: string; name: string; durationDays: number; price: number;
  gstRate: number; isActive: boolean; description?: string;
}

export default function PlansScreen() {
  const { gymId } = useAppContext();
  const { permissions } = useStaffRole();
  const toast = useToast();
  const [plans, setPlans]     = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [saving, setSaving]   = useState(false);

  // Form state
  const [name, setName]               = useState('');
  const [price, setPrice]             = useState('');
  const [duration, setDuration]       = useState('30');
  const [description, setDescription] = useState('');
  const [gst, setGst]                 = useState('18');

  const fetchPlans = async () => {
    if (!gymId) return;
    try {
      const { data } = await api.get(`/gyms/${gymId}/plans`);
      setPlans(data.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, [gymId]);

  const openAdd = () => {
    setEditing(null);
    setName(''); setPrice(''); setDuration('30'); setDescription(''); setGst('18');
    setModal(true);
  };

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setName(plan.name); setPrice(plan.price.toString());
    setDuration(plan.durationDays.toString());
    setDescription(plan.description || '');
    setGst(plan.gstRate.toString());
    setModal(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !price || !duration) { toast.error('Fill all required fields'); return; }
    if (!gymId) return;
    setSaving(true);
    try {
      const payload = { name, price: parseInt(price), durationDays: parseInt(duration), description, gstRate: parseInt(gst) };
      if (editing) {
        await api.put(`/gyms/${gymId}/plans/${editing._id}`, payload);
        toast.success('Plan updated');
      } else {
        await api.post(`/gyms/${gymId}/plans`, payload);
        toast.success('Plan created');
      }
      setModal(false);
      fetchPlans();
    } catch (err: any) {
      toast.error('Failed', err?.response?.data?.message);
    } finally { setSaving(false); }
  };

  const handleDelete = (plan: Plan) => {
    Alert.alert('Remove Plan', `Remove "${plan.name}"? Existing members won't be affected.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/gyms/${gymId}/plans/${plan._id}`);
          toast.success('Plan removed');
          fetchPlans();
        } catch { toast.error('Failed to remove plan'); }
      }}
    ]);
  };

  const gstAmount = (price: number, gstRate: number) => Math.round(price * gstRate / 100);
  const totalPrice = (price: number, gstRate: number) => price + gstAmount(price, gstRate);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>Membership Plans</Text>
            <Text style={s.sub}>{plans.length} plans configured</Text>
          </View>
          {permissions.canEditPlans && (
            <TouchableOpacity style={s.addBtn} onPress={openAdd}>
              <Text style={s.addBtnText}>+ Add Plan</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={Colors.accent} /></View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
            {plans.length === 0 && (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>📋</Text>
                <Text style={s.emptyTitle}>No plans yet</Text>
                {permissions.canEditPlans && (
                <TouchableOpacity style={s.seedBtn} onPress={async () => {
                  await api.post(`/gyms/${gymId}/plans/seed`);
                  fetchPlans();
                }}>
                  <Text style={s.seedBtnText}>Add Default Plans</Text>
                </TouchableOpacity>
              )}
              </View>
            )}
            {plans.map((plan) => (
              <View key={plan._id} style={[s.planCard, !plan.isActive && s.planCardOff]}>
                <View style={s.planTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.planName}>{plan.name}</Text>
                    <Text style={s.planDuration}>{plan.durationDays} days</Text>
                    {plan.description && <Text style={s.planDesc}>{plan.description}</Text>}
                  </View>
                  <View style={s.planPriceBox}>
                    <Text style={s.planPrice}>₹{plan.price.toLocaleString('en-IN')}</Text>
                    {plan.gstRate > 0 && (
                      <Text style={s.planTotal}>
                        ₹{totalPrice(plan.price, plan.gstRate).toLocaleString('en-IN')} incl. GST
                      </Text>
                    )}
                  </View>
                </View>
                <View style={s.planActions}>
                  <View style={[s.activeBadge, plan.isActive ? s.activeBadgeOn : s.activeBadgeOff]}>
                    <Text style={[s.activeBadgeText, plan.isActive ? s.activeBadgeTextOn : s.activeBadgeTextOff]}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  {permissions.canEditPlans && (
                  <View style={s.planBtns}>
                    <TouchableOpacity style={s.editBtn} onPress={() => openEdit(plan)}>
                      <Text style={s.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(plan)}>
                      <Text style={s.deleteBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Add/Edit Modal — only for users with canEditPlans */}
      <Modal visible={modal && permissions.canEditPlans} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <ScrollView contentContainerStyle={s.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={s.modal}>
              <Text style={s.modalTitle}>{editing ? 'Edit Plan' : 'New Plan'}</Text>

              {[
                { label: 'Plan Name *', value: name, setter: setName, placeholder: 'Monthly', keyboard: 'default' as any },
                { label: 'Price (₹) *', value: price, setter: setPrice, placeholder: '999', keyboard: 'numeric' as any },
                { label: 'Duration (days) *', value: duration, setter: setDuration, placeholder: '30', keyboard: 'numeric' as any },
                { label: 'GST Rate (%)', value: gst, setter: setGst, placeholder: '18', keyboard: 'numeric' as any },
                { label: 'Description', value: description, setter: setDescription, placeholder: 'Unlimited gym access...', keyboard: 'default' as any },
              ].map((f) => (
                <View key={f.label} style={s.modalField}>
                  <Text style={s.modalLabel}>{f.label}</Text>
                  <TextInput style={s.modalInput} value={f.value} onChangeText={f.setter}
                    placeholder={f.placeholder} placeholderTextColor={Colors.textMuted}
                    keyboardType={f.keyboard} />
                </View>
              ))}

              {price && duration && (
                <View style={s.preview}>
                  <Text style={s.previewTitle}>Preview</Text>
                  <Text style={s.previewText}>{name || 'Plan'} · {duration} days</Text>
                  <Text style={s.previewPrice}>
                    ₹{parseInt(price || '0').toLocaleString('en-IN')} + ₹{gstAmount(parseInt(price || '0'), parseInt(gst || '18'))} GST
                    = ₹{totalPrice(parseInt(price || '0'), parseInt(gst || '18')).toLocaleString('en-IN')} total
                  </Text>
                </View>
              )}

              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(false)}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnOff]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> :
                    <Text style={s.saveBtnText}>{editing ? 'Save Changes' : 'Create Plan'}</Text>}
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
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title:            { fontSize: 22, fontWeight: '800', color: Colors.primary },
  sub:              { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn:           { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addBtnText:       { color: '#fff', fontSize: 13, fontWeight: '700' },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:             { paddingBottom: 20 },
  empty:            { alignItems: 'center', paddingTop: 60 },
  emptyIcon:        { fontSize: 40, marginBottom: 12 },
  emptyTitle:       { fontSize: 16, color: Colors.textSecondary, marginBottom: 20 },
  seedBtn:          { backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  seedBtnText:      { color: '#fff', fontSize: 14, fontWeight: '700' },
  planCard:         { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 10,
                      borderWidth: 1, borderColor: Colors.border },
  planCardOff:      { opacity: 0.6 },
  planTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  planName:         { fontSize: 16, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  planDuration:     { fontSize: 12, color: Colors.textSecondary },
  planDesc:         { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  planPriceBox:     { alignItems: 'flex-end' },
  planPrice:        { fontSize: 20, fontWeight: '800', color: Colors.primary },
  planTotal:        { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  planActions:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activeBadgeOn:    { backgroundColor: Colors.successLight },
  activeBadgeOff:   { backgroundColor: Colors.border },
  activeBadgeText:  { fontSize: 11, fontWeight: '600' },
  activeBadgeTextOn:{ color: Colors.success },
  activeBadgeTextOff:{ color: Colors.textMuted },
  planBtns:         { flexDirection: 'row', gap: 8 },
  editBtn:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
                      borderWidth: 1, borderColor: Colors.border },
  editBtnText:      { fontSize: 12, fontWeight: '600', color: Colors.primary },
  deleteBtn:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
                      borderWidth: 1, borderColor: Colors.dangerLight, backgroundColor: Colors.dangerLight },
  deleteBtnText:    { fontSize: 12, fontWeight: '600', color: Colors.danger },
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll:      { justifyContent: 'flex-end' },
  modal:            { backgroundColor: Colors.surface, borderRadius: 24, padding: 24, margin: 8 },
  modalTitle:       { fontSize: 20, fontWeight: '700', color: Colors.primary, marginBottom: 20 },
  modalField:       { marginBottom: 16 },
  modalLabel:       { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 6 },
  modalInput:       { backgroundColor: Colors.background, borderRadius: 10, height: 48,
                      paddingHorizontal: 14, fontSize: 15, color: Colors.primary,
                      borderWidth: 1, borderColor: Colors.border },
  preview:          { backgroundColor: Colors.accentLight, borderRadius: 12, padding: 14, marginBottom: 20 },
  previewTitle:     { fontSize: 11, fontWeight: '700', color: Colors.accent, marginBottom: 4 },
  previewText:      { fontSize: 14, fontWeight: '600', color: Colors.primary, marginBottom: 4 },
  previewPrice:     { fontSize: 13, color: Colors.textSecondary },
  modalBtns:        { flexDirection: 'row', gap: 10 },
  cancelBtn:        { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                      borderWidth: 1, borderColor: Colors.border },
  cancelText:       { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  saveBtn:          { flex: 2, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: Colors.primary },
  saveBtnOff:       { opacity: 0.5 },
  saveBtnText:      { color: '#fff', fontSize: 15, fontWeight: '700' },
});