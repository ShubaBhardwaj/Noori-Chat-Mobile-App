import { generateText } from "ai";
import { Router } from "express";
import { z } from "zod";

import { chatModel } from "../lib/ai";
import { supabaseAdmin } from "../lib/supabase";
import { getStudySetText } from "../service/rag";

export const flashcardsRouter = Router();

const FLASHCARD_DEFAULT = 12;
const FLASHCARD_LIMIT = 20;

function buildFlashcardSchema(count: number) {
  return z.object({
    cards: z
      .array(
        z.object({
          front: z.string().min(1),
          back: z.string().min(1),
        }),
      )
      .min(1)
      .max(count),
  });
}

function systemPrompt(count: number, existingQuestions?: string[]) {
  const duplicateInstruction =
    existingQuestions && existingQuestions.length > 0
      ? `\nCRITICAL: Do NOT duplicate any of the following existing terms or questions: ${JSON.stringify(
          existingQuestions,
        )}. Generate entirely new terms/questions.`
      : "";
  return `You are a study assistant. Generate exactly ${count} concise, high-quality flashcards from the provided material.${duplicateInstruction}
Return ONLY valid JSON matching this shape (no markdown fences):
{"cards":[{"front":"question or term","back":"answer or definition"}]}
`;
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Model did not return valid JSON for flashcards");
  }
}

function requestedCount(body: unknown): number {
  const raw =
    typeof body === "object" &&
      body !== null &&
      "count" in body &&
      typeof (body as { count: unknown }).count === "number"
      ? (body as { count: number }).count
      : NaN;

  const value = Number.isFinite(raw) ? Math.floor(raw) : FLASHCARD_DEFAULT;
  return Math.min(FLASHCARD_LIMIT, Math.max(1, value));
}

// POST /study-sets/:id/flashcards
flashcardsRouter.post("/:id/flashcards", async (req, res) => {
  try {
    const studySetId = req.params.id;
    const userId = req.userId!;

 
    const { data: studySet, error } = await supabaseAdmin
      .from("study_sets")
      .select("id, title")
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
        .json({ error: "No processed sources to generate flashcards from yet" });
    }

    const bodyDeckId = typeof req.body?.deckId === "string" ? req.body.deckId : "";
    let deckId = bodyDeckId;
    let existingCards: { front: string }[] = [];

    if (deckId) {
      const { data: existingDeck } = await supabaseAdmin
        .from("flashcard_decks")
        .select("id")
        .eq("id", deckId)
        .single();

      if (existingDeck) {
        const { data } = await supabaseAdmin
          .from("flashcards")
          .select("front")
          .eq("deck_id", deckId);
        existingCards = data || [];
      } else {
        deckId = "";
      }
    }

    const count = requestedCount(req.body);

    const { text } = await generateText({
      model: chatModel,
      system: systemPrompt(
        count,
        existingCards.map((c) => c.front),
      ),
      prompt: material,
      temperature: 0.4,
    });

    const schema = buildFlashcardSchema(count);
    const parsed = schema.parse(extractJsonObject(text));

    if (!deckId) {
      const { count: deckCount } = await supabaseAdmin
        .from("flashcard_decks")
        .select("id", { count: "exact", head: true })
        .eq("study_set_id", studySetId)
        .eq("user_id", userId);

      const deckNumber = (deckCount ?? 0) + 1;
      const title = `${studySet.title} Deck ${deckNumber}`;

      const { data: deck, error: deckError } = await supabaseAdmin
        .from("flashcard_decks")
        .insert({
          user_id: userId,
          study_set_id: studySetId,
          title,
        })
        .select("id")
        .single();

      if (deckError) throw new Error(deckError.message);
      deckId = deck.id;
    }

    const startOrder = existingCards.length;
    const rows = parsed.cards.map((card, index) => ({
      deck_id: deckId,
      front: card.front,
      back: card.back,
      sort_order: startOrder + index,
    }));

    const { error: cardsError } = await supabaseAdmin
      .from("flashcards")
      .insert(rows);
    if (cardsError) throw new Error(cardsError.message);

    res.json({
      deckId: deckId,
      cards: parsed.cards,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate flashcards";
    console.error("[flashcards]", message);
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
});