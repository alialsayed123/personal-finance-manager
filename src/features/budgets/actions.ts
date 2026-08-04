"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { budgetSchema, type BudgetInput } from "@/lib/validation/budget";
import type { ActionResult } from "@/types/actions";

export async function upsertBudgetAction(input: BudgetInput): Promise<ActionResult> {
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "validation.required",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await getAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: user.id,
      currency: parsed.data.currency,
      month: parsed.data.month,
      amount: parsed.data.amount,
    },
    { onConflict: "user_id,currency,month" },
  );

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
  return { success: true, data: undefined, message: "budgets.saved" };
}
