import type { Metadata } from "next";

import { ReportsClient } from "@/components/reports/reports-client";
import { getCategories, getTransactions } from "@/services/finance-service";
import { getReportRange } from "@/lib/date-ranges";

export const metadata: Metadata = {
  title: "Reports",
};

export default async function ReportsPage() {
  const range = getReportRange("month");
  const filters = {
    from: range.from,
    to: range.to,
    currency: "all" as const,
    type: "all" as const,
    categoryId: "all" as const,
    query: "",
    page: 1,
    pageSize: 50,
    sortBy: "occurred_at" as const,
    sortDirection: "desc" as const,
  };
  const [categories, initialData] = await Promise.all([
    getCategories(),
    getTransactions(filters),
  ]);

  return <ReportsClient categories={categories} initialData={initialData} initialFilters={filters} />;
}
