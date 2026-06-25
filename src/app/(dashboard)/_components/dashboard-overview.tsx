"use client";

import { useQuery } from "@tanstack/react-query";
import { MailCheck, Target, UsersRound } from "lucide-react";
import { useSession } from "next-auth/react";

import ErrorContainer from "@/components/shared/ErrorContainer/ErrorContainer";

import { DashboardOverviewsApiResponse } from "./dashboard-overview-data-type";
import DashboardOverviewSkeleton from "./dashboard-overview-skeleton";

const numberFormatter = new Intl.NumberFormat("en-GB");

export function DashboardOverview() {
  const { data: session, status } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;

  const { data, isLoading, isError, error } =
    useQuery<DashboardOverviewsApiResponse>({
      queryKey: ["dashboard-lead-overview"],
      queryFn: async () => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/leads/overview`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Failed to load dashboard overview");
        }

        return result;
      },
      enabled: status === "authenticated" && Boolean(token),
    });

  if (isLoading || status === "loading") {
    return (
      <div className="px-4 pt-5 md:px-6 md:pt-6">
        <DashboardOverviewSkeleton />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="px-4 pt-5 md:px-6 md:pt-6">
        <ErrorContainer message="Session expired. Please login again to view the dashboard." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 pt-5 md:px-6 md:pt-6">
        <ErrorContainer
          message={error?.message || "Failed to load dashboard overview"}
        />
      </div>
    );
  }

  const overview = data?.data;
  const conversionRate = overview?.totalLeads
    ? (overview.totalConversion / overview.totalLeads) * 100
    : 0;

  const cards = [
    {
      label: "Total Leads",
      value: overview?.totalLeads || 0,
      description: "All leads captured in your CRM",
      icon: UsersRound,
      iconClassName: "bg-[#FFF0E6] text-primary",
    },
    {
      label: "Won Conversions",
      value: overview?.totalConversion || 0,
      description: `${conversionRate.toFixed(1)}% lead conversion rate`,
      icon: Target,
      iconClassName: "bg-[#DCFCE7] text-[#15803D]",
    },
    {
      label: "Emails Sent",
      value: overview?.totalEmailSent || 0,
      description: "Successful automated email deliveries",
      icon: MailCheck,
      iconClassName: "bg-[#EAF2FF] text-[#2563EB]",
    },
  ];

  return (
    <section className="px-4 pt-5 md:px-6 md:pt-6">

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="group relative overflow-hidden rounded-[16px] border border-[#E6E7E6] bg-white p-5 shadow-[0px_4px_12px_0px_#0000000D] transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0px_10px_24px_0px_#00000012]"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/[0.04]" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#68706A]">
                    {card.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold leading-none text-[#343A40]">
                    {numberFormatter.format(card.value)}
                  </p>
                  <p className="mt-3 text-xs text-[#8B928D]">
                    {card.description}
                  </p>
                </div>
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] ${card.iconClassName}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
