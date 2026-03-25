import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthContext } from '@/store/AuthContext';
import { useAppContext } from '@/store/AppContext';
import { Colors } from '@/constants/colors';
import api from '@/services/api';

type Destination =
  | '/(admin)'
  | '/(staff)/dashboard'
  | '/(staff)/onboarding'
  | '/(member)';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const { setGym } = useAppContext();
  const [checking, setChecking]       = useState(true);
  const [destination, setDestination] = useState<Destination | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { setChecking(false); return; }

    determineDestination();
  }, [isAuthenticated, isLoading, user]);

  const determineDestination = async () => {
    const role = user?.role || 'member';
    // ── Super admin → admin dashboard directly ──
    if (role === 'super_admin') {
      setDestination('/(admin)');
      setChecking(false);
      return;
    }

    // ── Check if user is staff at any gym ──
    try {
      const staffRes = await api.get('/me/staff-profile');
      if (staffRes.data.data) {
        const staffProfile = staffRes.data.data;
        // Load their gym into context
        const gym = staffProfile.gymId;
        if (gym) setGym(gym);
        setDestination('/(staff)/dashboard');
        setChecking(false);
        return;
      }
    } catch {}

    // ── Check if user owns a gym ──
    try {
      const gymRes = await api.get('/gyms/my');
      if (gymRes.data.data) {
        const gym = gymRes.data.data;
        setGym(gym);
        // Gym exists but setup not complete → onboarding
        if (!gym.isSetupComplete) {
          setDestination('/(staff)/onboarding');
        } else {
          setDestination('/(staff)/dashboard');
        }
        setChecking(false);
        return;
      }
    } catch {}

    // ── If systemRole is gym_owner but no gym yet → onboarding ──
    if (role === 'gym_owner') {
      setDestination('/(staff)/onboarding');
      setChecking(false);
      return;
    }

    // ── Default → member app ──
    setDestination('/(member)');
    setChecking(false);
  };

  if (isLoading || checking) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (destination)      return <Redirect href={destination} />;

  return <Redirect href="/(member)" />;
}

const s = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
});