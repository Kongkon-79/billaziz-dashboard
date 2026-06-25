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
  JobDetailResponse,
  JobFormValues,
  JobItem,
  JobMutationResponse,
  JobsListResponse,
} from "./jobs-data-type";
import ViewJobDialog from "./view-job-dialog";

const jobCategories = ["Full Time", "Part Time", "Remote"] as const;
const experienceLevels = [
  "Entry Level",
  "Mid Level",
  "Senior Level",
  "Lead",
  "Executive",
] as const;
const jobStatuses = ["Active", "Closed", "Draft"] as const;

const jobSchema = z.object({
  title: z.string().min(2, "Job title is required."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  category: z.enum(jobCategories),
  location: z.string(),
  requiredSkills: z.string(),
  vacancy: z.number().min(1, "Vacancy must be at least 1."),
  companyName: z.string(),
  salaryRange: z.string(),
  experienceLevel: z.enum(experienceLevels),
  applicationDeadline: z.string(),
  benefits: z.string(),
  responsibilities: z.string(),
  qualifications: z.string(),
  status: z.enum(jobStatuses),
});

const defaultValues: JobFormValues = {
  title: "",
  description: "",
  category: "Full Time",
  location: "",
  requiredSkills: "",
  vacancy: 1,
  companyName: "",
  salaryRange: "",
  experienceLevel: "Mid Level",
  applicationDeadline: "",
  benefits: "",
  responsibilities: "",
  qualifications: "",
  status: "Active",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const formatDateTimeLocal = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

const parseList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeOptional = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-primary/10 text-primary border-primary/20";
    case "Closed":
      return "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]";
    default:
      return "bg-[#F3F4F6] text-[#68706A] border-[#D9DEE5]";
  }
};

const buildJobPayload = (values: JobFormValues) => ({
  title: values.title.trim(),
  description: values.description.trim(),
  category: values.category,
  location: normalizeOptional(values.location),
  requiredSkills: parseList(values.requiredSkills),
  vacancy: values.vacancy,
  companyName: normalizeOptional(values.companyName),
  salaryRange: normalizeOptional(values.salaryRange),
  experienceLevel: values.experienceLevel,
  applicationDeadline: values.applicationDeadline
    ? new Date(values.applicationDeadline).toISOString()
    : undefined,
  benefits: parseList(values.benefits),
  responsibilities: normalizeOptional(values.responsibilities),
  qualifications: normalizeOptional(values.qualifications),
  status: values.status,
});

const JobsContainer = () => {
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;

  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<"view" | "edit" | null>(null);
  const [jobToDelete, setJobToDelete] = useState<JobItem | null>(null);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues,
  });

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<JobsListResponse>({
    queryKey: ["jobs", page],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs?sortBy=createdAt&sortOrder=desc&limit=10&page=${page}`,
        {
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response: JobsListResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to fetch jobs");
      }

      return response;
    },
    enabled: !!token,
  });

  const jobDetailQuery = useQuery<JobDetailResponse>({
    queryKey: ["job-detail", selectedJobId],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/${selectedJobId}`,
        {
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response: JobDetailResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to fetch job details");
      }

      return response;
    },
    enabled: !!token && !!selectedJobId,
  });

  useEffect(() => {
    if (detailMode !== "edit" || !jobDetailQuery.data?.data) return;

    const job = jobDetailQuery.data.data;

    form.reset({
      title: job.title,
      description: job.description,
      category: (job.category as JobFormValues["category"]) || "Full Time",
      location: job.location || "",
      requiredSkills: job.requiredSkills?.join(", ") || "",
      vacancy: job.vacancy || 1,
      companyName: job.companyName || "",
      salaryRange: job.salaryRange || "",
      experienceLevel:
        (job.experienceLevel as JobFormValues["experienceLevel"]) ||
        "Mid Level",
      applicationDeadline: formatDateTimeLocal(job.applicationDeadline),
      benefits: job.benefits?.join(", ") || "",
      responsibilities: job.responsibilities || "",
      qualifications: job.qualifications || "",
      status: (job.status as JobFormValues["status"]) || "Active",
    });
  }, [detailMode, form, jobDetailQuery.data]);

  const createJobMutation = useMutation({
    mutationFn: async (values: JobFormValues) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs`, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildJobPayload(values)),
      });

      const response: JobMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to create job");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Job created successfully");
      handleFormDialogChange(false);
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to create job"
      );
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: JobFormValues;
    }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/${id}`,
        {
          method: "PUT",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(buildJobPayload(values)),
        }
      );

      const response: JobMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to update job");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Job updated successfully");
      handleFormDialogChange(false);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-detail"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to update job"
      );
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/jobs/${id}`,
        {
          method: "DELETE",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response: JobMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to delete job");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Job deleted successfully");
      setJobToDelete(null);

      const totalItemsAfterDelete = (data?.meta.total || 1) - 1;
      const totalPagesAfterDelete = Math.max(
        1,
        Math.ceil(totalItemsAfterDelete / (data?.meta.limit || 10))
      );

      if (page > totalPagesAfterDelete) {
        setPage(totalPagesAfterDelete);
      }

      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to delete job"
      );
    },
  });

  const jobs = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;
  const isSubmitting =
    createJobMutation.isPending || updateJobMutation.isPending;

  const handleCreate = () => {
    setFormMode("create");
    setDetailMode(null);
    setSelectedJobId(null);
    form.reset(defaultValues);
    setIsFormOpen(true);
  };

  const handleEdit = (job: JobItem) => {
    setFormMode("edit");
    setDetailMode("edit");
    setSelectedJobId(job._id);
    setIsFormOpen(true);
  };

  const handleView = (job: JobItem) => {
    setDetailMode("view");
    setSelectedJobId(job._id);
  };

  const handleFormDialogChange = (open: boolean) => {
    setIsFormOpen(open);

    if (!open) {
      setFormMode("create");
      setDetailMode(null);
      setSelectedJobId(null);
      form.reset(defaultValues);
    }
  };

  const onSubmit = (values: JobFormValues) => {
    if (formMode === "edit" && selectedJobId) {
      updateJobMutation.mutate({ id: selectedJobId, values });
      return;
    }

    createJobMutation.mutate(values);
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
        <ErrorContainer message="Session expired. Please login again to manage jobs." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorContainer
          message={(error as Error)?.message || "Failed to load jobs"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex w-full items-center justify-end">
        <Button
          onClick={handleCreate}
          className="h-[48px] rounded-[10px] bg-primary px-5 text-base font-semibold text-white hover:bg-primary/90"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add New Job
        </Button>
      </div>

      <div className="rounded-[16px] border border-[#E6E7E6] bg-white shadow-[0px_4px_10px_0px_#00000012]">
        <div className="flex flex-col gap-3 border-b border-[#ECEEF2] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[#343A40]">Jobs List</h3>
            <p className="pt-1 text-sm text-[#68706A]">
              Create openings, update hiring requirements, review details, and
              remove outdated job posts.
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
          ) : jobs.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[14px] border border-dashed border-primary/20 bg-primary/5 px-4 text-center">
              <h4 className="pt-4 text-xl font-semibold text-[#343A40]">
                No job posts found
              </h4>
              <p className="max-w-[440px] pt-2 text-sm leading-6 text-[#68706A]">
                Add your first job opening to start collecting applications
                from the careers page.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-[14px] border border-[#ECEEF2]">
                <Table>
                  <TableHeader className="bg-[#F8F9FA]">
                    <TableRow className="border-[#ECEEF2] hover:bg-[#F8F9FA]">
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Position
                      </TableHead>
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Category
                      </TableHead>
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Company
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
                    {jobs.map((job) => (
                      <TableRow
                        key={job._id}
                        className="border-[#ECEEF2] bg-white hover:bg-primary/5"
                      >
                        <TableCell className="px-4 py-4">
                          <div className="max-w-[260px]">
                            <p className="font-semibold leading-6 text-[#343A40]">
                              {job.title}
                            </p>
                            <p className="pt-1 text-sm text-[#68706A]">
                              {job.location || "Location not specified"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <p className="text-sm text-[#68706A]">
                            {job.category || "Uncategorized"}
                          </p>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <p className="max-w-[220px] text-sm text-[#68706A]">
                            {job.companyName || "No company name"}
                          </p>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={getStatusStyles(job.status)}
                          >
                            {job.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-2 text-sm text-[#68706A]">
                            <CalendarClock className="h-4 w-4 text-primary" />
                            {formatDate(job.createdAt)}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => handleView(job)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition hover:bg-primary hover:text-white"
                              aria-label={`View ${job.title}`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(job)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F6D28B] bg-[#FFF4DB] text-[#B7791F] transition hover:bg-[#B7791F] hover:text-white"
                              aria-label={`Edit ${job.title}`}
                            >
                              <PenSquare className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setJobToDelete(job)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
                              aria-label={`Delete ${job.title}`}
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
                  itemLabel="jobs"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={handleFormDialogChange}>
        <DialogContent className="max-h-[90vh] max-w-[860px] overflow-y-auto rounded-[16px] border-none bg-white p-0">
          <DialogHeader className="border-b border-[#ECEEF2] px-6 py-5">
            <DialogTitle className="text-2xl font-semibold text-[#343A40]">
              {formMode === "create" ? "Create Job Post" : "Update Job Post"}
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-6 text-[#68706A]">
              {formMode === "create"
                ? "Add a new opening for the careers page and dashboard."
                : "Update the current job details shown on the website."}
            </DialogDescription>
          </DialogHeader>

          {formMode === "edit" && jobDetailQuery.isLoading ? (
            <div className="px-6 py-8">
              <TableSkeletonWrapper height="260px" />
            </div>
          ) : formMode === "edit" && jobDetailQuery.isError ? (
            <div className="px-6 py-8">
              <ErrorContainer
                message={
                  (jobDetailQuery.error as Error)?.message ||
                  "Failed to load job details"
                }
              />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5 px-6 py-6"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Billaziz"
                            className="h-11 rounded-[10px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Write a short overview of the role..."
                          className="min-h-[120px] rounded-[10px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-[10px]">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jobCategories.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experienceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-[10px]">
                              <SelectValue placeholder="Select experience" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {experienceLevels.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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
                          <SelectContent>
                            {jobStatuses.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vacancy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vacancy</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={1}
                            onChange={(event) =>
                              field.onChange(Number(event.target.value))
                            }
                            className="h-11 rounded-[10px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Dhaka, Bangladesh"
                            className="h-11 rounded-[10px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salaryRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary Range</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="$2,000 - $3,000"
                            className="h-11 rounded-[10px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="applicationDeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Deadline</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="datetime-local"
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
                    control={form.control}
                    name="requiredSkills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Required Skills</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="React, TypeScript, Node.js"
                            className="min-h-[100px] rounded-[10px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="benefits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Benefits</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Health Insurance, Remote Work"
                            className="min-h-[100px] rounded-[10px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="responsibilities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsibilities</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Main responsibilities of this role..."
                            className="min-h-[120px] rounded-[10px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="qualifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualifications</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Required qualifications..."
                            className="min-h-[120px] rounded-[10px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-[#ECEEF2] pt-5 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-[10px] px-5"
                    onClick={() => handleFormDialogChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-11 rounded-[10px] px-5"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : formMode === "create" ? (
                      "Create Job"
                    ) : (
                      "Update Job"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <ViewJobDialog
        job={jobDetailQuery.data?.data || null}
        open={detailMode === "view"}
        onOpenChange={(open) => {
          if (!open) {
            setDetailMode(null);
            setSelectedJobId(null);
          }
        }}
      />

      <DeleteModal
        isOpen={!!jobToDelete}
        onClose={() => setJobToDelete(null)}
        onConfirm={() =>
          jobToDelete ? deleteJobMutation.mutate(jobToDelete._id) : undefined
        }
        title="Delete this job post?"
        desc={`This will permanently remove "${jobToDelete?.title ?? "this job"}" from the list.`}
      />
    </div>
  );
};

export default JobsContainer;
