import cors from "cors";
import express from "express";
import { env } from "./env";
import { requireAuth } from "./middleware/auth";
import { chatRouter } from "./routes/chat";
import { flashcardsRouter } from "./routes/flashcards";
import { sourcesRouter } from "./routes/sources";
import { summariesRouter } from "./routes/summaries";

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

// Everything below requires a valid Supabase access token.
app.use(requireAuth);
app.use("/sources", sourcesRouter);
app.use("/study-sets", summariesRouter);
app.use("/study-sets", flashcardsRouter);
app.use("/conversations", chatRouter);


app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
});