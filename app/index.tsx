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
  const [checking, setChecking] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || isLoading) { setChecking(false); return; }

    // For staff/owner — check if gym exists
    if (user?.role === 'gym_owner' || user?.role === 'staff') {
      api.get('/gyms/my').then(({ data }) => {
        if (data.data) {
          setGym(data.data);
          if (!data.data.isSetupComplete) setNeedsSetup(true);
        } else {
          setNeedsSetup(true);
        }
      }).catch(() => {
        setNeedsSetup(true);
      }).finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [isAuthenticated, isLoading, user]);

  if (isLoading || checking) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  // Gym owner/staff needs to set up gym first
  if ((user?.role === 'gym_owner' || user?.role === 'staff') && needsSetup) {
    return <Redirect href="/(staff)/onboarding" />;
  }

  switch (user?.role) {
    case 'super_admin':
    case 'gym_owner':
    case 'staff':
      return <Redirect href="/(staff)/dashboard" />;
    default:
      return <Redirect href="/(member)" />;
  }
}

const s = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
});