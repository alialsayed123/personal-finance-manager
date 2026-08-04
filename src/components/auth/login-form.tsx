"use client";

import { LoaderCircle, LogIn } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type LoginState } from "@/features/auth/actions";
import { translate, type Dictionary } from "@/lib/i18n";

const initialState: LoginState = {};

export function LoginForm({
  dictionary,
  forcedErrorKey,
}: {
  dictionary: Dictionary;
  forcedErrorKey?: string;
}) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const errorKey = forcedErrorKey ?? state.errorKey;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{dictionary.auth.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{dictionary.auth.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          required
        />
      </div>

      {errorKey ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {translate(dictionary, errorKey, dictionary.auth.genericError)}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? <LoaderCircle className="animate-spin" /> : <LogIn />}
        {isPending ? dictionary.auth.signingIn : dictionary.auth.signIn}
      </Button>
    </form>
  );
}
