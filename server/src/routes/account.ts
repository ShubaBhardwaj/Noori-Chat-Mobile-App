import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";

export const accountRouter = Router();

/**
 * DELETE /account (or POST /account/delete)
 * Deletes the authenticated user's Supabase auth user and associated data.
 */
async function handleDeleteAccount(userId: string) {
  // 1. Fetch user's sources to clean up any files in storage bucket if applicable
  const { data: sources } = await supabaseAdmin
    .from("sources")
    .select("storage_path")
    .eq("user_id", userId);

  if (sources && sources.length > 0) {
    const storagePaths = sources
      .map((s) => s.storage_path)
      .filter((p): p is string => Boolean(p));

    if (storagePaths.length > 0) {
      try {
        await supabaseAdmin.storage.from("sources").remove(storagePaths);
      } catch (err) {
        console.warn("Failed to remove user storage files during account deletion:", err);
      }
    }
  }

  // 2. Delete user from Supabase Auth via admin client
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(error.message);
  }
}

accountRouter.delete("/", async (req, res) => {
  try {
    const userId = req.userId!;
    await handleDeleteAccount(userId);
    return res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete account";
    return res.status(500).json({ error: message });
  }
});

accountRouter.post("/delete", async (req, res) => {
  try {
    const userId = req.userId!;
    await handleDeleteAccount(userId);
    return res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete account";
    return res.status(500).json({ error: message });
  }
});
