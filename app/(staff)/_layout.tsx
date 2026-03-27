import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useStaffRole } from '@/hooks/useStaffRole';
import { useAuthContext } from '@/store/AuthContext';
import { useAppContext } from '@/store/AppContext';
import { Ionicons } from '@expo/vector-icons';

export default function StaffLayout() {
  const { colors } = useTheme();
  const { permissions } = useStaffRole();
  const { user } = useAuthContext();
  const { gym, isLoadingGym, refreshGym } = useAppContext();

  // Load gym on mount for gym_owner
  useEffect(() => {
    if (user?.role === 'gym_owner') refreshGym();
  }, [user?.role]);

  // Gate gym_owner on setup completion
  useEffect(() => {
    if (user?.role !== 'gym_owner' || isLoadingGym) return;
    // No gym yet (self-registered, never created gym) OR gym exists but setup incomplete
    if (!gym || !gym.isSetupComplete) {
      router.replace('/(staff)/onboarding' as any);
    }
  }, [user?.role, gym, isLoadingGym]);

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
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'Members',
          href: permissions.canViewMembers ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: 'Billing',
          href: permissions.canViewBilling ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="cash-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          href: permissions.canViewReports ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
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