"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  CalendarClock,
  Eye,
  FileUp,
  Loader2,
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
  KnowledgeDetailResponse,
  KnowledgeFormValues,
  KnowledgeItem,
  KnowledgeListResponse,
  KnowledgeMutationResponse,
} from "./knowledge-base-data-type";
import ViewKnowledgeDialog from "./view-knowledge-dialog";

const knowledgeCategories = [
  "Business Document",
  "SOP",
  "Service Description",
  "FAQ",
  "Pricing",
  "Policy",
  "Other",
  "Blog",
] as const;

const knowledgeStatuses = ["active", "inactive"] as const;

const normalizeKnowledgeCategory = (
  value: unknown,
): KnowledgeFormValues["category"] => {
  if (typeof value !== "string") return "Other";

  const normalizedValue = value.trim().toLowerCase();
  const exactCategory = knowledgeCategories.find(
    (category) => category.toLowerCase() === normalizedValue,
  );

  if (exactCategory) return exactCategory;

  const categoryAliases: Record<string, KnowledgeFormValues["category"]> = {
    "business documents": "Business Document",
    "service descriptions": "Service Description",
    "standard operating procedure": "SOP",
    "standard operating procedures": "SOP",
    faqs: "FAQ",
    blogs: "Blog",
    policies: "Policy",
  };

  return categoryAliases[normalizedValue] || "Other";
};

const knowledgeSchema = z.object({
  title: z.string(),
  category: z.enum(knowledgeCategories),
  content: z.string(),
  tags: z.string(),
  status: z.enum(knowledgeStatuses),
});

const defaultValues: KnowledgeFormValues = {
  title: "",
  category: "Other",
  content: "",
  tags: "",
  status: "active",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const getStatusStyles = (status: string) =>
  status === "active"
    ? "bg-primary/10 text-primary border-primary/20"
    : "bg-[#F3F4F6] text-[#68706A] border-[#D9DEE5]";

const buildKnowledgeFormData = (
  values: KnowledgeFormValues,
  file: File | null,
  isEdit: boolean
) => {
  const formData = new FormData();

  if (values.title.trim()) formData.append("title", values.title.trim());
  formData.append("category", values.category);
  if (values.content.trim()) formData.append("content", values.content.trim());
  if (values.tags.trim()) formData.append("tags", values.tags.trim());
  if (isEdit) formData.append("status", values.status);
  if (file) formData.append("file", file);

  return formData;
};

const KnowledgeBaseContainer = () => {
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [detailMode, setDetailMode] = useState<"view" | "edit" | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<KnowledgeItem | null>(
    null
  );

  const form = useForm<KnowledgeFormValues>({
    resolver: zodResolver(knowledgeSchema),
    defaultValues,
  });

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<KnowledgeListResponse>({
    queryKey: ["knowledge-documents", page],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/knowledge-base?sortBy=createdAt&sortOrder=desc&limit=10&page=${page}`,
        {
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response: KnowledgeListResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to fetch documents");
      }

      return response;
    },
    enabled: !!token,
  });

  const detailQuery = useQuery<KnowledgeDetailResponse>({
    queryKey: ["knowledge-document-detail", selectedDocumentId],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/knowledge-base/${selectedDocumentId}`,
        {
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response: KnowledgeDetailResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to fetch document details");
      }

      return response;
    },
    enabled: !!token && !!selectedDocumentId,
  });

  useEffect(() => {
    if (detailMode !== "edit" || !detailQuery.data?.data) return;

    const document = detailQuery.data.data;
    form.reset({
      title: document.title || "",
      category: normalizeKnowledgeCategory(document.category),
      content: document.content || "",
      tags: document.tags?.join(", ") || "",
      status: (document.status as KnowledgeFormValues["status"]) || "active",
    });
  }, [detailMode, detailQuery.data, form]);

  const createMutation = useMutation({
    mutationFn: async (values: KnowledgeFormValues) => {
      if (!selectedFile && !values.content.trim()) {
        throw new Error("Please provide a file or manual content.");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/knowledge-base`, {
        method: "POST",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
        body: buildKnowledgeFormData(values, selectedFile, false),
      });

      const response: KnowledgeMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to create document");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Document created successfully");
      handleDialogChange(false);
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to create document"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: KnowledgeFormValues;
    }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/knowledge-base/${id}`,
        {
          method: "PUT",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
          body: buildKnowledgeFormData(values, selectedFile, true),
        }
      );

      const response: KnowledgeMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to update document");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Document updated successfully");
      handleDialogChange(false);
      queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-document-detail"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to update document"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/knowledge-base/${id}`,
        {
          method: "DELETE",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response: KnowledgeMutationResponse = await res.json();

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to delete document");
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Document deleted successfully");
      setDocumentToDelete(null);

      const totalItemsAfterDelete = (data?.meta.total || 1) - 1;
      const totalPagesAfterDelete = Math.max(
        1,
        Math.ceil(totalItemsAfterDelete / (data?.meta.limit || 10))
      );

      if (page > totalPagesAfterDelete) {
        setPage(totalPagesAfterDelete);
      }

      queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to delete document"
      );
    },
  });

  const documents = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const resetFileState = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsFormOpen(open);

    if (!open) {
      setFormMode("create");
      setDetailMode(null);
      setSelectedDocumentId(null);
      form.reset(defaultValues);
      resetFileState();
    }
  };

  const handleCreate = () => {
    setFormMode("create");
    setSelectedDocumentId(null);
    setDetailMode(null);
    form.reset(defaultValues);
    resetFileState();
    setIsFormOpen(true);
  };

  const handleEdit = (document: KnowledgeItem) => {
    setFormMode("edit");
    setSelectedDocumentId(document._id);
    setDetailMode("edit");
    form.reset({
      title: document.title || "",
      category: normalizeKnowledgeCategory(document.category),
      content: document.content || "",
      tags: document.tags?.join(", ") || "",
      status:
        document.status === "inactive" || document.status === "active"
          ? document.status
          : "active",
    });
    resetFileState();
    setIsFormOpen(true);
  };

  const handleView = (document: KnowledgeItem) => {
    setSelectedDocumentId(document._id);
    setDetailMode("view");
  };

  const onSubmit = (values: KnowledgeFormValues) => {
    if (formMode === "edit" && selectedDocumentId) {
      updateMutation.mutate({ id: selectedDocumentId, values });
      return;
    }

    createMutation.mutate(values);
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
        <ErrorContainer message="Session expired. Please login again to manage the knowledge base." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorContainer
          message={(error as Error)?.message || "Failed to load documents"}
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
          Add Document
        </Button>
      </div>

      <div className="rounded-[16px] border border-[#E6E7E6] bg-white shadow-[0px_4px_10px_0px_#00000012]">
        <div className="flex flex-col gap-3 border-b border-[#ECEEF2] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[#343A40]">
              Knowledge Documents
            </h3>
            <p className="pt-1 text-sm text-[#68706A]">
              Upload source files, maintain knowledge content, inspect extracted
              text, and manage AI-ready document chunks.
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
          ) : documents.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[14px] border border-dashed border-primary/20 bg-primary/5 px-4 text-center">
              <h4 className="pt-4 text-xl font-semibold text-[#343A40]">
                No documents found
              </h4>
              <p className="max-w-[440px] pt-2 text-sm leading-6 text-[#68706A]">
                Upload files or add manual text to build the internal knowledge
                base used by your AI workflows.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-[14px] border border-[#ECEEF2]">
                <Table>
                  <TableHeader className="bg-[#F8F9FA]">
                    <TableRow className="border-[#ECEEF2] hover:bg-[#F8F9FA]">
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Document
                      </TableHead>
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Category
                      </TableHead>
                      <TableHead className="px-4 py-4 text-sm font-semibold text-[#343A40]">
                        Source
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
                    {documents.map((document) => (
                      <TableRow
                        key={document._id}
                        className="border-[#ECEEF2] bg-white hover:bg-primary/5"
                      >
                        <TableCell className="px-4 py-4">
                          <div className="max-w-[260px]">
                            <p className="font-semibold leading-6 text-[#343A40]">
                              {document.title}
                            </p>
                            <p className="pt-1 text-sm text-[#68706A]">
                              {document.chunkCount} chunks
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-sm text-[#68706A]">
                          {document.category}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="max-w-[220px] text-sm text-[#68706A]">
                            <p>{document.originalFileName || "Manual entry"}</p>
                            <p className="pt-1">
                              {document.isTextExtracted
                                ? "Auto extracted"
                                : "Manual text"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={getStatusStyles(document.status)}
                          >
                            {document.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-2 text-sm text-[#68706A]">
                            <CalendarClock className="h-4 w-4 text-primary" />
                            {formatDate(document.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => handleView(document)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition hover:bg-primary hover:text-white"
                              aria-label={`View ${document.title}`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(document)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F6D28B] bg-[#FFF4DB] text-[#B7791F] transition hover:bg-[#B7791F] hover:text-white"
                              aria-label={`Edit ${document.title}`}
                            >
                              <PenSquare className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDocumentToDelete(document)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
                              aria-label={`Delete ${document.title}`}
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
                  itemLabel="documents"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-h-[90vh] max-w-[860px] overflow-y-auto rounded-[16px] border-none bg-white p-0">
          <DialogHeader className="border-b border-[#ECEEF2] px-6 py-5">
            <DialogTitle className="text-2xl font-semibold text-[#343A40]">
              {formMode === "create" ? "Add Document" : "Update Document"}
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-6 text-[#68706A]">
              Upload a file or enter manual content. The backend handles text
              extraction and chunk generation automatically.
            </DialogDescription>
          </DialogHeader>

          {formMode === "edit" && detailQuery.isLoading ? (
            <div className="px-6 py-8">
              <TableSkeletonWrapper height="260px" />
            </div>
          ) : formMode === "edit" && detailQuery.isError ? (
            <div className="px-6 py-8">
              <ErrorContainer
                message={
                  (detailQuery.error as Error)?.message ||
                  "Failed to load document details"
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
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Boiler Installation Pricing 2026"
                            className="h-11 rounded-[10px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          value={field.value || "Other"}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-[10px] bg-white">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white">
                            {knowledgeCategories.map((item) => (
                              <SelectItem
                                key={item}
                                value={item}
                                className="cursor-pointer"
                              >
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3 rounded-[14px] border border-dashed border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#343A40]">
                    <FileUp className="h-4 w-4 text-primary" />
                    Upload source file
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.csv,.jpg,.jpeg,.png,.webp,.bmp,.tiff"
                    className="cursor-pointer rounded-[10px] bg-white"
                    onChange={(event) =>
                      setSelectedFile(event.target.files?.[0] || null)
                    }
                  />
                  <p className="text-xs leading-6 text-[#68706A]">
                    Supported: PDF, DOC, DOCX, TXT, CSV, JPG, PNG, WEBP, BMP,
                    TIFF. Optional when using manual content only.
                  </p>
                  {selectedFile ? (
                    <p className="text-sm font-medium text-primary">
                      Selected file: {selectedFile.name}
                    </p>
                  ) : null}
                </div>

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manual Content</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Optional manual content to merge with extracted text..."
                          className="min-h-[180px] rounded-[10px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="pricing, boiler, 2026"
                            className="h-11 rounded-[10px]"
                          />
                        </FormControl>
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
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-[10px]">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {knowledgeStatuses.map((item) => (
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
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-[#ECEEF2] pt-5 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-[10px] px-5"
                    onClick={() => handleDialogChange(false)}
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
                      "Create Document"
                    ) : (
                      "Update Document"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <ViewKnowledgeDialog
        document={detailQuery.data?.data || null}
        open={detailMode === "view"}
        onOpenChange={(open) => {
          if (!open) {
            setDetailMode(null);
            setSelectedDocumentId(null);
          }
        }}
      />

      <DeleteModal
        isOpen={!!documentToDelete}
        onClose={() => setDocumentToDelete(null)}
        onConfirm={() =>
          documentToDelete
            ? deleteMutation.mutate(documentToDelete._id)
            : undefined
        }
        title="Delete this document?"
        desc={`This will permanently remove "${documentToDelete?.title ?? "this document"}" from the knowledge base.`}
      />
    </div>
  );
};

export default KnowledgeBaseContainer;
