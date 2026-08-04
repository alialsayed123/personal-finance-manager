"use client";

import { Download, FileSpreadsheet, FileText, LoaderCircle, Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { PageHeading } from "@/components/layout/page-heading";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { getReportTransactionsAction } from "@/features/finance/actions";
import { getReportRange, type ReportPreset } from "@/lib/date-ranges";
import { formatCurrency } from "@/lib/utils";
import type {
  Category,
  Currency,
  PaginatedTransactions,
  TransactionFilters,
  TransactionType,
} from "@/types/finance";
import {
  exportReportCsv,
  exportReportExcel,
  exportReportPdf,
  type ReportExportLabels,
} from "@/components/reports/report-export";

export function ReportsClient({
  categories,
  initialData,
  initialFilters,
}: {
  categories: Category[];
  initialData: PaginatedTransactions;
  initialFilters: TransactionFilters;
}) {
  const { t, locale } = useI18n();
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);
  const [preset, setPreset] = useState<ReportPreset>("month");
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);

  const labels: ReportExportLabels = useMemo(
    () => ({
      title: t("reports.reportTitle"),
      date: t("common.date"),
      category: t("common.category"),
      currency: t("common.currency"),
      amount: t("common.amount"),
      type: t("common.type"),
      notes: t("common.notes"),
      income: t("common.income"),
      expense: t("common.expense"),
      totalIncome: t("statistics.totalIncome"),
      totalExpenses: t("statistics.totalExpenses"),
      net: t("statistics.netChange"),
      transactionsSheet: t("reports.transactionsSheet"),
      summarySheet: t("reports.summarySheet"),
    }),
    [t],
  );

  const updatePreset = (value: ReportPreset) => {
    setPreset(value);
    if (value !== "custom") {
      const range = getReportRange(value);
      setFilters((current) => ({ ...current, from: range.from, to: range.to, page: 1 }));
    }
  };

  const generate = (page = 1) => {
    const nextFilters = { ...filters, page, pageSize: 50 };
    startTransition(async () => {
      const result = await getReportTransactionsAction(nextFilters);
      if (!result.success) {
        toast.error(t(result.error, result.error));
        return;
      }
      setFilters(nextFilters);
      setData(result.data);
    });
  };

  const exportReport = async (format: "pdf" | "excel" | "csv") => {
    setIsExporting(true);
    try {
      const result = await getReportTransactionsAction({
        ...filters,
        page: 1,
        pageSize: format === "pdf" ? 500 : 10000,
      });
      if (!result.success) {
        toast.error(t(result.error, result.error));
        return;
      }

      if (format === "csv") exportReportCsv(result.data.items, locale, labels);
      if (format === "excel") {
        await exportReportExcel(result.data.items, result.data.totals, locale, labels);
      }
      if (format === "pdf") {
        await exportReportPdf(result.data.items, result.data.totals, locale, labels);
      }

      if (result.data.total > result.data.items.length) {
        toast.warning(t("reports.exportLimited"));
      } else {
        toast.success(t("reports.exportComplete"));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <PageHeading title={t("reports.title")} description={t("reports.subtitle")} />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          <Select value={preset} onValueChange={(value) => updatePreset(value as ReportPreset)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t("reports.today")}</SelectItem>
              <SelectItem value="week">{t("reports.thisWeek")}</SelectItem>
              <SelectItem value="month">{t("reports.thisMonth")}</SelectItem>
              <SelectItem value="year">{t("reports.thisYear")}</SelectItem>
              <SelectItem value="custom">{t("reports.customRange")}</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filters.from ?? ""}
            disabled={preset !== "custom"}
            onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
            aria-label={t("common.from")}
          />
          <Input
            type="date"
            value={filters.to ?? ""}
            disabled={preset !== "custom"}
            onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
            aria-label={t("common.to")}
          />

          <div className="relative">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.query ?? ""}
              className="ps-10"
              placeholder={t("transactions.searchPlaceholder")}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
            />
          </div>

          <Select
            value={filters.currency ?? "all"}
            onValueChange={(value) => setFilters((current) => ({ ...current, currency: value as Currency | "all" }))}
          >
            <SelectTrigger><SelectValue placeholder={t("common.currency")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="SYP">SYP</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.type ?? "all"}
            onValueChange={(value) => setFilters((current) => ({ ...current, type: value as TransactionType | "all" }))}
          >
            <SelectTrigger><SelectValue placeholder={t("common.type")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="income">{t("common.income")}</SelectItem>
              <SelectItem value="expense">{t("common.expense")}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.categoryId ?? "all"}
            onValueChange={(value) => setFilters((current) => ({ ...current, categoryId: value }))}
          >
            <SelectTrigger><SelectValue placeholder={t("common.category")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {locale === "ar" ? category.nameAr : category.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => generate(1)} disabled={isPending} className="xl:col-span-1">
            {isPending ? <LoaderCircle className="animate-spin" /> : <FileText />}
            {t("reports.generate")}
          </Button>
        </CardContent>
      </Card>

      <section className="mt-5 grid gap-4 md:grid-cols-2">
        {(["USD", "SYP"] as Currency[]).map((currency) => {
          const total = data.totals.find((item) => item.currency === currency);
          return (
            <Card key={currency}>
              <CardHeader><CardTitle>{currency} · {t("reports.summary")}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><p className="text-muted-foreground">{t("statistics.totalIncome")}</p><p className="mt-1 font-bold text-success">{formatCurrency(total?.totalIncome ?? 0, currency, locale)}</p></div>
                <div><p className="text-muted-foreground">{t("statistics.totalExpenses")}</p><p className="mt-1 font-bold text-destructive">{formatCurrency(total?.totalExpenses ?? 0, currency, locale)}</p></div>
                <div><p className="text-muted-foreground">{t("statistics.netChange")}</p><p className="mt-1 font-bold">{formatCurrency(total?.net ?? 0, currency, locale)}</p></div>
                <div><p className="text-muted-foreground">{t("reports.transactionCount")}</p><p className="mt-1 font-bold">{total?.transactionCount ?? 0}</p></div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="mt-5">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>{t("reports.reportTitle")}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={isExporting || data.total === 0} onClick={() => exportReport("pdf")}>
              <FileText /> {t("reports.pdf")}
            </Button>
            <Button variant="outline" size="sm" disabled={isExporting || data.total === 0} onClick={() => exportReport("excel")}>
              <FileSpreadsheet /> {t("reports.excel")}
            </Button>
            <Button variant="outline" size="sm" disabled={isExporting || data.total === 0} onClick={() => exportReport("csv")}>
              <Download /> {t("reports.csv")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TransactionsTable items={data.items} showActions={false} />
          <div className="mt-5 flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              {t("common.page")} {data.page} {t("common.of")} {data.pageCount}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={isPending || data.page <= 1} onClick={() => generate(data.page - 1)}>{t("common.previous")}</Button>
              <Button variant="outline" disabled={isPending || data.page >= data.pageCount} onClick={() => generate(data.page + 1)}>{t("common.next")}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
