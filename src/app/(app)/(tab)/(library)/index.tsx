import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { createStudySet } from "@/features/study-sets/actions";
import { studySetKeys, useStudySets } from "@/features/study-sets/query";
import { StudySetCard } from "@/components/study-set-card";
import { EmptyState } from "@/components/empty-state";

const LibraryScreen = () => {
  const queryClient = useQueryClient();
  const {
    data: studySets,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useStudySets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      return createStudySet(title, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studySetKeys.all });
      setTitle("");
      setDescription("");
      setShowForm(false);
    },
  });

  const listHeader = (
    <View className="gap-4 pb-4">
      <View className="gap-2">
        <Text className="text-muted text-sm">Your study collections</Text>
        <Text className="text-foreground text-base">
          Upload materials, generate summaries, flashcards, and chat with your
          notes.
        </Text>
      </View>

      {showForm ? (
        <View className="border-border bg-card gap-3 rounded-2xl border p-4">
          <Text className="text-foreground text-base font-medium">
            New study set
          </Text>
          <TextInput
            placeholder="Title"
            placeholderTextColor="#71717a"
            value={title}
            onChangeText={setTitle}
            className="border-border bg-input text-foreground rounded-xl border px-4 py-3"
          />
          <TextInput
            placeholder="Description (optional)"
            placeholderTextColor="#71717a"
            value={description}
            onChangeText={setDescription}
            multiline
            className="border-border bg-input text-foreground min-h-20 rounded-xl border px-4 py-3"
          />
          {createMutation.error ? (
            <Text selectable className="text-danger text-sm">
              {createMutation.error.message}
            </Text>
          ) : null}
          <View className="flex-row gap-2">
            <Pressable
              disabled={!title.trim() || createMutation.isPending}
              onPress={() => createMutation.mutate()}
              className="bg-primary flex-1 items-center rounded-xl px-4 py-3 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#101010" />
              ) : (
                <Text className="text-primary-foreground font-semibold">
                  Create
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => setShowForm(false)}
              className="border-border items-center rounded-xl border px-4 py-3"
            >
              <Text className="text-foreground">Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setShowForm(true)}
          className="bg-primary items-center rounded-xl px-4 py-3"
        >
          <Text className="text-primary-foreground font-semibold">
            New study set
          </Text>
        </Pressable>
      )}
    </View>
  );

  return (
   <FlatList
      className="flex-1 bg-background"
      data={studySets ?? []}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-3 p-6"
      contentInsetAdjustmentBehavior="automatic"
      refreshing={isRefetching}
      onRefresh={refetch}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        <EmptyState
          title="No study sets yet"
          description="Create your first study set, then add a PDF or note to get started."
        />
      }
      renderItem={({ item }) => <StudySetCard studySet={item} />}
    />
  );
};

export default LibraryScreen;
