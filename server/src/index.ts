import cors from "cors";
import express from "express";
import { env } from "./env";
import { requireAuth } from "./middleware/auth";
import { accountRouter } from "./routes/account";
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

// Public Account Deletion Webpage for Google Play Console Compliance
app.get("/delete-account", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Delete Account - Notes LM</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #101010; color: #ffffff; padding: 40px 20px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
        h1 { color: #ffc799; font-size: 28px; }
        .card { background: #18181b; border: 1px solid #27272a; padding: 24px; border-radius: 12px; margin-top: 20px; }
        ul { padding-left: 20px; color: #a0a0a0; }
        a { color: #ffc799; }
      </style>
    </head>
    <body>
      <h1>Notes LM - Account & Data Deletion Request</h1>
      <div class="card">
        <p>If you wish to delete your <strong>Notes LM</strong> account and all associated personal data, you can do so directly within the app or by submitting a request below.</p>
        
        <h3>Option 1: Delete via the Mobile App</h3>
        <ul>
          <li>Open the <strong>Notes LM</strong> app.</li>
          <li>Go to <strong>Settings</strong> tab.</li>
          <li>Tap <strong>Delete account</strong> and confirm deletion.</li>
        </ul>

        <h3>Option 2: Submit a Deletion Request</h3>
        <p>If you have uninstalled the app or cannot access your account, please send an email from your registered email address to:</p>
        <p><strong>Support Email:</strong> <a href="mailto:support@shubhamai.com">support@shubhamai.com</a></p>
        <p><strong>Subject:</strong> Account Deletion Request</p>
        
        <h3>Data Deletion Policy</h3>
        <p>Upon account deletion, all user data including your account profile, study sets, flashcards, uploaded sources, and AI chat logs will be permanently deleted from our servers.</p>
      </div>
    </body>
    </html>
  `);
});

// Everything below requires a valid Supabase access token.
app.use(requireAuth);
app.use("/account", accountRouter);
app.use("/sources", sourcesRouter);
app.use("/study-sets", summariesRouter);
app.use("/study-sets", flashcardsRouter);
app.use("/conversations", chatRouter);


app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
});