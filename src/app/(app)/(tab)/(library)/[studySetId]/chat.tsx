import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { createConversation } from "@/features/study-sets/actions";
import {
  pickConversation,
  studySetKeys,
  useConversations,
  useMessages,
  useStudySet,
  type Message,
} from "@/features/study-sets/query";
import { sendChatMessage } from "@/lib/api-client";

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <View
      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
        isUser
          ? "bg-primary self-end"
          : "border-border bg-card self-start border"
      }`}
      style={{ borderCurve: "continuous" }}
    >
      <Text
        selectable
        className={`text-base leading-6 ${
          isUser ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        {message.content}
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const { studySetId } = useLocalSearchParams<{ studySetId: string }>();
  const queryClient = useQueryClient();
  const { data: studySet } = useStudySet(studySetId);
  const {
    data: conversations,
    isLoading: conversationsLoading,
    isError: conversationsError,
    error: conversationsErr,
    refetch: refetchConversations,
  } = useConversations(studySetId);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const listRef = useRef<FlatList<Message>>(null);
  const creatingRef = useRef(false);

  const { data: messages, isLoading: messagesLoading } = useMessages(
    conversationId ?? ""
  );

  const createMutation = useMutation({
    mutationFn: () =>
      createConversation(studySetId, `${studySet?.title ?? "Study"} chat`),
    onSuccess: (conversation) => {
      creatingRef.current = false;
      setConversationId(conversation.id);
      setActionError(null);
      queryClient.invalidateQueries({
        queryKey: studySetKeys.conversations(studySetId),
      });
    },
    onError: (err) => {
      creatingRef.current = false;
      setActionError(err.message);
    },
  });

  useEffect(() => {
    if (conversationId || conversationsLoading || !studySet) return;

    const existing = pickConversation(conversations);
    if (existing) {
      setConversationId(existing.id);
      return;
    }

    if (creatingRef.current || createMutation.isPending) return;
    creatingRef.current = true;
    createMutation.mutate();
  }, [conversationId, conversations, conversationsLoading, studySet]);

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendChatMessage(conversationId!, text),
    onMutate: async (text) => {
      await queryClient.cancelQueries({
        queryKey: studySetKeys.messages(conversationId!),
      });
      const optimistic: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId!,
        role: "user",
        content: text,
        metadata: null,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Message[]>(
        studySetKeys.messages(conversationId!),
        (old) => [...(old ?? []), optimistic]
      );
      setInput("");
      setActionError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studySetKeys.messages(conversationId!),
      });
      queryClient.invalidateQueries({
        queryKey: studySetKeys.conversations(studySetId),
      });
    },
    onError: (err) => {
      setActionError(err.message);
      queryClient.invalidateQueries({
        queryKey: studySetKeys.messages(conversationId!),
      });
    },
  });

  function handleSend() {
    const text = input.trim();
    if (!text || !conversationId || sendMutation.isPending) return;
    sendMutation.mutate(text);
  }

  const bootError =
    actionError ??
    (conversationsError
      ? conversationsErr instanceof Error
        ? conversationsErr.message
        : "Failed to load chat"
      : null);

  const isBooting =
    !conversationId &&
    !bootError &&
    (conversationsLoading || createMutation.isPending);

  return (
    <>
      <Stack.Screen
        options={{
          title: studySet?.title ? `${studySet.title} · Chat` : "Chat",
        }}
      />
      <KeyboardAvoidingView
        className="bg-background flex-1"
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={88}
      >
        {isBooting ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#ffc799" />
          </View>
        ) : bootError && !conversationId ? (
          <View className="flex-1 items-center justify-center gap-3 p-6">
            <Text selectable className="text-danger text-center">
              {bootError}
            </Text>
            <Pressable
              onPress={() => {
                setActionError(null);
                creatingRef.current = false;
                void refetchConversations();
              }}
              className="bg-primary rounded-xl px-4 py-3"
            >
              <Text className="text-primary-foreground font-semibold">
                Retry
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <FlatList
              ref={listRef}
              className="flex-1"
              data={messages ?? []}
              keyExtractor={(item) => item.id}
              contentContainerClassName="grow gap-3 p-4"
              contentInsetAdjustmentBehavior="automatic"
              onContentSizeChange={() =>
                listRef.current?.scrollToEnd({ animated: true })
              }
              ListEmptyComponent={
                messagesLoading ? (
                  <ActivityIndicator color="#ffc799" />
                ) : (
                  <Text className="text-muted text-center">
                    Ask a question about your study materials.
                  </Text>
                )
              }
              renderItem={({ item }) => <MessageBubble message={item} />}
            />

            {actionError && conversationId ? (
              <Text selectable className="text-danger px-4 pb-2 text-sm">
                {actionError}
              </Text>
            ) : null}

            {sendMutation.isPending ? (
              <View className="flex-row items-center gap-2 px-4 pb-2">
                <ActivityIndicator color="#ffc799" size="small" />
                <Text className="text-muted text-sm">Thinking...</Text>
              </View>
            ) : null}

            <View className="border-border flex-row items-end gap-2 border-t p-4">
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask about your materials..."
                placeholderTextColor="#71717a"
                multiline
                className="border-border bg-input text-foreground max-h-28 flex-1 rounded-2xl border px-4 py-3"
              />
              <Pressable
                disabled={!input.trim() || sendMutation.isPending}
                onPress={handleSend}
                className="bg-primary rounded-full px-4 py-3 disabled:opacity-40"
              >
                <Text className="text-primary-foreground font-semibold">
                  Send
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </>
  );
}
