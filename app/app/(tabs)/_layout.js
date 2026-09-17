import React, { useMemo, useRef } from 'react';
import { View, PanResponder, Platform } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';

// Order matches the tab bar, left to right. 'admin' is filtered out below for
// non-superusers so swiping skips straight over it. Paths are the resolved
// URLs expo-router actually reports via usePathname() — group segments like
// "(tabs)" never appear in that, so they're omitted here too.
const TAB_ROUTES = [
  { key: 'index', path: '/' },
  { key: 'search', path: '/search' },
  { key: 'map', path: '/map' },
  { key: 'history', path: '/history' },
  { key: 'settings', path: '/settings' },
  { key: 'admin', path: '/admin' },
];

const SWIPE_DISTANCE_THRESHOLD = 50;
// Require the gesture to be clearly more horizontal than vertical, so a
// vertical scroll inside a tab (FlatList/ScrollView) never gets hijacked.
const HORIZONTAL_DOMINANCE = 1.5;

export default function TabsLayout() {
  const { colors } = useTheme();
  const { isSuperuser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const icon = (name) => ({ color, size }) => (
    <MaterialCommunityIcons name={name} size={size} color={color} />
  );

  const visibleRoutes = useMemo(
    () => TAB_ROUTES.filter((r) => r.key !== 'admin' || isSuperuser),
    [isSuperuser]
  );

  // Android's own bottom nav (3-button or gesture pill) sits in this inset —
  // the tab bar was using a fixed 8px pad that doesn't account for it, which
  // is why the system buttons could cover the tab bar on some devices.
  const bottomPad = Platform.OS === 'ios' ? 28 : Math.max(8, insets.bottom);
  const tabBarHeight = (Platform.OS === 'ios' ? 58 : 54) + bottomPad;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (evt, gesture) => {
        const { dx, dy } = gesture;
        return (
          Math.abs(dx) > SWIPE_DISTANCE_THRESHOLD &&
          Math.abs(dx) > Math.abs(dy) * HORIZONTAL_DOMINANCE
        );
      },
      onPanResponderRelease: (evt, gesture) => {
        const currentIndex = visibleRoutes.findIndex((r) => r.path === pathname);
        if (currentIndex === -1) return;

        if (gesture.dx < 0 && currentIndex < visibleRoutes.length - 1) {
          // Swiped left -> next tab.
          router.push(visibleRoutes[currentIndex + 1].path);
        } else if (gesture.dx > 0 && currentIndex > 0) {
          // Swiped right -> previous tab.
          router.push(visibleRoutes[currentIndex - 1].path);
        }
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textFaint,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingTop: 6,
            paddingBottom: bottomPad,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Home', tabBarIcon: icon('cards-heart-outline') }}
        />
        <Tabs.Screen
          name="search"
          options={{ title: 'Search', tabBarIcon: icon('magnify') }}
        />
        <Tabs.Screen
          name="map"
          options={{ title: 'Map', tabBarIcon: icon('map-outline') }}
        />
        <Tabs.Screen
          name="history"
          options={{ title: 'History', tabBarIcon: icon('history') }}
        />
        <Tabs.Screen
          name="settings"
          options={{ title: 'Settings', tabBarIcon: icon('cog-outline') }}
        />
        {/* Admin tab is conditionally present: for a normal user href:null removes
            it from the layout entirely (not merely disabled). */}
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: icon('shield-crown-outline'),
            href: isSuperuser ? undefined : null,
          }}
        />
      </Tabs>
    </View>
  );
}
