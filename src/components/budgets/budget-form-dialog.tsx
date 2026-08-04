"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertBudgetAction } from "@/features/budgets/actions";
import { budgetSchema, type BudgetInput } from "@/lib/validation/budget";
import type { Currency } from "@/types/finance";

export function BudgetFormDialog({
  currency,
  month,
  currentAmount,
}: {
  currency: Currency;
  month: string;
  currentAmount: number;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { currency, month, amount: currentAmount || 0 },
  });

  useEffect(() => {
    reset({ currency, month, amount: currentAmount || 0 });
  }, [currency, currentAmount, month, reset]);

  const onSubmit = (values: BudgetInput) => {
    startTransition(async () => {
      const result = await upsertBudgetAction(values);
      if (!result.success) {
        toast.error(t(result.error, result.error));
        return;
      }
      toast.success(t(result.message ?? "common.success"));
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={currentAmount > 0 ? "outline" : "default"}>
          {t(currentAmount > 0 ? "budgets.updateBudget" : "budgets.setBudget")}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>{t(currentAmount > 0 ? "budgets.updateBudget" : "budgets.setBudget")}</DialogTitle>
          <DialogDescription>{currency}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("currency")} />
          <input type="hidden" {...register("month")} />
          <div className="space-y-2">
            <Label htmlFor={`budget-${currency}`}>{t("budgets.monthlyBudget")}</Label>
            <Input
              id={`budget-${currency}`}
              type="number"
              inputMode="decimal"
              min="0"
              step={currency === "SYP" ? "1" : "0.01"}
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount ? (
              <p className="text-xs text-destructive">{t("validation.amountPositive")}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
              {isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
