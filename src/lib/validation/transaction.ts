import { z } from "zod";

import { isValidIsoDate } from "@/lib/utils";
import { CURRENCIES, TRANSACTION_TYPES } from "@/types/finance";

export const transactionSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(TRANSACTION_TYPES),
  currency: z.enum(CURRENCIES),
  categoryId: z.string().uuid(),
  amount: z.number().positive().max(999_999_999_999_999),
  occurredAt: z.string().refine(isValidIsoDate),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
