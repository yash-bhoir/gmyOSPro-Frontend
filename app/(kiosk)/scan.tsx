import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
export default function KioskScan() {
  return (
    <View style={s.container}>
      <Text style={s.text}>Scanner</Text>
      <Text style={s.sub}>QR scan coming soon</Text>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  text:      { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 8 },
  sub:       { fontSize: 16, color: 'rgba(255,255,255,0.7)' },
});