"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  CalendarClock,
  Eye,
  Loader2,
  MailPlus,
  PenSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  EmailLogDetailResponse,
  EmailLogListResponse,
  EmailTemplateFormValues,
  EmailTemplateItem,
  EmailTemplateListResponse,
  EmailTemplateMutationResponse,
  SendEmailFormValues,
  SendEmailResponse,
} from "./email-automation-data-type";
import ViewEmailLogDialog from "./view-email-log-dialog";

const templateSchema = z.object({
  key: z.string().min(2, "Template key is required."),
  name: z.string().min(2, "Template name is required."),
  subject: z.string().min(2, "Subject is required."),
  htmlBody: z.string().min(10, "HTML body must be at least 10 characters."),
  description: z.string(),
  variables: z.string(),
  isActive: z.boolean(),
});

const sendEmailSchema = z.object({
  to: z.string().email("A valid recipient email is required."),
  templateKey: z.string().min(2, "Template key is required."),
  variables: z.string(),
  leadId: z.string(),
  description: z.string(),
  orderId: z.string(),
});

const defaultTemplateValues: EmailTemplateFormValues = {
  key: "",
  name: "",
  subject: "",
  htmlBody: "",
  description: "",
  variables: "",
  isActive: true,
};

const defaultSendValues: SendEmailFormValues = {
  to: "",
  templateKey: "",
  variables: "",
  leadId: "",
  description: "",
  orderId: "",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const parseVariables = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parseVariablesObject = (value: string) => {
  if (!value.trim()) return undefined;

  try {
    return JSON.parse(value) as Record<string, string>;
  } catch {
    throw new Error("Variables must be a valid JSON object.");
  }
};

const getTemplateStatusStyles = (isActive: boolean) =>
  isActive
    ? "bg-primary/10 text-primary border-primary/20"
    : "bg-[#F3F4F6] text-[#68706A] border-[#D9DEE5]";

const getLogStatusStyles = (status: string) =>
  status === "sent"
    ? "bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]"
    : "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]";

const EmailAutomationContainer = () => {
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;

  const [page, setPage] = useState(1);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [templateMode, setTemplateMode] = useState<"create" | "edit">("create");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateItem | null>(
    null
  );
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] =
    useState<EmailTemplateItem | null>(null);

  const templateForm = useForm<EmailTemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: defaultTemplateValues,
  });

  const sendForm = useForm<SendEmailFormValues>({
    resolver: zodResolver(sendEmailSchema),
    defaultValues: defaultSendValues,
  });

  const {
    data: templatesResponse,
    isLoading: templatesLoading,
    isError: templatesError,
    error: templatesQueryError,
    isFetching: templatesFetching,
  } = useQuery<EmailTemplateListResponse>({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/email-automation/templates`,
        {
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response: EmailTemplateListResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to fetch templates");
      }

      return response;
    },
    enabled: !!token,
  });

  const {
    data: logsResponse,
    isLoading: logsLoading,
    isError: logsError,
    error: logsQueryError,
    isFetching: logsFetching,
  } = useQuery<EmailLogListResponse>({
    queryKey: ["email-logs", page],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/email-automation/logs?sortBy=createdAt&sortOrder=desc&limit=10&page=${page}`,
        {
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response: EmailLogListResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to fetch email logs");
      }

      return response;
    },
    enabled: !!token,
  });

  const logDetailQuery = useQuery<EmailLogDetailResponse>({
    queryKey: ["email-log-detail", selectedLogId],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/email-automation/logs/${selectedLogId}`,
        {
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response: EmailLogDetailResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to fetch email log details");
      }

      return response;
    },
    enabled: !!token && !!selectedLogId,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (values: EmailTemplateFormValues) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/email-automation/templates`,
        {
          method: "POST",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            key: values.key.trim(),
            name: values.name.trim(),
            subject: values.subject.trim(),
            htmlBody: values.htmlBody.trim(),
            description: values.description.trim() || undefined,
            variables: parseVariables(values.variables),
            isActive: values.isActive,
          }),
        }
      );

      const response: EmailTemplateMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to create template");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Template created successfully");
      handleTemplateDialogChange(false);
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to create template"
      );
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: EmailTemplateFormValues;
    }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/email-automation/templates/${id}`,
        {
          method: "PUT",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            key: values.key.trim(),
            name: values.name.trim(),
            subject: values.subject.trim(),
            htmlBody: values.htmlBody.trim(),
            description: values.description.trim() || undefined,
            variables: parseVariables(values.variables),
            isActive: values.isActive,
          }),
        }
      );

      const response: EmailTemplateMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to update template");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Template updated successfully");
      handleTemplateDialogChange(false);
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to update template"
      );
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/email-automation/templates/${id}`,
        {
          method: "DELETE",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response: EmailTemplateMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to delete template");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Template deleted successfully");
      setTemplateToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to delete template"
      );
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (values: SendEmailFormValues) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/email-automation/send`,
        {
          method: "POST",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: values.to.trim(),
            templateKey: values.templateKey.trim(),
            variables: parseVariablesObject(values.variables),
            leadId: values.leadId.trim() || undefined,
            description: values.description.trim() || undefined,
            orderId: values.orderId.trim() || undefined,
          }),
        }
      );

      const response: SendEmailResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to send email");
      }

      if (!response.data.sent) {
        throw new Error(response.data.reason || "Email could not be sent");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Email sent successfully");
      handleSendDialogChange(false);
      queryClient.invalidateQueries({ queryKey: ["email-logs"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to send email"
      );
    },
  });

  const templates = templatesResponse?.data ?? [];
  const logs = logsResponse?.data ?? [];
  const logsMeta = logsResponse?.meta;
  const totalPages = logsMeta
    ? Math.max(1, Math.ceil(logsMeta.total / logsMeta.limit))
    : 1;
  const isTemplateSubmitting =
    createTemplateMutation.isPending || updateTemplateMutation.isPending;

  const handleTemplateDialogChange = (open: boolean) => {
    setIsTemplateOpen(open);

    if (!open) {
      setTemplateMode("create");
      setSelectedTemplate(null);
      templateForm.reset(defaultTemplateValues);
    }
  };

  const handleSendDialogChange = (open: boolean) => {
    setIsSendOpen(open);

    if (!open) {
      sendForm.reset(defaultSendValues);
    }
  };

  const handleCreateTemplate = () => {
    setTemplateMode("create");
    setSelectedTemplate(null);
    templateForm.reset(defaultTemplateValues);
    setIsTemplateOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplateItem) => {
    setTemplateMode("edit");
    setSelectedTemplate(template);
    templateForm.reset({
      key: template.key,
      name: template.name,
      subject: template.subject,
      htmlBody: template.htmlBody,
      description: template.description || "",
      variables: template.variables?.join(", ") || "",
      isActive: template.isActive,
    });
    setIsTemplateOpen(true);
  };

  const onTemplateSubmit = (values: EmailTemplateFormValues) => {
    if (templateMode === "edit" && selectedTemplate) {
      updateTemplateMutation.mutate({ id: selectedTemplate._id, values });
      return;
    }

    createTemplateMutation.mutate(values);
  };

  const onSendSubmit = (values: SendEmailFormValues) => {
    sendEmailMutation.mutate(values);
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
        <ErrorContainer message="Session expired. Please login again to manage email automation." />
      </div>
    );
  }

  if (templatesError || logsError) {
    return (
      <div className="p-6">
        <ErrorContainer
          message={
            (templatesQueryError as Error)?.message ||
            (logsQueryError as Error)?.message ||
            "Failed to load email automation data"
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          onClick={() => setIsSendOpen(true)}
          variant="outline"
          className="h-[48px] rounded-[10px] px-5 text-base font-semibold"
        >
          <MailPlus className="mr-2 h-5 w-5" />
          Send Email
        </Button>
        <Button
          onClick={handleCreateTemplate}
          className="h-[48px] rounded-[10px] bg-primary px-5 text-base font-semibold text-white hover:bg-primary/90"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Template
        </Button>
      </div>

      <div className="rounded-[16px] border border-[#E6E7E6] bg-white shadow-[0px_4px_10px_0px_#00000012]">
        <div className="flex flex-col gap-3 border-b border-[#ECEEF2] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[#343A40]">
              Email Templates
            </h3>
            <p className="pt-1 text-sm text-[#68706A]">
              Create, update, and maintain reusable automation templates for
              leads, hiring, and system notifications.
            </p>
          </div>
          {templatesFetching ? (
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing templates
            </div>
          ) : null}
        </div>

        <div className="px-6 py-6">
          {templatesLoading ? (
            <TableSkeletonWrapper height="280px" />
          ) : templates.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[14px] border border-dashed border-primary/20 bg-primary/5 px-4 text-center">
              <h4 className="pt-4 text-xl font-semibold text-[#343A40]">
                No templates found
              </h4>
              <p className="max-w-[440px] pt-2 text-sm leading-6 text-[#68706A]">
                Add your first custom template or edit the seeded automation
                templates from here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[14px] border border-[#ECEEF2]">
              <Table>
                <TableHeader className="bg-[#F8F9FA]">
                  <TableRow className="border-[#ECEEF2] hover:bg-[#F8F9FA]">
                    <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                      Template
                    </TableHead>
                    <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                      Key
                    </TableHead>
                    <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                      Variables
                    </TableHead>
                    <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                      Status
                    </TableHead>
                    <TableHead className="px-4 py-4 text-right text-sm font-semibold text-[#343A40]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow
                      key={template._id}
                      className="border-[#ECEEF2] bg-white hover:bg-primary/5"
                    >
                      <TableCell className="px-4 py-4">
                        <div className="max-w-[280px]">
                          <p className="font-semibold leading-6 text-[#343A40]">
                            {template.name}
                          </p>
                          <p className="pt-1 text-sm text-[#68706A]">
                            {template.subject}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-[#68706A]">
                        {template.key}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex max-w-[220px] flex-wrap gap-2">
                          {template.variables?.length ? (
                            template.variables.slice(0, 3).map((item) => (
                              <Badge
                                key={`${template._id}-${item}`}
                                variant="outline"
                                className="border-primary/20 bg-primary/5 px-2 py-1 text-xs text-[#343A40]"
                              >
                                {item}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-[#68706A]">No vars</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={getTemplateStatusStyles(template.isActive)}
                        >
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => handleEditTemplate(template)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F6D28B] bg-[#FFF4DB] text-[#B7791F] transition hover:bg-[#B7791F] hover:text-white"
                            aria-label={`Edit ${template.name}`}
                          >
                            <PenSquare className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTemplateToDelete(template)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
                            aria-label={`Delete ${template.name}`}
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
          )}
        </div>
      </div>

      <div className="rounded-[16px] border border-[#E6E7E6] bg-white shadow-[0px_4px_10px_0px_#00000012]">
        <div className="flex flex-col gap-3 border-b border-[#ECEEF2] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[#343A40]">Email Logs</h3>
            <p className="pt-1 text-sm text-[#68706A]">
              Review recent deliveries, inspect failures, and open rendered email
              details for support or audit work.
            </p>
          </div>
          {logsFetching ? (
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing logs
            </div>
          ) : null}
        </div>

        <div className="px-6 py-6">
          {logsLoading ? (
            <TableSkeletonWrapper height="320px" />
          ) : logs.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[14px] border border-dashed border-primary/20 bg-primary/5 px-4 text-center">
              <h4 className="pt-4 text-xl font-semibold text-[#343A40]">
                No email logs found
              </h4>
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
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Recipient
                      </TableHead>
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Subject
                      </TableHead>
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Template
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
                    {logs.map((log) => (
                      <TableRow
                        key={log._id}
                        className="border-[#ECEEF2] bg-white hover:bg-primary/5"
                      >
                        <TableCell className="px-4 py-4 text-sm text-[#343A40]">
                          {log.to}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <p className="max-w-[260px] text-sm text-[#68706A]">
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
                          <div className="flex items-center gap-2 text-sm text-[#68706A]">
                            <CalendarClock className="h-4 w-4 text-primary" />
                            {formatDate(log.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center justify-end gap-3">
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

              <div className="flex flex-col gap-3 px-1 pt-5 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-[#68706A]">
                  Showing page {logsMeta?.page ?? 1} of {totalPages}
                </p>
                <CustomPagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={isTemplateOpen} onOpenChange={handleTemplateDialogChange}>
        <DialogContent className="max-h-[90vh] max-w-[860px] overflow-y-auto rounded-[16px] border-none bg-white p-0">
          <DialogHeader className="border-b border-[#ECEEF2] px-6 py-5">
            <DialogTitle className="text-2xl font-semibold text-[#343A40]">
              {templateMode === "create" ? "Add Template" : "Update Template"}
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-6 text-[#68706A]">
              Manage reusable email templates used by automation and manual send
              flows.
            </DialogDescription>
          </DialogHeader>

          <Form {...templateForm}>
            <form
              onSubmit={templateForm.handleSubmit(onTemplateSubmit)}
              className="space-y-5 px-6 py-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={templateForm.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Key</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="lead_follow_up"
                          className="h-11 rounded-[10px]"
                          disabled={templateMode === "edit"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={templateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Lead Follow Up"
                          className="h-11 rounded-[10px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={templateForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Following up on your enquiry with {{companyName}}"
                        className="h-11 rounded-[10px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={templateForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Used for manual follow-up emails"
                          className="h-11 rounded-[10px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={templateForm.control}
                  name="variables"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variables</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="name, companyName"
                          className="h-11 rounded-[10px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={templateForm.control}
                name="htmlBody"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HTML Body</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="<p>Hello {{name}}</p>"
                        className="min-h-[220px] rounded-[10px] font-mono text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={templateForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value ? "active" : "inactive"}
                      onValueChange={(value) => field.onChange(value === "active")}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-[10px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col-reverse gap-3 border-t border-[#ECEEF2] pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-[10px] px-5"
                  onClick={() => handleTemplateDialogChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-11 rounded-[10px] px-5"
                  disabled={isTemplateSubmitting}
                >
                  {isTemplateSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : templateMode === "create" ? (
                    "Create Template"
                  ) : (
                    "Update Template"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSendOpen} onOpenChange={handleSendDialogChange}>
        <DialogContent className="max-h-[90vh] max-w-[760px] overflow-y-auto rounded-[16px] border-none bg-white p-0">
          <DialogHeader className="border-b border-[#ECEEF2] px-6 py-5">
            <DialogTitle className="text-2xl font-semibold text-[#343A40]">
              Send Manual Email
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-6 text-[#68706A]">
              Use any active template and optional variables object to send a
              one-off email from the admin panel.
            </DialogDescription>
          </DialogHeader>

          <Form {...sendForm}>
            <form
              onSubmit={sendForm.handleSubmit(onSendSubmit)}
              className="space-y-5 px-6 py-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={sendForm.control}
                  name="to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="customer@example.com"
                          className="h-11 rounded-[10px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={sendForm.control}
                  name="templateKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Key</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-[10px]">
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template._id} value={template.key}>
                              {template.key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={sendForm.control}
                  name="leadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Lead ID</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Optional lead id"
                          className="h-11 rounded-[10px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={sendForm.control}
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order ID</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Optional order id"
                          className="h-11 rounded-[10px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={sendForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Optional extra description"
                        className="h-11 rounded-[10px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={sendForm.control}
                name="variables"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variables JSON</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder='{"name":"John Smith","companyName":"Billaziz"}'
                        className="min-h-[180px] rounded-[10px] font-mono text-sm"
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
                  onClick={() => handleSendDialogChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-11 rounded-[10px] px-5"
                  disabled={sendEmailMutation.isPending}
                >
                  {sendEmailMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Email"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ViewEmailLogDialog
        log={logDetailQuery.data?.data || null}
        open={!!selectedLogId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLogId(null);
          }
        }}
      />

      <DeleteModal
        isOpen={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={() =>
          templateToDelete
            ? deleteTemplateMutation.mutate(templateToDelete._id)
            : undefined
        }
        title="Delete this template?"
        desc={`This will permanently remove "${templateToDelete?.name ?? "this template"}".`}
      />
    </div>
  );
};

export default EmailAutomationContainer;
