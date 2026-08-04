import { z } from "zod";

import { CATEGORY_TYPES } from "@/types/finance";

export const categorySchema = z.object({
  type: z.enum(CATEGORY_TYPES),
  nameEn: z.string().trim().min(1).max(60),
  nameAr: z.string().trim().min(1).max(60),
  icon: z.string().trim().min(1).max(20).default("CircleDollarSign"),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#64748b"),
});

export type CategoryInput = z.infer<typeof categorySchema>;
