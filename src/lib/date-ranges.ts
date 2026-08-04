import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from "date-fns";

import { getAppReferenceDate } from "@/lib/utils";

export type StatisticsPeriod = "daily" | "weekly" | "monthly" | "yearly";
export type ReportPreset = "today" | "week" | "month" | "year" | "custom";

function isoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getStatisticsRange(
  period: StatisticsPeriod,
  referenceDate = getAppReferenceDate(),
): { from: string; to: string } {
  switch (period) {
    case "daily":
      return {
        from: isoDate(startOfDay(referenceDate)),
        to: isoDate(endOfDay(referenceDate)),
      };
    case "weekly":
      return {
        from: isoDate(startOfWeek(referenceDate, { weekStartsOn: 1 })),
        to: isoDate(endOfWeek(referenceDate, { weekStartsOn: 1 })),
      };
    case "yearly":
      return {
        from: isoDate(startOfYear(referenceDate)),
        to: isoDate(endOfYear(referenceDate)),
      };
    case "monthly":
    default:
      return {
        from: isoDate(startOfMonth(referenceDate)),
        to: isoDate(endOfMonth(referenceDate)),
      };
  }
}

export function getReportRange(
  preset: ReportPreset,
  referenceDate = getAppReferenceDate(),
): { from: string; to: string } {
  if (preset === "today") {
    return getStatisticsRange("daily", referenceDate);
  }

  if (preset === "week") {
    return getStatisticsRange("weekly", referenceDate);
  }

  if (preset === "year") {
    return getStatisticsRange("yearly", referenceDate);
  }

  if (preset === "custom") {
    return {
      from: isoDate(subDays(referenceDate, 30)),
      to: isoDate(referenceDate),
    };
  }

  return getStatisticsRange("monthly", referenceDate);
}
