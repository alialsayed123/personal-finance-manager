"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils";
import { categorySchema, type CategoryInput } from "@/lib/validation/category";
import type { ActionResult } from "@/types/actions";
import type { Category } from "@/types/finance";
import { mapCategory } from "@/lib/mappers";

export async function createCategoryAction(
  input: CategoryInput,
): Promise<ActionResult<Category>> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "validation.required",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await getAuthenticatedUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      type: parsed.data.type,
      name_en: parsed.data.nameEn,
      name_ar: parsed.data.nameAr,
      icon: parsed.data.icon,
      color: parsed.data.color,
      is_default: false,
    })
    .select("*")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/", "layout");
  return { success: true, data: mapCategory(data), message: "transactions.categoryCreated" };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return { success: false, error: "validation.required" };

  const user = await getAuthenticatedUser();
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("is_default")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!category) return { success: false, error: "validation.required" };
  if (category.is_default) {
    return { success: false, error: "transactions.defaultCategoryProtected" };
  }

  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)
    .eq("user_id", user.id);

  if ((count ?? 0) > 0) {
    return { success: false, error: "transactions.categoryInUse" };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/", "layout");
  return { success: true, data: undefined, message: "transactions.categoryDeleted" };
}
