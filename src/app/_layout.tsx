import { navigationTheme } from "@/lib/theme";
import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
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
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(BACKGROUND);
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: BACKGROUND },
        }}
      >
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </ThemeProvider>
  );
}
