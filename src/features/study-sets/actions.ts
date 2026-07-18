import { supabase } from "@/utils/supabase";

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
    return 
    // return await processSource(sourceId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";
    await supabase
      .from("sources")
      .update({ status: "failed", error_message: message })
      .eq("id", sourceId);
    throw err;
  }
}
