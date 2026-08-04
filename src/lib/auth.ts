import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

export const getAuthenticatedUser = cache(async (): Promise<AuthenticatedUser> => {
  const supabase = await createClient();
const { data } = await supabase.auth.getClaims();
const claims = data?.claims ?? null;

  if (!claims?.sub) {
    redirect("/login");
  }

  const email = typeof claims.email === "string" ? claims.email : null;
  const allowedEmail = process.env.ALLOWED_EMAIL?.trim().toLowerCase();

  if (allowedEmail && email?.toLowerCase() !== allowedEmail) {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }

  return { id: claims.sub, email };
});
