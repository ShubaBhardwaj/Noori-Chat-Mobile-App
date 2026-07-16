import "@/lib/react-query";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";

const queryClient = new QueryClient();

function onAppStateChange(status: AppStateStatus) {
    focusManager.setFocused(status === "active");
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {

        const subscription = AppState.addEventListener("change", onAppStateChange);

        return () => subscription.remove();
    }, []);


    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}