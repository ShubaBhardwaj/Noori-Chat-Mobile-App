import { PDFParse } from "pdf-parse";

import { supabaseAdmin } from "../lib/supabase";

const BUCKET = "study-materials";

export async function extractPdfText(storagePath: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download PDF: ${error?.message ?? "not found"}`);
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}