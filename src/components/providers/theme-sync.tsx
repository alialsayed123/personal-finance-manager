"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

import type { AppTheme } from "@/types/finance";

export function ThemeSync({ initialTheme }: { initialTheme: AppTheme }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(initialTheme);
  }, [initialTheme, setTheme]);

  return null;
}
