import cors from "cors";
import express from "express";

import { env } from "./env";

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
});