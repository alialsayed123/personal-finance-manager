"use client";

import { AlertTriangle, CheckCircle2, CircleDollarSign, Landmark } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { BudgetFormDialog } from "@/components/budgets/budget-form-dialog";
import { PageHeading } from "@/components/layout/page-heading";
import { useI18n } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { clampPercentage, formatCurrency } from "@/lib/utils";
import type { Budget, Currency } from "@/types/finance";

export function BudgetsClient({
  month,
  budgets,
  spent,
}: {
  month: string;
  budgets: Budget[];
  spent: Record<Currency, number>;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const changeMonth = (value: string) => {
    const params = new URLSearchParams();
    if (value) params.set("month", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      <PageHeading
        title={t("budgets.title")}
        description={t("budgets.subtitle")}
        actions={
          <Input
            type="month"
            className="w-44"
            value={month.slice(0, 7)}
            onChange={(event) => changeMonth(event.target.value)}
            aria-label={t("common.month")}
          />
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {(["USD", "SYP"] as Currency[]).map((currency) => {
          const budgetAmount = budgets.find((budget) => budget.currency === currency)?.amount ?? 0;
          const spentAmount = spent[currency];
          const remaining = budgetAmount - spentAmount;
          const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
          const status = percentage >= 100 ? "danger" : percentage >= 80 ? "warning" : "healthy";
          const Icon = currency === "USD" ? CircleDollarSign : Landmark;
          const StatusIcon = status === "healthy" ? CheckCircle2 : AlertTriangle;

          return (
            <Card key={currency} className="overflow-hidden">
              <CardHeader className="flex-row items-center justify-between gap-4 bg-muted/25">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <CardTitle>{currency} {t("budgets.monthlyBudget")}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">{month.slice(0, 7)}</p>
                  </div>
                </div>
                <BudgetFormDialog currency={currency} month={month} currentAmount={budgetAmount} />
              </CardHeader>
              <CardContent className="space-y-6 p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">{t("budgets.spent")}</p>
                    <p className="mt-2 text-lg font-bold text-destructive">
                      {formatCurrency(spentAmount, currency, locale)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">{t("budgets.remaining")}</p>
                    <p className={`mt-2 text-lg font-bold ${remaining < 0 ? "text-destructive" : "text-success"}`}>
                      {budgetAmount > 0 ? formatCurrency(remaining, currency, locale) : "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{t("budgets.usage")}</span>
                    <Badge variant={status === "danger" ? "destructive" : status === "warning" ? "warning" : "success"}>
                      {budgetAmount > 0 ? `${percentage.toFixed(1)}%` : "-"}
                    </Badge>
                  </div>
                  <Progress
                    value={clampPercentage(percentage)}
                    indicatorClassName={
                      status === "danger" ? "bg-destructive" : status === "warning" ? "bg-warning" : "bg-success"
                    }
                  />
                </div>

                <div className={`flex items-start gap-3 rounded-xl p-3 text-sm ${status === "danger" ? "bg-destructive/10 text-destructive" : status === "warning" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>
                  <StatusIcon className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {budgetAmount <= 0
                      ? t("budgets.notSet")
                      : t(`budgets.${status}`)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
