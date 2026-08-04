"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveTransactionAction } from "@/features/transactions/actions";
import { getLocalIsoDate } from "@/lib/utils";
import { transactionSchema, type TransactionInput } from "@/lib/validation/transaction";
import { useUiStore } from "@/stores/ui-store";
import type { Category } from "@/types/finance";

const DEFAULT_VALUES: TransactionInput = {
  type: "expense",
  currency: "USD",
  categoryId: "",
  amount: 0,
  occurredAt: getLocalIsoDate(),
  notes: "",
};

export function QuickAddDialog({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [isPending, startTransition] = useTransition();
  const { isQuickAddOpen, editingTransaction, closeQuickAdd } = useUiStore();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const transactionType = watch("type");
  const currency = watch("currency");
  const categoryId = watch("categoryId");
  const availableCategories = useMemo(
    () => categories.filter((category) => category.type === transactionType),
    [categories, transactionType],
  );

  useEffect(() => {
    if (!isQuickAddOpen) return;

    if (editingTransaction) {
      reset({
        id: editingTransaction.id,
        type: editingTransaction.type,
        currency: editingTransaction.currency,
        categoryId: editingTransaction.categoryId,
        amount: editingTransaction.amount,
        occurredAt: editingTransaction.occurredAt,
        notes: editingTransaction.notes ?? "",
      });
      return;
    }

    const firstExpenseCategory = categories.find((category) => category.type === "expense");
    reset({
      ...DEFAULT_VALUES,
      occurredAt: getLocalIsoDate(),
      categoryId: firstExpenseCategory?.id ?? "",
    });
  }, [categories, editingTransaction, isQuickAddOpen, reset]);

  useEffect(() => {
    const currentCategory = categories.find((category) => category.id === categoryId);
    if (currentCategory?.type === transactionType) return;

    const firstCategory = availableCategories[0];
    setValue("categoryId", firstCategory?.id ?? "", { shouldValidate: true });
  }, [availableCategories, categories, categoryId, setValue, transactionType]);

  const onSubmit = (values: TransactionInput) => {
    startTransition(async () => {
      const result = await saveTransactionAction(values);
      if (!result.success) {
        toast.error(t(result.error, result.error));
        return;
      }

      toast.success(t(result.message ?? "common.success"));
      closeQuickAdd();
      router.refresh();
    });
  };

  return (
    <Dialog open={isQuickAddOpen} onOpenChange={(open) => !open && closeQuickAdd()}>
      <DialogContent closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>
            {t(editingTransaction ? "transactions.editTransaction" : "transactions.addTransaction")}
          </DialogTitle>
          <DialogDescription>{t("dashboard.subtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("transactions.transactionType")}</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("transactions.selectType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">{t("common.income")}</SelectItem>
                      <SelectItem value="expense">{t("common.expense")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("common.currency")}</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("transactions.selectCurrency")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="SYP">SYP</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("common.category")}</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("transactions.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {locale === "ar" ? category.nameAr : category.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId ? (
              <p className="text-xs text-destructive">{t("validation.required")}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">{t("common.amount")}</Label>
              <Input
                id="amount"
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

            <div className="space-y-2">
              <Label htmlFor="occurredAt">{t("common.date")}</Label>
              <Input id="occurredAt" type="date" {...register("occurredAt")} />
              {errors.occurredAt ? (
                <p className="text-xs text-destructive">{t("validation.invalidDate")}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              {t("common.notes")} ({t("common.optional")})
            </Label>
            <Textarea
              id="notes"
              placeholder={t("transactions.notesPlaceholder")}
              maxLength={500}
              {...register("notes")}
            />
            {errors.notes ? (
              <p className="text-xs text-destructive">{t("validation.notesMax")}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeQuickAdd} disabled={isPending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending || availableCategories.length === 0}>
              {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
              {isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
