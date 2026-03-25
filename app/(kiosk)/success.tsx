import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import api from '@/services/api';
import { useAppContext } from '@/store/AppContext';

export default function KioskSuccess() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const { gymId } = useAppContext();
  const [member, setMember] = useState<any>(null);
  const scale = new Animated.Value(0);

  useEffect(() => {
    // Animate check mark
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 50 }).start();

    // Fetch member details
    if (gymId && memberId) {
      api.get(`/gyms/${gymId}/members/${memberId}`)
        .then(({ data }) => setMember(data.data))
        .catch(() => {});
    }

    // Auto return to idle after 4 seconds
    const t = setTimeout(() => router.replace('/(kiosk)/idle'), 4000);
    return () => clearTimeout(t);
  }, []);

  const user     = member?.userId || {};
  const initials = user.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?';
  const timeStr  = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={s.container}>
      <View style={s.circle1} />
      <View style={s.circle2} />

      {/* Animated check */}
      <Animated.View style={[s.checkBox, { transform: [{ scale }] }]}>
        <Text style={s.checkMark}>✓</Text>
      </Animated.View>

      <Text style={s.successText}>Welcome!</Text>
      {user.fullName && <Text style={s.memberName}>{user.fullName}</Text>}
      <Text style={s.time}>Checked in at {timeStr}</Text>

      {member && (
        <View style={s.memberCard}>
          <View style={s.memberAvatar}>
            <Text style={s.memberAvatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={s.memberCode}>{member.memberCode}</Text>
            <Text style={s.memberPlan}>{member.planName || 'Member'}</Text>
          </View>
        </View>
      )}

      <Text style={s.redirecting}>Returning to home screen...</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0A1A0A', alignItems: 'center', justifyContent: 'center', padding: 40 },
  circle1:          { position: 'absolute', width: 400, height: 400, borderRadius: 200,
                      backgroundColor: 'rgba(34,197,94,0.1)', top: -100, right: -100 },
  circle2:          { position: 'absolute', width: 300, height: 300, borderRadius: 150,
                      backgroundColor: 'rgba(34,197,94,0.08)', bottom: -50, left: -80 },
  checkBox:         { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.success,
                      alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  checkMark:        { fontSize: 60, color: '#fff' },
  successText:      { fontSize: 48, fontWeight: '800', color: '#fff', marginBottom: 8 },
  memberName:       { fontSize: 24, fontWeight: '600', color: Colors.success, marginBottom: 8 },
  time:             { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 32 },
  memberCard:       { flexDirection: 'row', alignItems: 'center', gap: 14,
                      backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 32 },
  memberAvatar:     { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.success,
                      alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  memberCode:       { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  memberPlan:       { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  redirecting:      { fontSize: 13, color: 'rgba(255,255,255,0.3)' },
});