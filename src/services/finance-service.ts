import "server-only";

import { getAuthenticatedUser } from "@/lib/auth";
import {
  mapBudget,
  mapCategory,
  mapDashboardSummary,
  mapSettings,
  mapTransaction,
} from "@/lib/mappers";
import { createClient } from "@/lib/supabase/server";
import { getTodayInAppTimeZone } from "@/lib/time";
import { APP_TIME_ZONE, isUuid, isValidIsoDate, toNumber } from "@/lib/utils";
import type {
  BalanceHistoryItem,
  Budget,
  Category,
  CategoryDistributionItem,
  Currency,
  CurrencySummary,
  MonthlyExpenseItem,
  PaginatedTransactions,
  StatisticsData,
  TransactionFilters,
  TransactionWithCategory,
  UserSettings,
} from "@/types/finance";

const DEFAULT_SETTINGS: Omit<UserSettings, "userId" | "createdAt" | "updatedAt"> = {
  language: "en",
  theme: "system",
  timezone: APP_TIME_ZONE,
};

export async function getSettings(): Promise<UserSettings> {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();
  const readSettings = () =>
    supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

  let { data, error } = await readSettings();
  if (error) throw new Error(error.message);

  if (!data) {
    const { error: seedError } = await supabase.rpc("ensure_user_defaults", {});
    if (seedError) throw new Error(seedError.message);
    const retry = await readSettings();
    if (retry.error) throw new Error(retry.error.message);
    data = retry.data;
  }

  if (!data) {
    const now = new Date().toISOString();
    return {
      userId: user.id,
      ...DEFAULT_SETTINGS,
      createdAt: now,
      updatedAt: now,
    };
  }

  return mapSettings(data);
}

export async function getCategories(type?: "income" | "expense"): Promise<Category[]> {
  await getAuthenticatedUser();
  const supabase = await createClient();
  const readCategories = () => {
    let query = supabase
      .from("categories")
      .select("*")
      .order("is_default", { ascending: false });

    if (type) query = query.eq("type", type);
    return query.order("name_en", { ascending: true });
  };

  let { data, error } = await readCategories();
  if (error) throw new Error(error.message);

  if (!data?.length) {
    const { error: seedError } = await supabase.rpc("ensure_user_defaults", {});
    if (seedError) throw new Error(seedError.message);
    const retry = await readCategories();
    if (retry.error) throw new Error(retry.error.message);
    data = retry.data;
  }

  return (data ?? []).map(mapCategory);
}

export async function getDashboardSummary(): Promise<CurrencySummary[]> {
  await getAuthenticatedUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dashboard_summary", {
    p_today: getTodayInAppTimeZone(),
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapDashboardSummary);
}

export async function getTransactions(
  filters: TransactionFilters = {},
): Promise<PaginatedTransactions> {
  await getAuthenticatedUser();
  const supabase = await createClient();
  const requestedPage = Number(filters.page);
  const requestedPageSize = Number(filters.pageSize);
  const page = Number.isFinite(requestedPage)
    ? Math.min(Math.max(Math.trunc(requestedPage), 1), 100_000)
    : 1;
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(Math.max(Math.trunc(requestedPageSize), 1), 10_000)
    : 20;
  const query = typeof filters.query === "string" ? filters.query.trim().slice(0, 120) : "";
  const rpcArgs = {
    p_query: query || null,
    p_currency: filters.currency === "USD" || filters.currency === "SYP"
      ? filters.currency
      : null,
    p_type: filters.type === "income" || filters.type === "expense"
      ? filters.type
      : null,
    p_category_id: isUuid(filters.categoryId) ? filters.categoryId : null,
    p_from: isValidIsoDate(filters.from) ? filters.from : null,
    p_to: isValidIsoDate(filters.to) ? filters.to : null,
    p_sort_by:
      filters.sortBy === "amount" || filters.sortBy === "created_at"
        ? filters.sortBy
        : "occurred_at",
    p_sort_dir: filters.sortDirection === "asc" ? "asc" : "desc",
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  };

  const [transactionsResult, totalsResult] = await Promise.all([
    supabase.rpc("search_transactions", rpcArgs),
    supabase.rpc("get_transaction_report_totals", {
      p_query: rpcArgs.p_query,
      p_currency: rpcArgs.p_currency,
      p_type: rpcArgs.p_type,
      p_category_id: rpcArgs.p_category_id,
      p_from: rpcArgs.p_from,
      p_to: rpcArgs.p_to,
    }),
  ]);

  const error = transactionsResult.error || totalsResult.error;
  if (error) throw new Error(error.message);
  let rows = transactionsResult.data ?? [];
  const total = rows.length > 0
    ? Number(rows[0].total_count)
    : (totalsResult.data ?? []).reduce((sum, row) => sum + Number(row.transaction_count), 0);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const effectivePage = Math.min(page, pageCount);

  if (total > 0 && effectivePage !== page) {
    const { data: lastPageRows, error: lastPageError } = await supabase.rpc(
      "search_transactions",
      {
        ...rpcArgs,
        p_offset: (effectivePage - 1) * pageSize,
      },
    );
    if (lastPageError) throw new Error(lastPageError.message);
    rows = lastPageRows ?? [];
  }

  return {
    items: rows.map(mapTransaction),
    totals: (totalsResult.data ?? []).map((row) => ({
      currency: row.currency,
      totalIncome: toNumber(row.total_income),
      totalExpenses: toNumber(row.total_expenses),
      net: toNumber(row.net),
      transactionCount: Number(row.transaction_count),
    })),
    total,
    page: effectivePage,
    pageSize,
    pageCount,
  };
}

export async function getRecentTransactions(limit = 6): Promise<TransactionWithCategory[]> {
  await getAuthenticatedUser();
  const supabase = await createClient();
  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(Math.trunc(limit), 1), 20)
    : 6;
  const { data, error } = await supabase.rpc("search_transactions", {
    p_query: null,
    p_currency: null,
    p_type: null,
    p_category_id: null,
    p_from: null,
    p_to: null,
    p_sort_by: "occurred_at",
    p_sort_dir: "desc",
    p_limit: safeLimit,
    p_offset: 0,
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapTransaction);
}

export async function getBudgets(month: string): Promise<Budget[]> {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", user.id)
    .eq("month", month)
    .order("currency", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapBudget);
}

export async function getStatistics(
  currency: Currency,
  from: string,
  to: string,
): Promise<StatisticsData> {
  await getAuthenticatedUser();
  const supabase = await createClient();

  const [totalsResult, distributionResult, monthlyResult, balanceResult] = await Promise.all([
    supabase.rpc("get_period_totals", { p_currency: currency, p_from: from, p_to: to }),
    supabase.rpc("get_category_distribution", {
      p_currency: currency,
      p_from: from,
      p_to: to,
    }),
    supabase.rpc("get_monthly_expenses", { p_currency: currency, p_from: from, p_to: to }),
    supabase.rpc("get_balance_history", { p_currency: currency, p_from: from, p_to: to }),
  ]);

  const error =
    totalsResult.error || distributionResult.error || monthlyResult.error || balanceResult.error;
  if (error) throw new Error(error.message);

  const totals = totalsResult.data?.[0];
  const categoryDistribution: CategoryDistributionItem[] = (distributionResult.data ?? []).map(
    (row) => ({
      categoryId: row.category_id,
      nameEn: row.name_en,
      nameAr: row.name_ar,
      icon: row.icon,
      color: row.color,
      total: toNumber(row.total),
      percentage: toNumber(row.percentage),
    }),
  );
  const monthlyExpenses: MonthlyExpenseItem[] = (monthlyResult.data ?? []).map((row) => ({
    month: row.month,
    total: toNumber(row.total),
  }));
  const balanceHistory: BalanceHistoryItem[] = (balanceResult.data ?? []).map((row) => ({
    date: row.date,
    balance: toNumber(row.balance),
  }));

  return {
    currency,
    from,
    to,
    totalIncome: toNumber(totals?.total_income),
    totalExpenses: toNumber(totals?.total_expenses),
    net: toNumber(totals?.net),
    categoryDistribution,
    monthlyExpenses,
    balanceHistory,
  };
}
