import { Stack } from "expo-router";

export const unstable_settings = {
  anchor: "(tab)",
}

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tab)" />
    </Stack>
  );
}

