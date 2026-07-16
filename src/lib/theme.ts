import { DarkTheme, type Theme } from "@react-navigation/native";

export const colors = {
  background: "#101010",
  foreground: "#ffffff",
  muted: "#a0a0a0",
  border: "#27272a",
  card: "#18181b",
  primary: "#ffc799",
  primaryForeground: "#101010",
  input: "#27272a",
  danger: "#ff8080",
} as const;

export const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.foreground,
    border: colors.border,
    notification: colors.primary,
  },
};