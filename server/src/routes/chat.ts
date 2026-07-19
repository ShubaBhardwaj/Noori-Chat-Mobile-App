import { generateText, type ModelMessage } from "ai";
import { Router } from "express";

import { chatModel } from "../lib/ai";

import { supabaseAdmin } from "../lib/supabase";
import { retrieveContext } from "../service/rag";

export const chatRouter = Router();

const HISTORY_LIMIT = 10;

const SYSTEM_PROMPT = `You are a helpful study assistant. Answer the student's question using the provided context from their study materials.
If the context does not contain the answer, say so honestly and answer from general knowledge only if appropriate.
Be concise and clear.`;

// POST /conversations/:id/chat
chatRouter.post("/:id/chat", async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.userId!;
    const message =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

  

    const { data: conversation, error } = await supabaseAdmin
      .from("conversations")
      .select("id, study_set_id")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .single();

    if (error || !conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message,
    });

    const matches = await retrieveContext(conversation.study_set_id, message);
    const context = matches.map((m) => m.content).join("\n\n---\n\n");

    const { data: history } = await supabaseAdmin
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);

    const priorMessages: ModelMessage[] = (history ?? [])
      .reverse()
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const { text } = await generateText({
      model: chatModel,
      system: context
        ? `${SYSTEM_PROMPT}\n\nContext:\n${context}`
        : SYSTEM_PROMPT,
      messages: priorMessages,
    });

    await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: text,
      metadata: { sources: matches.map((m) => m.id) },
    });

    await supabaseAdmin
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    res.json({ reply: text, sources: matches });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate chat reply";
    console.error("[chat]", message);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
});