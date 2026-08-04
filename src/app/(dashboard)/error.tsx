"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="flex flex-col items-center p-10 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </div>
        <h2 className="mt-5 text-xl font-bold">{t("common.error")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("common.errorDescription")}</p>
        <Button className="mt-6" onClick={reset}>
          <RotateCcw /> {t("common.reset")}
        </Button>
      </CardContent>
    </Card>
  );
}
