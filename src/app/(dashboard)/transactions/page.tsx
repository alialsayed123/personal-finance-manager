import type { Metadata } from "next";

import { TransactionsPageClient } from "@/components/transactions/transactions-page-client";
import { getCategories, getTransactions } from "@/services/finance-service";
import { isUuid, isValidIsoDate } from "@/lib/utils";
import type { TransactionFilters } from "@/types/finance";

export const metadata: Metadata = {
  title: "Transactions",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const currencyParam = first(params.currency);
  const typeParam = first(params.type);
  const sortByParam = first(params.sortBy);
  const sortDirectionParam = first(params.sortDirection);
  const categoryIdParam = first(params.categoryId);
  const fromParam = first(params.from);
  const toParam = first(params.to);
  const queryParam = first(params.query)?.trim().slice(0, 120) ?? "";
  const filters: TransactionFilters = {
    query: queryParam,
    currency: currencyParam === "USD" || currencyParam === "SYP" ? currencyParam : "all",
    type: typeParam === "income" || typeParam === "expense" ? typeParam : "all",
    categoryId: isUuid(categoryIdParam) ? categoryIdParam : "all",
    from: isValidIsoDate(fromParam) ? fromParam : "",
    to: isValidIsoDate(toParam) ? toParam : "",
    sortBy:
      sortByParam === "amount" || sortByParam === "created_at"
        ? sortByParam
        : "occurred_at",
    sortDirection: sortDirectionParam === "asc" ? "asc" : "desc",
    page: Math.min(Math.max(Number(first(params.page) ?? "1") || 1, 1), 100_000),
    pageSize: 20,
  };

  const [categories, transactions] = await Promise.all([
    getCategories(),
    getTransactions(filters),
  ]);

  return (
    <TransactionsPageClient
      categories={categories}
      transactions={transactions}
      initialFilters={filters}
    />
  );
}
