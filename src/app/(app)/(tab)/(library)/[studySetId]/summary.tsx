import { Stack, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  studySetKeys,
  useLatestSummary,
  useStudySet,
} from "@/features/study-sets/query";
import { generateSummary } from "@/lib/api-client";

export default function SummaryScreen() {
  const { studySetId } = useLocalSearchParams<{ studySetId: string }>();
  const queryClient = useQueryClient();
  const { data: studySet } = useStudySet(studySetId);
  const { data: summary, isLoading } = useLatestSummary(studySetId);

  const generateMutation = useMutation({
    mutationFn: () => generateSummary(studySetId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studySetKeys.summary(studySetId),
      });
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: studySet?.title
            ? `${studySet.title} · Summary`
            : "Summary",
        }}
      />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-4 p-6"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Pressable
          disabled={generateMutation.isPending}
          onPress={() => generateMutation.mutate()}
          className="items-center rounded-xl bg-primary px-4 py-3 disabled:opacity-50"
        >
          {generateMutation.isPending ? (
            <ActivityIndicator color="#101010" />
          ) : (
            <Text className="font-semibold text-primary-foreground">
              {summary ? "Regenerate summary" : "Generate summary"}
            </Text>
          )}
        </Pressable>

        {generateMutation.error ? (
          <Text selectable className="text-sm text-danger">
            {generateMutation.error.message}
          </Text>
        ) : null}

        {isLoading ? (
          <ActivityIndicator color="#ffc799" />
        ) : summary ? (
          <View className="gap-2 rounded-2xl border border-border bg-card p-5">
            <Text selectable className="text-base leading-7 text-foreground">
              {summary.content}
            </Text>
            <Text className="text-xs text-muted">
              Generated {new Date(summary.created_at).toLocaleString()}
            </Text>
          </View>
        ) : (
          <Text className="text-center text-muted">
            No summary yet. Tap generate to create one from your sources.
          </Text>
        )}
      </ScrollView>
    </>
  );
}