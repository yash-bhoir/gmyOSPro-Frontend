import { Tabs } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function StaffLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="dashboard"     options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="members"       options={{ title: 'Members' }} />
      <Tabs.Screen name="billing"       options={{ title: 'Billing' }} />
      <Tabs.Screen name="plans"         options={{ title: 'Plans' }} />
      <Tabs.Screen name="settings"      options={{ title: 'Settings' }} />
      {/* Hidden routes — no tab */}
      <Tabs.Screen name="add-member"    options={{ href: null }} />
      <Tabs.Screen name="member-detail" options={{ href: null }} />
      <Tabs.Screen name="classes"       options={{ href: null }} />
      <Tabs.Screen name="onboarding"    options={{ href: null }} />
    </Tabs>
  );
}