import { useAuthStore } from "@/features/auth/auth";
import { Href, Redirect, Stack } from "expo-router";

export const unstable_settings = {
  anchor: "(tab)",
};

export default function AppLayout() {
  const session = useAuthStore((state) => state.session);
  const initialized = useAuthStore((state) => state.initialized);

  if (!initialized) return null;
  if (!session) return <Redirect href={"/login" as Href} />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tab)" />
    </Stack>
  );
}
