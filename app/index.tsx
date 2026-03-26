import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthContext } from '@/store/AuthContext';
import { useAppContext } from '@/store/AppContext';
import { Colors } from '@/constants/colors';
import api from '@/services/api';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const { setGym } = useAppContext();
  const [checking, setChecking]       = useState(true);
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { setChecking(false); return; }
    determineDestination();
  }, [isAuthenticated, isLoading, user]);

  const determineDestination = async () => {
    const role = user?.role || 'member';

    // Super admin → admin dashboard
    if (role === 'super_admin') {
      setDestination('/(admin)');
      setChecking(false);
      return;
    }

    // Check if user is staff at any gym
    try {
      const staffRes = await api.get('/me/staff-profile');
      if (staffRes.data.data) {
        const gym = staffRes.data.data.gymId;
        if (gym) setGym(gym);
        setDestination('/(staff)/dashboard');
        setChecking(false);
        return;
      }
    } catch {}

    // Check if user owns a gym
    try {
      const gymRes = await api.get('/gyms/my');
      if (gymRes.data.data) {
        const gym = gymRes.data.data;
        setGym(gym);
        // ── KEY FIX: gym exists → always go to dashboard ──
        // Only show onboarding if gym exists but setup is NOT complete
        // AND the gym was JUST created (no members, no plans)
        if (!gym.isSetupComplete) {
          // Check if gym has any plans — if yes, skip onboarding
          try {
            const plansRes = await api.get(`/gyms/${gym._id}/plans`);
            const plans = plansRes.data.data || [];
            if (plans.length > 0) {
              // Has plans = was set up externally (by admin) — go to dashboard
              setDestination('/(staff)/dashboard');
            } else {
              // No plans = truly new gym, show onboarding
              setDestination('/(staff)/onboarding');
            }
          } catch {
            setDestination('/(staff)/dashboard');
          }
        } else {
          setDestination('/(staff)/dashboard');
        }
        setChecking(false);
        return;
      }
    } catch {}

    // gym_owner role but no gym yet → onboarding
    if (role === 'gym_owner') {
      setDestination('/(staff)/onboarding');
      setChecking(false);
      return;
    }

    // Default → member app
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
  if (destination)      return <Redirect href={destination as any} />;
  return <Redirect href="/(member)" />;
}

const s = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
});