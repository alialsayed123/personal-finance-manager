"use client";

import {
  BarChart3,
  FileSpreadsheet,
  Gauge,
  Menu,
  Moon,
  Plus,
  ReceiptText,
  Settings,
  Sun,
  Target,
  WalletCards,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { QuickAddDialog } from "@/components/transactions/quick-add-dialog";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import type { Category } from "@/types/finance";
import { useI18n } from "@/components/providers/i18n-provider";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: Gauge },
  { href: "/transactions", labelKey: "nav.transactions", icon: ReceiptText },
  { href: "/statistics", labelKey: "nav.statistics", icon: BarChart3 },
  { href: "/budgets", labelKey: "nav.budgets", icon: Target },
  { href: "/reports", labelKey: "nav.reports", icon: FileSpreadsheet },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
] as const;

function SidebarContent({ userEmail, onNavigate }: { userEmail: string | null; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <WalletCards className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold">{t("app.name")}</p>
          <p className="truncate text-xs text-muted-foreground">{t("app.tagline")}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label={t("nav.primaryNavigation")}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "focus-ring flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/70 p-4">
        <div className="mb-3 min-w-0 rounded-xl bg-muted/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">{t("settings.signedInAs")}</p>
          <p className="truncate text-sm font-medium">{userEmail ?? "-"}</p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" className="w-full justify-start">
            {t("nav.logout")}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function DashboardShell({
  children,
  categories,
  userEmail,
}: {
  children: ReactNode;
  categories: Category[];
  userEmail: string | null;
}) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const {
    isMobileNavOpen,
    openMobileNav,
    closeMobileNav,
    openQuickAdd,
  } = useUiStore();
  const currentItem = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <div className="min-h-screen">
      <aside className="glass-panel fixed inset-y-0 start-0 z-40 hidden w-72 border-e border-border/70 lg:block">
        <SidebarContent userEmail={userEmail} />
      </aside>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t("nav.closeMenu")}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={closeMobileNav}
          />
          <aside className="glass-panel absolute inset-y-0 start-0 w-[min(85vw,19rem)] border-e border-border shadow-2xl">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute end-3 top-3 z-10"
              onClick={closeMobileNav}
              aria-label={t("nav.closeMenu")}
            >
              <X />
            </Button>
            <SidebarContent userEmail={userEmail} onNavigate={closeMobileNav} />
          </aside>
        </div>
      ) : null}

      <div className="min-h-screen lg:ps-72">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={openMobileNav}
                aria-label={t("nav.openMenu")}
              >
                <Menu />
              </Button>
              <h1 className="truncate text-lg font-bold sm:text-xl">
                {currentItem ? t(currentItem.labelKey) : t("app.name")}
              </h1>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label={t("settings.theme")}
            >
              {resolvedTheme === "dark" ? <Sun /> : <Moon />}
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <Button
        type="button"
        size="lg"
        className="fixed bottom-5 end-5 z-40 h-14 rounded-2xl px-5 shadow-2xl shadow-primary/30 sm:bottom-7 sm:end-7"
        onClick={() => openQuickAdd()}
      >
        <Plus className="size-5" />
        <span className="hidden sm:inline">{t("transactions.addTransaction")}</span>
      </Button>

      <QuickAddDialog categories={categories} />
    </div>
  );
}
