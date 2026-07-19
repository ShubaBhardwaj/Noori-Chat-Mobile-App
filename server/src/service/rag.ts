import { embed } from "ai";

import { embeddingModel } from "../lib/ai";
import { supabaseAdmin } from "../lib/supabase";


export type MatchedChunk = { id: string; content: string; similarity: number };


export async function retrieveContext(
    studySetId: string,
    query: string,
    matchCount = 8,
  ): Promise<MatchedChunk[]> {
    const { embedding } = await embed({ model: embeddingModel, value: query });
  
    const { data, error } = await supabaseAdmin.rpc("match_source_chunks", {
      query_embedding: JSON.stringify(embedding),
      match_study_set_id: studySetId,
      match_count: matchCount,
    });
  
    if (error) throw new Error(`Vector search failed: ${error.message}`);
    return (data as MatchedChunk[] | null) ?? [];
  }

  export async function getStudySetText(
    studySetId: string,
    maxChars = 24000,
  ): Promise<string> {
    const { data: sources } = await supabaseAdmin
      .from("sources")
      .select("id")
      .eq("study_set_id", studySetId)
      .eq("status", "ready");
  
    const sourceIds = (sources ?? []).map((s) => s.id);
    if (sourceIds.length === 0) return "";
  
    const { data: chunks } = await supabaseAdmin
      .from("source_chunks")
      .select("content, chunk_index")
      .in("source_id", sourceIds)
      .order("chunk_index", { ascending: true });
  
    let text = "";
    for (const chunk of chunks ?? []) {
      if (text.length + chunk.content.length > maxChars) break;
      text += chunk.content + "\n\n";
    }
    return text.trim();
  }
  