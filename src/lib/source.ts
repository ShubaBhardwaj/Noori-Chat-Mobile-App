import { supabase } from "@/utils/supabase";
import { processSource } from "./api-client";

const BUCKET = "study-materials";

export type PickedPdf = {
  uri: string;
  name: string;
  size?: number;
};

export async function uploadPdfSource(params: {
    studySetId: string;
    title: string;
    file: PickedPdf;
  }): Promise<{ sourceId: string; chunkCount: number }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
  
    const storagePath = `${user.id}/${params.studySetId}/${Date.now()}.pdf`;
  
    const { data: source, error: insertError } = await supabase
      .from("sources")
      .insert({
        user_id: user.id,
        study_set_id: params.studySetId,
        type: "pdf",
        title: params.title,
        status: "pending",
        storage_path: storagePath,
        file_size: params.file.size ?? null,
        mime_type: "application/pdf",
      })
      .select("id")
      .single();
  
    if (insertError) throw insertError;
  
    try {
      const fileData = await fetch(params.file.uri).then((r) => r.arrayBuffer());
  
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileData, { contentType: "application/pdf" });
  
      if (uploadError) throw uploadError;
  
      await supabase
        .from("sources")
        .update({ status: "processing" })
        .eq("id", source.id);
  
      const { chunkCount } = await processSource(source.id);
      return { sourceId: source.id, chunkCount };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      await supabase
        .from("sources")
        .update({ status: "failed", error_message: message })
        .eq("id", source.id);
      throw err;
    }
  }