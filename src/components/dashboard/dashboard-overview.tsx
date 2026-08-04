"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CalendarRange,
  CircleDollarSign,
  Landmark,
  Target,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { CategoryIcon } from "@/components/category-icon";
import { PageHeading } from "@/components/layout/page-heading";
import { useI18n } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { clampPercentage, formatCurrency, formatDate } from "@/lib/utils";
import type { Currency, CurrencySummary, TransactionWithCategory } from "@/types/finance";

function findSummary(summary: CurrencySummary[], currency: Currency): CurrencySummary {
  return (
    summary.find((item) => item.currency === currency) ?? {
      currency,
      balance: 0,
      todayExpenses: 0,
      weeklyExpenses: 0,
      monthlyExpenses: 0,
      budgetAmount: 0,
      remainingBudget: 0,
      budgetPercentage: 0,
    }
  );
}

function BalanceCard({ item, title, icon: Icon }: { item: CurrencySummary; title: string; icon: typeof Wallet }) {
  const { locale } = useI18n();
  const isNegative = item.balance < 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="relative p-5">
        <div className="absolute -end-5 -top-5 size-24 rounded-full bg-primary/8" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-3 text-2xl font-bold tracking-tight">
              {formatCurrency(item.balance, item.currency, locale)}
            </p>
          </div>
          <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          {isNegative ? (
            <ArrowDownRight className="size-4 text-destructive" />
          ) : (
            <ArrowUpRight className="size-4 text-success" />
          )}
          {item.currency}
        </div>
      </CardContent>
    </Card>
  );
}

function DualCurrencyCard({
  title,
  icon: Icon,
  usd,
  syp,
  valueKey,
}: {
  title: string;
  icon: typeof CalendarDays;
  usd: CurrencySummary;
  syp: CurrencySummary;
  valueKey: "todayExpenses" | "weeklyExpenses" | "monthlyExpenses" | "remainingBudget";
}) {
  const { locale } = useI18n();

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground">
            <Icon className="size-5" />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {[
            { item: usd, label: "USD" },
            { item: syp, label: "SYP" },
          ].map(({ item, label }) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <Badge variant="outline">{label}</Badge>
              <span className="font-semibold">
                {formatCurrency(item[valueKey], item.currency, locale)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetStatus({ item }: { item: CurrencySummary }) {
  const { t, locale } = useI18n();
  const percentage = item.budgetPercentage;
  const status = percentage >= 100 ? "danger" : percentage >= 80 ? "warning" : "healthy";

  return (
    <div className="rounded-2xl border border-border/70 bg-background/55 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{item.currency}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.budgetAmount > 0
              ? `${formatCurrency(item.monthlyExpenses, item.currency, locale)} / ${formatCurrency(item.budgetAmount, item.currency, locale)}`
              : t("dashboard.budgetNotSet")}
          </p>
        </div>
        <Badge variant={status === "danger" ? "destructive" : status === "warning" ? "warning" : "success"}>
          {item.budgetAmount > 0 ? `${percentage.toFixed(0)}%` : "-"}
        </Badge>
      </div>
      <Progress
        value={clampPercentage(percentage)}
        className="mt-4"
        indicatorClassName={
          status === "danger" ? "bg-destructive" : status === "warning" ? "bg-warning" : "bg-success"
        }
      />
    </div>
  );
}

export function DashboardOverview({
  summary,
  recentTransactions,
}: {
  summary: CurrencySummary[];
  recentTransactions: TransactionWithCategory[];
}) {
  const { t, locale } = useI18n();
  const usd = findSummary(summary, "USD");
  const syp = findSummary(summary, "SYP");

  return (
    <>
      <PageHeading title={t("dashboard.title")} description={t("dashboard.subtitle")} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label={t("dashboard.title")}>
        <BalanceCard item={usd} title={t("dashboard.currentUsdBalance")} icon={CircleDollarSign} />
        <BalanceCard item={syp} title={t("dashboard.currentSypBalance")} icon={Landmark} />
        <DualCurrencyCard
          title={t("dashboard.todayExpenses")}
          icon={CalendarDays}
          usd={usd}
          syp={syp}
          valueKey="todayExpenses"
        />
        <DualCurrencyCard
          title={t("dashboard.weeklyExpenses")}
          icon={CalendarRange}
          usd={usd}
          syp={syp}
          valueKey="weeklyExpenses"
        />
        <DualCurrencyCard
          title={t("dashboard.monthlyExpenses")}
          icon={Wallet}
          usd={usd}
          syp={syp}
          valueKey="monthlyExpenses"
        />
        <DualCurrencyCard
          title={t("dashboard.remainingBudget")}
          icon={Target}
          usd={usd}
          syp={syp}
          valueKey="remainingBudget"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <CardTitle>{t("dashboard.recentTransactions")}</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/transactions">{t("dashboard.viewAll")}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                {t("dashboard.noRecentTransactions")}
              </div>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((transaction) => {
                  const categoryName =
                    locale === "ar" ? transaction.categoryNameAr : transaction.categoryNameEn;
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-muted/45 sm:px-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="grid size-10 shrink-0 place-items-center rounded-xl text-white"
                          style={{ backgroundColor: transaction.categoryColor }}
                        >
                          <CategoryIcon name={transaction.categoryIcon} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{categoryName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatDate(transaction.occurredAt, locale)}
                            {transaction.notes ? ` · ${transaction.notes}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-end">
                        <p
                          className={
                            transaction.type === "income"
                              ? "font-semibold text-success"
                              : "font-semibold text-destructive"
                          }
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount, transaction.currency, locale)}
                        </p>
                        <p className="text-xs text-muted-foreground">{transaction.currency}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.spendingOverview")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BudgetStatus item={usd} />
            <BudgetStatus item={syp} />
          </CardContent>
        </Card>
      </section>
    </>
  );
}
