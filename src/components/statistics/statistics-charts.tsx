"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useI18n } from "@/components/providers/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { StatisticsData } from "@/types/finance";

function EmptyChart() {
  const { t } = useI18n();
  return (
    <div className="grid h-72 place-items-center rounded-xl border border-dashed text-sm text-muted-foreground">
      {t("statistics.noChartData")}
    </div>
  );
}

export default function StatisticsCharts({ data }: { data: StatisticsData }) {
  const { t, locale } = useI18n();
  const hasDistribution = data.categoryDistribution.some((item) => item.total > 0);
  const hasMonthly = data.monthlyExpenses.some((item) => item.total > 0);
  const hasBalance = data.balanceHistory.length > 0;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>{t("statistics.categoryDistribution")}</CardTitle></CardHeader>
        <CardContent>
          {hasDistribution ? (
            <div className="h-80" role="img" aria-label={t("statistics.categoryDistribution")}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryDistribution}
                    dataKey="total"
                    nameKey={locale === "ar" ? "nameAr" : "nameEn"}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {data.categoryDistribution.map((item) => (
                      <Cell key={item.categoryId} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value), data.currency, locale)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("statistics.monthlyExpenses")}</CardTitle></CardHeader>
        <CardContent>
          {hasMonthly ? (
            <div className="h-80" role="img" aria-label={t("statistics.monthlyExpenses")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyExpenses} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(value) =>
                      formatDate(value, locale, { month: "short", year: "2-digit" })
                    }
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tickLine={false} axisLine={false} width={64} />
                  <Tooltip
                    labelFormatter={(value) =>
                      formatDate(String(value), locale, { month: "long", year: "numeric" })
                    }
                    formatter={(value) => formatCurrency(Number(value), data.currency, locale)}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart />}
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader><CardTitle>{t("statistics.balanceHistory")}</CardTitle></CardHeader>
        <CardContent>
          {hasBalance ? (
            <div className="h-80" role="img" aria-label={t("statistics.balanceHistory")}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.balanceHistory} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      formatDate(value, locale, { month: "short", day: "numeric" })
                    }
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis tickLine={false} axisLine={false} width={72} />
                  <Tooltip
                    labelFormatter={(value) => formatDate(String(value), locale)}
                    formatter={(value) => formatCurrency(Number(value), data.currency, locale)}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart />}
        </CardContent>
      </Card>
    </div>
  );
}
