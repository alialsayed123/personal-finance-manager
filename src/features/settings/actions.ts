"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { settingsSchema, type SettingsInput } from "@/lib/validation/settings";
import type { ActionResult } from "@/types/actions";

export async function updateSettingsAction(input: SettingsInput): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "validation.required" };
  }

  const user = await getAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      language: parsed.data.language,
      theme: parsed.data.theme,
      timezone: process.env.NEXT_PUBLIC_APP_TIME_ZONE || "Asia/Damascus",
    },
    { onConflict: "user_id" },
  );

  if (error) return { success: false, error: error.message };
  revalidatePath("/", "layout");
  return { success: true, data: undefined, message: "settings.saved" };
}
