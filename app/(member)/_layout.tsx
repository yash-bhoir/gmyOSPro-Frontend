import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

export default function MemberLayout() {
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
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="checkin"
        options={{
          title: 'Check In',
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="qr-code-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="membership"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="card-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}