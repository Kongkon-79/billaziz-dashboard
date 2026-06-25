"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorContainer from "@/components/shared/ErrorContainer/ErrorContainer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChartData {
  month: number;
  count: number;
}

interface YearlyData {
  year: number;
  count: number;
}

interface LeadAnalyticsApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    monthly: {
      year: number;
      data: ChartData[];
    };
    yearly: {
      data: YearlyData[];
    };
  };
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function LeadAnalytics() {
  const { data: session, status } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data, isLoading, isError, error } =
    useQuery<LeadAnalyticsApiResponse>({
      queryKey: ["lead-analytics", selectedYear],
      queryFn: async () => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/leads/analytics?year=${selectedYear}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const response = await res.json();

        if (!res.ok || !response?.success) {
          throw new Error(response?.message || "Failed to fetch lead analytics");
        }

        return response;
      },
      enabled: status === "authenticated" && Boolean(token),
    });

  const chartData = (data?.data?.monthly?.data || []).map((item) => ({
    ...item,
    monthLabel: monthNames[item.month - 1],
  }));
  const yearlyData = data?.data?.yearly?.data || [];
  const availableYears = Array.from(
    new Set([
      currentYear,
      ...yearlyData.map((item) => item.year),
      ...Array.from({ length: 4 }, (_, index) => currentYear - index),
    ]),
  ).sort((first, second) => second - first);
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      payload: ChartData;
    }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 shadow-md">
        <p className="text-[12px] font-medium text-[#6B7280]">
          {label} {selectedYear}
        </p>
        <p className="text-sm font-semibold text-primary">
          {payload[0].value} {payload[0].value === 1 ? "lead" : "leads"}
        </p>
      </div>
    );
  };

  if (status !== "loading" && !token) {
    return (
      <div className="px-4 pb-6 pt-4 md:px-6">
        <ErrorContainer message="Session expired. Please login again to view lead analytics." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 pb-6 pt-4 md:px-6">
        <ErrorContainer
          message={(error as Error)?.message || "Something went wrong"}
        />
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 pt-5 md:px-6">
      <Card className="overflow-hidden rounded-[16px] border border-[#E6E7E6] shadow-[0px_4px_12px_0px_#0000000D]">
        <CardHeader className="flex flex-col space-y-4 border-b border-[#ECEEF2] bg-white pb-5 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-lg font-semibold leading-normal text-[#343A40] md:text-xl">
              Lead Analytics
            </CardTitle>
            <p className="mt-1 text-sm font-normal leading-normal text-[#68706A]">
              Track monthly lead volume and compare yearly performance.
            </p>
          </div>

          <div className="flex items-center">
            <Select
              value={selectedYear.toString()}
              onValueChange={(val) => setSelectedYear(parseInt(val))}
            >
              <SelectTrigger className="h-10 w-[110px] rounded-[10px] border-[#E0E4EC] bg-[#F8F9FA] text-sm font-medium text-[#343A40] focus:ring-primary">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {availableYears.map((year) => (
                  <SelectItem
                    key={year}
                    value={year.toString()}
                    className="cursor-pointer text-sm"
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="bg-white pt-5">
          <div className="relative h-[320px] w-full">
            {isLoading ? (
              <div className="flex h-full w-full items-center justify-center p-4">
                <Skeleton className="h-full w-full rounded-2xl" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 12, right: 10, left: -24, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F96706" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#F96706" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid vertical={false} stroke="#F1F5F9" />

                  <XAxis
                    dataKey="monthLabel"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    allowDecimals={false}
                  />

                  <Tooltip
                    cursor={{
                      stroke: "#F96706",
                      strokeDasharray: "4 4",
                    }}
                    content={<CustomTooltip />}
                  />

                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#F96706"
                    strokeWidth={3}
                    fill="url(#leadFill)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#F96706",
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
