import { z } from "zod";

import { isValidIsoDate } from "@/lib/utils";
import { CURRENCIES } from "@/types/finance";

export const budgetSchema = z.object({
  currency: z.enum(CURRENCIES),
  month: z.string().refine((value) => isValidIsoDate(value) && value.endsWith("-01")),
  amount: z.number().positive().max(999_999_999_999_999),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
