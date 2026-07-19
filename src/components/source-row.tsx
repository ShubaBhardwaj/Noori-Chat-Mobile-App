import { useMutation } from "@tanstack/react-query";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { StatusBadge } from "@/components/status-badge";
import { deleteSource, retryProcessSource } from "@/features/study-sets/actions";
import {
  type Source,
  useInvalidateStudySet,
} from "@/features/study-sets/query";

const TYPE_LABELS = { pdf: "PDF", note: "Note", web: "Web" } as const;

export function SourceRow({
  source,
  studySetId,
}: {
  source: Source;
  studySetId: string;
}) {
  const invalidate = useInvalidateStudySet();
  const retryMutation = useMutation({
    mutationFn: () => retryProcessSource(source.id),
    onSuccess: () => invalidate(studySetId),
    onError: () => invalidate(studySetId),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteSource(source.id, source.type, source.storage_path),
    onSuccess: () => invalidate(studySetId),
  });

  return (
    <View className="flex-row items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <View className="min-w-0 flex-1 gap-1">
        <Text className="text-base font-medium text-foreground" numberOfLines={1}>
          {source.title}
        </Text>
        <Text className="text-xs text-muted">
          {TYPE_LABELS[source.type]} · {new Date(source.created_at).toLocaleDateString()}
        </Text>
        {source.error_message ? (
          <Text selectable className="text-xs text-danger" numberOfLines={2}>
            {source.error_message}
          </Text>
        ) : null}
      </View>
      <View className="flex-row items-center gap-2">
        <StatusBadge status={source.status} />
        {source.status !== "ready" && (
          <Pressable
            disabled={retryMutation.isPending || deleteMutation.isPending}
            onPress={() => retryMutation.mutate()}
            className="p-1.5 rounded-lg border border-border bg-input disabled:opacity-50 active:opacity-70"
          >
            {retryMutation.isPending ? (
              <ActivityIndicator color="#ffc799" size="small" />
            ) : (
              <Ionicons name="refresh" size={16} color="#ffffff" />
            )}
          </Pressable>
        )}
        <Pressable
          disabled={deleteMutation.isPending || retryMutation.isPending}
          onPress={() => {
            Alert.alert(
              "Delete Source",
              `Are you sure you want to delete "${source.title}"?`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => deleteMutation.mutate(),
                },
              ]
            );
          }}
          className="p-1.5 rounded-lg border border-border bg-input disabled:opacity-50 active:opacity-70"
        >
          {deleteMutation.isPending ? (
            <ActivityIndicator color="#ef4444" size="small" />
          ) : (
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          )}
        </Pressable>
      </View>
    </View>
  );
}