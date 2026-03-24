import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
export default function KioskIdle() {
  return (
    <View style={s.container}>
      <Text style={s.logo}>GymOS</Text>
      <Text style={s.sub}>Scan your QR code to check in</Text>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  logo:      { fontSize: 48, fontWeight: '800', color: '#fff', marginBottom: 16 },
  sub:       { fontSize: 18, color: 'rgba(255,255,255,0.7)' },
});