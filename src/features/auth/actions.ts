"use server";

import { redirect } from "next/navigation";

import { loginSchema } from "@/lib/validation/auth";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  errorKey?: string;
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errorKey: "auth.invalidCredentials" };
  }

  const allowedEmail = process.env.ALLOWED_EMAIL?.trim().toLowerCase();
  if (allowedEmail && parsed.data.email.toLowerCase() !== allowedEmail) {
    return { errorKey: "auth.unauthorizedEmail" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { errorKey: "auth.invalidCredentials" };
  }

  await supabase.rpc("ensure_user_defaults", {});
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
