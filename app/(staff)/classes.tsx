import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

export default function Screen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>classes</Text>
        <Text style={s.sub}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: 20 },
  title:     { fontSize: 24, fontWeight: '700', color: Colors.primary, marginTop: 20, marginBottom: 8, textTransform: 'capitalize' },
  sub:       { fontSize: 14, color: Colors.textSecondary },
});