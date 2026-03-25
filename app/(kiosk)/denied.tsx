import { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function KioskDenied() {
  const { reason } = useLocalSearchParams<{ reason: string }>();
  const scale = new Animated.Value(0);

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 50 }).start();
    const t = setTimeout(() => router.replace('/(kiosk)/idle'), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={s.container}>
      <View style={s.circle1} />
      <View style={s.circle2} />

      <Animated.View style={[s.xBox, { transform: [{ scale }] }]}>
        <Text style={s.xMark}>✗</Text>
      </Animated.View>

      <Text style={s.deniedText}>Access Denied</Text>
      <Text style={s.reason}>{reason || 'Membership issue'}</Text>
      <Text style={s.contact}>Please contact gym staff for assistance</Text>
      <Text style={s.redirecting}>Returning to home screen...</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#1A0A0A', alignItems: 'center', justifyContent: 'center', padding: 40 },
  circle1:     { position: 'absolute', width: 400, height: 400, borderRadius: 200,
                 backgroundColor: 'rgba(239,68,68,0.1)', top: -100, right: -100 },
  circle2:     { position: 'absolute', width: 300, height: 300, borderRadius: 150,
                 backgroundColor: 'rgba(239,68,68,0.08)', bottom: -50, left: -80 },
  xBox:        { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.danger,
                 alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  xMark:       { fontSize: 60, color: '#fff' },
  deniedText:  { fontSize: 42, fontWeight: '800', color: '#fff', marginBottom: 16 },
  reason:      { fontSize: 18, color: Colors.danger, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  contact:     { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 32 },
  redirecting: { fontSize: 13, color: 'rgba(255,255,255,0.3)' },
});