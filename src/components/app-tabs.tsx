import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Palette } from '@/constants/design';

/**
 * The four app destinations, rendered with the system tab bar.
 *
 * Icons come from SF Symbols on iOS (`sf`) and Material Symbols on Android
 * (`md`), so no icon assets are needed. Camera isn't a tab — it's the floating
 * button in `<CameraFab />`, which pushes the `/camera` route.
 */
export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Palette.card}
      tintColor={Palette.brand}
      labelStyle={{ selected: { color: Palette.brand } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          md="home"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'clock', selected: 'clock.fill' }}
          md="history"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="analytics">
        <NativeTabs.Trigger.Label>Analytics</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          md="bar_chart"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
