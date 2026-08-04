import { LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const dictionary = getDictionary("en");
  const forcedErrorKey = params.error === "unauthorized" ? "auth.unauthorizedEmail" : undefined;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.18),transparent_35%),radial-gradient(circle_at_80%_80%,hsl(var(--success)/0.14),transparent_30%)]" />

      <Card className="w-full max-w-md border-white/20">
        <CardHeader className="items-center gap-4 pb-3 text-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20">
            <WalletCards className="size-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{dictionary.auth.title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {dictionary.auth.subtitle}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <LoginForm dictionary={dictionary} forcedErrorKey={forcedErrorKey} />
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-4 text-success" />
            {dictionary.auth.privateNotice}
            <LockKeyhole className="size-3.5" />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
