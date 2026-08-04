"use client";

import { RotateCcw, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, TransactionFilters } from "@/types/finance";

export function TransactionFiltersBar({
  categories,
  initialFilters,
}: {
  categories: Category[];
  initialFilters: TransactionFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const [query, setQuery] = useState(initialFilters.query ?? "");
  const debouncedQuery = useDebouncedValue(query, 350);

  useEffect(() => {
    setQuery(initialFilters.query ?? "");
  }, [initialFilters.query]);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "all") params.delete(key);
        else params.set(key, value);
      });
      if (resetPage) params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const currentQuery = searchParams.get("query") ?? "";
    if (debouncedQuery !== currentQuery) updateParams({ query: debouncedQuery });
  }, [debouncedQuery, searchParams, updateParams]);

  const reset = () => {
    setQuery("");
    router.replace(pathname, { scroll: false });
  };

  return (
    <div className="glass-panel grid gap-3 rounded-2xl border border-border/70 p-4 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.4fr)_repeat(5,minmax(130px,0.7fr))_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="ps-10"
          placeholder={t("transactions.searchPlaceholder")}
        />
      </div>

      <Select
        value={initialFilters.currency ?? "all"}
        onValueChange={(value) => updateParams({ currency: value })}
      >
        <SelectTrigger><SelectValue placeholder={t("transactions.filterCurrency")} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.all")}</SelectItem>
          <SelectItem value="USD">USD</SelectItem>
          <SelectItem value="SYP">SYP</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={initialFilters.type ?? "all"}
        onValueChange={(value) => updateParams({ type: value })}
      >
        <SelectTrigger><SelectValue placeholder={t("transactions.filterType")} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.all")}</SelectItem>
          <SelectItem value="income">{t("common.income")}</SelectItem>
          <SelectItem value="expense">{t("common.expense")}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={initialFilters.categoryId ?? "all"}
        onValueChange={(value) => updateParams({ categoryId: value })}
      >
        <SelectTrigger><SelectValue placeholder={t("transactions.filterCategory")} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.all")}</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {locale === "ar" ? category.nameAr : category.nameEn}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={initialFilters.from ?? ""}
        aria-label={t("common.from")}
        onChange={(event) => updateParams({ from: event.target.value })}
      />
      <Input
        type="date"
        value={initialFilters.to ?? ""}
        aria-label={t("common.to")}
        onChange={(event) => updateParams({ to: event.target.value })}
      />

      <Select
        value={`${initialFilters.sortBy ?? "occurred_at"}:${initialFilters.sortDirection ?? "desc"}`}
        onValueChange={(value) => {
          const [sortBy, sortDirection] = value.split(":");
          updateParams({ sortBy, sortDirection });
        }}
      >
        <SelectTrigger><SelectValue placeholder={t("common.sort")} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="occurred_at:desc">{t("transactions.sortDate")} ↓</SelectItem>
          <SelectItem value="occurred_at:asc">{t("transactions.sortDate")} ↑</SelectItem>
          <SelectItem value="amount:desc">{t("transactions.sortAmount")} ↓</SelectItem>
          <SelectItem value="amount:asc">{t("transactions.sortAmount")} ↑</SelectItem>
          <SelectItem value="created_at:desc">{t("transactions.sortCreated")} ↓</SelectItem>
        </SelectContent>
      </Select>

      <Button type="button" variant="outline" size="icon" onClick={reset} aria-label={t("common.reset")}>
        <RotateCcw />
      </Button>
    </div>
  );
}
