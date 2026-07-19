import { initAuth, useAuthStore } from "@/features/auth/auth";
import { navigationTheme } from "@/lib/theme";
import { QueryProvider } from "@/provider/query-provider";
import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { Uniwind } from "uniwind";
import "../global.css";

const BACKGROUND = "#101010";

export const unstable_settings = {
  initialRouteName: "(app)",
};

SplashScreen.preventAutoHideAsync();
Uniwind.setTheme("dark");

export default function RootLayout() {
  const initialized = useAuthStore((state) => state.initialized);
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(BACKGROUND);
  }, []);

  useEffect(() => {
    return initAuth();
  }, []);

  useEffect(() => {
    if (initialized) {
      SplashScreen.hideAsync();
    }
  }, [initialized]);

  if (!initialized) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navigationTheme}>
        <QueryProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: BACKGROUND },
            }}
          >
            <Stack.Screen name="(app)" />
            <Stack.Screen name="(auth)" />
          </Stack>
        </QueryProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
