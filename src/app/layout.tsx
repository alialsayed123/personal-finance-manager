import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { RootProviders } from "@/components/providers/root-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Personal Finance Manager",
    template: "%s | Personal Finance Manager",
  },
  description: "A private personal finance dashboard for independent USD and SYP tracking.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
