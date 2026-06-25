"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Eye, Loader2, Mail } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";

import ErrorContainer from "@/components/shared/ErrorContainer/ErrorContainer";
import CustomPagination from "@/components/shared/pagination/custom-pagination";
import TableSkeletonWrapper from "@/components/shared/TableSkeletonWrapper/TableSkeletonWrapper";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type {
  EmailLogDetailResponse,
  EmailLogListResponse,
} from "./email-automation-data-type";
import ViewEmailLogDialog from "./view-email-log-dialog";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const getLogStatusStyles = (status: string) =>
  status === "sent"
    ? "border-[#86EFAC] bg-[#DCFCE7] text-[#15803D]"
    : "border-[#FECACA] bg-[#FEE2E2] text-[#DC2626]";

const EmailAutomationContainer = () => {
  const { data: session, status: sessionStatus } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;
  const [page, setPage] = useState(1);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const {
    data: logsResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<EmailLogListResponse>({
    queryKey: ["email-logs", page],
    queryFn: async () => {
      const params = new URLSearchParams({
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: "10",
        page: String(page),
      });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/email-automation/logs?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const result: EmailLogListResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch email logs");
      }

      return result;
    },
    enabled: sessionStatus === "authenticated" && Boolean(token),
  });

  const logDetailQuery = useQuery<EmailLogDetailResponse>({
    queryKey: ["email-log-detail", selectedLogId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/email-automation/logs/${selectedLogId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const result: EmailLogDetailResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch email log details");
      }

      return result;
    },
    enabled: Boolean(token && selectedLogId),
  });

  if (sessionStatus === "loading") {
    return (
      <div className="p-4 md:p-6">
        <TableSkeletonWrapper height="420px" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="p-4 md:p-6">
        <ErrorContainer message="Session expired. Please login again to view email logs." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6">
        <ErrorContainer
          message={error?.message || "Failed to load email logs"}
        />
      </div>
    );
  }

  const logs = logsResponse?.data ?? [];
  const meta = logsResponse?.meta;
  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.limit))
    : 1;

  return (
    <div className="p-4 md:p-6">
      <section className="overflow-hidden rounded-[16px] border border-[#E6E7E6] bg-white shadow-[0px_4px_10px_0px_#00000012]">
        <div className="flex flex-col gap-3 border-b border-[#ECEEF2] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <h2 className="text-xl font-semibold text-[#343A40]">
              Email Logs
            </h2>
            <p className="pt-1 text-sm text-[#68706A]">
              Review recent deliveries, inspect failures, and open rendered
              email details for support or audit work.
            </p>
          </div>
          {isFetching ? (
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing logs
            </div>
          ) : null}
        </div>

        <div className="px-4 py-5 md:px-6 md:py-6">
          {isLoading ? (
            <TableSkeletonWrapper height="320px" />
          ) : logs.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[14px] border border-dashed border-primary/20 bg-primary/5 px-4 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-xl font-semibold text-[#343A40]">
                No email logs found
              </h3>
              <p className="max-w-[440px] pt-2 text-sm leading-6 text-[#68706A]">
                Sent and failed email activity will appear here automatically.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-[14px] border border-[#ECEEF2]">
                <Table>
                  <TableHeader className="bg-[#F8F9FA]">
                    <TableRow className="border-[#ECEEF2] hover:bg-[#F8F9FA]">
                      <TableHead className="px-4 py-4 font-semibold text-[#343A40]">
                        Recipient
                      </TableHead>
                      <TableHead className="px-4 py-4 font-semibold text-[#343A40]">
                        Subject
                      </TableHead>
                      <TableHead className="px-4 py-4 font-semibold text-[#343A40]">
                        Template
                      </TableHead>
                      <TableHead className="px-4 py-4 font-semibold text-[#343A40]">
                        Status
                      </TableHead>
                      <TableHead className="px-4 py-4 font-semibold text-[#343A40]">
                        Created
                      </TableHead>
                      <TableHead className="px-4 py-4 text-right font-semibold text-[#343A40]">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow
                        key={log._id}
                        className="border-[#ECEEF2] bg-white hover:bg-primary/[0.03]"
                      >
                        <TableCell className="px-4 py-4 text-sm font-medium text-[#343A40]">
                          {log.to}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <p className="max-w-[300px] text-sm leading-6 text-[#68706A]">
                            {log.subject}
                          </p>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-sm text-[#68706A]">
                          {log.templateKey || "N/A"}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={getLogStatusStyles(log.status)}
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <span className="flex items-center gap-2 whitespace-nowrap text-sm text-[#68706A]">
                            <CalendarClock className="h-4 w-4 text-primary" />
                            {formatDate(log.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setSelectedLogId(log._id)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition hover:bg-primary hover:text-white"
                              aria-label={`View ${log.subject}`}
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

              <div className="px-1 pt-5">
                <CustomPagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={meta?.total}
                  pageSize={meta?.limit}
                  itemLabel="email logs"
                />
              </div>
            </>
          )}
        </div>
      </section>

      <ViewEmailLogDialog
        log={logDetailQuery.data?.data || null}
        open={Boolean(selectedLogId)}
        onOpenChange={(open) => {
          if (!open) setSelectedLogId(null);
        }}
      />
    </div>
  );
};

export default EmailAutomationContainer;
