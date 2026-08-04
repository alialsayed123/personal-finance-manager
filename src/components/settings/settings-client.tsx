"use client";

import { Languages, LoaderCircle, LockKeyhole, Monitor, Moon, Save, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageHeading } from "@/components/layout/page-heading";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSettingsAction } from "@/features/settings/actions";
import { cn } from "@/lib/utils";
import type { AppLanguage, AppTheme, UserSettings } from "@/types/finance";

const THEME_OPTIONS: Array<{ value: AppTheme; labelKey: string; icon: typeof Sun }> = [
  { value: "light", labelKey: "settings.light", icon: Sun },
  { value: "dark", labelKey: "settings.dark", icon: Moon },
  { value: "system", labelKey: "settings.system", icon: Monitor },
];

export function SettingsClient({ settings, email }: { settings: UserSettings; email: string | null }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { t, setLocale } = useI18n();
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(settings.theme);
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(settings.language);
  const [isPending, startTransition] = useTransition();

  const selectTheme = (theme: AppTheme) => {
    setSelectedTheme(theme);
    setTheme(theme);
  };

  const selectLanguage = (language: AppLanguage) => {
    setSelectedLanguage(language);
    setLocale(language);
  };

  const save = () => {
    startTransition(async () => {
      const result = await updateSettingsAction({
        theme: selectedTheme,
        language: selectedLanguage,
      });
      if (!result.success) {
        toast.error(t(result.error, result.error));
        return;
      }
      toast.success(t(result.message ?? "common.success"));
      router.refresh();
    });
  };

  return (
    <>
      <PageHeading title={t("settings.title")} description={t("settings.subtitle")} />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sun className="size-5" /> {t("settings.appearance")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm font-medium">{t("settings.theme")}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = selectedTheme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => selectTheme(option.value)}
                      className={cn(
                        "focus-ring flex flex-col items-center gap-3 rounded-2xl border p-5 text-sm font-semibold transition-all",
                        selected
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border bg-background/50 hover:bg-muted/50",
                      )}
                    >
                      <Icon className="size-6" />
                      {t(option.labelKey)}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Languages className="size-5" /> {t("settings.language")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["en", "ar"] as AppLanguage[]).map((language) => {
                  const selected = selectedLanguage === language;
                  return (
                    <button
                      key={language}
                      type="button"
                      onClick={() => selectLanguage(language)}
                      className={cn(
                        "focus-ring rounded-2xl border p-5 text-start transition-all",
                        selected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border bg-background/50 hover:bg-muted/50",
                      )}
                    >
                      <p className="font-semibold">{t(language === "en" ? "settings.english" : "settings.arabic")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t(language === "en" ? "settings.englishNative" : "settings.arabicNative")}</p>
                    </button>
                  );
                })}
              </div>
              <Button className="mt-5" onClick={save} disabled={isPending}>
                {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
                {isPending ? t("common.saving") : t("common.save")}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t("settings.account")}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("settings.signedInAs")}</p>
              <p className="mt-2 break-all font-semibold" dir="ltr">{email ?? "-"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LockKeyhole className="size-5" /> {t("settings.security")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{t("settings.securityDescription")}</p>
              <div className="mt-4 rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-sm font-medium text-success">
                {t("settings.privateProtected")}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
