import type { Metadata } from "next";

import { StatisticsClient } from "@/components/statistics/statistics-client";
import { getStatistics } from "@/services/finance-service";
import { getStatisticsRange } from "@/lib/date-ranges";

export const metadata: Metadata = {
  title: "Statistics",
};

export default async function StatisticsPage() {
  const range = getStatisticsRange("monthly");
  const initialData = await getStatistics("USD", range.from, range.to);
  return <StatisticsClient initialData={initialData} />;
}
