import { embedMany } from "ai";
import { embeddingModel } from "../lib/ai";
import { supabaseAdmin } from "../lib/supabase";
import { extractPdfText } from "./pdf";
import { fetchWebText } from "./web";

type SourceRow = {
    id: string;
    type: "pdf" | "note" | "web";
    content: string | null;
    storage_path: string | null;
    url: string | null;
    fetched_content: string | null;
};

const CHUNK_SIZE = 2000; // roughly 500 tokens
const CHUNK_OVERLAP = 200;

export function chunkText(text: string): string[] {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) return [];

    const chunks: string[] = [];
    let start = 0;
    while (start < normalized.length) {
        const end = Math.min(start + CHUNK_SIZE, normalized.length);
        chunks.push(normalized.slice(start, end));
        if (end === normalized.length) break;
        start = end - CHUNK_OVERLAP;
    }
    return chunks;
}

async function resolveSourceText(source: SourceRow): Promise<string> {
    switch (source.type) {
        case "pdf":
            if (!source.storage_path) throw new Error("Storage path is required for PDF sources");
            return extractPdfText(source.storage_path);
        case "note":
            return source.content ?? "";
        case "web":
            if (source.fetched_content) return source.fetched_content;
            if (!source.url) throw new Error("Web source missing url");
            const text = await fetchWebText(source.url);
            await supabaseAdmin
            .from("sources")
            .update({ fetched_content: text })
            .eq("id", source.id);
            return text;
        default:
            throw new Error(`Unknown source type: ${source.type}`);
    }
}

async function markFailed(sourceId: string, message: string) {
    await supabaseAdmin
        .from("sources")
        .update({ status: "failed", error_message: message })
        .eq("id", sourceId);
}

export async function ingestSource(
    sourceId: string,
    userId: string,
): Promise<{ chunkCount: number }> {
    const { data: source, error } = await supabaseAdmin
        .from("sources")
        .select("*")
        .eq("id", sourceId)
        .eq("user_id", userId)
        .single();

    if (error || !source) {
        throw Object.assign(new Error("Source not found"), { status: 404 });
    }

    await supabaseAdmin
        .from("sources")
        .update({ status: "processing", error_message: null })
        .eq("id", sourceId);

    try {
        const text = await resolveSourceText(source);
        const chunks = chunkText(text);

        if (chunks.length === 0) {
            await markFailed(sourceId, "No extractable text found in source");
            throw Object.assign(new Error("No extractable text found in source"), {
                status: 422,
            });
        }

        const { embeddings } = await embedMany({
            model: embeddingModel,
            values: chunks,
            providerOptions: {
                google: { outputDimensionality: 1536 },
            },
        });

        // Replace any prior chunks so reprocessing is idempotent.
        await supabaseAdmin.from("source_chunks").delete().eq("source_id", sourceId);

        const rows = chunks.map((content, index) => ({
            source_id: sourceId,
            chunk_index: index,
            content,
            embedding: JSON.stringify(embeddings[index]),
            token_count: Math.ceil(content.length / 4),
        }));

        const { error: insertError } = await supabaseAdmin
            .from("source_chunks")
            .insert(rows);
        if (insertError) throw new Error(insertError.message);

        await supabaseAdmin
            .from("sources")
            .update({ status: "ready", error_message: null })
            .eq("id", sourceId);

        return { chunkCount: chunks.length };
    } catch (err) {
        if (!(err instanceof Error) || !("status" in err)) {
            await markFailed(
                sourceId,
                err instanceof Error ? err.message : "Processing failed",
            );
        }
        throw err;
    }
}