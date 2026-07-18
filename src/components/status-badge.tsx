import { Text, View } from "react-native";

import type { ProcessingStatus } from "@/features/study-sets/query";

const LABELS: Record<ProcessingStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

const STYLES: Record<ProcessingStatus, string> = {
  pending: "bg-input text-muted",
  processing: "bg-primary/20 text-primary",
  ready: "bg-emerald-500/15 text-emerald-400",
  failed: "bg-danger/15 text-danger",
};

export function StatusBadge({ status }: { status: ProcessingStatus }) {
  return (
    <View className={`rounded-full px-2.5 py-1 ${STYLES[status]}`}>
      <Text className="text-xs font-medium">{LABELS[status]}</Text>
    </View>
  );
}