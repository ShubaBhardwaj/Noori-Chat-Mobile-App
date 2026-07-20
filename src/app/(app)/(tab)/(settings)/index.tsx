import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { signOut, useAuthStore } from "@/features/auth/auth";
import { deleteAccount } from "@/lib/api-client";

export default function SettingsScreen() {
  const email = useAuthStore((state) => state.session?.user.email);
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSignOut() {
    setSigningOut(true);
    setErrorMsg(null);
    try {
      await signOut();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to sign out");
      setSigningOut(false);
    }
  }

  function confirmSignOut() {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) {
        handleSignOut();
      }
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: handleSignOut },
      ]);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setErrorMsg(null);
    try {
      await deleteAccount();
      await signOut();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to delete account",
      );
      setDeleting(false);
    }
  }

  function confirmDeleteAccount() {
    const title = "Delete Account";
    const message =
      "Are you sure you want to permanently delete your account? All your study sets, flashcards, chats, and data will be erased forever.";

    if (Platform.OS === "web") {
      if (window.confirm(`${title}\n\n${message}`)) {
        handleDeleteAccount();
      }
    } else {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: handleDeleteAccount,
        },
      ]);
    }
  }

  const isLoading = signingOut || deleting;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-6"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="gap-2 rounded-2xl border border-border bg-card p-5">
        <Text className="text-sm text-muted">Signed in as</Text>
        <Text selectable className="text-base font-medium text-foreground">
          {email}
        </Text>
      </View>

      {errorMsg ? (
        <View className="rounded-xl border border-danger/30 bg-danger/10 p-4">
          <Text className="text-sm text-danger">{errorMsg}</Text>
        </View>
      ) : null}

      <View className="mt-2 gap-3">
        <Pressable
          disabled={isLoading}
          onPress={confirmSignOut}
          className="items-center rounded-xl border border-border bg-card px-4 py-3.5 active:opacity-80"
        >
          {signingOut ? (
            <ActivityIndicator color="#ffc799" />
          ) : (
            <Text className="text-base font-medium text-foreground">
              Sign out
            </Text>
          )}
        </Pressable>

        <Pressable
          disabled={isLoading}
          onPress={confirmDeleteAccount}
          className="items-center rounded-xl border border-danger/40 bg-card px-4 py-3.5 active:opacity-80"
        >
          {deleting ? (
            <ActivityIndicator color="#ff8080" />
          ) : (
            <Text className="text-base font-medium text-danger">
              Delete account
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}