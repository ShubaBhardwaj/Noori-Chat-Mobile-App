import { Slot, Stack } from "expo-router";

import { stackScreenOptions } from "@/lib/navigation";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{ title: "Settings", headerLargeTitle: true }}
      />
    </  Stack>
  );
}