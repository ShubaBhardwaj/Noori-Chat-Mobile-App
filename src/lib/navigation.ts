import { colors } from "@/lib/theme";
import { supabase } from "@/utils/supabase";

export const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.foreground },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
} as const;


  export async function createWebSource(
    studySetId: string,
    url: string,
    title?: string,
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
  
    // await processSource(source.id);
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