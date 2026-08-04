"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils";
import { transactionSchema, type TransactionInput } from "@/lib/validation/transaction";
import type { ActionResult } from "@/types/actions";

function revalidateFinancePages(): void {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/statistics");
  revalidatePath("/budgets");
  revalidatePath("/reports");
}

export async function saveTransactionAction(
  input: TransactionInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "validation.required",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await getAuthenticatedUser();
  const supabase = await createClient();
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id,type")
    .eq("id", parsed.data.categoryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (categoryError || !category) {
    return { success: false, error: "validation.required" };
  }

  if (category.type !== parsed.data.type) {
    return { success: false, error: "validation.categoryMismatch" };
  }

  const payload = {
    user_id: user.id,
    category_id: parsed.data.categoryId,
    type: parsed.data.type,
    currency: parsed.data.currency,
    amount: parsed.data.amount,
    occurred_at: parsed.data.occurredAt,
    notes: parsed.data.notes?.trim() || null,
  };

  if (parsed.data.id) {
    const { data, error } = await supabase
      .from("transactions")
      .update(payload)
      .eq("id", parsed.data.id)
      .eq("user_id", user.id)
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    revalidateFinancePages();
    return { success: true, data: { id: data.id }, message: "transactions.updated" };
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert(payload)
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidateFinancePages();
  return { success: true, data: { id: data.id }, message: "transactions.created" };
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return { success: false, error: "validation.required" };

  const user = await getAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidateFinancePages();
  return { success: true, data: undefined, message: "transactions.deleted" };
}
