import { generateText } from "ai";
import { Router } from "express";

import { chatModel, chatModelId } from "../lib/ai";
import { supabaseAdmin } from "../lib/supabase";
import { getStudySetText } from "../service/rag";

export const summariesRouter = Router();

const PROMPT_VERSION = "summary-v1";

const SYSTEM_PROMPT = `You are a study assistant. Write a clear, well-structured study summary of the provided material in Markdown.
Use headings, short paragraphs, and bullet points for key concepts. Focus on what a student needs to understand and remember.`;

// POST /study-sets/:id/summary
summariesRouter.post("/:id/summary", async (req, res) => {
  const studySetId = req.params.id;
  const userId = req.userId!;

  const { data: studySet, error } = await supabaseAdmin
    .from("study_sets")
    .select("id")
    .eq("id", studySetId)
    .eq("user_id", userId)
    .single();

  if (error || !studySet) {
    return res.status(404).json({ error: "Study set not found" });
  }

  const material = await getStudySetText(studySetId);
  if (!material) {
    return res
      .status(422)
      .json({ error: "No processed sources to summarize yet" });
  }

  const { text } = await generateText({
    model: chatModel,
    system: SYSTEM_PROMPT,
    prompt: material,
  });

  const { data: summary, error: insertError } = await supabaseAdmin
    .from("summaries")
    .insert({
      user_id: userId,
      study_set_id: studySetId,
      content: text,
      model: chatModelId,
      prompt_version: PROMPT_VERSION,
    })
    .select("id")
    .single();

  if (insertError) throw new Error(insertError.message);

  res.json({ id: summary.id, content: text });
});