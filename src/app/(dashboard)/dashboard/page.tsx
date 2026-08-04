import type { Metadata } from "next";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getDashboardSummary, getRecentTransactions } from "@/services/finance-service";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const [summary, recentTransactions] = await Promise.all([
    getDashboardSummary(),
    getRecentTransactions(6),
  ]);

  return <DashboardOverview summary={summary} recentTransactions={recentTransactions} />;
}
