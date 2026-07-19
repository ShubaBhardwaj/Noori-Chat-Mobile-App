import { Router } from "express";

import { ingestSource } from "../service/ingest";

export const sourcesRouter = Router();

// POST /sources/:id/process — extract text, chunk, embed, store chunks.
sourcesRouter.post("/:id/process", async (req, res) => {
  const result = await ingestSource(req.params.id, req.userId!);
  res.json({ status: "ready", chunkCount: result.chunkCount });
});