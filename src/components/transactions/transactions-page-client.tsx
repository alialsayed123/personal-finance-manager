"use client";

import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PageHeading } from "@/components/layout/page-heading";
import { useI18n } from "@/components/providers/i18n-provider";
import { CategoryManagerDialog } from "@/components/transactions/category-manager-dialog";
import { TransactionFiltersBar } from "@/components/transactions/transaction-filters";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUiStore } from "@/stores/ui-store";
import type { Category, PaginatedTransactions, TransactionFilters } from "@/types/finance";

export function TransactionsPageClient({
  categories,
  transactions,
  initialFilters,
}: {
  categories: Category[];
  transactions: PaginatedTransactions;
  initialFilters: TransactionFilters;
}) {
  const { t } = useI18n();
  const { openQuickAdd } = useUiStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      <PageHeading
        title={t("transactions.title")}
        description={t("transactions.subtitle")}
        actions={
          <div className="flex flex-wrap gap-2">
            <CategoryManagerDialog categories={categories} />
            <Button onClick={() => openQuickAdd()}>
              <Plus /> {t("transactions.addTransaction")}
            </Button>
          </div>
        }
      />

      <TransactionFiltersBar categories={categories} initialFilters={initialFilters} />

      <Card className="mt-5">
        <CardContent className="p-4 sm:p-5">
          <TransactionsTable items={transactions.items} />

          <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-border/70 pt-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              {t("common.page")} {transactions.page} {t("common.of")} {transactions.pageCount}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={transactions.page <= 1}
                onClick={() => goToPage(transactions.page - 1)}
              >
                {t("common.previous")}
              </Button>
              <Button
                variant="outline"
                disabled={transactions.page >= transactions.pageCount}
                onClick={() => goToPage(transactions.page + 1)}
              >
                {t("common.next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
