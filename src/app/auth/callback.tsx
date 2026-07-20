import type { EmailOtpType } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useAuthStore } from "@/features/auth/auth";
import { supabase } from "@/utils/supabase";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    token_hash?: string;
    type?: string;
    access_token?: string;
    refresh_token?: string;
    error_description?: string;
  }>();

  const url = Linking.useURL();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        let code = params.code;
        let tokenHash = params.token_hash;
        let type = params.type;
        let accessToken = params.access_token;
        let refreshToken = params.refresh_token;
        let errorDesc = params.error_description;

        // If params aren't in searchParams, parse full URL hash/query
        if (!code && !tokenHash && !accessToken && url) {
          const parsed = Linking.parse(url);
          const q = parsed.queryParams || {};

          // Ignore development client wrapper URL params
          if (q.code) code = q.code as string;
          if (q.token_hash) tokenHash = q.token_hash as string;
          if (q.type) type = q.type as string;
          if (q.access_token) accessToken = q.access_token as string;
          if (q.refresh_token) refreshToken = q.refresh_token as string;
          if (q.error_description) errorDesc = q.error_description as string;

          if (url.includes("#")) {
            const hashString = url.split("#")[1];
            const hashParams = Object.fromEntries(
              new URLSearchParams(hashString).entries(),
            );
            accessToken = accessToken || hashParams.access_token;
            refreshToken = refreshToken || hashParams.refresh_token;
            code = code || hashParams.code;
            tokenHash = tokenHash || hashParams.token_hash;
            type = type || hashParams.type;
            errorDesc = errorDesc || hashParams.error_description;
          }
        }

        if (errorDesc) {
          setStatus("error");
          setErrorMessage(errorDesc);
          return;
        }

        // 1. PKCE Code Exchange
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            code,
          );
          if (error) {
            setStatus("error");
            setErrorMessage(error.message);
            return;
          }
          if (data.session) {
            useAuthStore.getState().setSession(data.session);
          }
        }
        // 2. Token Hash / OTP Verification
        else if (tokenHash && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
          });
          if (error) {
            setStatus("error");
            setErrorMessage(error.message);
            return;
          }
          if (data.session) {
            useAuthStore.getState().setSession(data.session);
          }
        }
        // 3. Direct Session Tokens
        else if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setStatus("error");
            setErrorMessage(error.message);
            return;
          }
          if (data.session) {
            useAuthStore.getState().setSession(data.session);
          }
        }
        // 4. Fallback check for active session or no params
        else {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            useAuthStore.getState().setSession(data.session);
          } else {
            setStatus("error");
            setErrorMessage(
              "No verification parameters found. Please check your email for the confirmation link.",
            );
            return;
          }
        }

        setStatus("success");
        setTimeout(() => {
          router.replace("/");
        }, 1500);
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Failed to verify email address.",
        );
      }
    }

    handleAuthCallback();
  }, [params, url]);

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      {status === "loading" && (
        <View className="items-center gap-4">
          <ActivityIndicator size="large" color="#ffc799" />
          <Text className="text-lg font-medium text-foreground">
            Verifying your email address...
          </Text>
          <Text className="text-sm text-muted">
            Please wait while we complete your authentication.
          </Text>
        </View>
      )}

      {status === "success" && (
        <View className="items-center gap-3">
          <Text className="text-2xl font-bold text-foreground">
            Email Verified!
          </Text>
          <Text className="text-center text-sm text-muted">
            Your email has been successfully verified. Redirecting you to the app...
          </Text>
        </View>
      )}

      {status === "error" && (
        <View className="items-center gap-5">
          <Text className="text-2xl font-bold text-danger">
            Verification Notice
          </Text>
          <Text className="text-center text-sm text-muted">
            {errorMessage || "Something went wrong during verification."}
          </Text>
          <Pressable
            onPress={() => router.replace("/login")}
            className="rounded-xl bg-primary px-6 py-3"
          >
            <Text className="font-semibold text-primary-foreground">
              Go to Sign In
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
