import { endOfMonth, format, parseISO } from "date-fns";
import type { Metadata } from "next";

import { BudgetsClient } from "@/components/budgets/budgets-client";
import { getBudgets, getStatistics } from "@/services/finance-service";
import { getMonthStart, isValidYearMonth } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Budgets",
};

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month = isValidYearMonth(params.month)
    ? `${params.month}-01`
    : getMonthStart();
  const to = format(endOfMonth(parseISO(month)), "yyyy-MM-dd");
  const [budgets, usdStats, sypStats] = await Promise.all([
    getBudgets(month),
    getStatistics("USD", month, to),
    getStatistics("SYP", month, to),
  ]);

  return (
    <BudgetsClient
      month={month}
      budgets={budgets}
      spent={{ USD: usdStats.totalExpenses, SYP: sypStats.totalExpenses }}
    />
  );
}
