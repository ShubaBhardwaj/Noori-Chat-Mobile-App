import { useAuthStore } from "@/features/auth/auth";
import { Href, Redirect, Stack } from "expo-router";

export default function AuthLayout() {

    const session = useAuthStore((state) => state.session);
    const initialized = useAuthStore((state) => state.initialized);

    if (!initialized) return null;
    if (session) return <Redirect href={"/" as Href} />;

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: "#101010"
                }
            }}
        />
    )
}