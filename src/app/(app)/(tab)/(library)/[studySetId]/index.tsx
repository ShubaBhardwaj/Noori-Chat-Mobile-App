import { Link, Stack, useLocalSearchParams, type Href } from "expo-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  createNoteSource,
  createWebSource,
  pickAndUploadPdf,
} from "@/features/study-sets/actions";

import {
  useInvalidateStudySet,
  useSources,
  useStudySet,
} from "@/features/study-sets/query";

import { EmptyState } from "@/components/empty-state";
import { SourceRow } from "@/components/source-row";

type SourceForm = "note" | "web" | null;

const StudySetDetailScreen = () => {
  const { studySetId } = useLocalSearchParams<{ studySetId: string }>();
  const invalidate = useInvalidateStudySet();
  const { data: studySet, isLoading } = useStudySet(studySetId);
  const { data: sources } = useSources(studySetId);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [webTitle, setWebTitle] = useState("");
  const [sourceForm, setSourceForm] = useState<SourceForm>(null);
  const [actionError, setActionError] = useState<string | null>(null);

    const readyCount = sources?.filter((s) => s.status === "ready").length ?? 0;
  const hasReadySources = readyCount > 0;

    const uploadMutation = useMutation({
    mutationFn: () => pickAndUploadPdf(studySetId),
    onSuccess: (result) => {
      if (result) invalidate(studySetId);
      setActionError(null);
    },
    onError: (err) => setActionError(err.message),
  });

    const noteMutation = useMutation({
    mutationFn: () => createNoteSource(studySetId, noteTitle, noteContent),

    onSuccess: () => {
      invalidate(studySetId);
      setWebUrl("");
      setWebTitle("");
      setSourceForm(null);
      setActionError(null);
    },
    onError: (err) => setActionError(err.message),
  });

    const webMutation = useMutation({
    mutationFn: () => createWebSource(studySetId, webUrl, webTitle),
    onSuccess: () => {
      invalidate(studySetId);
      setWebUrl("");
      setWebTitle("");
      setSourceForm(null);
      setActionError(null);
    },
    onError: (err) => setActionError(err.message),
  });

    if (isLoading || !studySet) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#ffc799" />
      </View>
    );
  }

  const basePath = `/(app)/(tab)/(library)/${studySetId}` as const;

  const isPdfActive = sourceForm === null || uploadMutation.isPending;
  const isNoteActive = sourceForm === "note";
  const isWebActive = sourceForm === "web";

  return (
   <>
      <Stack.Screen options={{ title: studySet.title }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 p-6"
        contentInsetAdjustmentBehavior="automatic"
      >
        {studySet.description ? (
          <Text className="text-base text-muted">{studySet.description}</Text>
        ) : null}

        <View className="gap-3">
          <Text className="text-lg font-semibold text-foreground">AI tools</Text>
          <View className="flex-row flex-wrap gap-2">
            <Link
              href={`${basePath}/summary` as Href}
              asChild
              disabled={!hasReadySources}
            >
              <Pressable
                disabled={!hasReadySources}
                className="flex-row items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-3 disabled:opacity-40"
              >
                <Ionicons name="reader" size={16} color="#101010" />
                <Text className="font-medium text-primary-foreground">
                  Summary
                </Text>
              </Pressable>
            </Link>
            <Link
              href={`${basePath}/flashcards` as Href}
              asChild
              disabled={!hasReadySources}
            >
              <Pressable
                disabled={!hasReadySources}
                className="flex-row items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-3 disabled:opacity-40"
              >
                <Ionicons name="albums-outline" size={16} color="#ffffff" />
                <Text className="font-medium text-foreground">Flashcards</Text>
              </Pressable>
            </Link>
            <Link
              href={`${basePath}/chat` as Href}
              asChild
              disabled={!hasReadySources}
            >
              <Pressable
                disabled={!hasReadySources}
                className="flex-row items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-3 disabled:opacity-40"
              >
                <Ionicons name="chatbubble-outline" size={16} color="#ffffff" />
                <Text className="font-medium text-foreground">Chat</Text>
              </Pressable>
            </Link>
          </View>
          {!hasReadySources ? (
            <Text className="text-sm text-muted">
              Add and process at least one source before using AI features.
            </Text>
          ) : null}
        </View>

        <View className="gap-3">
          <Text className="text-lg font-semibold text-foreground">Sources</Text>
          <View className="flex-row flex-wrap gap-2">
            <Pressable
              disabled={uploadMutation.isPending}
              onPress={() => uploadMutation.mutate()}
              className={`min-w-[30%] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl px-3 py-3 disabled:opacity-50 ${
                isPdfActive ? "bg-primary" : "border border-border bg-card"
              }`}
            >
              {uploadMutation.isPending ? (
                <ActivityIndicator color="#101010" />
              ) : (
                <>
                  <Ionicons
                    name={isPdfActive ? "document" : "document-outline"}
                    size={16}
                    color={isPdfActive ? "#101010" : "#ffffff"}
                  />
                  <Text
                    className={`font-medium ${
                      isPdfActive ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    Upload PDF
                  </Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() =>
                setSourceForm((v) => (v === "note" ? null : "note"))
              }
              className={`min-w-[30%] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl px-3 py-3 ${
                isNoteActive ? "bg-primary" : "border border-border bg-card"
              }`}
            >
              <Ionicons
                name={isNoteActive ? "create" : "create-outline"}
                size={16}
                color={isNoteActive ? "#101010" : "#ffffff"}
              />
              <Text
                className={`font-medium ${
                  isNoteActive ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                Add note
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                setSourceForm((v) => (v === "web" ? null : "web"))
              }
              className={`min-w-[30%] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl px-3 py-3 ${
                isWebActive ? "bg-primary" : "border border-border bg-card"
              }`}
            >
              <Ionicons
                name={isWebActive ? "link" : "link-outline"}
                size={16}
                color={isWebActive ? "#101010" : "#ffffff"}
              />
              <Text
                className={`font-medium ${
                  isWebActive ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                Add URL
              </Text>
            </Pressable>
          </View>

          {sourceForm === "note" ? (
            <View className="gap-3 rounded-2xl border border-border bg-card p-4">
              <TextInput
                placeholder="Note title"
                placeholderTextColor="#71717a"
                value={noteTitle}
                onChangeText={setNoteTitle}
                className="rounded-xl border border-border bg-input px-4 py-3 text-foreground"
              />
              <TextInput
                placeholder="Paste your notes here..."
                placeholderTextColor="#71717a"
                value={noteContent}
                onChangeText={setNoteContent}
                multiline
                className="min-h-32 rounded-xl border border-border bg-input px-4 py-3 text-foreground"
              />
              <Pressable
                disabled={
                  !noteTitle.trim() ||
                  !noteContent.trim() ||
                  noteMutation.isPending
                }
                onPress={() => noteMutation.mutate()}
                className="items-center rounded-xl bg-primary px-4 py-3 disabled:opacity-50"
              >
                {noteMutation.isPending ? (
                  <ActivityIndicator color="#101010" />
                ) : (
                  <Text className="font-semibold text-primary-foreground">
                    Save & process
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {sourceForm === "web" ? (
            <View className="gap-3 rounded-2xl border border-border bg-card p-4">
              <TextInput
                placeholder="https://example.com/article"
                placeholderTextColor="#71717a"
                value={webUrl}
                onChangeText={setWebUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                className="rounded-xl border border-border bg-input px-4 py-3 text-foreground"
              />
              <TextInput
                placeholder="Title (optional)"
                placeholderTextColor="#71717a"
                value={webTitle}
                onChangeText={setWebTitle}
                className="rounded-xl border border-border bg-input px-4 py-3 text-foreground"
              />
              <Pressable
                disabled={!webUrl.trim() || webMutation.isPending}
                onPress={() => webMutation.mutate()}
                className="items-center rounded-xl bg-primary px-4 py-3 disabled:opacity-50"
              >
                {webMutation.isPending ? (
                  <ActivityIndicator color="#101010" />
                ) : (
                  <Text className="font-semibold text-primary-foreground">
                    Save & process
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {actionError ? (
            <Text selectable className="text-sm text-danger">
              {actionError}
            </Text>
          ) : null}

          {sources && sources.length > 0 ? (
            <View className="gap-2">
              {sources.map((source) => (
                <SourceRow
                  key={source.id}
                  source={source}
                  studySetId={studySetId}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              title="No sources yet"
              description="Upload a PDF, add a note, or paste a web URL to build your study material."
            />
          )}
        </View>
      </ScrollView>
    </>
  );
};

export default StudySetDetailScreen;
