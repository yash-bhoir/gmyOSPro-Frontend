import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

export default function StaffLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor:  colors.border,
          borderTopWidth:  0.5,
          height:          62,
          paddingBottom:   8,
          paddingTop:      4,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'Members',
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: 'Billing',
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="cash-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="staff"         options={{ href: null }} />
      <Tabs.Screen name="plans"         options={{ href: null }} />
      <Tabs.Screen name="add-member"    options={{ href: null }} />
      <Tabs.Screen name="member-detail" options={{ href: null }} />
      <Tabs.Screen name="classes"       options={{ href: null }} />
      <Tabs.Screen name="onboarding"    options={{ href: null }} />
      <Tabs.Screen name="broadcast"     options={{ href: null }} />
    </Tabs>
  );
}