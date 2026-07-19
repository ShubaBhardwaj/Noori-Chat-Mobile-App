import { useAuthStore } from "@/features/auth/auth";
import { supabase } from "@/utils/supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type ChunkMatch = { id: string; content: string; similarity: number };

async function apiPost<T>(path: string, body: unknown = {}): Promise<T> {
  if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL is not set");

  const { data } = await supabase.auth.getSession();
  const token =
    data.session?.access_token ||
    useAuthStore.getState().session?.access_token;

  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Access-Token": token,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }

  return res.json();
}

export function processSource(sourceId: string) {
  return apiPost<{ status: string; chunkCount: number }>(
    `/sources/${sourceId}/process`,
  );
}

export function generateSummary(studySetId: string) {
  return apiPost<{ id: string; content: string }>(
    `/study-sets/${studySetId}/summary`,
  );
}

export function generateFlashcards(studySetId: string, count?: number, deckId?: string) {
  return apiPost<{
    deckId: string;
    cards: { front: string; back: string }[];
  }>(`/study-sets/${studySetId}/flashcards`, { count, deckId });
}

export function sendChatMessage(conversationId: string, message: string) {
  return apiPost<{ reply: string; sources: ChunkMatch[] }>(
    `/conversations/${conversationId}/chat`,
    { message },
  );
}