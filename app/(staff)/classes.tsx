import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ScrollView, TextInput, Alert, ActivityIndicator,
  RefreshControl, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAppContext } from '@/store/AppContext';
import { useAuthContext } from '@/store/AuthContext';
import { useStaffRole } from '@/hooks/useStaffRole';
import api from '@/services/api';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_SHORT: Record<string,string> = {
  monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu',
  friday:'Fri', saturday:'Sat', sunday:'Sun',
};
const COLORS = ['#6366F1','#22C55E','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899'];

const fmt = (d: string) =>
  new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

export default function StaffClasses() {
  const { colors } = useTheme();
  const { gymId }  = useAppContext();
  const { user }   = useAuthContext();
  const { permissions } = useStaffRole();
  const s = makeStyles(colors);

  const [classes, setClasses]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal]           = useState(false);
  const [saving, setSaving]         = useState(false);

  const [title, setTitle]           = useState('');
  const [description, setDesc]      = useState('');
  const [trainer, setTrainer]       = useState(user?.fullName || '');
  const [startTime, setStartTime]   = useState('');
  const [endTime, setEndTime]       = useState('');
  const [capacity, setCapacity]     = useState('20');
  const [location, setLocation]     = useState('');
  const [isRecurring, setRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedColor, setColor]   = useState(COLORS[0]);

  const fetchClasses = async () => {
    if (!gymId) return;
    try {
      const { data } = await api.get(`/gyms/${gymId}/classes`);
      setClasses(data.data || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchClasses(); }, [gymId]);

  const toggleDay = (day: string) =>
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  const resetForm = () => {
    setTitle(''); setDesc(''); setTrainer(user?.fullName || '');
    setStartTime(''); setEndTime(''); setCapacity('20');
    setLocation(''); setRecurring(false);
    setSelectedDays([]); setColor(COLORS[0]);
  };

  const handleCreate = async () => {
    if (!title.trim())     { Alert.alert('Error', 'Class title is required'); return; }
    if (!trainer.trim())   { Alert.alert('Error', 'Trainer name is required'); return; }
    if (!startTime.trim()) { Alert.alert('Error', 'Start time required (e.g. 2026-04-01T09:00)'); return; }
    if (!endTime.trim())   { Alert.alert('Error', 'End time is required'); return; }

    setSaving(true);
    try {
      await api.post(`/gyms/${gymId}/classes`, {
        title, description, trainer,
        startTime: new Date(startTime).toISOString(),
        endTime:   new Date(endTime).toISOString(),
        capacity:  parseInt(capacity) || 20,
        location, isRecurring,
        days:      isRecurring ? selectedDays : [],
        color:     selectedColor,
      });
      Alert.alert('Success', `"${title}" class created`);
      setModal(false);
      resetForm();
      fetchClasses();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create class');
    } finally { setSaving(false); }
  };

  const handleCancel = (cls: any) => {
    Alert.alert('Cancel Class', `Cancel "${cls.title}"?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/gyms/${gymId}/classes/${cls._id}`);
          fetchClasses();
        } catch (err: any) {
          Alert.alert('Error', err?.response?.data?.message);
        }
      }},
    ]);
  };

  const renderClass = ({ item }: any) => {
    const spotsLeft = item.capacity - (item.enrolled?.length || 0);
    const isFull    = spotsLeft <= 0;
    return (
      <View style={[s.classCard, { borderLeftColor: item.color || colors.accent }]}>
        <View style={s.classTop}>
          <View style={{ flex: 1 }}>
            <Text style={[s.classTitle, { color: colors.primary }]}>{item.title}</Text>
            <Text style={[s.classTrainer, { color: colors.textSecondary }]}>👤 {item.trainer}</Text>
          </View>
          <View style={[s.classBadge, { backgroundColor: isFull ? colors.dangerLight : colors.successLight }]}>
            <Text style={[s.classBadgeText, { color: isFull ? colors.danger : colors.success }]}>
              {isFull ? 'Full' : `${spotsLeft} spots`}
            </Text>
          </View>
        </View>

        <View style={s.classMeta}>
          <Text style={[s.classMeta1, { color: colors.textSecondary }]}>📅 {fmtDate(item.startTime)}</Text>
          <Text style={[s.classMeta1, { color: colors.textSecondary }]}>🕐 {fmt(item.startTime)} – {fmt(item.endTime)}</Text>
          {item.location ? <Text style={[s.classMeta1, { color: colors.textSecondary }]}>📍 {item.location}</Text> : null}
          {item.isRecurring && item.days?.length > 0 && (
            <Text style={[s.classMeta1, { color: colors.accent }]}>
              🔄 {item.days.map((d: string) => DAY_SHORT[d]).join(', ')}
            </Text>
          )}
        </View>

        <View style={s.classFooter}>
          <Text style={[s.classEnrolled, { color: colors.textMuted }]}>
            {item.enrolled?.length || 0}/{item.capacity} enrolled
          </Text>
          {permissions.canCancelClass && (
            <TouchableOpacity
              style={[s.cancelBtn, { borderColor: colors.danger + '60' }]}
              onPress={() => handleCancel(item)}
            >
              <Text style={[s.cancelBtnText, { color: colors.danger }]}>Cancel Class</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.primary }]}>Classes</Text>
        {permissions.canCreateClass && (
          <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.accent }]} onPress={() => setModal(true)}>
            <Text style={s.addBtnText}>+ Add Class</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.accent} size="large" /></View>
      ) : (
        <FlatList
          data={classes}
          renderItem={renderClass}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchClasses(); }} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>🏋️</Text>
              <Text style={[s.emptyTitle, { color: colors.primary }]}>No classes yet</Text>
              <Text style={[s.emptySubtitle, { color: colors.textSecondary }]}>
                {permissions.canCreateClass
                  ? 'Tap "+ Add Class" to create your first class'
                  : 'No classes scheduled yet'}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal only renders if user has create permission */}
      {permissions.canCreateClass && (
        <Modal visible={modal} transparent animationType="slide" onRequestClose={() => { setModal(false); resetForm(); }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => { setModal(false); resetForm(); }} />
            <View style={[s.sheet, { backgroundColor: colors.surface }]}>
              <View style={s.handle} />
              <Text style={[s.sheetTitle, { color: colors.primary }]}>Create New Class</Text>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {[
                  { label: 'Class Title *',  value: title,       set: setTitle,    placeholder: 'e.g. Morning Yoga' },
                  { label: 'Trainer Name *', value: trainer,     set: setTrainer,  placeholder: 'Trainer name' },
                  { label: 'Location',       value: location,    set: setLocation, placeholder: 'e.g. Studio A' },
                  { label: 'Description',    value: description, set: setDesc,     placeholder: 'Brief description (optional)' },
                ].map(f => (
                  <View key={f.label} style={s.field}>
                    <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{f.label}</Text>
                    <TextInput
                      style={[s.fieldInput, { color: colors.primary, borderColor: colors.border, backgroundColor: colors.surfaceSecond }]}
                      value={f.value} onChangeText={f.set}
                      placeholder={f.placeholder} placeholderTextColor={colors.textMuted}
                    />
                  </View>
                ))}

                <View style={s.row2}>
                  <View style={[s.field, { flex: 1 }]}>
                    <Text style={[s.fieldLabel, { color: colors.textMuted }]}>Start *</Text>
                    <TextInput
                      style={[s.fieldInput, { color: colors.primary, borderColor: colors.border, backgroundColor: colors.surfaceSecond }]}
                      value={startTime} onChangeText={setStartTime}
                      placeholder="2026-04-01T09:00" placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={[s.field, { flex: 1 }]}>
                    <Text style={[s.fieldLabel, { color: colors.textMuted }]}>End *</Text>
                    <TextInput
                      style={[s.fieldInput, { color: colors.primary, borderColor: colors.border, backgroundColor: colors.surfaceSecond }]}
                      value={endTime} onChangeText={setEndTime}
                      placeholder="2026-04-01T10:00" placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <View style={s.field}>
                  <Text style={[s.fieldLabel, { color: colors.textMuted }]}>Capacity</Text>
                  <TextInput
                    style={[s.fieldInput, { color: colors.primary, borderColor: colors.border, backgroundColor: colors.surfaceSecond }]}
                    value={capacity} onChangeText={setCapacity}
                    placeholder="20" placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>

                <View style={s.field}>
                  <Text style={[s.fieldLabel, { color: colors.textMuted }]}>Color</Text>
                  <View style={s.colorRow}>
                    {COLORS.map(c => (
                      <TouchableOpacity
                        key={c}
                        style={[s.colorDot, { backgroundColor: c }, selectedColor === c && s.colorDotSelected]}
                        onPress={() => setColor(c)}
                      />
                    ))}
                  </View>
                </View>

                <View style={[s.toggleRow, { borderColor: colors.border }]}>
                  <View>
                    <Text style={[s.toggleLabel, { color: colors.primary }]}>Recurring Class</Text>
                    <Text style={[s.toggleSub, { color: colors.textSecondary }]}>Repeats on selected days</Text>
                  </View>
                  <Switch
                    value={isRecurring} onValueChange={setRecurring}
                    trackColor={{ false: colors.border, true: colors.accent }}
                    thumbColor="#fff"
                  />
                </View>

                {isRecurring && (
                  <View style={s.field}>
                    <Text style={[s.fieldLabel, { color: colors.textMuted }]}>Repeat On</Text>
                    <View style={s.daysRow}>
                      {DAYS.map(day => (
                        <TouchableOpacity
                          key={day}
                          style={[s.dayChip, { borderColor: colors.border }, selectedDays.includes(day) && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                          onPress={() => toggleDay(day)}
                        >
                          <Text style={[s.dayChipText, { color: selectedDays.includes(day) ? '#fff' : colors.textSecondary }]}>
                            {DAY_SHORT[day]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>

              <View style={s.sheetBtns}>
                <TouchableOpacity style={[s.cancelBtnSheet, { borderColor: colors.border }]} onPress={() => { setModal(false); resetForm(); }}>
                  <Text style={[s.cancelBtnSheetText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.saveBtn, { backgroundColor: colors.accent }, saving && { opacity: 0.5 }]}
                  onPress={handleCreate} disabled={saving}
                >
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Create Class</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  safe:              { flex: 1 },
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title:             { fontSize: 22, fontWeight: '800' },
  addBtn:            { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText:        { color: '#fff', fontSize: 13, fontWeight: '700' },
  center:            { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:             { alignItems: 'center', paddingTop: 80 },
  emptyTitle:        { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle:     { fontSize: 14, textAlign: 'center' },
  classCard:         { borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 4,
                       backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  classTop:          { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  classTitle:        { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  classTrainer:      { fontSize: 13 },
  classBadge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  classBadgeText:    { fontSize: 11, fontWeight: '700' },
  classMeta:         { gap: 4, marginBottom: 12 },
  classMeta1:        { fontSize: 12 },
  classFooter:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                       paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border },
  classEnrolled:     { fontSize: 12 },
  cancelBtn:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  cancelBtnText:     { fontSize: 12, fontWeight: '600' },
  sheet:             { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20,
                       paddingTop: 12, paddingBottom: 32, height: '88%' },
  handle:            { width: 36, height: 4, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle:        { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  field:             { marginBottom: 14 },
  fieldLabel:        { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  fieldInput:        { borderRadius: 12, height: 48, paddingHorizontal: 14, fontSize: 14, borderWidth: 1 },
  row2:              { flexDirection: 'row', gap: 10 },
  colorRow:          { flexDirection: 'row', gap: 10 },
  colorDot:          { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected:  { borderWidth: 3, borderColor: '#000', transform: [{ scale: 1.2 }] },
  toggleRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                       paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  toggleLabel:       { fontSize: 14, fontWeight: '600' },
  toggleSub:         { fontSize: 12, marginTop: 2 },
  daysRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip:           { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  dayChipText:       { fontSize: 12, fontWeight: '600' },
  sheetBtns:         { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtnSheet:    { flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cancelBtnSheetText:{ fontSize: 14, fontWeight: '600' },
  saveBtn:           { flex: 2, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtnText:       { color: '#fff', fontSize: 15, fontWeight: '700' },
});