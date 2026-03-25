import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAppContext } from '@/store/AppContext';
import { Colors } from '@/constants/colors';

export default function KioskIdle() {
  const { gym } = useAppContext();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <View style={s.container}>
      {/* Background decoration */}
      <View style={s.circle1} />
      <View style={s.circle2} />

      {/* Logo */}
      <View style={s.logoBox}>
        <Text style={s.logoText}>G</Text>
      </View>
      <Text style={s.gymName}>{gym?.name || 'GymOS'}</Text>

      {/* Time */}
      <Text style={s.time}>{timeStr}</Text>
      <Text style={s.date}>{dateStr}</Text>

      {/* Scan button */}
      <TouchableOpacity
        style={s.scanBtn}
        onPress={() => router.push('/(kiosk)/scan')}
        activeOpacity={0.85}
      >
        <Text style={s.scanIcon}>📱</Text>
        <Text style={s.scanTitle}>Tap to Check In</Text>
        <Text style={s.scanSub}>Scan your QR code</Text>
      </TouchableOpacity>

      <Text style={s.footer}>GymOS — Powered by technology</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, alignItems: 'center',
               justifyContent: 'center', padding: 40 },
  circle1:   { position: 'absolute', width: 400, height: 400, borderRadius: 200,
               backgroundColor: 'rgba(99,102,241,0.15)', top: -100, right: -100 },
  circle2:   { position: 'absolute', width: 300, height: 300, borderRadius: 150,
               backgroundColor: 'rgba(99,102,241,0.1)', bottom: -50, left: -80 },
  logoBox:   { width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.accent,
               alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText:  { fontSize: 40, fontWeight: '800', color: '#fff' },
  gymName:   { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 32, letterSpacing: -0.5 },
  time:      { fontSize: 72, fontWeight: '800', color: '#fff', letterSpacing: -2, lineHeight: 80 },
  date:      { fontSize: 18, color: 'rgba(255,255,255,0.6)', marginBottom: 48 },
  scanBtn:   { backgroundColor: Colors.accent, borderRadius: 24, padding: 28,
               alignItems: 'center', width: '100%', maxWidth: 320 },
  scanIcon:  { fontSize: 48, marginBottom: 10 },
  scanTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  scanSub:   { fontSize: 15, color: 'rgba(255,255,255,0.8)' },
  footer:    { position: 'absolute', bottom: 24, fontSize: 12,
               color: 'rgba(255,255,255,0.3)' },
});