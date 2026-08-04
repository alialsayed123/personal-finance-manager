import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

const PUBLIC_PATHS = ["/login", "/auth/callback"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  const supabase = createServerClient<Database>(
    url,
    publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(name, value, options);
            },
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const claims = error ? null : data?.claims ?? null;

  const pathname = request.nextUrl.pathname;
  const publicPath = isPublicPath(pathname);
  const isAuthenticated = Boolean(claims?.sub);

  const allowedEmail = process.env.ALLOWED_EMAIL
    ?.trim()
    .toLowerCase();

  const claimEmail =
    typeof claims?.email === "string"
      ? claims.email.trim().toLowerCase()
      : null;

  const isAllowedUser =
    !allowedEmail || claimEmail === allowedEmail;

  if (!isAuthenticated && !publicPath) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );

    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && !isAllowedUser) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("error", "unauthorized");

    return NextResponse.redirect(loginUrl);
  }

  if (
    isAuthenticated &&
    isAllowedUser &&
    pathname === "/login"
  ) {
    const dashboardUrl = request.nextUrl.clone();

    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";

    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}
