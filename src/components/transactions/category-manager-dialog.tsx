"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  DialogTrigger,
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
import { createCategoryAction, deleteCategoryAction } from "@/features/categories/actions";
import { categorySchema, type CategoryInput } from "@/lib/validation/category";
import type { Category } from "@/types/finance";

const DEFAULT_VALUES: CategoryInput = {
  type: "expense",
  nameEn: "",
  nameAr: "",
  icon: "CircleDollarSign",
  color: "#64748b",
};

export function CategoryManagerDialog({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: DEFAULT_VALUES,
  });

  const customCategories = categories.filter((category) => !category.isDefault);

  const onSubmit = (values: CategoryInput) => {
    startTransition(async () => {
      const result = await createCategoryAction(values);
      if (!result.success) {
        toast.error(t(result.error, result.error));
        return;
      }
      toast.success(t(result.message ?? "common.success"));
      reset(DEFAULT_VALUES);
      router.refresh();
    });
  };

  const removeCategory = (id: string) => {
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (!result.success) {
        toast.error(t(result.error, result.error));
        return;
      }
      toast.success(t(result.message ?? "common.success"));
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t("transactions.manageCategories")}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl" closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>{t("transactions.manageCategories")}</DialogTitle>
          <DialogDescription>{t("transactions.customCategories")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-2xl bg-muted/35 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("common.type")}</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">{t("common.expense")}</SelectItem>
                    <SelectItem value="income">{t("common.income")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">{t("common.color")}</Label>
            <Input id="color" type="color" className="p-1" {...register("color")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nameEn">{t("common.nameEnglish")}</Label>
            <Input id="nameEn" maxLength={60} {...register("nameEn")} />
            {errors.nameEn ? <p className="text-xs text-destructive">{t("validation.required")}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nameAr">{t("common.nameArabic")}</Label>
            <Input id="nameAr" dir="rtl" maxLength={60} {...register("nameAr")} />
            {errors.nameAr ? <p className="text-xs text-destructive">{t("validation.required")}</p> : null}
          </div>
          <input type="hidden" {...register("icon")} />
          <Button type="submit" className="md:col-span-2" disabled={isPending}>
            {isPending ? <LoaderCircle className="animate-spin" /> : <Plus />}
            {t("transactions.addCategory")}
          </Button>
        </form>

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {customCategories.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("common.noData")}
            </p>
          ) : (
            customCategories.map((category) => (
              <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl border bg-background/60 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {locale === "ar" ? category.nameAr : category.nameEn}
                    </p>
                    <p className="text-xs text-muted-foreground">{t(`common.${category.type}`)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isPending}
                  onClick={() => removeCategory(category.id)}
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
