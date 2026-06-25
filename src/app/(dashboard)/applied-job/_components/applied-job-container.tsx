"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  CalendarClock,
  Eye,
  Loader2,
  PenSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import DeleteModal from "@/components/modals/delete-modal";
import ErrorContainer from "@/components/shared/ErrorContainer/ErrorContainer";
import CustomPagination from "@/components/shared/pagination/custom-pagination";
import TableSkeletonWrapper from "@/components/shared/TableSkeletonWrapper/TableSkeletonWrapper";
import type {
  AppliedJobDetailResponse,
  AppliedJobFormValues,
  AppliedJobItem,
  AppliedJobListResponse,
  AppliedJobMutationResponse,
  AppliedJobStatusFormValues,
} from "./applied-job-data-type";
import ViewAppliedJobDialog from "./view-applied-job-dialog";

const applicationStatuses = [
  "Pending",
  "Reviewed",
  "Selected",
  "Rejected",
] as const;

const applicationSchema = z.object({
  name: z.string().min(2, "Full name is required."),
  email: z.string().email("A valid email is required."),
  phone: z.string().min(5, "Phone number is required."),
  interestedPosition: z.string().min(2, "Interested position is required."),
  tellUsYourself: z
    .string()
    .min(10, "Candidate summary must be at least 10 characters."),
});

const statusSchema = z.object({
  status: z.enum(applicationStatuses),
  customMessage: z.string().default(""),
});

const defaultApplicationValues: AppliedJobFormValues = {
  name: "",
  email: "",
  phone: "",
  interestedPosition: "",
  tellUsYourself: "",
};

const defaultStatusValues: AppliedJobStatusFormValues = {
  status: "Pending",
  customMessage: "",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const getStatusStyles = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-[#FFF4DB] text-[#B7791F] border-[#F6D28B]";
    case "Reviewed":
      return "bg-primary/10 text-primary border-primary/20";
    case "Selected":
      return "bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]";
    case "Rejected":
      return "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]";
    default:
      return "bg-[#F3F4F6] text-[#68706A] border-[#D9DEE5]";
  }
};

const AppliedJobContainer = () => {
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;

  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);
  const [detailMode, setDetailMode] = useState<"view" | "status" | null>(null);
  const [applicationToDelete, setApplicationToDelete] =
    useState<AppliedJobItem | null>(null);

  const createForm = useForm<AppliedJobFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: defaultApplicationValues,
  });

  const statusForm = useForm<AppliedJobStatusFormValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: defaultStatusValues,
  });

  const watchedStatus = statusForm.watch("status");

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<AppliedJobListResponse>({
    queryKey: ["applied-jobs", page],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/applied-jobs?sortBy=createdAt&sortOrder=desc&limit=10&page=${page}`,
        {
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response: AppliedJobListResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to fetch applications");
      }

      return response;
    },
    enabled: !!token,
  });

  const applicationDetailQuery = useQuery<AppliedJobDetailResponse>({
    queryKey: ["applied-job-detail", selectedApplicationId],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/applied-jobs/${selectedApplicationId}`,
        {
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response: AppliedJobDetailResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(
          response?.message || "Failed to fetch application details"
        );
      }

      return response;
    },
    enabled: !!token && !!selectedApplicationId,
  });

  useEffect(() => {
    if (detailMode !== "status" || !applicationDetailQuery.data?.data) return;

    const application = applicationDetailQuery.data.data;
    statusForm.reset({
      status:
        (application.status as AppliedJobStatusFormValues["status"]) ||
        "Pending",
      customMessage: "",
    });
  }, [applicationDetailQuery.data, detailMode, statusForm]);

  const createApplicationMutation = useMutation({
    mutationFn: async (values: AppliedJobFormValues) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/applied-jobs`,
        {
          method: "POST",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: values.name.trim(),
            email: values.email.trim(),
            phone: values.phone.trim(),
            interestedPosition: values.interestedPosition.trim(),
            tellUsYourself: values.tellUsYourself.trim(),
          }),
        }
      );

      const response: AppliedJobMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to create application");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Application created successfully");
      handleCreateDialogChange(false);
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ["applied-jobs"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to create application"
      );
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: AppliedJobStatusFormValues;
    }) => {
      const isSelected = values.status === "Selected";
      const endpoint = isSelected
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/applied-jobs/${id}/select`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/applied-jobs/${id}/status`;
      const payload = isSelected
        ? { customMessage: values.customMessage?.trim() || undefined }
        : { status: values.status };

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const response: AppliedJobMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to update application");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Application updated successfully");
      handleStatusDialogChange(false);
      queryClient.invalidateQueries({ queryKey: ["applied-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["applied-job-detail"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to update application"
      );
    },
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/applied-jobs/${id}`,
        {
          method: "DELETE",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response: AppliedJobMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to delete application");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Application deleted successfully");
      setApplicationToDelete(null);

      const totalItemsAfterDelete = (data?.meta.total || 1) - 1;
      const totalPagesAfterDelete = Math.max(
        1,
        Math.ceil(totalItemsAfterDelete / (data?.meta.limit || 10))
      );

      if (page > totalPagesAfterDelete) {
        setPage(totalPagesAfterDelete);
      }

      queryClient.invalidateQueries({ queryKey: ["applied-jobs"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to delete application"
      );
    },
  });

  const applications = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;
  const isCreating = createApplicationMutation.isPending;
  const isUpdatingStatus = updateStatusMutation.isPending;

  const handleView = (application: AppliedJobItem) => {
    setDetailMode("view");
    setSelectedApplicationId(application._id);
  };

  const handleStatusEdit = (application: AppliedJobItem) => {
    setDetailMode("status");
    setSelectedApplicationId(application._id);
    setIsStatusOpen(true);
  };

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateOpen(open);

    if (!open) {
      createForm.reset(defaultApplicationValues);
    }
  };

  const handleStatusDialogChange = (open: boolean) => {
    setIsStatusOpen(open);

    if (!open) {
      setDetailMode(null);
      setSelectedApplicationId(null);
      statusForm.reset(defaultStatusValues);
    }
  };

  const onCreateSubmit = (values: AppliedJobFormValues) => {
    createApplicationMutation.mutate(values);
  };

  const onStatusSubmit = (values: AppliedJobStatusFormValues) => {
    if (!selectedApplicationId) return;
    updateStatusMutation.mutate({ id: selectedApplicationId, values });
  };

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
        <ErrorContainer message="Session expired. Please login again to manage applications." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorContainer
          message={(error as Error)?.message || "Failed to load applications"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex w-full items-center justify-end">
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="h-[48px] rounded-[10px] bg-primary px-5 text-base font-semibold text-white hover:bg-primary/90"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Application
        </Button>
      </div>

      <div className="rounded-[16px] border border-[#E6E7E6] bg-white shadow-[0px_4px_10px_0px_#00000012]">
        <div className="flex flex-col gap-3 border-b border-[#ECEEF2] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[#343A40]">
              Application List
            </h3>
            <p className="pt-1 text-sm text-[#68706A]">
              Review candidate submissions, inspect full profiles, update
              statuses, and remove unwanted records.
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
          {isLoading ? (
            <TableSkeletonWrapper height="320px" />
          ) : applications.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[14px] border border-dashed border-primary/20 bg-primary/5 px-4 text-center">
              <h4 className="pt-4 text-xl font-semibold text-[#343A40]">
                No applications found
              </h4>
              <p className="max-w-[440px] pt-2 text-sm leading-6 text-[#68706A]">
                New candidate applications from the website and manual entries
                will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-[14px] border border-[#ECEEF2]">
                <Table>
                  <TableHeader className="bg-[#F8F9FA]">
                    <TableRow className="border-[#ECEEF2] hover:bg-[#F8F9FA]">
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Candidate
                      </TableHead>
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Contact
                      </TableHead>
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Position
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
                    {applications.map((application) => (
                      <TableRow
                        key={application._id}
                        className="border-[#ECEEF2] bg-white hover:bg-primary/5"
                      >
                        <TableCell className="px-4 py-4">
                          <div className="max-w-[220px]">
                            <p className="font-semibold leading-6 text-[#343A40]">
                              {application.name}
                            </p>
                            <p className="pt-1 text-sm text-[#68706A]">
                              {application.email}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <p className="text-sm text-[#68706A]">
                            {application.phone}
                          </p>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <p className="max-w-[240px] text-sm leading-6 text-[#68706A]">
                            {application.interestedPosition}
                          </p>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={getStatusStyles(application.status)}
                          >
                            {application.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-2 text-sm text-[#68706A]">
                            <CalendarClock className="h-4 w-4 text-primary" />
                            {formatDate(application.createdAt)}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => handleView(application)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition hover:bg-primary hover:text-white"
                              aria-label={`View ${application.name}`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusEdit(application)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F6D28B] bg-[#FFF4DB] text-[#B7791F] transition hover:bg-[#B7791F] hover:text-white"
                              aria-label={`Update ${application.name}`}
                            >
                              <PenSquare className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setApplicationToDelete(application)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
                              aria-label={`Delete ${application.name}`}
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
                  itemLabel="applications"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={handleCreateDialogChange}>
        <DialogContent className="max-h-[90vh] max-w-[760px] overflow-y-auto rounded-[16px] border-none bg-white p-0">
          <DialogHeader className="border-b border-[#ECEEF2] px-6 py-5">
            <DialogTitle className="text-2xl font-semibold text-[#343A40]">
              Create Application
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-6 text-[#68706A]">
              Add a candidate record manually using the same backend module as
              website applications.
            </DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onCreateSubmit)}
              className="space-y-5 px-6 py-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John Smith"
                          className="h-11 rounded-[10px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="interestedPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interested Position</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Senior Software Engineer"
                          className="h-11 rounded-[10px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="john@example.com"
                          className="h-11 rounded-[10px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="+8801XXXXXXXXX"
                          className="h-11 rounded-[10px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="tellUsYourself"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Share the candidate profile, experience, or notes..."
                        className="min-h-[140px] rounded-[10px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col-reverse gap-3 border-t border-[#ECEEF2] pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-[10px] px-5"
                  onClick={() => handleCreateDialogChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-11 rounded-[10px] px-5"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Create Application"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isStatusOpen} onOpenChange={handleStatusDialogChange}>
        <DialogContent className="max-h-[90vh] max-w-[620px] overflow-y-auto rounded-[16px] border-none bg-white p-0">
          <DialogHeader className="border-b border-[#ECEEF2] px-6 py-5">
            <DialogTitle className="text-2xl font-semibold text-[#343A40]">
              Update Application Status
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-6 text-[#68706A]">
              Change candidate progress. Selecting a candidate uses the backend
              email workflow automatically.
            </DialogDescription>
          </DialogHeader>

          {applicationDetailQuery.isLoading ? (
            <div className="px-6 py-8">
              <TableSkeletonWrapper height="220px" />
            </div>
          ) : applicationDetailQuery.isError ? (
            <div className="px-6 py-8">
              <ErrorContainer
                message={
                  (applicationDetailQuery.error as Error)?.message ||
                  "Failed to load application details"
                }
              />
            </div>
          ) : (
            <Form {...statusForm}>
              <form
                onSubmit={statusForm.handleSubmit(onStatusSubmit)}
                className="space-y-5 px-6 py-6"
              >
                <FormField
                  control={statusForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-[10px]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          {applicationStatuses.map((item) => (
                            <SelectItem key={item} value={item} className="cursor-pointer">
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedStatus === "Selected" ? (
                  <FormField
                    control={statusForm.control}
                    name="customMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selection Message</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Optional custom message for the selection email..."
                            className="min-h-[140px] rounded-[10px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                <div className="flex flex-col-reverse gap-3 border-t border-[#ECEEF2] pt-5 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-[10px] px-5"
                    onClick={() => handleStatusDialogChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-11 rounded-[10px] px-5"
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Save Status"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <ViewAppliedJobDialog
        application={applicationDetailQuery.data?.data || null}
        open={detailMode === "view"}
        onOpenChange={(open) => {
          if (!open) {
            setDetailMode(null);
            setSelectedApplicationId(null);
          }
        }}
      />

      <DeleteModal
        isOpen={!!applicationToDelete}
        onClose={() => setApplicationToDelete(null)}
        onConfirm={() =>
          applicationToDelete
            ? deleteApplicationMutation.mutate(applicationToDelete._id)
            : undefined
        }
        title="Delete this application?"
        desc={`This will permanently remove "${applicationToDelete?.name ?? "this application"}" from the list.`}
      />
    </div>
  );
};

export default AppliedJobContainer;
