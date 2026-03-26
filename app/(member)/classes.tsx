import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuthContext } from '@/store/AuthContext';
import api from '@/services/api';

const fmt = (d: string) =>
  new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

const DAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

export default function MemberClasses() {
  const { colors, isDark } = useTheme();
  const { user } = useAuthContext();
  const s = makeStyles(colors);

  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [gymId, setGymId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // Get member profile to find gymId
      const profileRes = await api.get('/me/member-profile');
      const gId = profileRes.data.data?.gymId;
      setGymId(gId);

      const [allRes, myRes] = await Promise.all([
        gId ? api.get(`/gyms/${gId}/classes`) : Promise.resolve({ data: { data: [] } }),
        api.get('/me/classes'),
      ]);

      setAllClasses(allRes.data.data || []);
      setMyClasses(myRes.data.data || []);
    } catch { } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const isEnrolled = (cls: any) =>
    cls.enrolled?.some((id: any) => id === user?.id || id?._id === user?.id) ||
    myClasses.some(mc => mc._id === cls._id);

  const handleEnroll = async (cls: any) => {
    if (!gymId) return;
    const enrolled = isEnrolled(cls);
    const action = enrolled ? 'Leave' : 'Join';

    Alert.alert(action, `${action} "${cls.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action, onPress: async () => {
          setEnrolling(cls._id);
          try {
            if (enrolled) {
              await api.delete(`/gyms/${gymId}/classes/${cls._id}/enroll`);
              Alert.alert('Done', `You left "${cls.title}"`);
            } else {
              await api.post(`/gyms/${gymId}/classes/${cls._id}/enroll`);
              Alert.alert('Enrolled!', `You joined "${cls.title}" 🎉`);
            }
            fetchData();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message);
          } finally { setEnrolling(null); }
        }
      },
    ]);
  };

  const renderClass = ({ item }: any) => {
    const enrolled = isEnrolled(item);
    const spotsLeft = item.capacity - (item.enrolled?.length || 0);
    const isFull = spotsLeft <= 0 && !enrolled;
    const isLoading = enrolling === item._id;

    return (
      <View style={[s.card, { borderLeftColor: item.color || colors.accent }]}>
        <View style={s.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={[s.cardTitle, { color: colors.primary }]}>{item.title}</Text>
            <Text style={[s.cardTrainer, { color: colors.textSecondary }]}>👤 {item.trainer}</Text>
          </View>
          {enrolled && (
            <View style={[s.enrolledBadge, { backgroundColor: colors.successLight }]}>
              <Text style={[s.enrolledBadgeText, { color: colors.success }]}>✓ Enrolled</Text>
            </View>
          )}
        </View>

        <View style={s.cardMeta}>
          <Text style={[s.metaText, { color: colors.textSecondary }]}>📅 {fmtDate(item.startTime)}</Text>
          <Text style={[s.metaText, { color: colors.textSecondary }]}>🕐 {fmt(item.startTime)} – {fmt(item.endTime)}</Text>
          {item.location && <Text style={[s.metaText, { color: colors.textSecondary }]}>📍 {item.location}</Text>}
          {item.isRecurring && item.days?.length > 0 && (
            <Text style={[s.metaText, { color: colors.accent }]}>
              🔄 {item.days.map((d: string) => DAY_SHORT[d]).join(', ')}
            </Text>
          )}
          {item.description && <Text style={[s.metaText, { color: colors.textMuted }]}>{item.description}</Text>}
        </View>

        <View style={s.cardFooter}>
          <Text style={[s.spotsText, { color: colors.textMuted }]}>
            {isFull ? '🔴 Class full' : `${spotsLeft} spots left`}
          </Text>
          <TouchableOpacity
            style={[
              s.enrollBtn,
              enrolled
                ? { backgroundColor: colors.surfaceSecond, borderColor: colors.border }
                : isFull
                  ? { backgroundColor: colors.surfaceSecond, borderColor: colors.border, opacity: 0.5 }
                  : { backgroundColor: colors.accent },
            ]}
            onPress={() => !isFull && handleEnroll(item)}
            disabled={isFull && !enrolled || isLoading}
          >
            {isLoading
              ? <ActivityIndicator color={enrolled ? colors.textSecondary : '#fff'} size="small" />
              : <Text style={[s.enrollBtnText, { color: enrolled ? colors.textSecondary : '#fff' }]}>
                {enrolled ? 'Leave Class' : 'Join Class'}
              </Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const displayData = tab === 'mine' ? myClasses : allClasses;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.primary }]}>Classes</Text>
      </View>

      {/* Tab switcher */}
      <View style={[s.tabRow, { backgroundColor: colors.surfaceSecond }]}>
        <TouchableOpacity
          style={[s.tab, tab === 'all' && { backgroundColor: colors.surface }]}
          onPress={() => setTab('all')}
        >
          <Text style={[s.tabText, { color: tab === 'all' ? colors.primary : colors.textMuted }]}>
            All Classes ({allClasses.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'mine' && { backgroundColor: colors.surface }]}
          onPress={() => setTab('mine')}
        >
          <Text style={[s.tabText, { color: tab === 'mine' ? colors.primary : colors.textMuted }]}>
            My Classes ({myClasses.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.accent} size="large" /></View>
      ) : (
        <FlatList
          data={displayData}
          renderItem={renderClass}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.accent} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>🏋️</Text>
              <Text style={[s.emptyTitle, { color: colors.primary }]}>
                {tab === 'mine' ? "You haven't joined any classes" : "No classes available"}
              </Text>
              <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                {tab === 'mine' ? 'Switch to "All Classes" to browse and join' : 'Check back later for new classes'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 14, padding: 4, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 13, textAlign: 'center' },
  card: {
    borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 4,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardTrainer: { fontSize: 13 },
  enrolledBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  enrolledBadgeText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { gap: 4, marginBottom: 12 },
  metaText: { fontSize: 12 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border
  },
  spotsText: { fontSize: 12 },
  enrollBtn: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1, borderColor: 'transparent', minWidth: 100, alignItems: 'center'
  },
  enrollBtnText: { fontSize: 13, fontWeight: '700' },
});