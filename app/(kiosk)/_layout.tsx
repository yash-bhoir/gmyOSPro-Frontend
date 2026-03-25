import { Stack } from 'expo-router';
export default function KioskLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="idle" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="success" />
      <Stack.Screen name="denied" />
    </Stack>
  );
}