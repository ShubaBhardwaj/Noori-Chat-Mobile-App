import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/utils/supabase";

export type ProcessingStatus = "pending" | "processing" | "ready" | "failed";

export type StudySet = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Source = {
  id: string;
  study_set_id: string;
  user_id: string;
  type: "pdf" | "note" | "web";
  title: string;
  status: ProcessingStatus;
  content: string | null;
  storage_path: string | null;
  url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export const studySetKeys = {
  all: ["study-sets"] as const,
  detail: (id: string) => ["study-sets", id] as const,
  sources: (id: string) => ["study-sets", id, "sources"] as const,
  summary: (id: string) => ["study-sets", id, "summary"] as const,
  flashcards: (id: string) => ["study-sets", id, "flashcards"] as const,
  conversations: (id: string) => ["study-sets", id, "conversations"] as const,
  messages: (conversationId: string) =>
    ["conversations", conversationId, "messages"] as const,
};

export function useStudySets() {
  return useQuery({
    queryKey: studySetKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_sets")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useStudySet(id: string) {
  return useQuery({
    queryKey: studySetKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_sets")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useSources(studySetId: string) {
  return useQuery({
    queryKey: studySetKeys.sources(studySetId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sources")
        .select("*")
        .eq("study_set_id", studySetId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!studySetId,
    // Keep polling every 3s while any source is still processing
    refetchInterval: (query) => {
      const busy = query.state.data?.some(
        (s) => s.status === "pending" || s.status === "processing",
      );
      if (busy) return 3000;
      return false;
    },
  });
}

export function useLatestSummary(studySetId: string) {
  return useQuery({
    queryKey: studySetKeys.summary(studySetId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("summaries")
        .select("*")
        .eq("study_set_id", studySetId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!studySetId,
  });
}

export function useLatestFlashcardDeck(studySetId: string) {
  return useQuery({
    queryKey: studySetKeys.flashcards(studySetId),
    queryFn: async () => {
      const { data: deck, error: deckError } = await supabase
        .from("flashcard_decks")
        .select("*")
        .eq("study_set_id", studySetId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (deckError) throw deckError;
      if (!deck) return null;

      const { data: cards, error: cardsError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("deck_id", deck.id)
        .order("sort_order", { ascending: true });
      if (cardsError) throw cardsError;

      return { deck, cards: cards || [] };
    },
    enabled: !!studySetId,
  });
}

export function useConversations(studySetId: string) {
  return useQuery({
    queryKey: studySetKeys.conversations(studySetId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, messages(count)")
        .eq("study_set_id", studySetId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!studySetId,
  });
}

/** Prefer a conversation that already has messages; otherwise the latest one. */
export function pickConversation(
  conversations:
    | { id: string; messages?: { count: number }[] | null }[]
    | null
    | undefined,
) {
  if (!conversations || conversations.length === 0) return null;

  for (const c of conversations) {
    const count = c.messages?.[0]?.count || 0;
    if (count > 0) return c;
  }

  return conversations[0];
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: studySetKeys.messages(conversationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
  });
}

export function useInvalidateStudySet() {
  const queryClient = useQueryClient();
  // One prefix invalidates the list + every study-set detail/sources/summary/etc.
  return (_studySetId: string) => {
    queryClient.invalidateQueries({ queryKey: studySetKeys.all });
  };
}