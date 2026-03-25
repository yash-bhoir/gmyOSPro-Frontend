import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   '#F59E0B',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: {
          backgroundColor: '#111111',
          borderTopColor:  'rgba(255,255,255,0.1)',
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
          title: 'Overview',
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gyms"
        options={{
          title: 'Gyms',
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="business-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="revenue"
        options={{
          title: 'Revenue',
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="gym-detail" options={{ href: null }} />
    </Tabs>
  );
}