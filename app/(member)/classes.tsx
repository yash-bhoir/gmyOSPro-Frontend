import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const SAMPLE_CLASSES = [
  { id:'1', name:'Morning Yoga',    time:'06:30 AM', duration:'60 min', trainer:'Priya', capacity:15, enrolled:10, day:'Mon' },
  { id:'2', name:'HIIT Cardio',     time:'07:30 AM', duration:'45 min', trainer:'Rahul', capacity:20, enrolled:18, day:'Mon' },
  { id:'3', name:'Zumba',           time:'09:00 AM', duration:'60 min', trainer:'Sneha', capacity:25, enrolled:12, day:'Tue' },
  { id:'4', name:'Weight Training', time:'06:00 PM', duration:'90 min', trainer:'Amit',  capacity:12, enrolled:12, day:'Wed' },
  { id:'5', name:'Pilates',         time:'07:00 AM', duration:'60 min', trainer:'Neha',  capacity:10, enrolled:4,  day:'Thu' },
  { id:'6', name:'CrossFit',        time:'06:00 AM', duration:'60 min', trainer:'Vikram',capacity:15, enrolled:9,  day:'Fri' },
  { id:'7', name:'Weekend Flow',    time:'08:00 AM', duration:'75 min', trainer:'Priya', capacity:20, enrolled:14, day:'Sat' },
];

export default function ClassesScreen() {
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [booked, setBooked]       = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const classes = SAMPLE_CLASSES.filter(c => c.day === activeDay);

  const toggleBook = (id: string) => {
    setBooked(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />}
      >
        <Text style={s.title}>Classes</Text>
        <Text style={s.sub}>Book your session for the week</Text>

        {/* Day tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dayScroll} contentContainerStyle={s.dayRow}>
          {DAYS.map((d) => (
            <TouchableOpacity key={d} style={[s.dayBtn, activeDay === d && s.dayBtnActive]} onPress={() => setActiveDay(d)}>
              <Text style={[s.dayText, activeDay === d && s.dayTextActive]}>{d}</Text>
              {SAMPLE_CLASSES.filter(c => c.day === d).length > 0 && (
                <View style={[s.dayDot, activeDay === d && s.dayDotActive]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Classes */}
        {classes.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyIcon}>🧘</Text><Text style={s.emptyText}>No classes on {activeDay}</Text></View>
        ) : (
          classes.map((cls) => {
            const isFull   = cls.enrolled >= cls.capacity;
            const isBooked = booked.includes(cls.id);
            return (
              <View key={cls.id} style={s.classCard}>
                <View style={s.classTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.className}>{cls.name}</Text>
                    <Text style={s.classMeta}>🕐 {cls.time} · ⏱ {cls.duration} · 👤 {cls.trainer}</Text>
                  </View>
                  <View style={[s.spotsBox, isFull && s.spotsBoxFull]}>
                    <Text style={[s.spotsText, isFull && s.spotsTextFull]}>
                      {isFull ? 'Full' : `${cls.capacity - cls.enrolled} spots`}
                    </Text>
                  </View>
                </View>
                <View style={s.classBottom}>
                  <View style={s.capacityBar}>
                    <View style={[s.capacityFill, {
                      width: `${(cls.enrolled / cls.capacity) * 100}%` as any,
                      backgroundColor: isFull ? Colors.danger : Colors.success,
                    }]} />
                  </View>
                  <Text style={s.capacityText}>{cls.enrolled}/{cls.capacity} enrolled</Text>
                </View>
                <TouchableOpacity
                  style={[s.bookBtn, isBooked && s.bookBtnBooked, isFull && !isBooked && s.bookBtnFull]}
                  onPress={() => !isFull && toggleBook(cls.id)}
                  disabled={isFull && !isBooked}
                >
                  <Text style={[s.bookText, isBooked && s.bookTextBooked]}>
                    {isBooked ? '✓ Booked — Cancel' : isFull ? 'Class Full' : 'Book Class'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  scroll:        { padding: 20, paddingBottom: 32 },
  title:         { fontSize: 24, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  sub:           { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  dayScroll:     { marginHorizontal: -4, marginBottom: 20 },
  dayRow:        { paddingHorizontal: 4, gap: 8 },
  dayBtn:        { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
                   backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  dayBtnActive:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayText:       { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  dayTextActive: { color: '#fff' },
  dayDot:        { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent, marginTop: 3 },
  dayDotActive:  { backgroundColor: '#fff' },
  empty:         { alignItems: 'center', padding: 40 },
  emptyIcon:     { fontSize: 40, marginBottom: 12 },
  emptyText:     { fontSize: 15, color: Colors.textSecondary },
  classCard:     { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12,
                   borderWidth: 1, borderColor: Colors.border },
  classTop:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  className:     { fontSize: 16, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  classMeta:     { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  spotsBox:      { backgroundColor: Colors.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  spotsBoxFull:  { backgroundColor: Colors.dangerLight },
  spotsText:     { fontSize: 11, fontWeight: '700', color: Colors.success },
  spotsTextFull: { color: Colors.danger },
  classBottom:   { marginBottom: 12 },
  capacityBar:   { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: 4 },
  capacityFill:  { height: 4, borderRadius: 2 },
  capacityText:  { fontSize: 11, color: Colors.textSecondary },
  bookBtn:       { backgroundColor: Colors.accent, borderRadius: 10, height: 42, alignItems: 'center', justifyContent: 'center' },
  bookBtnBooked: { backgroundColor: Colors.successLight, borderWidth: 1, borderColor: Colors.success },
  bookBtnFull:   { backgroundColor: Colors.border },
  bookText:      { fontSize: 14, fontWeight: '700', color: '#fff' },
  bookTextBooked:{ color: Colors.success },
});