import { processSource } from "@/lib/api-client";
import { uploadPdfSource } from "@/lib/source";
import { supabase } from "@/utils/supabase";
import * as DocumentPicker from "expo-document-picker";

export async function createStudySet(title: string, description?: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("study_sets")
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function createNoteSource(
  studySetId: string,
  title: string,
  content: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: source, error } = await supabase
    .from("sources")
    .insert({
      user_id: user.id,
      study_set_id: studySetId,
      type: "note",
      title: title.trim(),
      content: content.trim(),
      status: "processing",
    })
    .select("id")
    .single();

  if (error) throw error;

  // await processSource(source.id);
  return source.id;
}

export async function retryProcessSource(sourceId: string) {
  const { error } = await supabase
    .from("sources")
    .update({ status: "processing", error_message: null })
    .eq("id", sourceId);

  if (error) throw error;

  try {
    return await processSource(sourceId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";
    await supabase
      .from("sources")
      .update({ status: "failed", error_message: message })
      .eq("id", sourceId);
    throw err;
  }
}

export async function pickAndUploadPdf(studySetId: string, title?: string) {
  console.log("pickAndUploadPdf");
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: false,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];

  return uploadPdfSource({
    studySetId,
    title: title?.trim() || asset.name.replace(/\.pdf$/i, ""),
    file: {
      uri: asset.uri,
      name: asset.name,
      size: asset.size,
    },
  });
}

export async function createWebSource(
  studySetId: string,
  url: string,
  title?: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = url.trim();
  const normalized = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error("Enter a valid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("URL must start with http:// or https://");
  }

  const sourceTitle =
    title?.trim() || parsed.hostname.replace(/^www\./, "") || "Web page";

  const { data: source, error } = await supabase
    .from("sources")
    .insert({
      user_id: user.id,
      study_set_id: studySetId,
      type: "web",
      title: sourceTitle,
      url: parsed.toString(),
      status: "processing",
    })
    .select("id")
    .single();

  if (error) throw error;

  await processSource(source.id);
  return source.id;
}

export async function createConversation(studySetId: string, title?: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: user.id,
      study_set_id: studySetId,
      title: title?.trim() || "Study chat",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSource(
  sourceId: string,
  type: "pdf" | "note" | "web",
  storagePath?: string | null
) {
  if (type === "pdf" && storagePath) {
    const { error: storageError } = await supabase.storage
      .from("study-materials")
      .remove([storagePath]);
    if (storageError) {
      console.warn("Failed to delete PDF from storage:", storageError);
    }
  }

  const { error } = await supabase
    .from("sources")
    .delete()
    .eq("id", sourceId);

  if (error) throw error;
}

export async function deleteFlashcardDeck(studySetId: string) {
  const { error } = await supabase
    .from("flashcard_decks")
    .delete()
    .eq("study_set_id", studySetId);

  if (error) throw error;
}


