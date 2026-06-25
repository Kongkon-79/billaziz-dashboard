"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Eye, Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import DeleteModal from "@/components/modals/delete-modal";
import ErrorContainer from "@/components/shared/ErrorContainer/ErrorContainer";
import CustomPagination from "@/components/shared/pagination/custom-pagination";
import TableSkeletonWrapper from "@/components/shared/TableSkeletonWrapper/TableSkeletonWrapper";
import type {
  LeadItem,
  LeadListResponse,
  LeadMutationResponse,
  // LeadSource,
  LeadStatus,
} from "./lead-data-type";
import ViewLeadDialog from "./view-lead-dialog";

const leadStatuses: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Closed Won",
  "Closed Lost",
];

// const leadSources: LeadSource[] = ["Website Form", "Chatbot", "Manual Entry"];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const getStatusStyles = (status: string) => {
  switch (status) {
    case "New":
      return "bg-primary/10 text-primary border-primary/20";
    case "Contacted":
      return "bg-[#FFF4DB] text-[#B7791F] border-[#F6D28B]";
    case "Qualified":
      return "bg-[#E6FFFA] text-[#0F766E] border-[#99F6E4]";
    case "Proposal Sent":
      return "bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]";
    case "Closed Won":
      return "bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]";
    case "Closed Lost":
      return "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]";
    default:
      return "bg-[#F3F4F6] text-[#68706A] border-[#D9DEE5]";
  }
};

const getLeadType = (lead: LeadItem) =>
  lead.itemType || lead.serviceNeeded || lead.inquiryType || "Not specified";

const LeadManagementContainer = () => {
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<LeadItem | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearchTerm(searchInput.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError, error, isFetching } =
    useQuery<LeadListResponse>({
      queryKey: ["leads", page, searchTerm, statusFilter],
      queryFn: async () => {
        const params = new URLSearchParams({
          sortBy: "createdAt",
          limit: "10",
          page: String(page),
        });

        if (searchTerm) params.set("searchTerm", searchTerm);
        if (statusFilter !== "all") params.set("status", statusFilter);
        // if (sourceFilter !== "all") params.set("source", sourceFilter);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/leads?${params.toString()}`,
          {
            headers: {
              accept: "*/*",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const response = await res.json();

        if (!res.ok || !response?.success) {
          throw new Error(response?.message || "Failed to fetch leads");
        }

        return response;
      },
      enabled: !!token,
    });

  const updateLeadStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: LeadStatus;
    }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/leads/${id}/status`,
        {
          method: "PUT",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const response: LeadMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to update lead status");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Lead status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to update lead status"
      );
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/leads/${id}`,
        {
          method: "DELETE",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response: LeadMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to delete lead");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Lead deleted successfully");
      setLeadToDelete(null);

      const totalItemsAfterDelete = (data?.meta.total || 1) - 1;
      const totalPagesAfterDelete = Math.max(
        1,
        Math.ceil(totalItemsAfterDelete / (data?.meta.limit || 10))
      );

      if (page > totalPagesAfterDelete) {
        setPage(totalPagesAfterDelete);
      }

      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to delete lead"
      );
    },
  });

  const leads = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  if (sessionStatus === "loading") {
    return (
      <div className="p-6">
        <TableSkeletonWrapper height="420px" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="p-6">
        <ErrorContainer message="Session expired. Please login again to manage leads." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorContainer
          message={(error as Error)?.message || "Failed to load leads"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-[16px] border border-[#E6E7E6] bg-white shadow-[0px_4px_10px_0px_#00000012]">
        <div className="flex flex-col gap-3 border-b border-[#ECEEF2] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[#343A40]">Lead List</h3>
            <p className="pt-1 text-sm text-[#68706A]">
              Review incoming leads, inspect submission details, and remove
              outdated entries.
            </p>
          </div>
          {isFetching ? (
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing data
            </div>
          ) : null}
        </div>

        <div className="px-6 py-6">
          <div className="mb-5 grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68706A]" />
              <Input
                value={searchInput}
                type="search"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name, email, phone, company..."
                className="h-11 rounded-[10px] pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setPage(1);
                setStatusFilter(value);
              }}
            >
              <SelectTrigger className="h-11 rounded-[10px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Statuses</SelectItem>
                {leadStatuses.map((status) => (
                  <SelectItem key={status} value={status} className="cursor-pointer">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* <Select
              value={sourceFilter}
              onValueChange={(value) => {
                setPage(1);
                setSourceFilter(value);
              }}
            >
              <SelectTrigger className="h-11 rounded-[10px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {leadSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}

          </div>

          {isLoading ? (
            <TableSkeletonWrapper height="320px" />
          ) : leads.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[14px] border border-dashed border-primary/20 bg-primary/5 px-4 text-center">
              <h4 className="pt-4 text-xl font-semibold text-[#343A40]">
                No leads found
              </h4>
              <p className="max-w-[440px] pt-2 text-sm leading-6 text-[#68706A]">
                New lead submissions will appear here once customers submit a
                form from your site or your team adds them manually.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-[14px] border border-[#ECEEF2]">
                <Table>
                  <TableHeader className="bg-[#F8F9FA]">
                    <TableRow className="border-[#ECEEF2] hover:bg-[#F8F9FA]">
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Lead
                      </TableHead>
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Contact
                      </TableHead>
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Type
                      </TableHead>
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Status
                      </TableHead>
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Created
                      </TableHead>
                      <TableHead className="px-4 py-4 text-right text-sm font-semibold text-[#343A40]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow
                        key={lead._id}
                        className="border-[#ECEEF2] bg-white hover:bg-primary/5"
                      >
                        <TableCell className="px-4 py-4">
                          <div className="max-w-[240px]">
                            <p className="font-semibold leading-6 text-[#343A40]">
                              {lead.name}
                            </p>
                            <p className="pt-1 text-sm text-[#68706A]">
                              {lead.company || lead.source || "No company provided"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <div className="max-w-[240px] space-y-1">
                            <p className="text-sm font-medium text-[#343A40]">
                              {lead.email}
                            </p>
                            <p className="text-sm text-[#68706A]">
                              {lead.phone}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <p className="max-w-[220px] text-sm leading-6 text-[#68706A]">
                            {getLeadType(lead)}
                          </p>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <Select
                            value={lead.status}
                            onValueChange={(value) =>
                              updateLeadStatusMutation.mutate({
                                id: lead._id,
                                status: value as LeadStatus,
                              })
                            }
                            disabled={
                              updateLeadStatusMutation.isPending &&
                              updateLeadStatusMutation.variables?.id === lead._id
                            }
                          >
                            <SelectTrigger
                              className={`h-10 min-w-[170px] rounded-[10px] text-xs font-medium ${getStatusStyles(
                                lead.status
                              )}`}
                            >
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {leadStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-2 text-sm text-[#68706A]">
                            <CalendarClock className="h-4 w-4 text-primary" />
                            {formatDate(lead.createdAt)}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedLead(lead)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition hover:bg-primary hover:text-white"
                              aria-label={`View ${lead.name}`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setLeadToDelete(lead)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
                              aria-label={`Delete ${lead.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
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
                  itemLabel="leads"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <ViewLeadDialog
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLead(null);
          }
        }}
      />

      <DeleteModal
        isOpen={!!leadToDelete}
        onClose={() => setLeadToDelete(null)}
        onConfirm={() =>
          leadToDelete ? deleteLeadMutation.mutate(leadToDelete._id) : undefined
        }
        title="Delete this lead?"
        desc={`This will permanently remove "${leadToDelete?.name ?? "this lead"}" from the list.`}
      />
    </div>
  );
};

export default LeadManagementContainer;
