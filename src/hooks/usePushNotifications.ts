import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import api from '@/services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

export const usePushNotifications = () => {
  const notificationListener = useRef<any>();
  const responseListener     = useRef<any>();

  useEffect(() => {
    // Register silently — don't crash if it fails
    registerForPushNotifications().catch(() => {});

    // Foreground notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Push received:', notification.request.content.title);
    });

    // Tap on notification — navigate to relevant screen
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      try {
        if (data?.type === 'expiry_reminder') {
          router.push('/(member)/membership');
        } else if (data?.type === 'checkin') {
          router.push('/(member)/checkin');
        }
      } catch {
        // navigation may not be ready yet — ignore
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);
};

export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name:             'default',
        importance:       Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    // Get token — projectId is needed for SDK 49+
    // For development, we skip this gracefully
    // In production, add your EAS projectId from app.json
    let token: string | null = null;
    try {
      const result = await Notifications.getExpoPushTokenAsync({
        projectId: '3a3d8bed-a6f5-44b4-a574-1a4091b1bebc', // replace with real EAS project ID in production
      });
      token = result.data;
    } catch {
      // Token generation fails in Expo Go without a project ID
      // This is fine for development — notifications still work locally
      console.log('Push token not available in this environment');
      return null;
    }

    if (token) {
      // Save token to backend silently
      try {
        await api.patch('/auth/me', { fcmToken: token });
        console.log('Push token saved:', token.slice(0, 30) + '...');
      } catch {
        // Don't crash if backend save fails
      }
    }

    return token;
  } catch (err) {
    console.log('Push notification setup skipped:', err);
    return null;
  }
};