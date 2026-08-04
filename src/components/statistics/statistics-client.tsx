"use client";

import dynamic from "next/dynamic";
import { ArrowDownRight, ArrowUpRight, Equal, LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageHeading } from "@/components/layout/page-heading";
import { useI18n } from "@/components/providers/i18n-provider";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStatisticsAction } from "@/features/finance/actions";
import { getStatisticsRange, type StatisticsPeriod } from "@/lib/date-ranges";
import { cn, formatCurrency } from "@/lib/utils";
import type { Currency, StatisticsData } from "@/types/finance";

const StatisticsCharts = dynamic(() => import("@/components/statistics/statistics-charts"), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse rounded-2xl bg-muted" />,
});

export function StatisticsClient({ initialData }: { initialData: StatisticsData }) {
  const { t, locale } = useI18n();
  const [data, setData] = useState(initialData);
  const [currency, setCurrency] = useState<Currency>(initialData.currency);
  const [period, setPeriod] = useState<StatisticsPeriod>("monthly");
  const [isPending, startTransition] = useTransition();

  const load = (nextCurrency: Currency, nextPeriod: StatisticsPeriod) => {
    setCurrency(nextCurrency);
    setPeriod(nextPeriod);
    const range = getStatisticsRange(nextPeriod);
    startTransition(async () => {
      const result = await getStatisticsAction({
        currency: nextCurrency,
        from: range.from,
        to: range.to,
      });
      if (!result.success) {
        toast.error(t(result.error, result.error));
        return;
      }
      setData(result.data);
    });
  };

  const summaryCards = [
    {
      key: "income",
      label: t("statistics.totalIncome"),
      value: data.totalIncome,
      icon: ArrowUpRight,
      className: "text-success",
    },
    {
      key: "expenses",
      label: t("statistics.totalExpenses"),
      value: data.totalExpenses,
      icon: ArrowDownRight,
      className: "text-destructive",
    },
    {
      key: "net",
      label: t("statistics.netChange"),
      value: data.net,
      icon: Equal,
      className: data.net >= 0 ? "text-success" : "text-destructive",
    },
  ];

  return (
    <>
      <PageHeading
        title={t("statistics.title")}
        description={t("statistics.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            {isPending ? <LoaderCircle className="size-5 animate-spin text-primary" /> : null}
            <Select value={currency} onValueChange={(value) => load(value as Currency, period)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="SYP">SYP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Tabs value={period} onValueChange={(value) => load(currency, value as StatisticsPeriod)}>
        <TabsList className="grid w-full grid-cols-4 sm:w-auto">
          <TabsTrigger value="daily">{t("statistics.daily")}</TabsTrigger>
          <TabsTrigger value="weekly">{t("statistics.weekly")}</TabsTrigger>
          <TabsTrigger value="monthly">{t("statistics.monthly")}</TabsTrigger>
          <TabsTrigger value="yearly">{t("statistics.yearly")}</TabsTrigger>
        </TabsList>
      </Tabs>

      <section className={cn("mt-5 grid gap-4 md:grid-cols-3", isPending && "opacity-65")}>
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className={cn("mt-2 text-2xl font-bold", card.className)}>
                    {formatCurrency(card.value, data.currency, locale)}
                  </p>
                </div>
                <Icon className={cn("size-7", card.className)} />
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className={cn("mt-6 transition-opacity", isPending && "pointer-events-none opacity-50")}>
        <StatisticsCharts data={data} />
      </div>
    </>
  );
}
