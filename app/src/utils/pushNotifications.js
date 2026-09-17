import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

/**
 * Requests permission and returns this device's Expo push token, or null if
 * permission was denied or this isn't a physical device (push tokens don't
 * work in simulators/emulators). Degrades gracefully — the app works fine
 * without notifications either way.
 */
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return null;

    // getExpoPushTokenAsync needs an explicit projectId in EAS-built apps —
    // it can't reliably auto-detect one outside Expo Go, and throws without
    // it. That was silently swallowed by the catch below before, which is
    // why registration was failing on every device with no visible error.
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('[push] No EAS projectId found — cannot register for push notifications.');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (e) {
    console.warn('[push] registerForPushNotificationsAsync failed:', e?.message || e);
    return null;
  }
}

/**
 * Sends push notification(s) directly to Expo's push service (no backend —
 * this endpoint is free, public, and needs no API key). `tokens` may be a
 * single token string or an array; invalid/empty entries are dropped.
 *
 * `badge`, if given, sets the app icon's badge number (like iMessage's red
 * count) — iOS applies this from the push payload even while the app is
 * closed. Pass the CURRENT total the recipient should see (not a delta).
 */
export async function sendPushNotification(tokens, title, body, data, badge) {
  const list = (Array.isArray(tokens) ? tokens : [tokens]).filter(
    (t) => typeof t === 'string' && t.startsWith('ExponentPushToken')
  );
  if (list.length === 0) return;

  const messages = list.map((to) => ({
    to,
    title,
    body,
    data: data || {},
    sound: 'default',
    ...(typeof badge === 'number' ? { badge } : {}),
  }));

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    const json = await res.json().catch(() => null);
    const errors = (json?.data || []).filter((r) => r.status === 'error');
    if (errors.length > 0) {
      console.warn('[push] Expo push API returned errors:', JSON.stringify(errors));
    }
  } catch (e) {
    // Best-effort — a failed push should never block the action that triggered it.
    console.warn('[push] sendPushNotification request failed:', e?.message || e);
  }
}

/**
 * Syncs THIS device's app icon badge to the given count right now (not via a
 * push — for keeping the badge accurate while the app is open, e.g. after
 * marking something read/resolved, or on screen focus). Call with the
 * up-to-date total each time, not a delta.
 */
export async function setAppBadgeCount(count) {
  try {
    await Notifications.setBadgeCountAsync(Math.max(0, count || 0));
  } catch (e) {
    // Badge counts aren't supported on every platform/launcher — ignore.
  }
}
