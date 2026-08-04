"use client";

import { Toaster } from "sonner";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/providers/theme-provider";

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster richColors position="top-center" closeButton />
    </ThemeProvider>
  );
}
