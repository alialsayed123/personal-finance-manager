import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { ThemeSync } from "@/components/providers/theme-sync";
import { getCategories, getSettings } from "@/services/finance-service";
import { getAuthenticatedUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getAuthenticatedUser();
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);

  return (
    <I18nProvider initialLocale={settings.language}>
      <ThemeSync initialTheme={settings.theme} />
      <DashboardShell categories={categories} userEmail={user.email}>
        {children}
      </DashboardShell>
    </I18nProvider>
  );
}
