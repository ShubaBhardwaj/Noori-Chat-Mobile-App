import { createClient } from "@supabase/supabase-js";

import { env } from "../env";

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
} as const;

// Service-role client: bypasses RLS. Only used server-side after the caller's
// identity is verified, and every query is scoped to the authenticated user.
export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  clientOptions,
);

const supabaseAuth = createClient(
  env.supabaseUrl,
  env.supabaseAnonKey,
  clientOptions,
);

export async function getUserIdFromToken(token: string): Promise<string | null> {
  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }
  return data.user.id;
}