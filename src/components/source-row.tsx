import { useMutation } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { StatusBadge } from "@/components/status-badge";
import { retryProcessSource } from "@/features/study-sets/actions";
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
        {source.status === "failed" ? (
          <Pressable
            disabled={retryMutation.isPending}
            onPress={() => retryMutation.mutate()}
            className="mt-1 self-start rounded-lg border border-border px-3 py-1.5 disabled:opacity-50"
          >
            {retryMutation.isPending ? (
              <ActivityIndicator color="#ffc799" size="small" />
            ) : (
              <Text className="text-xs font-medium text-foreground">Retry</Text>
            )}
          </Pressable>
        ) : null}
      </View>
      <StatusBadge status={source.status} />
    </View>
  );
}