import type { Session } from "@supabase/supabase-js";
import { Link, type Href } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { create } from "zustand";

import { supabase } from "@/utils/supabase";

const BACKGROUND = "#101010";

type AuthState = {

    session: Session | null;

    initialized: boolean;
    setSession: (session: Session | null) => void;
    setInitialized: (initialized: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
    session: null,
    initialized: false,
    setSession: (session) => set({ session }),
    setInitialized: (initialized) => set({ initialized }),
}));

export function initAuth() {
    const { setSession, setInitialized } = useAuthStore.getState();

    // 1. Check if the user already has a saved session (e.g. app reopen)
    supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
            setSession(session);
        })
        .catch((error) => {
            console.error("Failed to restore session", error);
        })
        .finally(() => {
            setInitialized(true);
        });

    // 2. Update the store whenever the user signs in, signs out, or refreshes
    const {
        data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
    });

    return () => subscription.unsubscribe();
}

export async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
}

export async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    return "Something went wrong";
}

type AuthScreenProps = {
    mode: "login" | "signup";
}

export function AuthScreen({ mode }: AuthScreenProps) {
    const insets = useSafeAreaInsets();
  
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
  
    const isLogin = mode === "login";
  
    // Copy that changes based on login vs signup
    const subtitle = isLogin ? "Sign in to continue studying" : "Create your account";
    const submitLabel = isLogin ? "Sign in" : "Create account";
    const switchPrompt = isLogin ? "No account?" : "Already have an account?";
    const switchLabel = isLogin ? "Sign up" : "Sign in";
    const switchHref = (isLogin ? "/signup" : "/login") as Href;
    const passwordAutoComplete = isLogin ? "current-password" : "new-password";
  
    async function handleSubmit() {
      setMessage(null);
      setLoading(true);
  
      try {
        const trimmedEmail = email.trim();
  
        if (isLogin) {
          await signIn(trimmedEmail, password);
        } else {
          await signUp(trimmedEmail, password);
          setMessage("Account created. Check your email if confirmation is enabled.");
        }
      } catch (error) {
        setMessage(getErrorMessage(error));
      } finally {
        // Always turn off the spinner, success or failure
        setLoading(false);
      }
    }
  
    const form = (
      <ScrollView
        className="flex-1 bg-background"
        style={{ flex: 1, backgroundColor: BACKGROUND }}
        contentContainerClassName="grow px-6 gap-8"
        contentContainerStyle={{
          paddingTop: insets.top + 48,
          paddingBottom: insets.bottom + 48,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header */}
        <View className="gap-2 justify-center items-center">
          <Text className="text-5xl font-semibold text-foreground">Noori Chat</Text>
          <Text className="text-xl font-semibold text-foreground">Your AI Study Buddy</Text>
          <Text className="text-base text-muted">{subtitle}</Text>
        </View>
  
        {/* Email + password + submit */}
        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-sm text-muted">Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#7e7e7e"
              value={email}
              onChangeText={setEmail}
              className="rounded-xl border border-border bg-input px-4 py-3 text-foreground"
            />
          </View>
  
          <View className="gap-2">
            <Text className="text-sm text-muted">Password</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete={passwordAutoComplete}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#7e7e7e"
              value={password}
              onChangeText={setPassword}
              className="rounded-xl border border-border bg-input px-4 py-3 text-foreground"
            />
          </View>
  
          {message ? (
            <Text selectable className="text-sm text-danger">
              {message}
            </Text>
          ) : null}
  
          <Pressable
            disabled={loading}
            onPress={handleSubmit}
            className="items-center rounded-xl bg-primary px-4 py-3"
          >
            {loading ? (
              <ActivityIndicator color="#101010" />
            ) : (
              <Text className="text-base font-semibold text-primary-foreground">
                {submitLabel}
              </Text>
            )}
          </Pressable>
        </View>
  
        {/* Link to the other auth screen */}
        <View className="flex-row justify-center gap-1">
          <Text className="text-muted">{switchPrompt}</Text>
          <Link href={switchHref} asChild>
            <Pressable>
              <Text className="font-medium text-primary">{switchLabel}</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    );
  
    // On iOS, KeyboardAvoidingView lifts the form when the keyboard opens.
    // Android usually handles this on its own, so we skip the wrapper there.
    return (
      <View className="flex-1 bg-background" style={{ flex: 1, backgroundColor: BACKGROUND }}>
        {Platform.OS === "ios" ? (
          <KeyboardAvoidingView
            behavior="padding"
            className="flex-1 bg-background"
            style={{ flex: 1, backgroundColor: BACKGROUND }}
            keyboardVerticalOffset={insets.top}
          >
            {form}
          </KeyboardAvoidingView>
        ) : (
          form
        )}
      </View>
    );
  }