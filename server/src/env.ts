import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  supabaseUrl: required("SUPABASE_URL"),
  supabaseAnonKey: required("SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  googleApiKey: required("GOOGLE_GENERATIVE_AI_API_KEY"),
  chatModel: process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash",
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001",
  /** Secret key (sk_...) for server-side entitlement checks. Optional in local dev. */
  revenueCatSecretApiKey: process.env.REVENUECAT_SECRET_API_KEY?.trim() || "",
  firecrawlApiKey: required("FIRECRAWL_API_KEY"),
} as const;