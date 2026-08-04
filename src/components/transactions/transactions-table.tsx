"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { CategoryIcon } from "@/components/category-icon";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteTransactionAction } from "@/features/transactions/actions";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import type { TransactionWithCategory } from "@/types/finance";

export function TransactionsTable({
  items,
  showActions = true,
}: {
  items: TransactionWithCategory[];
  showActions?: boolean;
}) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { openQuickAdd } = useUiStore();
  const [deleting, setDeleting] = useState<TransactionWithCategory | null>(null);
  const [isPending, startTransition] = useTransition();

  const confirmDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteTransactionAction(deleting.id);
      if (!result.success) {
        toast.error(t(result.error, result.error));
        return;
      }
      toast.success(t(result.message ?? "common.success"));
      setDeleting(null);
      router.refresh();
    });
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {t("transactions.noTransactions")}
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-card/70 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.date")}</TableHead>
              <TableHead>{t("common.category")}</TableHead>
              <TableHead>{t("common.currency")}</TableHead>
              <TableHead>{t("common.amount")}</TableHead>
              <TableHead>{t("common.type")}</TableHead>
              <TableHead>{t("common.notes")}</TableHead>
              {showActions ? (
                <TableHead className="w-16 text-end">{t("common.actions")}</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="whitespace-nowrap font-medium">
                  {formatDate(transaction.occurredAt, locale)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid size-9 place-items-center rounded-xl text-white"
                      style={{ backgroundColor: transaction.categoryColor }}
                    >
                      <CategoryIcon name={transaction.categoryIcon} />
                    </span>
                    <span className="font-medium">
                      {locale === "ar" ? transaction.categoryNameAr : transaction.categoryNameEn}
                    </span>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline">{transaction.currency}</Badge></TableCell>
                <TableCell
                  className={cn(
                    "whitespace-nowrap font-semibold",
                    transaction.type === "income" ? "text-success" : "text-destructive",
                  )}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount, transaction.currency, locale)}
                </TableCell>
                <TableCell>
                  <Badge variant={transaction.type === "income" ? "success" : "secondary"}>
                    {t(`common.${transaction.type}`)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-64 truncate text-muted-foreground">
                  {transaction.notes || "-"}
                </TableCell>
                {showActions ? (
                  <TableCell className="text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={t("common.actions")}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openQuickAdd(transaction)}>
                          <Pencil /> {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setDeleting(transaction)}
                        >
                          <Trash2 /> {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {items.map((transaction) => (
          <div key={transaction.id} className="glass-panel rounded-2xl border border-border/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl text-white"
                  style={{ backgroundColor: transaction.categoryColor }}
                >
                  <CategoryIcon name={transaction.categoryIcon} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {locale === "ar" ? transaction.categoryNameAr : transaction.categoryNameEn}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(transaction.occurredAt, locale)} · {transaction.currency}
                  </p>
                </div>
              </div>
              {showActions ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={t("common.actions")}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => openQuickAdd(transaction)}>
                      <Pencil /> {t("common.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={() => setDeleting(transaction)}
                    >
                      <Trash2 /> {t("common.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
            <div className="mt-4 flex items-end justify-between gap-3 border-t border-border/70 pt-3">
              <p className="line-clamp-2 text-xs text-muted-foreground">{transaction.notes || "-"}</p>
              <p className={cn("shrink-0 font-bold", transaction.type === "income" ? "text-success" : "text-destructive")}>
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(transaction.amount, transaction.currency, locale)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={showActions && Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("transactions.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("transactions.deleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={confirmDelete}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
