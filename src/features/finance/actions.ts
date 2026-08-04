"use server";

import { z } from "zod";

import { getStatistics, getTransactions } from "@/services/finance-service";
import { isValidIsoDate } from "@/lib/utils";
import type { ActionResult } from "@/types/actions";
import { CURRENCIES, type StatisticsData, type TransactionFilters } from "@/types/finance";

const statisticsRequestSchema = z.object({
  currency: z.enum(CURRENCIES),
  from: z.string().refine(isValidIsoDate),
  to: z.string().refine(isValidIsoDate),
});

export async function getStatisticsAction(input: {
  currency: "USD" | "SYP";
  from: string;
  to: string;
}): Promise<ActionResult<StatisticsData>> {
  const parsed = statisticsRequestSchema.safeParse(input);
  if (!parsed.success || parsed.data.from > parsed.data.to) {
    return { success: false, error: "validation.dateRange" };
  }

  try {
    const data = await getStatistics(parsed.data.currency, parsed.data.from, parsed.data.to);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "common.error",
    };
  }
}

export async function getReportTransactionsAction(
  filters: TransactionFilters,
): Promise<ActionResult<Awaited<ReturnType<typeof getTransactions>>>> {
  try {
    if (
      (filters.from && !isValidIsoDate(filters.from))
      || (filters.to && !isValidIsoDate(filters.to))
      || (filters.from && filters.to && filters.from > filters.to)
    ) {
      return { success: false, error: "validation.dateRange" };
    }

    const data = await getTransactions(filters);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "common.error",
    };
  }
}
