"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, Eye, UsersRound } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";

import ErrorContainer from "@/components/shared/ErrorContainer/ErrorContainer";
import TableSkeletonWrapper from "@/components/shared/TableSkeletonWrapper/TableSkeletonWrapper";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  LeadItem,
  LeadListResponse,
} from "../lead-management/_components/lead-data-type";
import ViewLeadDialog from "../lead-management/_components/view-lead-dialog";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const getLeadType = (lead: LeadItem) =>
  lead.itemType || lead.serviceNeeded || lead.inquiryType || "Not specified";

const getStatusStyles = (status: string) => {
  switch (status) {
    case "New":
      return "border-primary/20 bg-primary/10 text-primary";
    case "Contacted":
      return "border-[#F6D28B] bg-[#FFF4DB] text-[#B7791F]";
    case "Qualified":
      return "border-[#99F6E4] bg-[#E6FFFA] text-[#0F766E]";
    case "Proposal Sent":
      return "border-[#DDD6FE] bg-[#EDE9FE] text-[#6D28D9]";
    case "Closed Won":
      return "border-[#86EFAC] bg-[#DCFCE7] text-[#15803D]";
    case "Closed Lost":
      return "border-[#FECACA] bg-[#FEE2E2] text-[#DC2626]";
    default:
      return "border-[#D9DEE5] bg-[#F3F4F6] text-[#68706A]";
  }
};

export function RecentLead() {
  const { data: session, status } = useSession();
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const token = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;

  const { data, isLoading, isError, error } = useQuery<LeadListResponse>({
    queryKey: ["recent-leads"],
    queryFn: async () => {
      const params = new URLSearchParams({
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: "3",
        page: "1",
      });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/leads?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to load recent leads");
      }

      return result;
    },
    enabled: status === "authenticated" && Boolean(token),
  });

  if (isLoading || status === "loading") {
    return (
      <div className="px-4 pb-6 md:px-6">
        <TableSkeletonWrapper height="260px" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="px-4 pb-6 md:px-6">
        <ErrorContainer message="Session expired. Please login again to view recent leads." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 pb-6 md:px-6">
        <ErrorContainer
          message={error?.message || "Failed to load recent leads"}
        />
      </div>
    );
  }

  const leads = data?.data || [];

  return (
    <section className="px-4 pb-6 md:px-6">
      <div className="overflow-hidden rounded-[16px] border border-[#E6E7E6] bg-white shadow-[0px_4px_12px_0px_#0000000D]">
        <div className="flex flex-col gap-4 border-b border-[#ECEEF2] px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div>
            <h2 className="text-lg font-semibold text-[#343A40] md:text-xl">
              Recent Leads
            </h2>
            <p className="mt-1 text-sm text-[#68706A]">
              The latest three leads added to your pipeline.
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="h-10 rounded-[8px] border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Link href="/lead-management">
              See All Leads
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {leads.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UsersRound className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-[#343A40]">
              No recent leads
            </h3>
            <p className="mt-1 text-sm text-[#68706A]">
              New lead submissions will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#F8F9FA]">
                <TableRow className="border-[#ECEEF2] hover:bg-[#F8F9FA]">
                  <TableHead className="px-5 py-4 font-semibold text-[#343A40] md:px-6">
                    Lead
                  </TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-[#343A40]">
                    Type
                  </TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-[#343A40]">
                    Status
                  </TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-[#343A40]">
                    Created
                  </TableHead>
                  <TableHead className="px-5 py-4 text-right font-semibold text-[#343A40] md:px-6">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {leads.map((lead) => (
                  <TableRow
                    key={lead._id}
                    className="border-[#ECEEF2] hover:bg-primary/[0.03]"
                  >
                    <TableCell className="px-5 py-4 md:px-6">
                      <p className="font-semibold text-[#343A40]">{lead.name}</p>
                      <p className="mt-1 max-w-[240px] truncate text-sm text-[#68706A]">
                        {lead.email}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-[#68706A]">
                      <p className="max-w-[220px] truncate">
                        {getLeadType(lead)}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyles(
                          lead.status,
                        )}`}
                      >
                        {lead.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <span className="flex items-center gap-2 whitespace-nowrap text-sm text-[#68706A]">
                        <CalendarClock className="h-4 w-4 text-primary" />
                        {formatDate(lead.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 md:px-6">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedLead(lead)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition hover:bg-primary hover:text-white"
                          aria-label={`View ${lead.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ViewLeadDialog
        lead={selectedLead}
        open={Boolean(selectedLead)}
        onOpenChange={(open) => {
          if (!open) setSelectedLead(null);
        }}
      />
    </section>
  );
}
